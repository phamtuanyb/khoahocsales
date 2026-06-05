'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LoadingScreen } from '@/components/loading-screen';
import { QuizForm } from '@/components/admin/quiz-form';
import { ApiError } from '@/lib/api-client';
import { adminApi, type AdminQuiz } from '@/lib/admin-api';

export default function EditQuizPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<AdminQuiz | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    adminApi
      .getQuiz(params.id)
      .then(setQuiz)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Lỗi'));
  }, [params?.id]);

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
        <Link href="/dashboard/admin/quizzes" className="mkt-btn-secondary inline-flex">
          ← Về danh sách
        </Link>
      </div>
    );
  }
  if (!quiz) return <LoadingScreen label="Đang tải" />;

  return (
    <div className="space-y-6">
      <div className="text-xs text-sky">
        <Link href="/dashboard/admin/quizzes" className="hover:text-orange">
          Bài thi
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">{quiz.title}</span>
      </div>
      <header>
        <span className="mkt-pill-orange !text-xs">SỬA BÀI THI</span>
        <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">{quiz.title.toUpperCase()}</h1>
      </header>
      <div className="mkt-card p-6">
        <QuizForm initial={quiz} />
      </div>
    </div>
  );
}
