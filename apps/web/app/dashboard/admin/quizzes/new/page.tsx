'use client';

import Link from 'next/link';
import { QuizForm } from '@/components/admin/quiz-form';

export default function NewQuizPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="text-xs text-sky">
        <Link href="/dashboard/admin/quizzes" className="hover:text-orange">
          Bài thi
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">Tạo mới</span>
      </div>
      <header>
        <span className="mkt-pill-orange !text-xs">TẠO BÀI THI MỚI</span>
        <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">BÀI THI MỚI</h1>
      </header>
      <div className="mkt-card p-6">
        <QuizForm />
      </div>
    </div>
  );
}
