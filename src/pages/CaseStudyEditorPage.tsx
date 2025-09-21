import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Project, AnyBlock, TextBlock, MediaBlock, TimelineBlock, ImpactBlock } from '../types/blocks';
import { BlockRenderer } from '../components/blocks/BlockRenderer';

const CaseStudyEditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [blocks, setBlocks] = useState<AnyBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Mock data for now
  useEffect(() => {
    if (projectId) {
      const mockProject: Project = {
        id: projectId,
        title: 'E-commerce Platform Redesign',
        summary: 'Complete overhaul of the user experience for better conversions',
        status: 'draft',
        blocks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockBlocks: AnyBlock[] = [
        {
          id: '1',
          type: 'text',
          order: 0,
          content: 'This case study showcases a comprehensive redesign of an e-commerce platform.',
          variant: 'heading',
        } as TextBlock,
        {
          id: '2',
          type: 'text',
          order: 1,
          content: 'The project involved extensive user research, prototyping, and testing to improve conversion rates and user satisfaction.',
          variant: 'body',
        } as TextBlock,
        {
          id: '3',
          type: 'impact',
          order: 2,
          problem: 'Low conversion rates and poor user experience on the existing platform',
          solution: 'Redesigned the entire user journey with focus on simplicity and trust',
          outcomes: [
            'Increased conversion rate by 45%',
            'Reduced bounce rate by 30%',
            'Improved user satisfaction score by 40%',
          ],
          metrics: {
            'conversion rate': 45,
            'bounce rate reduction': 30,
            'satisfaction increase': 40,
          },
        } as ImpactBlock,
      ];

      setProject(mockProject);
      setBlocks(mockBlocks);
      setSelectedBlockId(mockBlocks[0]?.id || null);
    }
  }, [projectId]);

  const addBlock = (type: 'text' | 'media' | 'timeline' | 'impact') => {
    const newBlock: AnyBlock = (() => {
      const baseBlock = {
        id: Date.now().toString(),
        order: blocks.length,
      };

      switch (type) {
        case 'text':
          return {
            ...baseBlock,
            type: 'text',
            content: 'New text block',
            variant: 'body',
          } as TextBlock;
        case 'media':
          return {
            ...baseBlock,
            type: 'media',
            media: {
              url: 'https://via.placeholder.com/400x300',
              kind: 'image',
              alt: 'Placeholder image',
            },
            caption: 'Add your media caption here',
          } as MediaBlock;
        case 'timeline':
          return {
            ...baseBlock,
            type: 'timeline',
            items: [
              {
                label: 'Phase 1',
                start: 'Jan 2024',
                end: 'Feb 2024',
                note: 'Initial research and discovery',
              },
            ],
          } as TimelineBlock;
        case 'impact':
          return {
            ...baseBlock,
            type: 'impact',
            problem: 'Describe the problem you were solving',
            solution: 'Explain your solution approach',
            outcomes: ['Key outcome 1', 'Key outcome 2'],
          } as ImpactBlock;
        default:
          throw new Error(`Unknown block type: ${type}`);
      }
    })();

    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    setShowAddMenu(false);
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    setBlocks(prev => {
      const newBlocks = [...prev];
      const currentIndex = newBlocks.findIndex(b => b.id === blockId);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (newIndex >= 0 && newIndex < newBlocks.length) {
        [newBlocks[currentIndex], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[currentIndex]];
        // Update order values
        newBlocks.forEach((block, index) => {
          block.order = index;
        });
      }

      return newBlocks;
    });
  };

  const deleteBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(blocks[0]?.id || null);
    }
  };

  if (!project) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading project...</p>
        </div>
      </div>
    );
  }

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-[#cbc0ff]">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/case-studies" className="hover:text-[#5a3cf4]">
              Case Studies
            </Link>
            <span>/</span>
            <span>Editor</span>
          </div>
          <h1 className="text-2xl font-semibold lowercase text-[#5a3cf4]">
            {project.title}
          </h1>
          {project.summary && (
            <p className="text-sm text-[#333333] mt-1">{project.summary}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm border border-[#cbc0ff] rounded-md hover:bg-gray-50 transition-colors">
            Preview
          </button>
          <button className="px-4 py-2 text-sm bg-[#5a3cf4] text-white rounded-md hover:bg-[#4a2ce3] transition-colors">
            Publish
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Block List Sidebar */}
        <div className="col-span-3">
          <div className="sticky top-6">
            <div className="bg-white border border-[#cbc0ff] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium lowercase text-[#1a1a1a]">
                  Blocks ({blocks.length})
                </h3>
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="w-6 h-6 rounded-full bg-[#5a3cf4] text-white text-xs flex items-center justify-center hover:bg-[#4a2ce3] transition-colors"
                >
                  +
                </button>
              </div>

              {showAddMenu && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs uppercase text-[#333333] mb-2">Add Block</p>
                  <div className="grid gap-2">
                    <button
                      onClick={() => addBlock('text')}
                      className="text-left px-3 py-2 text-sm rounded-md border border-gray-200 hover:bg-white transition-colors"
                    >
                      📝 Text
                    </button>
                    <button
                      onClick={() => addBlock('media')}
                      className="text-left px-3 py-2 text-sm rounded-md border border-gray-200 hover:bg-white transition-colors"
                    >
                      🖼️ Media
                    </button>
                    <button
                      onClick={() => addBlock('timeline')}
                      className="text-left px-3 py-2 text-sm rounded-md border border-gray-200 hover:bg-white transition-colors"
                    >
                      📅 Timeline
                    </button>
                    <button
                      onClick={() => addBlock('impact')}
                      className="text-left px-3 py-2 text-sm rounded-md border border-gray-200 hover:bg-white transition-colors"
                    >
                      📊 Impact
                    </button>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                {blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedBlockId === block.id
                        ? 'border-[#5a3cf4] bg-[#5a3cf4]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedBlockId(block.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase text-[#5a3cf4] font-medium">
                          {block.type}
                        </p>
                        <p className="text-sm text-[#1a1a1a] truncate">
                          {block.type === 'text' && (block as TextBlock).content}
                          {block.type === 'media' && (block as MediaBlock).caption}
                          {block.type === 'timeline' && `${(block as TimelineBlock).items.length} items`}
                          {block.type === 'impact' && (block as ImpactBlock).problem}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(block.id, 'up');
                          }}
                          disabled={index === 0}
                          className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          ↑
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(block.id, 'down');
                          }}
                          disabled={index === blocks.length - 1}
                          className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-6">
          <div className="bg-white border border-[#cbc0ff] rounded-2xl p-6">
            <h3 className="text-sm font-medium lowercase text-[#1a1a1a] mb-4">
              Preview
            </h3>
            <div className="grid gap-6">
              {blocks.map((block) => (
                <div key={block.id} className="relative">
                  <BlockRenderer
                    block={block}
                    isSelected={selectedBlockId === block.id}
                    onSelect={() => setSelectedBlockId(block.id)}
                  />
                  {selectedBlockId === block.id && (
                    <button
                      onClick={() => deleteBlock(block.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="col-span-3">
          <div className="sticky top-6">
            <div className="bg-white border border-[#cbc0ff] rounded-2xl p-4">
              <h3 className="text-sm font-medium lowercase text-[#1a1a1a] mb-4">
                Properties
              </h3>
              {selectedBlock ? (
                <div className="grid gap-3 text-sm">
                  <div>
                    <label className="text-xs uppercase text-[#333333] block mb-1">
                      Block Type
                    </label>
                    <p className="text-[#5a3cf4] font-medium">{selectedBlock.type}</p>
                  </div>
                  <div>
                    <label className="text-xs uppercase text-[#333333] block mb-1">
                      Order
                    </label>
                    <p className="text-[#1a1a1a]">{selectedBlock.order + 1}</p>
                  </div>
                  {selectedBlock.type === 'text' && (
                    <div>
                      <label className="text-xs uppercase text-[#333333] block mb-1">
                        Variant
                      </label>
                      <p className="text-[#1a1a1a]">{(selectedBlock as TextBlock).variant}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-4">
                    Block editing interface coming soon...
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Select a block to view its properties
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseStudyEditorPage;