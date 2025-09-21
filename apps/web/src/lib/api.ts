import type { AnyBlockT, NarrativeDraftT, ProjectT, TemplateT } from '@portfolioforge/schemas';

const API_BASE = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:4000';

async function apiFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }
  return response;
}

export async function listProjects(status?: string): Promise<ProjectT[]> {
  const query = status ? `?status=${status}` : '';
  const response = await apiFetch(`/projects${query}`, { headers: { 'Content-Type': 'application/json' } });
  return response.json();
}

export async function createProject(payload: { title: string; summary?: string; tags?: string[] }): Promise<ProjectT> {
  const response = await apiFetch('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function getProject(id: string): Promise<ProjectT> {
  const response = await apiFetch(`/projects/${id}`);
  return response.json();
}

export async function updateProject(id: string, payload: Partial<ProjectT>): Promise<ProjectT> {
  const response = await apiFetch(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function saveBlocks(projectId: string, blocks: AnyBlockT[]): Promise<AnyBlockT[]> {
  const response = await apiFetch(`/blocks/${projectId}`, {
    method: 'POST',
    body: JSON.stringify(blocks),
  });
  return response.json();
}

export async function generateNarrative(
  projectId: string,
  options: { tone?: number; mode?: 'default' | 'client' | 'recruiter' | 'technical'; action?: 'generate' | 'rewrite' }
): Promise<NarrativeDraftT | { content: string; projectId: string }> {
  const response = await apiFetch(`/narratives/${projectId}/generate`, {
    method: 'POST',
    body: JSON.stringify(options),
  });
  return response.json();
}

export async function publishProject(projectId: string): Promise<{ project: ProjectT; url: string; slug: string }> {
  const response = await apiFetch(`/projects/${projectId}/publish`, {
    method: 'POST',
  });
  return response.json();
}

export async function exportPdf(projectId: string, templateId?: string): Promise<Blob> {
  const response = await apiFetch(`/export/${projectId}/pdf`, {
    method: 'POST',
    body: JSON.stringify({ templateId }),
  });
  const buffer = await response.arrayBuffer();
  return new Blob([buffer], { type: 'application/pdf' });
}

export async function listTemplates(): Promise<TemplateT[]> {
  const response = await apiFetch('/templates');
  return response.json();
}

export async function recommendTemplates(projectId: string): Promise<TemplateT[]> {
  const response = await apiFetch(`/templates/recommend/${projectId}`);
  return response.json();
}
