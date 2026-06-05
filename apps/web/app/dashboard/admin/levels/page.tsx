'use client';

import { FormEvent, useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/loading-screen';
import { ApiError } from '@/lib/api-client';
import { adminApi, type AdminLevel } from '@/lib/admin-api';

export default function AdminLevelsPage(): JSX.Element {
  const [levels, setLevels] = useState<AdminLevel[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  async function load(): Promise<void> {
    try {
      setLevels(await adminApi.listLevels());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      await adminApi.createLevel({
        order: Number(data.get('order')),
        name: String(data.get('name') ?? '').trim(),
        expThreshold: Number(data.get('expThreshold')),
        description: String(data.get('description') ?? '').trim() || undefined,
      });
      form.reset();
      setFormOpen(false);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }

  async function saveRow(level: AdminLevel, patch: Partial<AdminLevel>): Promise<void> {
    try {
      await adminApi.updateLevel(level.id, patch);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }

  async function handleDelete(level: AdminLevel): Promise<void> {
    if (!confirm(`Xóa Level ${level.order} — ${level.name}?`)) return;
    try {
      await adminApi.deleteLevel(level.id);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }

  if (!levels) return <LoadingScreen label="Đang tải Level" />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="mkt-pill-orange !text-xs">CẤU HÌNH HỆ THỐNG</span>
          <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">LEVEL & NGƯỠNG EXP</h1>
          <p className="mt-1 text-sm text-ice">
            Cấu hình tên danh hiệu + ngưỡng EXP cho mỗi Level. Khi user vượt ngưỡng → tự lên cấp.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="mkt-btn-primary !text-sm"
        >
          {formOpen ? 'Đóng' : '+ Thêm Level'}
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      {formOpen && (
        <form onSubmit={handleCreate} className="mkt-card space-y-3 p-6">
          <h2 className="text-h2-mkt-sm">
            <span className="mkt-pill-orange !text-sm">THÊM LEVEL MỚI</span>
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Order"><input name="order" type="number" min={1} required className="mkt-input" /></Field>
            <Field label="Tên danh hiệu"><input name="name" required minLength={2} className="mkt-input" /></Field>
            <Field label="Ngưỡng EXP"><input name="expThreshold" type="number" min={0} required className="mkt-input" /></Field>
          </div>
          <Field label="Mô tả"><textarea name="description" rows={2} className="mkt-input" /></Field>
          <div className="flex justify-end">
            <button type="submit" className="mkt-btn-primary !text-sm">Lưu Level</button>
          </div>
        </form>
      )}

      <section className="mkt-card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-navy-deep/60 text-left text-[10px] font-bold uppercase tracking-widest text-sky">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">Ngưỡng EXP</th>
              <th className="px-4 py-3">Mô tả</th>
              <th className="px-4 py-3 text-center">Số user</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {levels.map((l) => (
              <LevelRow key={l.id} level={l} onSave={saveRow} onDelete={handleDelete} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function LevelRow({
  level,
  onSave,
  onDelete,
}: {
  level: AdminLevel;
  onSave: (l: AdminLevel, patch: Partial<AdminLevel>) => Promise<void>;
  onDelete: (l: AdminLevel) => void;
}): JSX.Element {
  const [name, setName] = useState(level.name);
  const [threshold, setThreshold] = useState(level.expThreshold);
  const [desc, setDesc] = useState(level.description ?? '');
  const dirty = name !== level.name || threshold !== level.expThreshold || desc !== (level.description ?? '');
  return (
    <tr className="border-t border-sky/10">
      <td className="px-4 py-3 font-black text-orange">L{level.order}</td>
      <td className="px-4 py-3">
        <input value={name} onChange={(e) => setName(e.target.value)} className="mkt-input" />
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="mkt-input w-24"
        />
      </td>
      <td className="px-4 py-3">
        <input value={desc} onChange={(e) => setDesc(e.target.value)} className="mkt-input" />
      </td>
      <td className="px-4 py-3 text-center text-gold">{level._count?.profiles ?? 0}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1">
          {dirty && (
            <button
              type="button"
              onClick={() =>
                onSave(level, { name, expThreshold: threshold, description: desc || null })
              }
              className="rounded-pill bg-orange/20 px-3 py-1 text-xs font-bold text-orange hover:bg-orange/30"
            >
              💾 Lưu
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(level)}
            className="rounded-pill bg-pink/20 px-3 py-1 text-xs font-bold text-pink hover:bg-pink/30"
          >
            Xóa
          </button>
        </div>
      </td>
    </tr>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-bold uppercase tracking-widest text-sky">{label}</span>
      {children}
    </label>
  );
}
