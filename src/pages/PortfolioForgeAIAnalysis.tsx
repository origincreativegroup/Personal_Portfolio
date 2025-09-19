import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Edit3,
  File as FileIcon,
  FileText,
  Image,
  Lightbulb,
  MessageSquare,
  Moon,
  Music,
  RefreshCw,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Video,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import './PortfolioForgeAIAnalysis.css'
import PortfolioHierarchy from '../components/PortfolioHierarchy'

const stripTrailingSlashes = (value: string): string => value.replace(/\/+$/, '')

const resolveApiBaseUrl = (): string => {
  const configured = import.meta.env.VITE_API_BASE_URL

  if (typeof configured === 'string' && configured.trim().length > 0) {
    return stripTrailingSlashes(configured.trim())
  }

  if (typeof window !== 'undefined' && window.location) {
    if (window.location.port === '5173') {
      return 'http://localhost:3001'
    }

    return stripTrailingSlashes(window.location.origin)
  }

  return 'http://localhost:3001'
}

const API_BASE_URL = resolveApiBaseUrl()
const DEFAULT_USER_ID = import.meta.env.VITE_ANALYSIS_USER_ID ?? 'demo-user'

type AnalysisStep = 'idle' | 'analyzing' | 'complete' | 'failed'

type SuggestionType = 'problem' | 'solution' | 'impact' | 'narrative'

type AnalysisSectionKey = SuggestionType

type FileStatus = 'pending' | 'processing' | 'completed' | 'failed'

type FileType = 'image' | 'video' | 'document' | 'audio' | 'other'

type FileInsight = {
  content: string
  type?: string
  confidence?: number
  source?: string
}

type AnalysisFile = {
  id: string
  name: string
  mimeType: string
  size: number
  status: FileStatus
  insights: FileInsight[]
  extractedText: string | null
  metadata: unknown
  updatedAt?: string
}

type ProblemAnalysis = {
  primary: string
  confidence: number
  evidence: string[]
  alternatives: string[]
}

type SolutionAnalysis = {
  primary: string
  confidence: number
  keyElements: string[]
  designPatterns: string[]
}

type ImpactMetric = {
  metric: string
  before: string
  after: string
  change: string
}

type ImpactAnalysis = {
  primary: string
  confidence: number
  metrics: ImpactMetric[]
  businessValue: string
}

type NarrativeAnalysis = {
  story: string
  challenges: string[]
  process: string[]
}

type AIAnalysis = {
  confidence: number
  processingTime: string
  filesAnalyzed: number
  insights: number
  problem: ProblemAnalysis
  solution: SolutionAnalysis
  impact: ImpactAnalysis
  narrative: NarrativeAnalysis
  tags: string[]
  suggestedTitle: string
  suggestedCategory: string
}

type ProjectSuggestionPayload = {
  title?: string
  category?: string
  description?: string
}

type AnalysisStatusResponse = {
  project: {
    id: string
    name: string
    description: string | null
    category: string | null
    fileCount: number
    updatedAt: string
  }
  analysis: {
    status: string
    confidence: number | null
    processingTime: number | null
    filesAnalyzed: number
    insightsFound: number
    suggestedTitle: string | null
    suggestedCategory: string | null
    suggestedTags: string[]
    updatedAt: string | null
    startedAt: string | null
  }
  fileAnalyses: Array<{
    id: string
    name: string
    mimeType: string
    size: number
    status: FileStatus
    insights: FileInsight[]
    extractedText: string | null
    metadata: unknown
    updatedAt: string | null
  }>
}

type AnalysisResultResponse = {
  confidence: number | null
  processingTime: number | null
  filesAnalyzed: number
  insights: number
  problem: {
    primary: string
    confidence: number | null
    evidence: string[]
    alternatives: string[]
  }
  solution: {
    primary: string
    confidence: number | null
    keyElements: string[]
    designPatterns: string[]
  }
  impact: {
    primary: string
    confidence: number | null
    metrics: ImpactMetric[]
    businessValue: string
  }
  narrative: {
    story: string
    challenges: string[]
    process: string[]
  }
  suggestedTitle: string
  suggestedCategory: string
  tags: string[]
}

const INITIAL_SECTIONS: Record<AnalysisSectionKey, boolean> = {
  problem: true,
  solution: false,
  impact: false,
  narrative: false,
}

const FILE_ICONS: Record<FileType, LucideIcon> = {
  image: Image,
  video: Video,
  document: FileText,
  audio: Music,
  other: FileIcon,
}

const STATUS_LABELS: Record<FileStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
}

const determineFileType = (mimeType: string): FileType => {
  const normalized = mimeType.toLowerCase()

  if (normalized.startsWith('image/')) {
    return 'image'
  }
  if (normalized.startsWith('video/')) {
    return 'video'
  }
  if (normalized.startsWith('audio/')) {
    return 'audio'
  }
  if (
    normalized.includes('pdf') ||
    normalized.includes('text') ||
    normalized.includes('word') ||
    normalized.includes('presentation') ||
    normalized.includes('sheet') ||
    normalized.includes('spreadsheet')
  ) {
    return 'document'
  }
  return 'other'
}

const describeInsight = (insight: FileInsight): string => {
  const prefix = insight.type ? `${insight.type.toUpperCase()}: ` : ''
  const content = insight.content || 'Insight'
  if (typeof insight.confidence === 'number') {
    const percent = Math.round(insight.confidence * 100)
    return `${prefix}${content} (${percent}% confidence)`
  }
  return `${prefix}${content}`
}

const formatProcessingTime = (seconds: number | null | undefined): string => {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) {
    return '—'
  }
  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(0)}ms`
  }
  return `${seconds.toFixed(seconds >= 10 ? 0 : 1)}s`
}

const computeProgress = (files: AnalysisFile[], status: string, totalFiles: number): number => {
  if (status === 'failed') {
    return 0
  }
  if (status === 'completed') {
    return 100
  }

  const total = totalFiles > 0 ? totalFiles : files.length
  if (total === 0) {
    return status === 'analyzing' ? 10 : 0
  }

  const completed = files.filter(file => file.status === 'completed').length
  const inProgress = files.filter(file => file.status === 'processing').length

  let progress = Math.round((completed / total) * 100)
  if (status === 'analyzing') {
    progress = Math.max(progress, inProgress > 0 ? 30 : 15)
    progress = Math.min(progress, 95)
  }
  return progress
}

const mapStatusFiles = (files: AnalysisStatusResponse['fileAnalyses']): AnalysisFile[] =>
  files.map(file => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: file.size,
    status: file.status,
    insights: Array.isArray(file.insights) ? file.insights : [],
    extractedText: file.extractedText,
    metadata: file.metadata,
    updatedAt: file.updatedAt ?? undefined,
  }))
const transformResult = (payload: AnalysisResultResponse): AIAnalysis => ({
  confidence: Math.round(payload.confidence ?? 0),
  processingTime: formatProcessingTime(payload.processingTime),
  filesAnalyzed: payload.filesAnalyzed,
  insights: payload.insights,
  problem: {
    primary: payload.problem.primary ?? '',
    confidence: Math.round(payload.problem.confidence ?? 0),
    evidence: Array.isArray(payload.problem.evidence) ? payload.problem.evidence : [],
    alternatives: Array.isArray(payload.problem.alternatives) ? payload.problem.alternatives : [],
  },
  solution: {
    primary: payload.solution.primary ?? '',
    confidence: Math.round(payload.solution.confidence ?? 0),
    keyElements: Array.isArray(payload.solution.keyElements) ? payload.solution.keyElements : [],
    designPatterns: Array.isArray(payload.solution.designPatterns) ? payload.solution.designPatterns : [],
  },
  impact: {
    primary: payload.impact.primary ?? '',
    confidence: Math.round(payload.impact.confidence ?? 0),
    metrics: Array.isArray(payload.impact.metrics) ? payload.impact.metrics : [],
    businessValue: payload.impact.businessValue ?? '',
  },
  narrative: {
    story: payload.narrative.story ?? '',
    challenges: Array.isArray(payload.narrative.challenges) ? payload.narrative.challenges : [],
    process: Array.isArray(payload.narrative.process) ? payload.narrative.process : [],
  },
  tags: Array.isArray(payload.tags) ? payload.tags : [],
  suggestedTitle: payload.suggestedTitle ?? '',
  suggestedCategory: payload.suggestedCategory ?? '',
})

const buildProjectDescription = (analysis: AIAnalysis, edits: Partial<Record<SuggestionType, string>>): string => {
  const narrative = (edits.narrative ?? analysis.narrative.story ?? '').trim()
  const problem = (edits.problem ?? analysis.problem.primary ?? '').trim()
  const solution = (edits.solution ?? analysis.solution.primary ?? '').trim()
  const impact = (edits.impact ?? analysis.impact.primary ?? '').trim()

  const sections: string[] = []

  if (narrative) {
    sections.push(narrative)
  }

  const summaryParts = [
    problem ? `Problem: ${problem}` : null,
    solution ? `Solution: ${solution}` : null,
    impact ? `Impact: ${impact}` : null,
  ].filter((value): value is string => Boolean(value))

  if (summaryParts.length > 0) {
    sections.push(summaryParts.join('\n'))
  }

  const metricLines = analysis.impact.metrics
    .map(metric => {
      const name = metric.metric?.trim()
      const before = metric.before?.trim()
      const after = metric.after?.trim()
      const change = metric.change?.trim()

      const parts: string[] = []
      if (name) {
        parts.push(name)
      }
      if (before || after) {
        parts.push(`${before || '—'} → ${after || '—'}`)
      }
      if (change) {
        parts.push(`(${change})`)
      }

      if (parts.length === 0) {
        return null
      }

      return `- ${parts.join(' ')}`
    })
    .filter((line): line is string => Boolean(line))

  if (metricLines.length > 0) {
    sections.push(`Key metrics:\n${metricLines.join('\n')}`)
  }

  return sections.join('\n\n').trim()
}

const extractErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const data = await response.clone().json() as { error?: unknown }
    if (data && typeof data.error === 'string') {
      return data.error
    }
  } catch {
    // Ignore JSON parsing issues
  }
  try {
    const text = await response.text()
    if (text) {
      return text
    }
  } catch {
    // Ignore
  }
  return fallback
}

const createBaseHeaders = (): HeadersInit => {
  const headers: HeadersInit = {}
  if (DEFAULT_USER_ID) {
    headers['x-user-id'] = DEFAULT_USER_ID
  }
  return headers
}

const createJsonHeaders = (baseHeaders: HeadersInit): HeadersInit => ({
  ...baseHeaders,
  'Content-Type': 'application/json',
})

type AnalysisCardProps = {
  title: string
  confidence: number
  isExpanded: boolean
  onToggle: () => void
  icon: LucideIcon
  children: ReactNode
}

const AnalysisCard = ({ title, confidence, isExpanded, onToggle, icon: Icon, children }: AnalysisCardProps) => {
  const confidenceLevel = confidence >= 90 ? 'high' : confidence >= 70 ? 'medium' : 'low'

  return (
    <section className="analysis-card analysis-panel">
      <button type="button" className="analysis-card__toggle" onClick={onToggle}>
        <div className="analysis-card__details">
          <div className="analysis-card__icon">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="analysis-card__title">{title}</h3>
            <div className="analysis-card__meta">
              <span className="analysis-card__confidence">{confidence}% confidence</span>
              <span className="analysis-card__bullet" aria-hidden="true">
                •
              </span>
              <span className="analysis-card__note">AI generated</span>
            </div>
          </div>
        </div>
        <div className="analysis-card__status">
          <span className={`analysis-card__signal analysis-card__signal--${confidenceLevel}`} aria-hidden="true" />
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </button>
      {isExpanded ? <div className="analysis-card__content">{children}</div> : null}
    </section>
  )
}

type SuggestionCardProps = {
  title: string
  content: string
  onApply: () => void
  onEdit?: () => void
  isApplied?: boolean
  disabled?: boolean
}

const SuggestionCard = ({ title, content, onApply, onEdit, isApplied, disabled }: SuggestionCardProps) => (
  <div className="analysis-suggestion">
    <div className="analysis-suggestion__header">
      <h4 className="analysis-suggestion__title">{title}</h4>
      <div className="analysis-suggestion__actions">
        {isApplied ? (
          <span className="analysis-suggestion__status">
            <CheckCircle size={14} />
            Applied
          </span>
        ) : null}
        {onEdit ? (
          <button type="button" className="analysis-icon-button" onClick={onEdit} aria-label={`Edit ${title}`}>
            <Edit3 size={16} />
          </button>
        ) : null}
        <button type="button" className="button button--primary button--small" onClick={onApply} disabled={disabled}>
          {disabled ? 'Applying…' : 'Apply'}
        </button>
      </div>
    </div>
    <p>{content}</p>
  </div>
)
export default function PortfolioForgeAIAnalysis() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('idle')
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [projectIdInput, setProjectIdInput] = useState(searchParams.get('projectId') ?? '')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(searchParams.get('projectId'))
  const [activeProject, setActiveProject] = useState<AnalysisStatusResponse['project'] | null>(null)
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisStatusResponse['analysis'] | null>(null)
  const [analysisFiles, setAnalysisFiles] = useState<AnalysisFile[]>([])
  const [analysisResult, setAnalysisResult] = useState<AIAnalysis | null>(null)
  const [queuedFiles, setQueuedFiles] = useState(0)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedSections, setExpandedSections] = useState(INITIAL_SECTIONS)
  const [customEdits, setCustomEdits] = useState<Partial<Record<SuggestionType, string>>>({})
  const [applyStatus, setApplyStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [applyMessage, setApplyMessage] = useState<string | null>(null)

  const baseHeaders = useMemo(createBaseHeaders, [])
  const jsonHeaders = useMemo(() => createJsonHeaders(baseHeaders), [baseHeaders])

  const handleHierarchyProjectSelect = useCallback((projectSlug: string) => {
    setProjectIdInput(projectSlug)
    setAnalysisError(null)
  }, [])

  const persistProjectSuggestions = useCallback(async (updates: ProjectSuggestionPayload) => {
    const targetId = selectedProjectId ?? projectIdInput.trim()
    if (!targetId) {
      setApplyStatus('error')
      setApplyMessage('Select a project before applying suggestions.')
      return false
    }

    const sanitizedEntries = (Object.entries(updates) as Array<[keyof ProjectSuggestionPayload, string | undefined]>)
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : ''] as const)
      .filter(([, value]) => value.length > 0)

    const sanitizedPayload = sanitizedEntries.reduce<ProjectSuggestionPayload>((acc, [key, value]) => {
      acc[key] = value
      return acc
    }, {})

    if (sanitizedEntries.length === 0) {
      setApplyStatus('error')
      setApplyMessage('No AI suggestions available to apply.')
      return false
    }

    setApplyStatus('saving')
    setApplyMessage('Applying suggestions...')

    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis/projects/${targetId}/analysis/apply`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          suggestions: sanitizedPayload,
        }),
      })

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Unable to apply suggestions.'))
      }

      try {
        await response.json()
      } catch {
        // Ignore empty bodies
      }

      setApplyStatus('success')
      setApplyMessage('Suggestions applied to project.')
      setActiveProject(previous => (
        previous
          ? {
              ...previous,
              name: sanitizedPayload.title ?? previous.name,
              category: sanitizedPayload.category ?? previous.category,
              description: sanitizedPayload.description ?? previous.description,
            }
          : previous
      ))

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to apply suggestions.'
      setApplyStatus('error')
      setApplyMessage(message)
      return false
    }
  }, [jsonHeaders, projectIdInput, selectedProjectId, setActiveProject, setApplyMessage, setApplyStatus])

  const fetchAnalysisStatus = useCallback(async (projectId: string): Promise<AnalysisStatusResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/analysis/projects/${projectId}/analysis`, {
      headers: baseHeaders,
    })

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, 'Unable to load analysis status.'))
    }

    return response.json() as Promise<AnalysisStatusResponse>
  }, [baseHeaders])

  const fetchAnalysisResult = useCallback(async (projectId: string): Promise<AIAnalysis> => {
    const response = await fetch(`${API_BASE_URL}/api/analysis/projects/${projectId}/analysis/results`, {
      headers: baseHeaders,
    })

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, 'Unable to load analysis results.'))
    }

    const payload = await response.json() as AnalysisResultResponse
    return transformResult(payload)
  }, [baseHeaders])

  const initialiseFromStatus = useCallback(async (projectId: string) => {
    try {
      const status = await fetchAnalysisStatus(projectId)
      const files = mapStatusFiles(status.fileAnalyses)

      setActiveProject(status.project)
      setAnalysisSummary(status.analysis)
      setAnalysisFiles(files)
      setQueuedFiles(status.project.fileCount)
      setAnalysisProgress(computeProgress(files, status.analysis.status, status.project.fileCount))

      if (status.analysis.status === 'completed') {
        const result = await fetchAnalysisResult(projectId)
        setAnalysisResult(result)
        setAnalysisStep('complete')
      } else if (status.analysis.status === 'failed') {
        setAnalysisStep('failed')
      } else if (status.analysis.status === 'analyzing') {
        setAnalysisStep('analyzing')
        setIsPolling(true)
      } else {
        setAnalysisStep('idle')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load analysis details.'
      setAnalysisError(message)
    }
  }, [fetchAnalysisResult, fetchAnalysisStatus])

  const startAnalysis = useCallback(async (projectId?: string) => {
    const targetId = (projectId ?? projectIdInput).trim()
    if (!targetId) {
      setAnalysisError('Enter a project ID to analyze.')
      return
    }

    setAnalysisError(null)
    setApplyStatus('idle')
    setApplyMessage(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis/projects/${targetId}/analyze`, {
        method: 'POST',
        headers: jsonHeaders,
      })

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Unable to start analysis.'))
      }

      const payload = await response.json() as { filesQueued?: number }

      setSelectedProjectId(targetId)
      setSearchParams({ projectId: targetId })
      setQueuedFiles(payload.filesQueued ?? 0)
      setAnalysisResult(null)
      setAnalysisSummary({
        status: 'analyzing',
        confidence: null,
        processingTime: null,
        filesAnalyzed: 0,
        insightsFound: 0,
        suggestedTitle: null,
        suggestedCategory: null,
        suggestedTags: [],
        updatedAt: null,
        startedAt: new Date().toISOString(),
      })
      setAnalysisFiles([])
      setAnalysisStep('analyzing')
      setAnalysisProgress(0)
      setCustomEdits({})
      setExpandedSections(INITIAL_SECTIONS)
      setIsPolling(true)

      try {
        await initialiseFromStatus(targetId)
      } catch {
        // Already handled within initialiseFromStatus
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start analysis.'
      setAnalysisError(message)
      setAnalysisStep('failed')
    } finally {
      setIsSubmitting(false)
    }
  }, [initialiseFromStatus, jsonHeaders, projectIdInput, setSearchParams])

  const projectIdParam = searchParams.get('projectId')

  useEffect(() => {
    if (!projectIdParam) {
      setSelectedProjectId(null)
      setActiveProject(null)
      setAnalysisSummary(null)
      setAnalysisFiles([])
      setAnalysisResult(null)
      setAnalysisStep('idle')
      setAnalysisProgress(0)
      setAnalysisError(null)
      setApplyStatus('idle')
      setApplyMessage(null)
      return
    }

    setProjectIdInput(projectIdParam)
    setSelectedProjectId(projectIdParam)
    setAnalysisError(null)
    initialiseFromStatus(projectIdParam)
  }, [initialiseFromStatus, projectIdParam])
  useEffect(() => {
    if (!isPolling || !selectedProjectId) {
      return
    }

    let active = true

    const poll = async () => {
      try {
        const status = await fetchAnalysisStatus(selectedProjectId)
        if (!active) {
          return
        }

        const files = mapStatusFiles(status.fileAnalyses)
        setActiveProject(status.project)
        setAnalysisSummary(status.analysis)
        setAnalysisFiles(files)
        setQueuedFiles(status.project.fileCount)
        setAnalysisProgress(computeProgress(files, status.analysis.status, status.project.fileCount))

        if (status.analysis.status === 'completed') {
          const result = await fetchAnalysisResult(selectedProjectId)
          if (!active) {
            return
          }
          setAnalysisResult(result)
          setAnalysisStep('complete')
          setIsPolling(false)
        } else if (status.analysis.status === 'failed') {
          setAnalysisStep('failed')
          setIsPolling(false)
          setAnalysisError('Analysis failed. Please try again.')
        } else {
          setAnalysisStep('analyzing')
        }
      } catch (error) {
        if (!active) {
          return
        }
        const message = error instanceof Error ? error.message : 'Unable to update analysis status.'
        setAnalysisError(message)
      }
    }

    poll()
    const interval = window.setInterval(poll, 5000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [fetchAnalysisResult, fetchAnalysisStatus, isPolling, selectedProjectId])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    startAnalysis()
  }

  const handleToggleSection = (section: AnalysisSectionKey) => {
    setExpandedSections(previous => ({
      ...previous,
      [section]: !previous[section],
    }))
  }

  const handleApplySuggestion = async (type: SuggestionType, content: string) => {
    if (!analysisResult || applyStatus === 'saving') {
      return
    }

    const trimmedContent = content.trim()
    if (!trimmedContent) {
      return
    }

    const nextEdits = {
      ...customEdits,
      [type]: trimmedContent,
    }

    setCustomEdits(nextEdits)

    const description = buildProjectDescription(analysisResult, nextEdits)
    if (description) {
      await persistProjectSuggestions({ description })
    }
  }

  const handleApplyAllSuggestions = async () => {
    if (!analysisResult || applyStatus === 'saving') {
      return
    }

    const mergedEdits: Partial<Record<SuggestionType, string>> = {
      problem: analysisResult.problem.primary,
      solution: analysisResult.solution.primary,
      impact: analysisResult.impact.primary,
      narrative: analysisResult.narrative.story,
    }

    setCustomEdits(mergedEdits)
    setExpandedSections({
      problem: true,
      solution: true,
      impact: true,
      narrative: true,
    })

    const description = buildProjectDescription(analysisResult, mergedEdits)
    const payload: ProjectSuggestionPayload = {
      title: analysisResult.suggestedTitle,
      category: analysisResult.suggestedCategory,
      description,
    }

    await persistProjectSuggestions(payload)
  }

  const handleReanalyze = () => {
    const targetId = selectedProjectId ?? projectIdInput.trim()
    if (!targetId) {
      setAnalysisError('Enter a project ID to analyze.')
      return
    }
    startAnalysis(targetId)
  }

  const sidebarFiles = useMemo(() => analysisFiles.map(file => ({
    id: file.id,
    name: file.name,
    type: determineFileType(file.mimeType),
    status: file.status,
    insights: file.insights.map(describeInsight),
  })), [analysisFiles])

  const progressLabel = useMemo(() => {
    if (analysisStep === 'failed') {
      return 'Analysis failed'
    }
    if (analysisStep === 'idle') {
      return 'Waiting to start analysis'
    }
    if (analysisStep === 'complete') {
      return 'Analysis complete!'
    }
    if (analysisProgress < 25) {
      return 'Scanning uploaded files...'
    }
    if (analysisProgress < 50) {
      return 'Identifying design patterns...'
    }
    if (analysisProgress < 75) {
      return 'Extracting user insights...'
    }
    if (analysisProgress < 100) {
      return 'Generating narrative...'
    }
    return 'Analysis complete!'
  }, [analysisProgress, analysisStep])

  const confidenceDisplay = analysisResult
    ? Math.round(analysisResult.confidence)
    : Math.round(analysisSummary?.confidence ?? 0)

  const insightsDisplay = analysisResult?.insights ?? analysisSummary?.insightsFound ?? 0

  const processingTimeDisplay = analysisResult
    ? analysisResult.processingTime
    : formatProcessingTime(analysisSummary?.processingTime)

  const filesAnalyzedDisplay = analysisResult?.filesAnalyzed
    ?? analysisSummary?.filesAnalyzed
    ?? Math.max(analysisFiles.length, queuedFiles)

  const summaryTitle = analysisResult?.suggestedTitle ?? analysisSummary?.suggestedTitle ?? '—'
  const summaryCategory = analysisResult?.suggestedCategory ?? analysisSummary?.suggestedCategory ?? '—'
  const summaryTags = analysisResult?.tags ?? analysisSummary?.suggestedTags ?? []

  const appliedCount = Object.values(customEdits).filter(value => typeof value === 'string' && value.trim().length > 0).length
  const isApplying = applyStatus === 'saving'
  return (
    <div className={`analysis-page${isDarkMode ? ' analysis-page--dark' : ''}`}>
      <header className="analysis-page__header">
        <div className="analysis-header__inner">
          <div className="analysis-header__meta">
            <div className="analysis-header__icon">
              <Brain size={22} />
            </div>
            <div>
              <h1 className="analysis-header__title">AI Project Analysis</h1>
              <p className="analysis-header__subtitle">
                {activeProject
                  ? `${activeProject.name}${activeProject.category ? ` • ${activeProject.category}` : ''}${(analysisFiles.length || queuedFiles) ? ` • ${(analysisFiles.length || queuedFiles)} file${(analysisFiles.length || queuedFiles) === 1 ? '' : 's'}` : ''}`
                  : 'Select a project and let AI surface your highlights'}
              </p>
            </div>
          </div>
          <div className="analysis-header__actions">
            <button
              type="button"
              className="analysis-toggle"
              onClick={() => setIsDarkMode(previous => !previous)}
              aria-pressed={isDarkMode}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              <span>{isDarkMode ? 'Light mode' : 'Dark mode'}</span>
            </button>
            <button type="button" className="button button--ghost" onClick={handleReanalyze} disabled={isSubmitting}>
              <RefreshCw size={16} />
              Re-analyze
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => { void handleApplyAllSuggestions() }}
              disabled={analysisStep !== 'complete' || !analysisResult || isApplying}
            >
              <Sparkles size={16} />
              {isApplying ? 'Applying…' : 'Apply all suggestions'}
            </button>
          </div>
        </div>
      </header>

      <div className="analysis-page__layout">
        <aside className="analysis-sidebar analysis-panel">
          <div className="analysis-sidebar__control">
            <PortfolioHierarchy
              selectedProjectId={projectIdInput.trim().length > 0 ? projectIdInput.trim() : undefined}
              onSelectProject={handleHierarchyProjectSelect}
            />
            <form onSubmit={handleSubmit} className="analysis-launcher">
              <label htmlFor="analysis-project-id">Project ID</label>
              <div className="analysis-launcher__row">
                <input
                  id="analysis-project-id"
                  type="text"
                  value={projectIdInput}
                  onChange={event => setProjectIdInput(event.target.value)}
                  placeholder="proj_12345"
                />
                <button type="submit" className="button button--primary button--small" disabled={isSubmitting}>
                  {isSubmitting ? 'Starting…' : 'Analyze'}
                </button>
              </div>
            </form>
            {analysisError ? (
              <p className="analysis-feedback analysis-feedback--error">{analysisError}</p>
            ) : null}
            {applyMessage ? (
              <p
                className={`analysis-feedback${applyStatus === 'error'
                  ? ' analysis-feedback--error'
                  : applyStatus === 'success'
                    ? ' analysis-feedback--success'
                    : ''}`}
              >
                {applyMessage}
              </p>
            ) : null}
            {analysisStep === 'analyzing' && !analysisError ? (
              <p className="analysis-feedback">Analysis in progress…</p>
            ) : null}
          </div>

          <div>
            <h2 className="analysis-sidebar__title">File analysis</h2>
          </div>
          <div className="analysis-sidebar__stats">
            <div className="analysis-sidebar__stat">
              <strong>{confidenceDisplay}%</strong>
              <span>Confidence</span>
            </div>
            <div className="analysis-sidebar__stat">
              <strong>{insightsDisplay}</strong>
              <span>Insights</span>
            </div>
          </div>
          <div className="analysis-sidebar__meta">
            <p>Processed in {processingTimeDisplay}</p>
            <p>{filesAnalyzedDisplay} files analyzed</p>
          </div>
          <div className="analysis-sidebar__files">
            {sidebarFiles.length > 0 ? sidebarFiles.map(file => {
              const FileIconComponent = FILE_ICONS[file.type]

              return (
                <div key={file.id} className="analysis-file-card">
                  <div className="analysis-file-card__icon">
                    <FileIconComponent size={18} />
                  </div>
                  <div className="analysis-file-card__details">
                    <div className="analysis-file-card__name">{file.name}</div>
                    <div className="analysis-file-card__meta">
                      <span className={`analysis-file-card__status analysis-file-card__status--${file.status}`}>
                        {STATUS_LABELS[file.status]}
                      </span>
                    </div>
                    <div className="analysis-file-card__insights">
                      {file.insights.length > 0 ? file.insights.map(insight => (
                        <span key={insight} className="analysis-file-card__insight">
                          <span className="analysis-file-card__bullet" />
                          {insight}
                        </span>
                      )) : (
                        <span className="analysis-file-card__insight analysis-file-card__insight--empty">
                          <span className="analysis-file-card__bullet" />
                          No insights yet
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            }) : (
              <p className="analysis-sidebar__empty">No files queued for analysis yet.</p>
            )}
          </div>
        </aside>
        <main className="analysis-main">
          {analysisStep === 'idle' ? (
            <section className="analysis-empty analysis-panel">
              <div className="analysis-empty__icon">
                <Sparkles size={28} />
              </div>
              <h2>Run AI analysis</h2>
              <p>Enter a project ID to generate a narrative, impact summary, and ready-to-use highlights.</p>
            </section>
          ) : analysisStep === 'failed' ? (
            <section className="analysis-progress analysis-panel analysis-progress--error">
              <div className="analysis-progress__icon analysis-progress__icon--error">
                <AlertCircle size={32} />
              </div>
              <h2 className="analysis-progress__title">Analysis failed</h2>
              <p className="analysis-progress__description">{analysisError ?? 'Something went wrong while running the analysis.'}</p>
              <div className="analysis-progress__actions">
                <button type="button" className="button button--primary" onClick={handleReanalyze}>
                  <RefreshCw size={16} />
                  Try again
                </button>
              </div>
            </section>
          ) : analysisStep === 'analyzing' ? (
            <section className="analysis-progress analysis-panel">
              <div className="analysis-progress__icon">
                <Brain size={32} />
              </div>
              <h2 className="analysis-progress__title">Analyzing your project</h2>
              <p className="analysis-progress__description">
                Our AI is reviewing uploaded files to understand the problem you solved, the solution you delivered, and the impact it created.
              </p>
              <div className="analysis-progress__bar">
                <div className="analysis-progress__fill" style={{ width: `${Math.min(analysisProgress, 100)}%` }} />
              </div>
              <p className="analysis-progress__status">
                {Math.round(Math.min(analysisProgress, 100))}% • {progressLabel}
              </p>
            </section>
          ) : analysisResult ? (
            <div className="analysis-results">
              <section className="analysis-complete analysis-panel">
                <div className="analysis-complete__icon">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h2>Analysis complete!</h2>
                  <p>We've reverse-engineered your project and surfaced the highlights worth showcasing.</p>
                </div>
              </section>

              <section className="analysis-summary analysis-panel">
                <div>
                  <h3>Suggested project details</h3>
                </div>
                <div className="analysis-summary__grid">
                  <div>
                    <p className="analysis-summary__label">Title</p>
                    <p className="analysis-summary__value">{summaryTitle || '—'}</p>
                  </div>
                  <div>
                    <p className="analysis-summary__label">Category</p>
                    <p className="analysis-summary__value">{summaryCategory || '—'}</p>
                  </div>
                  <div>
                    <p className="analysis-summary__label">Tags</p>
                    <div className="analysis-summary__tags">
                      {summaryTags.length > 0 ? summaryTags.map(tag => (
                        <span key={tag} className="analysis-tag">
                          {tag}
                        </span>
                      )) : <span className="analysis-tag analysis-tag--empty">No tags suggested</span>}
                    </div>
                  </div>
                </div>
                <div className="analysis-summary__footer">
                  <span>Generated from {analysisResult.insights} insights across your project files.</span>
                  <span>
                    {appliedCount > 0
                      ? `${appliedCount} suggestion${appliedCount === 1 ? '' : 's'} applied`
                      : 'No suggestions applied yet'}
                  </span>
                </div>
              </section>

              <AnalysisCard
                title="Problem identified"
                confidence={analysisResult.problem.confidence}
                isExpanded={expandedSections.problem}
                onToggle={() => handleToggleSection('problem')}
                icon={Target}
              >
                <SuggestionCard
                  title="Primary problem"
                  content={analysisResult.problem.primary}
                  onApply={() => { void handleApplySuggestion('problem', analysisResult.problem.primary) }}
                  isApplied={customEdits.problem === analysisResult.problem.primary}
                  disabled={isApplying}
                />

                <div className="analysis-two-column">
                  <div>
                    <h4 className="analysis-section-title">Supporting evidence</h4>
                    <div className="analysis-list">
                      {analysisResult.problem.evidence.length > 0 ? analysisResult.problem.evidence.map(evidence => (
                        <div key={evidence} className="analysis-list__item">
                          <CheckCircle size={18} className="analysis-list__icon" />
                          <span>{evidence}</span>
                        </div>
                      )) : <p>No supporting evidence provided.</p>}
                    </div>
                  </div>
                  <div>
                    <h4 className="analysis-section-title">Alternative interpretations</h4>
                    <div className="analysis-alternatives">
                      {analysisResult.problem.alternatives.length > 0 ? analysisResult.problem.alternatives.map(alternative => {
                        const isActive = customEdits.problem === alternative
                        return (
                          <button
                            key={alternative}
                            type="button"
                            className={`analysis-alternative${isActive ? ' analysis-alternative--active' : ''}`}
                            onClick={() => { void handleApplySuggestion('problem', alternative) }}
                            disabled={isApplying}
                          >
                            <span className="analysis-alternative__icon">
                              <Lightbulb size={14} />
                            </span>
                            <span>{alternative}</span>
                          </button>
                        )
                      }) : <p>No alternative interpretations suggested.</p>}
                    </div>
                  </div>
                </div>
              </AnalysisCard>

              <AnalysisCard
                title="Solution proposed"
                confidence={analysisResult.solution.confidence}
                isExpanded={expandedSections.solution}
                onToggle={() => handleToggleSection('solution')}
                icon={Lightbulb}
              >
                <SuggestionCard
                  title="Primary solution"
                  content={analysisResult.solution.primary}
                  onApply={() => { void handleApplySuggestion('solution', analysisResult.solution.primary) }}
                  isApplied={customEdits.solution === analysisResult.solution.primary}
                  disabled={isApplying}
                />

                <div className="analysis-two-column">
                  <div>
                    <h4 className="analysis-section-title">Key elements</h4>
                    <div className="analysis-list">
                      {analysisResult.solution.keyElements.length > 0 ? analysisResult.solution.keyElements.map(element => (
                        <div key={element} className="analysis-list__item">
                          <ArrowRight size={16} className="analysis-list__icon analysis-list__icon--accent" />
                          <span>{element}</span>
                        </div>
                      )) : <p>No key elements identified.</p>}
                    </div>
                  </div>
                  <div>
                    <h4 className="analysis-section-title">Design patterns</h4>
                    <div className="analysis-chips">
                      {analysisResult.solution.designPatterns.length > 0 ? analysisResult.solution.designPatterns.map(pattern => (
                        <span key={pattern} className="analysis-chip">
                          {pattern}
                        </span>
                      )) : <span className="analysis-chip analysis-chip--empty">No design patterns noted.</span>}
                    </div>
                  </div>
                </div>
              </AnalysisCard>

              <AnalysisCard
                title="Impact &amp; results"
                confidence={analysisResult.impact.confidence}
                isExpanded={expandedSections.impact}
                onToggle={() => handleToggleSection('impact')}
                icon={TrendingUp}
              >
                <SuggestionCard
                  title="Primary impact"
                  content={analysisResult.impact.primary}
                  onApply={() => { void handleApplySuggestion('impact', analysisResult.impact.primary) }}
                  isApplied={customEdits.impact === analysisResult.impact.primary}
                  disabled={isApplying}
                />

                <div>
                  <h4 className="analysis-section-title">Key metrics</h4>
                  <div className="analysis-metrics">
                    {analysisResult.impact.metrics.length > 0 ? analysisResult.impact.metrics.map(metric => (
                      <div key={metric.metric} className="analysis-metric-card">
                        <strong>{metric.metric}</strong>
                        <span>Before: {metric.before}</span>
                        <span>After: {metric.after}</span>
                        <div className="analysis-metric-card__change">{metric.change}</div>
                      </div>
                    )) : <p>No metrics identified.</p>}
                  </div>
                </div>

                <div className="analysis-business-value">
                  <TrendingUp size={18} />
                  <span>{analysisResult.impact.businessValue || 'No business value summary provided.'}</span>
                </div>
              </AnalysisCard>

              <AnalysisCard
                title="Generated story"
                confidence={analysisResult.narrative.story ? 91 : 0}
                isExpanded={expandedSections.narrative}
                onToggle={() => handleToggleSection('narrative')}
                icon={MessageSquare}
              >
                <SuggestionCard
                  title="Project story"
                  content={analysisResult.narrative.story || 'No narrative generated.'}
                  onApply={() => { void handleApplySuggestion('narrative', analysisResult.narrative.story) }}
                  isApplied={customEdits.narrative === analysisResult.narrative.story}
                  disabled={isApplying}
                />

                <div className="analysis-two-column">
                  <div>
                    <h4 className="analysis-section-title">Key challenges</h4>
                    <div className="analysis-list">
                      {analysisResult.narrative.challenges.length > 0 ? analysisResult.narrative.challenges.map(challenge => (
                        <div key={challenge} className="analysis-list__item">
                          <AlertCircle size={18} className="analysis-list__icon analysis-list__icon--warning" />
                          <span>{challenge}</span>
                        </div>
                      )) : <p>No challenges highlighted.</p>}
                    </div>
                  </div>
                  <div>
                    <h4 className="analysis-section-title">Process steps</h4>
                    <div className="analysis-process">
                      {analysisResult.narrative.process.length > 0 ? analysisResult.narrative.process.map((step, index) => (
                        <div key={step} className="analysis-process__step">
                          <span className="analysis-process__index">{index + 1}</span>
                          <span>{step}</span>
                        </div>
                      )) : <p>No process steps documented.</p>}
                    </div>
                  </div>
                </div>
              </AnalysisCard>

              <div className="analysis-footer">
                <button type="button" className="button button--ghost" onClick={handleReanalyze}>
                  <RefreshCw size={16} />
                  Re-analyze with different focus
                </button>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => { void handleApplyAllSuggestions() }}
                  disabled={analysisStep !== 'complete' || !analysisResult || isApplying}
                >
                  <Sparkles size={16} />
                  {isApplying ? 'Applying…' : 'Apply all suggestions'}
                </button>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}
