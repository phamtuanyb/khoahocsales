'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeGrid } from '@/components/dashboard/badge-grid';
import { DailyMissionWidget } from '@/components/dashboard/daily-mission-widget';
import { EnrolledCoursesWidget } from '@/components/dashboard/enrolled-courses';
import { HeroProfile } from '@/components/dashboard/hero-profile';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { RecentMilestonesWidget } from '@/components/dashboard/recent-milestones';
import { LoadingScreen } from '@/components/loading-screen';
import { ApiError } from '@/lib/api-client';
import { gamificationApi } from '@/lib/gamification-api';
import type { DashboardData } from '@/lib/gamification-types';

// Dashboard cá nhân cho LEARNER — đầy đủ theo spec mục 5.2.
export function LearnerView(): JSX.Element {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    gamificationApi
      .getDashboard()
      .then((d) => mounted && setData(d))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Không tải được dashboard'),
      );
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
  if (!data) return <LoadingScreen label="Đang tải dashboard" />;

  return (
    <div className="space-y-6">
      <HeroProfile data={data} />
      <KpiCards kpi={data.kpi} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <DailyMissionWidget missions={data.dailyMissions} />
          <EnrolledCoursesWidget courses={data.enrolledCourses} />
        </div>
        <div className="space-y-6">
          <BadgeGrid badges={data.badges} variant="preview" />
          <RecentMilestonesWidget milestones={data.recentMilestones} />
        </div>
      </div>

      <section className="flex flex-wrap gap-3">
        <Link href="/dashboard/learn" className="mkt-btn-primary">
          📚 Vào khu vực học
        </Link>
        <Link href="/dashboard/leaderboard" className="mkt-btn-secondary">
          🏆 Bảng xếp hạng
        </Link>
        <Link href="/dashboard/badges" className="mkt-btn-secondary">
          🎖 Tất cả huy hiệu
        </Link>
        <Link href="/dashboard/certificates" className="mkt-btn-secondary">
          📜 Chứng chỉ của tôi
        </Link>
      </section>
    </div>
  );
}
