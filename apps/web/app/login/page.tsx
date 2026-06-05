'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth-provider';
import { ApiError } from '@/lib/api-client';
import { BrandLogo } from '@/components/brand-logo';

export default function LoginPage(): JSX.Element {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent(): JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Đã đăng nhập thì điều hướng đi.
  useEffect(() => {
    if (authLoading || !user) return;
    const next = params?.get('next');
    if (user.needsCharacterSetup) router.replace('/onboarding');
    else router.replace(next && next.startsWith('/') ? next : '/dashboard');
  }, [user, authLoading, router, params]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const me = await login(email.trim(), password);
      if (me.needsCharacterSetup) {
        router.replace('/onboarding');
      } else {
        const next = params?.get('next');
        router.replace(next && next.startsWith('/') ? next : '/dashboard');
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Không thể kết nối tới máy chủ. Vui lòng thử lại.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Lớp tech grid mờ — đặc trưng brand */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Hào quang giữa trung tâm */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, #6FA9F9 0%, transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo + tiêu đề */}
        <div className="mb-8 text-center">
          <BrandLogo
            variant="horizontal-positive"
            priority
            className="mx-auto mb-4 h-auto w-52 object-contain"
          />
          <h1 className="mt-4 text-h2-mkt-sm text-shadow-mkt">
            HỌC ĐỂ <span className="text-orange">CHIẾN THẮNG</span>
          </h1>
          <p className="mt-2 text-sm text-ice">
            Đăng nhập để bắt đầu hành trình của bạn
          </p>
        </div>

        {/* Card đăng nhập */}
        <form onSubmit={handleSubmit} className="mkt-card space-y-5 p-8">
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-sky">
              Email công ty
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tenban@mktsoftware.vn"
              className="w-full rounded-xl border-2 border-sky/40 bg-navy-deep/60 px-4 py-3 text-white placeholder-sky/40 outline-none transition focus:border-orange focus:shadow-mkt-cta"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-sky">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border-2 border-sky/40 bg-navy-deep/60 px-4 py-3 text-white placeholder-sky/40 outline-none transition focus:border-orange focus:shadow-mkt-cta"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink"
              role="alert"
            >
              ⚠ {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mkt-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
