import React from 'react';
import type { TextBlock as TextBlockType } from '../../types/blocks';

interface TextBlockProps {
  block: TextBlockType;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const TextBlockPreview: React.FC<TextBlockProps> = ({ block, isSelected, onSelect }) => {
  const baseClasses = `block ${isSelected ? 'ring-2 ring-[#5a3cf4] ring-opacity-50' : ''}`;

  const handleClick = () => {
    if (onSelect) {
      onSelect();
    }
  };

  if (block.variant === 'heading') {
    return (
      <h3
        className={`text-xl font-semibold lowercase text-[#1a1a1a] cursor-pointer ${baseClasses}`}
        onClick={handleClick}
      >
        {block.content}
      </h3>
    );
  }

  if (block.variant === 'quote') {
    return (
      <blockquote
        className={`border-l-4 border-[#cbc0ff] pl-4 italic text-[#333333] cursor-pointer ${baseClasses}`}
        onClick={handleClick}
      >
        {block.content}
      </blockquote>
    );
  }

  return (
    <p
      className={`text-sm text-[#333333] cursor-pointer ${baseClasses}`}
      onClick={handleClick}
    >
      {block.content}
    </p>
  );
};