import { component$ } from '@builder.io/qwik';
import type { ImpactBlockT } from '@portfolioforge/schemas';

export const ImpactBlockPreview = component$<{ block: ImpactBlockT }>(({ block }) => {
  return (
    <div class="grid gap-2 text-sm text-[#1a1a1a]">
      <span class="text-xs uppercase text-[#5a3cf4]">impact</span>
      <p>
        <strong>problem:</strong> {block.problem}
      </p>
      <p>
        <strong>solution:</strong> {block.solution}
      </p>
      <ul class="list-disc pl-4 text-xs text-[#333333]">
        {block.outcomes.map((outcome, index) => (
          <li key={`${outcome}-${index}`}>{outcome}</li>
        ))}
      </ul>
      {block.metrics && (
        <dl class="grid grid-cols-2 gap-2 text-xs text-[#333333]">
          {Object.entries(block.metrics).map(([name, value]) => (
            <div key={name} class="rounded-md bg-[#cbc0ff] px-2 py-1">
              <dt class="lowercase">{name}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
});
