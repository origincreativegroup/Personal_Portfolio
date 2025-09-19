import React from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from '../context/AuthContext'

const mockListProjects = vi.fn(async () => [])
const mockClearProjects = vi.fn(async () => undefined)

vi.mock('../utils/storageManager', () => ({
  storageManager: {
    listProjects: mockListProjects,
    clearAllProjects: mockClearProjects,
  },
}))

const sessionResponse = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Portfolio User' },
  accessToken: 'access-token',
  activeWorkspaceId: 'ws-1',
  workspaces: [
    { id: 'ws-1', name: 'Design', slug: 'design', role: 'OWNER' },
  ],
}

const loginResponse = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Portfolio User' },
  accessToken: 'new-token',
  activeWorkspaceId: 'ws-1',
  workspaces: sessionResponse.workspaces,
}

const renderWithAuth = () => {
  const TestComponent = () => {
    const auth = useAuth()
    return (
      <div>
        <span data-testid="status">{auth.status}</span>
        <span data-testid="email">{auth.user?.email ?? 'none'}</span>
      </div>
    )
  }

  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>,
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('refreshes session on mount', async () => {
    global.fetch = vi.fn().mockImplementation((input: RequestInfo, init?: RequestInit) => {
      if (typeof input === 'string' && input.endsWith('/auth/refresh')) {
        return Promise.resolve(new Response(JSON.stringify(sessionResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }))
      }
      throw new Error(`Unexpected fetch call to ${String(input)} ${JSON.stringify(init)}`)
    }) as unknown as typeof fetch

    renderWithAuth()

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated')
    })
    expect(screen.getByTestId('email').textContent).toBe('user@example.com')
    expect(mockListProjects).toHaveBeenCalled()
  })

  it('logs in and migrates legacy projects', async () => {
    mockListProjects.mockResolvedValueOnce([
      { id: 'legacy', name: 'Legacy project' },
    ])

    const fetchMock = vi.fn().mockImplementation((input: RequestInfo, init?: RequestInit) => {
      if (typeof input === 'string' && input.endsWith('/auth/refresh')) {
        return Promise.resolve(new Response('Unauthorized', { status: 401 }))
      }
      if (typeof input === 'string' && input.endsWith('/auth/login')) {
        return Promise.resolve(new Response(JSON.stringify(loginResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }))
      }
      if (typeof input === 'string' && input.includes('/import/legacy')) {
        return Promise.resolve(new Response(JSON.stringify({ imported: 1 }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }))
      }
      throw new Error(`Unexpected fetch call to ${String(input)} ${JSON.stringify(init)}`)
    })

    global.fetch = fetchMock as unknown as typeof fetch

    const TestLogin = () => {
      const auth = useAuth()
      return (
        <button
          type="button"
          onClick={() => auth.login('user@example.com', 'password')}
        >
          Login
        </button>
      )
    }

    render(
      <AuthProvider>
        <TestLogin />
      </AuthProvider>,
    )

    await act(async () => {
      screen.getByRole('button', { name: 'Login' }).click()
    })

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), expect.any(Object))
    })

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/import/legacy'), expect.any(Object))
    expect(mockClearProjects).toHaveBeenCalled()
  })
})
