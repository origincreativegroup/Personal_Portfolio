import { component$ } from '@builder.io/qwik';
import type { ChartBlockT } from '@portfolioforge/schemas';

export const ChartBlockPreview = component$<{ block: ChartBlockT }>(({ block }) => {
  return (
    <div class="grid gap-2 text-sm text-[#1a1a1a]">
      <span class="text-xs uppercase text-[#5a3cf4]">{block.kind} chart</span>
      <p class="text-xs text-[#333333]">labels: {block.labels.join(', ')}</p>
      <ul class="text-xs text-[#333333]">
        {block.series.map((series) => (
          <li key={series.name}>
            {series.name}: {series.data.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
});
