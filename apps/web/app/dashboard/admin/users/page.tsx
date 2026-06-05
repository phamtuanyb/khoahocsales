'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LoadingScreen } from '@/components/loading-screen';
import { UsersImportModal } from '@/components/admin/users-import-modal';
import { ApiError } from '@/lib/api-client';
import { adminApi, type AdminDepartment, type AdminUser } from '@/lib/admin-api';

export default function AdminUsersPage(): JSX.Element {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 25, totalPages: 1 });
  const [depts, setDepts] = useState<AdminDepartment[]>([]);
  const [filterDept, setFilterDept] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  async function load(): Promise<void> {
    try {
      const [paged, ds] = await Promise.all([
        adminApi.listUsers({
          departmentId: filterDept || undefined,
          q: search || undefined,
          page,
          pageSize: 25,
        }),
        adminApi.listDepartments(),
      ]);
      setUsers(paged.data);
      setPagination({
        total: paged.total,
        page: paged.page,
        pageSize: paged.pageSize,
        totalPages: paged.totalPages,
      });
      setDepts(ds);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDept, search, page]);

  async function handleCreate(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    try {
      await adminApi.createUser({
        email: String(data.get('email') ?? '').trim(),
        name: String(data.get('name') ?? '').trim(),
        password: String(data.get('password') ?? ''),
        role: String(data.get('role') ?? 'LEARNER'),
        departmentId: String(data.get('departmentId') ?? '') || undefined,
      });
      (e.target as HTMLFormElement).reset();
      setFormOpen(false);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }

  if (!users) return <LoadingScreen label="Đang tải user" />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="mkt-pill-orange !text-xs">QUẢN TRỊ</span>
          <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">NGƯỜI DÙNG & PHÂN QUYỀN</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="🔍 Tìm email/tên..."
            className="mkt-input w-auto !py-1.5 text-xs"
          />
          <select
            value={filterDept}
            onChange={(e) => {
              setFilterDept(e.target.value);
              setPage(1);
            }}
            className="mkt-input w-auto !py-1.5 text-xs"
          >
            <option value="">Mọi phòng ban</option>
            {depts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="mkt-btn-secondary !text-sm"
            title="Nhập danh sách từ file Excel"
          >
            📥 Nhập từ Excel
          </button>
          <button type="button" onClick={() => setFormOpen((v) => !v)} className="mkt-btn-primary !text-sm">
            {formOpen ? 'Đóng' : '+ Tạo user'}
          </button>
        </div>
      </header>

      <UsersImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={load}
      />


      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      {formOpen && (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="mkt-card space-y-3 p-6"
        >
          <h2 className="text-h2-mkt-sm">
            <span className="mkt-pill-orange !text-sm">TẠO USER MỚI</span>
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Họ tên"><input name="name" required minLength={2} className="mkt-input" /></Field>
            <Field label="Email"><input name="email" type="email" required className="mkt-input" /></Field>
            <Field label="Mật khẩu"><input name="password" type="password" required minLength={8} className="mkt-input" /></Field>
            <Field label="Vai trò">
              <select name="role" required defaultValue="LEARNER" className="mkt-input">
                <option value="LEARNER">Learner — Nhân sự</option>
                <option value="MANAGER">Manager — Trưởng phòng</option>
                <option value="ADMIN">Admin — Quản trị</option>
              </select>
            </Field>
            <Field label="Phòng ban">
              <select name="departmentId" className="mkt-input">
                <option value="">— Không gán —</option>
                {depts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="mkt-btn-primary !text-sm">+ Tạo user</button>
          </div>
        </motion.form>
      )}

      <section className="mkt-card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-navy-deep/60 text-left text-[10px] font-bold uppercase tracking-widest text-sky">
            <tr>
              <th className="px-4 py-3">Người dùng</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Phòng ban</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow key={u.id} user={u} depts={depts} onChange={load} />
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-sky">
                  Không có user nào (theo filter hiện tại).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-sky">
        <span>
          Trang {pagination.page}/{pagination.totalPages} · {pagination.total} user
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => setPage(pagination.page - 1)}
            className="rounded-pill border border-sky/30 px-3 py-1 disabled:opacity-30"
          >
            ← Trước
          </button>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPage(pagination.page + 1)}
            className="rounded-pill border border-sky/30 px-3 py-1 disabled:opacity-30"
          >
            Sau →
          </button>
        </div>
      </div>
    </div>
  );
}

function UserRow({
  user,
  depts,
  onChange,
}: {
  user: AdminUser;
  depts: AdminDepartment[];
  onChange: () => Promise<void>;
}): JSX.Element {
  const [editing, setEditing] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);

  async function changeRole(role: string): Promise<void> {
    if (!confirm(`Đổi vai trò sang ${role}?`)) return;
    try {
      await adminApi.updateUser(user.id, { role: role as AdminUser['role'] });
      await onChange();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }

  async function changeDept(deptId: string): Promise<void> {
    try {
      await adminApi.updateUser(user.id, {
        departmentId: deptId || null,
      } as Partial<AdminUser>);
      await onChange();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }

  async function changeStatus(status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'): Promise<void> {
    try {
      await adminApi.updateUser(user.id, { status });
      await onChange();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }

  async function handleAdjustExp(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const amount = Number(data.get('amount'));
    const reason = String(data.get('reason') ?? '').trim();
    try {
      const result = await adminApi.adjustExp(user.id, amount, reason);
      alert(`Đã điều chỉnh — Tổng EXP hiện tại: ${result.totalExp}`);
      setAdjustOpen(false);
      await onChange();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }

  return (
    <>
      <tr className="border-t border-sky/10">
        <td className="px-4 py-3">
          <div className="font-bold text-white">{user.name}</div>
          <div className="text-[10px] text-sky">{user.email}</div>
        </td>
        <td className="px-4 py-3">
          {editing ? (
            <select
              defaultValue={user.role}
              onChange={(e) => changeRole(e.target.value)}
              className="mkt-input !py-1 text-xs"
            >
              <option value="LEARNER">LEARNER</option>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          ) : (
            <span
              className={`rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase ${
                user.role === 'ADMIN'
                  ? 'bg-pink/20 text-pink'
                  : user.role === 'MANAGER'
                    ? 'bg-orange/20 text-orange'
                    : 'bg-sky/20 text-sky'
              }`}
            >
              {user.role}
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          {editing ? (
            <select
              defaultValue={user.departmentId ?? ''}
              onChange={(e) => changeDept(e.target.value)}
              className="mkt-input !py-1 text-xs"
            >
              <option value="">—</option>
              {depts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          ) : (
            <span className="text-ice">{user.department?.name ?? '—'}</span>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          {editing ? (
            <select
              defaultValue={user.status}
              onChange={(e) => changeStatus(e.target.value as 'ACTIVE' | 'SUSPENDED' | 'INACTIVE')}
              className="mkt-input !py-1 text-xs"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          ) : (
            <span
              className={`rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase ${
                user.status === 'ACTIVE'
                  ? 'bg-gold/20 text-gold'
                  : 'bg-sky/20 text-sky/60'
              }`}
            >
              {user.status}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="rounded-pill bg-sky/20 px-2 py-1 text-[10px] font-bold text-sky hover:bg-sky/30"
            >
              {editing ? 'Done' : 'Sửa'}
            </button>
            <button
              type="button"
              onClick={() => setAdjustOpen((v) => !v)}
              className="rounded-pill bg-orange/20 px-2 py-1 text-[10px] font-bold text-orange hover:bg-orange/30"
            >
              ± EXP
            </button>
            <button
              type="button"
              onClick={() => setUnlockOpen((v) => !v)}
              className="rounded-pill bg-gold/20 px-2 py-1 text-[10px] font-bold text-gold hover:bg-gold/30"
            >
              🔓 Mở khóa
            </button>
          </div>
        </td>
      </tr>
      {adjustOpen && (
        <tr>
          <td colSpan={5} className="bg-orange/5 px-4 py-3">
            <form onSubmit={handleAdjustExp} className="flex flex-wrap items-end gap-2">
              <Field label="EXP (+/−)"><input name="amount" type="number" required className="mkt-input w-24" /></Field>
              <Field label="Lý do"><input name="reason" required minLength={3} className="mkt-input min-w-[200px]" /></Field>
              <button type="submit" className="mkt-btn-primary !text-xs !py-1.5">Áp dụng</button>
              <button type="button" onClick={() => setAdjustOpen(false)} className="mkt-btn-secondary !text-xs !py-1.5">
                Hủy
              </button>
            </form>
          </td>
        </tr>
      )}
      {unlockOpen && (
        <tr>
          <td colSpan={5} className="bg-gold/5 px-4 py-3">
            <ForceUnlockForm user={user} onDone={() => { setUnlockOpen(false); onChange(); }} />
          </td>
        </tr>
      )}
    </>
  );
}

function ForceUnlockForm({
  user,
  onDone,
}: {
  user: AdminUser;
  onDone: () => void;
}): JSX.Element {
  const [targetType, setTargetType] = useState<'LESSON' | 'MODULE' | 'COURSE' | 'LEVEL'>('LESSON');
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(): Promise<void> {
    if (!targetId.trim() || !reason.trim()) {
      alert('Cần nhập targetId + reason');
      return;
    }
    setSaving(true);
    try {
      await adminApi.forceUnlock(user.id, targetType, targetId.trim(), reason.trim());
      alert('Đã mở khóa');
      onDone();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lỗi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Field label="Loại">
        <select value={targetType} onChange={(e) => setTargetType(e.target.value as 'LESSON' | 'MODULE' | 'COURSE' | 'LEVEL')} className="mkt-input !py-1 text-xs">
          <option value="LESSON">Bài học</option>
          <option value="MODULE">Mô-đun</option>
          <option value="COURSE">Khóa học</option>
          <option value="LEVEL">Level</option>
        </select>
      </Field>
      <Field label="Target ID">
        <input value={targetId} onChange={(e) => setTargetId(e.target.value)} className="mkt-input min-w-[180px] font-mono text-xs" />
      </Field>
      <Field label="Lý do (ghi log)">
        <input value={reason} onChange={(e) => setReason(e.target.value)} className="mkt-input min-w-[200px]" />
      </Field>
      <button type="button" onClick={submit} disabled={saving} className="mkt-btn-primary !text-xs !py-1.5 disabled:opacity-60">
        {saving ? '...' : 'Mở khóa đặc cách'}
      </button>
      <button type="button" onClick={onDone} className="mkt-btn-secondary !text-xs !py-1.5">Hủy</button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-sky">{label}</span>
      {children}
    </label>
  );
}
