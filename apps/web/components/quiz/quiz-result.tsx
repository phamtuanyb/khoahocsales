'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type {
  PerQuestionResult,
  QuizForUser,
  QuizSubmitResult,
} from '@/lib/quiz-types';

interface QuizResultProps {
  quiz: QuizForUser;
  result: QuizSubmitResult;
  onRetake: () => void;
  onExit: () => void;
}

export function QuizResult({
  quiz,
  result,
  onRetake,
  onExit,
}: QuizResultProps): JSX.Element {
  return (
    <div className="space-y-6">
      {/* Hero kết quả */}
      <motion.section
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 180 }}
        className="mkt-card overflow-hidden p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', damping: 10 }}
          className={`mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full text-6xl shadow-mkt-3d ${
            result.passed
              ? 'bg-mkt-pill-gold text-navy-deep'
              : 'bg-pink/30 text-pink'
          }`}
        >
          {result.passed ? '🏆' : '💔'}
        </motion.div>
        <span className="mkt-pill-navy !text-xs">
          {result.passed ? 'ĐỖ BÀI THI' : 'CHƯA ĐẠT'}
        </span>
        <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt md:text-h2-mkt">
          <span className={result.passed ? 'text-gold' : 'text-pink'}>
            {result.score}
          </span>
          <span className="text-white">/100</span>
        </h1>
        <p className="mt-2 text-body-mkt text-ice">
          {result.correctCount}/{result.totalQuestions} câu đúng — ngưỡng đỗ {result.passScore}%
        </p>

        {/* EXP bay + animation */}
        {result.expAwarded > 0 && (
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.6 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', damping: 10 }}
            className="mt-6 inline-flex items-center gap-2 rounded-pill bg-mkt-pill-orange px-6 py-3 text-2xl font-black text-white shadow-mkt-cta"
          >
            <span>+{result.expAwarded}</span>
            <span className="text-xl">EXP</span>
            <span>✨</span>
          </motion.div>
        )}

        {result.isBossBattle && result.passed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-4 inline-block rounded-xl border border-gold/50 bg-gold/10 px-4 py-2 text-sm font-bold text-gold"
          >
            ⚔️ BOSS BATTLE — Bonus +200 EXP
          </motion.div>
        )}
      </motion.section>

      {/* Chi tiết từng câu */}
      <section className="mkt-card p-6">
        <h2 className="mb-4 text-h2-mkt-sm">
          <span className="mkt-pill-orange !text-sm">CHI TIẾT</span>
        </h2>
        <ul className="space-y-3">
          {result.perQuestion.map((r, idx) => {
            const question = quiz.questions.find((q) => q.id === r.questionId);
            return (
              <QuestionResultRow
                key={r.questionId}
                index={idx + 1}
                questionContent={question?.content ?? ''}
                result={r}
              />
            );
          })}
        </ul>
      </section>

      {/* Hành động */}
      <section className="flex flex-wrap justify-end gap-3">
        {result.remainingAttempts > 0 && !result.passed && (
          <button type="button" onClick={onRetake} className="mkt-btn-secondary">
            🔄 Làm lại ({result.remainingAttempts} lượt còn)
          </button>
        )}
        {quiz.module && (
          <Link
            href={`/dashboard/learn/${quiz.module.courseId}`}
            className="mkt-btn-secondary"
          >
            ← Về khóa học
          </Link>
        )}
        <button type="button" onClick={onExit} className="mkt-btn-primary">
          Tiếp tục
        </button>
      </section>
    </div>
  );
}

function QuestionResultRow({
  index,
  questionContent,
  result,
}: {
  index: number;
  questionContent: string;
  result: PerQuestionResult;
}): JSX.Element {
  const points = Math.round(result.points * 100);
  return (
    <li
      className={`rounded-xl border-2 px-4 py-3 ${
        result.correct
          ? 'border-gold/40 bg-gold/5'
          : 'border-pink/40 bg-pink/5'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
            result.correct
              ? 'bg-mkt-pill-gold text-navy-deep'
              : 'bg-pink text-white'
          }`}
        >
          {result.correct ? '✓' : '✗'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-widest text-sky">
            Câu {index} · {points}%
          </div>
          <div className="mt-1 text-sm text-white">{questionContent}</div>
          {result.explanation && (
            <div
              className={`mt-2 text-xs ${
                result.correct ? 'text-gold' : 'text-pink'
              }`}
            >
              {result.explanation}
            </div>
          )}

          {/* AI breakdown — chỉ hiện khi câu được AI chấm (situation / boss battle) */}
          {result.aiBreakdown && (
            <div className="mt-3 space-y-2 rounded-lg border border-sky/30 bg-navy-deep/40 p-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-sky">
                <span>🤖</span> AI ĐÁNH GIÁ THEO 3 TIÊU CHÍ
              </div>
              <div className="grid grid-cols-3 gap-2">
                <MiniCriterion label="Thái độ" value={result.aiBreakdown.attitude} weight="30%" />
                <MiniCriterion label="Logic" value={result.aiBreakdown.logic} weight="35%" />
                <MiniCriterion label="SOP" value={result.aiBreakdown.sopCompliance} weight="35%" />
              </div>
              {result.aiBreakdown.strengths.length > 0 && (
                <div className="text-xs">
                  <span className="font-bold text-gold">✓ Điểm mạnh:</span>{' '}
                  <span className="text-ice">{result.aiBreakdown.strengths.join(' · ')}</span>
                </div>
              )}
              {result.aiBreakdown.improvements.length > 0 && (
                <div className="text-xs">
                  <span className="font-bold text-pink">↗ Cải thiện:</span>{' '}
                  <span className="text-ice">{result.aiBreakdown.improvements.join(' · ')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function MiniCriterion({
  label,
  value,
  weight,
}: {
  label: string;
  value: number;
  weight: string;
}): JSX.Element {
  return (
    <div className="rounded border border-sky/20 bg-navy-deep/40 px-2 py-1.5 text-center">
      <div className="text-[9px] font-bold uppercase tracking-widest text-sky">
        {label} <span className="text-gold/70">({weight})</span>
      </div>
      <div className="text-lg font-black text-white tabular-nums">{value}</div>
    </div>
  );
}
