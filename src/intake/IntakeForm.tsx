import React, { useId, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  FileText,
  Folder,
  Globe,
  Image,
  Plus,
  Tag,
  Upload,
  X,
} from 'lucide-react'
import { newProject, type ProjectAsset, type ProjectMeta } from './schema'
import './IntakeForm.css'

type Props = { onComplete(meta: ProjectMeta): void }

type UploadedFile = {
  name: string
  size: number
  type: string
  preview: string | null
  dataUrl: string | null
}

const steps = ['Upload File', 'Choose Project', 'Fill Template', 'Review & Publish']

const projectOptions = [
  { id: 'web-dev', name: 'Web Development', count: 5 },
  { id: 'design', name: 'UI/UX Design', count: 3 },
  { id: 'mobile', name: 'Mobile Apps', count: 2 },
]

const categories = [
  'Web Application',
  'Mobile App',
  'UI Design',
  'Branding',
  'Photography',
  'Other',
]

const initialFormState = {
  title: '',
  description: '',
  category: '',
  dateCompleted: '',
  clientName: '',
  projectUrl: '',
  technologies: '',
}

const parseList = (value: string) =>
  value
    .split(/[,;\n]+/)
    .map(entry => entry.trim())
    .filter(Boolean)

export default function IntakeForm({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [selectedProject, setSelectedProject] = useState('')
  const [formData, setFormData] = useState(initialFormState)
  const [liveMessage, setLiveMessage] = useState('')

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dropzoneDescriptionId = useId()
  const dropzoneHintId = useId()
  const dropzoneHelpId = useId()

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files?.[0]
    handleFileSelect(file)
  }

  const handleFileSelect = (file?: File) => {
    if (!file) {
      setLiveMessage('No file selected. You can continue without an upload.')
      return
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith('image/') && result ? result : null,
        dataUrl: result,
      })
      setCurrentStep(1)
      setLiveMessage(`${file.name} ready to add. Continue to choose a project.`)
    }
    reader.onerror = () => {
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        preview: null,
        dataUrl: null,
      })
      setCurrentStep(1)
      setLiveMessage(`Unable to preview ${file.name}. You can still continue to add project details.`)
    }
    reader.readAsDataURL(file)
  }

  const handleInputChange = (field: keyof typeof initialFormState, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const nextStep = () => {
    setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev))
  }

  const prevStep = () => {
    setCurrentStep(prev => (prev > 0 ? prev - 1 : prev))
  }

  const resetFlow = () => {
    setCurrentStep(0)
    setDragOver(false)
    setUploadedFile(null)
    setSelectedProject('')
    setFormData(initialFormState)
    setLiveMessage('')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const base = 1024
    const units = ['Bytes', 'KB', 'MB', 'GB']
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(base)), units.length - 1)
    const size = bytes / Math.pow(base, exponent)
    return `${size.toFixed(size >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
  }

  const getSelectedProjectName = () => {
    if (!selectedProject) return ''
    if (selectedProject === 'new') return 'New Project'
    return projectOptions.find(option => option.id === selectedProject)?.name ?? ''
  }

  const createAssetFromUpload = (file: UploadedFile): ProjectAsset | null => {
    if (!file.dataUrl) {
      return null
    }

    const identifier = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `asset-${Date.now()}-${Math.random().toString(16).slice(2)}`

    return {
      id: identifier,
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      dataUrl: file.dataUrl,
      addedAt: new Date().toISOString(),
    }
  }

  const handlePublish = () => {
    const title = formData.title.trim()
    if (!title) {
      return
    }

    const meta = newProject(title)
    meta.problem = formData.description.trim()

    const solutionParts: string[] = []
    const projectName = getSelectedProjectName()
    if (projectName) {
      solutionParts.push(`Project: ${projectName}`)
    }
    if (formData.clientName.trim()) {
      solutionParts.push(`Client: ${formData.clientName.trim()}`)
    }
    if (formData.category.trim()) {
      solutionParts.push(`Category: ${formData.category.trim()}`)
    }
    if (formData.projectUrl.trim()) {
      solutionParts.push(formData.projectUrl.trim())
    }
    meta.solution = solutionParts.join(' • ')

    const outcomes: string[] = []
    if (formData.dateCompleted) {
      const completedDate = new Date(`${formData.dateCompleted}-01`)
      outcomes.push(
        `Completed ${completedDate.toLocaleDateString(undefined, {
          month: 'long',
          year: 'numeric',
        })}`,
      )
    }
    let primaryAsset: ProjectAsset | null = null
    if (uploadedFile) {
      outcomes.push(`Primary asset: ${uploadedFile.name}`)
      primaryAsset = createAssetFromUpload(uploadedFile)
    }
    meta.outcomes = outcomes.join(' • ')

    const tagSet = new Set<string>()
    if (formData.category.trim()) {
      tagSet.add(formData.category.trim())
    }
    if (projectName) {
      tagSet.add(projectName)
    }
    const technologies = parseList(formData.technologies)
    technologies.forEach(tagSet.add, tagSet)
    if (tagSet.size > 0) {
      meta.tags = Array.from(tagSet)
    }
    if (technologies.length > 0) {
      meta.technologies = technologies
    }

    if (primaryAsset) {
      meta.assets = [primaryAsset]
    }

    onComplete(meta)
  }

  const handleSkipUpload = () => {
    setUploadedFile(null)
    setCurrentStep(1)
    setLiveMessage('Upload skipped. You can add assets later from the editor.')
  }

  const handleDropzoneKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="upload-flow">
      <header className="upload-flow__header">
        <div className="upload-flow__toolbar">
          <button
            type="button"
            onClick={prevStep}
            className="upload-flow__icon-button"
            disabled={currentStep === 0}
            aria-label="Previous step"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="upload-flow__title">Add to Portfolio</h1>
          <button
            type="button"
            onClick={resetFlow}
            className="upload-flow__icon-button"
            aria-label="Reset flow"
          >
            <X size={18} />
          </button>
        </div>

        <ol className="upload-flow__steps" aria-label="Progress">
          {steps.map((step, index) => {
            const isComplete = index < currentStep
            const isActive = index === currentStep
            return (
              <li key={step} className="upload-flow__step">
                <span
                  className={`upload-flow__step-circle${
                    isComplete
                      ? ' upload-flow__step-circle--complete'
                      : isActive
                        ? ' upload-flow__step-circle--active'
                        : ''
                  }`}
                >
                  {isComplete ? <Check size={14} /> : index + 1}
                </span>
                {index < steps.length - 1 && (
                  <span
                    className={`upload-flow__step-line${
                      index < currentStep ? ' upload-flow__step-line--complete' : ''
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span className="upload-flow__step-label">{step}</span>
              </li>
            )
          })}
        </ol>
      </header>

      <main className="upload-flow__main">
        {currentStep === 0 && (
          <div className="upload-flow__section">
            <div className="upload-flow__intro">
              <h2>Upload your work</h2>
              <p>Add images, documents, or motion assets that capture this project.</p>
            </div>

            <div
              className={`upload-flow__dropzone${dragOver ? ' upload-flow__dropzone--active' : ''}`}
              onDrop={handleDrop}
              onDragOver={event => {
                event.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={handleDropzoneKeyDown}
              aria-label="Upload file"
              aria-describedby={`${dropzoneDescriptionId} ${dropzoneHintId} ${dropzoneHelpId}`}
            >
              <Upload size={42} className="upload-flow__dropzone-icon" />
              <h3 id={dropzoneDescriptionId}>{dragOver ? 'Drop your file here' : 'Drag & drop or click to upload'}</h3>
              <p id={dropzoneHintId}>Supports JPG, PNG, PDF, MP4 and more.</p>
              <small id={dropzoneHelpId}>Maximum file size: 50MB</small>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="upload-flow__file-input"
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={event => handleFileSelect(event.target.files?.[0])}
            />

            <div className="upload-flow__option-grid">
              <button type="button" className="upload-flow__option-btn" onClick={() => fileInputRef.current?.click()}>
                <Image size={24} />
                <span>Browse images</span>
              </button>
              <button type="button" className="upload-flow__option-btn" onClick={() => fileInputRef.current?.click()}>
                <FileText size={24} />
                <span>Browse documents</span>
              </button>
            </div>

            <div className="upload-flow__helper-actions">
              <button type="button" className="upload-flow__secondary-button" onClick={handleSkipUpload}>
                Skip for now
              </button>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="upload-flow__section">
            {uploadedFile && (
              <div className="upload-flow__file-card">
                {uploadedFile.preview ? (
                  <img src={uploadedFile.preview} alt="Preview" className="upload-flow__file-thumb" />
                ) : (
                  <div className="upload-flow__file-thumb upload-flow__file-thumb--placeholder">
                    <FileText size={20} />
                  </div>
                )}
                <div className="upload-flow__file-meta">
                  <strong>{uploadedFile.name}</strong>
                  <span>{formatFileSize(uploadedFile.size)}</span>
                </div>
              </div>
            )}

            <div className="upload-flow__intro upload-flow__intro--left">
              <h2>Choose project</h2>
              <p>Add this file to an existing project or start something new.</p>
            </div>

            <div className="upload-flow__project-list">
              {projectOptions.map(option => {
                const isActive = selectedProject === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedProject(option.id)}
                    className={`upload-flow__project-btn${isActive ? ' upload-flow__project-btn--active' : ''}`}
                  >
                    <div className="upload-flow__project-body">
                      <Folder size={20} />
                      <div>
                        <p>{option.name}</p>
                        <span>{option.count} items</span>
                      </div>
                    </div>
                    <span
                      className={`upload-flow__project-indicator${isActive ? ' upload-flow__project-indicator--active' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                )
              })}

              <button
                type="button"
                onClick={() => setSelectedProject('new')}
                className={`upload-flow__project-btn upload-flow__project-btn--dashed${
                  selectedProject === 'new' ? ' upload-flow__project-btn--active' : ''
                }`}
              >
                <div className="upload-flow__project-body upload-flow__project-body--center">
                  <Plus size={20} />
                  <span>Create new project</span>
                </div>
                <span
                  className={`upload-flow__project-indicator${
                    selectedProject === 'new' ? ' upload-flow__project-indicator--active' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>

            <button
              type="button"
              onClick={nextStep}
              disabled={!selectedProject}
              className="upload-flow__primary-button upload-flow__primary-button--full"
            >
              Continue
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="upload-flow__section">
            <div className="upload-flow__intro upload-flow__intro--left">
              <h2>Project details</h2>
              <p>Give us the essentials so you can publish with confidence.</p>
            </div>

            <div className="upload-flow__form">
              <label className="upload-flow__field">
                <span>Project title *</span>
                <input
                  type="text"
                  value={formData.title}
                  onChange={event => handleInputChange('title', event.target.value)}
                  placeholder="E-commerce mobile app redesign"
                  className="upload-flow__input"
                  required
                />
              </label>

              <label className="upload-flow__field">
                <span>Description</span>
                <textarea
                  value={formData.description}
                  onChange={event => handleInputChange('description', event.target.value)}
                  placeholder="Describe the work, challenges, and impact."
                  rows={4}
                  className="upload-flow__textarea"
                />
              </label>

              <label className="upload-flow__field">
                <span>Category</span>
                <select
                  value={formData.category}
                  onChange={event => handleInputChange('category', event.target.value)}
                  className="upload-flow__select"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <div className="upload-flow__field-grid">
                <label className="upload-flow__field">
                  <span>
                    <Calendar size={16} /> Completed
                  </span>
                  <input
                    type="month"
                    value={formData.dateCompleted}
                    onChange={event => handleInputChange('dateCompleted', event.target.value)}
                    className="upload-flow__input"
                  />
                </label>

                <label className="upload-flow__field">
                  <span>
                    <Globe size={16} /> Live URL
                  </span>
                  <input
                    type="url"
                    value={formData.projectUrl}
                    onChange={event => handleInputChange('projectUrl', event.target.value)}
                    placeholder="https://..."
                    className="upload-flow__input"
                  />
                </label>
              </div>

              <label className="upload-flow__field">
                <span>
                  <Tag size={16} /> Technologies used
                </span>
                <input
                  type="text"
                  value={formData.technologies}
                  onChange={event => handleInputChange('technologies', event.target.value)}
                  placeholder="React, Node.js, Tailwind CSS"
                  className="upload-flow__input"
                />
              </label>

              <label className="upload-flow__field">
                <span>Client / Company</span>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={event => handleInputChange('clientName', event.target.value)}
                  placeholder="Company name or Personal Project"
                  className="upload-flow__input"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={nextStep}
              disabled={!formData.title.trim()}
              className="upload-flow__primary-button upload-flow__primary-button--full"
            >
              Review &amp; publish
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="upload-flow__section">
            <div className="upload-flow__intro upload-flow__intro--left">
              <h2>Review your work</h2>
              <p>Make sure everything is ready before you add it to your portfolio.</p>
            </div>

            <div className="upload-flow__review-card">
              {uploadedFile?.preview && (
                <img src={uploadedFile.preview} alt="Project preview" className="upload-flow__review-image" />
              )}

              <div className="upload-flow__review-headline">
                <h3>{formData.title || 'Untitled project'}</h3>
                {formData.description && <p>{formData.description}</p>}
              </div>

              <dl className="upload-flow__review-list">
                {getSelectedProjectName() && (
                  <div>
                    <dt>Project</dt>
                    <dd>{getSelectedProjectName()}</dd>
                  </div>
                )}
                {formData.category && (
                  <div>
                    <dt>Category</dt>
                    <dd>{formData.category}</dd>
                  </div>
                )}
                {formData.technologies && (
                  <div>
                    <dt>Technologies</dt>
                    <dd>{formData.technologies}</dd>
                  </div>
                )}
                {formData.dateCompleted && (
                  <div>
                    <dt>Completed</dt>
                    <dd>
                      {new Date(`${formData.dateCompleted}-01`).toLocaleDateString(undefined, {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </dd>
                  </div>
                )}
                {formData.clientName && (
                  <div>
                    <dt>Client</dt>
                    <dd>{formData.clientName}</dd>
                  </div>
                )}
                {formData.projectUrl && (
                  <div>
                    <dt>URL</dt>
                    <dd>{formData.projectUrl}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="upload-flow__action-grid">
              <button
                type="button"
                onClick={prevStep}
                className="upload-flow__secondary-button"
              >
                Edit details
              </button>
              <button
                type="button"
                onClick={handlePublish}
                className="upload-flow__primary-button"
                disabled={!formData.title.trim()}
              >
                Add to portfolio
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </main>

      <div className="upload-flow__sr-only" aria-live="polite">
        {liveMessage}
      </div>
    </div>
  )
}
