'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// Error boundary cho mọi route trong /dashboard.
// Next.js App Router tự bắt lỗi runtime và render component này.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    // Log lên service monitor sau này (Sentry, Datadog...)
    console.error('[Dashboard error]', error);
  }, [error]);

  return (
    <div className="mkt-card flex flex-col items-center gap-4 p-8 text-center">
      <div className="text-6xl">⚠️</div>
      <h1 className="text-h2-mkt-sm text-shadow-mkt">
        ĐÃ XẢY RA <span className="text-pink">LỖI</span>
      </h1>
      <p className="max-w-lg text-sm text-ice">
        Trang đang gặp sự cố. Bạn có thể thử lại hoặc quay về dashboard. Nếu lặp lại, vui lòng báo
        cho đội ngũ vận hành kèm mã lỗi bên dưới.
      </p>
      {error.digest && (
        <code className="rounded bg-navy-deep/60 px-3 py-1 font-mono text-xs text-sky">
          {error.digest}
        </code>
      )}
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="mkt-btn-primary">
          🔄 Thử lại
        </button>
        <Link href="/dashboard" className="mkt-btn-secondary">
          ← Về dashboard
        </Link>
      </div>
    </div>
  );
}
