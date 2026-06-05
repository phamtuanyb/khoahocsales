'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserRole } from '@mkt-academy/types';
import { BrandLogo } from '@/components/brand-logo';
import { useAuth } from './auth-provider';

interface NavItem {
  href: string;
  label: string;
  roles?: UserRole[];
}

const NAV: readonly NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/learn', label: 'Khu vực học' },
  { href: '/dashboard/leaderboard', label: 'Bảng xếp hạng' },
  { href: '/dashboard/badges', label: 'Huy hiệu' },
  { href: '/dashboard/certificates', label: 'Chứng chỉ' },
  { href: '/dashboard/ai-coach', label: 'AI Coach' },
  { href: '/dashboard/team', label: 'Theo dõi team', roles: [UserRole.MANAGER, UserRole.ADMIN] },
  { href: '/dashboard/admin', label: 'Quản trị', roles: [UserRole.ADMIN] },
  { href: '/dashboard/guide', label: 'Hướng dẫn' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps): JSX.Element {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const visibleNav = NAV.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 flex h-screen w-72 shrink-0 flex-col gap-6
        border-r border-[#E6E3E7] bg-white p-6 shadow-[12px_0_38px_rgba(28,41,61,0.08)]
        transition-transform duration-300
        lg:sticky lg:top-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF3FF] text-lg font-black text-[#005AB3] lg:hidden"
        aria-label="Đóng menu"
      >
        ×
      </button>

      <Link href="/dashboard" onClick={onClose} className="block">
        <BrandLogo variant="horizontal-positive" priority className="h-auto w-44 object-contain" />
      </Link>

      {user && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#D9E7FF] bg-[#F8FBFF] p-3"
        >
          <div className="min-w-0">
            <div className="truncate text-base font-black text-[#1B1B1D]">{user.name}</div>
            <div className="truncate text-xs font-black uppercase tracking-widest text-[#0073E0]">
              {roleLabel(user.role)}
            </div>
          </div>
        </motion.div>
      )}

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {visibleNav.map((item) => {
          const active =
            item.href === '/dashboard' ? pathname === '/dashboard' : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`group flex items-center rounded-xl px-4 py-3 text-[1.05rem] font-black uppercase tracking-wide transition ${
                active
                  ? 'bg-[#FF7A00] text-white shadow-[0_12px_24px_rgba(255,122,0,0.24)]'
                  : 'text-[#414754] hover:bg-[#EAF3FF] hover:text-[#005AB3]'
              }`}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={logout}
        className="rounded-xl border border-[#D9E7FF] px-4 py-3 text-base font-black uppercase tracking-wide text-[#005AB3] transition hover:border-[#FF7A00] hover:text-[#FF7A00]"
      >
        Đăng xuất
      </button>
    </aside>
  );
}

function roleLabel(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'Quản trị viên';
    case UserRole.MANAGER:
      return 'Trưởng phòng';
    case UserRole.LEARNER:
      return 'Nhân sự';
    default:
      return role;
  }
}
