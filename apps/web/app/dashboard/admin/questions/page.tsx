'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoadingScreen } from '@/components/loading-screen';
import { QuestionsImportModal } from '@/components/admin/questions-import-modal';
import { ApiError } from '@/lib/api-client';
import { adminApi, type AdminQuestion } from '@/lib/admin-api';

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  SITUATION: 'Tình huống',
  MINI_GAME: 'Mini game (kéo thả)',
  BOSS_BATTLE: 'Boss Battle',
};
const TYPE_ICONS: Record<string, string> = {
  MULTIPLE_CHOICE: '🔘',
  SITUATION: '📝',
  MINI_GAME: '🧩',
  BOSS_BATTLE: '⚔️',
};
const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'bg-sky/20 text-sky',
  MEDIUM: 'bg-orange/20 text-orange',
  HARD: 'bg-pink/20 text-pink',
};

export default function AdminQuestionsListPage(): JSX.Element {
  const router = useRouter();
  const [questions, setQuestions] = useState<AdminQuestion[] | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await adminApi.listQuestions({
        type: typeFilter || undefined,
        q: search || undefined,
      });
      setQuestions(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi tải');
    }
  }, [typeFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(q: AdminQuestion): Promise<void> {
    if (!confirm('Xóa câu hỏi này? (Mọi quiz đang dùng câu này cũng sẽ mất câu)')) return;
    try {
      await adminApi.deleteQuestion(q.id);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="mkt-pill-orange !text-xs">NGÂN HÀNG CÂU HỎI</span>
          <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">CÂU HỎI</h1>
          <p className="mt-1 text-sm text-ice">
            Hỗ trợ 4 dạng: trắc nghiệm, tình huống (AI chấm), mini game kéo-thả, Boss Battle.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="mkt-btn-secondary !text-sm"
            title="Nhập hàng loạt từ file Excel"
          >
            📥 Nhập từ Excel
          </button>
          <Link href="/dashboard/admin/questions/new" className="mkt-btn-primary !text-sm">
            + Tạo câu hỏi mới
          </Link>
        </div>
      </header>

      <QuestionsImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={load}
      />


      {/* Filter */}
      <section className="mkt-card flex flex-wrap items-center gap-3 p-4">
        <div className="flex flex-wrap gap-1">
          {['', 'MULTIPLE_CHOICE', 'SITUATION', 'MINI_GAME', 'BOSS_BATTLE'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded-pill px-3 py-1 text-xs font-bold uppercase transition ${
                typeFilter === t
                  ? 'bg-mkt-pill-orange text-white'
                  : 'border border-sky/30 text-sky hover:border-orange'
              }`}
            >
              {t === '' ? 'Tất cả' : TYPE_LABELS[t] ?? t}
            </button>
          ))}
        </div>
        <input
          placeholder="🔍 Tìm theo nội dung..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mkt-input min-w-[200px] flex-1"
        />
      </section>

      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      {!questions ? (
        <LoadingScreen label="Đang tải câu hỏi" />
      ) : questions.length === 0 ? (
        <div className="mkt-card p-8 text-center text-sm text-sky">
          Chưa có câu hỏi nào — bấm "+ Tạo câu hỏi mới".
        </div>
      ) : (
        <ul className="space-y-2">
          {questions.map((q) => (
            <li
              key={q.id}
              className="mkt-card flex flex-wrap items-start gap-3 p-4 transition hover:border-orange"
            >
              <span className="text-2xl">{TYPE_ICONS[q.type] ?? '❓'}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mkt-pill-navy !text-[10px]">{TYPE_LABELS[q.type]}</span>
                  <span
                    className={`rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase ${
                      DIFFICULTY_COLORS[q.difficulty] ?? ''
                    }`}
                  >
                    {q.difficulty}
                  </span>
                  {!q.isActive && (
                    <span className="rounded-pill bg-navy-deep/60 px-2 py-0.5 text-[10px] text-sky/60">
                      Ẩn
                    </span>
                  )}
                  {q.module && (
                    <span className="text-[10px] text-sky">
                      → {q.module.title}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-white">{q.content}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/admin/questions/${q.id}`)}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
