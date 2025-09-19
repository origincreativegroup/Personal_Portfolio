const STORAGE_KEY = 'openai.credentials'

export type OpenAICredentialsInput = {
  apiKey: string
}

export type StoredOpenAICredentials = OpenAICredentialsInput & {
  savedAt: string
}

let memoryStore: StoredOpenAICredentials | null = null

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const resolveLocalStorage = (): StorageLike | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
  } catch (_error) {
    // Accessing window.localStorage can throw in some sandboxed environments.
  }

  if (typeof globalThis !== 'undefined') {
    const candidate = (globalThis as unknown as { localStorage?: StorageLike }).localStorage
    if (candidate && typeof candidate.getItem === 'function') {
      return candidate
    }
  }

  return null
}

const parseStoredValue = (raw: string | null): StoredOpenAICredentials | null => {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredOpenAICredentials>
    if (typeof parsed.apiKey === 'string') {
      return {
        apiKey: parsed.apiKey,
        savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
      }
    }
  } catch (_error) {
    // Ignore malformed entries and treat them as missing credentials.
  }

  return null
}

export const loadOpenAICredentials = (): StoredOpenAICredentials | null => {
  const storage = resolveLocalStorage()

  if (storage) {
    const raw = storage.getItem(STORAGE_KEY)
    const parsed = parseStoredValue(raw)
    if (parsed) {
      memoryStore = parsed
      return parsed
    }
  }

  return memoryStore
}

export const saveOpenAICredentials = (
  credentials: OpenAICredentialsInput,
): StoredOpenAICredentials => {
  const normalized: StoredOpenAICredentials = {
    apiKey: credentials.apiKey,
    savedAt: new Date().toISOString(),
  }

  const storage = resolveLocalStorage()

  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  }

  memoryStore = normalized
  return normalized
}

export const clearOpenAICredentials = (): void => {
  const storage = resolveLocalStorage()

  if (storage) {
    storage.removeItem(STORAGE_KEY)
  }

  memoryStore = null
}

export const hasOpenAICredentials = (): boolean => {
  return loadOpenAICredentials() !== null
}
