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
}

type FormStatus = 'idle' | 'saved' | 'cleared' | 'error'

const initialState: FormState = {
  apiKey: '',
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
    }

    if (!normalized.apiKey) {
      setErrorMessage('Please provide your OpenAI API key before saving.')
      setStatus('error')
      return
    }

    if (!normalized.apiKey.startsWith('sk-')) {
      setErrorMessage('OpenAI API keys start with "sk-". Please check your key and try again.')
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
              Store your OpenAI API key locally so this browser can authenticate requests to the Portfolio Forge AI tools.
              Your API key never leaves your device and is only saved to your browser's local storage.
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
            <label htmlFor="openai-api-key">OpenAI API Key</label>
            <input
              id="openai-api-key"
              name="openai-api-key"
              type={showSecrets ? 'text' : 'password'}
              value={formState.apiKey}
              onChange={handleInputChange('apiKey')}
              placeholder="sk-proj-..."
              autoComplete="off"
            />
            <p className="openai-settings__field-help">
              Your API key should start with "sk-" and look like: sk-proj-1234567890abcdef...
            </p>
          </div>

          <div className="openai-settings__visibility-toggle">
            <label>
              <input
                type="checkbox"
                checked={showSecrets}
                onChange={event => setShowSecrets(event.target.checked)}
              />
              Show API key while typing
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
              disabled={!formState.apiKey}
            >
              Clear saved values
            </button>
          </div>
        </form>
      </section>

      <section className="openai-settings__card openai-settings__card--info">
        <h2>How to get your OpenAI API key</h2>
        <div className="openai-instructions">
          <div className="openai-instructions__step">
            <div className="openai-instructions__step-number">1</div>
            <div className="openai-instructions__step-content">
              <h3>Go to OpenAI Platform</h3>
              <p>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">platform.openai.com/api-keys</a></p>
            </div>
          </div>

          <div className="openai-instructions__step">
            <div className="openai-instructions__step-number">2</div>
            <div className="openai-instructions__step-content">
              <h3>Create a new secret key</h3>
              <p>Click "Create new secret key" and give it a name (like "Portfolio App")</p>
            </div>
          </div>

          <div className="openai-instructions__step">
            <div className="openai-instructions__step-number">3</div>
            <div className="openai-instructions__step-content">
              <h3>Copy your API key</h3>
              <p>Copy the key that starts with "sk-" and paste it above. Keep the OpenAI tab open until you save it here.</p>
            </div>
          </div>
        </div>

        <div className="openai-settings__tips">
          <h3>💡 Important tips</h3>
          <ul>
            <li><strong>Keep it secure:</strong> Never share your API key with others</li>
            <li><strong>Local storage:</strong> Your key stays in this browser only</li>
            <li><strong>Need to re-enter:</strong> You'll need to add it again if you clear browser data or switch devices</li>
            <li><strong>Billing:</strong> Check your usage at <a href="https://platform.openai.com/usage" target="_blank" rel="noreferrer">platform.openai.com/usage</a></li>
          </ul>
        </div>
      </section>
    </div>
  )
}
