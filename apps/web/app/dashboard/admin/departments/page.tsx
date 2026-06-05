'use client';

import { FormEvent, useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/loading-screen';
import { ApiError } from '@/lib/api-client';
import { adminApi, type AdminDepartment } from '@/lib/admin-api';

export default function AdminDepartmentsPage(): JSX.Element {
  const [depts, setDepts] = useState<AdminDepartment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  async function load(): Promise<void> {
    try {
      setDepts(await adminApi.listDepartments());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await adminApi.createDepartment(newName.trim());
      setNewName('');
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }

  async function handleUpdate(d: AdminDepartment, name: string): Promise<void> {
    if (name === d.name || !name.trim()) return;
    try {
      await adminApi.updateDepartment(d.id, name.trim());
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }

  async function handleDelete(d: AdminDepartment): Promise<void> {
    if (!confirm(`Xóa phòng ban "${d.name}"?`)) return;
    try {
      await adminApi.deleteDepartment(d.id);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }

  if (!depts) return <LoadingScreen label="Đang tải" />;

  return (
    <div className="space-y-6">
      <header>
        <span className="mkt-pill-orange !text-xs">QUẢN TRỊ</span>
        <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">PHÒNG BAN</h1>
        <p className="mt-1 text-sm text-ice">
          MVP chỉ build cây Sales — bạn có thể thêm CSKH, Marketing, Văn hóa ở đây để mở rộng.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="mkt-card flex flex-wrap items-end gap-3 p-4">
        <label className="flex-1 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-sky">
            Tên phòng ban mới
          </span>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="VD: CSKH"
            className="mkt-input"
            minLength={2}
            required
          />
        </label>
        <button type="submit" className="mkt-btn-primary !text-sm">+ Thêm</button>
      </form>

      <section className="mkt-card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-navy-deep/60 text-left text-[10px] font-bold uppercase tracking-widest text-sky">
            <tr>
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3 text-center">Số nhân sự</th>
              <th className="px-4 py-3 text-center">Số khóa học</th>
              <th className="px-4 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {depts.map((d) => (
              <DeptRow key={d.id} dept={d} onSave={handleUpdate} onDelete={handleDelete} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function DeptRow({
  dept,
  onSave,
  onDelete,
}: {
  dept: AdminDepartment;
  onSave: (d: AdminDepartment, name: string) => Promise<void>;
  onDelete: (d: AdminDepartment) => void;
}): JSX.Element {
  const [name, setName] = useState(dept.name);
  return (
    <tr className="border-t border-sky/10">
      <td className="px-4 py-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => onSave(dept, name)}
          className="mkt-input"
        />
      </td>
      <td className="px-4 py-3 text-center text-gold">{dept._count?.users ?? 0}</td>
      <td className="px-4 py-3 text-center text-sky">{dept._count?.courses ?? 0}</td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => onDelete(dept)}
          className="rounded-pill bg-pink/20 px-3 py-1 text-xs font-bold text-pink hover:bg-pink/30"
        >
          Xóa
        </button>
      </td>
    </tr>
  );
}
