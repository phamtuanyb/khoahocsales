'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { QuestionType } from '@mkt-academy/types';
import { useAuth } from '@/components/auth-provider';
import { LevelUpModal } from '@/components/level-up-modal';
import { QuestionDragDrop } from '@/components/quiz/question-drag-drop';
import { QuestionMultipleChoice } from '@/components/quiz/question-multiple-choice';
import { QuestionSituation } from '@/components/quiz/question-situation';
import { QuizResult } from '@/components/quiz/quiz-result';
import { QuizTimer } from '@/components/quiz/quiz-timer';
import { ApiError } from '@/lib/api-client';
import { sfx } from '@/lib/audio';
import { quizApi } from '@/lib/quiz-api';
import type {
  AnswerPayload,
  MiniGameItem,
  MultipleChoiceOption,
  QuizForUser,
  QuizSubmitResult,
} from '@/lib/quiz-types';

type Mode = 'loading' | 'taking' | 'submitting' | 'result' | 'error';

export default function QuizPage(): JSX.Element {
  const params = useParams<{ quizId: string }>();
  const quizId = params?.quizId;
  const router = useRouter();
  const { refreshMe } = useAuth();

  const [mode, setMode] = useState<Mode>('loading');
  const [quiz, setQuiz] = useState<QuizForUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerPayload>>({});
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const loadQuiz = useCallback(async () => {
    if (!quizId) return;
    setMode('loading');
    setError(null);
    setAnswers({});
    setResult(null);
    try {
      const data = await quizApi.getQuiz(quizId);
      setQuiz(data);
      setMode('taking');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Không tải được bài thi',
      );
      setMode('error');
    }
  }, [quizId]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  function setAnswerFor(qid: string, payload: AnswerPayload): void {
    setAnswers((prev) => ({ ...prev, [qid]: payload }));
  }

  const handleSubmit = useCallback(
    async (force = false) => {
      if (!quiz || !quizId) return;

      // Nếu chưa trả lời hết, hỏi xác nhận (trừ khi force=true do hết giờ).
      if (!force) {
        const unanswered = quiz.questions.filter((q) => !answers[q.id]);
        if (unanswered.length > 0) {
          const ok = window.confirm(
            `Bạn còn ${unanswered.length} câu chưa trả lời. Vẫn nộp bài?`,
          );
          if (!ok) return;
        }
      }

      setMode('submitting');
      try {
        const res = await quizApi.submit(quizId, answers);
        setResult(res);
        // Sound theo kết quả
        if (res.passed) sfx.pass();
        else sfx.fail();
        // Cập nhật EXP/Level lên Topbar
        if (res.expAwarded > 0) await refreshMe();
        if (res.levelUp) {
          // Hiện modal Level Up sau khi result đã hiện ra (delay ngắn để cảm giác sướng)
          window.setTimeout(() => setShowLevelUp(true), 600);
        }
        setMode('result');
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Không nộp được bài');
        setMode('taking'); // Cho phép thử lại
      }
    },
    [quiz, quizId, answers, refreshMe],
  );

  if (mode === 'loading') {
    return <div className="mkt-card h-64 animate-pulse opacity-50" />;
  }

  if (mode === 'error' || !quiz) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error ?? 'Không tải được bài thi'}
        </div>
        <Link href="/dashboard/learn" className="mkt-btn-secondary inline-flex">
          ← Về khu vực học
        </Link>
      </div>
    );
  }

  if (mode === 'result' && result) {
    return (
      <>
        <QuizResult
          quiz={quiz}
          result={result}
          onRetake={loadQuiz}
          onExit={() => {
            if (quiz.module) router.push(`/dashboard/learn/${quiz.module.courseId}`);
            else router.push('/dashboard/learn');
          }}
        />
        <AnimatePresence>
          {showLevelUp && result.levelUp && (
            <LevelUpModal
              data={result.levelUp}
              onClose={() => setShowLevelUp(false)}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // mode = 'taking' hoặc 'submitting'
  const submitting = mode === 'submitting';

  return (
    <div className="space-y-6">
      {/* Header — bossbattle có dramatic theme */}
      {quiz.isBossBattle ? <BossBattleHeader quiz={quiz} mode={mode} onForceSubmit={() => handleSubmit(true)} /> : (
        <header className="mkt-card flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mkt-pill-navy !text-xs">BÀI THI</span>
              {quiz.module && (
                <Link
                  href={`/dashboard/learn/${quiz.module.courseId}`}
                  className="text-xs text-sky hover:text-orange"
                >
                  ← {quiz.module.title}
                </Link>
              )}
            </div>
            <h1 className="mt-2 text-h2-mkt-sm text-shadow-mkt">{quiz.title.toUpperCase()}</h1>
            {quiz.description && (
              <p className="mt-1 text-sm text-ice">{quiz.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-sky">
              <span>📝 {quiz.questions.length} câu</span>
              <span>🎯 Điểm đạt: {quiz.passScore}%</span>
              <span>🔄 Còn {quiz.remainingAttempts}/{quiz.maxAttempts} lượt</span>
            </div>
          </div>
          <QuizTimer
            totalSeconds={quiz.timeLimitSec}
            onExpire={() => {
              if (mode === 'taking') {
                window.alert('Hết giờ! Bài làm sẽ được nộp tự động.');
                handleSubmit(true);
              }
            }}
            paused={submitting}
          />
        </header>
      )}

      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      {/* Câu hỏi */}
      <div className="space-y-6">
        {quiz.questions.map((q, idx) => (
          <motion.section
            key={q.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="mkt-card p-6"
          >
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mkt-pill-orange font-black text-white">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-sky">
                  {questionTypeLabel(q.type)} · {q.difficulty.toLowerCase()}
                </div>
                <p className="mt-1 whitespace-pre-line text-lg font-bold text-white">
                  {q.content}
                </p>
              </div>
            </div>

            <QuestionBody
              question={q}
              answer={answers[q.id]}
              onChange={(payload) => setAnswerFor(q.id, payload)}
              disabled={submitting}
            />
          </motion.section>
        ))}
      </div>

      {/* Nút nộp bài */}
      <section className="sticky bottom-4 z-10 flex justify-end">
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="mkt-btn-primary !px-8 !py-4 !text-base disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Đang chấm điểm...' : 'Nộp bài →'}
        </button>
      </section>
    </div>
  );
}

function QuestionBody({
  question,
  answer,
  onChange,
  disabled,
}: {
  question: QuizForUser['questions'][number];
  answer: AnswerPayload | undefined;
  onChange: (payload: AnswerPayload) => void;
  disabled: boolean;
}): JSX.Element {
  switch (question.type) {
    case QuestionType.MULTIPLE_CHOICE: {
      const options = (question.options as MultipleChoiceOption[]) ?? [];
      const selected =
        answer && answer.type === 'MULTIPLE_CHOICE' ? answer.selected : null;
      return (
        <QuestionMultipleChoice
          options={options}
          selected={selected}
          disabled={disabled}
          onChange={(key) => onChange({ type: 'MULTIPLE_CHOICE', selected: key })}
        />
      );
    }
    case QuestionType.MINI_GAME: {
      const items = (question.options as MiniGameItem[]) ?? [];
      const order =
        answer && answer.type === 'MINI_GAME' ? answer.order : items.map((i) => i.id);
      return (
        <QuestionDragDrop
          items={items}
          value={order}
          disabled={disabled}
          onChange={(newOrder) => onChange({ type: 'MINI_GAME', order: newOrder })}
        />
      );
    }
    case QuestionType.SITUATION:
    case QuestionType.BOSS_BATTLE: {
      const text = answer && answer.type === 'SITUATION' ? answer.text : '';
      return (
        <QuestionSituation
          value={text}
          disabled={disabled}
          onChange={(t) => onChange({ type: 'SITUATION', text: t })}
        />
      );
    }
    default:
      return <p className="text-pink">Loại câu hỏi chưa hỗ trợ.</p>;
  }
}

// Header dramatic cho Boss Battle — silhouette boss, HP bar, ngọn lửa.
function BossBattleHeader({
  quiz,
  mode,
  onForceSubmit,
}: {
  quiz: QuizForUser;
  mode: 'loading' | 'taking' | 'submitting' | 'result' | 'error';
  onForceSubmit: () => void;
}): JSX.Element {
  const submitting = mode === 'submitting';
  return (
    <header
      className="on-dark relative overflow-hidden rounded-card border-2 border-pink/60 p-6 shadow-[0_0_32px_rgba(236,72,153,0.3)]"
      style={{
        background:
          'linear-gradient(135deg, #4F83D9 0%, #6FA9F9 45%, #EC4899 100%)',
      }}
    >
      {/* Bokeh đỏ */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, #EC4899, transparent 70%)' }}
      />
      {/* Tia chớp */}
      <motion.div
        animate={{ opacity: [0, 1, 0, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
        className="pointer-events-none absolute inset-0 bg-white/20"
      />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Pill BOSS BATTLE pulsing */}
          <motion.span
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="inline-flex items-center gap-1 rounded-pill bg-pink px-3 py-1 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(255,64,129,0.6)]"
          >
            ⚔️ TRẬN ĐẤU TRÙM
          </motion.span>
          {quiz.levelName && (
            <span className="ml-2 mkt-pill-navy !text-xs">
              CUỐI LEVEL — {quiz.levelName.toUpperCase()}
            </span>
          )}

          <h1
            className="mt-3 font-display text-3xl font-black uppercase tracking-tight text-white md:text-4xl"
            style={{ textShadow: '0 0 24px rgba(255,64,129,0.6)' }}
          >
            {quiz.title.toUpperCase()}
          </h1>

          {quiz.description && (
            <p className="mt-2 max-w-xl text-sm text-ice">{quiz.description}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-ice">
            <span>📝 {quiz.questions.length} câu</span>
            <span>🎯 Điểm đạt: {quiz.passScore}%</span>
            <span>🔄 Còn {quiz.remainingAttempts}/{quiz.maxAttempts} lượt</span>
            <span className="font-bold text-gold">🤖 AI sẽ chấm tình huống theo 3 tiêu chí</span>
          </div>
        </div>

        {/* Boss avatar + timer */}
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-pink/60 bg-navy-deep text-5xl shadow-[0_0_24px_rgba(255,64,129,0.5)]"
          >
            👹
            <span className="absolute -bottom-2 -right-2 rounded-pill bg-pink px-2 py-0.5 text-[10px] font-black uppercase text-white">
              BOSS
            </span>
          </motion.div>
          <QuizTimer
            totalSeconds={quiz.timeLimitSec}
            onExpire={() => {
              if (mode === 'taking') {
                window.alert('Hết giờ! Bài làm sẽ được nộp tự động.');
                onForceSubmit();
              }
            }}
            paused={submitting}
          />
        </div>
      </div>
    </header>
  );
}

function questionTypeLabel(t: QuestionType): string {
  switch (t) {
    case QuestionType.MULTIPLE_CHOICE:
      return 'Trắc nghiệm';
    case QuestionType.SITUATION:
      return 'Tình huống';
    case QuestionType.MINI_GAME:
      return 'Mini game — Kéo thả';
    case QuestionType.BOSS_BATTLE:
      return 'Boss Battle';
    default:
      return String(t);
  }
}
