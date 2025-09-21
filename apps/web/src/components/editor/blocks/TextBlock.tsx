import { component$ } from '@builder.io/qwik';
import type { TextBlockT } from '@portfolioforge/schemas';

export const TextBlockPreview = component$<{ block: TextBlockT }>(({ block }) => {
  if (block.variant === 'heading') {
    return <h3 class="text-xl font-semibold lowercase text-[#1a1a1a]">{block.content}</h3>;
  }
  if (block.variant === 'quote') {
    return <blockquote class="border-l-4 border-[#cbc0ff] pl-4 italic text-[#333333]">{block.content}</blockquote>;
  }
  return <p class="text-sm text-[#333333]">{block.content}</p>;
});
