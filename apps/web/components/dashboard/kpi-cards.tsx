'use client';

import { motion } from 'framer-motion';

interface KpiData {
  quizPassRate: number;
  quizAttempts: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  weeklyExp: number;
}

export function KpiCards({ kpi }: { kpi: KpiData }): JSX.Element {
  const items = [
    {
      label: 'Tỷ lệ đỗ bài thi',
      value: `${Math.round(kpi.quizPassRate * 100)}%`,
      subtitle: `${kpi.quizAttempts} lượt làm`,
      accent: 'orange' as const,
      icon: '🎯',
    },
    {
      label: 'Khóa học hoàn thành',
      value: String(kpi.coursesCompleted),
      subtitle: `${kpi.lessonsCompleted} bài đã học`,
      accent: 'gold' as const,
      icon: '🎓',
    },
    {
      label: 'EXP tuần này',
      value: String(kpi.weeklyExp),
      subtitle: 'từ thứ 2 tới giờ',
      accent: 'pink' as const,
      icon: '⚡',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="mkt-card flex items-center gap-4 p-5"
        >
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-mkt-3d ${
              item.accent === 'orange'
                ? 'bg-mkt-pill-orange text-white'
                : item.accent === 'gold'
                  ? 'bg-mkt-pill-gold text-navy-deep'
                  : 'bg-pink text-white'
            }`}
          >
            {item.icon}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-sky">
              {item.label}
            </div>
            <div
              className={`text-2xl font-black ${
                item.accent === 'orange'
                  ? 'text-orange'
                  : item.accent === 'gold'
                    ? 'text-gold'
                    : 'text-pink'
              }`}
            >
              {item.value}
            </div>
            <div className="text-xs text-ice">{item.subtitle}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
