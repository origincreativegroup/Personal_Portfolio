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
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type MetadataResponse = {
  schemaVersion?: string;
  title: string;
  summary?: string;
  organization?: string;
  workType?: string;
  year?: number;
  role?: string;
  seniority?: string;
  categories: string[];
  skills: string[];
  tools: string[];
  tags: string[];
  highlights: string[];
  links?: Record<string, unknown> | null;
  nda?: boolean;
  coverImage?: string;
  case?: {
    problem?: string;
    actions?: string;
    results?: string;
  } | null;
};

type ProjectRecord = ApiProject & {
  metadataChecksum: string | null;
  briefChecksum: string | null;
  categories: string[];
  skills: string[];
  tools: string[];
  highlights: string[];
  tags: string[];
  role?: string | null;
  seniority?: string | null;
  schemaVersion?: string | null;
  coverImage?: string | null;
  nda?: boolean | null;
  caseProblem?: string | null;
  caseActions?: string | null;
  caseResults?: string | null;
  links?: Record<string, unknown> | null;
};

type ProjectDetail = {
  project: ProjectRecord;
  metadata: MetadataResponse;
  brief: {
    content: string | null;
    checksum: string | null;
  };
};

type MetadataFormState = {
  title: string;
  summary: string;
  organization: string;
  workType: string;
  year: string;
  role: string;
  seniority: string;
  categories: string;
  skills: string;
  tools: string;
  tags: string;
  highlights: string;
  nda: boolean;
  coverImage: string;
  caseProblem: string;
  caseActions: string;
  caseResults: string;
};

type EditorMode = 'metadata' | 'brief' | null;

type ProjectsResponse = {
  data: ApiProject[];
  pagination: PaginationState;
};

const listFromString = (value: string): string[] =>
  value
    .split(',')
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0);

const joinList = (list: string[]): string => (list.length === 0 ? '' : list.join(', '));

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

const relativeTime = (value?: string | null): string => {
  if (!value) return 'unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'just now';
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'moments ago';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const toMetadataForm = (metadata: MetadataResponse): MetadataFormState => ({
  title: metadata.title ?? '',
  summary: metadata.summary ?? '',
  organization: metadata.organization ?? '',
  workType: metadata.workType ?? '',
  year: metadata.year ? String(metadata.year) : '',
  role: metadata.role ?? '',
  seniority: metadata.seniority ?? '',
  categories: joinList(metadata.categories ?? []),
  skills: joinList(metadata.skills ?? []),
  tools: joinList(metadata.tools ?? []),
  tags: joinList(metadata.tags ?? []),
  highlights: joinList(metadata.highlights ?? []),
  nda: Boolean(metadata.nda),
  coverImage: metadata.coverImage ?? '',
  caseProblem: metadata.case?.problem ?? '',
  caseActions: metadata.case?.actions ?? '',
  caseResults: metadata.case?.results ?? '',
});

const toMetadataPayload = (form: MetadataFormState): MetadataResponse => ({
  title: form.title.trim() || 'Untitled Project',
  summary: form.summary.trim() || undefined,
  organization: form.organization.trim() || undefined,
  workType: form.workType.trim() || undefined,
  year: form.year.trim() ? Number(form.year.trim()) : undefined,
  role: form.role.trim() || undefined,
  seniority: form.seniority.trim() || undefined,
  categories: listFromString(form.categories),
  skills: listFromString(form.skills),
  tools: listFromString(form.tools),
  tags: listFromString(form.tags),
  highlights: listFromString(form.highlights),
  nda: form.nda,
  coverImage: form.coverImage.trim() || undefined,
  case: {
    problem: form.caseProblem.trim() || undefined,
    actions: form.caseActions.trim() || undefined,
    results: form.caseResults.trim() || undefined,
  },
});

type FreshnessState = 'fresh' | 'filesystem-updated' | 'stale' | 'unknown';

const computeFreshness = (project: ApiProject): FreshnessState => {
  if (project.syncStatus === 'conflict') return 'stale';
  if (!project.lastSyncedAt || !project.fsLastModified) return 'unknown';
  const fsTime = new Date(project.fsLastModified).getTime();
  const syncTime = new Date(project.lastSyncedAt).getTime();
  if (Number.isNaN(fsTime) || Number.isNaN(syncTime)) return 'unknown';
  if (fsTime > syncTime) return 'filesystem-updated';
  return 'fresh';
};

export const FreshnessBadge: React.FC<{ project: ApiProject }> = ({ project }) => {
  const state = computeFreshness(project);
  const base = 'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium';

  if (state === 'fresh') {
    return (
      <span className={`${base} bg-green-100 text-green-700`}>
        <CheckCircle2 className="h-3.5 w-3.5" /> Fresh
      </span>
    );
  }

  if (state === 'filesystem-updated') {
    return (
      <span className={`${base} bg-amber-100 text-amber-700`}>
        <AlertCircle className="h-3.5 w-3.5" /> Filesystem newer
      </span>
    );
  }

  if (state === 'stale') {
    return (
      <span className={`${base} bg-red-100 text-red-700`}>
        <AlertCircle className="h-3.5 w-3.5" /> Conflict
      </span>
    );
  }

  return (
    <span className={`${base} bg-gray-100 text-gray-600`}>
      <AlertCircle className="h-3.5 w-3.5" /> Unknown
    </span>
  );
};

export const AssetPreviewList: React.FC<{ assets: ApiAssetPreview[]; title: string }> = ({ assets, title }) => (
  <div>
    <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
    {assets.length === 0 ? (
      <p className="text-sm text-gray-500">No assets synced yet.</p>
    ) : (
      <ul className="space-y-1">
        {assets.map(asset => (
          <li key={asset.id} className="text-sm text-gray-600 flex items-center justify-between">
            <span className="truncate">
              {asset.label ?? asset.relativePath}
              <span className="ml-2 text-xs text-gray-400">{asset.type ?? 'asset'}</span>
            </span>
            <span className="text-xs text-gray-400 ml-4">{relativeTime(asset.updatedAt)}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export const DeliverablePreviewList: React.FC<{ deliverables: ApiDeliverablePreview[] }> = ({ deliverables }) => (
  <div>
    <h4 className="text-sm font-semibold text-gray-700 mb-2">Deliverables</h4>
    {deliverables.length === 0 ? (
      <p className="text-sm text-gray-500">No deliverables bundled yet.</p>
    ) : (
      <ul className="space-y-1">
        {deliverables.map(item => (
          <li key={item.id} className="text-sm text-gray-600 flex items-center justify-between">
            <span className="truncate">
              {item.label ?? item.relativePath}
              {item.format ? <span className="ml-2 text-xs text-gray-400 uppercase">{item.format}</span> : null}
            </span>
            <span className="text-xs text-gray-400 ml-4">{relativeTime(item.updatedAt)}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 6, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [metadataForm, setMetadataForm] = useState<MetadataFormState | null>(null);
  const [briefDraft, setBriefDraft] = useState('');
  const [editorError, setEditorError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadProjects = async (pageOverride?: number, searchOverride?: string) => {
    const page = pageOverride ?? pagination.page;
    const searchValue = searchOverride ?? search;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pagination.pageSize),
      });
      if (searchValue.trim()) {
        params.set('search', searchValue.trim());
      }

      const response = await fetch(`/api/projects?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load projects');
      }
      const data: ProjectsResponse = await response.json();
      setProjects(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error while loading projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async () => {
    await loadProjects();
  };

  const handleSearchSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(pendingSearch);
    await loadProjects(1, pendingSearch);
  };

  const handlePageChange = async (nextPage: number) => {
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: nextPage }));
    await loadProjects(nextPage);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setImportMessage(null);
    setImportError(null);
    try {
      const response = await fetch('/api/projects/sync', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Sync failed');
      }
      await loadProjects();
      setImportMessage('Filesystem sync completed successfully.');
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const openEditor = async (projectId: string, mode: EditorMode) => {
    setEditorMode(mode);
    setEditorError(null);
    setSaving(false);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Unable to load project details');
      }
      const payload: ProjectDetail = await response.json();
      setDetail(payload);
      setMetadataForm(toMetadataForm(payload.metadata));
      setBriefDraft(payload.brief.content ?? '');
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : 'Failed to load project');
    }
  };

  const closeEditor = () => {
    setEditorMode(null);
    setDetail(null);
    setMetadataForm(null);
    setBriefDraft('');
    setEditorError(null);
  };

  const handleMetadataSave = async () => {
    if (!detail || !metadataForm) return;
    setSaving(true);
    setEditorError(null);
    try {
      const response = await fetch(`/api/projects/${detail.project.id}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: toMetadataPayload(metadataForm),
          expectedChecksum: detail.project.metadataChecksum ?? undefined,
        }),
      });

      if (response.status === 409) {
        const conflict = await response.json();
        throw new Error(`Metadata conflict detected. Please refresh. Details: ${JSON.stringify(conflict.details)}`);
      }

      if (!response.ok) {
        throw new Error('Failed to save metadata');
      }

      await refresh();
      closeEditor();
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : 'Failed to save metadata');
    } finally {
      setSaving(false);
    }
  };

  const handleBriefSave = async () => {
    if (!detail) return;
    setSaving(true);
    setEditorError(null);
    try {
      const response = await fetch(`/api/projects/${detail.project.id}/brief`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: briefDraft,
          expectedChecksum: detail.project.briefChecksum ?? undefined,
        }),
      });

      if (response.status === 409) {
        const conflict = await response.json();
        throw new Error(`Brief conflict detected. Please refresh. Details: ${JSON.stringify(conflict.details)}`);
      }

      if (!response.ok) {
        throw new Error('Failed to save brief');
      }

      await refresh();
      closeEditor();
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : 'Failed to save brief');
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMessage(null);
    setImportError(null);

    try {
      const formData = new FormData();
      formData.append('archive', file);
      const response = await fetch('/api/projects/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      setImportMessage(`Imported ${result.imported} project(s) successfully.`);
      await loadProjects();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async (projectId: string) => {
    setExportingId(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}/export`);
      if (!response.ok) {
        throw new Error('Export failed');
      }
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition');
      let filename = `project-${projectId}.zip`;
      if (disposition) {
        const match = disposition.match(/filename="(.+?)"/);
        if (match?.[1]) {
          filename = match[1];
        }
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExportingId(null);
    }
  };

  const totals = useMemo(() => {
    const totalAssets = projects.reduce((sum, project) => sum + project.assetCount, 0);
    const totalDeliverables = projects.reduce((sum, project) => sum + project.deliverableCount, 0);
    const filesystemUpdates = projects.filter(project => computeFreshness(project) === 'filesystem-updated').length;
    return {
      totalAssets,
      totalDeliverables,
      filesystemUpdates,
    };
  }, [projects]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <Folder className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Portfolio Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Keep the database aligned with the files in <code className="rounded bg-gray-100 px-1 py-0.5">projects/</code>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSync}
                className="inline-flex items-center gap-2 rounded-lg border border-purple-600 px-4 py-2 text-sm font-medium text-purple-600 transition hover:bg-purple-50"
                disabled={isSyncing}
              >
                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Sync filesystem
              </button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Import .zip
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/zip"
                  onChange={handleImport}
                  className="hidden"
                  disabled={importing}
                />
              </label>
              <Link
                to="/settings"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Settings
              </Link>
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Portfolio
              </Link>
              <Link
                to="/portfolio/editor"
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
              >
                Portfolio editor
              </Link>
            </div>
          </div>
          {(importMessage || importError) && (
            <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${importError ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
              {importError ?? importMessage}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Projects tracked</p>
            <p className="mt-2 text-2xl font-semibold">{pagination.total}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Assets indexed</p>
            <p className="mt-2 text-2xl font-semibold">{totals.totalAssets}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Deliverables bundled</p>
            <p className="mt-2 text-2xl font-semibold">{totals.totalDeliverables}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Filesystem updates</p>
            <p className="mt-2 text-2xl font-semibold">{totals.filesystemUpdates}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <form onSubmit={handleSearchSubmit} className="flex w-full max-w-lg items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                value={pendingSearch}
                onChange={event => setPendingSearch(event.target.value)}
                placeholder="Search by title, organization, or tag"
                className="w-full bg-transparent text-sm text-gray-700 outline-none"
              />
              <button type="submit" className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700">
                Search
              </button>
            </form>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <div className="flex overflow-hidden rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="px-3 py-1 hover:bg-gray-100"
                  disabled={pagination.page === 1}
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="border-l border-gray-200 px-3 py-1 hover:bg-gray-100"
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading projects…
            </div>
          ) : error ? (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-gray-500">
              <FileArchive className="h-8 w-8 text-gray-400" />
              <p>No projects found. Create one with <code className="rounded bg-gray-100 px-1 py-0.5">scripts/new_project.py</code> or import a zip.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {projects.map(project => (
                <div key={project.id} className="rounded-2xl border border-gray-200 p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                    <div className="max-w-2xl space-y-2">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-gray-900">{project.title}</h2>
                        <FreshnessBadge project={project} />
                      </div>
                      <p className="text-sm text-gray-600">
                        {project.summary || 'No summary captured yet. Edit the brief or metadata to add one.'}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        {project.organization && <span className="rounded-full bg-gray-100 px-2 py-1">{project.organization}</span>}
                        {project.workType && <span className="rounded-full bg-gray-100 px-2 py-1">{project.workType}</span>}
                        {project.year && <span className="rounded-full bg-gray-100 px-2 py-1">{project.year}</span>}
                        {project.tags.slice(0, 4).map(tag => (
                          <span key={tag} className="rounded-full bg-purple-50 px-2 py-1 text-purple-600">#{tag}</span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>Last synced {relativeTime(project.lastSyncedAt)}</span>
                        <span>Filesystem {relativeTime(project.fsLastModified)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2">
                      <button
                        type="button"
                        onClick={() => openEditor(project.id, 'metadata')}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        <FileEdit className="h-4 w-4" /> Edit metadata
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditor(project.id, 'brief')}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        <FileText className="h-4 w-4" /> Edit brief
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport(project.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        disabled={exportingId === project.id}
                      >
                        {exportingId === project.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Export bundle
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <AssetPreviewList assets={project.assetPreviews} title={`Assets (${project.assetCount})`} />
                    <DeliverablePreviewList deliverables={project.deliverablePreviews} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {editorMode && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {editorMode === 'metadata' ? 'Edit project metadata' : 'Edit project brief'}
                </h3>
                <p className="text-sm text-gray-500">Filesystem mirror: <code className="rounded bg-gray-100 px-1">projects/{detail.project.slug}</code></p>
              </div>
              <button onClick={closeEditor} className="text-sm text-gray-500 hover:text-gray-700">Close</button>
            </div>

            {editorError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{editorError}</div>
            )}

            {editorMode === 'metadata' && metadataForm && (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-gray-700">
                    Title
                    <input
                      value={metadataForm.title}
                      onChange={event => setMetadataForm({ ...metadataForm, title: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Organization
                    <input
                      value={metadataForm.organization}
                      onChange={event => setMetadataForm({ ...metadataForm, organization: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Work type
                    <input
                      value={metadataForm.workType}
                      onChange={event => setMetadataForm({ ...metadataForm, workType: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Year
                    <input
                      value={metadataForm.year}
                      onChange={event => setMetadataForm({ ...metadataForm, year: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Role
                    <input
                      value={metadataForm.role}
                      onChange={event => setMetadataForm({ ...metadataForm, role: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Seniority
                    <input
                      value={metadataForm.seniority}
                      onChange={event => setMetadataForm({ ...metadataForm, seniority: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <label className="text-sm font-medium text-gray-700">
                  Summary
                  <textarea
                    value={metadataForm.summary}
                    onChange={event => setMetadataForm({ ...metadataForm, summary: event.target.value })}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-gray-700">
                    Categories
                    <input
                      value={metadataForm.categories}
                      onChange={event => setMetadataForm({ ...metadataForm, categories: event.target.value })}
                      placeholder="Design, Growth"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Skills
                    <input
                      value={metadataForm.skills}
                      onChange={event => setMetadataForm({ ...metadataForm, skills: event.target.value })}
                      placeholder="Research, Figma"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Tools
                    <input
                      value={metadataForm.tools}
                      onChange={event => setMetadataForm({ ...metadataForm, tools: event.target.value })}
                      placeholder="Notion, React"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Tags
                    <input
                      value={metadataForm.tags}
                      onChange={event => setMetadataForm({ ...metadataForm, tags: event.target.value })}
                      placeholder="dashboard, design system"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <label className="text-sm font-medium text-gray-700">
                  Highlights
                  <input
                    value={metadataForm.highlights}
                    onChange={event => setMetadataForm({ ...metadataForm, highlights: event.target.value })}
                    placeholder="Shipped redesign, Increased retention"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={metadataForm.nda}
                    onChange={event => setMetadataForm({ ...metadataForm, nda: event.target.checked })}
                    className="rounded border-gray-300"
                  />
                  Protected by NDA
                </label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="text-sm font-medium text-gray-700">
                    Case problem
                    <textarea
                      value={metadataForm.caseProblem}
                      onChange={event => setMetadataForm({ ...metadataForm, caseProblem: event.target.value })}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Case actions
                    <textarea
                      value={metadataForm.caseActions}
                      onChange={event => setMetadataForm({ ...metadataForm, caseActions: event.target.value })}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Case results
                    <textarea
                      value={metadataForm.caseResults}
                      onChange={event => setMetadataForm({ ...metadataForm, caseResults: event.target.value })}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              </div>
            )}

            {editorMode === 'brief' && (
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-700">
                  Project brief (saves to <code className="rounded bg-gray-100 px-1">brief.md</code>)
                  <textarea
                    value={briefDraft}
                    onChange={event => setBriefDraft(event.target.value)}
                    rows={16}
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono"
                  />
                </label>
                <p className="mt-2 text-xs text-gray-500">Last updated {formatDate(detail.project.briefUpdatedAt)}</p>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                Metadata last synced {formatDate(detail.project.metadataUpdatedAt)} · Filesystem updated {formatDate(detail.project.fsLastModified)}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={editorMode === 'metadata' ? handleMetadataSave : handleBriefSave}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

export { computeFreshness };
