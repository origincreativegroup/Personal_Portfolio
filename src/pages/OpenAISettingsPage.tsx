import React, { useEffect, useMemo, useState } from 'react'
import {
  clearOpenAICredentials,
  loadOpenAICredentials,
  saveOpenAICredentials,
  type StoredOpenAICredentials,
} from '../utils/openAICredentials'
import './OpenAISettingsPage.css'

type FormState = {
  apiKey: string
  apiSecret: string
}

type FormStatus = 'idle' | 'saved' | 'cleared' | 'error'

const initialState: FormState = {
  apiKey: '',
  apiSecret: '',
}

const formatTimestamp = (timestamp: string | null): string | null => {
  if (!timestamp) {
    return null
  }

  try {
    const date = new Date(timestamp)
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  } catch (_error) {
    return null
  }
}

const sanitize = (value: string): string => value.trim()

export default function OpenAISettingsPage() {
  const [formState, setFormState] = useState<FormState>(initialState)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [showSecrets, setShowSecrets] = useState(false)
  const [hasLocalChanges, setHasLocalChanges] = useState(false)

  useEffect(() => {
    const saved = loadOpenAICredentials()
    if (saved) {
      applyStoredCredentials(saved)
    }
  }, [])

  const applyStoredCredentials = (credentials: StoredOpenAICredentials) => {
    setFormState({
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
    })
    setLastSaved(credentials.savedAt)
    setHasLocalChanges(false)
  }

  const handleInputChange = (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
      setFormState(prev => ({
        ...prev,
        [field]: value,
      }))
      setHasLocalChanges(true)
      setStatus('idle')
      setErrorMessage(null)
    }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('idle')

    const normalized = {
      apiKey: sanitize(formState.apiKey),
      apiSecret: sanitize(formState.apiSecret),
    }

    if (!normalized.apiKey || !normalized.apiSecret) {
      setErrorMessage('Please provide both the API key and the API secret before saving.')
      setStatus('error')
      return
    }

    try {
      const stored = saveOpenAICredentials(normalized)
      applyStoredCredentials(stored)
      setStatus('saved')
    } catch (error) {
      console.error('Failed to persist OpenAI credentials:', error)
      setErrorMessage('Something went wrong while saving. Try again or refresh the page.')
      setStatus('error')
    }
  }

  const handleClear = () => {
    clearOpenAICredentials()
    setFormState(initialState)
    setLastSaved(null)
    setStatus('cleared')
    setErrorMessage(null)
    setHasLocalChanges(false)
  }

  const formattedSavedDate = useMemo(() => formatTimestamp(lastSaved), [lastSaved])

  return (
    <div className="openai-settings">
      <section className="openai-settings__card">
        <header className="openai-settings__header">
          <div>
            <p className="openai-settings__eyebrow">Local configuration</p>
            <h1>OpenAI credentials</h1>
            <p className="openai-settings__description">
              Store your OpenAI API key and secret locally so this browser can authenticate requests to the
              Portfolio Forge tools. These values never leave your device and are only saved to your local storage.
            </p>
          </div>
          <div className="openai-settings__meta">
            {formattedSavedDate ? (
              <span className="openai-settings__meta-item">Saved on {formattedSavedDate}</span>
            ) : (
              <span className="openai-settings__meta-item openai-settings__meta-item--muted">Not saved yet</span>
            )}
          </div>
        </header>

        <form className="openai-settings__form" onSubmit={handleSubmit}>
          <div className="openai-settings__field">
            <label htmlFor="openai-api-key">API key</label>
            <input
              id="openai-api-key"
              name="openai-api-key"
              type={showSecrets ? 'text' : 'password'}
              value={formState.apiKey}
              onChange={handleInputChange('apiKey')}
              placeholder="sk-..."
              autoComplete="off"
            />
          </div>

          <div className="openai-settings__field">
            <label htmlFor="openai-api-secret">API secret</label>
            <input
              id="openai-api-secret"
              name="openai-api-secret"
              type={showSecrets ? 'text' : 'password'}
              value={formState.apiSecret}
              onChange={handleInputChange('apiSecret')}
              placeholder="Enter your secret"
              autoComplete="off"
            />
          </div>

          <div className="openai-settings__visibility-toggle">
            <label>
              <input
                type="checkbox"
                checked={showSecrets}
                onChange={event => setShowSecrets(event.target.checked)}
              />
              Show values while typing
            </label>
          </div>

          {errorMessage && (
            <div className="openai-settings__alert openai-settings__alert--error">{errorMessage}</div>
          )}

          {status === 'saved' && !errorMessage && (
            <div className="openai-settings__alert openai-settings__alert--success">
              Your credentials have been saved to this browser.
            </div>
          )}

          {status === 'cleared' && (
            <div className="openai-settings__alert openai-settings__alert--muted">
              Stored credentials cleared from this browser.
            </div>
          )}

          <div className="openai-settings__actions">
            <button
              type="submit"
              className="button button--primary"
              disabled={!hasLocalChanges && status !== 'error'}
            >
              Save credentials
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={handleClear}
              disabled={!formState.apiKey && !formState.apiSecret}
            >
              Clear saved values
            </button>
          </div>
        </form>
      </section>

      <section className="openai-settings__card openai-settings__card--info">
        <h2>Need help locating your keys?</h2>
        <ol>
          <li>Visit the <a href="https://platform.openai.com/settings/organization/api-keys" target="_blank" rel="noreferrer">OpenAI dashboard</a>.</li>
          <li>Create a new secret key and copy both the key and secret to this page.</li>
          <li>Keep the tab open until you confirm the credentials are saved locally.</li>
        </ol>
        <p className="openai-settings__disclaimer">
          Tip: because these values only live in your browser storage, you will need to add them again if you switch
          devices or clear your browsing data.
        </p>
      </section>
    </div>
  )
}
