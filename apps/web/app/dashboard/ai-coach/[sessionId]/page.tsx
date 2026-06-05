'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/components/auth-provider';
import { LoadingScreen } from '@/components/loading-screen';
import { ApiError } from '@/lib/api-client';
import { sfx } from '@/lib/audio';
import { coachApi } from '@/lib/coach-api';
import type { CoachSession } from '@/lib/coach-types';

const MAX_TURNS = 6;

export default function CoachSessionPage(): JSX.Element {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params?.sessionId;
  const { refreshMe } = useAuth();

  const [session, setSession] = useState<CoachSession | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!sessionId) return;
    try {
      const s = await coachApi.get(sessionId);
      setSession(s);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được phiên');
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.transcript.length, session?.feedback]);

  async function handleSend(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!sessionId || !input.trim() || sending) return;
    setSending(true);
    setError(null);
    const content = input.trim();
    setInput('');
    try {
      const next = await coachApi.sendMessage(sessionId, content);
      setSession(next);
      sfx.click();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không gửi được tin nhắn');
      setInput(content);
    } finally {
      setSending(false);
    }
  }

  async function handleFinish(): Promise<void> {
    if (!sessionId || finishing) return;
    setFinishing(true);
    setError(null);
    try {
      const next = await coachApi.finish(sessionId);
      setSession(next);
      await refreshMe();
      if (next.score && next.score >= 70) sfx.pass();
      else sfx.fail();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không kết thúc được phiên');
    } finally {
      setFinishing(false);
    }
  }

  if (error && !session) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
        <Link href="/dashboard/ai-coach" className="mkt-btn-secondary inline-flex">
          ← Quay lại danh sách kịch bản
        </Link>
      </div>
    );
  }
  if (!session) return <LoadingScreen label="Đang vào phiên luyện tập" />;

  const finished = session.finished;
  const turnsLeft = MAX_TURNS - session.userTurnCount;
  const canSend = !finished && turnsLeft > 0;

  return (
    <div className="space-y-4">
      <header className="mkt-card flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-deep to-navy text-2xl">
            {session.scenario.icon}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-sky">
              AI COACH - KỊCH BẢN
            </div>
            <div className="truncate text-lg font-black uppercase text-white">
              {session.scenario.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-pill bg-navy-deep/60 px-3 py-1 text-xs font-bold text-white">
            Lượt {session.userTurnCount}/{MAX_TURNS}
          </span>
          {!finished && (
            <button
              type="button"
              onClick={handleFinish}
              disabled={finishing || session.userTurnCount === 0}
              className="mkt-btn-primary !text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {finishing ? 'AI đang chấm...' : 'Kết thúc & nhận điểm'}
            </button>
          )}
          <Link href="/dashboard/ai-coach" className="mkt-btn-secondary !text-sm">
            ← Đóng
          </Link>
        </div>
      </header>

      <section className="mkt-card flex flex-col" style={{ height: '60vh', minHeight: 480 }}>
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="rounded-xl border border-orange/30 bg-orange/5 p-3 text-xs text-ice">
            <span className="font-bold uppercase tracking-widest text-orange">Mục tiêu phiên:</span>{' '}
            {session.scenario.description}
          </div>

          {session.transcript.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} delay={i * 0.02} />
          ))}

          {sending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 px-2 text-xs text-sky"
            >
              <span className="flex gap-1">
                <motion.span
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="inline-block h-2 w-2 rounded-full bg-sky"
                />
                <motion.span
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                  className="inline-block h-2 w-2 rounded-full bg-sky"
                />
                <motion.span
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                  className="inline-block h-2 w-2 rounded-full bg-sky"
                />
              </span>
              <span>Khách hàng đang trả lời...</span>
            </motion.div>
          )}
        </div>

        {canSend && (
          <form onSubmit={handleSend} className="border-t border-sky/20 p-3">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !sending) {
                      const fakeEvent = { preventDefault: () => {} } as FormEvent<HTMLFormElement>;
                      handleSend(fakeEvent);
                    }
                  }
                }}
                rows={2}
                placeholder="Phản hồi của bạn (Enter để gửi, Shift+Enter xuống dòng)..."
                disabled={sending}
                className="flex-1 rounded-xl border-2 border-sky/40 bg-navy-deep/60 px-3 py-2 text-sm text-white placeholder-sky/40 outline-none transition focus:border-orange disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="mkt-btn-primary !px-4 !py-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? '...' : 'Gửi →'}
              </button>
            </div>
            <div className="mt-1 text-[10px] text-sky">
              Còn {turnsLeft} lượt. Tip: áp dụng LAARC (Listen, Acknowledge, Assess, Respond, Confirm).
            </div>
          </form>
        )}

        {!canSend && !finished && (
          <div className="border-t border-sky/20 p-3 text-center text-sm text-sky">
            Đã hết lượt trả lời. Bấm "Kết thúc & nhận điểm" để AI chấm.
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      <AnimatePresence>
        {finished && session.feedback && (
          <CoachResult
            scenarioName={session.scenario.name}
            feedback={session.feedback}
            onRestart={() => router.push('/dashboard/ai-coach')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MessageBubble({
  role,
  content,
  delay,
}: {
  role: 'user' | 'assistant';
  content: string;
  delay: number;
}): JSX.Element {
  const isUser = role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink/30 text-lg">
          👤
        </div>
      )}
      <div
        className={`max-w-[75%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
          isUser
            ? 'rounded-tr-sm bg-mkt-pill-orange text-white'
            : 'rounded-tl-sm bg-navy-deep/70 text-ice ring-1 ring-sky/30'
        }`}
      >
        {content}
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange/30 text-lg">
          🧑‍💼
        </div>
      )}
    </motion.div>
  );
}

function CoachResult({
  scenarioName,
  feedback,
  onRestart,
}: {
  scenarioName: string;
  feedback: NonNullable<CoachSession['feedback']>;
  onRestart: () => void;
}): JSX.Element {
  const passed = feedback.total >= 70;
  return (
    <motion.section
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 14 }}
      className="mkt-card overflow-hidden p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className={`mkt-pill-orange !text-xs ${passed ? '!bg-gold !text-navy-deep' : '!bg-pink'}`}>
            AI ĐÃ CHẤM
          </span>
          <h2 className="mt-2 text-h2-mkt-sm text-shadow-mkt">
            {scenarioName.toUpperCase()}
          </h2>
        </div>
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className={`flex h-24 w-24 items-center justify-center rounded-full text-3xl font-black shadow-mkt-3d ${
            passed
              ? 'bg-mkt-pill-gold text-navy-deep'
              : feedback.total >= 50
                ? 'bg-mkt-pill-orange text-white'
                : 'bg-pink text-white'
          }`}
        >
          {feedback.total}
        </motion.div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <CriterionBar label="Thái độ" value={feedback.attitude} weight="30%" />
        <CriterionBar label="Logic xử lý" value={feedback.logic} weight="35%" />
        <CriterionBar label="Đúng SOP" value={feedback.sopCompliance} weight="35%" />
      </div>

      <div className="mt-5 rounded-xl border border-sky/30 bg-navy-deep/40 p-4">
        <div className="text-xs font-bold uppercase tracking-widest text-sky">Nhận xét tổng</div>
        <p className="mt-1 text-sm text-white">{feedback.summary}</p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
            <span>✓</span> ĐIỂM MẠNH
          </div>
          <ul className="space-y-1 text-sm text-ice">
            {feedback.strengths.length === 0 && <li className="text-sky">Chưa có điểm nổi bật.</li>}
            {feedback.strengths.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-pink/30 bg-pink/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink">
            <span>↗</span> CẦN CẢI THIỆN
          </div>
          <ul className="space-y-1 text-sm text-ice">
            {feedback.improvements.length === 0 && <li className="text-sky">Không có vấn đề lớn.</li>}
            {feedback.improvements.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </div>
      </div>

      {feedback.recommendedTopics.length > 0 && (
        <div className="mt-4 rounded-xl border border-orange/30 bg-orange/5 p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-orange">
            NÊN ÔN LẠI
          </div>
          <div className="flex flex-wrap gap-2">
            {feedback.recommendedTopics.map((t, i) => (
              <span
                key={i}
                className="rounded-pill bg-orange/20 px-3 py-1 text-xs font-bold text-orange"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Link href="/dashboard/learn" className="mkt-btn-secondary">
          Vào khu vực học
        </Link>
        <button type="button" onClick={onRestart} className="mkt-btn-primary">
          Luyện kịch bản khác →
        </button>
      </div>
    </motion.section>
  );
}

function CriterionBar({
  label,
  value,
  weight,
}: {
  label: string;
  value: number;
  weight: string;
}): JSX.Element {
  return (
    <div className="rounded-xl border border-sky/30 bg-navy-deep/40 p-4">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-sky">
        <span>{label}</span>
        <span className="text-gold">{weight}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-black text-white">{value}</span>
        <span className="text-sm text-sky">/100</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-pill bg-navy-deep/60">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-pill ${
            value >= 70 ? 'bg-mkt-exp-bar' : value >= 50 ? 'bg-orange' : 'bg-pink'
          }`}
        />
      </div>
    </div>
  );
}
