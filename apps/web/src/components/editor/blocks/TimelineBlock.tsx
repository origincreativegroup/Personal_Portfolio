import { component$ } from '@builder.io/qwik';
import type { TimelineBlockT } from '@portfolioforge/schemas';

export const TimelineBlockPreview = component$<{ block: TimelineBlockT }>(({ block }) => {
  return (
    <ol class="grid gap-2 text-sm text-[#1a1a1a]">
      {block.items.map((item, index) => (
        <li key={`${item.label}-${index}`} class="rounded-xl border border-[#cbc0ff] px-3 py-2">
          <div class="flex justify-between text-xs uppercase text-[#5a3cf4]">
            <span>{item.label}</span>
            <span>
              {item.start}
              {item.end ? ` → ${item.end}` : ''}
            </span>
          </div>
          {item.note && <p class="mt-1 text-xs text-[#333333]">{item.note}</p>}
        </li>
      ))}
    </ol>
  );
});
