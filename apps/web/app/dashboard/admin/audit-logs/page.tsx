'use client';

import { useCallback, useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/loading-screen';
import { ApiError, api } from '@/lib/api-client';

interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  before: unknown;
  after: unknown;
  note: string | null;
  ip: string | null;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function AuditLogsPage(): JSX.Element {
  const [logs, setLogs] = useState<PaginatedResponse<AuditLog> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>('');

  const load = useCallback(async () => {
    try {
      const sp = new URLSearchParams({ page: String(page), pageSize: '50' });
      if (actionFilter) sp.set('action', actionFilter);
      setLogs(await api.get<PaginatedResponse<AuditLog>>(`/admin/audit-logs?${sp}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }, [page, actionFilter]);

  useEffect(() => {
    load();
  }, [load]);

  if (!logs) return <LoadingScreen label="Đang tải audit log" />;

  return (
    <div className="space-y-6">
      <header>
        <span className="mkt-pill-orange !text-xs">QUẢN TRỊ</span>
        <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">AUDIT LOG</h1>
        <p className="mt-1 text-sm text-ice">
          Mọi hành động nhạy cảm của Admin (cộng/trừ EXP, mở khóa đặc cách, xóa nội dung) đều được ghi
          ở đây để truy vết.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-sky">Lọc theo action:</span>
        {['', 'ADJUST_EXP', 'FORCE_UNLOCK'].map((a) => (
          <button
            key={a || 'all'}
            type="button"
            onClick={() => {
              setActionFilter(a);
              setPage(1);
            }}
            className={`rounded-pill px-3 py-1 text-xs font-bold transition ${
              actionFilter === a
                ? 'bg-mkt-pill-orange text-white'
                : 'border border-sky/30 text-sky hover:border-orange'
            }`}
          >
            {a || 'Tất cả'}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      <section className="mkt-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-navy-deep/60 text-left text-[10px] font-bold uppercase tracking-widest text-sky">
            <tr>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Người thực hiện</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Ghi chú</th>
              <th className="px-4 py-3">Diff</th>
            </tr>
          </thead>
          <tbody>
            {logs.data.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-sky">
                  Chưa có log nào.
                </td>
              </tr>
            )}
            {logs.data.map((log) => (
              <tr key={log.id} className="border-t border-sky/10">
                <td className="px-4 py-3 text-[10px] text-ice tabular-nums">
                  {new Date(log.createdAt).toLocaleString('vi-VN')}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-bold text-white">{log.actorEmail}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-pill bg-orange/20 px-2 py-0.5 text-[10px] font-bold text-orange">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-[10px] text-ice">
                  {log.targetType && (
                    <>
                      <div>{log.targetType}</div>
                      <div className="font-mono text-sky">{log.targetId}</div>
                    </>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-ice">{log.note}</td>
                <td className="px-4 py-3 text-[10px]">
                  {(log.before != null || log.after != null) && (
                    <details>
                      <summary className="cursor-pointer text-sky hover:text-orange">Xem</summary>
                      <pre className="mt-1 max-w-xs overflow-auto rounded bg-navy-deep/60 p-2 text-[10px]">
                        {JSON.stringify({ before: log.before, after: log.after }, null, 2)}
                      </pre>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-sky">
        <span>
          Trang {logs.page} / {logs.totalPages} · {logs.total} bản ghi
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={logs.page <= 1}
            onClick={() => setPage(logs.page - 1)}
            className="rounded-pill border border-sky/30 px-3 py-1 disabled:opacity-30"
          >
            ← Trước
          </button>
          <button
            type="button"
            disabled={logs.page >= logs.totalPages}
            onClick={() => setPage(logs.page + 1)}
            className="rounded-pill border border-sky/30 px-3 py-1 disabled:opacity-30"
          >
            Sau →
          </button>
        </div>
      </div>
    </div>
  );
}
