'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { LoadingScreen } from '@/components/loading-screen';
import { QuestionForm } from '@/components/admin/question-form';
import { ApiError } from '@/lib/api-client';
import { adminApi, type AdminQuestion } from '@/lib/admin-api';

export default function EditQuestionPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [q, setQ] = useState<AdminQuestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    adminApi
      .getQuestion(params.id)
      .then(setQ)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Lỗi tải'));
  }, [params?.id]);

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
        <Link href="/dashboard/admin/questions" className="mkt-btn-secondary inline-flex">
          ← Về danh sách
        </Link>
      </div>
    );
  }
  if (!q) return <LoadingScreen label="Đang tải" />;

  return (
    <div className="space-y-6">
      <div className="text-xs text-sky">
        <Link href="/dashboard/admin/questions" className="hover:text-orange">
          Ngân hàng câu hỏi
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white line-clamp-1">{q.content.slice(0, 60)}...</span>
      </div>
      <header>
        <span className="mkt-pill-orange !text-xs">SỬA CÂU HỎI</span>
        <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">SỬA CÂU HỎI</h1>
      </header>
      <div className="mkt-card p-6">
        <QuestionForm initial={q} onSaved={() => router.push('/dashboard/admin/questions')} />
      </div>
    </div>
  );
}
