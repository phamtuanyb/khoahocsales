'use client';

import { useEffect, useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { sfx } from '@/lib/audio';
import type { MiniGameItem } from '@/lib/quiz-types';

interface QuestionDragDropProps {
  items: MiniGameItem[]; // thứ tự đầu vào (đã shuffle bởi server)
  value: string[]; // thứ tự id hiện tại của người chơi
  onChange: (orderedIds: string[]) => void;
  disabled?: boolean;
}

// Framer Motion <Reorder> tự lo logic kéo-thả + animation swap mượt mà.
// Người dùng kéo card lên/xuống để sắp xếp đúng thứ tự.
export function QuestionDragDrop({
  items,
  value,
  onChange,
  disabled,
}: QuestionDragDropProps): JSX.Element {
  // Khởi tạo state nội bộ theo value (id ordering).
  const initialOrdered = value.length === items.length
    ? value.map((id) => items.find((i) => i.id === id)).filter((x): x is MiniGameItem => Boolean(x))
    : items;
  const [ordered, setOrdered] = useState<MiniGameItem[]>(initialOrdered);

  // Đồng bộ ra ngoài lần đầu.
  useEffect(() => {
    if (value.length === 0) {
      onChange(ordered.map((i) => i.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleReorder(next: MiniGameItem[]): void {
    setOrdered(next);
    onChange(next.map((i) => i.id));
    sfx.click();
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-sky">
        💡 Kéo các thẻ bên dưới để sắp xếp đúng thứ tự (từ trên xuống là 1 → {items.length}).
      </p>

      <Reorder.Group
        axis="y"
        values={ordered}
        onReorder={disabled ? () => {} : handleReorder}
        className="space-y-2"
      >
        {ordered.map((item, idx) => (
          <Reorder.Item
            key={item.id}
            value={item}
            dragListener={!disabled}
            whileDrag={{ scale: 1.03, boxShadow: '0 16px 40px rgba(13,71,161,0.6)' }}
            className={`flex items-center gap-4 rounded-xl border-2 border-sky/30 bg-navy-deep/60 px-4 py-3 ${
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-grab active:cursor-grabbing'
            }`}
          >
            <motion.span
              layout
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mkt-pill-orange font-black text-white"
            >
              {idx + 1}
            </motion.span>
            <span className="flex-1 text-white">{item.text}</span>
            <span className="text-sky/60" aria-hidden>
              ⋮⋮
            </span>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}
