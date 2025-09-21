import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Search, Filter, Grid, List, Upload, Download,
  FolderOpen, Settings, BarChart3, Trash2, Star,
  ImageIcon, FileText, Video, Music, Archive,
  Plus, RefreshCw, Eye, EyeOff, Crown, Tag
} from 'lucide-react';
import EnhancedAssetManager from '../components/EnhancedAssetManager';
import { Button } from '../components/ui';
import { listProjects, loadProject } from '../utils/storageManager';
import type { ProjectAsset, ProjectMeta } from '../intake/schema';

interface AssetWithProject extends ProjectAsset {
  projectSlug: string;
  projectTitle: string;
}

interface AssetStats {
  totalAssets: number;
  totalSize: number;
  imageCount: number;
  videoCount: number;
  documentCount: number;
  audioCount: number;
  heroAssets: number;
}

export default function AssetManagementPage() {
  const [allAssets, setAllAssets] = useState<AssetWithProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load all projects and their assets
  useEffect(() => {
    const loadAllAssets = async () => {
      setIsLoading(true);
      try {
        const projectList = await listProjects();
        setProjects(projectList);

        const allAssetsWithProjects: AssetWithProject[] = [];

        for (const projectMeta of projectList) {
          try {
            const project = await loadProject(projectMeta.slug);
            if (project && project.assets && project.assets.length > 0) {
              const assetsWithProject = project.assets.map(asset => ({
                ...asset,
                projectSlug: project.slug,
                projectTitle: project.title || project.slug,
              }));
              allAssetsWithProjects.push(...assetsWithProject);
            }
          } catch (error) {
            console.warn(`Failed to load project ${projectMeta.slug}:`, error);
          }
        }

        setAllAssets(allAssetsWithProjects);
      } catch (error) {
        console.error('Failed to load assets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllAssets();
  }, []);

  // Filter assets by selected project
  const filteredAssets = useMemo(() => {
    if (selectedProject === 'all') {
      return allAssets;
    }
    return allAssets.filter(asset => asset.projectSlug === selectedProject);
  }, [allAssets, selectedProject]);

  // Calculate asset statistics
  const assetStats = useMemo<AssetStats>(() => {
    const stats = {
      totalAssets: filteredAssets.length,
      totalSize: 0,
      imageCount: 0,
      videoCount: 0,
      documentCount: 0,
      audioCount: 0,
      heroAssets: 0,
    };

    filteredAssets.forEach(asset => {
      stats.totalSize += asset.size;

      const mimeType = asset.mimeType?.toLowerCase() || '';
      if (mimeType.startsWith('image/')) {
        stats.imageCount++;
      } else if (mimeType.startsWith('video/')) {
        stats.videoCount++;
      } else if (mimeType.startsWith('audio/')) {
        stats.audioCount++;
      } else {
        stats.documentCount++;
      }

      // Note: Hero assets would need to be tracked in project data
      // For now, we'll use a placeholder count
    });

    return stats;
  }, [filteredAssets]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Asset management handlers (simplified for global view)
  const handleAssetUpdate = (assetId: string, updates: Partial<ProjectAsset>) => {
    // In a real implementation, this would update the specific project
    console.log('Update asset:', assetId, updates);
  };

  const handleAssetRemove = (assetId: string) => {
    // In a real implementation, this would remove from the specific project
    console.log('Remove asset:', assetId);
    setAllAssets(prev => prev.filter(asset => asset.id !== assetId));
  };

  const handleHeroSelect = (assetId: string | null) => {
    // In a real implementation, this would update the specific project's hero
    console.log('Set hero:', assetId);
  };

  const handleAssetUpload = (files: FileList) => {
    if (projects.length === 0) {
      // Show message to create a project first
      alert('Please create a project first before uploading assets. You can create a new project from the dashboard.');
      return;
    }

    if (selectedProject === 'all') {
      // Show project selector modal for global uploads
      alert('Please select a specific project to upload assets to, or use the project editor for more advanced asset management.');
      return;
    }

    // In a real implementation, this would upload to the selected project
    console.log('Upload files to project:', selectedProject, files);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`border-b ${
        isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <FolderOpen size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">Asset Management</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage all your project assets in one place
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isDarkMode ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Assets */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Archive size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assetStats.totalAssets}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Assets</p>
              </div>
            </div>
          </div>

          {/* Storage Used */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <BarChart3 size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatBytes(assetStats.totalSize)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Storage Used</p>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ImageIcon size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assetStats.imageCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Images</p>
              </div>
            </div>
          </div>

          {/* Videos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <Video size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assetStats.videoCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Videos</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <FileText size={20} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assetStats.documentCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div>
              <label htmlFor="project-filter" className="block text-sm font-medium mb-2">
                Filter by Project
              </label>
              <select
                id="project-filter"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Projects ({allAssets.length} assets)</option>
                {projects.map(project => {
                  const projectAssetCount = allAssets.filter(asset => asset.projectSlug === project.slug).length;
                  return (
                    <option key={project.slug} value={project.slug}>
                      {project.title || project.slug} ({projectAssetCount} assets)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Asset Manager */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {projects.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <FolderOpen size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">No Projects Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                You need to create at least one project before you can manage assets.
                Projects help organize your assets and make them easier to find.
              </p>
              <Button as={Link} to="/create" variant="primary" leftIcon={<Plus size={18} />}>
                Create Your First Project
              </Button>
            </div>
          ) : allAssets.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <ImageIcon size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">No Assets Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                You haven't uploaded any assets yet. Use the project editors to add images,
                videos, documents, and other files to your projects.
              </p>
              <div className="flex gap-3 justify-center">
                <Button as={Link} to="/dashboard" variant="outline">
                  Back to Dashboard
                </Button>
                <Button as={Link} to="/create" variant="primary" leftIcon={<Plus size={18} />}>
                  Create New Project
                </Button>
              </div>
            </div>
          ) : (
            <EnhancedAssetManager
              assets={filteredAssets}
              onAssetUpdate={handleAssetUpdate}
              onAssetRemove={handleAssetRemove}
              onHeroSelect={handleHeroSelect}
              onAssetUpload={handleAssetUpload}
              isDarkMode={isDarkMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}