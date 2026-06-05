'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ApiError } from '@/lib/api-client';
import { adminApi, type AdminQuestion } from '@/lib/admin-api';

interface QuestionFormProps {
  initial?: AdminQuestion;
  onSaved?: (q: AdminQuestion) => void;
}

type QuestionType = 'MULTIPLE_CHOICE' | 'SITUATION' | 'MINI_GAME' | 'BOSS_BATTLE';

// Form duy nhất xử lý cả 4 dạng — đổi UI theo type được chọn.
export function QuestionForm({ initial, onSaved }: QuestionFormProps): JSX.Element {
  const router = useRouter();
  const [type, setType] = useState<QuestionType>(
    (initial?.type as QuestionType) ?? 'MULTIPLE_CHOICE',
  );
  const [content, setContent] = useState(initial?.content ?? '');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>(
    (initial?.difficulty as 'EASY' | 'MEDIUM' | 'HARD') ?? 'MEDIUM',
  );
  const [moduleId, setModuleId] = useState<string>(initial?.moduleId ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  // MC state
  const [mcOptions, setMcOptions] = useState<Array<{ key: string; text: string }>>(
    initial && initial.type === 'MULTIPLE_CHOICE' && Array.isArray(initial.options)
      ? (initial.options as Array<{ key: string; text: string }>)
      : [
          { key: 'A', text: '' },
          { key: 'B', text: '' },
          { key: 'C', text: '' },
          { key: 'D', text: '' },
        ],
  );
  const [mcCorrect, setMcCorrect] = useState<string>(
    (initial?.answer as { correct?: string })?.correct ?? 'A',
  );

  // Mini-game state
  const [miniItems, setMiniItems] = useState<Array<{ id: string; text: string }>>(
    initial && initial.type === 'MINI_GAME' && Array.isArray(initial.options)
      ? (initial.options as Array<{ id: string; text: string }>)
      : [
          { id: 'step-1', text: '' },
          { id: 'step-2', text: '' },
          { id: 'step-3', text: '' },
        ],
  );
  const [miniCorrectOrder, setMiniCorrectOrder] = useState<string>(
    initial && initial.type === 'MINI_GAME'
      ? ((initial.answer as { correctOrder?: string[] }).correctOrder ?? []).join(', ')
      : 'step-1, step-2, step-3',
  );

  // Situation/Boss state
  const [sitKeywords, setSitKeywords] = useState<string>(
    initial && (initial.type === 'SITUATION' || initial.type === 'BOSS_BATTLE')
      ? ((initial.answer as { keywords?: string[] }).keywords ?? []).join(', ')
      : '',
  );
  const [sitMinScore, setSitMinScore] = useState<number>(
    initial && (initial.type === 'SITUATION' || initial.type === 'BOSS_BATTLE')
      ? Number((initial.answer as { minScore?: number }).minScore ?? 50)
      : 50,
  );
  const [sitRubric, setSitRubric] = useState<string>(
    initial && (initial.type === 'SITUATION' || initial.type === 'BOSS_BATTLE')
      ? String((initial.answer as { rubric?: string }).rubric ?? '')
      : '',
  );

  // Modules dropdown
  const [modules, setModules] = useState<Array<{ id: string; title: string; courseTitle: string }>>([]);
  useEffect(() => {
    let mounted = true;
    adminApi
      .listCourses()
      .then(async (courses) => {
        if (!mounted) return;
        const all: Array<{ id: string; title: string; courseTitle: string }> = [];
        for (const c of courses) {
          const detail = await adminApi.getCourse(c.id);
          for (const m of detail.modules ?? []) {
            all.push({ id: m.id, title: m.title, courseTitle: detail.title });
          }
        }
        if (mounted) setModules(all);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (content.trim().length < 5) {
      setError('Nội dung tối thiểu 5 ký tự');
      return;
    }
    let options: unknown = null;
    let answer: Record<string, unknown> = {};

    switch (type) {
      case 'MULTIPLE_CHOICE': {
        const cleaned = mcOptions.filter((o) => o.text.trim().length > 0);
        if (cleaned.length < 2) {
          setError('Trắc nghiệm cần tối thiểu 2 đáp án có nội dung');
          return;
        }
        if (!cleaned.some((o) => o.key === mcCorrect)) {
          setError('Đáp án đúng không khớp với key option nào');
          return;
        }
        options = cleaned;
        answer = { correct: mcCorrect };
        break;
      }
      case 'MINI_GAME': {
        const cleaned = miniItems.filter((m) => m.text.trim().length > 0);
        if (cleaned.length < 2) {
          setError('Mini game cần tối thiểu 2 item');
          return;
        }
        const order = miniCorrectOrder
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const ids = new Set(cleaned.map((c) => c.id));
        const orderIds = new Set(order);
        if (ids.size !== orderIds.size || [...ids].some((id) => !orderIds.has(id))) {
          setError('correctOrder phải chứa đúng toàn bộ id trong items');
          return;
        }
        options = cleaned;
        answer = { correctOrder: order };
        break;
      }
      case 'SITUATION':
      case 'BOSS_BATTLE': {
        const keywords = sitKeywords
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        options = null;
        answer = {
          keywords,
          minScore: sitMinScore,
          ...(sitRubric.trim() ? { rubric: sitRubric.trim() } : {}),
        };
        break;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        type,
        content: content.trim(),
        options,
        answer,
        difficulty,
        moduleId: moduleId || undefined,
        isActive,
      };
      const result = initial
        ? await adminApi.updateQuestion(initial.id, payload)
        : await adminApi.createQuestion(payload);
      if (onSaved) onSaved(result);
      else router.push('/dashboard/admin/questions');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      {/* Type selector */}
      <Field label="Loại câu hỏi">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {(['MULTIPLE_CHOICE', 'SITUATION', 'MINI_GAME', 'BOSS_BATTLE'] as QuestionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-bold transition ${
                type === t
                  ? 'border-orange bg-orange/10 text-white shadow-mkt-cta'
                  : 'border-sky/30 bg-navy-deep/30 text-ice hover:border-sky'
              }`}
            >
              <span className="text-lg">
                {t === 'MULTIPLE_CHOICE' && '🔘'}
                {t === 'SITUATION' && '📝'}
                {t === 'MINI_GAME' && '🧩'}
                {t === 'BOSS_BATTLE' && '⚔️'}
              </span>
              <span className="uppercase">
                {t === 'MULTIPLE_CHOICE' && 'Trắc nghiệm'}
                {t === 'SITUATION' && 'Tình huống'}
                {t === 'MINI_GAME' && 'Mini game'}
                {t === 'BOSS_BATTLE' && 'Boss'}
              </span>
            </button>
          ))}
        </div>
      </Field>

      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Độ khó">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
            className="mkt-input"
          >
            <option value="EASY">Dễ</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
          </select>
        </Field>
        <Field label="Mô-đun (tùy chọn)">
          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            className="mkt-input"
          >
            <option value="">— Không gán mô-đun —</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.courseTitle} → {m.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Trạng thái">
          <label className="flex items-center gap-2 pt-1.5">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-5 w-5 rounded accent-orange"
            />
            <span className="text-sm text-ice">Đang dùng (active)</span>
          </label>
        </Field>
      </div>

      <Field label="Nội dung câu hỏi">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          required
          minLength={5}
          className="mkt-input"
          placeholder="VD: Khi khách chê giá cao, bước đầu tiên trong LAARC là gì?"
        />
      </Field>

      {/* UI riêng theo type */}
      <motion.div
        key={type}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-sky/30 bg-navy-deep/30 p-4 space-y-3"
      >
        {type === 'MULTIPLE_CHOICE' && (
          <>
            <h3 className="text-xs font-bold uppercase tracking-widest text-sky">Đáp án (chọn 1 đúng)</h3>
            {mcOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={opt.key}
                  onChange={(e) => {
                    const next = [...mcOptions];
                    next[idx] = { ...next[idx]!, key: e.target.value };
                    setMcOptions(next);
                  }}
                  className="mkt-input w-16 text-center font-black"
                  placeholder="A"
                />
                <input
                  value={opt.text}
                  onChange={(e) => {
                    const next = [...mcOptions];
                    next[idx] = { ...next[idx]!, text: e.target.value };
                    setMcOptions(next);
                  }}
                  className="mkt-input flex-1"
                  placeholder="Nội dung đáp án"
                />
                <label className="flex items-center gap-1 px-2">
                  <input
                    type="radio"
                    name="mcCorrect"
                    checked={mcCorrect === opt.key}
                    onChange={() => setMcCorrect(opt.key)}
                    className="accent-orange"
                  />
                  <span className="text-[10px] uppercase text-gold">Đúng</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMcOptions(mcOptions.filter((_, i) => i !== idx))}
                  className="rounded bg-pink/20 px-2 py-1 text-xs text-pink"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = [...mcOptions];
                const nextKey = String.fromCharCode(65 + next.length);
                next.push({ key: nextKey, text: '' });
                setMcOptions(next);
              }}
              className="mkt-btn-secondary !text-xs"
            >
              + Thêm đáp án
            </button>
          </>
        )}

        {type === 'MINI_GAME' && (
          <>
            <h3 className="text-xs font-bold uppercase tracking-widest text-sky">
              Items kéo-thả (user xếp thứ tự)
            </h3>
            {miniItems.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={it.id}
                  onChange={(e) => {
                    const next = [...miniItems];
                    next[idx] = { ...next[idx]!, id: e.target.value };
                    setMiniItems(next);
                  }}
                  className="mkt-input w-32 font-mono"
                  placeholder="step-1"
                />
                <input
                  value={it.text}
                  onChange={(e) => {
                    const next = [...miniItems];
                    next[idx] = { ...next[idx]!, text: e.target.value };
                    setMiniItems(next);
                  }}
                  className="mkt-input flex-1"
                  placeholder="Mô tả bước"
                />
                <button
                  type="button"
                  onClick={() => setMiniItems(miniItems.filter((_, i) => i !== idx))}
                  className="rounded bg-pink/20 px-2 py-1 text-xs text-pink"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = [...miniItems];
                next.push({ id: `step-${next.length + 1}`, text: '' });
                setMiniItems(next);
              }}
              className="mkt-btn-secondary !text-xs"
            >
              + Thêm item
            </button>
            <Field label="Thứ tự đúng (id, phân tách bởi dấu phẩy)">
              <input
                value={miniCorrectOrder}
                onChange={(e) => setMiniCorrectOrder(e.target.value)}
                className="mkt-input font-mono"
                placeholder="step-1, step-2, step-3"
              />
            </Field>
          </>
        )}

        {(type === 'SITUATION' || type === 'BOSS_BATTLE') && (
          <>
            <h3 className="text-xs font-bold uppercase tracking-widest text-sky">
              AI chấm — từ khóa SOP cần có trong câu trả lời
            </h3>
            <Field label="Từ khóa (phân tách bởi dấu phẩy)">
              <textarea
                value={sitKeywords}
                onChange={(e) => setSitKeywords(e.target.value)}
                rows={2}
                placeholder="lắng nghe, thừa nhận, ROI, giá trị, demo, case study"
                className="mkt-input"
              />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Điểm tối thiểu để đỗ (%)">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={sitMinScore}
                  onChange={(e) => setSitMinScore(Number(e.target.value))}
                  className="mkt-input"
                />
              </Field>
              <Field label="Rubric (gợi ý cho AI)">
                <input
                  value={sitRubric}
                  onChange={(e) => setSitRubric(e.target.value)}
                  className="mkt-input"
                  placeholder="VD: Đánh giá theo LAARC"
                />
              </Field>
            </div>
          </>
        )}
      </motion.div>

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
          {saving ? 'Đang lưu...' : initial ? '💾 Lưu thay đổi' : '+ Tạo câu hỏi'}
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
