import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  RefreshCcw,
  Upload,
  Download,
  FileEdit,
  FileText,
  Search,
  Folder,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileArchive,
  Plus,
  Settings,
  Calendar,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useApi, useApiRequest } from '../hooks/useApi';
import { Button, Input, LoadingSpinner } from '../components/ui';
import Card from '../components/ui/Card';
import ThemeToggle from '../components/ThemeToggle';

// Use the same types from the original file
export type ApiAssetPreview = {
  id: string;
  label: string | null;
  relativePath: string;
  type: string | null;
  updatedAt: string;
};

export type ApiDeliverablePreview = {
  id: string;
  label: string | null;
  relativePath: string;
  format: string | null;
  updatedAt: string;
};

export type ApiProject = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  organization?: string | null;
  workType?: string | null;
  year?: number | null;
  tags: string[];
  highlights: string[];
  syncStatus: string;
  lastSyncedAt?: string | null;
  fsLastModified?: string | null;
  metadataUpdatedAt?: string | null;
  briefUpdatedAt?: string | null;
  assetCount: number;
  deliverableCount: number;
  assetPreviews: ApiAssetPreview[];
  deliverablePreviews: ApiDeliverablePreview[];
};

const DashboardPage = () => {
  const { addNotification } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);

  // Mock data for demonstration - replace with actual API calls
  const stats = useMemo(() => ({
    totalProjects: projects.length,
    totalAssets: projects.reduce((sum, p) => sum + p.assetCount, 0),
    totalDeliverables: projects.reduce((sum, p) => sum + p.deliverableCount, 0),
    recentlyUpdated: projects.filter(p => {
      const lastModified = new Date(p.fsLastModified || 0);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return lastModified > weekAgo;
    }).length,
  }), [projects]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(project =>
      project.title.toLowerCase().includes(query) ||
      project.organization?.toLowerCase().includes(query) ||
      project.workType?.toLowerCase().includes(query) ||
      project.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [projects, searchQuery]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Replace with actual sync API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      addNotification('success', 'Filesystem sync completed successfully');
    } catch (error) {
      addNotification('error', 'Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      // Replace with actual import API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      addNotification('success', `Successfully imported ${file.name}`);
    } catch (error) {
      addNotification('error', 'Import failed. Please try again.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    // Load projects - replace with actual API call
    const loadProjects = async () => {
      setLoading(true);
      try {
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProjects([]); // Empty for now
      } catch (error) {
        addNotification('error', 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [addNotification]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." centered />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900">
                <Folder className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your projects and keep files in sync
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                as={Link}
                to="/create"
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                className="shadow-md"
              >
                New Project
              </Button>
              <Button
                as={Link}
                to="/settings"
                variant="outline"
                leftIcon={<Settings className="h-4 w-4" />}
              >
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700">
            <Card.Body className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Projects</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalProjects}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                  <Folder className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700">
            <Card.Body className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Assets</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.totalAssets}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-500 dark:bg-green-600 flex items-center justify-center">
                  <FileArchive className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200 dark:border-purple-700">
            <Card.Body className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Deliverables</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.totalDeliverables}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-purple-500 dark:bg-purple-600 flex items-center justify-center">
                  <Download className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-200 dark:border-orange-700">
            <Card.Body className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Recent Updates</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.recentlyUpdated}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-orange-500 dark:bg-orange-600 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-md">
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your portfolio files and data</p>
            </Card.Header>
            <Card.Body className="space-y-4">
              <Button
                onClick={handleSync}
                variant="outline"
                leftIcon={syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                disabled={syncing}
                fullWidth
                className="justify-start"
              >
                {syncing ? 'Syncing...' : 'Sync Filesystem'}
              </Button>
              <Button
                variant="primary"
                leftIcon={importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                disabled={importing}
                onClick={() => fileInputRef.current?.click()}
                fullWidth
                className="justify-start"
              >
                {importing ? 'Importing...' : 'Import Project (.zip)'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/zip"
                  onChange={handleImport}
                  className="hidden"
                  disabled={importing}
                />
              </Button>
            </Card.Body>
          </Card>

          <Card className="shadow-md">
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio Tools</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create and manage your portfolio</p>
            </Card.Header>
            <Card.Body className="space-y-4">
              <Button
                as={Link}
                to="/portfolio"
                variant="outline"
                leftIcon={<FileText className="h-4 w-4" />}
                fullWidth
                className="justify-start"
              >
                View Portfolio
              </Button>
              <Button
                as={Link}
                to="/portfolio/editor"
                variant="outline"
                leftIcon={<FileEdit className="h-4 w-4" />}
                fullWidth
                className="justify-start"
              >
                Portfolio Editor
              </Button>
            </Card.Body>
          </Card>
        </div>

        {/* Projects Section */}
        <Card className="shadow-md">
          <Card.Header>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Projects</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredProjects.length} of {stats.totalProjects} projects
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  className="w-full sm:w-64"
                />
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No projects found</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery ? 'Try adjusting your search or' : 'Get started by creating your first project or'} sync your filesystem to discover existing projects.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    as={Link}
                    to="/create"
                    variant="primary"
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Create Project
                  </Button>
                  <Button
                    onClick={handleSync}
                    variant="outline"
                    leftIcon={<RefreshCcw className="h-4 w-4" />}
                    disabled={syncing}
                  >
                    Sync Filesystem
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <Card.Body className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {project.title}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          project.syncStatus === 'synced'
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                        }`}>
                          {project.syncStatus}
                        </span>
                      </div>
                      {project.organization && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{project.organization}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{project.assetCount} assets</span>
                        <span>{formatDate(project.fsLastModified)}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          as={Link}
                          to={`/editor/${project.id}`}
                          variant="outline"
                          size="sm"
                          leftIcon={<FileEdit className="h-3 w-3" />}
                          className="flex-1"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Download className="h-3 w-3" />}
                        >
                          Export
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </main>
    </div>
  );
};

export default DashboardPage;