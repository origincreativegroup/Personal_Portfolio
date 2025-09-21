import React from 'react';
import type { ImpactBlock as ImpactBlockType } from '../../types/blocks';

interface ImpactBlockProps {
  block: ImpactBlockType;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const ImpactBlockPreview: React.FC<ImpactBlockProps> = ({ block, isSelected, onSelect }) => {
  const baseClasses = `grid gap-2 text-sm text-[#1a1a1a] cursor-pointer ${isSelected ? 'ring-2 ring-[#5a3cf4] ring-opacity-50 rounded p-2' : ''}`;

  const handleClick = () => {
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <div className={baseClasses} onClick={handleClick}>
      <span className="text-xs uppercase text-[#5a3cf4]">impact</span>
      <p>
        <strong>problem:</strong> {block.problem}
      </p>
      <p>
        <strong>solution:</strong> {block.solution}
      </p>
      <ul className="list-disc pl-4 text-xs text-[#333333]">
        {block.outcomes.map((outcome, index) => (
          <li key={`${outcome}-${index}`}>{outcome}</li>
        ))}
      </ul>
      {block.metrics && (
        <dl className="grid grid-cols-2 gap-2 text-xs text-[#333333]">
          {Object.entries(block.metrics).map(([name, value]) => (
            <div key={name} className="rounded-md bg-[#cbc0ff] px-2 py-1">
              <dt className="lowercase">{name}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};