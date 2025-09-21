import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Check, X, ArrowLeft, MoreVertical, Grid, List, Filter, Search,
  Move, Copy, Trash2, Tag, Star, Download, Upload, Share2,
  Folder, FolderPlus, Image, FileText, Video, Music,
  CheckSquare, Square, Minus, Plus, Settings, Edit2,
  ChevronDown, ChevronRight, AlertTriangle, RotateCcw,
  Calendar, User, Palette, Eye, EyeOff, Lock, Unlock,
  Crown, ImageIcon, Play, Pause, ZoomIn, MoreHorizontal,
  Info, ExternalLink, RefreshCw
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
  const [previewAsset, setPreviewAsset] = useState<EnhancedAsset | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const assetInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't trigger shortcuts when typing in inputs
      }

      // Cmd/Ctrl + A - Select all
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        if (!selectMode) setSelectMode(true);
        setSelectedAssets(filteredAssets.map(asset => asset.id));
      }

      // Escape - Clear selection or close modals
      if (e.key === 'Escape') {
        if (previewAsset) {
          setPreviewAsset(null);
        } else if (activeModal) {
          setActiveModal(null);
        } else if (selectMode) {
          setSelectMode(false);
          setSelectedAssets([]);
        }
      }

      // Cmd/Ctrl + U - Upload files
      if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
        e.preventDefault();
        assetInputRef.current?.click();
      }

      // Delete key - Delete selected assets
      if (e.key === 'Delete' && selectedAssets.length > 0) {
        setActiveModal('delete');
      }

      // S key - Toggle select mode
      if (e.key === 's' && !e.metaKey && !e.ctrlKey) {
        setSelectMode(!selectMode);
      }

      // G key - Toggle grid/list view
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        setViewMode(viewMode === 'grid' ? 'list' : 'grid');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectMode, selectedAssets, previewAsset, activeModal, viewMode]);

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

  // Enhanced drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if leaving the drop zone completely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && onAssetUpload) {
      handleUploadFiles(files);
    }
  }, [onAssetUpload]);

  // Enhanced upload with progress simulation
  const handleUploadFiles = async (files: FileList) => {
    if (!onAssetUpload) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 100);

    try {
      await onAssetUpload(files);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
      setUploadProgress(0);
    }

    clearInterval(progressInterval);
  };

  // Quick actions
  const handleQuickPreview = (asset: EnhancedAsset) => {
    setPreviewAsset(asset);
  };

  const getFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {filteredAssets.map((asset) => {
        const IconComponent = CATEGORY_ICONS[asset.category];
        const isSelected = selectedAssets.includes(asset.id);

        return (
          <div
            key={asset.id}
            className={`group relative rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
              isSelected
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-950 ring-2 ring-purple-200 dark:ring-purple-800 shadow-lg'
                : isDarkMode
                  ? 'border-gray-700 bg-gray-800 hover:bg-gray-750 hover:border-gray-600 hover:shadow-md'
                  : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
            } ${!selectMode ? 'hover:scale-[1.02]' : ''}`}
            onClick={() => selectMode ? handleAssetSelect(asset.id) : handleQuickPreview(asset)}
          >
            {/* Hero indicator */}
            {asset.isHero && (
              <div className="absolute top-3 right-3 z-20">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full p-1.5 shadow-lg">
                  <Crown size={14} />
                </div>
              </div>
            )}

            {/* Selection Checkbox */}
            {selectMode && (
              <div className="absolute top-3 left-3 z-20">
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-purple-600 border-purple-600 shadow-md'
                    : 'border-gray-400 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm'
                }`}>
                  {isSelected && <Check size={14} className="text-white" />}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {!selectMode && (
              <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickPreview(asset);
                    }}
                    className="p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-md shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  >
                    <ZoomIn size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle download
                    }}
                    className="p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-md shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  >
                    <Download size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Enhanced Asset Preview */}
            <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg overflow-hidden mb-3">
              {asset.category === 'image' ? (
                <img
                  src={asset.dataUrl}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
              ) : asset.category === 'video' ? (
                asset.thumbnailUrl ? (
                  <div className="relative w-full h-full">
                    <img
                      src={asset.thumbnailUrl}
                      alt={`${asset.name} thumbnail`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/60 backdrop-blur-sm rounded-full p-3 group-hover:scale-110 transition-transform">
                        <Play size={20} className="text-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">Video</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <IconComponent size={32} className="text-gray-400" />
                  </div>
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <IconComponent size={32} className="text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500 uppercase tracking-wide">{asset.category}</span>
                </div>
              )}
            </div>

            {/* Enhanced Asset Info */}
            <div className="p-3 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100" title={asset.name}>
                    {asset.name}
                  </p>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {getFileSize(asset.size)} • {new Date(asset.addedAt).toLocaleDateString()}
                  </p>
                </div>
                {asset.featured && (
                  <Star size={14} className="text-yellow-500 ml-2 flex-shrink-0" />
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium border ${
                    asset.category === 'image'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                      : asset.category === 'video'
                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                        : asset.category === 'audio'
                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                          : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                  }`}>
                    {asset.category}
                  </span>

                  {asset.isHero && (
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800">
                      Hero
                    </span>
                  )}
                </div>

                <div className="flex items-center">
                  {asset.visibility === 'public' ? (
                    <Eye size={12} className="text-green-500" />
                  ) : (
                    <EyeOff size={12} className="text-gray-400" />
                  )}
                </div>
              </div>

              {asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {asset.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className={`px-2 py-1 text-xs rounded-md font-medium ${
                        isDarkMode
                          ? 'bg-gray-700 text-gray-300 border border-gray-600'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      #{tag}
                    </span>
                  ))}
                  {asset.tags.length > 2 && (
                    <span className={`px-2 py-1 text-xs rounded-md font-medium ${
                      isDarkMode
                        ? 'bg-gray-700 text-gray-400 border border-gray-600'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
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
    <div
      ref={dropZoneRef}
      className={`enhanced-asset-manager transition-colors duration-200 ${
        isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      } ${isDragOver ? 'drag-over' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Enhanced Header */}
      <header className={`border-b ${
        isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <ImageIcon size={20} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Asset Library</h2>
                <p className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span>{filteredAssets.length} assets</span>
                  {selectedAssets.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-purple-600 font-medium">{selectedAssets.length} selected</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectMode(!selectMode)}
                className={`px-4 py-2 rounded-lg border transition-all duration-200 font-medium ${
                  selectMode
                    ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 shadow-sm'
                    : isDarkMode
                      ? 'border-gray-700 hover:bg-gray-800 hover:border-gray-600'
                      : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <CheckSquare size={16} className="inline mr-2" />
                {selectMode ? 'Exit Select' : 'Select Mode'}
              </button>

              <div className="relative">
                <button
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  onClick={() => assetInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload Assets
                    </>
                  )}
                </button>

                {isUploading && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={assetInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleUploadFiles(e.target.files);
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

      {/* Drag Over Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-purple-500/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-2 border-dashed border-purple-500 max-w-md mx-4">
            <div className="text-center">
              <Upload size={48} className="mx-auto mb-4 text-purple-600 animate-bounce" />
              <h3 className="text-xl font-semibold mb-2">Drop your files here</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Upload images, videos, audio files, and documents
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-6">
        {filteredAssets.length === 0 ? (
          <div className={`text-center py-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="max-w-md mx-auto">
              <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <ImageIcon size={32} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                {searchQuery || filterTags.length > 0 ? 'No matching assets' : 'No assets yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery || filterTags.length > 0
                  ? 'Try adjusting your search or filters to find what you\'re looking for'
                  : 'Upload images, videos, documents, and other files to build your asset library'
                }
              </p>
              {(!searchQuery && filterTags.length === 0) && (
                <button
                  onClick={() => assetInputRef.current?.click()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Upload size={16} className="inline mr-2" />
                  Upload Your First Asset
                </button>
              )}
            </div>
          </div>
        ) : (
          renderGridView()
        )}
      </main>

      {/* Bulk Action Bar */}
      {selectedAssets.length > 0 && <BulkActionBar />}

      {/* Asset Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  {React.createElement(CATEGORY_ICONS[previewAsset.category], {
                    size: 20,
                    className: 'text-purple-600'
                  })}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{previewAsset.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getFileSize(previewAsset.size)} • {previewAsset.category} • {new Date(previewAsset.addedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previewAsset.category === 'image' && onHeroSelect && (
                  <button
                    onClick={() => {
                      onHeroSelect(previewAsset.isHero ? null : previewAsset.id);
                      setPreviewAsset(null);
                    }}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                      previewAsset.isHero
                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Crown size={16} className="inline mr-1" />
                    {previewAsset.isHero ? 'Remove Hero' : 'Set as Hero'}
                  </button>
                )}
                <button
                  onClick={() => setPreviewAsset(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Preview */}
                <div className="flex-1">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
                    {previewAsset.category === 'image' ? (
                      <img
                        src={previewAsset.dataUrl}
                        alt={previewAsset.name}
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    ) : previewAsset.category === 'video' && previewAsset.thumbnailUrl ? (
                      <div className="relative">
                        <img
                          src={previewAsset.thumbnailUrl}
                          alt={`${previewAsset.name} thumbnail`}
                          className="w-full h-auto max-h-96 object-contain"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/60 backdrop-blur-sm rounded-full p-4">
                            <Play size={32} className="text-white ml-1" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-96 flex flex-col items-center justify-center text-gray-400">
                        {React.createElement(CATEGORY_ICONS[previewAsset.category], { size: 64 })}
                        <p className="mt-4 text-lg font-medium">Preview not available</p>
                        <p className="text-sm">This file type cannot be previewed</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="lg:w-80 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">File Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Size:</span>
                        <span>{getFileSize(previewAsset.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Type:</span>
                        <span className="capitalize">{previewAsset.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Added:</span>
                        <span>{new Date(previewAsset.addedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Visibility:</span>
                        <div className="flex items-center gap-1">
                          {previewAsset.visibility === 'public' ? (
                            <>
                              <Eye size={12} className="text-green-500" />
                              <span>Public</span>
                            </>
                          ) : (
                            <>
                              <EyeOff size={12} className="text-gray-500" />
                              <span>Private</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {previewAsset.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {previewAsset.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs rounded-md font-medium bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-2">
                      <button className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        <Download size={14} className="inline mr-1" />
                        Download
                      </button>
                      <button
                        onClick={() => {
                          if (onAssetRemove) {
                            onAssetRemove(previewAsset.id);
                            setPreviewAsset(null);
                          }
                        }}
                        className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        <Trash2 size={14} className="inline mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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