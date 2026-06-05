'use client';

import { motion } from 'framer-motion';
import type { Milestone } from '@/lib/gamification-types';

export function RecentMilestonesWidget({
  milestones,
}: {
  milestones: Milestone[];
}): JSX.Element {
  return (
    <section className="mkt-card p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <span className="mkt-pill-orange !text-xs">CỘT MỐC GẦN ĐÂY</span>
          <h2 className="mt-2 text-h2-mkt-sm">THÀNH TÍCH NỔI BẬT</h2>
        </div>
        <span className="text-3xl">⭐</span>
      </div>

      {milestones.length === 0 ? (
        <p className="text-sm text-sky">
          Chưa có cột mốc nào. Hoàn thành bài học hoặc bài thi để xuất hiện ở đây.
        </p>
      ) : (
        <ul className="space-y-2">
          {milestones.map((m, i) => (
            <motion.li
              key={`${m.type}-${m.occurredAt}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 rounded-xl border border-sky/20 bg-navy-deep/30 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white">{m.title}</div>
                {m.description && (
                  <div className="truncate text-xs text-ice">{m.description}</div>
                )}
              </div>
              <span className="shrink-0 text-[10px] text-sky">
                {formatRelative(m.occurredAt)}
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)}p trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}
