import type { MediaBlockT } from '@portfolioforge/schemas';
import type { FC } from 'react';

export const MediaBlockPreview: FC<{ block: MediaBlockT }> = ({ block }) => {
  return (
    <figure className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm text-[#1a1a1a]">
        <span className="rounded-full bg-[#cbc0ff] px-2 py-1 lowercase text-[#1a1a1a]">{block.media.kind}</span>
        <a href={block.media.url} className="text-sm lowercase text-[#5a3cf4] underline" target="_blank" rel="noreferrer">
          {block.media.url}
        </a>
      </div>
      {block.caption && <figcaption className="text-xs text-[#333333]">{block.caption}</figcaption>}
    </figure>
  );
};
