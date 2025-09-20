import type { TimelineBlockT } from '@portfolioforge/schemas';
import type { FC } from 'react';

export const TimelineBlockPreview: FC<{ block: TimelineBlockT }> = ({ block }) => {
  return (
    <ol className="grid gap-2 text-sm text-[#1a1a1a]">
      {block.items.map((item, index) => (
        <li key={`${item.label}-${index}`} className="rounded-xl border border-[#cbc0ff] px-3 py-2">
          <div className="flex justify-between text-xs uppercase text-[#5a3cf4]">
            <span>{item.label}</span>
            <span>
              {item.start}
              {item.end ? ` → ${item.end}` : ''}
            </span>
          </div>
          {item.note && <p className="mt-1 text-xs text-[#333333]">{item.note}</p>}
        </li>
      ))}
    </ol>
  );
};
