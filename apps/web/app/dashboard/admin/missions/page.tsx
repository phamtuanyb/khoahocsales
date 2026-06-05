'use client';

import { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/loading-screen';
import { JsonCardForm } from '@/components/admin/json-card-form';
import { ApiError } from '@/lib/api-client';
import { adminApi, type AdminMission } from '@/lib/admin-api';

export default function AdminMissionsPage(): JSX.Element {
  const [missions, setMissions] = useState<AdminMission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  async function load(): Promise<void> {
    try {
      setMissions(await adminApi.listMissions());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }
  useEffect(() => {
    load();
  }, []);

  if (!missions) return <LoadingScreen label="Đang tải" />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="mkt-pill-orange !text-xs">CẤU HÌNH HỆ THỐNG</span>
          <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">NHIỆM VỤ NGÀY</h1>
          <p className="mt-1 text-sm text-ice">
            Nhiệm vụ làm mới 00:00 mỗi ngày. Hoàn thành = nhận EXP + giữ streak.
          </p>
        </div>
        <button type="button" onClick={() => setFormOpen((v) => !v)} className="mkt-btn-primary !text-sm">
          {formOpen ? 'Đóng' : '+ Tạo nhiệm vụ'}
        </button>
      </header>

      <details className="mkt-card p-4 text-xs text-ice">
        <summary className="cursor-pointer font-bold uppercase text-sky">📖 Cú pháp rule JSON</summary>
        <pre className="mt-2 overflow-x-auto rounded bg-navy-deep/60 p-3 text-[10px]">
{`// Rule types hiện hỗ trợ:
{ "type": "COMPLETE_LESSON", "count": 1 }    // Hoàn thành N bài học
{ "type": "CORRECT_ANSWERS", "count": 3 }    // Trả lời đúng N câu thi
{ "type": "WATCH_VIDEO", "count": 1 }        // Xem N video training`}
        </pre>
      </details>

      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">⚠ {error}</div>
      )}

      {formOpen && (
        <JsonCardForm<{ title: string; description: string; rewardExp: number; rule: unknown; isDaily: boolean; isActive: boolean }>
          title="Tạo nhiệm vụ mới"
          initial={{ title: '', description: '', rewardExp: 10, rule: { type: 'COMPLETE_LESSON', count: 1 }, isDaily: true, isActive: true }}
          fields={[
            { name: 'title', label: 'Tiêu đề', type: 'text' },
            { name: 'description', label: 'Mô tả', type: 'textarea' },
            { name: 'rewardExp', label: 'EXP thưởng', type: 'number' },
            { name: 'rule', label: 'Rule JSON', type: 'json' },
            { name: 'isDaily', label: 'Daily', type: 'checkbox', placeholder: 'Reset mỗi ngày' },
            { name: 'isActive', label: 'Active', type: 'checkbox', placeholder: 'Đang dùng' },
          ]}
          onSave={async (data) => {
            await adminApi.createMission({
              title: data.title,
              description: data.description,
              rewardExp: data.rewardExp,
              rule: data.rule as Record<string, unknown>,
              isDaily: data.isDaily,
              isActive: data.isActive,
            });
            setFormOpen(false);
            await load();
          }}
          saveLabel="+ Tạo nhiệm vụ"
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {missions.map((m) => (
          <JsonCardForm<{ title: string; description: string; rewardExp: number; rule: unknown; isDaily: boolean; isActive: boolean }>
            key={m.id}
            title={`🎯 ${m.title}`}
            initial={{
              title: m.title,
              description: m.description ?? '',
              rewardExp: m.rewardExp,
              rule: m.rule,
              isDaily: m.isDaily,
              isActive: m.isActive,
            }}
            fields={[
              { name: 'title', label: 'Tiêu đề', type: 'text' },
              { name: 'description', label: 'Mô tả', type: 'textarea' },
              { name: 'rewardExp', label: 'EXP thưởng', type: 'number' },
              { name: 'rule', label: 'Rule JSON', type: 'json' },
              { name: 'isDaily', label: 'Daily', type: 'checkbox', placeholder: 'Reset mỗi ngày' },
              { name: 'isActive', label: 'Active', type: 'checkbox', placeholder: 'Đang dùng' },
            ]}
            onSave={async (data) => {
              await adminApi.updateMission(m.id, {
                title: data.title,
                description: data.description,
                rewardExp: data.rewardExp,
                rule: data.rule as Record<string, unknown>,
                isDaily: data.isDaily,
                isActive: data.isActive,
              });
              await load();
            }}
            onDelete={async () => {
              await adminApi.deleteMission(m.id);
              await load();
            }}
          />
        ))}
      </div>
    </div>
  );
}
