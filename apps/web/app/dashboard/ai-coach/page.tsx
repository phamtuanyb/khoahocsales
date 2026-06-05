'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LoadingScreen } from '@/components/loading-screen';
import { ApiError } from '@/lib/api-client';
import { coachApi } from '@/lib/coach-api';
import type { CoachScenario, CoachSessionSummary } from '@/lib/coach-types';

export default function AiCoachLandingPage(): JSX.Element {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<CoachScenario[] | null>(null);
  const [history, setHistory] = useState<CoachSessionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([coachApi.scenarios(), coachApi.history()])
      .then(([s, h]) => {
        if (!mounted) return;
        setScenarios(s);
        setHistory(h);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Không tải được AI Coach'),
      );
    return () => {
      mounted = false;
    };
  }, []);

  async function startSession(scenarioId: string): Promise<void> {
    setStarting(scenarioId);
    setError(null);
    try {
      const session = await coachApi.create(scenarioId);
      router.push(`/dashboard/ai-coach/${session.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tạo được phiên');
      setStarting(null);
    }
  }

  if (error && !scenarios) {
    return (
      <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
        ⚠ {error}
      </div>
    );
  }
  if (!scenarios) return <LoadingScreen label="Đang tải AI Coach" />;

  return (
    <div className="space-y-6">
      <header>
        <span className="mkt-pill-orange !text-xs">AI COACH - LUYỆN THỰC CHIẾN</span>
        <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">
          GIẢ LẬP <span className="text-orange">KHÁCH HÀNG</span> BẰNG AI
        </h1>
        <p className="mt-2 text-body-mkt text-ice">
          AI đóng vai khách hàng theo kịch bản. Bạn áp dụng SOP/LAARC để xử lý.
          Cuối phiên AI chấm điểm theo 3 tiêu chí: Thái độ, Logic và SOP.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      <section>
        <h2 className="mb-4 text-h2-mkt-sm">
          <span className="mkt-pill-orange !text-sm">CHỌN KỊCH BẢN</span>
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {scenarios.map((s, i) => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              loading={starting === s.id}
              onStart={() => startSession(s.id)}
              delay={i * 0.05}
            />
          ))}
        </div>
      </section>

      {history && history.length > 0 && (
        <section className="mkt-card p-6">
          <h2 className="mb-4 text-h2-mkt-sm">
            <span className="mkt-pill-orange !text-sm">PHIÊN GẦN ĐÂY</span>
          </h2>
          <ul className="space-y-2">
            {history.slice(0, 10).map((h) => (
              <li key={h.id}>
                <Link
                  href={`/dashboard/ai-coach/${h.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-sky/20 bg-navy-deep/30 px-4 py-3 transition hover:border-orange"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">
                      {h.scenarioName}
                    </div>
                    <div className="text-[10px] text-sky">
                      {new Date(h.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  {h.finished && h.score !== null ? (
                    <span
                      className={`rounded-pill px-3 py-1 text-sm font-black tabular-nums ${
                        h.score >= 70
                          ? 'bg-mkt-pill-gold text-navy-deep'
                          : h.score >= 50
                            ? 'bg-mkt-pill-orange text-white'
                            : 'bg-pink text-white'
                      }`}
                    >
                      {h.score}/100
                    </span>
                  ) : (
                    <span className="rounded-pill bg-sky/20 px-3 py-1 text-xs uppercase text-sky">
                      Đang dở
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ScenarioCard({
  scenario,
  loading,
  onStart,
  delay,
}: {
  scenario: CoachScenario;
  loading: boolean;
  onStart: () => void;
  delay: number;
}): JSX.Element {
  const diffColor =
    scenario.difficulty === 'HARD'
      ? 'bg-pink text-white'
      : scenario.difficulty === 'MEDIUM'
        ? 'bg-orange text-white'
        : 'bg-sky text-navy-deep';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="mkt-card flex flex-col gap-4 p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-deep to-navy text-3xl shadow-mkt-3d">
            {scenario.icon}
          </div>
          <div>
            <h3 className="text-lg font-black uppercase text-white">{scenario.name}</h3>
            <span className={`mt-1 inline-block rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase ${diffColor}`}>
              {scenario.difficulty === 'EASY' ? 'Dễ' : scenario.difficulty === 'MEDIUM' ? 'Trung bình' : 'Khó'}
            </span>
          </div>
        </div>
        <span className="mkt-pill-orange !text-xs">+{scenario.rewardExp} EXP</span>
      </div>

      <p className="text-sm text-ice">{scenario.description}</p>

      <ul className="space-y-1 text-xs text-sky">
        <div className="font-bold uppercase tracking-widest">Tiêu chí thành công</div>
        {scenario.successCriteria.map((c, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-orange">▸</span>
            <span>{c}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onStart}
        disabled={loading}
        className="mkt-btn-primary mt-auto disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Đang khởi động...' : 'Bắt đầu luyện'}
      </button>
    </motion.div>
  );
}
