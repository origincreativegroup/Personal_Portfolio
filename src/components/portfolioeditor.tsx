import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Move,
  Type,
  Image,
  Grid,
  Layout,
  Palette,
  Save,
  Eye,
  Undo,
  Redo,
  Settings,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Upload,
  RotateCw,
  Crop,
  ZoomIn,
  ZoomOut,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Edit3,
  Link,
  List,
  ListOrdered,
  MousePointer,
  Square,
  Menu,
  X,
  Smartphone,
  Monitor,
  Tablet,
  Instagram,
  Play,
  Camera,
  Video,
  Share2,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Globe,
  Code,
  Layers,
  Maximize,
  Info,
  FileText,
  Book,
  Printer,
  ChevronLeft,
  ChevronRight,
  Download,
  Folder,
  PanelLeftOpen,
  RefreshCw,
  Paintbrush,
  Sliders,
  Zap
} from 'lucide-react';

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

// Typography Options
const FONT_FAMILIES = [
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
  { value: 'Playfair Display, serif', label: 'Playfair Display' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Monaco, monospace', label: 'Monaco (Code)' }
];

const FONT_WEIGHTS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Normal' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
  { value: '900', label: 'Black' }
];

// Initial template blocks
const DEFAULT_TEMPLATE = [
  {
    id: '1',
    type: BLOCK_TYPES.HERO,
    content: {
      title: 'Welcome to My Portfolio',
      subtitle: 'Creative Professional & Designer',
      backgroundImage: null,
      overlayOpacity: 0.4
    },
    styles: {
      minHeight: '60vh',
      textAlign: 'center',
      color: 'white',
      padding: '2rem 1rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Inter, sans-serif'
    }
  },
  {
    id: '2',
    type: BLOCK_TYPES.TEXT,
    content: 'I\'m a creative professional passionate about bringing ideas to life through design and innovation.',
    styles: {
      fontSize: '1.1rem',
      textAlign: 'center',
      color: '#6b7280',
      marginBottom: '2rem',
      padding: '1rem',
      lineHeight: '1.6',
      fontFamily: 'Inter, sans-serif'
    }
  }
];

// Mobile breakpoint hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

// File Upload Hook
const useFileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState({});

  const uploadFile = useCallback((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = {
          id: Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: e.target.result,
          uploadedAt: new Date()
        };
        setUploadedFiles(prev => ({ ...prev, [fileData.id]: fileData }));
        resolve(fileData);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  return { uploadedFiles, uploadFile };
};

// File Upload Component
const FileUploadArea = ({ onFileUpload, accept = "image/*", children }) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(onFileUpload);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(onFileUpload);
  };

  return (
    <div
      className={`relative cursor-pointer transition-colors touch-manipulation ${isDragOver ? 'bg-blue-50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      {children}
    </div>
  );
};

// Mobile-optimized Text Editor Modal
const TextEditorModal = ({ isOpen, content, onSave, onClose, placeholder }) => {
  const [localContent, setLocalContent] = useState(content || '');
  const editorRef = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isOpen) {
      setLocalContent(content || '');
    }
  }, [isOpen, content]);

  const handleCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setLocalContent(editorRef.current.innerHTML);
    }
  };

  const handleSave = () => {
    onSave(localContent);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50">
      <div className={`bg-white rounded-t-lg md:rounded-lg shadow-xl w-full ${isMobile ? 'h-full' : 'max-w-2xl mx-4 max-h-[90vh]'}`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Content</h3>
          <button
            onClick={onClose}
            className="md:hidden p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-6 md:flex md:items-center gap-2">
            <button
              onMouseDown={(e) => { e.preventDefault(); handleCommand('bold'); }}
              className="p-3 md:p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
              title="Bold"
            >
              <Bold className="h-5 w-5 md:h-4 md:w-4" />
            </button>
            <button
              onMouseDown={(e) => { e.preventDefault(); handleCommand('italic'); }}
              className="p-3 md:p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
              title="Italic"
            >
              <Italic className="h-5 w-5 md:h-4 md:w-4" />
            </button>
            <button
              onMouseDown={(e) => { e.preventDefault(); handleCommand('underline'); }}
              className="p-3 md:p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
              title="Underline"
            >
              <Underline className="h-5 w-5 md:h-4 md:w-4" />
            </button>

            <button
              onMouseDown={(e) => { e.preventDefault(); handleCommand('justifyLeft'); }}
              className="p-3 md:p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
              title="Align Left"
            >
              <AlignLeft className="h-5 w-5 md:h-4 md:w-4" />
            </button>
            <button
              onMouseDown={(e) => { e.preventDefault(); handleCommand('justifyCenter'); }}
              className="p-3 md:p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
              title="Align Center"
            >
              <AlignCenter className="h-5 w-5 md:h-4 md:w-4" />
            </button>
            <button
              onMouseDown={(e) => { e.preventDefault(); handleCommand('justifyRight'); }}
              className="p-3 md:p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
              title="Align Right"
            >
              <AlignRight className="h-5 w-5 md:h-4 md:w-4" />
            </button>

            <button
              onMouseDown={(e) => { e.preventDefault(); handleCommand('insertUnorderedList'); }}
              className="p-3 md:p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
              title="Bullet List"
            >
              <List className="h-5 w-5 md:h-4 md:w-4" />
            </button>
            <button
              onMouseDown={(e) => { e.preventDefault(); handleCommand('insertOrderedList'); }}
              className="p-3 md:p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
              title="Numbered List"
            >
              <ListOrdered className="h-5 w-5 md:h-4 md:w-4" />
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning={true}
            onInput={(e) => setLocalContent(e.target.innerHTML)}
            className={`border border-gray-300 rounded-lg p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${isMobile ? 'min-h-[200px] text-base' : 'min-h-[150px] text-sm'}`}
            style={{ caretColor: '#3b82f6' }}
            dangerouslySetInnerHTML={{ __html: localContent }}
          />
          {!localContent && (
            <div className="absolute inset-4 text-gray-400 pointer-events-none flex items-start pt-4">
              {placeholder || "Enter your text here..."}
            </div>
          )}
        </div>

        <div className={`p-4 border-t border-gray-200 ${isMobile ? 'pb-safe' : ''}`}>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 md:flex-none px-6 py-3 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium touch-manipulation"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 md:flex-none px-6 py-3 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium touch-manipulation"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

{/* Right rail */}
<div className="hidden lg:block">
  <EnhancedPropertiesPanel
    selectedBlock={selectedBlock}                 // whatever state stores the active block
    onUpdateBlock={(id, patch) => {
      // Deep-merge helper so styles/content don't get clobbered
      setBlocks(cur => cur.map(b => {
        if (b.id !== id) return b
        return {
          ...b,
          ...patch,
          styles: { ...(b.styles ?? {}), ...(patch.styles ?? {}) },
          content: { ...(b.content ?? {}), ...(patch.content ?? {}) }
        }
      }))
    }}
    uploadFile={async (file) => {
      // Minimal in-browser uploader: createObjectURL now, wire real upload later
      return { url: URL.createObjectURL(file), name: file.name }
    }}
  />
</div>

  const handleStyleChange = (styleKey, value) => {
    onUpdateBlock(selectedBlock.id, {
      styles: { ...selectedBlock.styles, [styleKey]: value }
    });
  };

  const handleContentChange = (field, value) => {
    onUpdateBlock(selectedBlock.id, {
      content: { ...selectedBlock.content, [field]: value }
    });
  };

  const handleHeroBackgroundUpload = async (file) => {
    const uploadedFile = await uploadFile(file);
    onUpdateBlock(selectedBlock.id, {
      content: {
        ...selectedBlock.content,
        backgroundImage: uploadedFile.url
      }
    });
  };

  const clearHeroBackground = () => {
    onUpdateBlock(selectedBlock.id, {
      content: {
        ...selectedBlock.content,
        backgroundImage: null
      }
    });
  };

  const blockTypeInfo = {
    [BLOCK_TYPES.HERO]: { icon: Layout, color: 'purple', name: 'Hero Section' },
    [BLOCK_TYPES.TEXT]: { icon: Type, color: 'blue', name: 'Text Block' },
    [BLOCK_TYPES.HEADING]: { icon: Type, color: 'green', name: 'Heading' },
    [BLOCK_TYPES.QUOTE]: { icon: Type, color: 'amber', name: 'Quote Block' },
    [BLOCK_TYPES.IMAGE]: { icon: Image, color: 'pink', name: 'Image' },
    [BLOCK_TYPES.BUTTON]: { icon: MousePointer, color: 'indigo', name: 'Button' },
    [BLOCK_TYPES.GALLERY]: { icon: Grid, color: 'emerald', name: 'Image Gallery' },
    [BLOCK_TYPES.SOCIAL_POST]: { icon: Instagram, color: 'purple', name: 'Social Post' },
    [BLOCK_TYPES.SOCIAL_STORY]: { icon: Smartphone, color: 'purple', name: 'Social Story' },
    [BLOCK_TYPES.SOCIAL_CAROUSEL]: { icon: Share2, color: 'purple', name: 'Social Carousel' },
    [BLOCK_TYPES.WEBSITE_DESKTOP]: { icon: Monitor, color: 'blue', name: 'Desktop Website' },
    [BLOCK_TYPES.WEBSITE_MOBILE]: { icon: Smartphone, color: 'green', name: 'Mobile Website' },
    [BLOCK_TYPES.APP_MOBILE]: { icon: Layers, color: 'purple', name: 'Mobile App' },
    [BLOCK_TYPES.APP_DESKTOP]: { icon: Code, color: 'purple', name: 'Desktop App' },
    [BLOCK_TYPES.PRINT_TRIFOLD]: { icon: PanelLeftOpen, color: 'orange', name: 'Tri-fold Brochure' },
    [BLOCK_TYPES.PRINT_CATALOG]: { icon: Book, color: 'green', name: 'Bound Catalog' },
    [BLOCK_TYPES.PRINT_BOOK]: { icon: FileText, color: 'blue', name: 'Saddle-Stitched' },
    [BLOCK_TYPES.PRINT_POSTER]: { icon: Printer, color: 'red', name: 'Poster/Flyer' },
    [BLOCK_TYPES.SPACER]: { icon: Layout, color: 'gray', name: 'Spacer' }
  };

  const currentBlockInfo = blockTypeInfo[selectedBlock.type] || { icon: Square, color: 'gray', name: 'Block' };
  const Icon = currentBlockInfo.icon;

  const colorOptions = [
    '#000000', '#374151', '#6b7280', '#ffffff',
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#06b6d4',
    '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
    '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
  ];

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${
            currentBlockInfo.color === 'purple' ? 'bg-purple-100' :
            currentBlockInfo.color === 'blue' ? 'bg-blue-100' :
            currentBlockInfo.color === 'green' ? 'bg-green-100' :
            currentBlockInfo.color === 'amber' ? 'bg-amber-100' :
            currentBlockInfo.color === 'pink' ? 'bg-pink-100' :
            currentBlockInfo.color === 'indigo' ? 'bg-indigo-100' :
            currentBlockInfo.color === 'emerald' ? 'bg-emerald-100' :
            currentBlockInfo.color === 'orange' ? 'bg-orange-100' :
            currentBlockInfo.color === 'red' ? 'bg-red-100' :
            'bg-gray-100'
          }`}>
            <Icon className={`h-5 w-5 ${
              currentBlockInfo.color === 'purple' ? 'text-purple-600' :
              currentBlockInfo.color === 'blue' ? 'text-blue-600' :
              currentBlockInfo.color === 'green' ? 'text-green-600' :
              currentBlockInfo.color === 'amber' ? 'text-amber-600' :
              currentBlockInfo.color === 'pink' ? 'text-pink-600' :
              currentBlockInfo.color === 'indigo' ? 'text-indigo-600' :
              currentBlockInfo.color === 'emerald' ? 'text-emerald-600' :
              currentBlockInfo.color === 'orange' ? 'text-orange-600' :
              currentBlockInfo.color === 'red' ? 'text-red-600' :
              'text-gray-600'
            }`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{currentBlockInfo.name}</h3>
            <p className="text-xs text-gray-500">Block #{selectedBlock.id.slice(-4)}</p>
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { id: 'style', icon: Paintbrush, label: 'Style' },
            { id: 'content', icon: Edit3, label: 'Content' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {activeTab === 'style' && (
          <>
            {(selectedBlock.type === BLOCK_TYPES.TEXT ||
              selectedBlock.type === BLOCK_TYPES.HEADING ||
              selectedBlock.type === BLOCK_TYPES.QUOTE ||
              selectedBlock.type === BLOCK_TYPES.BUTTON) && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-2">
                  <Type className="h-4 w-4" />
                  Typography
                </h4>

                <div>
                  <label className="block text-sm font-medium mb-2">Font Family</label>
                  <select
                    value={selectedBlock.styles?.fontFamily || 'Inter, sans-serif'}
                    onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {FONT_FAMILIES.map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Font Size</label>
                  <select
                    value={selectedBlock.styles?.fontSize || '1rem'}
                    onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="0.75rem">Extra Small (12px)</option>
                    <option value="0.875rem">Small (14px)</option>
                    <option value="1rem">Base (16px)</option>
                    <option value="1.125rem">Large (18px)</option>
                    <option value="1.25rem">XL (20px)</option>
                    <option value="1.5rem">2XL (24px)</option>
                    <option value="1.875rem">3XL (30px)</option>
                    <option value="2.25rem">4XL (36px)</option>
                    <option value="3rem">5XL (48px)</option>
                    <option value="3.75rem">6XL (60px)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Font Weight</label>
                  <select
                    value={selectedBlock.styles?.fontWeight || '400'}
                    onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {FONT_WEIGHTS.map(weight => (
                      <option key={weight.value} value={weight.value}>{weight.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Text Alignment</label>
                  <div className="flex gap-1">
                    {['left', 'center', 'right', 'justify'].map((align) => {
                      const Icon = align === 'left' ? AlignLeft :
                                   align === 'center' ? AlignCenter :
                                   align === 'right' ? AlignRight : Type;
                      return (
                        <button
                          key={align}
                          onClick={() => handleStyleChange('textAlign', align)}
                          className={`flex-1 p-2 rounded border transition-colors ${
                            selectedBlock.styles?.textAlign === align
                              ? 'bg-blue-100 border-blue-300 text-blue-700'
                              : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                          }`}
                          title={`Align ${align}`}
                        >
                          <Icon className="h-4 w-4 mx-auto" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-2">
                <Palette className="h-4 w-4" />
                Colors
              </h4>

              <div>
                <label className="block text-sm font-medium mb-2">Text Color</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="color"
                    value={selectedBlock.styles?.color || '#000000'}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedBlock.styles?.color || '#000000'}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm font-mono"
                    placeholder="#000000"
                  />
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      onClick={() => handleStyleChange('color', color)}
                      className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: color,
                        borderColor: selectedBlock.styles?.color === color ? '#3b82f6' : '#e5e7eb'
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Background Color</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="color"
                    value={selectedBlock.styles?.backgroundColor || '#ffffff'}
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedBlock.styles?.backgroundColor || '#ffffff'}
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm font-mono"
                    placeholder="#ffffff"
                  />
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      onClick={() => handleStyleChange('backgroundColor', color)}
                      className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: color,
                        borderColor: selectedBlock.styles?.backgroundColor === color ? '#3b82f6' : '#e5e7eb'
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            {selectedBlock.type === BLOCK_TYPES.HERO && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-2">
                  <Image className="h-4 w-4" />
                  Hero Background
                </h4>

                <div>
                  <label className="block text-sm font-medium mb-2">Background Image</label>
                  <FileUploadArea onFileUpload={handleHeroBackgroundUpload}>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer">
                      {selectedBlock.content?.backgroundImage ? (
                        <div className="relative">
                          <img
                            src={selectedBlock.content.backgroundImage}
                            alt="Background"
                            className="w-full h-24 object-cover rounded mb-2"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearHeroBackground();
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-xs text-gray-600">Upload background image</p>
                        </>
                      )}
                    </div>
                  </FileUploadArea>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Overlay Opacity ({Math.round((selectedBlock.content?.overlayOpacity || 0) * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedBlock.content?.overlayOpacity || 0}
                    onChange={(e) => onUpdateBlock(selectedBlock.id, {
                      content: {
                        ...selectedBlock.content,
                        overlayOpacity: parseFloat(e.target.value)
                      }
                    })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}

            {selectedBlock.type === BLOCK_TYPES.SPACER && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-2">
                  <Layout className="h-4 w-4" />
                  Spacer Settings
                </h4>

                <div>
                  <label className="block text-sm font-medium mb-2">Height</label>
                  <select
                    value={selectedBlock.height || '2rem'}
                    onChange={(e) => onUpdateBlock(selectedBlock.id, { height: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="0.5rem">XS (8px)</option>
                    <option value="1rem">SM (16px)</option>
                    <option value="2rem">MD (32px)</option>
                    <option value="3rem">LG (48px)</option>
                    <option value="4rem">XL (64px)</option>
                    <option value="6rem">2XL (96px)</option>
                    <option value="8rem">3XL (128px)</option>
                  </select>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'content' && (
          <>
            {(selectedBlock.type === BLOCK_TYPES.SOCIAL_POST ||
              selectedBlock.type === BLOCK_TYPES.SOCIAL_STORY ||
              selectedBlock.type === BLOCK_TYPES.SOCIAL_CAROUSEL) && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-2">
                  <Instagram className="h-4 w-4" />
                  Social Media Settings
                </h4>

                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    value={selectedBlock.content?.username || ''}
                    onChange={(e) => handleContentChange('username', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="your_portfolio"
                  />
                </div>

                {selectedBlock.type === BLOCK_TYPES.SOCIAL_POST && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Location</label>
                      <input
                        type="text"
                        value={selectedBlock.content?.location || ''}
                        onChange={(e) => handleContentChange('location', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Your Location"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Likes Count</label>
                      <input
                        type="text"
                        value={selectedBlock.content?.likes || ''}
                        onChange={(e) => handleContentChange('likes', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="42"
                      />
                    </div>
                  </>
                )}

                {(selectedBlock.type === BLOCK_TYPES.SOCIAL_POST || selectedBlock.type === BLOCK_TYPES.SOCIAL_CAROUSEL) && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Hashtags</label>
                    <input
                      type="text"
                      value={selectedBlock.content?.hashtags || ''}
                      onChange={(e) => handleContentChange('hashtags', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="#portfolio #design #creative"
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Simple Block Component (shortened version for space)
const Block = ({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  uploadFile,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}) => {
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const isMobile = useIsMobile();

  const handleContentChange = (newContent, field = null) => {
    if (block.type === BLOCK_TYPES.HERO) {
      onUpdate(block.id, {
        content: { ...block.content, [field]: newContent }
      });
    } else {
      onUpdate(block.id, { content: newContent });
    }
  };

  const openTextEditor = (field = null) => {
    setEditingField(field);
    setShowTextEditor(true);
  };

  const getEditableContent = () => {
    if (block.type === BLOCK_TYPES.HERO && editingField) {
      return block.content?.[editingField] || '';
    }
    return block.content || '';
  };

  const saveTextChanges = (newContent) => {
    if (block.type === BLOCK_TYPES.HERO && editingField) {
      handleContentChange(newContent, editingField);
    } else {
      handleContentChange(newContent);
    }
  };

  const renderBlockContent = () => {
    const commonStyles = {
      ...block.styles,
      position: 'relative',
      minHeight: block.type === BLOCK_TYPES.TEXT ? '2rem' : 'auto'
    };

    switch (block.type) {
      case BLOCK_TYPES.HERO:
        return (
          <div style={commonStyles}>
            <div className="relative">
              {block.content?.backgroundImage && (
                <img
                  src={block.content.backgroundImage}
                  alt="Hero background"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div
                className="relative z-10 p-4 md:p-8"
                style={{ backgroundColor: `rgba(0,0,0,${block.content?.overlayOpacity || 0})` }}
              >
                <div className="relative group">
                  <h1 className="text-3xl md:text-6xl font-bold mb-4">
                    <div dangerouslySetInnerHTML={{ __html: block.content?.title || 'Hero Title' }} />
                  </h1>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openTextEditor('title');
                    }}
                    className={`absolute -top-2 -right-2 bg-blue-500 text-white p-2 md:p-1 rounded-lg touch-manipulation ${isMobile ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                    title="Edit Title"
                  >
                    <Edit3 className="h-4 w-4 md:h-3 md:w-3" />
                  </button>
                </div>

                <div className="relative group">
                  <p className="text-lg md:text-2xl opacity-90">
                    <div dangerouslySetInnerHTML={{ __html: block.content?.subtitle || 'Hero Subtitle' }} />
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openTextEditor('subtitle');
                    }}
                    className={`absolute -top-2 -right-2 bg-blue-500 text-white p-2 md:p-1 rounded-lg touch-manipulation ${isMobile ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                    title="Edit Subtitle"
                  >
                    <Edit3 className="h-4 w-4 md:h-3 md:w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case BLOCK_TYPES.TEXT:
        return (
          <div className="relative group">
            <div style={commonStyles}>
              <div dangerouslySetInnerHTML={{ __html: block.content || 'Tap edit to add your text...' }} />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openTextEditor();
              }}
              className={`absolute -top-2 -right-2 bg-blue-500 text-white p-3 md:p-2 rounded-lg touch-manipulation ${isMobile ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
              title="Edit Text"
            >
              <Edit3 className="h-5 w-5 md:h-4 md:w-4" />
            </button>
          </div>
        );

      case BLOCK_TYPES.SPACER:
        return (
          <div
            style={{
              ...commonStyles,
              height: block.height || '2rem',
              backgroundColor: isSelected ? '#f3f4f6' : 'transparent',
              border: isSelected ? '2px dashed #9ca3af' : '2px dashed transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '2rem'
            }}
          >
            <span className="text-sm text-gray-500">Spacer - {block.height || '2rem'}</span>
          </div>
        );

      default:
        return <div style={commonStyles}>Block type: {block.type}</div>;
    }
  };

  return (
    <>
      <div
        className={`relative group transition-all duration-200 ${
          isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(block.id);
        }}
        style={{
          margin: isMobile ? '1rem 0' : '0.5rem 0',
          cursor: 'pointer'
        }}
      >
        {renderBlockContent()}

        {isSelected && (
          <div className={`absolute ${isMobile ? '-left-16' : '-left-12'} top-1/2 transform -translate-y-1/2 flex flex-col gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 md:p-1`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              disabled={!canMoveUp}
              className="p-2 md:p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              title="Move Up"
            >
              <ChevronUp className="h-5 w-5 md:h-4 md:w-4" />
            </button>
            <div className="w-5 h-5 md:w-4 md:h-4 flex items-center justify-center">
              <GripVertical className="h-4 w-4 md:h-3 md:w-3 text-gray-400" />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              disabled={!canMoveDown}
              className="p-2 md:p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              title="Move Down"
            >
              <ChevronDown className="h-5 w-5 md:h-4 md:w-4" />
            </button>
          </div>
        )}

        {isSelected && (
          <div className={`absolute ${isMobile ? '-top-16' : '-top-12'} left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex items-center gap-2 z-20`}>
            <button
              className="p-2 md:p-1 hover:bg-gray-100 rounded touch-manipulation"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(block.id);
              }}
              title="Duplicate Block"
            >
              <Copy className="h-5 w-5 md:h-4 md:w-4" />
            </button>
            <button
              className="p-2 md:p-1 hover:bg-gray-100 rounded text-red-600 touch-manipulation"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(block.id);
              }}
              title="Delete Block"
            >
              <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
            </button>
          </div>
        )}
      </div>

      <TextEditorModal
        isOpen={showTextEditor}
        content={getEditableContent()}
        onSave={saveTextChanges}
        onClose={() => {
          setShowTextEditor(false);
          setEditingField(null);
        }}
        placeholder={
          block.type === BLOCK_TYPES.HERO && editingField === 'title' ? "Hero title..." :
          block.type === BLOCK_TYPES.HERO && editingField === 'subtitle' ? "Hero subtitle..." :
          "Enter your text here..."
        }
      />
    </>
  );
};

// Simple Block Library
const DesktopBlockLibrary = ({ onAddBlock }) => {
  const blocks = [
    { type: BLOCK_TYPES.HERO, icon: Layout, label: 'Hero Section' },
    { type: BLOCK_TYPES.TEXT, icon: Type, label: 'Text Block' },
    { type: BLOCK_TYPES.SPACER, icon: Layout, label: 'Spacer' }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Add Content</h3>
        <div className="space-y-2">
          {blocks.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => onAddBlock(type)}
              className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <Icon className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Editor Component
const PortfolioEditor = () => {
  const [blocks, setBlocks] = useState(DEFAULT_TEMPLATE);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [history, setHistory] = useState([DEFAULT_TEMPLATE]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { uploadedFiles, uploadFile } = useFileUpload();
  const isMobile = useIsMobile();

  const selectedBlock = blocks.find(block => block.id === selectedBlockId);

  const saveToHistory = useCallback((newBlocks) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const addBlock = useCallback((type) => {
    const newBlock = {
      id: Date.now().toString(),
      type,
      content: type === BLOCK_TYPES.HERO ? {
        title: 'New Hero Section',
        subtitle: 'Hero subtitle',
        backgroundImage: null,
        overlayOpacity: 0.4
      } : type === BLOCK_TYPES.TEXT ? 'New text block. Click the edit button to change this text.' : '',
      styles: {
        marginBottom: isMobile ? '1.5rem' : '2rem',
        fontFamily: 'Inter, sans-serif',
        ...(type === BLOCK_TYPES.HERO && {
          minHeight: isMobile ? '50vh' : '60vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: isMobile ? '2rem 1rem' : '4rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }),
        ...(type === BLOCK_TYPES.TEXT && {
          fontSize: isMobile ? '1rem' : '1rem',
          lineHeight: '1.6',
          padding: isMobile ? '1rem' : '1rem',
          fontWeight: '400'
        })
      },
      ...(type === BLOCK_TYPES.SPACER && { height: '2rem' })
    };

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
    saveToHistory(newBlocks);
  }, [blocks, saveToHistory, isMobile]);

  const updateBlock = useCallback((blockId, updates) => {
    const newBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    );
    setBlocks(newBlocks);
  }, [blocks]);

  const deleteBlock = useCallback((blockId) => {
    const newBlocks = blocks.filter(block => block.id !== blockId);
    setBlocks(newBlocks);
    setSelectedBlockId(null);
    saveToHistory(newBlocks);
  }, [blocks, saveToHistory]);

  const duplicateBlock = useCallback((blockId) => {
    const blockToDuplicate = blocks.find(block => block.id === blockId);
    if (blockToDuplicate) {
      const newBlock = {
        ...blockToDuplicate,
        id: Date.now().toString()
      };

      const blockIndex = blocks.findIndex(block => block.id === blockId);
      const newBlocks = [
        ...blocks.slice(0, blockIndex + 1),
        newBlock,
        ...blocks.slice(blockIndex + 1)
      ];

      setBlocks(newBlocks);
      setSelectedBlockId(newBlock.id);
      saveToHistory(newBlocks);
    }
  }, [blocks, saveToHistory]);

  const moveBlock = useCallback((blockId, direction) => {
    const currentIndex = blocks.findIndex(block => block.id === blockId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    [newBlocks[currentIndex], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[currentIndex]];

    setBlocks(newBlocks);
    saveToHistory(newBlocks);
  }, [blocks, saveToHistory]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBlocks(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBlocks(history[historyIndex + 1]);
    }
  };

  const saveTemplate = () => {
    const template = {
      id: Date.now(),
      name: 'My Portfolio Template',
      blocks: blocks,
      uploadedFiles: uploadedFiles,
      createdAt: new Date().toISOString()
    };

    console.log('Saved template:', template);
    alert('Template saved successfully!');
  };
  // --- Enhanced Properties Panel (Desktop) ---
  const EnhancedPropertiesPanel: React.FC<{
    selectedBlock: any | null
    onUpdateBlock: (id: string, patch: Partial<any>) => void
    uploadFile: (f: File) => Promise<{ url: string; name: string }>
  }> = ({ selectedBlock, onUpdateBlock, uploadFile }) => {
    if (!selectedBlock) {
      return (
        <div className="w-72 bg-white border-l border-gray-200 h-full p-4">
          <h3 className="text-lg font-semibold mb-4">Block Settings</h3>
          <div className="text-center text-gray-500 mt-8">
            <Square className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>Select a block to edit its settings</p>
          </div>
        </div>
      );
    }

    // Helpers
    const styles = selectedBlock.styles ?? {};
    const setStyle = (key: string, value: any) =>
      onUpdateBlock(selectedBlock.id, { styles: { ...styles, [key]: value } });

    const setContent = (patch: Record<string, any>) =>
      onUpdateBlock(selectedBlock.id, { content: { ...(selectedBlock.content ?? {}), ...patch } });

    const number = (v: any, fallback = 0) => (typeof v === 'number' ? v : parseFloat(v) || fallback);

    const handleHeroBackgroundUpload = async (file: File) => {
      const up = await uploadFile(file);
      setContent({ backgroundImage: up.url });
    };

    const handleMockupUpload = async (file: File) => {
      const up = await uploadFile(file);
      setContent({ screenshot: up.url });
    };

    const handleSocialMediaUpload = async (file: File) => {
      const up = await uploadFile(file);
      setContent({
        mediaUrl: up.url,
        mediaType: file.type.startsWith('video/') ? 'video' : 'image',
      });
    };

    // Small UI atoms
    const FieldLabel: React.FC<React.PropsWithChildren<{ hint?: string }>> = ({ children, hint }) => (
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{children}</label>
        {hint ? <span className="text-[10px] text-gray-400">{hint}</span> : null}
      </div>
    );

    const Swatches: React.FC<{ colors: string[]; value?: string; onPick: (c: string) => void }> = ({
      colors,
      value,
      onPick,
    }) => (
      <div className="grid grid-cols-8 gap-1">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onPick(c)}
            className={`h-6 w-6 rounded border ${value === c ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>
    );

    const Slider: React.FC<{
      value: number;
      min: number;
      max: number;
      step?: number;
      onChange: (v: number) => void;
      suffix?: string;
    }> = ({ value, min, max, step = 1, onChange, suffix }) => (
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1"
        />
        <div className="w-12 text-right text-xs text-gray-600">
          {Math.round(value * 100) / 100}
          {suffix}
        </div>
      </div>
    );

    // Panels
    const TypographyPanel = (
      <div className="space-y-2">
        <FieldLabel>Font Family</FieldLabel>
        <select
          className="w-full border rounded p-2 text-sm"
          value={styles.fontFamily ?? FONT_FAMILIES[0].value}
          onChange={(e) => setStyle('fontFamily', e.target.value)}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel>Size</FieldLabel>
            <input
              className="w-full border rounded p-2 text-sm"
              type="text"
              value={styles.fontSize ?? '1rem'}
              onChange={(e) => setStyle('fontSize', e.target.value)}
              placeholder="e.g. 1rem, 18px, 2.5rem"
            />
          </div>
          <div>
            <FieldLabel>Weight</FieldLabel>
            <select
              className="w-full border rounded p-2 text-sm"
              value={styles.fontWeight ?? '400'}
              onChange={(e) => setStyle('fontWeight', e.target.value)}
            >
              {FONT_WEIGHTS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <FieldLabel>Align</FieldLabel>
          <div className="flex gap-1">
            {(['left', 'center', 'right'] as const).map((align) => {
              const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
              return (
                <button
                  key={align}
                  onClick={() => setStyle('textAlign', align)}
                  className={`flex-1 p-2 rounded border ${
                    styles.textAlign === align ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                  }`}
                  title={`Align ${align}`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );

    const ColorPanel = (
      <div className="space-y-3">
        <div>
          <FieldLabel>Text Color</FieldLabel>
          <Swatches
            colors={[...COLOR_PALETTES.brand, ...COLOR_PALETTES.neutral]}
            value={styles.color}
            onPick={(c) => setStyle('color', c)}
          />
        </div>
        <div>
          <FieldLabel>Background</FieldLabel>
          <Swatches
            colors={[...COLOR_PALETTES.neutral, ...COLOR_PALETTES.vibrant]}
            value={styles.backgroundColor}
            onPick={(c) => setStyle('backgroundColor', c)}
          />
        </div>
      </div>
    );

    const SpacingPanel = (
      <div className="space-y-2">
        <div>
          <FieldLabel hint="CSS syntax ok (e.g. 2rem 1rem)">Padding</FieldLabel>
          <input
            className="w-full border rounded p-2 text-sm"
            value={styles.padding ?? ''}
            onChange={(e) => setStyle('padding', e.target.value)}
            placeholder="e.g. 2rem 1rem"
          />
        </div>
        <div>
          <FieldLabel>Border Radius</FieldLabel>
          <Slider value={number(styles.borderRadius, 0)} min={0} max={48} onChange={(v) => setStyle('borderRadius', v)} suffix="px" />
        </div>
        <div>
          <FieldLabel>Opacity</FieldLabel>
          <Slider value={number(styles.opacity ?? 1, 1)} min={0} max={1} step={0.01} onChange={(v) => setStyle('opacity', v)} />
        </div>
      </div>
    );

    // Block-specific sections
    const HeroPanel =
      selectedBlock.type === BLOCK_TYPES.HERO ? (
        <div className="space-y-2">
          <FieldLabel>Background Image</FieldLabel>
          <FileUploadArea onFileUpload={handleHeroBackgroundUpload}>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-blue-400 transition-colors cursor-pointer">
              {selectedBlock.content?.backgroundImage ? (
                <img
                  src={selectedBlock.content.backgroundImage}
                  alt="Background"
                  className="w-full h-20 object-cover rounded"
                />
              ) : (
                <>
                  <Upload className="mx-auto h-6 w-6 text-gray-400" />
                  <p className="text-xs text-gray-600 mt-1">Upload background</p>
                </>
              )}
            </div>
          </FileUploadArea>

          <FieldLabel>Overlay Opacity</FieldLabel>
          <Slider
            value={number(selectedBlock.content?.overlayOpacity ?? 0.4, 0.4)}
            min={0}
            max={0.9}
            step={0.01}
            onChange={(v) => setContent({ overlayOpacity: v })}
          />
          <div>
            <FieldLabel>Min Height</FieldLabel>
            <input
              className="w-full border rounded p-2 text-sm"
              value={styles.minHeight ?? '60vh'}
              onChange={(e) => setStyle('minHeight', e.target.value)}
            />
          </div>
        </div>
      ) : null;

    const SocialPanel =
      selectedBlock.type === BLOCK_TYPES.SOCIAL_POST || selectedBlock.type === BLOCK_TYPES.SOCIAL_STORY ? (
        <div className="space-y-2">
          <FieldLabel>Media</FieldLabel>
          <FileUploadArea onFileUpload={handleSocialMediaUpload}>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <Upload className="mx-auto h-6 w-6 text-gray-400" />
              <p className="text-xs text-gray-600 mt-1">Upload image or video</p>
            </div>
          </FileUploadArea>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Username</FieldLabel>
              <input
                className="w-full border rounded p-2 text-sm"
                value={selectedBlock.content?.username ?? ''}
                onChange={(e) => setContent({ username: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Location</FieldLabel>
              <input
                className="w-full border rounded p-2 text-sm"
                value={selectedBlock.content?.location ?? ''}
                onChange={(e) => setContent({ location: e.target.value })}
              />
            </div>
          </div>
          {selectedBlock.type === BLOCK_TYPES.SOCIAL_POST ? (
            <>
              <FieldLabel>Caption</FieldLabel>
              <textarea
                className="w-full border rounded p-2 text-sm"
                rows={2}
                value={selectedBlock.content?.caption ?? ''}
                onChange={(e) => setContent({ caption: e.target.value })}
              />
              <FieldLabel>Hashtags</FieldLabel>
              <input
                className="w-full border rounded p-2 text-sm"
                value={selectedBlock.content?.hashtags ?? ''}
                onChange={(e) => setContent({ hashtags: e.target.value })}
              />
            </>
          ) : (
            <>
              <FieldLabel>Story Text</FieldLabel>
              <textarea
                className="w-full border rounded p-2 text-sm"
                rows={2}
                value={selectedBlock.content?.storyText ?? ''}
                onChange={(e) => setContent({ storyText: e.target.value })}
              />
            </>
          )}
        </div>
      ) : null;

    const MockupPanel =
      selectedBlock.type === BLOCK_TYPES.WEBSITE_DESKTOP ||
      selectedBlock.type === BLOCK_TYPES.WEBSITE_MOBILE ||
      selectedBlock.type === BLOCK_TYPES.APP_MOBILE ||
      selectedBlock.type === BLOCK_TYPES.APP_DESKTOP ? (
        <div className="space-y-2">
          <FieldLabel>Screenshot</FieldLabel>
          <FileUploadArea onFileUpload={handleMockupUpload}>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <Upload className="mx-auto h-6 w-6 text-gray-400" />
              <p className="text-xs text-gray-600 mt-1">Upload screenshot</p>
            </div>
          </FileUploadArea>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Title</FieldLabel>
              <input
                className="w-full border rounded p-2 text-sm"
                value={selectedBlock.content?.title ?? ''}
                onChange={(e) => setContent({ title: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>URL / Platform</FieldLabel>
              <input
                className="w-full border rounded p-2 text-sm"
                value={selectedBlock.content?.url ?? selectedBlock.content?.platform ?? ''}
                onChange={(e) => setContent({ url: e.target.value, platform: e.target.value })}
                placeholder="myproject.com or iOS • Android"
              />
            </div>
          </div>
          <FieldLabel>Description</FieldLabel>
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={2}
            value={selectedBlock.content?.description ?? ''}
            onChange={(e) => setContent({ description: e.target.value })}
          />
          <FieldLabel>Technologies (comma-sep)</FieldLabel>
          <input
            className="w-full border rounded p-2 text-sm"
            value={selectedBlock.content?.technologies ?? ''}
            onChange={(e) => setContent({ technologies: e.target.value })}
          />
        </div>
      ) : null;

    // Print blocks hint
    const PrintHint =
      selectedBlock.type?.startsWith('print_') ? (
        <div className="p-3 rounded border bg-amber-50 border-amber-200 text-amber-800 text-xs">
          Upload PDFs inside the block card to show realistic print previews (trifold, catalog, book, poster).
        </div>
      ) : null;

    return (
      <div className="w-72 bg-white border-l border-gray-200 h-full p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Block Settings</h3>
          <Settings className="h-4 w-4 text-gray-400" />
        </div>

        <div className="space-y-6">
          {/* Block Summary */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-800 capitalize">{selectedBlock.type} block</p>
            <p className="text-xs text-blue-700">Edit content in‐place; style here.</p>
          </div>

          {/* Block-specific */}
          {HeroPanel}
          {SocialPanel}
          {MockupPanel}
          {PrintHint}

          {/* Generic sections */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
              <Type className="h-4 w-4" /> <span>Typography</span>
            </div>
            {TypographyPanel}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
              <Palette className="h-4 w-4" /> <span>Color</span>
            </div>
            {ColorPanel}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
              <Layout className="h-4 w-4" /> <span>Spacing & Effects</span>
            </div>
            {SpacingPanel}
          </div>

          {/* Alignment quick-buttons for texty blocks */}
          {(selectedBlock.type === BLOCK_TYPES.TEXT ||
            selectedBlock.type === BLOCK_TYPES.HEADING ||
            selectedBlock.type === BLOCK_TYPES.QUOTE) && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                <AlignCenter className="h-4 w-4" /> <span>Quick Align</span>
              </div>
              <div className="flex gap-1">
                {(['left', 'center', 'right'] as const).map((align) => {
                  const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
                  return (
                    <button
                      key={align}
                      onClick={() => setStyle('textAlign', align)}
                      className={`flex-1 p-2 rounded border ${
                        styles.textAlign === align ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                      }`}
                      title={`Align ${align}`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Tips</h4>
          <ul className="space-y-1 text-xs text-blue-700 list-disc list-inside">
            <li>Edit text by clicking the pencil on a block.</li>
            <li>Use ↑↓ on blocks to reorder quickly.</li>
            <li>Drag images or PDFs onto blocks to upload.</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 md:py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <h1 className="text-lg md:text-xl font-bold text-gray-900">PortfolioForge</h1>
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`px-3 py-2 md:px-4 rounded flex items-center gap-2 text-sm touch-manipulation ${
                isPreviewMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
              }`}
            >
              <Eye className="h-4 w-4" />
              {isPreviewMode ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={saveTemplate}
              className="px-3 py-2 md:px-4 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 text-sm touch-manipulation"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {!isMobile && !isPreviewMode && <DesktopBlockLibrary onAddBlock={addBlock} />}

        <div className="flex-1 overflow-y-auto">
          <div className={`mx-auto ${isMobile ? 'px-4 py-4' : 'max-w-5xl px-8 py-8'}`}>
            <div className="bg-white rounded-lg shadow-sm min-h-screen overflow-hidden">
              {blocks.map((block, index) => (
                <Block
                  key={block.id}
                  block={block}
                  isSelected={!isPreviewMode && selectedBlockId === block.id}
                  onSelect={setSelectedBlockId}
                  onUpdate={updateBlock}
                  onDelete={deleteBlock}
                  onDuplicate={duplicateBlock}
                  uploadFile={uploadFile}
                  onMoveUp={() => moveBlock(block.id, 'up')}
                  onMoveDown={() => moveBlock(block.id, 'down')}
                  canMoveUp={index > 0}
                  canMoveDown={index < blocks.length - 1}
                />
              ))}

              {blocks.length === 0 && (
                <div className="text-center py-16 px-8">
                  <div className="mx-auto max-w-md">
                    <Grid className="mx-auto h-20 w-20 text-gray-300 mb-6" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Start Building Your Portfolio</h3>
                    <p className="text-gray-500 mb-6 leading-relaxed">
                      Create stunning content by adding blocks from the sidebar. Get started with text, images, and more.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {!isMobile && !isPreviewMode && (
          <EnhancedPropertiesPanel
            selectedBlock={selectedBlock}
            onUpdateBlock={updateBlock}
            uploadFile={uploadFile}
          />
        )}
      </div>
    </div>
  );
};
// ---------------------------------------------
// EnhancedPropertiesPanel (drop-in, self-contained)
// ---------------------------------------------
import React from 'react'
import {
  AlignLeft, AlignCenter, AlignRight, Layout, Palette, Settings, Square, Type, Upload
} from 'lucide-react'

// Safe defaults in case your editor doesn't define these yet
const COLOR_PALETTES = {
  brand: ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
  neutral: ['#111827', '#374151', '#6b7280', '#d1d5db', '#f3f4f6', '#ffffff'],
  vibrant: ['#06b6d4', '#16a34a', '#f97316', '#e11d48', '#a855f7']
}
const FONT_FAMILIES = [
  { label: 'System UI', value: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' },
  { label: 'Serif', value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
  { label: 'Mono', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' }
]
const FONT_WEIGHTS = [
  { label: 'Light (300)', value: '300' },
  { label: 'Regular (400)', value: '400' },
  { label: 'Medium (500)', value: '500' },
  { label: 'Semibold (600)', value: '600' },
  { label: 'Bold (700)', value: '700' }
]

// Tiny dropzone helper (works with clicks & drag-drop)
const FileUploadArea: React.FC<{ onFileUpload: (file: File) => void; accept?: string }> = ({ onFileUpload, accept, children }) => {
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) onFileUpload(f)
  }
  return (
    <label
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="block cursor-pointer"
    >
      <input type="file" className="hidden" accept={accept} onChange={(e) => {
        const f = e.target.files?.[0]; if (f) onFileUpload(f)
      }} />
      {children}
    </label>
  )
}

type AnyBlock = {
  id: string
  type: string
  styles?: Record<string, any>
  content?: Record<string, any>
}

export const EnhancedPropertiesPanel: React.FC<{
  selectedBlock: AnyBlock | null
  onUpdateBlock: (id: string, patch: Partial<AnyBlock>) => void
  uploadFile: (file: File) => Promise<{ url: string; name: string }>
}> = ({ selectedBlock, onUpdateBlock, uploadFile }) => {
  if (!selectedBlock) {
    return (
      <aside className="w-72 bg-white border-l border-gray-200 h-full p-4">
        <h3 className="text-lg font-semibold mb-4">Block Settings</h3>
        <div className="text-center text-gray-500 mt-8">
          <Square className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p>Select a block to edit its settings</p>
        </div>
      </aside>
    )
  }

  const styles = selectedBlock.styles ?? {}
  const content = selectedBlock.content ?? {}

  const setStyle = (key: string, value: any) =>
    onUpdateBlock(selectedBlock.id, { styles: { ...styles, [key]: value } })

  const setContent = (patch: Record<string, any>) =>
    onUpdateBlock(selectedBlock.id, { content: { ...content, ...patch } })

  const number = (v: any, fallback = 0) => (typeof v === 'number' ? v : parseFloat(v) || fallback)

  // Upload handlers
  const handleHeroBG = async (file: File) => {
    const up = await uploadFile(file)
    setContent({ backgroundImage: up.url })
  }
  const handleMockupShot = async (file: File) => {
    const up = await uploadFile(file)
    setContent({ screenshot: up.url })
  }
  const handleSocialMedia = async (file: File) => {
    const up = await uploadFile(file)
    setContent({ mediaUrl: up.url, mediaType: file.type.startsWith('video/') ? 'video' : 'image' })
  }

  // Little UI atoms
  const Field: React.FC<React.PropsWithChildren<{ title: string }>> = ({ title, children }) => (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{title}</label>
      {children}
    </div>
  )
  const Swatches: React.FC<{ value?: string; onPick: (c: string) => void; colors: string[] }> = ({ value, onPick, colors }) => (
    <div className="grid grid-cols-8 gap-1">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          title={c}
          className={`h-6 w-6 rounded border ${value === c ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
  const Slider: React.FC<{ value: number; min: number; max: number; step?: number; onChange: (n: number) => void; suffix?: string }> =
    ({ value, min, max, step = 1, onChange, suffix }) => (
      <div className="flex items-center gap-2">
        <input type="range" min={min} max={max} step={step} value={value}
               onChange={(e) => onChange(parseFloat(e.target.value))}
               className="flex-1" />
        <span className="w-12 text-right text-xs text-gray-600">{Math.round(value * 100) / 100}{suffix}</span>
      </div>
  )

  // Block-aware extras (use your block type strings)
  const type = (selectedBlock.type || '').toLowerCase()
  const isTexty = ['text', 'heading', 'quote'].includes(type)
  const isHero = type === 'hero'
  const isSocial = type === 'social_post' || type === 'social_story'
  const isMockup = ['website_desktop','website_mobile','app_mobile','app_desktop'].includes(type)
  const isPrint = type.startsWith?.('print_') ?? false

  return (
    <aside className="w-72 bg-white border-l border-gray-200 h-full p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Block Settings</h3>
        <Settings className="h-4 w-4 text-gray-400" />
      </div>

      {/* Block peek */}
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-6">
        <p className="text-sm font-medium text-blue-800 capitalize">{selectedBlock.type} block</p>
        <p className="text-xs text-blue-700">Edit content in-place; style here.</p>
      </div>

      {/* Block-specific panels */}
      {isHero && (
        <div className="space-y-3 mb-6">
          <Field title="Background Image">
            <FileUploadArea onFileUpload={handleHeroBG} accept="image/*">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-blue-400 transition-colors">
                {content.backgroundImage
                  ? <img src={content.backgroundImage} alt="Background" className="w-full h-20 object-cover rounded" />
                  : (<>
                      <Upload className="mx-auto h-6 w-6 text-gray-400" />
                      <p className="text-xs text-gray-600 mt-1">Upload background</p>
                    </>)
                }
              </div>
            </FileUploadArea>
          </Field>
          <Field title="Overlay Opacity">
            <Slider value={number(content.overlayOpacity ?? 0.4, 0.4)} min={0} max={0.9} step={0.01}
                    onChange={(v) => setContent({ overlayOpacity: v })} />
          </Field>
          <Field title="Min Height">
            <input className="w-full border rounded p-2 text-sm"
                   value={styles.minHeight ?? '60vh'} onChange={(e) => setStyle('minHeight', e.target.value)} />
          </Field>
        </div>
      )}

      {isSocial && (
        <div className="space-y-3 mb-6">
          <Field title="Media">
            <FileUploadArea onFileUpload={handleSocialMedia} accept="image/*,video/*">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-blue-400 transition-colors">
                <Upload className="mx-auto h-6 w-6 text-gray-400" />
                <p className="text-xs text-gray-600 mt-1">Upload image or video</p>
              </div>
            </FileUploadArea>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field title="Username">
              <input className="w-full border rounded p-2 text-sm"
                     value={content.username ?? ''} onChange={(e) => setContent({ username: e.target.value })} />
            </Field>
            <Field title="Location">
              <input className="w-full border rounded p-2 text-sm"
                     value={content.location ?? ''} onChange={(e) => setContent({ location: e.target.value })} />
            </Field>
          </div>
          {type === 'social_post' ? (
            <>
              <Field title="Caption">
                <textarea className="w-full border rounded p-2 text-sm" rows={2}
                          value={content.caption ?? ''} onChange={(e) => setContent({ caption: e.target.value })} />
              </Field>
              <Field title="Hashtags">
                <input className="w-full border rounded p-2 text-sm"
                       value={content.hashtags ?? ''} onChange={(e) => setContent({ hashtags: e.target.value })} />
              </Field>
            </>
          ) : (
            <Field title="Story Text">
              <textarea className="w-full border rounded p-2 text-sm" rows={2}
                        value={content.storyText ?? ''} onChange={(e) => setContent({ storyText: e.target.value })} />
            </Field>
          )}
        </div>
      )}

      {isMockup && (
        <div className="space-y-3 mb-6">
          <Field title="Screenshot">
            <FileUploadArea onFileUpload={handleMockupShot} accept="image/*">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-blue-400 transition-colors">
                <Upload className="mx-auto h-6 w-6 text-gray-400" />
                <p className="text-xs text-gray-600 mt-1">Upload screenshot</p>
              </div>
            </FileUploadArea>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field title="Title">
              <input className="w-full border rounded p-2 text-sm"
                     value={content.title ?? ''} onChange={(e) => setContent({ title: e.target.value })} />
            </Field>
            <Field title="URL / Platform">
              <input className="w-full border rounded p-2 text-sm"
                     value={content.url ?? content.platform ?? ''}
                     onChange={(e) => setContent({ url: e.target.value, platform: e.target.value })} />
            </Field>
          </div>
          <Field title="Description">
            <textarea className="w-full border rounded p-2 text-sm" rows={2}
                      value={content.description ?? ''} onChange={(e) => setContent({ description: e.target.value })} />
          </Field>
          <Field title="Technologies (comma-sep)">
            <input className="w-full border rounded p-2 text-sm"
                   value={content.technologies ?? ''} onChange={(e) => setContent({ technologies: e.target.value })} />
          </Field>
        </div>
      )}

      {isPrint && (
        <div className="p-3 rounded border bg-amber-50 border-amber-200 text-amber-800 text-xs mb-6">
          Upload PDFs inside the block card to show realistic print previews (trifold, catalog, book, poster).
        </div>
      )}

      {/* Generic sections */}
      <section className="space-y-4 mb-6">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Type className="h-4 w-4" /> <span>Typography</span>
        </div>
        <Field title="Font Family">
          <select
            className="w-full border rounded p-2 text-sm"
            value={styles.fontFamily ?? FONT_FAMILIES[0].value}
            onChange={(e) => setStyle('fontFamily', e.target.value)}
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field title="Size">
            <input className="w-full border rounded p-2 text-sm" type="text"
                   value={styles.fontSize ?? '1rem'} onChange={(e) => setStyle('fontSize', e.target.value)}
                   placeholder="e.g. 1rem, 18px" />
          </Field>
          <Field title="Weight">
            <select className="w-full border rounded p-2 text-sm"
                    value={styles.fontWeight ?? '400'}
                    onChange={(e) => setStyle('fontWeight', e.target.value)}>
              {FONT_WEIGHTS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
          </Field>
        </div>
        {isTexty && (
          <Field title="Align">
            <div className="flex gap-1">
              {(['left','center','right'] as const).map((a) => {
                const Icon = a === 'left' ? AlignLeft : a === 'center' ? AlignCenter : AlignRight
                return (
                  <button key={a}
                    onClick={() => setStyle('textAlign', a)}
                    className={`flex-1 p-2 rounded border ${styles.textAlign === a ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}`}
                    title={`Align ${a}`}>
                    <Icon className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          </Field>
        )}
      </section>

      <section className="space-y-4 mb-6">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Palette className="h-4 w-4" /> <span>Color</span>
        </div>
        <Field title="Text Color">
          <Swatches value={styles.color} onPick={(c) => setStyle('color', c)}
                    colors={[...COLOR_PALETTES.brand, ...COLOR_PALETTES.neutral]} />
        </Field>
        <Field title="Background">
          <Swatches value={styles.backgroundColor} onPick={(c) => setStyle('backgroundColor', c)}
                    colors={[...COLOR_PALETTES.neutral, ...COLOR_PALETTES.vibrant]} />
        </Field>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Layout className="h-4 w-4" /> <span>Spacing & Effects</span>
        </div>
        <Field title="Padding (CSS)">
          <input className="w-full border rounded p-2 text-sm"
                 value={styles.padding ?? ''} onChange={(e) => setStyle('padding', e.target.value)}
                 placeholder="e.g. 2rem 1rem" />
        </Field>
        <Field title="Border Radius">
          <Slider value={number(styles.borderRadius, 0)} min={0} max={48}
                  onChange={(v) => setStyle('borderRadius', v)} suffix="px" />
        </Field>
        <Field title="Opacity">
          <Slider value={number(styles.opacity ?? 1, 1)} min={0} max={1} step={0.01}
                  onChange={(v) => setStyle('opacity', v)} />
        </Field>
      </section>

      <div className="mt-8 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Tips</h4>
        <ul className="space-y-1 text-xs text-blue-700 list-disc list-inside">
          <li>Edit text by clicking the pencil on a block.</li>
          <li>Use ↑↓ on blocks to reorder quickly.</li>
          <li>Drag images or PDFs onto blocks to upload.</li>
        </ul>
      </div>
    </aside>
  )
}

export default PortfolioEditor;
