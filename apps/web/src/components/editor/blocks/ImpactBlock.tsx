import type { ImpactBlockT } from '@portfolioforge/schemas';
import type { FC } from 'react';

export const ImpactBlockPreview: FC<{ block: ImpactBlockT }> = ({ block }) => {
  return (
    <div className="rounded-xl border border-[#cbc0ff] px-4 py-3 text-sm text-[#1a1a1a]">
      <h3 className="uppercase text-xs tracking-wide text-[#5a3cf4]">Impact</h3>
      <p className="mt-1 text-sm text-[#333333]">
        <strong className="font-semibold text-[#1a1a1a]">Problem:</strong> {block.problem}
      </p>
      <p className="mt-1 text-sm text-[#333333]">
        <strong className="font-semibold text-[#1a1a1a]">Solution:</strong> {block.solution}
      </p>
      <ul className="mt-2 grid gap-1 text-xs text-[#333333]">
        {block.outcomes.map((outcome, index) => (
          <li key={`${outcome}-${index}`}>• {outcome}</li>
        ))}
      </ul>
      {block.metrics && (
        <dl className="mt-2 grid grid-cols-2 gap-1 text-xs text-[#1a1a1a]">
          {Object.entries(block.metrics).map(([name, value]) => (
            <div key={name} className="flex items-center justify-between rounded-md bg-[#cbc0ff] px-2 py-1">
              <dt className="lowercase">{name}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};
