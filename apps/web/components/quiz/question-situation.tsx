'use client';

interface QuestionSituationProps {
  value: string;
  onChange: (text: string) => void;
  disabled?: boolean;
}

export function QuestionSituation({
  value,
  onChange,
  disabled,
}: QuestionSituationProps): JSX.Element {
  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={6}
        placeholder="Viết câu trả lời của bạn ở đây..."
        className="w-full rounded-xl border-2 border-sky/40 bg-navy-deep/60 px-4 py-3 text-white placeholder-sky/40 outline-none transition focus:border-orange focus:shadow-mkt-cta disabled:opacity-60"
      />
      <div className="flex items-center justify-between text-xs text-sky">
        <span>💡 Tạm chấm theo từ khóa. AI chấm chi tiết sẽ ra mắt ở giai đoạn sau.</span>
        <span className="tabular-nums">{value.length} ký tự</span>
      </div>
    </div>
  );
}
