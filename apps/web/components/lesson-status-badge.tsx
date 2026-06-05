'use client';

import { LessonStatus } from '@mkt-academy/types';

interface LessonStatusBadgeProps {
  status: LessonStatus;
  size?: 'sm' | 'md';
}

const META: Record<LessonStatus, { label: string; icon: string; pill: string }> = {
  LOCKED: { label: 'Khóa', icon: '🔒', pill: 'bg-navy-deep/60 text-sky/60' },
  AVAILABLE: { label: 'Mở', icon: '✨', pill: 'bg-sky/20 text-sky' },
  IN_PROGRESS: { label: 'Đang học', icon: '📖', pill: 'bg-orange/20 text-orange' },
  COMPLETED: { label: 'Hoàn thành', icon: '✓', pill: 'bg-gold/20 text-gold' },
};

export function LessonStatusBadge({
  status,
  size = 'sm',
}: LessonStatusBadgeProps): JSX.Element {
  const meta = META[status];
  const padding = size === 'md' ? 'px-3 py-1' : 'px-2 py-0.5';
  const fontSize = size === 'md' ? 'text-xs' : 'text-[10px]';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill font-bold uppercase tracking-wide ${meta.pill} ${padding} ${fontSize}`}
    >
      <span>{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
}
