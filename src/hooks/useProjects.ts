import { useMutation, useQuery, useQueryClient } from '../state/queryClient';
import { useState } from 'react';
import type { ApiError, ProjectPayload } from '../api/client';
import { request } from '../api/client';
import { useAuth } from '../context/AuthContext';

export type Project = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  template: string | null;
  color: string;
  visibility: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ProjectResponse = {
  project: Project;
  version: number;
  revisionId?: string;
  latestRevision?: unknown;
};

export type ConflictResolution = {
  latest?: ProjectResponse;
  reason?: string;
};

export const useProjects = () => {
  const { activeWorkspaceId, accessToken } = useAuth();

  return useQuery({
    queryKey: ['projects', activeWorkspaceId],
    enabled: Boolean(activeWorkspaceId && accessToken),
    queryFn: async () => {
      if (!activeWorkspaceId) return [] as Project[];
      const response = await request<{ projects: Project[] }>(`/workspaces/${activeWorkspaceId}/projects`, {}, accessToken ?? undefined);
      return response.projects;
    },
  });
};

export const useProject = (projectId?: string) => {
  const { activeWorkspaceId, accessToken } = useAuth();

  return useQuery({
    queryKey: ['project', activeWorkspaceId, projectId],
    enabled: Boolean(activeWorkspaceId && accessToken && projectId),
    queryFn: async () => {
      if (!activeWorkspaceId || !projectId) throw new Error('projectId required');
      const response = await request<ProjectResponse>(`/workspaces/${activeWorkspaceId}/projects/${projectId}`, {}, accessToken ?? undefined);
      return response.project;
    },
  });
};

export const useCreateProject = () => {
  const { activeWorkspaceId, accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProjectPayload) => {
      if (!activeWorkspaceId) throw new Error('Workspace not selected');
      return request<ProjectResponse>(`/workspaces/${activeWorkspaceId}/projects`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, accessToken ?? undefined);
    },
    onMutate: async (payload) => {
      if (!activeWorkspaceId) return { previous: undefined as Project[] | undefined };
      await queryClient.cancelQueries({ queryKey: ['projects', activeWorkspaceId] });
      const previous = queryClient.getQueryData<Project[]>(['projects', activeWorkspaceId]);

      const optimistic: Project = {
        id: `temp-${Date.now()}`,
        name: payload.name,
        description: payload.description ?? null,
        category: payload.category ?? null,
        template: payload.template ?? null,
        color: payload.color ?? '#5a3cf4',
        visibility: payload.visibility ?? 'PRIVATE',
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };

      queryClient.setQueryData<Project[]>(['projects', activeWorkspaceId], (projects = []) => [optimistic, ...projects]);

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (!context || !activeWorkspaceId) return;
      if (context.previous) {
        queryClient.setQueryData(['projects', activeWorkspaceId], context.previous);
      }
    },
    onSuccess: (response, _variables) => {
      if (!activeWorkspaceId) return;
      queryClient.setQueryData<Project[]>(['projects', activeWorkspaceId], (projects = []) => {
        const filtered = projects.filter((project) => !project.id.startsWith('temp-'));
        return [response.project, ...filtered];
      });
    },
  });
};

export const useUpdateProject = () => {
  const { activeWorkspaceId, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [conflict, setConflict] = useState<ConflictResolution | null>(null);

  const mutation = useMutation({
    mutationFn: async (input: ProjectPayload & { id: string; version: number; summary?: string }) => {
      if (!activeWorkspaceId) throw new Error('Workspace not selected');
      const { id, ...payload } = input;
      return request<ProjectResponse>(`/workspaces/${activeWorkspaceId}/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }, accessToken ?? undefined);
    },
    onMutate: async (input) => {
      if (!activeWorkspaceId) return { previous: undefined as Project | undefined };
      setConflict(null);
      await queryClient.cancelQueries({ queryKey: ['projects', activeWorkspaceId] });
      const previousProjects = queryClient.getQueryData<Project[]>(['projects', activeWorkspaceId]);
      const previousProject = queryClient.getQueryData<Project>(['project', activeWorkspaceId, input.id]);

      if (previousProjects) {
        queryClient.setQueryData<Project[]>(['projects', activeWorkspaceId], (projects = []) =>
          projects.map((project) =>
            project.id === input.id
              ? {
                  ...project,
                  ...input,
                  updatedAt: new Date().toISOString(),
                }
              : project,
          ),
        );
      }

      if (previousProject) {
        queryClient.setQueryData<Project>(['project', activeWorkspaceId, input.id], {
          ...previousProject,
          ...input,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousProjects, previousProject };
    },
    onSuccess: (response) => {
      if (!activeWorkspaceId) return;
      queryClient.invalidateQueries({ queryKey: ['projects', activeWorkspaceId] });
      queryClient.setQueryData<Project>(['project', activeWorkspaceId, response.project.id], response.project);
    },
    onError: (error, input, context) => {
      if (!activeWorkspaceId) return;
      if ((error as ApiError).status === 409) {
        const payload = (error as ApiError).data as { latest?: ProjectResponse } | undefined;
        setConflict({ latest: payload?.latest, reason: 'Server has newer version' });
      }
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', activeWorkspaceId], context.previousProjects);
      }
      if (context?.previousProject) {
        queryClient.setQueryData(['project', activeWorkspaceId, input.id], context.previousProject);
      }
    },
  });

  return { ...mutation, conflict, resetConflict: () => setConflict(null) };
};

export const useDeleteProject = () => {
  const { activeWorkspaceId, accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      if (!activeWorkspaceId) throw new Error('Workspace not selected');
      await request(`/workspaces/${activeWorkspaceId}/projects/${projectId}`, {
        method: 'DELETE',
      }, accessToken ?? undefined);
      return projectId;
    },
    onSuccess: (projectId) => {
      if (!activeWorkspaceId) return;
      queryClient.setQueryData<Project[]>(['projects', activeWorkspaceId], (projects = []) =>
        projects.filter((project) => project.id !== projectId),
      );
      queryClient.removeQueries({ queryKey: ['project', activeWorkspaceId, projectId] });
    },
  });
};
