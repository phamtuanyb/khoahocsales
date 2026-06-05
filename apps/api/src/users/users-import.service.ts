import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';

export interface ImportRowResult {
  row: number;
  email: string;
  reason?: string;
}

export interface ImportResult {
  totalRows: number;
  createdCount: number;
  skippedCount: number;
  failedCount: number;
  created: ImportRowResult[];
  skipped: ImportRowResult[];
  failed: ImportRowResult[];
}

const REQUIRED_HEADERS = ['email', 'name'];
const VALID_ROLES = ['LEARNER', 'MANAGER', 'ADMIN'] as const;
const DEFAULT_PASSWORD = 'Mkt@12345';

@Injectable()
export class UsersImportService {
  constructor(private readonly prisma: PrismaService) {}

  // Tạo file Excel template — admin tải về, điền danh sách, upload ngược lên.
  async generateTemplate(): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'MKT Academy';

    const ws = wb.addWorksheet('Users');
    ws.columns = [
      { header: 'email', key: 'email', width: 32 },
      { header: 'name', key: 'name', width: 28 },
      { header: 'password', key: 'password', width: 18 },
      { header: 'role', key: 'role', width: 12 },
      { header: 'departmentName', key: 'departmentName', width: 22 },
    ];

    // Style header
    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1565C0' },
    };
    header.alignment = { vertical: 'middle' };
    header.height = 24;
    ws.views = [{ state: 'frozen', ySplit: 1 }];

    // Ví dụ mẫu
    ws.addRow({
      email: 'nv1@mkt.local',
      name: 'Nguyễn Văn A',
      password: 'Mkt@12345',
      role: 'LEARNER',
      departmentName: 'Sales',
    });
    ws.addRow({
      email: 'nv2@mkt.local',
      name: 'Trần Thị B',
      password: '',
      role: 'LEARNER',
      departmentName: 'Sales',
    });
    ws.addRow({
      email: 'manager.cskh@mkt.local',
      name: 'Trưởng phòng CSKH',
      password: '',
      role: 'MANAGER',
      departmentName: 'CSKH',
    });

    // Data validation dropdown cho role — cast vì ExcelJS type def không expose dataValidations.
    const wsAny = ws as unknown as {
      dataValidations?: { add: (range: string, options: unknown) => void };
    };
    if (wsAny.dataValidations) {
      wsAny.dataValidations.add('D2:D1000', {
        type: 'list',
        allowBlank: false,
        formulae: ['"LEARNER,MANAGER,ADMIN"'],
        showErrorMessage: true,
        errorTitle: 'Role không hợp lệ',
        error: 'Chọn 1 trong: LEARNER / MANAGER / ADMIN',
      });
    }

    // Sheet hướng dẫn
    const help = wb.addWorksheet('HƯỚNG DẪN');
    help.columns = [{ width: 80 }];
    help.addRows([
      ['📋 HƯỚNG DẪN NHẬP DANH SÁCH NGƯỜI DÙNG'],
      [''],
      ['1. Mỗi dòng = 1 người dùng. Dòng 1 là header (không xóa, không đổi tên cột).'],
      ['2. Cột BẮT BUỘC: email, name.'],
      ['3. Cột TÙY CHỌN:'],
      ['   • password: để trống = mặc định "Mkt@12345"'],
      ['   • role: để trống = mặc định "LEARNER". Chọn LEARNER / MANAGER / ADMIN.'],
      ['   • departmentName: tên phòng ban đã tồn tại (VD "Sales", "CSKH"). Để trống = không gán phòng.'],
      [''],
      ['4. Email phải duy nhất. Trùng → bỏ qua (không ghi đè).'],
      ['5. Lưu file ở định dạng .xlsx rồi upload qua trang Admin → Người dùng → "Nhập từ Excel".'],
      [''],
      ['❗ Sau khi nhập, thông báo cho từng người dùng email + password mặc định để họ đăng nhập đổi password.'],
    ]);
    help.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFFF8C00' } };

    const buf = await wb.xlsx.writeBuffer();
    // ExcelJS trả ArrayBuffer/Buffer<ArrayBufferLike> — cast về Buffer chuẩn cho NestJS.
    return Buffer.from(buf as unknown as ArrayBuffer);
  }

  // Parse file Excel + tạo user — idempotent (email trùng → skip).
  async parseAndImport(buffer: Buffer): Promise<ImportResult> {
    const wb = new ExcelJS.Workbook();
    try {
      // ExcelJS expect ArrayBuffer — convert từ Node Buffer.
      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ) as ArrayBuffer;
      await wb.xlsx.load(arrayBuffer);
    } catch {
      throw new BadRequestException('File Excel không đọc được — có thể bị hỏng hoặc sai định dạng');
    }
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException('File Excel không có sheet nào');

    // Parse header row
    const headerMap: Record<string, number> = {};
    const headerRow = ws.getRow(1);
    headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
      const key = String(cell.value ?? '').toLowerCase().trim();
      if (key) headerMap[key] = col;
    });

    for (const req of REQUIRED_HEADERS) {
      if (!headerMap[req]) {
        throw new BadRequestException(
          `Thiếu cột bắt buộc "${req}". Header phải có: ${REQUIRED_HEADERS.join(', ')}`,
        );
      }
    }

    const created: ImportRowResult[] = [];
    const skipped: ImportRowResult[] = [];
    const failed: ImportRowResult[] = [];

    // Cache departments để tránh query DB nhiều lần.
    const depts = await this.prisma.department.findMany();
    const deptByName = new Map(depts.map((d) => [d.name.toLowerCase(), d]));

    const totalDataRows = ws.actualRowCount - 1;
    // Lặp qua row 2 → cuối.
    for (let r = 2; r <= ws.actualRowCount; r++) {
      const row = ws.getRow(r);
      const email = this.cellString(row.getCell(headerMap.email!)).toLowerCase();
      const name = this.cellString(row.getCell(headerMap.name!));

      // Bỏ qua dòng hoàn toàn trống.
      if (!email && !name) continue;

      const password = headerMap.password
        ? this.cellString(row.getCell(headerMap.password)) || DEFAULT_PASSWORD
        : DEFAULT_PASSWORD;
      const roleRaw = headerMap.role
        ? this.cellString(row.getCell(headerMap.role)).toUpperCase()
        : 'LEARNER';
      const departmentName = headerMap.departmentName
        ? this.cellString(row.getCell(headerMap.departmentName))
        : '';

      // ---- Validate ----
      if (!email) {
        failed.push({ row: r, email, reason: 'Thiếu email' });
        continue;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        failed.push({ row: r, email, reason: 'Email sai định dạng' });
        continue;
      }
      if (!name || name.length < 2) {
        failed.push({ row: r, email, reason: 'Thiếu tên hoặc tên < 2 ký tự' });
        continue;
      }
      const role: UserRole = (VALID_ROLES as readonly string[]).includes(roleRaw)
        ? (roleRaw as UserRole)
        : UserRole.LEARNER;
      if (password.length < 8) {
        failed.push({ row: r, email, reason: 'Mật khẩu phải ≥ 8 ký tự' });
        continue;
      }

      // Resolve department theo tên (case-insensitive).
      let departmentId: string | null = null;
      if (departmentName) {
        const dept = deptByName.get(departmentName.toLowerCase());
        if (!dept) {
          failed.push({
            row: r,
            email,
            reason: `Phòng ban "${departmentName}" không tồn tại — tạo trước trong Admin → Phòng ban`,
          });
          continue;
        }
        departmentId = dept.id;
      }

      // Check trùng email.
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) {
        skipped.push({ row: r, email, reason: 'Email đã tồn tại — bỏ qua' });
        continue;
      }

      // Insert.
      try {
        const passwordHash = await bcrypt.hash(password, 10);
        await this.prisma.user.create({
          data: {
            email,
            name,
            passwordHash,
            role,
            departmentId,
            profile: { create: { exp: 0, streakCount: 0 } },
          },
        });
        created.push({ row: r, email });
      } catch (err) {
        failed.push({
          row: r,
          email,
          reason: err instanceof Error ? err.message : 'Lỗi không xác định',
        });
      }
    }

    return {
      totalRows: totalDataRows,
      createdCount: created.length,
      skippedCount: skipped.length,
      failedCount: failed.length,
      created,
      skipped,
      failed,
    };
  }

  private cellString(cell: ExcelJS.Cell): string {
    const v = cell.value;
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v.trim();
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    // Cell type formula / richText / object
    const obj = v as { result?: unknown; text?: unknown };
    if (obj.result !== undefined) return String(obj.result).trim();
    if (obj.text !== undefined) return String(obj.text).trim();
    return String(v).trim();
  }
}
