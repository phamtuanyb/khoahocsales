'use client';

import { motion } from 'framer-motion';

export function LoadingScreen({ label = 'Đang tải...' }: { label?: string }): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          className="h-16 w-16 rounded-full border-4 border-sky border-t-orange"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <span className="text-sm font-bold uppercase tracking-widest text-sky">{label}</span>
      </div>
    </div>
  );
}
