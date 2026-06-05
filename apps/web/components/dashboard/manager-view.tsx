'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LoadingScreen } from '@/components/loading-screen';
import { ApiError, api } from '@/lib/api-client';
import { useAuth } from '@/components/auth-provider';
import { findAvatar } from '@/lib/avatars';

interface TeamMemberRow {
  userId: string;
  email: string;
  name: string;
  avatar: string | null;
  levelOrder: number;
  levelName: string | null;
  exp: number;
  streakCount: number;
  weeklyExp: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  lastActiveAt: string | null;
  daysSinceActive: number | null;
}

interface TeamOverview {
  department: { id: string; name: string } | null;
  members: TeamMemberRow[];
  totals: {
    activeMembers: number;
    inactive7Days: number;
    avgExp: number;
    avgLevel: number;
    totalLessonsCompleted: number;
    totalQuizzesPassed: number;
  };
}

// Dashboard cho MANAGER — tổng quan team thay vì stats cá nhân.
export function ManagerView(): JSX.Element {
  const { user } = useAuth();
  const [data, setData] = useState<TeamOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get<TeamOverview>('/team/overview')
      .then((d) => mounted && setData(d))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Lỗi'));
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
        ⚠ {error}
      </div>
    );
  }
  if (!data) return <LoadingScreen label="Đang tải dashboard team" />;

  // Top 5 + inactive top 5
  const top5 = [...data.members].sort((a, b) => b.exp - a.exp).slice(0, 5);
  const inactive = data.members.filter(
    (m) => m.daysSinceActive === null || m.daysSinceActive >= 7,
  );

  return (
    <div className="space-y-6">
      {/* Hero — chào Manager */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mkt-card relative overflow-hidden p-6 md:p-8"
      >
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #F97316, transparent 70%)' }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="mkt-pill-orange !text-xs">TRƯỞNG PHÒNG</span>
            <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">
              CHÀO, <span className="text-orange">{user?.name.toUpperCase()}</span>
            </h1>
            <p className="mt-1 text-sm text-ice">
              Quản lý phòng{' '}
              <strong className="text-white">{data.department?.name ?? '—'}</strong> ·{' '}
              {data.totals.activeMembers} nhân sự
            </p>
          </div>
          <Link href="/dashboard/team" className="mkt-btn-primary">
            👥 Xem chi tiết team →
          </Link>
        </div>
      </motion.section>

      {/* Team KPI cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon="👥"
          label="Nhân sự trong team"
          value={data.totals.activeMembers}
          color="orange"
        />
        <KpiCard
          icon="⚠"
          label="Không HĐ ≥ 7 ngày"
          value={data.totals.inactive7Days}
          color={data.totals.inactive7Days > 0 ? 'pink' : 'sky'}
        />
        <KpiCard icon="🆙" label="Level trung bình" value={data.totals.avgLevel} color="gold" />
        <KpiCard icon="⚡" label="EXP trung bình" value={data.totals.avgExp} color="orange" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top performer team */}
        <section className="mkt-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-h2-mkt-sm">
              <span className="mkt-pill-orange !text-sm">TOP 5 TEAM</span>
            </h2>
            <span className="text-xs text-sky">Theo EXP</span>
          </div>
          {top5.length === 0 ? (
            <p className="text-sm text-sky">Chưa có nhân sự nào trong phòng.</p>
          ) : (
            <ol className="space-y-2">
              {top5.map((m, i) => {
                const avatar = findAvatar(m.avatar);
                return (
                  <motion.li
                    key={m.userId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-xl border border-sky/20 bg-navy-deep/30 px-3 py-2"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                        i < 3 ? 'bg-mkt-pill-gold text-navy-deep' : 'bg-navy-deep text-white'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${avatar.bg} text-lg ring-1 ${avatar.ring}`}
                    >
                      {avatar.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-white">{m.name}</div>
                      <div className="text-[10px] text-sky">
                        Lv.{m.levelOrder} · 🔥 {m.streakCount}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-black text-gold tabular-nums">
                      {m.exp} EXP
                    </span>
                  </motion.li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Cảnh báo không hoạt động */}
        <section className="mkt-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-h2-mkt-sm">
              <span className="!bg-pink mkt-pill-orange !text-sm">⚠ CẢNH BÁO</span>
            </h2>
            <span className="text-xs text-pink">{inactive.length} nhân sự</span>
          </div>
          {inactive.length === 0 ? (
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-center">
              <div className="text-3xl">🎉</div>
              <p className="mt-2 text-sm text-gold">
                Tuyệt vời! Mọi nhân sự trong phòng đều hoạt động trong tuần.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {inactive.slice(0, 5).map((m, i) => (
                <motion.li
                  key={m.userId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between gap-2 rounded-xl border border-pink/30 bg-pink/5 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">{m.name}</div>
                    <div className="text-[10px] text-sky">{m.email}</div>
                  </div>
                  <span className="shrink-0 rounded-pill bg-pink/20 px-2 py-0.5 text-[10px] font-bold text-pink">
                    {m.daysSinceActive === null
                      ? 'Chưa HĐ'
                      : `${m.daysSinceActive} ngày`}
                  </span>
                </motion.li>
              ))}
              {inactive.length > 5 && (
                <li className="pt-2 text-center text-xs text-sky">
                  +{inactive.length - 5} nhân sự khác —{' '}
                  <Link href="/dashboard/team" className="text-orange hover:underline">
                    xem chi tiết
                  </Link>
                </li>
              )}
            </ul>
          )}
        </section>
      </div>

      {/* Quick links */}
      <section className="flex flex-wrap gap-3">
        <Link href="/dashboard/team" className="mkt-btn-primary">
          👥 Quản lý team chi tiết
        </Link>
        <Link href="/dashboard/leaderboard" className="mkt-btn-secondary">
          🏆 Bảng xếp hạng
        </Link>
        <Link href="/dashboard/learn" className="mkt-btn-secondary">
          📚 Khu vực học (xem góc nhân viên)
        </Link>
      </section>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: 'orange' | 'gold' | 'pink' | 'sky';
}): JSX.Element {
  const colorClass =
    color === 'orange'
      ? 'text-orange'
      : color === 'gold'
        ? 'text-gold'
        : color === 'pink'
          ? 'text-pink'
          : 'text-sky';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mkt-card flex items-center gap-3 p-4"
    >
      <span className="text-3xl">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-sky">{label}</div>
        <div className={`text-2xl font-black tabular-nums ${colorClass}`}>{value}</div>
      </div>
    </motion.div>
  );
}
