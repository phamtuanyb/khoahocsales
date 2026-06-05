'use client';

import { sfx } from '@/lib/audio';
import type { MultipleChoiceOption } from '@/lib/quiz-types';

interface QuestionMultipleChoiceProps {
  options: MultipleChoiceOption[];
  selected: string | null;
  onChange: (key: string) => void;
  disabled?: boolean;
}

export function QuestionMultipleChoice({
  options,
  selected,
  onChange,
  disabled,
}: QuestionMultipleChoiceProps): JSX.Element {
  return (
    <ul className="space-y-3">
      {options.map((opt) => {
        const active = selected === opt.key;
        return (
          <li key={opt.key}>
            <button
              type="button"
              onClick={() => {
                if (disabled) return;
                sfx.click();
                onChange(opt.key);
              }}
              disabled={disabled}
              className={`flex w-full items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition ${
                active
                  ? 'border-orange bg-orange/15 shadow-mkt-cta'
                  : 'border-sky/30 bg-navy-deep/40 hover:border-sky hover:bg-navy-deep/60'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-black ${
                  active ? 'bg-orange text-white' : 'bg-navy-deep text-sky'
                }`}
              >
                {opt.key}
              </span>
              <span className="flex-1 text-white">{opt.text}</span>
              {active && <span className="text-2xl text-orange">●</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
