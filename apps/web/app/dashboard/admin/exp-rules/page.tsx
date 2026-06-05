'use client';

import { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/loading-screen';
import { ApiError } from '@/lib/api-client';
import { adminApi, type AdminExpRule } from '@/lib/admin-api';

const LABELS: Record<string, string> = {
  LESSON_COMPLETED: 'Hoàn thành 1 bài học',
  QUIZ_CORRECT_ANSWER: 'Trả lời đúng 1 câu thi',
  COURSE_COMPLETED: 'Hoàn thành 1 khóa học',
  DAILY_LOGIN_STREAK: 'Đăng nhập học liên tục',
  TEAM_SUPPORT: 'Hỗ trợ đồng đội',
  BOSS_BATTLE_PASSED: 'Vượt Boss Battle',
  AI_COACH_SESSION: 'Luyện AI Coach',
  MISSION_COMPLETED: 'Hoàn thành nhiệm vụ ngày',
  ADMIN_ADJUSTMENT: 'Admin điều chỉnh',
};

export default function AdminExpRulesPage(): JSX.Element {
  const [rules, setRules] = useState<AdminExpRule[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    try {
      setRules(await adminApi.listExpRules());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function saveRow(rule: AdminExpRule, patch: Partial<AdminExpRule>): Promise<void> {
    try {
      await adminApi.updateExpRule(rule.action, {
        amount: patch.amount,
        enabled: patch.enabled,
        description: patch.description ?? undefined,
      });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }

  if (!rules) return <LoadingScreen label="Đang tải" />;

  return (
    <div className="space-y-6">
      <header>
        <span className="mkt-pill-orange !text-xs">CẤU HÌNH HỆ THỐNG</span>
        <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">
          BẢNG QUY ĐỔI <span className="text-orange">EXP</span>
        </h1>
        <p className="mt-1 text-sm text-ice">
          Số EXP cộng cho mỗi hành động. Áp dụng ngay sau khi lưu — không cần restart.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      <section className="mkt-card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-navy-deep/60 text-left text-[10px] font-bold uppercase tracking-widest text-sky">
            <tr>
              <th className="px-4 py-3">Hành động</th>
              <th className="px-4 py-3">Mô tả</th>
              <th className="px-4 py-3 text-center">EXP</th>
              <th className="px-4 py-3 text-center">Mặc định</th>
              <th className="px-4 py-3 text-center">Bật</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <RuleRow key={r.action} rule={r} onSave={saveRow} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function RuleRow({
  rule,
  onSave,
}: {
  rule: AdminExpRule;
  onSave: (r: AdminExpRule, patch: Partial<AdminExpRule>) => Promise<void>;
}): JSX.Element {
  const [amount, setAmount] = useState(rule.amount);
  const [enabled, setEnabled] = useState(rule.enabled);
  const [desc, setDesc] = useState(rule.description ?? '');
  const dirty = amount !== rule.amount || enabled !== rule.enabled || desc !== (rule.description ?? '');
  return (
    <tr className="border-t border-sky/10">
      <td className="px-4 py-3">
        <div className="font-mono text-[10px] text-sky">{rule.action}</div>
        <div className="text-sm font-bold text-white">{LABELS[rule.action] ?? rule.action}</div>
      </td>
      <td className="px-4 py-3">
        <input value={desc} onChange={(e) => setDesc(e.target.value)} className="mkt-input" />
      </td>
      <td className="px-4 py-3 text-center">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="mkt-input w-24 text-center"
          min={0}
        />
      </td>
      <td className="px-4 py-3 text-center text-[10px] text-sky">{rule.defaultAmount}</td>
      <td className="px-4 py-3 text-center">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-5 w-5 accent-orange"
        />
      </td>
      <td className="px-4 py-3 text-right">
        {dirty && (
          <button
            type="button"
            onClick={() => onSave(rule, { amount, enabled, description: desc })}
            className="rounded-pill bg-orange/20 px-3 py-1 text-xs font-bold text-orange hover:bg-orange/30"
          >
            💾 Lưu
          </button>
        )}
      </td>
    </tr>
  );
}
