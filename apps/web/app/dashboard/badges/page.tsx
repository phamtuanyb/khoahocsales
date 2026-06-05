'use client';

import { useEffect, useState } from 'react';
import { BadgeGrid } from '@/components/dashboard/badge-grid';
import { LoadingScreen } from '@/components/loading-screen';
import { ApiError } from '@/lib/api-client';
import { gamificationApi } from '@/lib/gamification-api';
import type { BadgeWithStatus } from '@/lib/gamification-types';

export default function BadgesPage(): JSX.Element {
  const [badges, setBadges] = useState<BadgeWithStatus[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    gamificationApi
      .listBadges()
      .then((d) => mounted && setBadges(d))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Không tải được huy hiệu'),
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
  if (!badges) return <LoadingScreen label="Đang tải huy hiệu" />;

  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  return (
    <div className="space-y-6">
      <header>
        <span className="mkt-pill-orange !text-xs">BỘ SƯU TẬP</span>
        <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">
          HUY HIỆU CỦA <span className="text-gold">BẠN</span>
        </h1>
        <p className="mt-1 text-sm text-ice">
          Đã đạt {earned.length}/{badges.length} huy hiệu. Hoàn thành điều kiện để mở khóa thêm.
        </p>
      </header>

      <BadgeGrid badges={badges} variant="full" />

      {/* Danh sách điều kiện badge — admin sẽ tinh chỉnh ở Sprint 7 */}
      <section className="mkt-card p-6">
        <h2 className="mb-4 text-h2-mkt-sm">
          <span className="mkt-pill-orange !text-sm">ĐIỀU KIỆN</span>
        </h2>
        <ul className="space-y-3">
          {[...earned, ...locked].map((b) => (
            <li key={b.id} className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${
                  b.earned
                    ? 'bg-mkt-pill-gold text-navy-deep'
                    : 'bg-navy-deep/60 text-sky/40 grayscale'
                }`}
              >
                {b.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-bold ${b.earned ? 'text-white' : 'text-sky/60'}`}>
                  {b.name}{' '}
                  {b.earned && (
                    <span className="ml-2 rounded-pill bg-gold/20 px-2 py-0.5 text-[10px] uppercase text-gold">
                      Đã đạt
                    </span>
                  )}
                </div>
                <div className="text-xs text-ice">{b.description}</div>
                {b.earnedAt && (
                  <div className="text-[10px] text-sky">
                    Đạt ngày {new Date(b.earnedAt).toLocaleDateString('vi-VN')}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
