import Link from 'next/link';

export default function NotFound(): JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="mkt-card max-w-md p-8 text-center">
        <div className="text-7xl">🧭</div>
        <h1 className="mt-4 text-h2-mkt-sm text-shadow-mkt">
          KHÔNG TÌM THẤY <span className="text-orange">TRANG</span>
        </h1>
        <p className="mt-3 text-sm text-ice">
          Đường dẫn này không tồn tại hoặc đã được di chuyển. Hãy quay về dashboard để tiếp tục
          hành trình.
        </p>
        <div className="mt-6">
          <Link href="/dashboard" className="mkt-btn-primary">
            ← Về dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
