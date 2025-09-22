import { useState, useCallback } from 'react'

interface SaveState {
  isSaving: boolean
  lastSaved: Date | null
  error: string | null
}

interface UseProjectSaveOptions {
  projectId: string
  autoSave?: boolean
  autoSaveInterval?: number
}

export function useProjectSave({ 
  projectId, 
  autoSave = true, 
  autoSaveInterval = 30000 
}: UseProjectSaveOptions) {
  const [saveState, setSaveState] = useState<SaveState>({
    isSaving: false,
    lastSaved: null,
    error: null
  })

  const saveToLocalStorage = useCallback((content: any) => {
    try {
      localStorage.setItem(`project-${projectId}`, JSON.stringify({
        content,
        savedAt: new Date().toISOString()
      }))
      setSaveState(prev => ({ ...prev, lastSaved: new Date() }))
      return true
    } catch (error) {
      setSaveState(prev => ({ 
        ...prev, 
        error: 'Failed to save to local storage' 
      }))
      return false
    }
  }, [projectId])

  const saveProject = useCallback(async (content: any) => {
    setSaveState(prev => ({ ...prev, isSaving: true, error: null }))

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Try API call first, fallback to localStorage
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            updatedAt: new Date().toISOString()
          })
        })

        if (!response.ok) {
          throw new Error('API save failed')
        }
      } catch (apiError) {
        // Fallback to localStorage
        console.log('API save failed, using localStorage fallback')
        saveToLocalStorage(content)
      }

      setSaveState({
        isSaving: false,
        lastSaved: new Date(),
        error: null
      })

      return true
    } catch (error) {
      setSaveState({
        isSaving: false,
        lastSaved: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }, [projectId, saveToLocalStorage])

  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(`project-${projectId}`)
      if (saved) {
        const { content, savedAt } = JSON.parse(saved)
        setSaveState(prev => ({ 
          ...prev, 
          lastSaved: new Date(savedAt) 
        }))
        return content
      }
    } catch (error) {
      setSaveState(prev => ({ 
        ...prev, 
        error: 'Failed to load from local storage' 
      }))
    }
    return null
  }, [projectId])

  // Auto-save functionality
  const autoSaveContent = useCallback((content: any) => {
    if (autoSave) {
      saveToLocalStorage(content)
    }
  }, [autoSave, saveToLocalStorage])

  return {
    ...saveState,
    saveProject,
    saveToLocalStorage,
    loadFromLocalStorage,
    autoSaveContent
  }
}
