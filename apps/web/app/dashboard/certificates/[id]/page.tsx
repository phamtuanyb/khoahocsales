'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { LoadingScreen } from '@/components/loading-screen';
import { ApiError } from '@/lib/api-client';
import { gamificationApi } from '@/lib/gamification-api';
import type { CertificateView } from '@/lib/gamification-types';
import { BrandLogo } from '@/components/brand-logo';

// Trang chi tiết chứng chỉ — render đẹp + nút In/Lưu PDF (window.print)
// + nút copy mã xác thực.
export default function CertificateDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [cert, setCert] = useState<CertificateView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    gamificationApi
      .getCertificate(id)
      .then(setCert)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Không tải được chứng chỉ'),
      );
  }, [id]);

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
        <Link href="/dashboard/certificates" className="mkt-btn-secondary inline-flex">
          ← Về danh sách chứng chỉ
        </Link>
      </div>
    );
  }
  if (!cert) return <LoadingScreen label="Đang tải chứng chỉ" />;

  function handlePrint(): void {
    window.print();
  }

  async function copyCode(): Promise<void> {
    if (!cert) return;
    try {
      await navigator.clipboard.writeText(cert.code);
      alert('Đã sao chép mã xác thực');
    } catch {
      // fallback im lặng
    }
  }

  return (
    <div className="space-y-6 print:bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/dashboard/certificates" className="text-xs text-sky hover:text-orange">
          ← Về danh sách chứng chỉ
        </Link>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copyCode} className="mkt-btn-secondary">
            🔗 Sao chép mã
          </button>
          <button type="button" onClick={handlePrint} className="mkt-btn-primary">
            🖨 In / Lưu PDF
          </button>
        </div>
      </div>

      {/* Khu vực CHỨNG CHỈ — đẹp + sẵn sàng để print */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-card p-2 print:p-0"
        id="cert-printable"
      >
        <div
          className="on-dark relative aspect-[1.414/1] w-full overflow-hidden rounded-card p-12 text-center text-white shadow-mkt-3d print:rounded-none print:shadow-none"
          style={{
            background:
              'linear-gradient(135deg, #4F83D9 0%, #5F96EA 42%, #6FA9F9 82%, #A9C9FA 100%)',
          }}
        >
          {/* Viền vàng kép */}
          <div className="absolute inset-4 rounded-2xl border-4 border-gold/80" />
          <div className="absolute inset-6 rounded-xl border border-gold/40" />

          {/* Tia bokeh trang trí */}
          <div
            className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, #F59E0B, transparent 70%)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, #F97316, transparent 70%)' }}
          />

          {/* Logo MKT giả lập */}
          <BrandLogo
            variant="vertical-negative"
            priority
            className="relative mx-auto mb-2 h-20 w-20 object-contain"
          />
          <div className="relative text-[10px] font-bold uppercase tracking-widest text-ice">
            PHẦN MỀM MKT — MKT ACADEMY
          </div>

          {/* Tiêu đề */}
          <h1 className="relative mt-6 font-display text-3xl font-black uppercase tracking-tight md:text-5xl">
            CHỨNG CHỈ HOÀN THÀNH
          </h1>
          <div className="relative mx-auto mt-2 h-1 w-32 bg-gold" />

          {/* Trao cho */}
          <div className="relative mt-8 text-sm uppercase tracking-widest text-ice">
            Chứng nhận trao cho
          </div>
          <div className="relative mt-2 font-display text-3xl font-black uppercase md:text-4xl">
            {cert.recipientName.toUpperCase()}
          </div>

          {/* Subtitle */}
          <div className="relative mt-6 text-sm uppercase tracking-widest text-ice">
            ĐÃ HOÀN THÀNH XUẤT SẮC
          </div>
          <div className="relative mt-1 font-display text-xl font-bold uppercase text-gold md:text-2xl">
            {cert.title.toUpperCase()}
          </div>
          <p className="relative mt-1 text-xs text-ice">{cert.subtitle}</p>

          {/* Footer */}
          <div className="relative mt-10 grid grid-cols-2 gap-6 text-[10px] uppercase tracking-widest md:gap-12">
            <div className="text-right">
              <div className="text-ice">Ngày cấp</div>
              <div className="mt-1 text-base font-bold text-white">
                {new Date(cert.issuedAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </div>
            </div>
            <div className="text-left">
              <div className="text-ice">Mã xác thực</div>
              <div className="mt-1 font-mono text-base font-bold text-gold">{cert.code}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CSS chỉ áp dụng khi in */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          @page { size: A4 landscape; margin: 0; }
          .mkt-card, header, nav, aside { display: none !important; }
          main { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
