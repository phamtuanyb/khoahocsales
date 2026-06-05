'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ProgressBar } from '@/components/progress-bar';
import type { EnrolledCourse } from '@/lib/gamification-types';

export function EnrolledCoursesWidget({
  courses,
}: {
  courses: EnrolledCourse[];
}): JSX.Element {
  return (
    <section className="mkt-card p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <span className="mkt-pill-orange !text-xs">KHÓA HỌC CỦA BẠN</span>
          <h2 className="mt-2 text-h2-mkt-sm">ĐANG HỌC</h2>
        </div>
        <span className="text-3xl">📚</span>
      </div>

      {courses.length === 0 ? (
        <p className="text-sm text-sky">Chưa có khóa học nào.</p>
      ) : (
        <ul className="space-y-3">
          {courses.map((c, i) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/dashboard/learn/${c.id}`}
                className="block rounded-xl border-2 border-sky/30 bg-navy-deep/40 px-4 py-3 transition hover:border-orange hover:bg-navy-deep/60"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold text-white">
                    {c.title}
                  </span>
                  <span className="shrink-0 text-xs font-bold text-gold">
                    {c.progressPercent}%
                  </span>
                </div>
                <ProgressBar
                  percent={c.progressPercent}
                  fraction={{ current: c.completedLessons, total: c.totalLessons, unit: 'bài' }}
                  size="sm"
                />
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
