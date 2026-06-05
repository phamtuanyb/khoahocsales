'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/protected-route';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';

// Layout "control center" — sidebar trái + topbar + content.
// Mobile: sidebar ẩn mặc định, hamburger toggle drawer.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="dashboard-shell flex min-h-screen">
        <Sidebar isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

        {/* Backdrop mobile — click vùng tối để đóng drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-30 bg-navy-deep/70 backdrop-blur-sm lg:hidden"
            />
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={() => setDrawerOpen(true)} />
          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
