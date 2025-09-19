import type { GrapesNamespace } from '../types/grapes'

const GRAPES_SCRIPT_URL = 'https://unpkg.com/grapesjs@0.22.5/dist/grapes.min.js'
const GRAPES_STYLE_URL = 'https://unpkg.com/grapesjs@0.22.5/dist/css/grapes.min.css'

let loadPromise: Promise<GrapesNamespace> | null = null

const loadScript = (url: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-grapesjs]')
    if (existing) {
      if (existing.dataset.grapesjsLoaded === 'true') {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load GrapesJS script')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = url
    script.async = true
    script.dataset.grapesjs = 'true'
    script.onload = () => {
      script.dataset.grapesjsLoaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error('Failed to load GrapesJS script'))
    document.head.appendChild(script)
  })

const ensureStylesheet = (url: string) => {
  if (document.querySelector('link[data-grapesjs]')) {
    return
  }
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  link.dataset.grapesjs = 'true'
  document.head.appendChild(link)
}

export const ensureGrapesJS = async (): Promise<GrapesNamespace> => {
  if (typeof window === 'undefined') {
    throw new Error('GrapesJS requires a browser environment')
  }

  if (window.grapesjs) {
    return window.grapesjs
  }

  if (!loadPromise) {
    ensureStylesheet(GRAPES_STYLE_URL)
    loadPromise = (async () => {
      await loadScript(GRAPES_SCRIPT_URL)
      if (!window.grapesjs) {
        throw new Error('GrapesJS failed to initialize')
      }
      return window.grapesjs
    })()
  }

  return loadPromise
}
