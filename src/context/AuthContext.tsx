import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { request } from '../api/client';
import { storageManager } from '../utils/storageManager';

type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string | null;
  role: string;
};

type UserSession = {
  id: string;
  email: string;
  name: string | null;
};

type SessionResponse = {
  user: UserSession;
  accessToken: string;
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string;
};

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: AuthStatus;
  user: UserSession | null;
  accessToken: string | null;
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, workspaceId?: string) => Promise<void>;
  signup: (params: { email: string; password: string; name?: string; workspaceName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (input: { name: string; slug?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'pf.accessToken';

const persistAccessToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

const useLegacyMigration = () => {
  const [migratedUsers, setMigratedUsers] = useState<Set<string>>(() => new Set());

  return useCallback(async (userId: string, workspaceId: string, token: string) => {
    if (!workspaceId || migratedUsers.has(userId)) {
      return;
    }

    const migrationKey = `legacy-migrated:${userId}`;
    if (localStorage.getItem(migrationKey) === 'true') {
      setMigratedUsers((current) => new Set(current).add(userId));
      return;
    }

    try {
      const projects = await storageManager.listProjects();
      if (projects.length === 0) {
        localStorage.setItem(migrationKey, 'true');
        setMigratedUsers((current) => new Set(current).add(userId));
        return;
      }

      await request(`/workspaces/${workspaceId}/import/legacy`, {
        method: 'POST',
        body: JSON.stringify({ projects }),
      }, token);

      await storageManager.clearAllProjects();
      localStorage.setItem(migrationKey, 'true');
      setMigratedUsers((current) => new Set(current).add(userId));
    } catch (error) {
      console.warn('Legacy project migration failed', error);
    }
  }, [migratedUsers]);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserSession | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  const migrateLegacyProjects = useLegacyMigration();

  const applySession = useCallback(async (session: SessionResponse) => {
    setUser(session.user);
    setAccessToken(session.accessToken);
    setWorkspaces(session.workspaces);
    setActiveWorkspaceId(session.activeWorkspaceId);
    persistAccessToken(session.accessToken);
    setStatus('authenticated');
    await migrateLegacyProjects(session.user.id, session.activeWorkspaceId, session.accessToken);
  }, [migrateLegacyProjects]);

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setWorkspaces([]);
    setActiveWorkspaceId(null);
    persistAccessToken(null);
    setStatus('unauthenticated');
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const session = await request<SessionResponse>('/auth/refresh', { method: 'POST' }, accessToken ?? localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined);
      await applySession(session);
    } catch {
      clearSession();
    }
  }, [accessToken, applySession, clearSession]);

  useEffect(() => {
    const init = async () => {
      try {
        const session = await request<SessionResponse>('/auth/refresh', { method: 'POST' });
        await applySession(session);
      } catch {
        clearSession();
      }
    };

    init();
  }, [applySession, clearSession]);

  const login = useCallback(async (email: string, password: string, workspaceId?: string) => {
    const session = await request<SessionResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, workspaceId }),
    });
    await applySession(session);
  }, [applySession]);

  const signup = useCallback(async ({ email, password, name, workspaceName }: { email: string; password: string; name?: string; workspaceName?: string }) => {
    const session = await request<SessionResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, workspaceName }),
    });
    await applySession(session);
  }, [applySession]);

  const logout = useCallback(async () => {
    try {
      await request('/auth/logout', { method: 'POST' }, accessToken ?? undefined);
    } catch {
      // ignore network errors during logout
    }
    clearSession();
  }, [accessToken, clearSession]);

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    if (!workspaceId) return;
    const session = await request<Pick<SessionResponse, 'accessToken' | 'activeWorkspaceId'>>(`/workspaces/${workspaceId}/switch`, {
      method: 'POST',
    }, accessToken ?? undefined);

    setActiveWorkspaceId(session.activeWorkspaceId);
    setAccessToken(session.accessToken);
    persistAccessToken(session.accessToken);

    if (user) {
      await migrateLegacyProjects(user.id, session.activeWorkspaceId, session.accessToken);
    }
  }, [accessToken, migrateLegacyProjects, user]);

  const createWorkspace = useCallback(async ({ name, slug }: { name: string; slug?: string }) => {
    const session = await request<SessionResponse>('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name, slug }),
    }, accessToken ?? undefined);
    await applySession(session);
  }, [accessToken, applySession]);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user,
    accessToken,
    workspaces,
    activeWorkspaceId,
    isAuthenticated: status === 'authenticated' && Boolean(user && accessToken),
    login,
    signup,
    logout,
    refreshSession,
    switchWorkspace,
    createWorkspace,
  }), [status, user, accessToken, workspaces, activeWorkspaceId, login, signup, logout, refreshSession, switchWorkspace, createWorkspace]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
