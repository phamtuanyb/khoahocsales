'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { UserRole } from '@mkt-academy/types';
import { useAuth } from './auth-provider';
import { LoadingScreen } from './loading-screen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  // Nếu truyền, chỉ các vai trò trong danh sách mới được vào.
  allowedRoles?: UserRole[];
  // Nếu true, không bắt buộc user phải hoàn tất khởi tạo nhân vật
  // (dùng riêng cho trang /onboarding).
  skipCharacterCheck?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  skipCharacterCheck = false,
}: ProtectedRouteProps): JSX.Element | null {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const next = pathname && pathname !== '/login' ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${next}`);
      return;
    }

    // Bắt onboarding nếu chưa khởi tạo nhân vật (avatar null).
    if (!skipCharacterCheck && user.needsCharacterSetup && pathname !== '/onboarding') {
      router.replace('/onboarding');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace('/dashboard');
    }
  }, [user, loading, router, pathname, allowedRoles, skipCharacterCheck]);

  if (loading) return <LoadingScreen label="Đang xác thực" />;
  if (!user) return null;
  if (!skipCharacterCheck && user.needsCharacterSetup && pathname !== '/onboarding') return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
