'use client';

import { UserRole } from '@mkt-academy/types';
import { useAuth } from '@/components/auth-provider';
import { AdminView } from '@/components/dashboard/admin-view';
import { LearnerView } from '@/components/dashboard/learner-view';
import { ManagerView } from '@/components/dashboard/manager-view';
import { LoadingScreen } from '@/components/loading-screen';

// Dashboard router theo role:
// - LEARNER → góc nhân sự cá nhân (Level, EXP, Mission, Badge, Course)
// - MANAGER → tổng quan team (top 5 + cảnh báo inactive)
// - ADMIN   → tổng quan toàn công ty (KPI hệ thống + chart + Excel export)
export default function DashboardPage(): JSX.Element {
  const { user, loading } = useAuth();

  if (loading || !user) return <LoadingScreen label="Đang tải dashboard" />;

  switch (user.role) {
    case UserRole.ADMIN:
      return <AdminView />;
    case UserRole.MANAGER:
      return <ManagerView />;
    case UserRole.LEARNER:
    default:
      return <LearnerView />;
  }
}
