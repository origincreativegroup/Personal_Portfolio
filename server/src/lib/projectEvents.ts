import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export type ProjectEventType =
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'project.revision'
  | 'analysis.triggered';

export interface ProjectEventPayload {
  workspaceId: string;
  projectId: string;
  type: ProjectEventType;
  actorId: string;
  data?: Record<string, unknown>;
  revisionId?: string;
  timestamp: string;
  id: string;
}

class ProjectEventBus extends EventEmitter {
  emitEvent(event: Omit<ProjectEventPayload, 'id' | 'timestamp'>): void {
    const payload: ProjectEventPayload = {
      ...event,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };
    this.emit(event.workspaceId, payload);
  }

  subscribe(workspaceId: string, listener: (event: ProjectEventPayload) => void): () => void {
    this.on(workspaceId, listener);
    return () => this.off(workspaceId, listener);
  }
}

export const projectEventBus = new ProjectEventBus();
