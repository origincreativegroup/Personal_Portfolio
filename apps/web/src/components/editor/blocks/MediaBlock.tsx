import { component$ } from '@builder.io/qwik';
import type { MediaBlockT } from '@portfolioforge/schemas';

export const MediaBlockPreview = component$<{ block: MediaBlockT }>(({ block }) => {
  return (
    <figure class="grid gap-2">
      <span class="text-xs uppercase text-[#5a3cf4]">media • {block.media.kind}</span>
      <a class="text-sm lowercase text-[#5a3cf4] underline" href={block.media.url}>
        {block.media.url}
      </a>
      {block.caption && <figcaption class="text-xs text-[#333333]">{block.caption}</figcaption>}
    </figure>
  );
});
