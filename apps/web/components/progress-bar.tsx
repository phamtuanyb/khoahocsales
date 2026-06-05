'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  percent: number; // 0..100
  label?: string;
  // Hiện số liệu kiểu "3 / 5 bài"
  fraction?: { current: number; total: number; unit?: string };
  // Cao hơn khi cần nhấn mạnh
  size?: 'sm' | 'md' | 'lg';
}

// Thanh tiến độ chuẩn brand — fill gradient cam → vàng theo spec mục 8.5.
export function ProgressBar({
  percent,
  label,
  fraction,
  size = 'md',
}: ProgressBarProps): JSX.Element {
  const clamped = Math.max(0, Math.min(100, percent));
  const height =
    size === 'sm' ? 'h-2' : size === 'lg' ? 'h-5' : 'h-3';

  return (
    <div className="w-full">
      {(label || fraction) && (
        <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
          {label && <span className="text-sky">{label}</span>}
          {fraction && (
            <span className="text-gold">
              {fraction.current} / {fraction.total} {fraction.unit ?? ''}
            </span>
          )}
        </div>
      )}
      <div className={`relative w-full overflow-hidden rounded-pill bg-navy-deep/60 ${height}`}>
        <motion.div
          className="h-full rounded-pill bg-mkt-exp-bar shadow-[0_0_12px_rgba(255,215,0,0.4)]"
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
