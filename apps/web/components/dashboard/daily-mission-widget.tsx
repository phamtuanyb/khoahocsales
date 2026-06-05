'use client';

import { motion } from 'framer-motion';
import type { MissionWithProgress } from '@/lib/gamification-types';

interface Props {
  missions: MissionWithProgress[];
}

export function DailyMissionWidget({ missions }: Props): JSX.Element {
  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <section className="mkt-card p-6">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <span className="mkt-pill-orange !text-xs">NHIỆM VỤ NGÀY</span>
          <h2 className="mt-2 text-h2-mkt-sm">
            HÔM NAY <span className="text-gold">{completedCount}/{missions.length}</span>
          </h2>
        </div>
        <span className="text-3xl">🎯</span>
      </div>

      {missions.length === 0 ? (
        <p className="text-sm text-sky">Chưa có nhiệm vụ cho hôm nay.</p>
      ) : (
        <ul className="space-y-3">
          {missions.map((m, idx) => (
            <MissionRow key={m.missionId} mission={m} idx={idx} />
          ))}
        </ul>
      )}
    </section>
  );
}

function MissionRow({
  mission,
  idx,
}: {
  mission: MissionWithProgress;
  idx: number;
}): JSX.Element {
  const percent = Math.round((mission.current / Math.max(mission.required, 1)) * 100);
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.06 }}
      className={`rounded-xl border-2 px-4 py-3 transition ${
        mission.completed
          ? 'border-gold/50 bg-gold/10'
          : 'border-sky/30 bg-navy-deep/40'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ${
            mission.completed
              ? 'bg-mkt-pill-gold text-navy-deep'
              : 'bg-sky/20 text-white'
          }`}
        >
          {mission.completed ? '✓' : '○'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-bold text-white">
              {mission.title}
            </span>
            <span
              className={`rounded-pill px-2 py-0.5 text-[10px] font-bold ${
                mission.completed
                  ? 'bg-gold text-navy-deep'
                  : 'bg-orange text-white'
              }`}
            >
              +{mission.rewardExp} EXP
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-pill bg-navy-deep/60">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percent, 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-pill bg-mkt-exp-bar"
              />
            </div>
            <span className="shrink-0 text-[10px] font-bold text-sky">
              {mission.current}/{mission.required}
            </span>
          </div>
        </div>
      </div>
    </motion.li>
  );
}
