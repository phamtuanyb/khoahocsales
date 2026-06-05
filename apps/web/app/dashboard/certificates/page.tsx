'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LoadingScreen } from '@/components/loading-screen';
import { ApiError } from '@/lib/api-client';
import { gamificationApi } from '@/lib/gamification-api';
import type { CertificateView } from '@/lib/gamification-types';

export default function CertificatesPage(): JSX.Element {
  const [certs, setCerts] = useState<CertificateView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    gamificationApi
      .listCertificates()
      .then((d) => mounted && setCerts(d))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Không tải được chứng chỉ'),
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
  if (!certs) return <LoadingScreen label="Đang tải chứng chỉ" />;

  return (
    <div className="space-y-6">
      <header>
        <span className="mkt-pill-orange !text-xs">CHỨNG CHỈ ĐIỆN TỬ</span>
        <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">
          CHỨNG CHỈ CỦA <span className="text-gold">BẠN</span>
        </h1>
        <p className="mt-1 text-sm text-ice">
          Mỗi chứng chỉ có mã xác thực duy nhất. Bấm vào để xem và in / lưu PDF.
        </p>
      </header>

      {certs.length === 0 ? (
        <div className="mkt-card p-8 text-center">
          <span className="text-5xl">📜</span>
          <p className="mt-3 text-body-mkt text-ice">
            Chưa có chứng chỉ. Hoàn thành 100% khóa học hoặc vượt Boss Battle Level để nhận.
          </p>
          <Link href="/dashboard/learn" className="mkt-btn-primary mt-5 inline-flex">
            📚 Vào khu vực học
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certs.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                href={`/dashboard/certificates/${c.id}`}
                className="mkt-card group block overflow-hidden p-6 transition hover:-translate-y-1 hover:shadow-mkt-3d"
              >
                <div className="mb-4 flex items-start justify-between">
                  <span className={`mkt-pill-orange !text-xs ${c.type === 'LEVEL' ? '!bg-gold !text-navy-deep' : ''}`}>
                    {c.type === 'LEVEL' ? 'LEVEL' : 'KHÓA HỌC'}
                  </span>
                  <span className="text-4xl">{c.type === 'LEVEL' ? '🏆' : '🎓'}</span>
                </div>
                <h3 className="text-lg font-black uppercase text-white">{c.title}</h3>
                <p className="mt-1 text-xs text-ice">{c.subtitle}</p>
                <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-sky">Mã: {c.code}</span>
                  <span className="text-gold">
                    {new Date(c.issuedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
