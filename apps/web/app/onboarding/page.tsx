'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/components/auth-provider';
import { ApiError, api } from '@/lib/api-client';
import {
  AVATAR_PRESETS,
  DEFAULT_AVATAR_KEY,
  type AvatarPreset,
} from '@/lib/avatars';

export default function OnboardingPage(): JSX.Element {
  return (
    <ProtectedRoute skipCharacterCheck>
      <OnboardingScreen />
    </ProtectedRoute>
  );
}

function OnboardingScreen(): JSX.Element {
  const router = useRouter();
  const { user, refreshMe } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatarKey, setAvatarKey] = useState<string>(DEFAULT_AVATAR_KEY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Khởi tạo tên hiển thị từ user.name nếu khác mặc định.
  useEffect(() => {
    if (user) setDisplayName(user.name);
  }, [user]);

  // Đã hoàn tất setup mà còn ở đây → chuyển đi.
  useEffect(() => {
    if (user && !user.needsCharacterSetup) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.patch('/users/me/setup-character', {
        displayName: displayName.trim(),
        avatar: avatarKey,
      });
      await refreshMe();
      router.replace('/dashboard');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Không thể lưu thông tin. Thử lại sau.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mx-auto max-w-4xl"
      >
        {/* Header chào mừng */}
        <div className="mb-8 text-center">
          <span className="mkt-pill-navy">CHÀO MỪNG ĐẾN MKT ACADEMY</span>
          <h1 className="mt-4 text-h2-mkt-sm text-shadow-mkt md:text-h1-mkt-sm">
            KHỞI TẠO <span className="text-orange">NHÂN VẬT</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-body-mkt text-ice">
            Chọn avatar và đặt tên hiển thị để bắt đầu hành trình. Bạn sẽ vào Giai đoạn Onboarding
            7 ngày với Level 1 — Tân Binh.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mkt-card space-y-8 p-8">
          {/* Bước 1: chọn avatar */}
          <section>
            <h2 className="mb-4 text-h2-mkt-sm tracking-tight">
              <span className="mkt-pill-orange !text-sm">BƯỚC 1</span>{' '}
              <span className="ml-2">CHỌN AVATAR</span>
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {AVATAR_PRESETS.map((avatar) => (
                <AvatarCard
                  key={avatar.key}
                  avatar={avatar}
                  selected={avatarKey === avatar.key}
                  onSelect={() => setAvatarKey(avatar.key)}
                />
              ))}
            </div>
          </section>

          {/* Bước 2: tên hiển thị */}
          <section>
            <h2 className="mb-4 text-h2-mkt-sm tracking-tight">
              <span className="mkt-pill-orange !text-sm">BƯỚC 2</span>{' '}
              <span className="ml-2">TÊN HIỂN THỊ</span>
            </h2>
            <input
              type="text"
              required
              minLength={2}
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="w-full rounded-xl border-2 border-sky/40 bg-navy-deep/60 px-4 py-3 text-lg text-white placeholder-sky/40 outline-none transition focus:border-orange focus:shadow-mkt-cta"
            />
            <p className="mt-2 text-xs text-sky">
              Tên này sẽ hiển thị trên leaderboard và mọi nơi trong app.
            </p>
          </section>

          {error && (
            <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || displayName.trim().length < 2}
            className="mkt-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Đang tạo nhân vật...' : 'Bắt đầu hành trình →'}
          </button>
        </form>
      </motion.div>
    </main>
  );
}

function AvatarCard({
  avatar,
  selected,
  onSelect,
}: {
  avatar: AvatarPreset;
  selected: boolean;
  onSelect: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col items-center gap-2 rounded-card border-2 p-4 transition ${
        selected
          ? 'border-orange bg-navy-deep/70 shadow-mkt-cta'
          : 'border-sky/30 bg-navy-deep/30 hover:border-sky'
      }`}
    >
      <motion.div
        animate={selected ? { scale: [1, 1.1, 1] } : { scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${avatar.bg} text-4xl ring-4 ${avatar.ring} ${
          selected ? 'shadow-mkt-badge' : 'opacity-80'
        }`}
      >
        {avatar.emoji}
      </motion.div>
      <span className="text-center text-xs font-bold uppercase tracking-wide text-white">
        {avatar.name}
      </span>
      {selected && (
        <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gold text-navy-deep shadow-mkt-badge">
          ✓
        </span>
      )}
    </button>
  );
}
