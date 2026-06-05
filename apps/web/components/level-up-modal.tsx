'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { sfx } from '@/lib/audio';
import type { LevelUpData } from '@/lib/quiz-types';

interface LevelUpModalProps {
  data: LevelUpData;
  onClose: () => void;
}

// Modal Level Up toàn màn — spec mục 8.6 (nhân vật + tia sáng + số level lớn).
// Tự phát SFX fanfare khi mount.
export function LevelUpModal({ data, onClose }: LevelUpModalProps): JSX.Element {
  useEffect(() => {
    sfx.levelUp();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(circle at center, rgba(255,140,0,0.35) 0%, rgba(13,71,161,0.95) 60%, rgba(0,0,0,0.95) 100%)',
      }}
    >
      {/* Tia sáng / particles xoay nền */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ rotate: 0, opacity: 0 }}
        animate={{ rotate: 360, opacity: 0.4 }}
        transition={{ rotate: { duration: 20, repeat: Infinity, ease: 'linear' }, opacity: { duration: 0.6 } }}
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, rgba(255,215,0,0.25) 30deg, transparent 60deg, rgba(255,140,0,0.25) 120deg, transparent 150deg, rgba(255,215,0,0.25) 210deg, transparent 240deg, rgba(255,140,0,0.25) 300deg, transparent 330deg)',
        }}
      />

      {/* Confetti emoji rơi */}
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ y: -100, x: Math.random() * 800 - 400, opacity: 0, rotate: 0 }}
          animate={{
            y: 800,
            opacity: [0, 1, 1, 0],
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
          }}
          transition={{ duration: 2.5 + Math.random() * 1.5, delay: Math.random() * 0.8, ease: 'easeIn' }}
          className="absolute top-0 text-3xl"
          aria-hidden
        >
          {['⭐', '✨', '🏆', '💫', '🎉'][i % 5]}
        </motion.span>
      ))}

      <div className="relative z-10 text-center">
        {/* Nhãn LEVEL UP */}
        <motion.div
          initial={{ scale: 0, y: -40 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
        >
          <span className="mkt-pill-orange !px-6 !py-2 !text-xl">LEVEL UP!</span>
        </motion.div>

        {/* Level mới */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 8, stiffness: 100, delay: 0.4 }}
          className="mt-8"
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-sky">
            Từ Level {data.fromLevel.order} → Level {data.toLevel.order}
          </div>
          <div
            className="my-2 font-black uppercase text-white text-shadow-mkt"
            style={{ fontSize: '120px', lineHeight: '1' }}
          >
            <motion.span
              className="inline-block"
              animate={{ rotate: [0, -8, 8, -5, 5, 0] }}
              transition={{ duration: 1.2, delay: 0.6 }}
              style={{
                background: 'linear-gradient(180deg, #F59E0B 0%, #F97316 60%, #EC4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 20px rgba(249,115,22,0.45))',
              }}
            >
              {data.toLevel.order}
            </motion.span>
          </div>
          <div className="text-h2-mkt-sm uppercase tracking-tight text-gold">
            {data.toLevel.name}
          </div>
        </motion.div>

        {/* Mô tả */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-6 text-body-mkt text-ice"
        >
          Bạn đã đạt {data.toLevel.expThreshold} EXP và lên Level mới.
          <br />
          Hành trình của bạn đang tiến rất nhanh!
        </motion.p>

        <motion.button
          type="button"
          onClick={() => {
            sfx.click();
            onClose();
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.4 }}
          className="mkt-btn-primary mt-8 !text-lg"
        >
          Tiếp tục chinh phục →
        </motion.button>
      </div>
    </motion.div>
  );
}
