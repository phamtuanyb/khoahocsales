'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api-client';
import { adminApi, type AdminLevel, type AdminQuestion, type AdminQuiz } from '@/lib/admin-api';

interface QuizFormProps {
  initial?: AdminQuiz;
}

// Form tạo/sửa Quiz — bao gồm chọn câu hỏi từ ngân hàng.
export function QuizForm({ initial }: QuizFormProps): JSX.Element {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [moduleId, setModuleId] = useState<string>(initial?.moduleId ?? '');
  const [levelId, setLevelId] = useState<string>(initial?.levelId ?? '');
  const [passScore, setPassScore] = useState(initial?.passScore ?? 70);
  const [timeLimitSec, setTimeLimitSec] = useState(initial?.timeLimitSec ?? 600);
  const [maxAttempts, setMaxAttempts] = useState(initial?.maxAttempts ?? 5);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(
    initial?.questions?.map((q) => q.question.id) ?? [],
  );

  // Modules + Levels + Questions list
  const [modules, setModules] = useState<Array<{ id: string; title: string; courseTitle: string }>>([]);
  const [levels, setLevels] = useState<AdminLevel[]>([]);
  const [allQuestions, setAllQuestions] = useState<AdminQuestion[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminApi.listCourses().then(async (courses) => {
        const all: Array<{ id: string; title: string; courseTitle: string }> = [];
        for (const c of courses) {
          const detail = await adminApi.getCourse(c.id);
          for (const m of detail.modules ?? []) {
            all.push({ id: m.id, title: m.title, courseTitle: detail.title });
          }
        }
        setModules(all);
      }),
      adminApi.listLevels().then(setLevels),
      adminApi.listQuestions().then(setAllQuestions),
    ]).catch(() => {});
  }, []);

  const filteredQuestions = allQuestions.filter((q) => {
    if (filterType && q.type !== filterType) return false;
    if (search && !q.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function toggleQuestion(id: string): void {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  function moveSelected(id: string, direction: 'up' | 'down'): void {
    const idx = selectedQuestionIds.indexOf(id);
    if (idx < 0) return;
    const next = [...selectedQuestionIds];
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    setSelectedQuestionIds(next);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (selectedQuestionIds.length === 0) {
      setError('Chọn tối thiểu 1 câu hỏi');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        moduleId: moduleId || undefined,
        levelId: levelId || undefined,
        passScore,
        timeLimitSec,
        maxAttempts,
        isActive,
        questionIds: selectedQuestionIds,
      };
      if (initial) {
        await adminApi.updateQuiz(initial.id, payload);
      } else {
        await adminApi.createQuiz(payload);
      }
      router.push('/dashboard/admin/quizzes');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  }

  const selectedQuestions = selectedQuestionIds
    .map((id) => allQuestions.find((q) => q.id === id))
    .filter((q): q is AdminQuestion => Boolean(q));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Tên bài thi">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={2}
            className="mkt-input"
          />
        </Field>
        <Field label="Trạng thái">
          <label className="flex items-center gap-2 pt-1.5">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-5 w-5 rounded accent-orange"
            />
            <span className="text-sm text-ice">Active</span>
          </label>
        </Field>
      </div>
      <Field label="Mô tả">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mkt-input"
        />
      </Field>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Mô-đun (để trống nếu là Boss Battle)">
          <select
            value={moduleId}
            onChange={(e) => {
              setModuleId(e.target.value);
              if (e.target.value) setLevelId('');
            }}
            className="mkt-input"
          >
            <option value="">— Không gắn mô-đun —</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.courseTitle} → {m.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Level (gắn = Boss Battle Level đó)">
          <select
            value={levelId}
            onChange={(e) => {
              setLevelId(e.target.value);
              if (e.target.value) setModuleId('');
            }}
            className="mkt-input"
          >
            <option value="">— Không phải Boss Battle —</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                Lv.{l.order} {l.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Điểm đạt (%)">
          <input
            type="number"
            min={0}
            max={100}
            value={passScore}
            onChange={(e) => setPassScore(Number(e.target.value))}
            className="mkt-input"
          />
        </Field>
        <Field label="Thời gian (giây)">
          <input
            type="number"
            min={30}
            value={timeLimitSec}
            onChange={(e) => setTimeLimitSec(Number(e.target.value))}
            className="mkt-input"
          />
        </Field>
        <Field label="Số lượt làm tối đa">
          <input
            type="number"
            min={1}
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(Number(e.target.value))}
            className="mkt-input"
          />
        </Field>
      </div>

      {/* Câu hỏi đã chọn (có thể reorder) */}
      <div className="rounded-xl border border-sky/30 bg-navy-deep/30 p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-sky">
          Câu hỏi đã chọn ({selectedQuestions.length})
        </h3>
        {selectedQuestions.length === 0 ? (
          <p className="text-sm italic text-sky">Chưa chọn câu hỏi nào. Chọn từ ngân hàng bên dưới.</p>
        ) : (
          <ol className="space-y-2">
            {selectedQuestions.map((q, i) => (
              <li
                key={q.id}
                className="flex items-center gap-2 rounded-lg border border-sky/30 bg-navy-deep/60 px-3 py-2"
              >
                <span className="text-xs font-bold text-orange">#{i + 1}</span>
                <span className="text-[10px] uppercase text-sky">{q.type}</span>
                <span className="line-clamp-1 flex-1 text-sm text-white">{q.content}</span>
                <button
                  type="button"
                  onClick={() => moveSelected(q.id, 'up')}
                  className="rounded bg-sky/20 px-2 py-0.5 text-xs text-sky hover:bg-sky/30 disabled:opacity-30"
                  disabled={i === 0}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveSelected(q.id, 'down')}
                  className="rounded bg-sky/20 px-2 py-0.5 text-xs text-sky hover:bg-sky/30 disabled:opacity-30"
                  disabled={i === selectedQuestions.length - 1}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => toggleQuestion(q.id)}
                  className="rounded bg-pink/20 px-2 py-0.5 text-xs text-pink hover:bg-pink/30"
                >
                  ×
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Picker từ ngân hàng */}
      <div className="rounded-xl border border-sky/30 bg-navy-deep/30 p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-sky">
          Ngân hàng câu hỏi
        </h3>
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            placeholder="🔍 Tìm theo nội dung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mkt-input min-w-[200px] flex-1"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="mkt-input w-auto"
          >
            <option value="">Mọi loại</option>
            <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
            <option value="SITUATION">Tình huống</option>
            <option value="MINI_GAME">Mini game</option>
            <option value="BOSS_BATTLE">Boss Battle</option>
          </select>
        </div>
        <ul className="max-h-96 space-y-1.5 overflow-y-auto">
          {filteredQuestions.map((q) => {
            const selected = selectedQuestionIds.includes(q.id);
            return (
              <li
                key={q.id}
                onClick={() => toggleQuestion(q.id)}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border-2 px-3 py-2 transition ${
                  selected
                    ? 'border-orange bg-orange/10'
                    : 'border-sky/20 bg-navy-deep/40 hover:border-sky'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleQuestion(q.id)}
                  className="mt-0.5 h-4 w-4 accent-orange"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-pill bg-sky/20 px-2 py-0.5 text-[10px] font-bold uppercase text-sky">
                      {q.type}
                    </span>
                    <span className="text-[10px] text-orange">{q.difficulty}</span>
                  </div>
                  <p className="line-clamp-2 text-xs text-white">{q.content}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="mkt-btn-secondary !text-sm"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={saving}
          className="mkt-btn-primary !text-sm disabled:opacity-60"
        >
          {saving ? 'Đang lưu...' : initial ? '💾 Lưu thay đổi' : '+ Tạo bài thi'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-bold uppercase tracking-widest text-sky">{label}</span>
      {children}
    </label>
  );
}
