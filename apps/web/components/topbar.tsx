'use client';

import { BrandLogo } from '@/components/brand-logo';
import { useAuth } from './auth-provider';

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps): JSX.Element {
  const { user } = useAuth();
  if (!user) return <></>;

  const level = user.profile?.level;
  const exp = user.profile?.exp ?? 0;
  const nextThreshold = level ? Math.max(level.expThreshold, 1) : 1;
  const progress = level ? Math.min((exp / Math.max(nextThreshold, 1)) * 100, 100) : 0;

  return (
    <header className="sticky top-0 z-20 border-b border-[#E6E3E7] bg-white/95 px-4 py-3 backdrop-blur-xl md:px-8 md:py-4">
      <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D9E7FF] bg-white text-xl font-black text-[#005AB3] lg:hidden"
              aria-label="Mở menu"
            >
              ☰
            </button>
          )}
          <BrandLogo variant="horizontal-positive" className="h-auto w-28 object-contain lg:hidden" />
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#7B8494]">
              Xin chào trở lại
            </div>
            <div className="text-base font-black uppercase tracking-tight text-[#005AB3] md:text-xl">
              {user.name}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {level && (
            <div className="mkt-pill-navy !text-[10px] md:!text-xs">
              <span className="hidden md:inline">Level </span>
              {level.order} - {level.name}
            </div>
          )}

          <div className="flex items-center rounded-full bg-[#FFF0E6] px-2.5 py-1 md:px-3 md:py-1.5">
            <span className="text-xs font-black text-[#FF7A00] md:text-sm">
              {user.profile?.streakCount ?? 0}
            </span>
          </div>

          <div className="hidden min-w-[160px] flex-col gap-1 sm:flex md:min-w-[200px]">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#7B8494]">
              <span>EXP</span>
              <span className="text-[#FF7A00]">
                {exp} / {nextThreshold}
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#EAF3FF]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#FF7A00] to-[#0073E0]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
