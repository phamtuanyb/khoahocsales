'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserRole } from '@mkt-academy/types';
import { useAuth } from '@/components/auth-provider';
import { LoadingScreen } from '@/components/loading-screen';
import { ApiError, api } from '@/lib/api-client';
import { findAvatar } from '@/lib/avatars';

interface TeamMemberRow {
  userId: string;
  email: string;
  name: string;
  avatar: string | null;
  status: string;
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

export default function TeamPage(): JSX.Element {
  const { user } = useAuth();
  const [data, setData] = useState<TeamOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'exp' | 'streak' | 'inactive' | 'lessons'>('exp');

  useEffect(() => {
    let mounted = true;
    api
      .get<TeamOverview>('/team/overview')
      .then((d) => mounted && setData(d))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Không tải được dữ liệu team'),
      );
    return () => {
      mounted = false;
    };
  }, []);

  if (user && user.role !== UserRole.MANAGER && user.role !== UserRole.ADMIN) {
    return (
      <div className="mkt-card p-8 text-center">
        <h1 className="text-h2-mkt-sm text-pink">⚠ TRUY CẬP BỊ TỪ CHỐI</h1>
        <p className="mt-2 text-sm text-ice">
          Chỉ Trưởng phòng / Quản trị viên xem được trang này.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
        ⚠ {error}
      </div>
    );
  }
  if (!data) return <LoadingScreen label="Đang tải team" />;

  // Sort theo selected criterion
  const sorted = [...data.members].sort((a, b) => {
    switch (sortBy) {
      case 'streak':
        return b.streakCount - a.streakCount;
      case 'inactive':
        return (b.daysSinceActive ?? 9999) - (a.daysSinceActive ?? 9999);
      case 'lessons':
        return b.lessonsCompleted - a.lessonsCompleted;
      case 'exp':
      default:
        return b.exp - a.exp;
    }
  });

  return (
    <div className="space-y-6">
      <header>
        <span className="mkt-pill-orange !text-xs">QUẢN LÝ TEAM</span>
        <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">
          THEO DÕI <span className="text-orange">{data.department?.name.toUpperCase() ?? 'TOÀN BỘ'}</span>
        </h1>
        <p className="mt-1 text-sm text-ice">
          Tiến độ học, EXP, streak của từng nhân sự. Cảnh báo nhân sự không hoạt động ≥ 7 ngày.
        </p>
      </header>

      {/* Totals */}
      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatBox icon="👥" label="Nhân sự active" value={data.totals.activeMembers} color="orange" />
        <StatBox icon="⚠" label="Không HĐ ≥ 7 ngày" value={data.totals.inactive7Days} color="pink" />
        <StatBox icon="⚡" label="EXP trung bình" value={data.totals.avgExp} color="gold" />
        <StatBox icon="🆙" label="Level TB" value={data.totals.avgLevel} color="sky" />
        <StatBox icon="📚" label="Tổng bài học xong" value={data.totals.totalLessonsCompleted} color="orange" />
        <StatBox icon="🎯" label="Tổng quiz đỗ" value={data.totals.totalQuizzesPassed} color="gold" />
      </section>

      {/* Sort tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'exp', label: 'Sắp theo EXP' },
            { id: 'streak', label: 'Streak cao nhất' },
            { id: 'lessons', label: 'Hoàn thành nhiều bài' },
            { id: 'inactive', label: '⚠ Không hoạt động' },
          ] as const
        ).map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSortBy(s.id)}
            className={`rounded-pill px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
              sortBy === s.id
                ? 'bg-mkt-pill-orange text-white shadow-mkt-cta'
                : 'border border-sky/30 text-sky hover:border-orange'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Bảng team */}
      <section className="mkt-card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-navy-deep/60 text-left text-[10px] font-bold uppercase tracking-widest text-sky">
            <tr>
              <th className="px-4 py-3">Nhân sự</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3 text-center">EXP</th>
              <th className="px-4 py-3 text-center">EXP tuần</th>
              <th className="px-4 py-3 text-center">Streak</th>
              <th className="px-4 py-3 text-center">Bài học</th>
              <th className="px-4 py-3 text-center">Quiz đỗ</th>
              <th className="px-4 py-3 text-center">Hoạt động cuối</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-sm text-sky">
                  Phòng ban chưa có nhân sự nào.
                </td>
              </tr>
            )}
            {sorted.map((m, i) => (
              <MemberRow key={m.userId} member={m} rank={i + 1} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function MemberRow({ member, rank }: { member: TeamMemberRow; rank: number }): JSX.Element {
  const avatar = findAvatar(member.avatar);
  const isInactive = member.daysSinceActive !== null && member.daysSinceActive >= 7;
  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.02 }}
      className={`border-t border-sky/10 ${isInactive ? 'bg-pink/5' : ''}`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-sky tabular-nums">#{rank}</span>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${avatar.bg} text-lg ring-1 ${avatar.ring}`}>
            {avatar.emoji}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white">{member.name}</div>
            <div className="truncate text-[10px] text-sky">{member.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="rounded-pill bg-sky/20 px-2 py-0.5 text-[10px] font-bold uppercase text-sky">
          Lv.{member.levelOrder} {member.levelName ?? ''}
        </span>
      </td>
      <td className="px-4 py-3 text-center font-bold text-gold tabular-nums">{member.exp}</td>
      <td className="px-4 py-3 text-center text-orange tabular-nums">{member.weeklyExp}</td>
      <td className="px-4 py-3 text-center">
        <span className="inline-flex items-center gap-1 text-pink">
          🔥 <span className="tabular-nums">{member.streakCount}</span>
        </span>
      </td>
      <td className="px-4 py-3 text-center text-ice tabular-nums">{member.lessonsCompleted}</td>
      <td className="px-4 py-3 text-center text-ice tabular-nums">{member.quizzesPassed}</td>
      <td className="px-4 py-3 text-center">
        {member.daysSinceActive === null ? (
          <span className="rounded-pill bg-navy-deep/60 px-2 py-0.5 text-[10px] text-sky/60">Chưa hoạt động</span>
        ) : isInactive ? (
          <span className="rounded-pill bg-pink/20 px-2 py-0.5 text-[10px] font-bold text-pink">
            {member.daysSinceActive} ngày
          </span>
        ) : (
          <span className="text-[10px] text-ice">{member.daysSinceActive} ngày trước</span>
        )}
      </td>
    </motion.tr>
  );
}

function StatBox({
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
    color === 'orange' ? 'text-orange' : color === 'gold' ? 'text-gold' : color === 'pink' ? 'text-pink' : 'text-sky';
  return (
    <div className="mkt-card flex items-center gap-2 p-3">
      <span className="text-2xl">{icon}</span>
      <div className="min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-widest text-sky">{label}</div>
        <div className={`text-xl font-black tabular-nums ${colorClass}`}>{value}</div>
      </div>
    </div>
  );
}
