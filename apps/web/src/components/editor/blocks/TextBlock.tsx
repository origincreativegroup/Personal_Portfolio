import type { TextBlockT } from '@portfolioforge/schemas';
import type { FC } from 'react';

export const TextBlockPreview: FC<{ block: TextBlockT }> = ({ block }) => {
  if (block.variant === 'heading') {
    return <h3 className="text-xl font-semibold lowercase text-[#1a1a1a]">{block.content}</h3>;
  }
  if (block.variant === 'quote') {
    return <blockquote className="border-l-4 border-[#cbc0ff] pl-4 italic text-[#333333]">{block.content}</blockquote>;
  }
  return <p className="text-sm text-[#333333]">{block.content}</p>;
};
