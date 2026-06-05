'use client';

import { useEffect, useState } from 'react';

interface QuizTimerProps {
  totalSeconds: number;
  onExpire: () => void;
  paused?: boolean;
}

// Đồng hồ đếm ngược — đổi màu cảnh báo khi còn < 60s.
// Đếm bằng performance.now() để chính xác kể cả khi tab inactive.
export function QuizTimer({
  totalSeconds,
  onExpire,
  paused = false,
}: QuizTimerProps): JSX.Element {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (paused) return;
    const startedAt = performance.now();
    const initial = remaining;
    const id = window.setInterval(() => {
      const elapsed = (performance.now() - startedAt) / 1000;
      const left = Math.max(0, Math.floor(initial - elapsed));
      setRemaining(left);
      if (left <= 0) {
        window.clearInterval(id);
        onExpire();
      }
    }, 250);
    return () => window.clearInterval(id);
    // Chỉ chạy 1 lần khi mount (hoặc khi resume từ paused).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const display = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const warning = remaining <= 60;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-pill border-2 px-4 py-2 text-lg font-black tabular-nums transition ${
        warning
          ? 'animate-pulse border-pink bg-pink/20 text-pink shadow-[0_0_20px_rgba(255,64,129,0.5)]'
          : 'border-sky bg-navy-deep/60 text-white'
      }`}
    >
      <span className="text-xl">⏱</span>
      <span>{display}</span>
    </div>
  );
}
