'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@mkt-academy/types';
import { LoadingScreen } from '@/components/loading-screen';
import { useAuth } from '@/components/auth-provider';

interface SubNavItem {
  href: string;
  label: string;
  group: 'CONTENT' | 'CONFIG' | 'USERS' | 'REPORT' | 'GUIDE';
}

const SUB_NAV: readonly SubNavItem[] = [
  { href: '/dashboard/admin', label: 'Tổng quan', group: 'REPORT' },
  { href: '/dashboard/admin/courses', label: 'Khóa học', group: 'CONTENT' },
  { href: '/dashboard/admin/questions', label: 'Ngân hàng câu hỏi', group: 'CONTENT' },
  { href: '/dashboard/admin/quizzes', label: 'Bài thi', group: 'CONTENT' },
  { href: '/dashboard/admin/coach-scenarios', label: 'Kịch bản AI Coach', group: 'CONTENT' },
  { href: '/dashboard/admin/levels', label: 'Level', group: 'CONFIG' },
  { href: '/dashboard/admin/exp-rules', label: 'Bảng quy đổi EXP', group: 'CONFIG' },
  { href: '/dashboard/admin/badges', label: 'Huy hiệu', group: 'CONFIG' },
  { href: '/dashboard/admin/missions', label: 'Nhiệm vụ ngày', group: 'CONFIG' },
  { href: '/dashboard/admin/departments', label: 'Phòng ban', group: 'USERS' },
  { href: '/dashboard/admin/users', label: 'Người dùng', group: 'USERS' },
  { href: '/dashboard/admin/audit-logs', label: 'Audit log', group: 'USERS' },
  { href: '/dashboard/admin/guide', label: 'Hướng dẫn admin', group: 'GUIDE' },
];

const GROUP_LABELS: Record<SubNavItem['group'], string> = {
  REPORT: 'Báo cáo',
  CONTENT: 'Soạn nội dung',
  CONFIG: 'Cấu hình hệ thống',
  USERS: 'Quản trị',
  GUIDE: 'Hướng dẫn',
};

export default function AdminLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return <LoadingScreen label="Đang xác thực" />;

  if (!user || user.role !== UserRole.ADMIN) {
    return (
      <div className="mkt-card p-8 text-center">
        <h1 className="text-h2-mkt-sm text-pink">Truy cập bị từ chối</h1>
        <p className="mt-3 text-body-mkt text-ice">
          Khu vực này chỉ dành cho vai trò Admin. Vai trò hiện tại của bạn: {user?.role ?? 'Khách'}.
        </p>
      </div>
    );
  }

  const groups: Array<{ key: SubNavItem['group']; items: SubNavItem[] }> = [
    { key: 'REPORT', items: SUB_NAV.filter((n) => n.group === 'REPORT') },
    { key: 'CONTENT', items: SUB_NAV.filter((n) => n.group === 'CONTENT') },
    { key: 'CONFIG', items: SUB_NAV.filter((n) => n.group === 'CONFIG') },
    { key: 'USERS', items: SUB_NAV.filter((n) => n.group === 'USERS') },
    { key: 'GUIDE', items: SUB_NAV.filter((n) => n.group === 'GUIDE') },
  ];

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="shrink-0 lg:w-64">
        <div className="sticky top-24 rounded-2xl border border-[#E6E3E7] bg-white p-4 shadow-[0_16px_38px_rgba(28,41,61,0.07)]">
          <div className="mb-4 rounded-xl bg-[#EAF3FF] px-4 py-3">
            <span className="text-base font-black uppercase tracking-widest text-[#005AB3]">
              Admin panel
            </span>
          </div>
          {groups.map((g) => (
            <div key={g.key} className="mb-4 last:mb-0">
              <div className="mb-2 px-2 text-xs font-black uppercase tracking-widest text-[#7B8494]">
                {GROUP_LABELS[g.key]}
              </div>
              <nav className="flex flex-col gap-1">
                {g.items.map((item) => {
                  const active =
                    item.href === '/dashboard/admin'
                      ? pathname === '/dashboard/admin'
                      : pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-lg px-3 py-2.5 text-[0.98rem] font-black transition ${
                        active
                          ? 'bg-[#FF7A00] text-white shadow-[0_10px_22px_rgba(255,122,0,0.22)]'
                          : 'text-[#414754] hover:bg-[#EAF3FF] hover:text-[#005AB3]'
                      }`}
                    >
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
