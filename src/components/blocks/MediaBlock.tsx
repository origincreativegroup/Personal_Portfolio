import React from 'react';
import type { MediaBlock as MediaBlockType } from '../../types/blocks';

interface MediaBlockProps {
  block: MediaBlockType;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const MediaBlockPreview: React.FC<MediaBlockProps> = ({ block, isSelected, onSelect }) => {
  const baseClasses = `grid gap-2 cursor-pointer ${isSelected ? 'ring-2 ring-[#5a3cf4] ring-opacity-50 rounded p-2' : ''}`;

  const handleClick = () => {
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <figure className={baseClasses} onClick={handleClick}>
      <span className="text-xs uppercase text-[#5a3cf4]">
        media • {block.media.kind}
      </span>
      <a
        className="text-sm lowercase text-[#5a3cf4] underline"
        href={block.media.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {block.media.url}
      </a>
      {block.caption && (
        <figcaption className="text-xs text-[#333333]">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
};