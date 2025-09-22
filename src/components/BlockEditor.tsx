import React, { useState, useRef } from 'react';
import { tokens } from '../shared/theme';
import { clsx } from '../shared/utils';

export interface Block {
  id: string;
  type: 'text' | 'image' | 'video' | 'shape' | 'button';
  data: Record<string, any>;
  order: number;
}

interface BlockEditorProps {
  initial: Block[];
  onChange: (blocks: Block[]) => void;
  className?: string;
}

interface ElementPanelProps {
  onAddElement: (type: Block['type']) => void;
}

interface TypographyPanelProps {
  selectedBlock?: Block;
  onUpdateBlock: (block: Block) => void;
}

const ElementPanel: React.FC<ElementPanelProps> = ({ onAddElement }) => {
  const elements = [
    { type: 'image' as const, label: 'Image', icon: '🖼️', color: '#FF8A50' },
    { type: 'text' as const, label: 'Text', icon: '📝', color: '#4A90E2' },
    { type: 'shape' as const, label: 'Shape', icon: '▲', color: '#7B68EE' },
    { type: 'video' as const, label: 'Video', icon: '▶️', color: '#F5555D' },
  ];

  const elementStyles: React.CSSProperties = {
    padding: tokens.spacing(6),
    borderRight: `1px solid ${tokens.color.border}`,
    backgroundColor: tokens.color.bg,
    minWidth: '160px',
  };

  const titleStyles: React.CSSProperties = {
    fontFamily: tokens.font.family,
    fontSize: '0.875rem',
    fontWeight: 600,
    color: tokens.color.text,
    marginBottom: tokens.spacing(4),
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const buttonStyles = (color: string): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: tokens.spacing(4),
    margin: tokens.spacing(2),
    backgroundColor: color,
    color: '#ffffff',
    border: 'none',
    borderRadius: tokens.radius.lg,
    cursor: 'pointer',
    fontFamily: tokens.font.family,
    fontSize: '0.75rem',
    fontWeight: 500,
    textTransform: 'lowercase',
    transition: 'all 0.2s ease-in-out',
    minHeight: '80px',
    justifyContent: 'center',
    gap: tokens.spacing(1),
  });

  return (
    <div style={elementStyles}>
      <div style={titleStyles}>Add Element</div>
      {elements.map((element) => (
        <button
          key={element.type}
          style={buttonStyles(element.color)}
          onClick={() => onAddElement(element.type)}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.opacity = '1';
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>{element.icon}</span>
          <span>{element.label}</span>
        </button>
      ))}
    </div>
  );
};

const TypographyPanel: React.FC<TypographyPanelProps> = ({ selectedBlock, onUpdateBlock }) => {
  const panelStyles: React.CSSProperties = {
    padding: tokens.spacing(6),
    borderLeft: `1px solid ${tokens.color.border}`,
    backgroundColor: tokens.color.bg,
    minWidth: '200px',
  };

  const titleStyles: React.CSSProperties = {
    fontFamily: tokens.font.family,
    fontSize: '0.875rem',
    fontWeight: 600,
    color: tokens.color.text,
    marginBottom: tokens.spacing(4),
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const controlGroupStyles: React.CSSProperties = {
    marginBottom: tokens.spacing(4),
  };

  const labelStyles: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 500,
    color: tokens.color.text,
    marginBottom: tokens.spacing(2),
    fontFamily: tokens.font.family,
  };

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: tokens.spacing(2),
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.md,
    fontSize: '0.875rem',
    fontFamily: tokens.font.family,
    backgroundColor: tokens.color.bg,
    color: tokens.color.text,
  };

  const selectStyles: React.CSSProperties = {
    ...inputStyles,
    cursor: 'pointer',
  };

  if (!selectedBlock || selectedBlock.type !== 'text') {
    return (
      <div style={panelStyles}>
        <div style={titleStyles}>Typography</div>
        <div style={{ color: tokens.color.textMuted, fontSize: '0.875rem' }}>
          Select a text element to edit typography
        </div>
      </div>
    );
  }

  const updateTextData = (field: string, value: string | number) => {
    const updatedBlock = {
      ...selectedBlock,
      data: {
        ...selectedBlock.data,
        [field]: value,
      },
    };
    onUpdateBlock(updatedBlock);
  };

  return (
    <div style={panelStyles}>
      <div style={titleStyles}>Typography</div>

      <div style={controlGroupStyles}>
        <label style={labelStyles}>Text</label>
        <input
          type="text"
          value={selectedBlock.data.text || ''}
          onChange={(e) => updateTextData('text', e.target.value)}
          style={inputStyles}
          placeholder="Enter text"
        />
      </div>

      <div style={controlGroupStyles}>
        <label style={labelStyles}>Font</label>
        <select
          value={selectedBlock.data.fontFamily || 'Inter'}
          onChange={(e) => updateTextData('fontFamily', e.target.value)}
          style={selectStyles}
        >
          <option value="Inter">Inter</option>
          <option value="Poppins">Poppins</option>
          <option value="Roboto">Roboto</option>
        </select>
      </div>

      <div style={controlGroupStyles}>
        <label style={labelStyles}>Font Size</label>
        <select
          value={selectedBlock.data.fontSize || '16'}
          onChange={(e) => updateTextData('fontSize', e.target.value)}
          style={selectStyles}
        >
          <option value="12">12</option>
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
          <option value="20">20</option>
          <option value="24">24</option>
          <option value="32">32</option>
        </select>
      </div>

      <div style={controlGroupStyles}>
        <label style={labelStyles}>Line Height</label>
        <input
          type="number"
          value={selectedBlock.data.lineHeight || 24}
          onChange={(e) => updateTextData('lineHeight', parseInt(e.target.value))}
          style={inputStyles}
          min="12"
          max="60"
        />
      </div>

      <div style={controlGroupStyles}>
        <label style={labelStyles}>Letter Spacing</label>
        <input
          type="number"
          value={selectedBlock.data.letterSpacing || 0}
          onChange={(e) => updateTextData('letterSpacing', parseFloat(e.target.value))}
          style={inputStyles}
          min="-2"
          max="10"
          step="0.1"
        />
      </div>
    </div>
  );
};

export const BlockEditor: React.FC<BlockEditorProps> = ({ initial, onChange, className }) => {
  const [blocks, setBlocks] = useState<Block[]>(initial);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const nextIdRef = useRef(initial.length + 1);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const addElement = (type: Block['type']) => {
    const newBlock: Block = {
      id: `block-${nextIdRef.current++}`,
      type,
      data: getDefaultData(type),
      order: blocks.length,
    };

    const updatedBlocks = [...blocks, newBlock];
    setBlocks(updatedBlocks);
    onChange(updatedBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (updatedBlock: Block) => {
    const updatedBlocks = blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b);
    setBlocks(updatedBlocks);
    onChange(updatedBlocks);
  };

  const getDefaultData = (type: Block['type']): Record<string, any> => {
    switch (type) {
      case 'text':
        return { text: 'New text element', fontSize: '16', fontFamily: 'Inter', lineHeight: 24, letterSpacing: 0 };
      case 'image':
        return { url: '', alt: '', width: 300, height: 200 };
      case 'video':
        return { url: '', width: 400, height: 300 };
      case 'shape':
        return { shape: 'rectangle', width: 100, height: 100, color: tokens.color.primary };
      case 'button':
        return { text: 'Button', url: '', variant: 'primary' };
      default:
        return {};
    }
  };

  const canvasStyles: React.CSSProperties = {
    flex: 1,
    padding: tokens.spacing(6),
    backgroundColor: '#f8f9fa',
    minHeight: '400px',
    position: 'relative',
  };

  const blockStyles = (_block: Block, isSelected: boolean): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      margin: tokens.spacing(2),
      padding: tokens.spacing(3),
      border: isSelected ? `2px solid ${tokens.color.primary}` : '2px solid transparent',
      borderRadius: tokens.radius.md,
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      backgroundColor: tokens.color.bg,
    };

    return baseStyles;
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    height: '600px',
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.xl,
    overflow: 'hidden',
    backgroundColor: tokens.color.bg,
    fontFamily: tokens.font.family,
  };

  const renderBlock = (block: Block) => {
    const isSelected = selectedBlockId === block.id;

    switch (block.type) {
      case 'text':
        return (
          <div
            key={block.id}
            style={{
              ...blockStyles(block, isSelected),
              fontSize: `${block.data.fontSize || 16}px`,
              fontFamily: block.data.fontFamily || 'Inter',
              lineHeight: `${block.data.lineHeight || 24}px`,
              letterSpacing: `${block.data.letterSpacing || 0}px`,
            }}
            onClick={() => setSelectedBlockId(block.id)}
          >
            {block.data.text || 'Text element'}
          </div>
        );
      case 'image':
        return (
          <div
            key={block.id}
            style={blockStyles(block, isSelected)}
            onClick={() => setSelectedBlockId(block.id)}
          >
            <div style={{
              width: '100%',
              height: '120px',
              backgroundColor: '#e9ecef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: tokens.radius.md,
              color: tokens.color.textMuted,
            }}>
              🖼️ Image Placeholder
            </div>
          </div>
        );
      case 'shape':
        return (
          <div
            key={block.id}
            style={blockStyles(block, isSelected)}
            onClick={() => setSelectedBlockId(block.id)}
          >
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: tokens.color.highlight,
              borderRadius: block.data.shape === 'circle' ? '50%' : tokens.radius.md,
              margin: '0 auto',
            }} />
          </div>
        );
      default:
        return (
          <div
            key={block.id}
            style={blockStyles(block, isSelected)}
            onClick={() => setSelectedBlockId(block.id)}
          >
            {block.type} element
          </div>
        );
    }
  };

  return (
    <div style={containerStyles} className={clsx('pf-block-editor', className)}>
      <ElementPanel onAddElement={addElement} />

      <div style={canvasStyles}>
        {blocks.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: tokens.color.textMuted,
            fontSize: '1.125rem',
            textAlign: 'center',
          }}>
            Start by adding elements from the left panel
          </div>
        ) : (
          blocks.map(renderBlock)
        )}
      </div>

      <TypographyPanel
        selectedBlock={selectedBlock}
        onUpdateBlock={updateBlock}
      />
    </div>
  );
};