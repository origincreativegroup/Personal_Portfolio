import React from 'react';
import type { TimelineBlock as TimelineBlockType } from '../../types/blocks';

interface TimelineBlockProps {
  block: TimelineBlockType;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const TimelineBlockPreview: React.FC<TimelineBlockProps> = ({ block, isSelected, onSelect }) => {
  const baseClasses = `grid gap-2 text-sm text-[#1a1a1a] cursor-pointer ${isSelected ? 'ring-2 ring-[#5a3cf4] ring-opacity-50 rounded p-2' : ''}`;

  const handleClick = () => {
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <ol className={baseClasses} onClick={handleClick}>
      {block.items.map((item, index) => (
        <li
          key={`${item.label}-${index}`}
          className="rounded-xl border border-[#cbc0ff] px-3 py-2"
        >
          <div className="flex justify-between text-xs uppercase text-[#5a3cf4]">
            <span>{item.label}</span>
            <span>
              {item.start}
              {item.end ? ` → ${item.end}` : ''}
            </span>
          </div>
          {item.note && (
            <p className="mt-1 text-xs text-[#333333]">{item.note}</p>
          )}
        </li>
      ))}
    </ol>
  );
};