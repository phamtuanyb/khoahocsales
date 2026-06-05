'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoadingScreen } from '@/components/loading-screen';
import { ApiError } from '@/lib/api-client';
import { adminApi, type AdminQuiz } from '@/lib/admin-api';

export default function AdminQuizzesListPage(): JSX.Element {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<AdminQuiz[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    try {
      const list = await adminApi.listQuizzes();
      setQuizzes(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(q: AdminQuiz): Promise<void> {
    if (!confirm(`Xóa bài thi "${q.title}"? Mọi lượt làm đã có sẽ bị xóa theo.`)) return;
    try {
      await adminApi.deleteQuiz(q.id);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="mkt-pill-orange !text-xs">CẤU HÌNH BÀI THI</span>
          <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">BÀI THI</h1>
          <p className="mt-1 text-sm text-ice">
            Module quiz (gắn vào mô-đun) + Boss Battle (gắn vào Level).
          </p>
        </div>
        <Link href="/dashboard/admin/quizzes/new" className="mkt-btn-primary !text-sm">
          + Tạo bài thi mới
        </Link>
      </header>

      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      {!quizzes ? (
        <LoadingScreen label="Đang tải" />
      ) : quizzes.length === 0 ? (
        <div className="mkt-card p-8 text-center text-sm text-sky">
          Chưa có bài thi.
        </div>
      ) : (
        <section className="mkt-card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-navy-deep/60 text-left text-[10px] font-bold uppercase tracking-widest text-sky">
              <tr>
                <th className="px-4 py-3">Bài thi</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3 text-center">Số câu</th>
                <th className="px-4 py-3 text-center">Pass</th>
                <th className="px-4 py-3 text-center">Time</th>
                <th className="px-4 py-3 text-center">Lượt</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q.id} className="border-t border-sky/10">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/admin/quizzes/${q.id}`}
                      className="font-bold text-white hover:text-orange"
                    >
                      {q.title}
                    </Link>
                    {q.module && <div className="text-[10px] text-sky">→ {q.module.title}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {q.levelId ? (
                      <span className="rounded-pill bg-pink/20 px-2 py-0.5 text-[10px] font-bold uppercase text-pink">
                        ⚔️ Boss · Lv.{q.level?.order}
                      </span>
                    ) : (
                      <span className="rounded-pill bg-sky/20 px-2 py-0.5 text-[10px] font-bold uppercase text-sky">
                        Module Quiz
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gold">{q._count?.questions ?? 0}</td>
                  <td className="px-4 py-3 text-center text-orange">{q.passScore}%</td>
                  <td className="px-4 py-3 text-center text-ice">
                    {Math.round(q.timeLimitSec / 60)}p
                  </td>
                  <td className="px-4 py-3 text-center text-ice">{q._count?.attempts ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/dashboard/admin/quizzes/${q.id}`)}
                        className="rounded-pill bg-sky/20 px-3 py-1 text-xs font-bold text-sky hover:bg-sky/30"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(q)}
                        className="rounded-pill bg-pink/20 px-3 py-1 text-xs font-bold text-pink hover:bg-pink/30"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
