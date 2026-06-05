'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ApiError } from '@/lib/api-client';
import { downloadExcel, uploadFile } from '@/lib/admin-api';

interface ImportRowResult {
  sheet: string;
  row: number;
  content: string;
  reason?: string;
}

export interface QuestionsImportResult {
  totalRows: number;
  createdCount: number;
  failedCount: number;
  created: ImportRowResult[];
  failed: ImportRowResult[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function QuestionsImportModal({ open, onClose, onImported }: Props): JSX.Element | null {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<QuestionsImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleDownloadTemplate(): Promise<void> {
    try {
      await downloadExcel(
        '/admin/questions/import-template',
        'mkt-questions-template.xlsx',
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Tải template thất bại');
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const r = await uploadFile<QuestionsImportResult>('/admin/questions/import', file);
      setResult(r);
      if (r.createdCount > 0) onImported();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Import thất bại');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function handleClose(): void {
    setResult(null);
    setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 16 }}
          transition={{ type: 'spring', damping: 18 }}
          onClick={(e) => e.stopPropagation()}
          className="mkt-card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="mkt-pill-orange !text-xs">NHẬP HÀNG LOẠT</span>
              <h2 className="mt-2 text-h2-mkt-sm">
                IMPORT CÂU HỎI TỪ <span className="text-orange">EXCEL</span>
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-sky/20 text-white"
              aria-label="Đóng"
            >
              ×
            </button>
          </div>

          {/* Hướng dẫn */}
          <div className="mt-5 space-y-3 rounded-xl border border-sky/30 bg-navy-deep/40 p-4 text-sm text-ice">
            <p className="text-xs font-bold uppercase tracking-widest text-sky">
              FILE EXCEL CÓ 4 SHEET — MỖI SHEET 1 DẠNG CÂU HỎI
            </p>
            <ul className="space-y-1 text-xs">
              <li>
                <strong className="text-orange">🔘 TRẮC NGHIỆM</strong>: content + optionA-D + correctKey
              </li>
              <li>
                <strong className="text-orange">📝 TÌNH HUỐNG</strong>: content + keywords (CSV) + minScore + rubric
              </li>
              <li>
                <strong className="text-orange">🧩 MINI GAME</strong>: content + items (JSON array) + correctOrder
              </li>
              <li>
                <strong className="text-orange">⚔️ BOSS BATTLE</strong>: giống TÌNH HUỐNG, dùng cho thi cuối Level
              </li>
            </ul>
            <p className="text-xs italic text-sky">
              💡 Mọi sheet đều có cột <code className="text-orange">moduleTitle</code> để gán vào mô-đun. Phải khớp CHÍNH XÁC tên mô-đun đã tạo (VD: <code>M1 — Quy trình Sales</code>).
            </p>
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="mkt-btn-secondary w-full !text-sm"
            >
              📥 Bước 1 — Tải Excel mẫu (có sẵn ví dụ + sheet HƯỚNG DẪN chi tiết)
            </button>
          </div>

          <div className="mt-3">
            <label className="block">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                disabled={importing}
                hidden
              />
              <span
                className={`mkt-btn-primary block w-full cursor-pointer text-center !text-sm ${
                  importing ? 'pointer-events-none opacity-60' : ''
                }`}
              >
                {importing ? '⏳ Đang import...' : '📤 Bước 2 — Chọn file .xlsx để upload'}
              </span>
            </label>
            <p className="mt-1 text-center text-[10px] text-sky">Tối đa 5MB · Định dạng .xlsx</p>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
              ⚠ {error}
            </div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 space-y-4"
            >
              <h3 className="text-h2-mkt-sm">
                <span className="mkt-pill-orange !text-sm">KẾT QUẢ IMPORT</span>
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <ResultStat label="Tạo mới" value={result.createdCount} color="gold" />
                <ResultStat label="Thất bại" value={result.failedCount} color="pink" />
              </div>

              {result.created.length > 0 && (
                <ResultSection
                  title="✓ Đã tạo"
                  rows={result.created}
                  accent="text-gold border-gold/40 bg-gold/5"
                />
              )}
              {result.failed.length > 0 && (
                <ResultSection
                  title="✗ Thất bại — cần sửa file & import lại"
                  rows={result.failed}
                  accent="text-pink border-pink/40 bg-pink/5"
                />
              )}
            </motion.div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={handleClose} className="mkt-btn-secondary !text-sm">
              {result ? 'Đóng' : 'Hủy'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ResultStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'gold' | 'pink';
}): JSX.Element {
  const colorClass = color === 'gold' ? 'text-gold' : 'text-pink';
  return (
    <div className="rounded-xl border border-sky/20 bg-navy-deep/40 p-3 text-center">
      <div className="text-[10px] font-bold uppercase tracking-widest text-sky">{label}</div>
      <div className={`text-2xl font-black tabular-nums ${colorClass}`}>{value}</div>
    </div>
  );
}

function ResultSection({
  title,
  rows,
  accent,
}: {
  title: string;
  rows: ImportRowResult[];
  accent: string;
}): JSX.Element {
  return (
    <details className={`rounded-xl border-2 p-3 ${accent}`}>
      <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest">
        {title} — {rows.length} dòng
      </summary>
      <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto text-xs">
        {rows.map((r, i) => (
          <li
            key={`${r.sheet}-${r.row}-${i}`}
            className="rounded bg-navy-deep/40 px-2 py-1.5"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span>
                <span className="rounded-pill bg-orange/20 px-2 py-0.5 text-[9px] font-bold uppercase text-orange">
                  {r.sheet}
                </span>{' '}
                <span className="text-sky">dòng {r.row}</span>
              </span>
              {r.reason && (
                <span className="text-right italic opacity-80">{r.reason}</span>
              )}
            </div>
            {r.content && (
              <div className="mt-1 line-clamp-1 text-[10px] text-ice">{r.content}</div>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
