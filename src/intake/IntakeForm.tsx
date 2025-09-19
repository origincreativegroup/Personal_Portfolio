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
import { 
  newProject, 
  defaultTags, 
  defaultTechnologies, 
  projectRoleLabels, 
  projectStatusLabels,
  type ProjectAsset, 
  type ProjectMeta, 
  type ProjectRole, 
  type ProjectStatus,
  type ProjectLink
} from './schema'
import './IntakeForm.css'

type Props = { onComplete(meta: ProjectMeta): void }

type UploadedFile = {
  name: string
  size: number
  type: string
  preview: string | null
  dataUrl: string | null
}

const steps = ['Core Info', 'Narrative', 'Details', 'Review & Publish']

const initialFormState = {
  // Core Project Info
  title: '',
  summary: '',
  tags: '',
  
  // Narrative Hooks
  problem: '',
  solution: '',
  outcomes: '',
  
  // Details for AI Resume/Profile Integration
  role: 'other' as ProjectRole,
  technologies: '',
  collaborators: '',
  timeframe: '',
  
  // Links & References
  links: '',
  
  // Metrics & Impact
  sales: '',
  engagement: '',
  awards: '',
  metricsOther: '',
  
  // System
  status: 'draft' as ProjectStatus,
  autoGenerateNarrative: false,
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
  const [formData, setFormData] = useState(initialFormState)
  const [fileError, setFileError] = useState<string | null>(null)
  const [liveMessage, setLiveMessage] = useState<string>('')


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
      setFileError(null)
      setCurrentStep(1)
      setLiveMessage(`File ${file.name} uploaded successfully.`)
    }
    reader.onerror = () => {
      setUploadedFile(null)
      setFileError('We couldn\'t read that file. Try choosing a different file or format.')
      setLiveMessage('File upload failed. Please try again.')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  const handleInputChange = (field: keyof typeof initialFormState, value: string | boolean | ProjectRole | ProjectStatus) => {
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
    setFormData(initialFormState)
    setFileError(null)
    setLiveMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const base = 1024
    const units = ['Bytes', 'KB', 'MB', 'GB']
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(base)), units.length - 1)
    const size = bytes / Math.pow(base, exponent)
    return `${size.toFixed(size >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
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
    
    // Core Info
    meta.summary = formData.summary.trim()
    meta.tags = parseList(formData.tags)
    
    // Narrative Hooks
    meta.problem = formData.problem.trim()
    meta.solution = formData.solution.trim()
    meta.outcomes = formData.outcomes.trim()
    
    // Details
    meta.role = formData.role
    meta.status = formData.status
    meta.technologies = parseList(formData.technologies)
    meta.autoGenerateNarrative = formData.autoGenerateNarrative
    
    // Collaborators
    if (formData.collaborators.trim()) {
      meta.collaborators = parseList(formData.collaborators).map(name => ({ name }))
    }
    
    // Timeframe
    if (formData.timeframe.trim()) {
      meta.timeframe = { duration: formData.timeframe.trim() }
    }
    
    // Links
    if (formData.links.trim()) {
      meta.links = parseList(formData.links).map(url => ({
        type: 'other' as const,
        url: url.trim(),
      }))
    }
    
    // Metrics
    const metrics: any = {}
    if (formData.sales.trim()) metrics.sales = formData.sales.trim()
    if (formData.engagement.trim()) metrics.engagement = formData.engagement.trim()
    if (formData.awards.trim()) metrics.awards = parseList(formData.awards)
    if (formData.metricsOther.trim()) metrics.other = formData.metricsOther.trim()
    if (Object.keys(metrics).length > 0) {
      meta.metrics = metrics
    }

    // Add uploaded file as asset
    if (uploadedFile) {
      const primaryAsset = createAssetFromUpload(uploadedFile)
      if (primaryAsset) {
        meta.assets = [primaryAsset]
        meta.cover = primaryAsset.id // Set as hero image
      }
    }

    onComplete(meta)
  }

  const handleSkipUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setUploadedFile(null)
    setCurrentStep(1)
    setLiveMessage('Upload skipped. You can add assets later from the editor.')
  }

  const handleDropzoneKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (['Enter', ' ', 'Space', 'Spacebar'].includes(event.key)) {
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
            <div className="upload-flow__intro upload-flow__intro--left">
              <h2>Core Project Info</h2>
              <p>Start with the basics - what is this project and how would you categorize it?</p>
            </div>

            <div className="upload-flow__form">
              <label className="upload-flow__field">
                <span>Project title *</span>
                <input
                  type="text"
                  value={formData.title}
                  onChange={event => handleInputChange('title', event.target.value)}
                  placeholder="E-commerce redesign for local retailer"
                  className="upload-flow__input"
                  required
                />
              </label>

              <label className="upload-flow__field">
                <span>Short summary</span>
                <textarea
                  value={formData.summary}
                  onChange={event => handleInputChange('summary', event.target.value)}
                  placeholder="1-2 sentence overview of what you built and its impact"
                  rows={2}
                  className="upload-flow__textarea"
                />
                <small>This helps readers quickly understand your work</small>
              </label>

              <label className="upload-flow__field">
                <span>Tags/keywords</span>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={event => handleInputChange('tags', event.target.value)}
                  placeholder="ui-design, e-commerce, mobile-first"
                  className="upload-flow__input"
                />
                <small>Common tags: {defaultTags.slice(0, 5).join(', ')}</small>
              </label>

              <div className="upload-flow__hero-upload">
                <h3>Add a hero image (optional)</h3>
                <div
                  className={`upload-flow__dropzone upload-flow__dropzone--compact${dragOver ? ' upload-flow__dropzone--active' : ''}`}
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
                >
                  <Upload size={24} className="upload-flow__dropzone-icon" />
                  <span>{uploadedFile ? uploadedFile.name : 'Drop image or click to upload'}</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="upload-flow__file-input"
                  accept="image/*"
                  onChange={event => handleFileSelect(event.target.files?.[0])}
                />

                {fileError && (
                  <div className="upload-flow__error" role="alert">
                    {fileError}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={nextStep}
              disabled={!formData.title.trim()}
              className="upload-flow__primary-button upload-flow__primary-button--full"
            >
              Continue to Narrative
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {currentStep === 1 && (
          <div className="upload-flow__section">
            <div className="upload-flow__intro upload-flow__intro--left">
              <h2>Narrative Hooks</h2>
              <p>Instead of one vague description, let's break your story into three focused parts:</p>
            </div>

            <div className="upload-flow__form">
              <label className="upload-flow__field">
                <span>What was the problem you identified? *</span>
                <textarea
                  value={formData.problem}
                  onChange={event => handleInputChange('problem', event.target.value)}
                  placeholder="Users were abandoning checkout at a 67% rate due to complex multi-step process and poor mobile experience..."
                  rows={3}
                  className="upload-flow__textarea"
                  required
                />
                <small>Describe the challenge, pain point, or opportunity you discovered</small>
              </label>

              <label className="upload-flow__field">
                <span>What solution did you create? *</span>
                <textarea
                  value={formData.solution}
                  onChange={event => handleInputChange('solution', event.target.value)}
                  placeholder="Redesigned checkout flow with single-page layout, mobile-first approach, and one-click payment options..."
                  rows={3}
                  className="upload-flow__textarea"
                  required
                />
                <small>Explain your approach, key decisions, and what you built</small>
              </label>

              <label className="upload-flow__field">
                <span>What were the outcomes/impact? *</span>
                <textarea
                  value={formData.outcomes}
                  onChange={event => handleInputChange('outcomes', event.target.value)}
                  placeholder="Reduced cart abandonment to 23%, increased mobile conversions by 145%, generated additional $50K monthly revenue..."
                  rows={3}
                  className="upload-flow__textarea"
                  required
                />
                <small>Share measurable results, learnings, or long-term impact</small>
              </label>

              <label className="upload-flow__field">
                <span>
                  <input
                    type="checkbox"
                    checked={formData.autoGenerateNarrative}
                    onChange={event => handleInputChange('autoGenerateNarrative', event.target.checked)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Auto-generate draft narrative after upload
                </span>
                <small>AI will create a polished case study narrative from your responses</small>
              </label>
            </div>

            <button
              type="button"
              onClick={nextStep}
              disabled={!formData.problem.trim() || !formData.solution.trim() || !formData.outcomes.trim()}
              className="upload-flow__primary-button upload-flow__primary-button--full"
            >
              Continue to Details
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="upload-flow__section">
            <div className="upload-flow__intro upload-flow__intro--left">
              <h2>Project Details</h2>
              <p>Add details for AI resume/profile integration and portfolio organization.</p>
            </div>

            <div className="upload-flow__form">
              <div className="upload-flow__field-grid">
                <label className="upload-flow__field">
                  <span>Your role in project</span>
                  <select
                    value={formData.role}
                    onChange={event => handleInputChange('role', event.target.value as ProjectRole)}
                    className="upload-flow__select"
                  >
                    {Object.entries(projectRoleLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="upload-flow__field">
                  <span>Project status</span>
                  <select
                    value={formData.status}
                    onChange={event => handleInputChange('status', event.target.value as ProjectStatus)}
                    className="upload-flow__select"
                  >
                    {Object.entries(projectStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="upload-flow__field">
                <span>Tools and technologies used</span>
                <input
                  type="text"
                  value={formData.technologies}
                  onChange={event => handleInputChange('technologies', event.target.value)}
                  placeholder="React, Figma, TypeScript, PostgreSQL"
                  className="upload-flow__input"
                />
                <small>Popular tools: {defaultTechnologies.slice(0, 6).join(', ')}</small>
              </label>

              <div className="upload-flow__field-grid">
                <label className="upload-flow__field">
                  <span>Collaborators/teams</span>
                  <input
                    type="text"
                    value={formData.collaborators}
                    onChange={event => handleInputChange('collaborators', event.target.value)}
                    placeholder="Sarah Chen, Dev Team, Marketing"
                    className="upload-flow__input"
                  />
                </label>

                <label className="upload-flow__field">
                  <span>Timeframe</span>
                  <input
                    type="text"
                    value={formData.timeframe}
                    onChange={event => handleInputChange('timeframe', event.target.value)}
                    placeholder="3 months, Q1 2024, ongoing"
                    className="upload-flow__input"
                  />
                </label>
              </div>

              <label className="upload-flow__field">
                <span>Links (demo, GitHub, etc.)</span>
                <input
                  type="text"
                  value={formData.links}
                  onChange={event => handleInputChange('links', event.target.value)}
                  placeholder="https://demo.com, https://github.com/user/repo"
                  className="upload-flow__input"
                />
              </label>

              <div className="upload-flow__metrics-section">
                <h3>Metrics & Impact (optional)</h3>
                <div className="upload-flow__field-grid">
                  <label className="upload-flow__field">
                    <span>Sales/Revenue impact</span>
                    <input
                      type="text"
                      value={formData.sales}
                      onChange={event => handleInputChange('sales', event.target.value)}
                      placeholder="$50K increase, 25% revenue boost"
                      className="upload-flow__input"
                    />
                  </label>

                  <label className="upload-flow__field">
                    <span>Engagement/Usage metrics</span>
                    <input
                      type="text"
                      value={formData.engagement}
                      onChange={event => handleInputChange('engagement', event.target.value)}
                      placeholder="45% user engagement increase"
                      className="upload-flow__input"
                    />
                  </label>
                </div>

                <label className="upload-flow__field">
                  <span>Awards/Recognition</span>
                  <input
                    type="text"
                    value={formData.awards}
                    onChange={event => handleInputChange('awards', event.target.value)}
                    placeholder="Webby Award 2024, Design Excellence"
                    className="upload-flow__input"
                  />
                </label>

                <label className="upload-flow__field">
                  <span>Other measurable impact</span>
                  <input
                    type="text"
                    value={formData.metricsOther}
                    onChange={event => handleInputChange('metricsOther', event.target.value)}
                    placeholder="500K downloads, featured on Product Hunt"
                    className="upload-flow__input"
                  />
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={nextStep}
              className="upload-flow__primary-button upload-flow__primary-button--full"
            >
              Review & Publish
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
                {formData.summary && <p>{formData.summary}</p>}
              </div>

              <dl className="upload-flow__review-list">
                <div>
                  <dt>Role</dt>
                  <dd>{projectRoleLabels[formData.role]}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{projectStatusLabels[formData.status]}</dd>
                </div>
                {formData.tags && (
                  <div>
                    <dt>Tags</dt>
                    <dd>{formData.tags}</dd>
                  </div>
                )}
                {formData.technologies && (
                  <div>
                    <dt>Technologies</dt>
                    <dd>{formData.technologies}</dd>
                  </div>
                )}
                {formData.collaborators && (
                  <div>
                    <dt>Collaborators</dt>
                    <dd>{formData.collaborators}</dd>
                  </div>
                )}
                {formData.timeframe && (
                  <div>
                    <dt>Timeframe</dt>
                    <dd>{formData.timeframe}</dd>
                  </div>
                )}
                {formData.links && (
                  <div>
                    <dt>Links</dt>
                    <dd>{formData.links}</dd>
                  </div>
                )}
                {(formData.sales || formData.engagement || formData.awards || formData.metricsOther) && (
                  <div>
                    <dt>Impact</dt>
                    <dd>
                      {[formData.sales, formData.engagement, formData.awards, formData.metricsOther]
                        .filter(Boolean)
                        .join(' • ')}
                    </dd>
                  </div>
                )}
                {formData.autoGenerateNarrative && (
                  <div>
                    <dt>AI Features</dt>
                    <dd>Auto-generate narrative enabled</dd>
                  </div>
                )}
              </dl>

              <div className="upload-flow__narrative-preview">
                <h4>Project Narrative</h4>
                <div className="upload-flow__narrative-sections">
                  <div>
                    <strong>Problem:</strong> {formData.problem || 'Not specified'}
                  </div>
                  <div>
                    <strong>Solution:</strong> {formData.solution || 'Not specified'}
                  </div>
                  <div>
                    <strong>Outcomes:</strong> {formData.outcomes || 'Not specified'}
                  </div>
                </div>
              </div>
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

      <div className="upload-flow__sr-only" aria-live="polite" role="status">
        {liveMessage}
      </div>
    </div>
  )
}
