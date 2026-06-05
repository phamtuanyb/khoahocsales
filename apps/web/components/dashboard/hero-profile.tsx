'use client';

import { motion } from 'framer-motion';
import { findAvatar } from '@/lib/avatars';
import type { DashboardData } from '@/lib/gamification-types';

interface Props {
  data: DashboardData;
}

// Khối hero — avatar lớn, Level, EXP bar, Streak, Rank.
// Spec mục 5.2 — thành phần Avatar + Frame, Level & Danh hiệu, Thanh EXP, Rank, Streak.
export function HeroProfile({ data }: Props): JSX.Element {
  const avatar = findAvatar(data.user.avatar);
  const level = data.profile.level;
  const next = data.profile.nextLevel;

  // Tỉ lệ trong "level hiện tại" — đẹp hơn % so với threshold tuyệt đối
  const span = next ? next.expThreshold - (level?.expThreshold ?? 0) : 1;
  const pct =
    next && span > 0 ? Math.min((data.profile.expIntoLevel / span) * 100, 100) : 100;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mkt-card relative overflow-hidden p-6 md:p-8"
    >
      {/* Bokeh trang trí */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, #F97316, transparent 70%)' }}
      />

      <div className="relative flex flex-col items-center gap-6 md:flex-row">
        {/* Avatar với frame Level */}
        <div className="relative">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className={`flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br ${avatar.bg} text-6xl ring-4 ${avatar.ring} shadow-mkt-3d`}
          >
            {avatar.emoji}
          </motion.div>
          {/* Level badge nổi góc */}
          {level && (
            <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-mkt-pill-gold text-xl font-black text-navy-deep shadow-mkt-badge">
              {level.order}
            </div>
          )}
        </div>

        {/* Info chính */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
            <span className="mkt-pill-orange !text-xs">
              {data.user.department?.name ? `PHÒNG ${data.user.department.name.toUpperCase()}` : 'CHƯA GÁN PHÒNG'}
            </span>
            {level && (
              <span className="mkt-pill-navy !text-xs">
                LEVEL {level.order} — {level.name.toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt md:text-h2-mkt">
            {data.user.name.toUpperCase()}
          </h1>

          {/* EXP bar */}
          <div className="mt-5 max-w-md mx-auto md:mx-0">
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
              <span className="text-sky">EXP</span>
              <span className="text-gold tabular-nums">
                {data.profile.exp} EXP
                {next ? ` / ${next.expThreshold}` : ' (MAX)'}
              </span>
            </div>
            <div className="h-4 overflow-hidden rounded-pill bg-navy-deep/60">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-pill bg-mkt-exp-bar"
                style={{ backgroundSize: '200% 100%', animation: 'exp-shine 2s linear infinite' }}
              />
            </div>
            {next && (
              <div className="mt-1 text-center text-[10px] text-sky md:text-left">
                Còn {data.profile.expToNextLevel} EXP để lên {next.name}
              </div>
            )}
          </div>
        </div>

        {/* Streak + Rank */}
        <div className="flex flex-col items-center gap-3 md:items-end">
          <div className="flex flex-col items-center rounded-card border-2 border-pink/40 bg-pink/10 px-4 py-3">
            <motion.span
              animate={{ scale: [1, 1.15, 1], rotate: [-3, 3, -3] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="text-3xl"
            >
              🔥
            </motion.span>
            <span className="text-2xl font-black text-pink tabular-nums">
              {data.profile.streakCount}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-sky">
              NGÀY STREAK
            </span>
          </div>

          {data.profile.rank !== null && (
            <div className="flex flex-col items-center rounded-card border-2 border-gold/40 bg-gold/10 px-4 py-3">
              <span className="text-3xl">🏅</span>
              <span className="text-2xl font-black text-gold tabular-nums">
                #{data.profile.rank}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky">
                XẾP HẠNG
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
