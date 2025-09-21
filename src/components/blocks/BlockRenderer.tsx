import React from 'react';
import type { AnyBlock } from '../../types/blocks';
import { TextBlockPreview } from './TextBlock';
import { MediaBlockPreview } from './MediaBlock';
import { TimelineBlockPreview } from './TimelineBlock';
import { ImpactBlockPreview } from './ImpactBlock';

interface BlockRendererProps {
  block: AnyBlock;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block, isSelected, onSelect }) => {
  switch (block.type) {
    case 'text':
      return <TextBlockPreview block={block} isSelected={isSelected} onSelect={onSelect} />;
    case 'media':
      return <MediaBlockPreview block={block} isSelected={isSelected} onSelect={onSelect} />;
    case 'timeline':
      return <TimelineBlockPreview block={block} isSelected={isSelected} onSelect={onSelect} />;
    case 'impact':
      return <ImpactBlockPreview block={block} isSelected={isSelected} onSelect={onSelect} />;
    case 'chart':
      return (
        <div className="text-sm text-gray-500 p-4 border border-gray-200 rounded">
          Chart block not implemented yet
        </div>
      );
    default:
      return (
        <div className="text-sm text-red-500 p-4 border border-red-200 rounded">
          Unknown block type
        </div>
      );
  }
};