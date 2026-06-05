'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ProgressBar } from '@/components/progress-bar';
import { ApiError } from '@/lib/api-client';
import { learningApi } from '@/lib/learning-api';
import type { CourseSummary } from '@/lib/learning-types';

export default function CoursesListPage(): JSX.Element {
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    learningApi
      .listCourses()
      .then((data) => mounted && setCourses(data))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Không tải được danh sách khóa học'),
      );
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <span className="mkt-pill-navy">KHU VỰC HỌC KIẾN THỨC</span>
        <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">
          CÂY <span className="text-orange">KHÓA HỌC</span> CỦA BẠN
        </h1>
        <p className="mt-2 text-body-mkt text-ice">
          Học xong từng mô-đun mới mở mô-đun kế tiếp. Mỗi bài hoàn thành cộng +10 EXP.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      {!courses && !error && <LoadingCards />}

      {courses && courses.length === 0 && (
        <div className="mkt-card p-8 text-center">
          <p className="text-body-mkt text-ice">
            Chưa có khóa học nào dành cho phòng ban của bạn.
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {courses?.map((course, idx) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
          >
            <CourseCard course={course} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: CourseSummary }): JSX.Element {
  const done = course.progressPercent === 100;
  const started = course.completedLessons > 0;
  return (
    <Link
      href={`/dashboard/learn/${course.id}`}
      className="mkt-card group block overflow-hidden p-6 transition hover:-translate-y-1 hover:shadow-mkt-3d"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="mkt-pill-orange !text-xs">
            PHÒNG {course.department.name.toUpperCase()}
          </span>
          <h3 className="mt-2 text-xl font-black uppercase leading-tight text-white">
            {course.title}
          </h3>
        </div>
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-mkt-3d ${
            done
              ? 'bg-mkt-pill-gold text-navy-deep'
              : started
                ? 'bg-mkt-pill-orange text-white'
                : 'bg-navy-deep text-sky'
          }`}
        >
          {done ? '🏆' : started ? '📖' : '📚'}
        </div>
      </div>

      {course.description && (
        <p className="mb-5 line-clamp-2 text-sm text-ice">{course.description}</p>
      )}

      <div className="space-y-3">
        <ProgressBar
          percent={course.progressPercent}
          label="Tiến độ"
          fraction={{ current: course.completedLessons, total: course.totalLessons, unit: 'bài' }}
        />
        <div className="flex items-center justify-between text-xs text-sky">
          <span>{course.moduleCount} mô-đun</span>
          <span className="font-bold text-gold">{course.progressPercent}%</span>
        </div>
      </div>
    </Link>
  );
}

function LoadingCards(): JSX.Element {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="mkt-card h-48 animate-pulse opacity-50" />
      ))}
    </div>
  );
}
