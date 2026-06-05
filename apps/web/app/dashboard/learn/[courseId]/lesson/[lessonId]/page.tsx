'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { LessonStatus } from '@mkt-academy/types';
import { useAuth } from '@/components/auth-provider';
import { LessonStatusBadge } from '@/components/lesson-status-badge';
import { LevelUpModal } from '@/components/level-up-modal';
import { ApiError } from '@/lib/api-client';
import { sfx } from '@/lib/audio';
import { learningApi } from '@/lib/learning-api';
import type { CompleteLessonResult, LessonDetail } from '@/lib/learning-types';
import { isDirectVideoFile, normalizeVideoUrl } from '@/lib/video-url';

export default function LessonDetailPage(): JSX.Element {
  const params = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const { refreshMe } = useAuth();
  const courseId = params?.courseId;
  const lessonId = params?.lessonId;

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [celebration, setCelebration] = useState<CompleteLessonResult | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const load = useCallback(async () => {
    if (!lessonId) return;
    try {
      const data = await learningApi.getLesson(lessonId);
      setLesson(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được bài học');
    }
  }, [lessonId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleComplete(): Promise<void> {
    if (!lessonId) return;
    setCompleting(true);
    setError(null);
    try {
      const result = await learningApi.completeLesson(lessonId);
      setCelebration(result);
      if (result.expAwarded > 0) {
        sfx.expGain();
        await refreshMe();
      }
      // Modal Level Up bật sau modal hoàn thành 1 nhịp (cảm giác "1 → 2")
      if (result.levelUp) {
        window.setTimeout(() => setShowLevelUp(true), 700);
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không hoàn thành được bài học');
    } finally {
      setCompleting(false);
    }
  }

  if (error && !lesson) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
        <Link href={`/dashboard/learn/${courseId}`} className="mkt-btn-secondary inline-flex">
          ← Quay lại khóa học
        </Link>
      </div>
    );
  }

  if (!lesson) {
    return <div className="mkt-card h-64 animate-pulse opacity-50" />;
  }

  const isCompleted = lesson.progress.status === LessonStatus.COMPLETED;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-xs text-sky">
        <Link href="/dashboard/learn" className="hover:text-orange">
          Khu vực học
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/dashboard/learn/${courseId}`} className="hover:text-orange">
          {lesson.module.courseTitle}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">{lesson.module.title}</span>
      </div>

      {/* Header bài học */}
      <header className="mkt-card p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="mkt-pill-navy !text-xs">
                M{lesson.module.order} · BÀI {lesson.order}
              </span>
              <LessonStatusBadge status={lesson.progress.status} size="md" />
            </div>
            <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">{lesson.title.toUpperCase()}</h1>
          </div>
        </div>
      </header>

      {/* Video — auto-normalize URL (YouTube watch?v=, Drive, Vimeo...) hoặc dùng <video> cho file MP4 */}
      {lesson.videoUrl && (
        <section className="mkt-card overflow-hidden p-0">
          <div className="relative aspect-video w-full overflow-hidden bg-black" onContextMenu={(e) => e.preventDefault()}>
            {isDirectVideoFile(lesson.videoUrl) ? (
              <video
                src={lesson.videoUrl}
                className="h-full w-full"
                controls
                controlsList="nodownload noplaybackrate noremoteplayback"
                disablePictureInPicture
                preload="metadata"
              >
                Trình duyệt không hỗ trợ phát video.
              </video>
            ) : (
              <iframe
                src={normalizeVideoUrl(lesson.videoUrl, { protectedMode: true })}
                className="h-full w-full"
                title={lesson.title}
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="no-referrer"
                sandbox="allow-same-origin allow-scripts allow-forms allow-presentation"
              />
            )}
            <VideoGuardOverlay />
          </div>
        </section>
      )}

      {/* Nội dung bài học */}
      <section className="mkt-card p-8">
        <h2 className="mb-4 text-h2-mkt-sm">
          <span className="mkt-pill-orange !text-sm">NỘI DUNG</span>
        </h2>
        <article className="space-y-4 text-body-mkt text-ice">
          {lesson.content.split('\n\n').map((para, idx) => (
            <p key={idx} className="whitespace-pre-line">
              {para}
            </p>
          ))}
        </article>
      </section>

      {/* Lỗi khi nộp */}
      {error && lesson && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      {/* Hành động */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          {lesson.navigation.prevLessonId && (
            <Link
              href={`/dashboard/learn/${courseId}/lesson/${lesson.navigation.prevLessonId}`}
              className="mkt-btn-secondary"
            >
              ← Bài trước
            </Link>
          )}
          {lesson.navigation.nextLessonId && (
            <Link
              href={`/dashboard/learn/${courseId}/lesson/${lesson.navigation.nextLessonId}`}
              className="mkt-btn-secondary"
            >
              Bài tiếp →
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={handleComplete}
          disabled={completing}
          className={`mkt-btn-primary disabled:cursor-not-allowed disabled:opacity-60 ${
            isCompleted ? '!bg-gold !text-navy-deep !shadow-mkt-badge' : ''
          }`}
        >
          {completing
            ? 'Đang lưu...'
            : isCompleted
              ? '✓ Đã hoàn thành — Học lại'
              : 'Đánh dấu hoàn thành'}
        </button>
      </section>

      {/* Modal chúc mừng khi hoàn thành lần đầu / mở khóa mô-đun */}
      <AnimatePresence>
        {celebration && (
          <CompletionModal
            result={celebration}
            courseId={courseId ?? ''}
            nextLessonId={lesson.navigation.nextLessonId}
            onClose={() => setCelebration(null)}
            onGoNext={() => {
              setCelebration(null);
              if (lesson.navigation.nextLessonId) {
                router.push(
                  `/dashboard/learn/${courseId}/lesson/${lesson.navigation.nextLessonId}`,
                );
              } else {
                router.push(`/dashboard/learn/${courseId}`);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Level Up modal toàn màn — hiển thị sau celebration 1 nhịp */}
      <AnimatePresence>
        {showLevelUp && celebration?.levelUp && (
          <LevelUpModal
            data={celebration.levelUp}
            onClose={() => setShowLevelUp(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function VideoGuardOverlay(): JSX.Element {
  return (
    <>
      <div
        className="absolute right-0 top-0 z-10 h-20 w-24 bg-gradient-to-bl from-black via-black/80 to-transparent"
        aria-hidden
      />
      <div
        className="absolute right-0 top-0 z-20 h-20 w-24 cursor-not-allowed"
        title="Video chỉ được xem trong hệ thống MKT Academy"
        aria-hidden
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-full bg-black/65 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">
        MKT Academy
      </div>
    </>
  );
}

function CompletionModal({
  result,
  nextLessonId,
  onClose,
  onGoNext,
}: {
  result: CompleteLessonResult;
  courseId: string;
  nextLessonId: string | null;
  onClose: () => void;
  onGoNext: () => void;
}): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 20 }}
        transition={{ type: 'spring', damping: 18, stiffness: 220 }}
        className="mkt-card relative w-full max-w-md p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-mkt-pill-gold text-5xl shadow-mkt-badge"
        >
          {result.module.moduleCompleted ? '🏆' : '✨'}
        </motion.div>
        <h2 className="text-h2-mkt-sm text-shadow-mkt">
          {result.module.moduleCompleted ? 'HOÀN THÀNH MÔ-ĐUN!' : 'HOÀN THÀNH BÀI!'}
        </h2>
        {result.expAwarded > 0 ? (
          <p className="mt-2 text-body-mkt text-ice">
            Bạn nhận được{' '}
            <span className="mkt-pill-orange !text-base">+{result.expAwarded} EXP</span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-sky">
            Bạn đã hoàn thành bài này trước đó — không cộng thêm EXP.
          </p>
        )}
        {result.module.moduleCompleted && (
          <p className="mt-3 rounded-xl border border-gold/50 bg-gold/10 px-4 py-2 text-sm text-gold">
            🔓 Mô-đun kế tiếp đã được MỞ KHÓA
          </p>
        )}
        <div className="mt-3 text-xs text-sky">
          Tiến độ mô-đun: {result.module.completedLessons} / {result.module.totalLessons} bài (
          {result.module.progressPercent}%)
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={onClose} className="mkt-btn-secondary">
            Đóng
          </button>
          <button type="button" onClick={onGoNext} className="mkt-btn-primary">
            {nextLessonId ? 'Bài tiếp theo →' : 'Quay lại khóa học'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
