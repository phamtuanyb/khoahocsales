'use client';

import { motion } from 'framer-motion';
import type { BadgeWithStatus } from '@/lib/gamification-types';

interface Props {
  badges: BadgeWithStatus[];
  variant?: 'preview' | 'full'; // preview = chỉ show 8 cái đầu, full = lưới đầy đủ
}

export function BadgeGrid({ badges, variant = 'preview' }: Props): JSX.Element {
  const visible = variant === 'preview' ? badges.slice(0, 8) : badges;
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <section className="mkt-card p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <span className="mkt-pill-orange !text-xs">HUY HIỆU</span>
          <h2 className="mt-2 text-h2-mkt-sm">
            <span className="text-gold">{earnedCount}</span>
            <span className="text-white">/{badges.length}</span> ĐÃ ĐẠT
          </h2>
        </div>
        <span className="text-3xl">🏆</span>
      </div>

      <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {visible.map((b, idx) => (
          <BadgeCell key={b.id} badge={b} idx={idx} />
        ))}
      </div>
    </section>
  );
}

function BadgeCell({
  badge,
  idx,
}: {
  badge: BadgeWithStatus;
  idx: number;
}): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.04 }}
      className="group relative flex flex-col items-center gap-1.5 text-center"
      title={badge.description}
    >
      <div
        className={`relative flex h-16 w-16 items-center justify-center rounded-2xl text-3xl transition ${
          badge.earned
            ? 'bg-mkt-pill-gold text-navy-deep shadow-mkt-badge animate-badge-pulse'
            : 'border-2 border-navy-deep/60 bg-navy-deep/40 grayscale opacity-50'
        }`}
      >
        <span>{badge.icon}</span>
        {!badge.earned && (
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-navy-deep bg-navy text-xs">
            🔒
          </span>
        )}
      </div>
      <div
        className={`line-clamp-2 px-1 text-[10px] font-bold uppercase tracking-tight ${
          badge.earned ? 'text-white' : 'text-sky/60'
        }`}
      >
        {badge.name}
      </div>
    </motion.div>
  );
}
