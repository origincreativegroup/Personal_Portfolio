import React, { useEffect } from 'react';
import { apiBaseUrl } from '../api/client';
import { useAuth } from './AuthContext';
import queryClient from '../state/queryClient';

const eventTypes = ['project.created', 'project.updated', 'project.deleted', 'project.revision', 'analysis.triggered'] as const;

type ProjectEvent = {
  workspaceId: string;
  projectId: string;
  type: (typeof eventTypes)[number];
  actorId: string;
  data?: Record<string, unknown>;
  revisionId?: string;
};

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, accessToken, activeWorkspaceId } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !activeWorkspaceId) {
      return;
    }

    const streamUrl = `${apiBaseUrl}/sync/workspaces/${activeWorkspaceId}/stream?access_token=${encodeURIComponent(accessToken)}`;
    const eventSource = new EventSource(streamUrl, { withCredentials: true });

    const invalidateProject = (projectId: string) => {
      queryClient.invalidateQueries({ queryKey: ['projects', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['project', activeWorkspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-revisions', activeWorkspaceId, projectId] });
    };

    const listeners = eventTypes.map((type) => {
      const handler = (event: MessageEvent<string>) => {
        try {
          const payload: ProjectEvent = JSON.parse(event.data);
          if (payload.projectId) {
            invalidateProject(payload.projectId);
          } else {
            queryClient.invalidateQueries({ queryKey: ['projects', activeWorkspaceId] });
          }
        } catch (error) {
          console.warn('Failed to process sync event', error);
        }
      };
      eventSource.addEventListener(type, handler);
      return { type, handler };
    });

    eventSource.onerror = () => {
      eventSource.close();
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['projects', activeWorkspaceId] });
      }, 1000);
    };

    return () => {
      listeners.forEach(({ type, handler }) => eventSource.removeEventListener(type, handler));
      eventSource.close();
    };
  }, [isAuthenticated, accessToken, activeWorkspaceId]);

  return <>{children}</>;
};

export default SyncProvider;
