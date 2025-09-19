import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Plus, Trash2, Move, Type, Image, Grid, Layout, Palette, Save, Eye, Undo, Redo,
  Settings, Copy, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  Upload, RotateCw, Crop, ZoomIn, ZoomOut, GripVertical, ChevronUp, ChevronDown,
  Edit3, Link, List, ListOrdered, MousePointer, Square, Menu, X, Smartphone,
  Monitor, Tablet, Play, Camera, Video, Share2, Heart, MessageCircle, Send,
  Bookmark, Globe, Code, Layers, Maximize, Info, FileText, Book, Printer,
  ChevronLeft, ChevronRight, Download, Folder, PanelLeftOpen, RefreshCw,
  Paintbrush, Sliders, Zap, ArrowLeft
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';

// Block Types
const BLOCK_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  GRID: 'grid',
  SPACER: 'spacer',
  BUTTON: 'button',
  HEADING: 'heading',
  GALLERY: 'gallery',
  HERO: 'hero',
  QUOTE: 'quote',
  SOCIAL_POST: 'social_post',
  SOCIAL_STORY: 'social_story',
  SOCIAL_CAROUSEL: 'social_carousel',
  WEBSITE_DESKTOP: 'website_desktop',
  WEBSITE_MOBILE: 'website_mobile',
  APP_MOBILE: 'app_mobile',
  APP_DESKTOP: 'app_desktop',
  PRINT_TRIFOLD: 'print_trifold',
  PRINT_CATALOG: 'print_catalog',
  PRINT_BOOK: 'print_book',
  PRINT_POSTER: 'print_poster'
};

const NewEditorPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showMobileView, setShowMobileView] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [propertiesPanelCollapsed, setPropertiesPanelCollapsed] = useState(false);

  // Panel visibility states
  const [showElementsPanel, setShowElementsPanel] = useState(true);
  const [showStylePanel, setShowStylePanel] = useState(true);
  const [showLayersPanel, setShowLayersPanel] = useState(true);
  const [showAssetsPanel, setShowAssetsPanel] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);

  const [blocks, setBlocks] = useState([
    {
      id: '1',
      type: BLOCK_TYPES.HERO,
      content: {
        title: 'Portfolio Project',
        subtitle: 'Showcase your best work',
        backgroundImage: '',
        textColor: '#ffffff'
      },
      style: {
        backgroundColor: '#5a3cf4',
        minHeight: '400px',
        padding: '80px 40px'
      }
    },
    {
      id: '2',
      type: BLOCK_TYPES.TEXT,
      content: {
        text: 'This is a sample text block. You can edit this content and style it however you like.',
        fontSize: '16px',
        fontWeight: 'normal',
        textAlign: 'left'
      },
      style: {
        padding: '40px'
      }
    }
  ]);

  const blockCategories = [
    {
      name: 'Basic',
      blocks: [
        { type: BLOCK_TYPES.TEXT, icon: Type, name: 'Text', description: 'Paragraph text' },
        { type: BLOCK_TYPES.HEADING, icon: Type, name: 'Heading', description: 'Section heading' },
        { type: BLOCK_TYPES.IMAGE, icon: Image, name: 'Image', description: 'Single image' },
        { type: BLOCK_TYPES.BUTTON, icon: Square, name: 'Button', description: 'Call to action' },
        { type: BLOCK_TYPES.SPACER, icon: Menu, name: 'Spacer', description: 'Empty space' }
      ]
    },
    {
      name: 'Layout',
      blocks: [
        { type: BLOCK_TYPES.GRID, icon: Grid, name: 'Grid', description: 'Multi-column layout' },
        { type: BLOCK_TYPES.GALLERY, icon: Image, name: 'Gallery', description: 'Image gallery' },
        { type: BLOCK_TYPES.HERO, icon: Maximize, name: 'Hero', description: 'Large banner section' }
      ]
    },
    {
      name: 'Social Media',
      blocks: [
        { type: BLOCK_TYPES.SOCIAL_POST, icon: MessageCircle, name: 'Social Post', description: 'Instagram/Twitter post' },
        { type: BLOCK_TYPES.SOCIAL_STORY, icon: Smartphone, name: 'Story', description: 'Instagram story' },
        { type: BLOCK_TYPES.SOCIAL_CAROUSEL, icon: ChevronRight, name: 'Carousel', description: 'Swipeable content' }
      ]
    },
    {
      name: 'Mockups',
      blocks: [
        { type: BLOCK_TYPES.WEBSITE_DESKTOP, icon: Monitor, name: 'Desktop Website', description: 'Desktop browser mockup' },
        { type: BLOCK_TYPES.WEBSITE_MOBILE, icon: Smartphone, name: 'Mobile Website', description: 'Mobile browser mockup' },
        { type: BLOCK_TYPES.APP_MOBILE, icon: Smartphone, name: 'Mobile App', description: 'Mobile app mockup' },
        { type: BLOCK_TYPES.APP_DESKTOP, icon: Monitor, name: 'Desktop App', description: 'Desktop app mockup' }
      ]
    },
    {
      name: 'Print',
      blocks: [
        { type: BLOCK_TYPES.PRINT_POSTER, icon: FileText, name: 'Poster', description: 'Print poster layout' },
        { type: BLOCK_TYPES.PRINT_TRIFOLD, icon: Book, name: 'Trifold', description: 'Trifold brochure' },
        { type: BLOCK_TYPES.PRINT_CATALOG, icon: Book, name: 'Catalog', description: 'Product catalog' },
        { type: BLOCK_TYPES.PRINT_BOOK, icon: Book, name: 'Book', description: 'Book/magazine layout' }
      ]
    }
  ];

  const addBlock = (blockType) => {
    const newBlock = {
      id: Date.now().toString(),
      type: blockType,
      content: getDefaultContent(blockType),
      style: getDefaultStyle(blockType)
    };
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlock(newBlock.id);
    setIsAddingBlock(false);
  };

  const getDefaultContent = (blockType) => {
    switch (blockType) {
      case BLOCK_TYPES.TEXT:
        return { text: 'Enter your text here...', fontSize: '16px', fontWeight: 'normal', textAlign: 'left' };
      case BLOCK_TYPES.HEADING:
        return { text: 'Heading Text', fontSize: '32px', fontWeight: 'bold', textAlign: 'left' };
      case BLOCK_TYPES.IMAGE:
        return { src: '', alt: '', caption: '' };
      case BLOCK_TYPES.BUTTON:
        return { text: 'Click me', link: '', style: 'primary' };
      case BLOCK_TYPES.HERO:
        return { title: 'Hero Title', subtitle: 'Hero subtitle', backgroundImage: '', textColor: '#ffffff' };
      default:
        return {};
    }
  };

  const getDefaultStyle = (blockType) => {
    switch (blockType) {
      case BLOCK_TYPES.HERO:
        return { backgroundColor: '#5a3cf4', minHeight: '400px', padding: '80px 40px' };
      case BLOCK_TYPES.SPACER:
        return { height: '60px' };
      default:
        return { padding: '20px' };
    }
  };

  const deleteBlock = (blockId) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    setSelectedBlock(null);
  };

  const duplicateBlock = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      const newBlock = {
        ...block,
        id: Date.now().toString()
      };
      const blockIndex = blocks.findIndex(b => b.id === blockId);
      setBlocks(prev => [...prev.slice(0, blockIndex + 1), newBlock, ...prev.slice(blockIndex + 1)]);
    }
  };

  const moveBlock = (blockId, direction) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;

    const newBlocks = [...blocks];
    if (direction === 'up' && blockIndex > 0) {
      [newBlocks[blockIndex], newBlocks[blockIndex - 1]] = [newBlocks[blockIndex - 1], newBlocks[blockIndex]];
    } else if (direction === 'down' && blockIndex < blocks.length - 1) {
      [newBlocks[blockIndex], newBlocks[blockIndex + 1]] = [newBlocks[blockIndex + 1], newBlocks[blockIndex]];
    }
    setBlocks(newBlocks);
  };

  const renderBlock = (block) => {
    switch (block.type) {
      case BLOCK_TYPES.HERO:
        return (
          <div
            className="hero-block"
            style={{
              ...block.style,
              backgroundImage: block.content.backgroundImage ? `url(${block.content.backgroundImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              color: block.content.textColor
            }}
          >
            <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }}>
              {block.content.title}
            </h1>
            <p style={{ fontSize: '20px', opacity: 0.9 }}>
              {block.content.subtitle}
            </p>
          </div>
        );

      case BLOCK_TYPES.TEXT:
        return (
          <div style={block.style}>
            <p style={{
              fontSize: block.content.fontSize,
              fontWeight: block.content.fontWeight,
              textAlign: block.content.textAlign,
              margin: 0
            }}>
              {block.content.text}
            </p>
          </div>
        );

      case BLOCK_TYPES.HEADING:
        return (
          <div style={block.style}>
            <h2 style={{
              fontSize: block.content.fontSize,
              fontWeight: block.content.fontWeight,
              textAlign: block.content.textAlign,
              margin: 0
            }}>
              {block.content.text}
            </h2>
          </div>
        );

      case BLOCK_TYPES.IMAGE:
        return (
          <div style={block.style}>
            {block.content.src ? (
              <img
                src={block.content.src}
                alt={block.content.alt}
                style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
              />
            ) : (
              <div className={`flex items-center justify-center h-48 rounded-lg border-2 border-dashed ${
                isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-100'
              }`}>
                <div className="text-center">
                  <Image size={48} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">Click to add image</p>
                </div>
              </div>
            )}
            {block.content.caption && (
              <p className="text-sm text-gray-600 mt-2 text-center">{block.content.caption}</p>
            )}
          </div>
        );

      case BLOCK_TYPES.BUTTON:
        return (
          <div style={block.style}>
            <button className={`px-6 py-3 rounded-lg font-medium ${
              block.content.style === 'primary'
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'border border-purple-600 text-purple-600 hover:bg-purple-50'
            }`}>
              {block.content.text}
            </button>
          </div>
        );

      case BLOCK_TYPES.SPACER:
        return <div style={block.style}></div>;

      default:
        return (
          <div style={block.style} className={`border-2 border-dashed ${
            isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-100'
          } flex items-center justify-center min-h-[120px]`}>
            <p className="text-gray-500">Block type: {block.type}</p>
          </div>
        );
    }
  };

  return (
    <div className={`h-screen flex transition-colors duration-200 ${
      isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Left Sidebar - Elements and Tools */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-80'} ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border-r flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ArrowLeft size={16} />
                </Link>
                <div>
                  <h2 className="font-semibold">Project Editor</h2>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {projectId}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <PanelLeftOpen size={16} className={sidebarCollapsed ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>

        {!sidebarCollapsed && (
          <div className="flex-1 overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {[
                { key: 'elements', icon: Plus, label: 'Elements' },
                { key: 'layers', icon: Layers, label: 'Layers' },
                { key: 'assets', icon: Folder, label: 'Assets' }
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    setShowElementsPanel(key === 'elements');
                    setShowLayersPanel(key === 'layers');
                    setShowAssetsPanel(key === 'assets');
                  }}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    (key === 'elements' && showElementsPanel) ||
                    (key === 'layers' && showLayersPanel) ||
                    (key === 'assets' && showAssetsPanel)
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={16} className="mx-auto mb-1" />
                  <div>{label}</div>
                </button>
              ))}
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Elements Panel */}
              {showElementsPanel && (
                <div className="space-y-6">
                  {blockCategories.map((category) => (
                    <div key={category.name}>
                      <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                        {category.name}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {category.blocks.map((block) => {
                          const IconComponent = block.icon;
                          return (
                            <button
                              key={block.type}
                              onClick={() => addBlock(block.type)}
                              className={`p-3 rounded-lg border transition-all hover:shadow-sm group ${
                                isDarkMode
                                  ? 'border-gray-700 bg-gray-750 hover:bg-gray-700'
                                  : 'border-gray-200 bg-white hover:bg-gray-50'
                              }`}
                            >
                              <IconComponent size={20} className="mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                              <div className="text-xs font-medium">{block.name}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Layers Panel */}
              {showLayersPanel && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    Page Layers
                  </h3>
                  {blocks.map((block, index) => (
                    <div
                      key={block.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all group ${
                        selectedBlock === block.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                          : isDarkMode
                            ? 'border-gray-700 bg-gray-750 hover:bg-gray-700'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedBlock(block.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical size={14} className="text-gray-400" />
                          <div className="text-sm font-medium">{block.type}</div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateBlock(block.id);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBlock(block.id);
                            }}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Assets Panel */}
              {showAssetsPanel && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    Project Assets
                  </h3>

                  <button className={`w-full p-4 border-2 border-dashed rounded-lg transition-colors ${
                    isDarkMode
                      ? 'border-gray-600 hover:border-gray-500 bg-gray-800'
                      : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                  }`}>
                    <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                    <div className="text-sm text-gray-600 dark:text-gray-400">Upload Assets</div>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <div className={`aspect-square rounded-lg border ${
                      isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                    } flex items-center justify-center`}>
                      <Image size={24} className="text-gray-400" />
                    </div>
                    <div className={`aspect-square rounded-lg border ${
                      isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                    } flex items-center justify-center`}>
                      <Video size={24} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className={`border-b ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } px-6 py-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}>
                  <Undo size={16} />
                </button>
                <button className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}>
                  <Redo size={16} />
                </button>
              </div>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMobileView(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    !showMobileView
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
                      : isDarkMode
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Monitor size={16} />
                </button>
                <button
                  onClick={() => setShowMobileView(true)}
                  className={`p-2 rounded-lg transition-colors ${
                    showMobileView
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
                      : isDarkMode
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Smartphone size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  previewMode
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : isDarkMode
                      ? 'border border-gray-600 hover:bg-gray-700'
                      : 'border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Eye size={16} className="inline mr-2" />
                {previewMode ? 'Exit Preview' : 'Preview'}
              </button>

              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                <Save size={16} className="inline mr-2" />
                Save
              </button>

              <button className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}>
                <Share2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="flex justify-center">
            <div
              className={`transition-all duration-300 ${
                showMobileView ? 'max-w-sm' : 'max-w-4xl'
              } w-full ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-xl rounded-lg overflow-hidden`}
            >
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className={`relative group ${
                    selectedBlock === block.id && !previewMode
                      ? 'ring-2 ring-purple-500 ring-inset'
                      : ''
                  }`}
                  onClick={() => !previewMode && setSelectedBlock(block.id)}
                >
                  {renderBlock(block)}

                  {selectedBlock === block.id && !previewMode && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-lg">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(block.id, 'up');
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(block.id, 'down');
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateBlock(block.id);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBlock(block.id);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {!previewMode && (
                <div className="p-8 text-center border-t border-dashed border-gray-300 dark:border-gray-600">
                  <button
                    onClick={() => setIsAddingBlock(true)}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-dashed transition-colors ${
                      isDarkMode
                        ? 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-white'
                        : 'border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Plus size={20} />
                    Add Block
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Properties Panel */}
      {selectedBlock && !previewMode && !propertiesPanelCollapsed && (
        <div className={`w-80 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border-l flex flex-col`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Properties</h3>
              <button
                onClick={() => setPropertiesPanelCollapsed(true)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              {/* Style Panel */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                  Styling
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Padding</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        className="w-8 h-8 rounded border"
                        defaultValue="#ffffff"
                      />
                      <input
                        type="text"
                        className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                          isDarkMode
                            ? 'border-gray-600 bg-gray-700'
                            : 'border-gray-200 bg-white'
                        }`}
                        defaultValue="#ffffff"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Panel */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                  Content
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Text Content</label>
                    <textarea
                      className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${
                        isDarkMode
                          ? 'border-gray-600 bg-gray-700'
                          : 'border-gray-200 bg-white'
                      }`}
                      rows={3}
                      placeholder="Enter text content..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Properties Panel Button */}
      {propertiesPanelCollapsed && selectedBlock && !previewMode && (
        <button
          onClick={() => setPropertiesPanelCollapsed(false)}
          className={`fixed right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-lg shadow-lg transition-colors ${
            isDarkMode
              ? 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
              : 'bg-white border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Settings size={20} />
        </button>
      )}
    </div>
  );
};

export default NewEditorPage;