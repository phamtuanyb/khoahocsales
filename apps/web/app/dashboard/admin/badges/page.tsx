'use client';

import { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/loading-screen';
import { JsonCardForm } from '@/components/admin/json-card-form';
import { ApiError } from '@/lib/api-client';
import { adminApi, type AdminBadge } from '@/lib/admin-api';

export default function AdminBadgesPage(): JSX.Element {
  const [badges, setBadges] = useState<AdminBadge[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  async function load(): Promise<void> {
    try {
      setBadges(await adminApi.listBadges());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }
  useEffect(() => {
    load();
  }, []);

  if (!badges) return <LoadingScreen label="Đang tải" />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="mkt-pill-orange !text-xs">CẤU HÌNH HỆ THỐNG</span>
          <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">HUY HIỆU</h1>
          <p className="mt-1 text-sm text-ice">
            Tạo huy hiệu với rule JSON. Hệ thống tự đánh giá sau mỗi sự kiện EXP.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="mkt-btn-primary !text-sm"
        >
          {formOpen ? 'Đóng' : '+ Tạo badge'}
        </button>
      </header>

      <details className="mkt-card p-4 text-xs text-ice">
        <summary className="cursor-pointer font-bold uppercase text-sky">📖 Cú pháp rule JSON</summary>
        <pre className="mt-2 overflow-x-auto rounded bg-navy-deep/60 p-3 text-[10px]">
{`// Một số rule type hỗ trợ:
{ "type": "COMPLETE_LESSON", "count": 5 }
{ "type": "STREAK_DAYS", "days": 7 }
{ "type": "REACH_LEVEL", "order": 2 }
{ "type": "COMPLETE_COURSE", "courseId": "<id>" }   // bỏ courseId = bất kỳ khóa nào
{ "type": "COMPLETE_BOSS_BATTLE", "scope": "SALES" } // scope = tên phòng ban
{ "type": "QUIZ_PERFECT", "count": 1 }
{ "type": "EARN_EXP", "amount": 300 }`}
        </pre>
      </details>

      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      {formOpen && (
        <JsonCardForm<{ name: string; icon: string; description: string; rule: unknown; isActive: boolean }>
          title="Tạo huy hiệu mới"
          initial={{ name: '', icon: '🏆', description: '', rule: { type: 'COMPLETE_LESSON', count: 1 }, isActive: true }}
          fields={[
            { name: 'name', label: 'Tên', type: 'text' },
            { name: 'icon', label: 'Icon (emoji)', type: 'text' },
            { name: 'description', label: 'Mô tả', type: 'textarea' },
            { name: 'rule', label: 'Rule JSON', type: 'json' },
            { name: 'isActive', label: 'Active', type: 'checkbox', placeholder: 'Đang dùng' },
          ]}
          onSave={async (data) => {
            await adminApi.createBadge({
              name: data.name,
              icon: data.icon,
              description: data.description,
              rule: data.rule as Record<string, unknown>,
              isActive: data.isActive,
            });
            setFormOpen(false);
            await load();
          }}
          saveLabel="+ Tạo huy hiệu"
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {badges.map((b) => (
          <JsonCardForm<{ name: string; icon: string; description: string; rule: unknown; isActive: boolean }>
            key={b.id}
            title={`${b.icon} ${b.name}`}
            initial={{
              name: b.name,
              icon: b.icon,
              description: b.description,
              rule: b.rule,
              isActive: b.isActive,
            }}
            fields={[
              { name: 'name', label: 'Tên', type: 'text' },
              { name: 'icon', label: 'Icon', type: 'text' },
              { name: 'description', label: 'Mô tả', type: 'textarea' },
              { name: 'rule', label: `Rule JSON · ${b._count?.userBadges ?? 0} user đã đạt`, type: 'json' },
              { name: 'isActive', label: 'Active', type: 'checkbox', placeholder: 'Hiển thị cho user' },
            ]}
            onSave={async (data) => {
              await adminApi.updateBadge(b.id, {
                name: data.name,
                icon: data.icon,
                description: data.description,
                rule: data.rule as Record<string, unknown>,
                isActive: data.isActive,
              });
              await load();
            }}
            onDelete={async () => {
              await adminApi.deleteBadge(b.id);
              await load();
            }}
          />
        ))}
      </div>
    </div>
  );
}
