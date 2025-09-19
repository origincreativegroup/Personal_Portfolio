import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import IntakeForm from '../intake/IntakeForm'
import { ProjectMeta } from '../intake/schema'
import { saveProject, listProjects, getStorageUsage, clearAllProjects, getProjectSizes, storageManager } from '../utils/storageManager'
import SavedProjectsList from '../components/SavedProjectsList'

export default function IntakePage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectMeta[]>([])
  const [storageError, setStorageError] = useState<string | null>(null)
  const [showStorageInfo, setShowStorageInfo] = useState(false)
  const [storageType, setStorageType] = useState<'localStorage' | 'indexedDB'>('localStorage')

  // Load projects on mount
  useEffect(() => {
    const loadInitialProjects = async () => {
      try {
        const projectList = await listProjects()
        setProjects(projectList)
        setStorageType(storageManager.getStorageType())
      } catch (error) {
        console.error('Failed to load projects:', error)
      }
    }
    loadInitialProjects()
  }, [])

  const handleComplete = async (meta: ProjectMeta) => {
    setStorageError(null) // Clear any previous error
    try {
      await saveProject(meta)
      const updatedProjects = await listProjects()
      setProjects(updatedProjects)
      navigate(`/editor/${meta.slug}`)
    } catch (error) {
      console.error('Error in handleComplete:', error)
      if (error instanceof Error && error.message.includes('Storage quota exceeded')) {
        setStorageError(error.message)
        setShowStorageInfo(true)
      } else {
        setStorageError(`Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const handleProjectDeleted = async () => {
    const updatedProjects = await listProjects()
    setProjects(updatedProjects)
    setStorageError(null) // Clear error after deletion
  }

  const handleClearAllProjects = async () => {
    if (confirm('Are you sure you want to delete ALL projects? This action cannot be undone.')) {
      await clearAllProjects()
      setProjects([])
      setStorageError(null)
      setShowStorageInfo(false)
    }
  }

  const getStorageInfo = async () => {
    const usage = await getStorageUsage()
    const projectSizes = await getProjectSizes()
    const capacityInfo = storageManager.getCapacityInfo()
    return { usage, projectSizes, capacityInfo }
  }

  return (
    <div className="intake-page">
      {storageError && (
        <div className="storage-error">
          <div className="storage-error__content">
            <h3>Storage Full</h3>
            <p>{storageError}</p>
            <div className="storage-error__actions">
              <button 
                type="button" 
                className="button button--primary button--small"
                onClick={() => setShowStorageInfo(true)}
              >
                Manage Storage
              </button>
              <button 
                type="button" 
                className="button button--ghost button--small"
                onClick={() => setStorageError(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="intake-page__panel intake-page__panel--form" id="new-project">
        <IntakeForm onComplete={handleComplete} />
      </section>
      <aside className="intake-page__panel intake-page__panel--saved" id="saved-projects">
        <SavedProjectsList projects={projects} onProjectDeleted={handleProjectDeleted} />
      </aside>

      {showStorageInfo && (
        <div className="modal-overlay" onClick={() => setShowStorageInfo(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Storage Management</h2>
              <button 
                type="button" 
                className="modal__close"
                onClick={() => setShowStorageInfo(false)}
              >
                ×
              </button>
            </div>
            <div className="modal__body">
              <StorageInfoContent getStorageInfo={getStorageInfo} storageType={storageType} />
            </div>
            <div className="modal__actions">
              <button
                type="button"
                className="button button--danger"
                onClick={handleClearAllProjects}
              >
                Clear All Projects
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setShowStorageInfo(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Component to handle async storage info loading
function StorageInfoContent({ getStorageInfo, storageType }: { 
  getStorageInfo: () => Promise<any>, 
  storageType: 'localStorage' | 'indexedDB' 
}) {
  const [storageInfo, setStorageInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStorageInfo = async () => {
      try {
        const info = await getStorageInfo()
        setStorageInfo(info)
      } catch (error) {
        console.error('Failed to load storage info:', error)
      } finally {
        setLoading(false)
      }
    }
    loadStorageInfo()
  }, [getStorageInfo])

  if (loading) {
    return <div>Loading storage information...</div>
  }

  if (!storageInfo) {
    return <div>Failed to load storage information</div>
  }

  const { usage, projectSizes, capacityInfo } = storageInfo

  return (
    <>
      <div className="storage-info">
        <h4>Storage Usage ({capacityInfo.type})</h4>
        <div className="storage-capacity-info">
          <p><strong>Current System:</strong> {capacityInfo.type === 'indexedDB' ? 'IndexedDB' : 'localStorage'}</p>
          <p><strong>Max Capacity:</strong> {capacityInfo.maxSize}</p>
          {storageType === 'indexedDB' && (
            <div className="storage-upgrade-notice">
              ✅ <strong>Upgraded Storage!</strong> You now have much larger storage capacity.
            </div>
          )}
        </div>
        <div className="storage-bar">
          <div 
            className="storage-bar__fill" 
            style={{ width: `${Math.min(usage.percentage, 100)}%` }}
          />
        </div>
        <p>{usage.used}MB / {usage.available}MB ({usage.percentage}% full)</p>
      </div>
      
      <div className="project-sizes">
        <h4>Largest Projects</h4>
        {projectSizes.slice(0, 5).map((project: any) => (
          <div key={project.slug} className="project-size-item">
            <span>{project.title}</span>
            <span>{project.sizeMB}</span>
          </div>
        ))}
      </div>

      <div className="storage-actions">
        <p><strong>Storage Features:</strong></p>
        <ul>
          {capacityInfo.features.map((feature: string, index: number) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
        
        <p style={{ marginTop: '1rem' }}><strong>Options to free up space:</strong></p>
        <ul>
          <li>Delete individual projects using the delete buttons</li>
          <li>Remove large assets from projects in the editor</li>
          <li>Clear all projects (nuclear option)</li>
        </ul>
      </div>
    </>
  )
}
