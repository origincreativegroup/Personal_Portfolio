import { describe, expect, it, vi } from 'vitest'
import type { Response } from 'express'
import { requireWorkspaceMembership } from '../src/middleware/auth'

const createResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
  return res
}

describe('requireWorkspaceMembership', () => {
  it('allows access when user belongs to workspace', () => {
    const next = vi.fn()
    const req: any = {
      params: { workspaceId: 'ws-1' },
      user: {
        id: 'user-1',
        workspaceMemberships: [
          { workspaceId: 'ws-1', role: 'CONTRIBUTOR' },
        ],
      },
    }

    const res = createResponse()
    requireWorkspaceMembership(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(req.workspace).toEqual({ id: 'ws-1', role: 'CONTRIBUTOR' })
  })

  it('rejects access when membership is missing', () => {
    const next = vi.fn()
    const req: any = {
      params: { workspaceId: 'ws-2' },
      user: {
        id: 'user-1',
        workspaceMemberships: [
          { workspaceId: 'ws-1', role: 'OWNER' },
        ],
      },
    }
    const res = createResponse()

    requireWorkspaceMembership(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: workspace access denied' })
  })
})
