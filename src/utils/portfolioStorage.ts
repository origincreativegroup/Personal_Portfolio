import type { PortfolioDocument } from './portfolioTemplates'

const STORAGE_KEY = 'portfolio-forge-document'

type StoredPortfolioDocument = PortfolioDocument & { updatedAt: string }

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export const loadPortfolioDocument = (): StoredPortfolioDocument | null => {
  if (!isBrowser()) {
    return null
  }
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as Partial<StoredPortfolioDocument>
    if (!parsed || typeof parsed.html !== 'string' || typeof parsed.css !== 'string') {
      return null
    }
    return {
      html: parsed.html,
      css: parsed.css,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    }
  } catch (error) {
    console.warn('Failed to parse stored portfolio document', error)
    return null
  }
}

export const savePortfolioDocument = (document: PortfolioDocument): void => {
  if (!isBrowser()) {
    return
  }
  const payload: StoredPortfolioDocument = {
    html: document.html,
    css: document.css,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export const clearPortfolioDocument = (): void => {
  if (!isBrowser()) {
    return
  }
  window.localStorage.removeItem(STORAGE_KEY)
}
