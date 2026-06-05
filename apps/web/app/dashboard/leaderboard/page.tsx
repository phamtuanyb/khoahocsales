'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { findAvatar } from '@/lib/avatars';
import { ApiError } from '@/lib/api-client';
import { gamificationApi } from '@/lib/gamification-api';
import type {
  LeaderboardPeriod,
  LeaderboardResult,
  LeaderboardRow,
  LeaderboardType,
} from '@/lib/gamification-types';
import { getSocket } from '@/lib/socket';

const BOARDS: Array<{ id: LeaderboardType; label: string; icon: string; description: string }> = [
  { id: 'TOP_LEARNING', label: 'Top Học Tập', icon: '📚', description: 'Xếp theo tổng EXP' },
  { id: 'TOP_DILIGENT', label: 'Top Chăm Chỉ', icon: '🔥', description: 'Xếp theo streak ngày' },
  { id: 'WEEKLY_WARRIOR', label: 'Chiến Binh Tuần', icon: '⚔️', description: 'EXP nhiều nhất trong tuần' },
];

const PERIODS: Array<{ id: LeaderboardPeriod; label: string }> = [
  { id: 'WEEKLY', label: 'Tuần này' },
  { id: 'MONTHLY', label: 'Tháng này' },
  { id: 'ALL_TIME', label: 'Tất cả' },
];

export default function LeaderboardPage(): JSX.Element {
  const [board, setBoard] = useState<LeaderboardType>('TOP_LEARNING');
  const [period, setPeriod] = useState<LeaderboardPeriod>('WEEKLY');
  const [data, setData] = useState<LeaderboardResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashRefresh, setFlashRefresh] = useState(false);
  const prevRowsRef = useRef<LeaderboardRow[]>([]);

  const fetchBoard = useCallback(async () => {
    try {
      const r = await gamificationApi.getLeaderboard(board, period);
      setData(r);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được bảng xếp hạng');
    }
  }, [board, period]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  // Subscribe socket realtime: refetch khi server thông báo invalidation.
  useEffect(() => {
    const socket = getSocket();
    const handler = (): void => {
      setFlashRefresh(true);
      fetchBoard();
      window.setTimeout(() => setFlashRefresh(false), 800);
    };
    socket.on('leaderboard.invalidated', handler);
    return () => {
      socket.off('leaderboard.invalidated', handler);
    };
  }, [fetchBoard]);

  // Lưu rows trước đó để tính delta rank cho animation
  useEffect(() => {
    if (data) prevRowsRef.current = data.rows;
  }, [data]);

  const meta = BOARDS.find((b) => b.id === board)!;

  return (
    <div className="space-y-6">
      <header>
        <span className="mkt-pill-orange !text-xs">BẢNG XẾP HẠNG</span>
        <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">
          {meta.icon} <span className="text-orange">{meta.label.toUpperCase()}</span>
        </h1>
        <p className="mt-1 text-sm text-ice">{meta.description}</p>
      </header>

      {/* Tabs board */}
      <div className="flex flex-wrap gap-2">
        {BOARDS.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setBoard(b.id)}
            className={`flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-bold uppercase tracking-wide transition ${
              board === b.id
                ? 'bg-mkt-pill-orange text-white shadow-mkt-cta'
                : 'border-2 border-sky/30 bg-navy-deep/40 text-ice hover:border-sky'
            }`}
          >
            <span>{b.icon}</span>
            <span>{b.label}</span>
          </button>
        ))}
      </div>

      {/* Tabs period */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`rounded-pill px-3 py-1.5 text-xs font-bold uppercase transition ${
              period === p.id
                ? 'bg-gold text-navy-deep'
                : 'border border-sky/30 text-sky hover:border-gold hover:text-gold'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Indicator realtime */}
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-sky">
        <motion.span
          animate={{
            scale: flashRefresh ? [1, 1.6, 1] : 1,
            color: flashRefresh ? ['#6FA9F9', '#F59E0B', '#6FA9F9'] : '#6FA9F9',
          }}
          transition={{ duration: 0.8 }}
          className="inline-block h-2 w-2 rounded-full bg-sky"
        />
        <span>REALTIME · cập nhật tức thì qua Socket.io</span>
      </div>

      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      {/* Top 3 podium */}
      {data && data.rows.length > 0 && (
        <Podium rows={data.rows.slice(0, 3)} />
      )}

      {/* Bảng còn lại */}
      <section className="mkt-card p-4">
        <ol className="space-y-2">
          <AnimatePresence initial={false}>
            {data?.rows.slice(3).map((row) => (
              <LeaderboardRowItem
                key={row.userId}
                row={row}
                prevRank={prevRowsRef.current.find((r) => r.userId === row.userId)?.rank}
              />
            ))}
          </AnimatePresence>
          {data && data.rows.length === 0 && (
            <li className="py-8 text-center text-sm text-sky">
              Chưa có dữ liệu cho bảng này — hãy hoàn thành bài học/quiz để xuất hiện.
            </li>
          )}
        </ol>

        {/* Vị trí của tôi (nếu không trong top hiển thị) */}
        {data?.myRank && !data.rows.find((r) => r.userId === data.myRank!.userId) && (
          <div className="mt-4 border-t border-sky/20 pt-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-sky">
              Vị trí của bạn
            </div>
            <LeaderboardRowItem row={data.myRank} prevRank={undefined} />
          </div>
        )}
      </section>
    </div>
  );
}

function Podium({ rows }: { rows: LeaderboardRow[] }): JSX.Element {
  const podium = [rows[1], rows[0], rows[2]].filter(Boolean) as LeaderboardRow[]; // 2-1-3 visual
  const sizes = ['h-32', 'h-44', 'h-28'];
  const medals = ['🥈', '🥇', '🥉'];

  return (
    <section className="mkt-card p-6">
      <div className="grid grid-cols-3 items-end gap-4">
        {podium.map((row, i) => {
          const avatar = findAvatar(row.avatar);
          return (
            <motion.div
              key={row.userId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-3xl">{medals[i]}</span>
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${avatar.bg} text-3xl ring-2 ${avatar.ring} ${
                  row.isMe ? 'animate-badge-pulse' : ''
                }`}
              >
                {avatar.emoji}
              </div>
              <div className="line-clamp-1 text-center text-xs font-bold text-white">
                {row.name}
              </div>
              <div
                className={`flex w-full items-center justify-center rounded-t-2xl border-x-2 border-t-2 bg-navy-deep/60 text-2xl font-black tabular-nums ${sizes[i]} ${
                  i === 1 ? 'border-gold text-gold' : 'border-sky text-white'
                }`}
              >
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-widest text-sky">
                    {row.metric}
                  </div>
                  <div>{row.score}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function LeaderboardRowItem({
  row,
  prevRank,
}: {
  row: LeaderboardRow;
  prevRank?: number;
}): JSX.Element {
  const avatar = findAvatar(row.avatar);
  const delta = prevRank !== undefined ? prevRank - row.rank : 0;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ layout: { duration: 0.5, ease: 'easeOut' } }}
      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 ${
        row.isMe
          ? 'border-orange/70 bg-orange/10 shadow-mkt-cta'
          : 'border-sky/20 bg-navy-deep/30'
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black tabular-nums ${
          row.rank <= 3
            ? 'bg-mkt-pill-gold text-navy-deep'
            : 'bg-navy-deep/60 text-white'
        }`}
      >
        #{row.rank}
      </span>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatar.bg} text-xl ring-1 ${avatar.ring}`}
      >
        {avatar.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-bold text-white">
            {row.name}
            {row.isMe && (
              <span className="ml-2 rounded-pill bg-orange px-2 py-0.5 text-[10px] uppercase">BẠN</span>
            )}
          </span>
        </div>
        <div className="text-[10px] text-sky">
          Lv.{row.level} {row.levelName ?? ''} · {row.department ?? '—'}
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-lg font-black text-gold tabular-nums">{row.score}</span>
        <span className="text-[10px] uppercase tracking-widest text-sky">{row.metric}</span>
      </div>
      {delta !== 0 && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`ml-2 text-xs font-bold ${delta > 0 ? 'text-gold' : 'text-pink'}`}
          aria-label={delta > 0 ? `Lên ${delta} hạng` : `Tụt ${-delta} hạng`}
        >
          {delta > 0 ? `▲${delta}` : `▼${-delta}`}
        </motion.span>
      )}
    </motion.li>
  );
}
