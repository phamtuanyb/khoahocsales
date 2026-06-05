'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LessonStatus } from '@mkt-academy/types';
import { LessonStatusBadge } from '@/components/lesson-status-badge';
import { ProgressBar } from '@/components/progress-bar';
import { ApiError } from '@/lib/api-client';
import { learningApi } from '@/lib/learning-api';
import type { CourseTree, LessonSummary, ModuleTree } from '@/lib/learning-types';

export default function CourseTreePage(): JSX.Element {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId;
  const [course, setCourse] = useState<CourseTree | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    let mounted = true;
    learningApi
      .getCourse(courseId)
      .then((data) => mounted && setCourse(data))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Không tải được khóa học'),
      );
    return () => {
      mounted = false;
    };
  }, [courseId]);

  if (error) {
    return (
      <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
        ⚠ {error}
      </div>
    );
  }
  if (!course) {
    return <div className="mkt-card h-48 animate-pulse opacity-50" />;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div className="text-xs text-sky">
        <Link href="/dashboard/learn" className="hover:text-orange">
          Khu vực học
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">{course.title}</span>
      </div>

      <header className="mkt-card p-8">
        <span className="mkt-pill-orange !text-xs">PHÒNG {course.department.name.toUpperCase()}</span>
        <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">{course.title.toUpperCase()}</h1>
        {course.description && (
          <p className="mt-2 text-body-mkt text-ice">{course.description}</p>
        )}
        <div className="mt-5 max-w-md">
          <ProgressBar
            percent={course.progressPercent}
            label="Tiến độ khóa học"
            fraction={{ current: course.completedLessons, total: course.totalLessons, unit: 'bài' }}
            size="lg"
          />
        </div>
      </header>

      {/* Danh sách mô-đun */}
      <div className="space-y-4">
        {course.modules.map((module, idx) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
          >
            <ModuleSection courseId={course.id} module={module} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ModuleSection({
  courseId,
  module,
}: {
  courseId: string;
  module: ModuleTree;
}): JSX.Element {
  return (
    <section
      className={`mkt-card p-6 ${module.locked ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="mkt-pill-navy !text-xs">M{module.order}</span>
            {module.locked && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-navy-deep/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky/60">
                🔒 Khóa
              </span>
            )}
            {module.progressPercent === 100 && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">
                ✓ Hoàn thành
              </span>
            )}
          </div>
          <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-white">
            {module.title}
          </h2>
          {module.description && (
            <p className="mt-1 text-sm text-ice">{module.description}</p>
          )}
        </div>
        <div className="w-full shrink-0 sm:w-48">
          <ProgressBar
            percent={module.progressPercent}
            fraction={{
              current: module.completedLessons,
              total: module.totalLessons,
              unit: 'bài',
            }}
          />
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {module.lessons.map((lesson) => (
          <LessonRow
            key={lesson.id}
            courseId={courseId}
            lesson={lesson}
            disabled={module.locked}
          />
        ))}
      </ul>

      {module.locked && (
        <p className="mt-4 text-center text-xs italic text-sky">
          Hoàn thành 100% mô-đun trước để mở khóa.
        </p>
      )}

      {/* CTA bài thi mô-đun */}
      {module.quiz && (
        <div className="mt-5 border-t border-sky/20 pt-4">
          <ModuleQuizCta quiz={module.quiz} />
        </div>
      )}
    </section>
  );
}

function ModuleQuizCta({
  quiz,
}: {
  quiz: NonNullable<ModuleTree['quiz']>;
}): JSX.Element {
  if (quiz.locked) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-sky/30 bg-navy-deep/30 px-4 py-3 opacity-60">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <div className="text-sm font-bold text-white">{quiz.title}</div>
            <div className="text-xs text-sky">
              Hoàn thành 100% bài học trong mô-đun để mở bài thi
            </div>
          </div>
        </div>
        <span className="mkt-pill-navy !text-xs">KHÓA</span>
      </div>
    );
  }

  return (
    <Link
      href={`/dashboard/quiz/${quiz.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border-2 border-orange/50 bg-orange/10 px-4 py-3 transition hover:border-orange hover:bg-orange/20 hover:shadow-mkt-cta"
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{quiz.passed ? '🏆' : '🎯'}</span>
        <div>
          <div className="text-sm font-bold uppercase tracking-wide text-white">
            {quiz.title}
          </div>
          <div className="text-xs text-ice">
            {quiz.passed
              ? `Đã đỗ (điểm cao nhất ${quiz.bestScore}%)`
              : quiz.attemptsUsed > 0
                ? `Đã làm ${quiz.attemptsUsed} lần — điểm cao nhất ${quiz.bestScore ?? 0}%`
                : `Điểm đạt ${quiz.passScore}% · ${Math.floor(quiz.timeLimitSec / 60)} phút`}
          </div>
        </div>
      </div>
      <span
        className={`mkt-pill-orange !text-xs ${
          quiz.passed ? '!bg-gold !text-navy-deep' : ''
        }`}
      >
        {quiz.passed ? 'Đã đỗ' : 'Làm bài →'}
      </span>
    </Link>
  );
}

function LessonRow({
  courseId,
  lesson,
  disabled,
}: {
  courseId: string;
  lesson: LessonSummary;
  disabled: boolean;
}): JSX.Element {
  const locked = disabled || lesson.status === LessonStatus.LOCKED;
  const completed = lesson.status === LessonStatus.COMPLETED;

  const body = (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 transition ${
        locked
          ? 'cursor-not-allowed border-sky/20 bg-navy-deep/30'
          : completed
            ? 'border-gold/40 bg-gold/5 hover:border-gold'
            : 'border-sky/30 bg-navy-deep/40 hover:border-orange hover:bg-navy-deep/60'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            locked
              ? 'bg-navy-deep/60 text-sky/40'
              : completed
                ? 'bg-mkt-pill-gold text-navy-deep'
                : 'bg-sky/20 text-white'
          }`}
        >
          {locked ? '🔒' : completed ? '✓' : lesson.order}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-white">{lesson.title}</div>
          <div className="flex items-center gap-2 text-[10px] text-sky">
            {lesson.hasVideo && <span>🎬 Có video</span>}
          </div>
        </div>
      </div>
      <LessonStatusBadge status={locked ? LessonStatus.LOCKED : lesson.status} />
    </div>
  );

  if (locked) return <li>{body}</li>;
  return (
    <li>
      <Link href={`/dashboard/learn/${courseId}/lesson/${lesson.id}`}>{body}</Link>
    </li>
  );
}
