'use client';

import { useAuth } from '@/components/auth-provider';
import { LandingPage } from '@/components/landing/landing-page';

// Trang chủ public — landing page giới thiệu MKT Academy.
// Nếu user đã đăng nhập: nút CTA đổi thành "Vào học" → /dashboard.
// Chưa đăng nhập: nút "Đăng nhập" → /login.
// (HR cấp tài khoản, KHÔNG có đăng ký tự do.)
export default function HomePage(): JSX.Element {
  const { user, loading } = useAuth();
  const isLoggedIn = !loading && !!user;
  const loginHref = isLoggedIn
    ? user.needsCharacterSetup
      ? '/onboarding'
      : '/dashboard'
    : '/login';

  return <LandingPage isLoggedIn={isLoggedIn} loginHref={loginHref} />;
}
