'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface JsonCardFormProps<T> {
  title: string;
  fields: Array<{
    name: keyof T & string;
    label: string;
    type: 'text' | 'number' | 'textarea' | 'json' | 'checkbox';
    placeholder?: string;
    rows?: number;
  }>;
  initial: T;
  onSave: (data: T) => Promise<void>;
  onDelete?: () => Promise<void>;
  saveLabel?: string;
}

// Component dùng chung cho form CRUD đơn giản — Badge, Mission, Department, ...
// Hỗ trợ ô JSON với validate khi save.
export function JsonCardForm<T extends Record<string, unknown>>({
  title,
  fields,
  initial,
  onSave,
  onDelete,
  saveLabel = '💾 Lưu',
}: JsonCardFormProps<T>): JSX.Element {
  const [data, setData] = useState<T>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof T>(key: K, value: T[K]): void {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    // Validate JSON fields
    for (const f of fields) {
      if (f.type === 'json' && typeof data[f.name] === 'string') {
        try {
          JSON.parse(data[f.name] as string);
        } catch {
          setError(`${f.label} không phải JSON hợp lệ`);
          return;
        }
      }
    }
    setSaving(true);
    try {
      // Convert JSON string fields to object before sending
      const payload = { ...data };
      for (const f of fields) {
        if (f.type === 'json' && typeof payload[f.name] === 'string') {
          (payload as Record<string, unknown>)[f.name] = JSON.parse(payload[f.name] as string);
        }
      }
      await onSave(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit}
      className="mkt-card space-y-3 p-4"
    >
      <h3 className="text-sm font-bold uppercase tracking-widest text-white">{title}</h3>
      {error && (
        <div className="rounded border border-pink/60 bg-pink/10 px-3 py-2 text-xs text-pink">⚠ {error}</div>
      )}
      {fields.map((f) => (
        <label key={f.name} className="block space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-sky">{f.label}</span>
          {f.type === 'text' && (
            <input
              value={String(data[f.name] ?? '')}
              onChange={(e) => set(f.name, e.target.value as T[keyof T])}
              placeholder={f.placeholder}
              className="mkt-input"
            />
          )}
          {f.type === 'number' && (
            <input
              type="number"
              value={Number(data[f.name] ?? 0)}
              onChange={(e) => set(f.name, Number(e.target.value) as T[keyof T])}
              className="mkt-input"
            />
          )}
          {f.type === 'textarea' && (
            <textarea
              value={String(data[f.name] ?? '')}
              onChange={(e) => set(f.name, e.target.value as T[keyof T])}
              rows={f.rows ?? 2}
              placeholder={f.placeholder}
              className="mkt-input"
            />
          )}
          {f.type === 'json' && (
            <textarea
              value={
                typeof data[f.name] === 'string'
                  ? String(data[f.name])
                  : JSON.stringify(data[f.name] ?? {}, null, 2)
              }
              onChange={(e) => set(f.name, e.target.value as T[keyof T])}
              rows={f.rows ?? 5}
              placeholder={f.placeholder}
              className="mkt-input font-mono text-xs"
            />
          )}
          {f.type === 'checkbox' && (
            <label className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                checked={Boolean(data[f.name])}
                onChange={(e) => set(f.name, e.target.checked as T[keyof T])}
                className="h-5 w-5 accent-orange"
              />
              <span className="text-xs text-ice">{f.placeholder ?? f.label}</span>
            </label>
          )}
        </label>
      ))}
      <div className="flex justify-end gap-2 pt-2">
        {onDelete && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Xóa mục này?')) onDelete();
            }}
            className="rounded-pill bg-pink/20 px-3 py-1 text-xs font-bold text-pink hover:bg-pink/30"
          >
            Xóa
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="mkt-btn-primary !text-xs !px-4 !py-1.5 disabled:opacity-60"
        >
          {saving ? 'Đang lưu...' : saveLabel}
        </button>
      </div>
    </motion.form>
  );
}
