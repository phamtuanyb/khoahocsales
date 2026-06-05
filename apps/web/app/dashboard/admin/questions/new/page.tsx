'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QuestionForm } from '@/components/admin/question-form';
import { QuestionsImportModal } from '@/components/admin/questions-import-modal';
import { useRouter } from 'next/navigation';

export default function NewQuestionPage(): JSX.Element {
  const router = useRouter();
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-xs text-sky">
        <Link href="/dashboard/admin/questions" className="hover:text-orange">
          Ngân hàng câu hỏi
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">Tạo mới</span>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="mkt-pill-orange !text-xs">TẠO CÂU HỎI MỚI</span>
          <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">CÂU HỎI MỚI</h1>
        </div>
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="mkt-btn-secondary !text-sm"
          title="Nhập nhiều câu hỏi cùng lúc từ file Excel"
        >
          📥 Hoặc nhập hàng loạt từ Excel
        </button>
      </header>

      {/* Banner — gợi ý 2 cách tạo */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border-2 border-orange/40 bg-orange/5 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange">
            ✍️ TẠO TỪNG CÂU (đang dùng)
          </div>
          <p className="mt-1 text-xs text-ice">
            Form bên dưới — chọn 1 trong 4 dạng câu hỏi, điền nội dung + đáp án.
            Phù hợp khi cần soạn câu chi tiết, có rubric phức tạp.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="rounded-xl border-2 border-sky/40 bg-sky/5 p-4 text-left transition hover:border-sky"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sky">
            📥 NHẬP HÀNG LOẠT TỪ EXCEL
          </div>
          <p className="mt-1 text-xs text-ice">
            Tải template Excel có 4 sheet (TRẮC NGHIỆM / TÌNH HUỐNG / MINI GAME / BOSS BATTLE),
            điền danh sách câu hỏi → upload ngược lên. Tạo nhiều câu trong 1 lần.
          </p>
        </button>
      </div>

      <div className="mkt-card p-6">
        <QuestionForm />
      </div>

      <QuestionsImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          setImportOpen(false);
          router.push('/dashboard/admin/questions');
        }}
      />
    </div>
  );
}
