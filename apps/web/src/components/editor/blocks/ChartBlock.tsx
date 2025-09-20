import type { ChartBlockT } from '@portfolioforge/schemas';
import type { FC } from 'react';

export const ChartBlockPreview: FC<{ block: ChartBlockT }> = ({ block }) => {
  return (
    <div className="rounded-xl border border-[#cbc0ff] px-4 py-3 text-sm text-[#1a1a1a]">
      <div className="flex items-center justify-between">
        <span className="uppercase text-xs text-[#5a3cf4]">{block.kind} chart</span>
        <span className="text-xs text-[#333333]">labels: {block.labels.length}</span>
      </div>
      <ul className="mt-2 text-xs text-[#333333]">
        {block.series.map((series) => (
          <li key={series.name}>{series.name}: {series.data.join(', ')}</li>
        ))}
      </ul>
    </div>
  );
};
