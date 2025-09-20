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

const joinClasses = (
  ...classes: Array<string | false | null | undefined>
) => classes.filter(Boolean).join(' ');

const parseDate = (value?: string | null): number | undefined => {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : timestamp;
};

const formatDateDisplay = (
  value?: string | null,
  fallback = 'Unknown',
) => {
  const timestamp = parseDate(value);
  if (timestamp === undefined) return fallback;
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTimeDisplay = (
  value?: string | null,
  fallback = 'Unknown',
) => {
  const timestamp = parseDate(value);
  if (timestamp === undefined) return fallback;
  return new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const fileNameFromPath = (relativePath: string) =>
  relativePath.split('/').filter(Boolean).pop() ?? relativePath;

export type FreshnessState =
  | 'in-sync'
  | 'filesystem-updated'
  | 'metadata-updated'
  | 'brief-updated'
  | 'sync-needed'
  | 'never-synced';

type FreshnessUpdate =
  | 'filesystem-updated'
  | 'metadata-updated'
  | 'brief-updated';

type FreshnessCopy = {
  label: string;
  description: string;
  tone: 'neutral' | 'warning' | 'danger' | 'success';
  icon: React.ReactNode;
};

const FRESHNESS_COPY: Record<FreshnessState, FreshnessCopy> = {
  'in-sync': {
    label: 'Up to date',
    description: 'Project is fully synchronised with the filesystem',
    tone: 'success',
    icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  'filesystem-updated': {
    label: 'Filesystem newer',
    description: 'Files changed on disk since the last sync',
    tone: 'warning',
    icon: <Activity className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  'metadata-updated': {
    label: 'Metadata newer',
    description: 'Project metadata has changes waiting to sync',
    tone: 'warning',
    icon: <FileText className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  'brief-updated': {
    label: 'Brief newer',
    description: 'Project brief has been edited since the last sync',
    tone: 'warning',
    icon: <FileEdit className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  'sync-needed': {
    label: 'Needs sync',
    description: 'Project reports pending changes',
    tone: 'danger',
    icon: <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  'never-synced': {
    label: 'Never synced',
    description: 'Project has not been synchronised yet',
    tone: 'neutral',
    icon: <Calendar className="h-3.5 w-3.5" aria-hidden="true" />,
  },
};

const FRESHNESS_TONE_CLASSES: Record<
  FreshnessCopy['tone'],
  string
> = {
  success:
    'bg-emerald-100/80 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-800/60',
  warning:
    'bg-amber-100/80 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-800/60',
  danger:
    'bg-rose-100/80 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-900/40 dark:text-rose-200 dark:ring-rose-800/60',
  neutral:
    'bg-gray-100/80 text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-gray-800/60 dark:text-gray-200 dark:ring-gray-700/60',
};

const getLatestUpdate = (
  project: ApiProject,
): { type: FreshnessUpdate; timestamp: number } | undefined => {
  const updates: Array<{
    type: FreshnessUpdate;
    timestamp?: number;
  }> = [
    { type: 'filesystem-updated', timestamp: parseDate(project.fsLastModified) },
    { type: 'metadata-updated', timestamp: parseDate(project.metadataUpdatedAt) },
    { type: 'brief-updated', timestamp: parseDate(project.briefUpdatedAt) },
  ];

  return updates
    .filter((update): update is { type: FreshnessUpdate; timestamp: number } =>
      update.timestamp !== undefined,
    )
    .sort((a, b) => b.timestamp - a.timestamp)[0];
};

export const computeFreshness = (project: ApiProject): FreshnessState => {
  const lastSynced = parseDate(project.lastSyncedAt);
  const latestUpdate = getLatestUpdate(project);

  if (project.syncStatus && project.syncStatus !== 'synced' && project.syncStatus !== 'clean') {
    return 'sync-needed';
  }

  if (!latestUpdate) {
    return lastSynced === undefined ? 'never-synced' : 'in-sync';
  }

  if (lastSynced === undefined) {
    return latestUpdate.type;
  }

  if (latestUpdate.timestamp > lastSynced) {
    return latestUpdate.type;
  }

  return 'in-sync';
};

type FreshnessBadgeProps = {
  project: ApiProject;
  className?: string;
};

export const FreshnessBadge: React.FC<FreshnessBadgeProps> = ({
  project,
  className,
}) => {
  const state = computeFreshness(project);
  const { label, description, tone, icon } = FRESHNESS_COPY[state];

  return (
    <span
      className={joinClasses(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        FRESHNESS_TONE_CLASSES[tone],
        className,
      )}
      title={description}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};

type AssetPreviewListProps = {
  assets: ApiAssetPreview[];
  title?: string;
  emptyMessage?: string;
};

export const AssetPreviewList: React.FC<AssetPreviewListProps> = ({
  assets,
  title,
  emptyMessage = 'No assets available yet.',
}) => (
  <section className="space-y-2">
    {title ? (
      <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </h5>
    ) : null}
    {assets.length === 0 ? (
      <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
    ) : (
      <ul className="space-y-2">
        {assets.map((asset) => {
          const displayLabel = asset.label ?? fileNameFromPath(asset.relativePath);
          return (
            <li
              key={asset.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white/60 px-3 py-2 text-sm shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/40"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                  {displayLabel}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {asset.relativePath}
                </p>
              </div>
              <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                {formatDateTimeDisplay(asset.updatedAt)}
              </span>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);

type DeliverablePreviewListProps = {
  deliverables: ApiDeliverablePreview[];
  title?: string;
  emptyMessage?: string;
};

export const DeliverablePreviewList: React.FC<DeliverablePreviewListProps> = ({
  deliverables,
  title,
  emptyMessage = 'No deliverables available yet.',
}) => (
  <section className="space-y-2">
    {title ? (
      <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </h5>
    ) : null}
    {deliverables.length === 0 ? (
      <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
    ) : (
      <ul className="space-y-2">
        {deliverables.map((deliverable) => {
          const displayLabel =
            deliverable.label ?? fileNameFromPath(deliverable.relativePath);
          const formatLabel = deliverable.format
            ? deliverable.format.toUpperCase()
            : undefined;

          return (
            <li
              key={deliverable.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white/60 px-3 py-2 text-sm shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/40"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                  {displayLabel}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {formatLabel ? `${formatLabel} • ` : ''}
                  {deliverable.relativePath}
                </p>
              </div>
              <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                {formatDateTimeDisplay(deliverable.updatedAt)}
              </span>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);

const DashboardPage = () => {
  const { addNotification } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);

  // Mock data for demonstration - replace with actual API calls
  const stats = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoTimestamp = weekAgo.getTime();

    return {
      totalProjects: projects.length,
      totalAssets: projects.reduce((sum, project) => sum + project.assetCount, 0),
      totalDeliverables: projects.reduce(
        (sum, project) => sum + project.deliverableCount,
        0,
      ),
      recentlyUpdated: projects.filter(project => {
        const lastModified = parseDate(project.fsLastModified);
        return lastModified !== undefined && lastModified >= weekAgoTimestamp;
      }).length,
    };
  }, [projects]);

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

  const formatDate = (dateString?: string | null) =>
    formatDateDisplay(dateString, 'Never');

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
                {filteredProjects.map((project) => {
                  const assetPreviews = project.assetPreviews.slice(0, 3);
                  const deliverablePreviews = project.deliverablePreviews.slice(0, 3);
                  const tagsToShow = project.tags.slice(0, 3);

                  return (
                    <Card
                      key={project.id}
                      className="border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <Card.Body className="space-y-4 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <h4 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                                {project.title}
                              </h4>
                              {project.year ? (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {project.year}
                                </span>
                              ) : null}
                            </div>
                            {project.organization ? (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {project.organization}
                              </p>
                            ) : null}
                            {project.summary ? (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {project.summary}
                              </p>
                            ) : null}
                            {tagsToShow.length > 0 ? (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {tagsToShow.map(tag => (
                                  <span
                                    key={tag}
                                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                                {project.tags.length > tagsToShow.length ? (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    +{project.tags.length - tagsToShow.length} more
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <FreshnessBadge project={project} />
                            <span
                              className={`text-[11px] font-semibold uppercase tracking-wide ${
                                project.syncStatus === 'synced' || project.syncStatus === 'clean'
                                  ? 'text-emerald-600 dark:text-emerald-300'
                                  : 'text-amber-600 dark:text-amber-300'
                              }`}
                            >
                              {project.syncStatus}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{project.assetCount} assets</span>
                          <span>{project.deliverableCount} deliverables</span>
                          <span>Filesystem updated {formatDate(project.fsLastModified)}</span>
                          {project.lastSyncedAt ? (
                            <span>Last sync {formatDate(project.lastSyncedAt)}</span>
                          ) : (
                            <span>Never synced</span>
                          )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <AssetPreviewList
                            assets={assetPreviews}
                            title={`Assets (${project.assetCount})`}
                          />
                          <DeliverablePreviewList
                            deliverables={deliverablePreviews}
                            title={`Deliverables (${project.deliverableCount})`}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            as={Link}
                            to={`/editor/${project.id}`}
                            variant="outline"
                            size="sm"
                            leftIcon={<FileEdit className="h-3 w-3" />}
                            className="flex-1 sm:flex-none"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Download className="h-3 w-3" />}
                            className="flex-1 sm:flex-none"
                          >
                            Export
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card.Body>
        </Card>
      </main>
    </div>
  );
};

export default DashboardPage;
