'use client';

import { motion } from 'framer-motion';

interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  maxValue?: number;
  format?: (v: number) => string;
}

// Bar chart đơn giản dùng HTML/CSS — không cần thư viện chart.
// Mỗi hàng = 1 bar ngang có animate width theo Framer Motion.
export function BarChart({ data, maxValue, format }: BarChartProps): JSX.Element {
  const max = maxValue ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-2">
      {data.map((d, i) => {
        const pct = max > 0 ? (d.value / max) * 100 : 0;
        return (
          <li key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate text-ice">{d.label}</span>
              <span className="shrink-0 font-bold text-gold tabular-nums">
                {format ? format(d.value) : d.value}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-pill bg-navy-deep/60">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
                className={`h-full rounded-pill ${d.color ?? 'bg-mkt-exp-bar'}`}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
