import { describe, expect, it } from 'vitest'
import { createAccessToken, verifyAccessToken } from '../src/utils/tokenService'

describe('tokenService', () => {
  it('creates and verifies access tokens with workspace memberships', () => {
    const token = createAccessToken({
      sub: 'user-1',
      email: 'user@example.com',
      name: 'Portfolio User',
      activeWorkspaceId: 'ws-1',
      memberships: [
        { workspaceId: 'ws-1', role: 'OWNER' },
        { workspaceId: 'ws-2', role: 'CONTRIBUTOR' },
      ],
    })

    const decoded = verifyAccessToken(token)

    expect(decoded.sub).toBe('user-1')
    expect(decoded.email).toBe('user@example.com')
    expect(decoded.memberships).toHaveLength(2)
    expect(decoded.activeWorkspaceId).toBe('ws-1')
  })
})
