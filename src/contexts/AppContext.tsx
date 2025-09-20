import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'

type ThemePreference = 'light' | 'dark'

type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface Notification {
  id: string
  type: NotificationType
  message: string
  timestamp: number
}

interface User {
  id: string
  name?: string
  preferences?: {
    theme: ThemePreference | 'system'
    notifications: boolean
  }
}

interface AppState {
  user: User | null
  isLoading: boolean
  error: string | null
  theme: ThemePreference
  notifications: Notification[]
  sidebarOpen: boolean
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_THEME'; payload: ThemePreference }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; payload: boolean }

const NOTIFICATION_DISMISS_MS = 5000

const initialState: AppState = {
  user: null,
  isLoading: false,
  error: null,
  theme: 'light',
  notifications: [],
  sidebarOpen: true,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] }
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification.id !== action.payload),
      }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.payload }
    default:
      return state
  }
}

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setUser: (user: User | null) => void
  setTheme: (theme: ThemePreference) => void
  addNotification: (type: NotificationType, message: string) => void
  removeNotification: (id: string) => void
  toggleSidebar: () => void
  setSidebar: (open: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

function createNotificationId() {
  if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID()
  }

  return Date.now().toString()
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const notificationTimeouts = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const setLoading = useCallback(
    (loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading })
    },
    [dispatch],
  )

  const setError = useCallback(
    (error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error })
    },
    [dispatch],
  )

  const setUser = useCallback(
    (user: User | null) => {
      dispatch({ type: 'SET_USER', payload: user })
    },
    [dispatch],
  )

  const applyTheme = useCallback(
    (theme: ThemePreference) => {
      dispatch({ type: 'SET_THEME', payload: theme })

      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', theme === 'dark')
      }
    },
    [dispatch],
  )

  const setTheme = useCallback(
    (theme: ThemePreference) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('theme', theme)
      }
      applyTheme(theme)
    },
    [applyTheme],
  )

  const addNotification = useCallback(
    (type: NotificationType, message: string) => {
      const notification: Notification = {
        id: createNotificationId(),
        type,
        message,
        timestamp: Date.now(),
      }

      dispatch({ type: 'ADD_NOTIFICATION', payload: notification })

      const timeoutId = setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id })
        notificationTimeouts.current.delete(notification.id)
      }, NOTIFICATION_DISMISS_MS)

      notificationTimeouts.current.set(notification.id, timeoutId)
    },
    [dispatch],
  )

  const removeNotification = useCallback(
    (id: string) => {
      const timeoutId = notificationTimeouts.current.get(id)
      if (timeoutId) {
        clearTimeout(timeoutId)
        notificationTimeouts.current.delete(id)
      }

      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
    },
    [dispatch],
  )

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' })
  }, [dispatch])

  const setSidebar = useCallback(
    (open: boolean) => {
      dispatch({ type: 'SET_SIDEBAR', payload: open })
    },
    [dispatch],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const savedTheme = window.localStorage?.getItem('theme') as ThemePreference | null

    if (savedTheme === 'light' || savedTheme === 'dark') {
      applyTheme(savedTheme)
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (event: MediaQueryListEvent) => {
      applyTheme(event.matches ? 'dark' : 'light')
    }

    applyTheme(mediaQuery.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [applyTheme])

  useEffect(() => {
    return () => {
      notificationTimeouts.current.forEach(timeoutId => {
        clearTimeout(timeoutId)
      })
      notificationTimeouts.current.clear()
    }
  }, [])

  const value = useMemo(
    () => ({
      state,
      dispatch,
      setLoading,
      setError,
      setUser,
      setTheme,
      addNotification,
      removeNotification,
      toggleSidebar,
      setSidebar,
    }),
    [state, setLoading, setError, setUser, setTheme, addNotification, removeNotification, toggleSidebar, setSidebar],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export type {
  User,
  AppState,
  AppAction,
  Notification,
  NotificationType,
  ThemePreference,
}
