'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart } from '@/components/admin/bar-chart';
import { LoadingScreen } from '@/components/loading-screen';
import { ApiError } from '@/lib/api-client';
import { adminApi, downloadExcel, type AdminOverview } from '@/lib/admin-api';
import { useAuth } from '@/components/auth-provider';

// Dashboard cho ADMIN — tổng quan toàn công ty.
export function AdminView(): JSX.Element {
  const { user } = useAuth();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let mounted = true;
    adminApi
      .overview()
      .then((d) => mounted && setData(d))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Lỗi'));
    return () => {
      mounted = false;
    };
  }, []);

  async function exportReport(): Promise<void> {
    setExporting(true);
    try {
      await downloadExcel(
        '/admin/analytics/export/overview',
        `mkt-overview-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Xuất Excel thất bại');
    } finally {
      setExporting(false);
    }
  }

  if (error) {
    return (
      <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
        ⚠ {error}
      </div>
    );
  }
  if (!data) return <LoadingScreen label="Đang tải dashboard quản trị" />;

  const t = data.totals;

  return (
    <div className="space-y-6">
      {/* Hero — chào Admin */}
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
            <span className="mkt-pill-orange !text-xs">QUẢN TRỊ TOÀN HỆ THỐNG</span>
            <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">
              CHÀO, <span className="text-orange">{user?.name.toUpperCase()}</span>
            </h1>
            <p className="mt-1 text-sm text-ice">
              Toàn quyền điều hành MKT Academy · {t.users} nhân sự ·{' '}
              {t.activeThisWeek} active tuần này
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportReport}
              disabled={exporting}
              className="mkt-btn-secondary !text-sm disabled:opacity-60"
            >
              {exporting ? 'Đang xuất...' : '📊 Xuất Excel báo cáo'}
            </button>
            <Link href="/dashboard/admin" className="mkt-btn-primary">
              ⚙️ Trang quản trị →
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Big stat grid */}
      <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Stat icon="👥" label="Tổng nhân sự" value={t.users} color="orange" />
        <Stat icon="⚡" label="Active hôm nay" value={t.activeToday} color="gold" />
        <Stat icon="📅" label="Active tuần này" value={t.activeThisWeek} color="pink" />
        <Stat icon="📚" label="Khóa học" value={t.courses} color="sky" />
        <Stat icon="❓" label="Câu hỏi" value={t.questions} color="orange" />
        <Stat icon="🎯" label="Bài thi" value={t.quizzes} color="gold" />
        <Stat icon="🏆" label="Huy hiệu trao" value={t.badgesAwarded} color="pink" />
        <Stat icon="📜" label="Chứng chỉ cấp" value={t.certificatesIssued} color="sky" />
      </section>

      {/* 2 charts + top performers + inactive alert */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Phân bố Level */}
        <section className="mkt-card p-6">
          <h2 className="mb-4 text-h2-mkt-sm">
            <span className="mkt-pill-orange !text-sm">PHÂN BỐ LEVEL</span>
          </h2>
          <BarChart
            data={data.levelDistribution.map((l) => ({
              label: `Lv.${l.order} ${l.name}`,
              value: l.count,
              color: 'bg-mkt-exp-bar',
            }))}
            format={(v) => `${v} user`}
          />
        </section>

        {/* Tỷ lệ đỗ quiz */}
        <section className="mkt-card p-6">
          <h2 className="mb-4 text-h2-mkt-sm">
            <span className="mkt-pill-orange !text-sm">TỶ LỆ ĐỖ BÀI THI</span>
          </h2>
          {data.quizPassRates.length === 0 ? (
            <p className="text-sm text-sky">Chưa có lượt thi nào.</p>
          ) : (
            <BarChart
              maxValue={100}
              data={data.quizPassRates.slice(0, 5).map((q) => ({
                label: q.title,
                value: q.passRate,
                color:
                  q.passRate >= 70 ? 'bg-mkt-pill-gold' : q.passRate >= 50 ? 'bg-orange' : 'bg-pink',
              }))}
              format={(v) => `${v}%`}
            />
          )}
        </section>

        {/* Top performers */}
        <section className="mkt-card p-6">
          <h2 className="mb-4 text-h2-mkt-sm">
            <span className="mkt-pill-orange !text-sm">TOP 5 NHÂN SỰ</span>
          </h2>
          {data.topPerformers.length === 0 ? (
            <p className="text-sm text-sky">Chưa có dữ liệu.</p>
          ) : (
            <ol className="space-y-2">
              {data.topPerformers.slice(0, 5).map((p, i) => (
                <motion.li
                  key={p.userId}
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
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-white">{p.name}</div>
                    <div className="text-[10px] text-sky">
                      Lv.{p.levelOrder} {p.levelName ?? ''} · {p.department ?? '—'}
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-black text-gold tabular-nums">
                    {p.exp} EXP
                  </span>
                </motion.li>
              ))}
            </ol>
          )}
        </section>

        {/* Cảnh báo inactive */}
        <section className="mkt-card p-6">
          <h2 className="mb-4 text-h2-mkt-sm">
            <span className="!bg-pink mkt-pill-orange !text-sm">⚠ KHÔNG HĐ ≥ 7 NGÀY</span>
          </h2>
          {data.inactiveUsers.length === 0 ? (
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-center">
              <div className="text-3xl">🎉</div>
              <p className="mt-2 text-sm text-gold">Tất cả nhân sự đều hoạt động trong tuần.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {data.inactiveUsers.slice(0, 5).map((u, i) => (
                <motion.li
                  key={u.userId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between gap-2 rounded-xl border border-pink/30 bg-pink/5 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">{u.name}</div>
                    <div className="text-[10px] text-sky">
                      {u.department ?? '—'} · {u.email}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-pill bg-pink/20 px-2 py-0.5 text-[10px] font-bold text-pink">
                    {u.daysSinceActive ?? '∞'} ngày
                  </span>
                </motion.li>
              ))}
              {data.inactiveUsers.length > 5 && (
                <li className="pt-1 text-center text-xs text-sky">
                  +{data.inactiveUsers.length - 5} người khác —{' '}
                  <Link href="/dashboard/admin" className="text-orange hover:underline">
                    xem báo cáo
                  </Link>
                </li>
              )}
            </ul>
          )}
        </section>
      </div>

      {/* Quick links Admin */}
      <section className="flex flex-wrap gap-3">
        <Link href="/dashboard/admin/courses" className="mkt-btn-secondary">
          📚 Quản lý khóa học
        </Link>
        <Link href="/dashboard/admin/users" className="mkt-btn-secondary">
          👥 Quản lý user
        </Link>
        <Link href="/dashboard/admin/questions" className="mkt-btn-secondary">
          ❓ Ngân hàng câu hỏi
        </Link>
        <Link href="/dashboard/admin/audit-logs" className="mkt-btn-secondary">
          📋 Audit log
        </Link>
      </section>
    </div>
  );
}

function Stat({
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
