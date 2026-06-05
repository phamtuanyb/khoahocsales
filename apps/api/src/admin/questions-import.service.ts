import { BadRequestException, Injectable } from '@nestjs/common';
import { QuestionDifficulty, QuestionType } from '@prisma/client';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';

export interface ImportRowResult {
  sheet: string;
  row: number;
  content: string; // preview
  reason?: string;
}

export interface QuestionsImportResult {
  totalRows: number;
  createdCount: number;
  failedCount: number;
  created: ImportRowResult[];
  failed: ImportRowResult[];
}

const SHEET_NAMES = {
  MULTIPLE_CHOICE: 'TRẮC NGHIỆM',
  SITUATION: 'TÌNH HUỐNG',
  MINI_GAME: 'MINI GAME',
  BOSS_BATTLE: 'BOSS BATTLE',
} as const;

const VALID_DIFFICULTY = ['EASY', 'MEDIUM', 'HARD'] as const;

@Injectable()
export class QuestionsImportService {
  constructor(private readonly prisma: PrismaService) {}

  // ============ TEMPLATE ============
  async generateTemplate(): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'MKT Academy';

    // ----- Sheet HƯỚNG DẪN -----
    const help = wb.addWorksheet('HƯỚNG DẪN');
    help.columns = [{ width: 90 }];
    help.addRows([
      ['📋 HƯỚNG DẪN NHẬP NGÂN HÀNG CÂU HỎI'],
      [''],
      ['File này có 4 sheet — mỗi sheet 1 dạng câu hỏi. Chỉ điền sheet nào bạn cần.'],
      [''],
      ['🔘 TRẮC NGHIỆM — cột:'],
      ['   • content: nội dung câu hỏi (bắt buộc)'],
      ['   • optionA, optionB, optionC, optionD: 4 đáp án (tối thiểu 2 cái có nội dung)'],
      ['   • correctKey: ký tự đáp án đúng — A/B/C/D'],
      ['   • difficulty: EASY / MEDIUM / HARD (mặc định MEDIUM)'],
      ['   • moduleTitle: tên mô-đun chính xác (VD "M1 — Quy trình Sales"). Để trống = không gán mô-đun.'],
      [''],
      ['📝 TÌNH HUỐNG — cột (AI sẽ chấm theo keyword):'],
      ['   • content: tình huống thực tế'],
      ['   • keywords: từ khóa SOP cần xuất hiện, phân cách bởi DẤU PHẨY'],
      ['   • minScore: % keyword cần match để đỗ (mặc định 50)'],
      ['   • rubric: gợi ý cho AI (VD "Đánh giá theo LAARC") — tùy chọn'],
      ['   • difficulty, moduleTitle: như trên'],
      [''],
      ['🧩 MINI GAME (kéo-thả) — cột:'],
      ['   • content: yêu cầu (VD "Sắp xếp đúng thứ tự 5 bước...")'],
      ['   • items: JSON array — VD: [{"id":"step-1","text":"Tiếp nhận lead"},{"id":"step-2","text":"..."}]'],
      ['   • correctOrder: danh sách id theo thứ tự ĐÚNG, phân cách bởi dấu phẩy'],
      ['   • difficulty, moduleTitle: như trên'],
      [''],
      ['⚔️ BOSS BATTLE — cấu trúc giống TÌNH HUỐNG, nhưng câu khó hơn dành cho thi cuối Level.'],
      [''],
      ['🔥 LƯU Ý:'],
      ['   1. Lưu file định dạng .xlsx rồi upload qua trang Admin → Ngân hàng câu hỏi → "Nhập từ Excel".'],
      ['   2. Hệ thống parse từng sheet độc lập, mỗi dòng = 1 câu hỏi.'],
      ['   3. moduleTitle phải khớp CHÍNH XÁC tên mô-đun đã tồn tại. Sai chính tả → row đó fail.'],
      ['   4. Mỗi câu hỏi tạo mới — KHÔNG check trùng nội dung (admin có thể tạo nhiều câu tương tự).'],
    ]);
    help.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFFF8C00' } };

    // ----- Sheet TRẮC NGHIỆM -----
    const mc = wb.addWorksheet(SHEET_NAMES.MULTIPLE_CHOICE);
    mc.columns = [
      { header: 'content', key: 'content', width: 60 },
      { header: 'optionA', key: 'optionA', width: 30 },
      { header: 'optionB', key: 'optionB', width: 30 },
      { header: 'optionC', key: 'optionC', width: 30 },
      { header: 'optionD', key: 'optionD', width: 30 },
      { header: 'correctKey', key: 'correctKey', width: 12 },
      { header: 'difficulty', key: 'difficulty', width: 12 },
      { header: 'moduleTitle', key: 'moduleTitle', width: 32 },
    ];
    styleHeader(mc);
    mc.addRow({
      content: 'Khách báo lỗi đăng nhập Facebook — bước xử lý đầu tiên đúng nhất là gì?',
      optionA: 'Yêu cầu khách đổi mật khẩu Facebook ngay.',
      optionB: 'Trấn an khách, xác nhận lại hiện tượng lỗi.',
      optionC: 'Báo khách chờ bản cập nhật.',
      optionD: 'Chuyển ngay sang bộ phận kỹ thuật.',
      correctKey: 'B',
      difficulty: 'EASY',
      moduleTitle: 'M1 — Quy trình Sales',
    });
    addValidation(mc, 'F2:F1000', '"A,B,C,D"', 'correctKey'); // correctKey column F
    addValidation(mc, 'G2:G1000', '"EASY,MEDIUM,HARD"', 'difficulty');

    // ----- Sheet TÌNH HUỐNG -----
    const sit = wb.addWorksheet(SHEET_NAMES.SITUATION);
    sit.columns = [
      { header: 'content', key: 'content', width: 60 },
      { header: 'keywords', key: 'keywords', width: 40 },
      { header: 'minScore', key: 'minScore', width: 10 },
      { header: 'rubric', key: 'rubric', width: 40 },
      { header: 'difficulty', key: 'difficulty', width: 12 },
      { header: 'moduleTitle', key: 'moduleTitle', width: 32 },
    ];
    styleHeader(sit);
    sit.addRow({
      content: 'Khách đang nóng giận vì phần mềm lỗi giữa chiến dịch. Bạn phản hồi thế nào?',
      keywords: 'lắng nghe, xin lỗi, cam kết, compensation, escalate',
      minScore: 50,
      rubric: 'Áp dụng LAARC, không đổ lỗi',
      difficulty: 'MEDIUM',
      moduleTitle: 'M4 — Xử lý từ chối',
    });
    addValidation(sit, 'E2:E1000', '"EASY,MEDIUM,HARD"', 'difficulty');

    // ----- Sheet MINI GAME -----
    const mg = wb.addWorksheet(SHEET_NAMES.MINI_GAME);
    mg.columns = [
      { header: 'content', key: 'content', width: 60 },
      { header: 'items', key: 'items', width: 60 },
      { header: 'correctOrder', key: 'correctOrder', width: 40 },
      { header: 'difficulty', key: 'difficulty', width: 12 },
      { header: 'moduleTitle', key: 'moduleTitle', width: 32 },
    ];
    styleHeader(mg);
    mg.addRow({
      content: 'Sắp xếp đúng thứ tự 5 bước trong quy trình Sales MKT.',
      items:
        '[{"id":"step-1","text":"Tiếp nhận lead"},{"id":"step-2","text":"Liên hệ 5 phút"},{"id":"step-3","text":"Khai thác BANT"},{"id":"step-4","text":"Demo"},{"id":"step-5","text":"Chốt"}]',
      correctOrder: 'step-1, step-2, step-3, step-4, step-5',
      difficulty: 'MEDIUM',
      moduleTitle: 'M1 — Quy trình Sales',
    });
    addValidation(mg, 'D2:D1000', '"EASY,MEDIUM,HARD"', 'difficulty');

    // ----- Sheet BOSS BATTLE — giống TÌNH HUỐNG -----
    const bb = wb.addWorksheet(SHEET_NAMES.BOSS_BATTLE);
    bb.columns = [
      { header: 'content', key: 'content', width: 60 },
      { header: 'keywords', key: 'keywords', width: 40 },
      { header: 'minScore', key: 'minScore', width: 10 },
      { header: 'rubric', key: 'rubric', width: 40 },
      { header: 'difficulty', key: 'difficulty', width: 12 },
      { header: 'moduleTitle', key: 'moduleTitle', width: 32 },
    ];
    styleHeader(bb);
    bb.addRow({
      content:
        'Khách dùng phần mềm đối thủ 6 tháng, chê giá MKT cao hơn 30%, yêu cầu demo 15 phút. Viết kịch bản phản hồi đầy đủ.',
      keywords:
        'cảm ơn, lý do, pain, demo, ROI, giá trị, next step',
      minScore: 60,
      rubric: 'Áp dụng F-B-V, không hạ giá tùy tiện',
      difficulty: 'HARD',
      moduleTitle: 'M5 — Demo sản phẩm',
    });
    addValidation(bb, 'E2:E1000', '"EASY,MEDIUM,HARD"', 'difficulty');

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf as unknown as ArrayBuffer);
  }

  // ============ IMPORT ============
  async parseAndImport(buffer: Buffer): Promise<QuestionsImportResult> {
    const wb = new ExcelJS.Workbook();
    try {
      const ab = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ) as ArrayBuffer;
      await wb.xlsx.load(ab);
    } catch {
      throw new BadRequestException('File Excel không đọc được — kiểm tra lại định dạng .xlsx');
    }

    // Cache modules để match theo title (case-insensitive).
    const modules = await this.prisma.module.findMany({
      include: { course: { select: { title: true } } },
    });
    const moduleByTitle = new Map(modules.map((m) => [m.title.trim().toLowerCase(), m]));

    const created: ImportRowResult[] = [];
    const failed: ImportRowResult[] = [];

    // Mỗi sheet xử lý độc lập. Sheet thiếu → bỏ qua.
    const sheetTC = wb.getWorksheet(SHEET_NAMES.MULTIPLE_CHOICE);
    if (sheetTC) await this.processMcSheet(sheetTC, moduleByTitle, created, failed);

    const sheetSit = wb.getWorksheet(SHEET_NAMES.SITUATION);
    if (sheetSit)
      await this.processSituationSheet(sheetSit, 'SITUATION', moduleByTitle, created, failed);

    const sheetMG = wb.getWorksheet(SHEET_NAMES.MINI_GAME);
    if (sheetMG) await this.processMinigameSheet(sheetMG, moduleByTitle, created, failed);

    const sheetBB = wb.getWorksheet(SHEET_NAMES.BOSS_BATTLE);
    if (sheetBB)
      await this.processSituationSheet(sheetBB, 'BOSS_BATTLE', moduleByTitle, created, failed);

    const totalRows = created.length + failed.length;
    return {
      totalRows,
      createdCount: created.length,
      failedCount: failed.length,
      created,
      failed,
    };
  }

  // ---------- helpers ----------

  private async processMcSheet(
    ws: ExcelJS.Worksheet,
    moduleByTitle: Map<string, { id: string; title: string }>,
    created: ImportRowResult[],
    failed: ImportRowResult[],
  ): Promise<void> {
    const headers = this.readHeaders(ws);
    const required = ['content', 'optionA', 'optionB', 'correctKey'];
    for (const r of required) {
      if (!headers[r]) {
        failed.push({ sheet: SHEET_NAMES.MULTIPLE_CHOICE, row: 1, content: '', reason: `Sheet thiếu cột "${r}"` });
        return;
      }
    }

    for (let i = 2; i <= ws.actualRowCount; i++) {
      const row = ws.getRow(i);
      const content = this.cell(row, headers.content);
      if (!content) continue;

      try {
        const opts: Array<{ key: string; text: string }> = [];
        for (const k of ['A', 'B', 'C', 'D']) {
          const text = this.cell(row, headers[`option${k}`]);
          if (text) opts.push({ key: k, text });
        }
        if (opts.length < 2) {
          failed.push({ sheet: SHEET_NAMES.MULTIPLE_CHOICE, row: i, content, reason: 'Cần tối thiểu 2 đáp án' });
          continue;
        }
        const correctKey = this.cell(row, headers.correctKey).toUpperCase();
        if (!opts.some((o) => o.key === correctKey)) {
          failed.push({
            sheet: SHEET_NAMES.MULTIPLE_CHOICE,
            row: i,
            content,
            reason: `correctKey "${correctKey}" không khớp option nào`,
          });
          continue;
        }
        const difficulty = this.parseDifficulty(this.cell(row, headers.difficulty));
        const moduleId = this.resolveModuleId(this.cell(row, headers.moduleTitle), moduleByTitle);
        if (moduleId === false) {
          failed.push({
            sheet: SHEET_NAMES.MULTIPLE_CHOICE,
            row: i,
            content,
            reason: `Mô-đun "${this.cell(row, headers.moduleTitle)}" không tồn tại`,
          });
          continue;
        }

        await this.prisma.question.create({
          data: {
            type: QuestionType.MULTIPLE_CHOICE,
            content,
            options: opts,
            answer: { correct: correctKey },
            difficulty,
            moduleId,
          },
        });
        created.push({ sheet: SHEET_NAMES.MULTIPLE_CHOICE, row: i, content });
      } catch (err) {
        failed.push({
          sheet: SHEET_NAMES.MULTIPLE_CHOICE,
          row: i,
          content,
          reason: err instanceof Error ? err.message : 'Lỗi',
        });
      }
    }
  }

  private async processSituationSheet(
    ws: ExcelJS.Worksheet,
    type: 'SITUATION' | 'BOSS_BATTLE',
    moduleByTitle: Map<string, { id: string; title: string }>,
    created: ImportRowResult[],
    failed: ImportRowResult[],
  ): Promise<void> {
    const sheetName = type === QuestionType.SITUATION ? SHEET_NAMES.SITUATION : SHEET_NAMES.BOSS_BATTLE;
    const headers = this.readHeaders(ws);
    if (!headers.content) {
      failed.push({ sheet: sheetName, row: 1, content: '', reason: 'Sheet thiếu cột "content"' });
      return;
    }

    for (let i = 2; i <= ws.actualRowCount; i++) {
      const row = ws.getRow(i);
      const content = this.cell(row, headers.content);
      if (!content) continue;

      try {
        const keywords = this.cell(row, headers.keywords)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const minScore = Number(this.cell(row, headers.minScore)) || 50;
        const rubric = this.cell(row, headers.rubric);
        const difficulty = this.parseDifficulty(this.cell(row, headers.difficulty));
        const moduleId = this.resolveModuleId(this.cell(row, headers.moduleTitle), moduleByTitle);
        if (moduleId === false) {
          failed.push({
            sheet: sheetName,
            row: i,
            content,
            reason: `Mô-đun "${this.cell(row, headers.moduleTitle)}" không tồn tại`,
          });
          continue;
        }

        await this.prisma.question.create({
          data: {
            type,
            content,
            options: null as never,
            answer: {
              keywords,
              minScore,
              ...(rubric ? { rubric } : {}),
            },
            difficulty,
            moduleId,
          },
        });
        created.push({ sheet: sheetName, row: i, content });
      } catch (err) {
        failed.push({
          sheet: sheetName,
          row: i,
          content,
          reason: err instanceof Error ? err.message : 'Lỗi',
        });
      }
    }
  }

  private async processMinigameSheet(
    ws: ExcelJS.Worksheet,
    moduleByTitle: Map<string, { id: string; title: string }>,
    created: ImportRowResult[],
    failed: ImportRowResult[],
  ): Promise<void> {
    const sheetName = SHEET_NAMES.MINI_GAME;
    const headers = this.readHeaders(ws);
    const required = ['content', 'items', 'correctOrder'];
    for (const r of required) {
      if (!headers[r]) {
        failed.push({ sheet: sheetName, row: 1, content: '', reason: `Sheet thiếu cột "${r}"` });
        return;
      }
    }

    for (let i = 2; i <= ws.actualRowCount; i++) {
      const row = ws.getRow(i);
      const content = this.cell(row, headers.content);
      if (!content) continue;

      try {
        const itemsRaw = this.cell(row, headers.items);
        let items: Array<{ id: string; text: string }>;
        try {
          items = JSON.parse(itemsRaw) as Array<{ id: string; text: string }>;
        } catch {
          failed.push({ sheet: sheetName, row: i, content, reason: 'Cột "items" không phải JSON array hợp lệ' });
          continue;
        }
        if (!Array.isArray(items) || items.length < 2) {
          failed.push({ sheet: sheetName, row: i, content, reason: 'items cần >= 2 phần tử' });
          continue;
        }
        for (const it of items) {
          if (!it.id || !it.text) {
            failed.push({ sheet: sheetName, row: i, content, reason: 'Mỗi item cần có {id, text}' });
            continue;
          }
        }
        const correctOrder = this.cell(row, headers.correctOrder)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const itemIds = new Set(items.map((it) => it.id));
        const orderIds = new Set(correctOrder);
        if (itemIds.size !== orderIds.size || correctOrder.some((id) => !itemIds.has(id))) {
          failed.push({
            sheet: sheetName,
            row: i,
            content,
            reason: 'correctOrder phải chứa đúng toàn bộ id trong items',
          });
          continue;
        }
        const difficulty = this.parseDifficulty(this.cell(row, headers.difficulty));
        const moduleId = this.resolveModuleId(this.cell(row, headers.moduleTitle), moduleByTitle);
        if (moduleId === false) {
          failed.push({
            sheet: sheetName,
            row: i,
            content,
            reason: `Mô-đun "${this.cell(row, headers.moduleTitle)}" không tồn tại`,
          });
          continue;
        }

        await this.prisma.question.create({
          data: {
            type: QuestionType.MINI_GAME,
            content,
            options: items,
            answer: { correctOrder },
            difficulty,
            moduleId,
          },
        });
        created.push({ sheet: sheetName, row: i, content });
      } catch (err) {
        failed.push({
          sheet: sheetName,
          row: i,
          content,
          reason: err instanceof Error ? err.message : 'Lỗi',
        });
      }
    }
  }

  // ---------- utilities ----------

  private readHeaders(ws: ExcelJS.Worksheet): Record<string, number> {
    const map: Record<string, number> = {};
    ws.getRow(1).eachCell({ includeEmpty: false }, (cell, col) => {
      const key = String(cell.value ?? '').trim();
      if (key) map[key] = col;
    });
    return map;
  }

  private cell(row: ExcelJS.Row, col: number | undefined): string {
    if (!col) return '';
    const v = row.getCell(col).value;
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v.trim();
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    const obj = v as { result?: unknown; text?: unknown };
    if (obj.result !== undefined) return String(obj.result).trim();
    if (obj.text !== undefined) return String(obj.text).trim();
    return String(v).trim();
  }

  private parseDifficulty(raw: string): QuestionDifficulty {
    const v = raw.toUpperCase();
    return (VALID_DIFFICULTY as readonly string[]).includes(v)
      ? (v as QuestionDifficulty)
      : QuestionDifficulty.MEDIUM;
  }

  // Trả về moduleId | null (không gán) | false (lỗi: tên không tồn tại).
  private resolveModuleId(
    moduleTitle: string,
    cache: Map<string, { id: string; title: string }>,
  ): string | null | false {
    if (!moduleTitle) return null;
    const m = cache.get(moduleTitle.trim().toLowerCase());
    if (!m) return false;
    return m.id;
  }
}

// ---------- file-level helpers ----------

function styleHeader(ws: ExcelJS.Worksheet): void {
  const row = ws.getRow(1);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
  row.height = 22;
  ws.views = [{ state: 'frozen', ySplit: 1 }];
}

function addValidation(
  ws: ExcelJS.Worksheet,
  range: string,
  csvList: string,
  fieldLabel: string,
): void {
  const w = ws as unknown as {
    dataValidations?: { add: (range: string, options: unknown) => void };
  };
  if (!w.dataValidations) return;
  w.dataValidations.add(range, {
    type: 'list',
    allowBlank: true,
    formulae: [csvList],
    showErrorMessage: true,
    errorTitle: `${fieldLabel} không hợp lệ`,
    error: `Chọn từ: ${csvList.replace(/"/g, '')}`,
  });
}
