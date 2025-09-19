import { describe, expect, it, vi } from 'vitest'
import { projectEventBus } from '../src/lib/projectEvents'

describe('projectEventBus', () => {
  it('notifies listeners when events are emitted', () => {
    const listener = vi.fn()
    const unsubscribe = projectEventBus.subscribe('ws-1', listener)

    projectEventBus.emitEvent({
      workspaceId: 'ws-1',
      projectId: 'project-1',
      type: 'project.updated',
      actorId: 'user-1',
      data: { version: 2 },
    })

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0][0]).toMatchObject({
      projectId: 'project-1',
      data: { version: 2 },
    })

    unsubscribe()
  })
})
