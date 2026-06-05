'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart } from '@/components/admin/bar-chart';
import { LoadingScreen } from '@/components/loading-screen';
import { adminApi, downloadExcel, type AdminOverview } from '@/lib/admin-api';
import { ApiError } from '@/lib/api-client';

export default function AdminOverviewPage(): JSX.Element {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<null | 'overview' | 'users'>(null);

  useEffect(() => {
    let mounted = true;
    adminApi
      .overview()
      .then((result) => mounted && setData(result))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Lỗi'));
    return () => {
      mounted = false;
    };
  }, []);

  async function handleExport(kind: 'overview' | 'users'): Promise<void> {
    setExporting(kind);
    try {
      const filename =
        kind === 'overview'
          ? `mkt-overview-${new Date().toISOString().slice(0, 10)}.xlsx`
          : `mkt-users-${new Date().toISOString().slice(0, 10)}.xlsx`;
      await downloadExcel(`/admin/analytics/export/${kind}`, filename);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Xuất Excel thất bại');
    } finally {
      setExporting(null);
    }
  }

  if (error) {
    return (
      <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
        {error}
      </div>
    );
  }

  if (!data) return <LoadingScreen label="Đang tải báo cáo" />;

  const { totals } = data;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mkt-pill-orange !text-xs">ADMIN · BÁO CÁO TỔNG QUAN</span>
          <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">
            ĐIỀU HÀNH <span className="text-orange">MKT ACADEMY</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleExport('overview')}
            disabled={exporting !== null}
            className="mkt-btn-primary !text-sm disabled:opacity-60"
          >
            {exporting === 'overview' ? 'Đang xuất...' : 'Xuất Excel báo cáo'}
          </button>
          <button
            type="button"
            onClick={() => handleExport('users')}
            disabled={exporting !== null}
            className="mkt-btn-secondary !text-sm disabled:opacity-60"
          >
            {exporting === 'users' ? 'Đang xuất...' : 'Xuất Excel users'}
          </button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <StatCard label="Tổng nhân sự" value={totals.users} accent="orange" />
        <StatCard label="Active hôm nay" value={totals.activeToday} accent="gold" />
        <StatCard label="Active tuần này" value={totals.activeThisWeek} accent="pink" />
        <StatCard label="Số khóa học" value={totals.courses} accent="sky" />
        <StatCard label="Câu hỏi" value={totals.questions} accent="orange" />
        <StatCard label="Bài thi" value={totals.quizzes} accent="gold" />
        <StatCard label="Huy hiệu trao" value={totals.badgesAwarded} accent="pink" />
        <StatCard label="Chứng chỉ cấp" value={totals.certificatesIssued} accent="sky" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="mkt-card p-6">
          <h2 className="mb-4 text-h2-mkt-sm">
            <span className="mkt-pill-orange !text-sm">PHÂN BỐ LEVEL</span>
          </h2>
          <BarChart
            data={data.levelDistribution.map((item) => ({
              label: `Lv.${item.order} ${item.name}`,
              value: item.count,
              color: 'bg-mkt-exp-bar',
            }))}
            format={(value) => `${value} user`}
          />
        </section>

        <section className="mkt-card p-6">
          <h2 className="mb-4 text-h2-mkt-sm">
            <span className="mkt-pill-orange !text-sm">TỶ LỆ ĐỖ BÀI THI</span>
          </h2>
          {data.quizPassRates.length === 0 ? (
            <p className="text-sm text-sky">Chưa có lượt thi nào.</p>
          ) : (
            <BarChart
              maxValue={100}
              data={data.quizPassRates.map((item) => ({
                label: item.title,
                value: item.passRate,
                color:
                  item.passRate >= 70
                    ? 'bg-mkt-pill-gold'
                    : item.passRate >= 50
                      ? 'bg-orange'
                      : 'bg-pink',
              }))}
              format={(value) => `${value}%`}
            />
          )}
        </section>

        <section className="mkt-card p-6">
          <h2 className="mb-4 text-h2-mkt-sm">
            <span className="mkt-pill-orange !text-sm">TIẾN ĐỘ KHÓA HỌC TRUNG BÌNH</span>
          </h2>
          {data.courseProgress.length === 0 ? (
            <p className="text-sm text-sky">Chưa có khóa học.</p>
          ) : (
            <BarChart
              maxValue={100}
              data={data.courseProgress.map((item) => ({
                label: item.title,
                value: item.avgCompletionPercent,
                color: 'bg-mkt-exp-bar',
              }))}
              format={(value) => `${value}%`}
            />
          )}
        </section>

        <section className="mkt-card p-6">
          <h2 className="mb-4 text-h2-mkt-sm">
            <span className="mkt-pill-orange !text-sm">TOP PERFORMERS</span>
          </h2>
          {data.topPerformers.length === 0 ? (
            <p className="text-sm text-sky">Chưa có dữ liệu.</p>
          ) : (
            <ol className="space-y-1.5">
              {data.topPerformers.map((item, index) => (
                <li
                  key={item.userId}
                  className="flex items-center gap-3 rounded-lg border border-sky/20 bg-navy-deep/30 px-3 py-2"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      index < 3 ? 'bg-mkt-pill-gold text-navy-deep' : 'bg-navy-deep text-white'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-white">{item.name}</div>
                    <div className="text-[10px] text-sky">
                      Lv.{item.levelOrder} {item.levelName ?? ''} · {item.department ?? '—'}
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-black text-gold tabular-nums">
                    {item.exp} EXP
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="mkt-card p-6">
        <h2 className="mb-4 text-h2-mkt-sm">
          <span className="!bg-pink mkt-pill-orange !text-sm">KHÔNG HOẠT ĐỘNG ≥ 7 NGÀY</span>
        </h2>
        {data.inactiveUsers.length === 0 ? (
          <p className="text-sm text-gold">Tuyệt vời. Mọi nhân sự đều hoạt động trong tuần.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] font-bold uppercase tracking-widest text-sky">
                <tr>
                  <th className="pb-2">Họ tên</th>
                  <th className="pb-2">Phòng ban</th>
                  <th className="pb-2">Hoạt động cuối</th>
                  <th className="pb-2 text-right">Số ngày</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {data.inactiveUsers.map((item) => (
                  <tr key={item.userId} className="border-t border-sky/10">
                    <td className="py-2">
                      <div className="font-bold">{item.name}</div>
                      <div className="text-[10px] text-sky">{item.email}</div>
                    </td>
                    <td className="py-2 text-ice">{item.department ?? '—'}</td>
                    <td className="py-2 text-ice">
                      {item.lastActiveAt ? new Date(item.lastActiveAt).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="py-2 text-right">
                      <span className="rounded-pill bg-pink/20 px-2 py-0.5 text-xs font-bold text-pink">
                        {item.daysSinceActive ?? '∞'} ngày
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: 'orange' | 'gold' | 'pink' | 'sky';
}): JSX.Element {
  const color =
    accent === 'orange'
      ? 'text-orange'
      : accent === 'gold'
        ? 'text-gold'
        : accent === 'pink'
          ? 'text-pink'
          : 'text-sky';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mkt-card p-4"
    >
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-sky">{label}</div>
        <div className={`text-2xl font-black tabular-nums ${color}`}>{value}</div>
      </div>
    </motion.div>
  );
}
