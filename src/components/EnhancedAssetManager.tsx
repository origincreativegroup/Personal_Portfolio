import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Check, X, ArrowLeft, MoreVertical, Grid, List, Filter, Search,
  Move, Copy, Trash2, Tag, Star, Download, Upload, Share2,
  Folder, FolderPlus, Image, FileText, Video, Music,
  CheckSquare, Square, Minus, Plus, Settings, Edit2,
  ChevronDown, ChevronRight, AlertTriangle, RotateCcw,
  Calendar, User, Palette, Eye, EyeOff, Lock, Unlock,
  Crown, ImageIcon
} from 'lucide-react';
import type { ProjectAsset } from '../intake/schema';

type AssetCategory = 'image' | 'video' | 'audio' | 'document' | 'other';
type SortOption = 'recent' | 'name' | 'size' | 'type';
type ViewMode = 'grid' | 'list';
type ActiveModal = 'move' | 'copy' | 'tag' | 'edit' | 'delete' | 'heroSelect' | null;

interface EnhancedAsset extends ProjectAsset {
  category: AssetCategory;
  tags: string[];
  featured: boolean;
  visibility: 'public' | 'private';
  folder: string | null;
  isHero?: boolean;
}

interface BulkEditData {
  tags: string;
  featured: boolean | null;
  visibility: 'public' | 'private' | '';
}

interface Props {
  assets: ProjectAsset[];
  heroAssetId?: string | null;
  onAssetUpdate: (assetId: string, updates: Partial<ProjectAsset>) => void;
  onAssetRemove: (assetId: string) => void;
  onAssetReorder?: (assetId: string, direction: 'up' | 'down') => void;
  onHeroSelect?: (assetId: string | null) => void;
  onAssetUpload?: (files: FileList) => void;
  isDarkMode?: boolean;
}

const CATEGORY_ICONS: Record<AssetCategory, React.ComponentType<any>> = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  other: FileText,
};

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
};

const categorizeAsset = (asset: ProjectAsset): AssetCategory => {
  const mime = asset.mimeType?.toLowerCase() ?? '';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.includes('pdf') || mime.includes('word') || mime.includes('text') ||
      mime.includes('presentation') || mime.includes('sheet')) return 'document';
  return 'other';
};

export default function EnhancedAssetManager({
  assets = [],
  heroAssetId,
  onAssetUpdate,
  onAssetRemove,
  onAssetReorder,
  onHeroSelect,
  onAssetUpload,
  isDarkMode = false
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showProgress, setShowProgress] = useState(false);
  const [operationProgress, setOperationProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');

  const [bulkEditData, setBulkEditData] = useState<BulkEditData>({
    tags: '',
    featured: null,
    visibility: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [moveToFolder, setMoveToFolder] = useState('');
  const [newFolder, setNewFolder] = useState('');

  const assetInputRef = useRef<HTMLInputElement | null>(null);

  // Enhanced assets with metadata
  const enhancedAssets = useMemo<EnhancedAsset[]>(() => {
    return assets.map(asset => ({
      ...asset,
      category: categorizeAsset(asset),
      tags: [], // This could be extended to support tags
      featured: false, // This could be extended
      visibility: 'public' as const,
      folder: null, // This could be extended
      isHero: asset.id === heroAssetId,
    }));
  }, [assets, heroAssetId]);

  // All available tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    enhancedAssets.forEach(asset => {
      asset.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [enhancedAssets]);

  // Filtered and sorted assets
  const filteredAssets = useMemo(() => {
    let filtered = enhancedAssets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTags = filterTags.length === 0 ||
                         filterTags.every(tag => asset.tags.includes(tag));
      return matchesSearch && matchesTags;
    });

    // Sort assets
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'type':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'recent':
        default:
          comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [enhancedAssets, searchQuery, filterTags, sortBy, sortOrder]);

  // Event handlers
  const handleAssetSelect = (assetId: string) => {
    setSelectedAssets(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAssets.length === filteredAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(filteredAssets.map(asset => asset.id));
    }
  };

  const handleSelectNone = () => {
    setSelectedAssets([]);
    setSelectMode(false);
  };

  const simulateOperation = async (operationName: string) => {
    setCurrentOperation(operationName);
    setShowProgress(true);
    setOperationProgress(0);

    for (let i = 0; i <= 100; i += 10) {
      setOperationProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setTimeout(() => {
      setShowProgress(false);
      setCurrentOperation('');
      setActiveModal(null);
      setSelectedAssets([]);
    }, 1000);
  };

  const handleBulkDelete = async () => {
    for (const assetId of selectedAssets) {
      onAssetRemove(assetId);
    }
    await simulateOperation(`Deleting ${selectedAssets.length} assets`);
  };

  const handleBulkEdit = async () => {
    // Implementation would update asset metadata
    await simulateOperation(`Updating ${selectedAssets.length} assets`);
  };

  const handleHeroSelect = (assetId: string) => {
    if (onHeroSelect) {
      // Only allow images to be set as hero
      const asset = enhancedAssets.find(a => a.id === assetId);
      if (asset && asset.category === 'image') {
        onHeroSelect(assetId === heroAssetId ? null : assetId);
      }
    }
    setActiveModal(null);
  };

  const BulkActionBar = () => (
    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border rounded-xl shadow-lg px-6 py-4`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">{selectedAssets.length} selected</span>
          <button
            onClick={handleSelectNone}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={16} />
          </button>
        </div>

        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>

        <div className="flex items-center gap-2">
          {selectedAssets.some(id => {
            const asset = enhancedAssets.find(a => a.id === id);
            return asset && asset.category === 'image';
          }) && (
            <button
              onClick={() => setActiveModal('heroSelect')}
              className={`px-3 py-2 rounded-lg border transition-colors ${
                isDarkMode
                  ? 'border-gray-700 hover:bg-gray-700'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Crown size={16} className="inline mr-1" />
              Set Hero
            </button>
          )}

          <button
            onClick={() => setActiveModal('edit')}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              isDarkMode
                ? 'border-gray-700 hover:bg-gray-700'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Edit2 size={16} className="inline mr-1" />
            Edit
          </button>

          <button
            onClick={() => setActiveModal('delete')}
            className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Trash2 size={16} className="inline mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {filteredAssets.map((asset) => {
        const IconComponent = CATEGORY_ICONS[asset.category];
        const isSelected = selectedAssets.includes(asset.id);

        return (
          <div
            key={asset.id}
            className={`relative rounded-xl border p-4 cursor-pointer transition-all ${
              isSelected
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-950 ring-2 ring-purple-200 dark:ring-purple-800'
                : isDarkMode
                  ? 'border-gray-700 bg-gray-800 hover:bg-gray-750'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
            onClick={() => selectMode ? handleAssetSelect(asset.id) : null}
          >
            {/* Hero indicator */}
            {asset.isHero && (
              <div className="absolute top-2 right-2 z-10">
                <div className="bg-yellow-500 text-white rounded-full p-1">
                  <Crown size={12} />
                </div>
              </div>
            )}

            {/* Selection Checkbox */}
            {selectMode && (
              <div className="absolute top-2 left-2 z-10">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  isSelected
                    ? 'bg-purple-600 border-purple-600'
                    : 'border-gray-400 bg-white dark:bg-gray-800'
                }`}>
                  {isSelected && <Check size={12} className="text-white" />}
                </div>
              </div>
            )}

            {/* Asset Preview */}
            <div className={`w-full h-24 rounded-lg flex items-center justify-center mb-3 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              {asset.category === 'image' ? (
                <img
                  src={asset.dataUrl}
                  alt={asset.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : asset.category === 'video' ? (
                asset.thumbnailUrl ? (
                  <div className="relative w-full h-full">
                    <img
                      src={asset.thumbnailUrl}
                      alt={`${asset.name} thumbnail`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black bg-opacity-50 rounded-full p-2">
                        <Video size={16} className="text-white" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <IconComponent size={24} className="text-gray-500" />
                )
              ) : (
                <IconComponent size={24} className="text-gray-500" />
              )}
            </div>

            {/* Asset Info */}
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <p className="font-medium text-sm truncate flex-1">{asset.name}</p>
                {asset.featured && (
                  <Star size={12} className="text-yellow-500 ml-1 flex-shrink-0" />
                )}
              </div>

              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {formatBytes(asset.size)}
              </p>

              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  {asset.category}
                </span>
                <div className="flex items-center gap-1">
                  {asset.visibility === 'public' ? (
                    <Eye size={10} className="text-green-500" />
                  ) : (
                    <EyeOff size={10} className="text-gray-500" />
                  )}
                </div>
              </div>

              {asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {asset.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className={`px-1 py-0.5 text-xs rounded ${
                        isDarkMode
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                  {asset.tags.length > 2 && (
                    <span className={`px-1 py-0.5 text-xs rounded ${
                      isDarkMode
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      +{asset.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={`enhanced-asset-manager transition-colors duration-200 ${
      isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`border-b ${
        isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Asset Management</h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {filteredAssets.length} assets • {selectedAssets.length} selected
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectMode(!selectMode)}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  selectMode
                    ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300'
                    : isDarkMode
                      ? 'border-gray-700 hover:bg-gray-800'
                      : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {selectMode ? 'Exit Select' : 'Select Mode'}
              </button>

              <button
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                onClick={() => assetInputRef.current?.click()}
              >
                <Upload size={16} />
                Upload Assets
              </button>

              <input
                ref={assetInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && onAssetUpload) {
                    onAssetUpload(e.target.files);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>

          {/* Search and Controls */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={20} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isDarkMode
                    ? 'border-gray-700 bg-gray-800 focus:border-purple-500'
                    : 'border-gray-200 bg-white focus:border-purple-500'
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              {selectMode && (
                <button
                  onClick={handleSelectAll}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'border-gray-700 hover:bg-gray-800'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {selectedAssets.length === filteredAssets.length ? (
                    <>
                      <Minus size={16} className="inline mr-1" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <CheckSquare size={16} className="inline mr-1" />
                      Select All
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Grid size={16} />
                </button>

                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {filteredAssets.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No assets found</p>
            <p>Upload some assets to get started</p>
          </div>
        ) : (
          renderGridView()
        )}
      </main>

      {/* Bulk Action Bar */}
      {selectedAssets.length > 0 && <BulkActionBar />}

      {/* Progress Modal */}
      {showProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className={`w-full max-w-md rounded-xl p-6 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">{currentOperation}</h3>

              <div className={`w-full h-2 rounded-full mb-4 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-300"
                  style={{ width: `${operationProgress}%` }}
                />
              </div>

              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {operationProgress}% complete
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Selection Modal */}
      {activeModal === 'heroSelect' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className={`w-full max-w-md rounded-xl p-6 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Hero Image</h3>
              <button onClick={() => setActiveModal(null)}>
                <X size={20} />
              </button>
            </div>

            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Choose an image to be the hero image for this project. Only images can be set as hero.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedAssets
                .map(id => enhancedAssets.find(a => a.id === id))
                .filter(asset => asset && asset.category === 'image')
                .map(asset => asset && (
                  <button
                    key={asset.id}
                    onClick={() => handleHeroSelect(asset.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      isDarkMode
                        ? 'border-gray-700 hover:bg-gray-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={asset.dataUrl}
                        alt={asset.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatBytes(asset.size)}
                        </p>
                      </div>
                      {asset.isHero && (
                        <Crown size={16} className="text-yellow-500 ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setActiveModal(null)}
                className={`flex-1 py-3 rounded-xl font-medium border transition-colors ${
                  isDarkMode
                    ? 'border-gray-700 hover:bg-gray-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {activeModal === 'delete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className={`w-full max-w-md rounded-xl p-6 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Delete Assets</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Are you sure you want to delete {selectedAssets.length} selected assets?
              This will permanently remove them from the project.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className={`flex-1 py-3 rounded-xl font-medium border transition-colors ${
                  isDarkMode
                    ? 'border-gray-700 hover:bg-gray-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>

              <button
                onClick={handleBulkDelete}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Delete Assets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}