'use client';

import { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/loading-screen';
import { JsonCardForm } from '@/components/admin/json-card-form';
import { ApiError, api } from '@/lib/api-client';

interface CoachScenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  systemPrompt: string;
  initialMessage: string;
  successCriteria: string[] | string;
  rewardExp: number;
  isActive: boolean;
}

interface AiSettings {
  provider: 'multi';
  hasOpenAiKey: boolean;
  hasGeminiKey: boolean;
  openAiSource: 'database' | 'environment' | 'stub';
  geminiSource: 'database' | 'environment' | 'stub';
  coachProvider: 'openai' | 'gemini';
  coachModel: string;
  gradingProvider: 'openai' | 'gemini';
  gradingModel: string;
  maxTokens: number;
  dailyLimit: number;
  updatedAt: string | null;
}

export default function AdminCoachScenariosPage(): JSX.Element {
  const [scenarios, setScenarios] = useState<CoachScenario[] | null>(null);
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  async function load(): Promise<void> {
    try {
      const [nextSettings, nextScenarios] = await Promise.all([
        api.get<AiSettings>('/admin/coach-scenarios/settings'),
        api.get<CoachScenario[]>('/admin/coach-scenarios'),
      ]);
      setSettings(nextSettings);
      setScenarios(nextScenarios);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi');
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!scenarios || !settings) return <LoadingScreen label="Đang tải cấu hình AI" />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="mkt-pill-orange !text-xs">SOẠN NỘI DUNG</span>
          <h1 className="mt-3 text-h2-mkt-sm text-shadow-mkt">KỊCH BẢN AI COACH</h1>
          <p className="mt-1 text-sm text-ice">
            Tạo/sửa kịch bản giả lập khách hàng. Nhân sự chọn kịch bản, AI sẽ đóng vai theo system prompt.
          </p>
        </div>
        <button type="button" onClick={() => setFormOpen((v) => !v)} className="mkt-btn-primary !text-sm">
          {formOpen ? 'Đóng' : '+ Tạo kịch bản'}
        </button>
      </header>

      <details className="mkt-card p-4 text-xs text-ice">
        <summary className="cursor-pointer font-bold uppercase text-sky">Hướng dẫn viết kịch bản</summary>
        <div className="mt-2 space-y-1">
          <p>
            <strong className="text-orange">id</strong>: viết bằng kebab-case, không thay đổi sau khi tạo
            (VD: <code>price-objection</code>).
          </p>
          <p>
            <strong className="text-orange">systemPrompt</strong>: persona của khách hàng, tính cách,
            hành vi, khi nào dịu giọng. Tối thiểu 20 ký tự. Yêu cầu AI trả lời{' '}
            <strong>tiếng Việt có dấu</strong>, 1-3 câu/lượt.
          </p>
          <p>
            <strong className="text-orange">initialMessage</strong>: tin nhắn mở đầu khách hàng nói khi user vào phiên.
          </p>
          <p>
            <strong className="text-orange">successCriteria</strong>: mảng JSON, tiêu chí thành công Sales phải làm được.
          </p>
        </div>
      </details>

      {error && (
        <div className="rounded-xl border border-pink/60 bg-pink/10 px-4 py-3 text-sm text-pink">
          ⚠ {error}
        </div>
      )}

      <AiSettingsPanel settings={settings} onSaved={load} />

      {formOpen && (
        <JsonCardForm<{
          id: string;
          name: string;
          description: string;
          icon: string;
          difficulty: string;
          systemPrompt: string;
          initialMessage: string;
          successCriteria: unknown;
          rewardExp: number;
          isActive: boolean;
        }>
          title="Tạo kịch bản mới"
          initial={{
            id: '',
            name: '',
            description: '',
            icon: '🎯',
            difficulty: 'MEDIUM',
            systemPrompt: '',
            initialMessage: '',
            successCriteria: ['Tiêu chí 1', 'Tiêu chí 2'],
            rewardExp: 30,
            isActive: true,
          }}
          fields={[
            { name: 'id', label: 'ID (kebab-case, không đổi sau khi tạo)', type: 'text' },
            { name: 'name', label: 'Tên kịch bản', type: 'text' },
            { name: 'description', label: 'Mô tả', type: 'textarea' },
            { name: 'icon', label: 'Icon', type: 'text' },
            { name: 'difficulty', label: 'Độ khó (EASY/MEDIUM/HARD)', type: 'text' },
            { name: 'systemPrompt', label: 'System prompt (persona)', type: 'textarea', rows: 6 },
            { name: 'initialMessage', label: 'Tin nhắn mở đầu', type: 'textarea' },
            { name: 'successCriteria', label: 'Tiêu chí thành công (JSON array)', type: 'json' },
            { name: 'rewardExp', label: 'EXP thưởng', type: 'number' },
            { name: 'isActive', label: 'Active', type: 'checkbox', placeholder: 'Hiển thị cho user' },
          ]}
          onSave={async (data) => {
            await api.post('/admin/coach-scenarios', data);
            setFormOpen(false);
            await load();
          }}
          saveLabel="+ Tạo kịch bản"
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {scenarios.map((s) => (
          <JsonCardForm<{
            name: string;
            description: string;
            icon: string;
            difficulty: string;
            systemPrompt: string;
            initialMessage: string;
            successCriteria: unknown;
            rewardExp: number;
            isActive: boolean;
          }>
            key={s.id}
            title={`${s.icon} ${s.name}`}
            initial={{
              name: s.name,
              description: s.description,
              icon: s.icon,
              difficulty: s.difficulty,
              systemPrompt: s.systemPrompt,
              initialMessage: s.initialMessage,
              successCriteria: s.successCriteria,
              rewardExp: s.rewardExp,
              isActive: s.isActive,
            }}
            fields={[
              { name: 'name', label: 'Tên kịch bản', type: 'text' },
              { name: 'description', label: 'Mô tả', type: 'textarea' },
              { name: 'icon', label: 'Icon', type: 'text' },
              { name: 'difficulty', label: 'Độ khó', type: 'text' },
              { name: 'systemPrompt', label: 'System prompt', type: 'textarea', rows: 6 },
              { name: 'initialMessage', label: 'Tin nhắn mở đầu', type: 'textarea' },
              { name: 'successCriteria', label: 'Tiêu chí thành công (JSON)', type: 'json' },
              { name: 'rewardExp', label: 'EXP thưởng', type: 'number' },
              { name: 'isActive', label: 'Active', type: 'checkbox', placeholder: 'Đang dùng' },
            ]}
            onSave={async (data) => {
              await api.patch(`/admin/coach-scenarios/${s.id}`, data);
              await load();
            }}
            onDelete={async () => {
              await api.delete(`/admin/coach-scenarios/${s.id}`);
              await load();
            }}
          />
        ))}
      </div>
    </div>
  );
}

function AiSettingsPanel({
  settings,
  onSaved,
}: {
  settings: AiSettings;
  onSaved: () => Promise<void>;
}): JSX.Element {
  const [openAiKey, setOpenAiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [coachProvider, setCoachProvider] = useState<'openai' | 'gemini'>(settings.coachProvider);
  const [coachModel, setCoachModel] = useState(settings.coachModel);
  const [gradingProvider, setGradingProvider] = useState<'openai' | 'gemini'>(settings.gradingProvider);
  const [gradingModel, setGradingModel] = useState(settings.gradingModel);
  const [maxTokens, setMaxTokens] = useState(String(settings.maxTokens));
  const [dailyLimit, setDailyLimit] = useState(String(settings.dailyLimit));
  const [clearOpenAiKey, setClearOpenAiKey] = useState(false);
  const [clearGeminiKey, setClearGeminiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(): Promise<void> {
    setSaving(true);
    setMessage(null);
    try {
      await api.patch('/admin/coach-scenarios/settings', {
        apiKey: openAiKey.trim() || undefined,
        geminiApiKey: geminiKey.trim() || undefined,
        clearApiKey: clearOpenAiKey,
        clearGeminiApiKey: clearGeminiKey,
        coachProvider,
        coachModel: coachModel.trim(),
        gradingProvider,
        gradingModel: gradingModel.trim(),
        maxTokens: Number(maxTokens),
        dailyLimit: Number(dailyLimit),
      });
      setOpenAiKey('');
      setGeminiKey('');
      setClearOpenAiKey(false);
      setClearGeminiKey(false);
      setMessage('Đã lưu cấu hình AI theo module');
      await onSaved();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Không lưu được cấu hình');
    } finally {
      setSaving(false);
    }
  }

  const sourceLabel: Record<'database' | 'environment' | 'stub', string> = {
    database: 'key admin',
    environment: 'env',
    stub: 'stub',
  };
  const statusLabel = `Coach: ${settings.coachProvider}/${settings.coachModel} | Chấm điểm: ${settings.gradingProvider}/${settings.gradingModel}`;

  return (
    <section className="mkt-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="mkt-pill-navy !text-xs">CẤU HÌNH AI ROUTING</span>
          <h2 className="mt-3 text-xl font-black uppercase text-white">API key và model theo module</h2>
          <p className="mt-1 text-sm text-ice">
            Nhập OpenAI/Gemini API key, sau đó chọn provider riêng cho AI Coach và chấm điểm để tối ưu chi phí.
            Key được mã hóa và không hiển thị lại.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-pill px-3 py-1 text-xs font-bold ${settings.hasOpenAiKey ? 'bg-mkt-pill-gold text-navy-deep' : 'bg-pink text-white'}`}>
            OpenAI: {settings.hasOpenAiKey ? sourceLabel[settings.openAiSource] : 'stub'}
          </span>
          <span className={`rounded-pill px-3 py-1 text-xs font-bold ${settings.hasGeminiKey ? 'bg-mkt-pill-gold text-navy-deep' : 'bg-pink text-white'}`}>
            Gemini: {settings.hasGeminiKey ? sourceLabel[settings.geminiSource] : 'stub'}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-sky">OpenAI API key</span>
          <input
            type="password"
            value={openAiKey}
            onChange={(e) => setOpenAiKey(e.target.value)}
            placeholder={settings.hasOpenAiKey ? 'Để trống nếu không đổi key' : 'sk-...'}
            className="mkt-input w-full"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-sky">Gemini API key</span>
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder={settings.hasGeminiKey ? 'Để trống nếu không đổi key' : 'AIza...'}
            className="mkt-input w-full"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-black uppercase text-white">AI Coach Chat</h3>
          <p className="mt-1 text-xs text-ice">Nên dùng Gemini Flash để tiết kiệm chi phí cho hội thoại nhiều lượt.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-sky">Provider</span>
              <select
                value={coachProvider}
                onChange={(e) => setCoachProvider(e.target.value as 'openai' | 'gemini')}
                className="mkt-input w-full"
              >
                <option value="gemini">Gemini</option>
                <option value="openai">OpenAI</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-sky">Model</span>
              <input
                value={coachModel}
                onChange={(e) => setCoachModel(e.target.value)}
                placeholder={coachProvider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini'}
                className="mkt-input w-full"
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-black uppercase text-white">AI Chấm điểm</h3>
          <p className="mt-1 text-xs text-ice">Có thể tách model chấm điểm riêng để ưu tiên độ ổn định hoặc chi phí.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-sky">Provider</span>
              <select
                value={gradingProvider}
                onChange={(e) => setGradingProvider(e.target.value as 'openai' | 'gemini')}
                className="mkt-input w-full"
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-sky">Model</span>
              <input
                value={gradingModel}
                onChange={(e) => setGradingModel(e.target.value)}
                placeholder={gradingProvider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini'}
                className="mkt-input w-full"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-sky">Max tokens</span>
          <input type="number" value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)} className="mkt-input w-full" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-sky">Lượt/ngày</span>
          <input type="number" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} className="mkt-input w-full" />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-xs text-ice">
            <input
              type="checkbox"
              checked={clearOpenAiKey}
              onChange={(e) => setClearOpenAiKey(e.target.checked)}
            />
            Xóa OpenAI key đang lưu
          </label>
          <label className="flex items-center gap-2 text-xs text-ice">
            <input
              type="checkbox"
              checked={clearGeminiKey}
              onChange={(e) => setClearGeminiKey(e.target.checked)}
            />
            Xóa Gemini key đang lưu
          </label>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-sky">{message ?? statusLabel}</span>
          <button type="button" onClick={save} disabled={saving} className="mkt-btn-primary !text-sm disabled:opacity-60">
            {saving ? 'Đang lưu...' : 'Lưu cấu hình AI'}
          </button>
        </div>
      </div>
    </section>
  );
}
