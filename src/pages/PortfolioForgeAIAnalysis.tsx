import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Edit3,
  FileText,
  Image,
  Lightbulb,
  MessageSquare,
  Moon,
  RefreshCw,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Video,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import './PortfolioForgeAIAnalysis.css'

type AnalysisStep = 'analyzing' | 'complete'

type SuggestionType = 'problem' | 'solution' | 'impact' | 'narrative'

type AnalysisSectionKey = SuggestionType

type ProjectFile = {
  id: string
  name: string
  type: 'image' | 'video' | 'document'
  insights: string[]
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

const PROJECT_FILES: ProjectFile[] = [
  {
    id: 'f1',
    name: 'Before-After-Comparison.png',
    type: 'image',
    insights: ['UI comparison', 'Design evolution', 'User interface improvement'],
  },
  {
    id: 'f2',
    name: 'User-Journey-Map.pdf',
    type: 'document',
    insights: ['User flow analysis', 'Pain point identification', 'Experience mapping'],
  },
  {
    id: 'f3',
    name: 'Prototype-Demo.mp4',
    type: 'video',
    insights: ['Interactive prototype', 'User testing', 'Feature demonstration'],
  },
  {
    id: 'f4',
    name: 'Analytics-Dashboard.png',
    type: 'image',
    insights: ['Performance metrics', 'User behavior data', 'Success indicators'],
  },
]

const AI_ANALYSIS: AIAnalysis = {
  confidence: 94,
  processingTime: '2.3s',
  filesAnalyzed: 8,
  insights: 23,
  problem: {
    primary: 'Low user engagement and high abandonment rates in the checkout process',
    confidence: 92,
    evidence: [
      'User journey map shows 68% drop-off at payment step',
      'Before/after comparison reveals cluttered UI design',
      'Analytics dashboard indicates 3.2 minute average completion time',
      'User feedback mentions confusion about shipping options',
    ],
    alternatives: [
      'Complex navigation structure causing user confusion',
      'Lack of trust signals during payment process',
      'Mobile responsiveness issues affecting conversion',
    ],
  },
  solution: {
    primary: 'Streamlined checkout flow with progressive disclosure and trust signals',
    confidence: 89,
    keyElements: [
      'Reduced form fields from 12 to 6 essential inputs',
      'Added progress indicators and breadcrumbs',
      'Implemented guest checkout option',
      'Enhanced mobile-first responsive design',
      'Added security badges and payment icons',
    ],
    designPatterns: [
      'Progressive disclosure',
      'Single-page checkout',
      'Auto-fill functionality',
      'Error prevention and handling',
    ],
  },
  impact: {
    primary: '78% improvement in checkout completion rates',
    confidence: 87,
    metrics: [
      { metric: 'Conversion Rate', before: '12.4%', after: '22.1%', change: '+78%' },
      { metric: 'Completion Time', before: '3.2 min', after: '1.8 min', change: '-44%' },
      { metric: 'User Satisfaction', before: '6.2/10', after: '8.7/10', change: '+40%' },
      { metric: 'Mobile Conversions', before: '8.1%', after: '19.3%', change: '+138%' },
    ],
    businessValue: 'Generated an estimated $2.4M additional annual revenue',
  },
  narrative: {
    story:
      'This e-commerce checkout redesign transformed a frustrating user experience into a seamless conversion engine. By analyzing user behavior data and conducting usability testing, we identified that users were overwhelmed by too many form fields and lacked confidence in the security of their transaction. The solution focused on simplification and trust-building, resulting in a checkout process that not only converts better but also creates a positive lasting impression of the brand.',
    challenges: [
      'Balancing information collection needs with user experience',
      'Maintaining security compliance while reducing friction',
      'Ensuring mobile optimization without desktop compromise',
    ],
    process: [
      'User research and behavior analysis',
      'Competitive analysis and best practice review',
      'Wireframing and prototype development',
      'A/B testing and iterative refinement',
      'Full deployment and performance monitoring',
    ],
  },
  tags: [
    'E-commerce',
    'UX Design',
    'Conversion Optimization',
    'Mobile-First',
    'User Research',
    'A/B Testing',
    'Checkout Flow',
    'UI/UX',
  ],
  suggestedTitle: 'E-commerce Checkout Redesign: 78% Conversion Improvement',
  suggestedCategory: 'UX/UI Design',
}

const FILE_ICONS: Record<ProjectFile['type'], LucideIcon> = {
  image: Image,
  video: Video,
  document: FileText,
}

const INITIAL_SECTIONS: Record<AnalysisSectionKey, boolean> = {
  problem: true,
  solution: false,
  impact: false,
  narrative: false,
}

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
}

const SuggestionCard = ({ title, content, onApply, onEdit, isApplied }: SuggestionCardProps) => (
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
        <button type="button" className="button button--primary button--small" onClick={onApply}>
          Apply
        </button>
      </div>
    </div>
    <p>{content}</p>
  </div>
)

export default function PortfolioForgeAIAnalysis() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('analyzing')
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisRunId, setAnalysisRunId] = useState(0)
  const [expandedSections, setExpandedSections] = useState(INITIAL_SECTIONS)
  const [customEdits, setCustomEdits] = useState<Partial<Record<SuggestionType, string>>>({})

  useEffect(() => {
    if (analysisStep !== 'analyzing') {
      return
    }

    const timer = window.setInterval(() => {
      setAnalysisProgress(previous => {
        const nextValue = Math.min(previous + Math.random() * 12 + 6, 100)
        if (nextValue >= 100) {
          setAnalysisStep('complete')
        }
        return nextValue
      })
    }, 240)

    return () => window.clearInterval(timer)
  }, [analysisRunId, analysisStep])

  const progressLabel = useMemo(() => {
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
  }, [analysisProgress])

  const handleToggleSection = (section: AnalysisSectionKey) => {
    setExpandedSections(previous => ({
      ...previous,
      [section]: !previous[section],
    }))
  }

  const handleApplySuggestion = (type: SuggestionType, content: string) => {
    setCustomEdits(previous => ({
      ...previous,
      [type]: content,
    }))
  }

  const handleApplyAllSuggestions = () => {
    setCustomEdits({
      problem: AI_ANALYSIS.problem.primary,
      solution: AI_ANALYSIS.solution.primary,
      impact: AI_ANALYSIS.impact.primary,
      narrative: AI_ANALYSIS.narrative.story,
    })
    setExpandedSections({
      problem: true,
      solution: true,
      impact: true,
      narrative: true,
    })
  }

  const handleReanalyze = () => {
    setCustomEdits({})
    setExpandedSections(INITIAL_SECTIONS)
    setAnalysisProgress(0)
    setAnalysisStep('analyzing')
    setAnalysisRunId(previous => previous + 1)
  }

  const appliedCount = Object.keys(customEdits).length

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
                E-commerce Checkout Redesign • {PROJECT_FILES.length} files
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
            <button type="button" className="button button--ghost" onClick={handleReanalyze}>
              <RefreshCw size={16} />
              Re-analyze
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={handleApplyAllSuggestions}
              disabled={analysisStep !== 'complete'}
            >
              <Sparkles size={16} />
              Apply all suggestions
            </button>
          </div>
        </div>
      </header>

      <div className="analysis-page__layout">
        <aside className="analysis-sidebar analysis-panel">
          <div>
            <h2 className="analysis-sidebar__title">File analysis</h2>
          </div>
          <div className="analysis-sidebar__stats">
            <div className="analysis-sidebar__stat">
              <strong>{AI_ANALYSIS.confidence}%</strong>
              <span>Confidence</span>
            </div>
            <div className="analysis-sidebar__stat">
              <strong>{AI_ANALYSIS.insights}</strong>
              <span>Insights</span>
            </div>
          </div>
          <div className="analysis-sidebar__meta">
            <p>Processed in {AI_ANALYSIS.processingTime}</p>
            <p>{AI_ANALYSIS.filesAnalyzed} files analyzed</p>
          </div>
          <div className="analysis-sidebar__files">
            {PROJECT_FILES.map(file => {
              const FileIcon = FILE_ICONS[file.type]

              return (
                <div key={file.id} className="analysis-file-card">
                  <div className="analysis-file-card__icon">
                    <FileIcon size={18} />
                  </div>
                  <div className="analysis-file-card__details">
                    <div className="analysis-file-card__name">{file.name}</div>
                    <div className="analysis-file-card__insights">
                      {file.insights.map(insight => (
                        <span key={insight} className="analysis-file-card__insight">
                          <span className="analysis-file-card__bullet" />
                          {insight}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        <main className="analysis-main">
          {analysisStep === 'analyzing' ? (
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
          ) : (
            <div className="analysis-results">
              <section className="analysis-complete analysis-panel">
                <div className="analysis-complete__icon">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h2>Analysis complete!</h2>
                  <p>We&apos;ve reverse-engineered your project and surfaced the highlights worth showcasing.</p>
                </div>
              </section>

              <section className="analysis-summary analysis-panel">
                <div>
                  <h3>Suggested project details</h3>
                </div>
                <div className="analysis-summary__grid">
                  <div>
                    <p className="analysis-summary__label">Title</p>
                    <p className="analysis-summary__value">{AI_ANALYSIS.suggestedTitle}</p>
                  </div>
                  <div>
                    <p className="analysis-summary__label">Category</p>
                    <p className="analysis-summary__value">{AI_ANALYSIS.suggestedCategory}</p>
                  </div>
                  <div>
                    <p className="analysis-summary__label">Tags</p>
                    <div className="analysis-summary__tags">
                      {AI_ANALYSIS.tags.map(tag => (
                        <span key={tag} className="analysis-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="analysis-summary__footer">
                  <span>Generated from {AI_ANALYSIS.insights} insights across your project files.</span>
                  <span>
                    {appliedCount > 0
                      ? `${appliedCount} suggestion${appliedCount === 1 ? '' : 's'} applied`
                      : 'No suggestions applied yet'}
                  </span>
                </div>
              </section>

              <AnalysisCard
                title="Problem identified"
                confidence={AI_ANALYSIS.problem.confidence}
                isExpanded={expandedSections.problem}
                onToggle={() => handleToggleSection('problem')}
                icon={Target}
              >
                <SuggestionCard
                  title="Primary problem"
                  content={AI_ANALYSIS.problem.primary}
                  onApply={() => handleApplySuggestion('problem', AI_ANALYSIS.problem.primary)}
                  isApplied={customEdits.problem === AI_ANALYSIS.problem.primary}
                />

                <div>
                  <h4 className="analysis-section-title">Supporting evidence</h4>
                  <div className="analysis-list">
                    {AI_ANALYSIS.problem.evidence.map(evidence => (
                      <div key={evidence} className="analysis-list__item">
                        <CheckCircle size={18} className="analysis-list__icon" />
                        <span>{evidence}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="analysis-section-title">Alternative interpretations</h4>
                  <div className="analysis-alternatives">
                    {AI_ANALYSIS.problem.alternatives.map(alternative => {
                      const isActive = customEdits.problem === alternative
                      return (
                        <div
                          key={alternative}
                          className={`analysis-alternative${isActive ? ' analysis-alternative--active' : ''}`}
                        >
                          <span>{alternative}</span>
                          <button
                            type="button"
                            className="analysis-alternative__button"
                            onClick={() => handleApplySuggestion('problem', alternative)}
                          >
                            Use this
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </AnalysisCard>

              <AnalysisCard
                title="Solution approach"
                confidence={AI_ANALYSIS.solution.confidence}
                isExpanded={expandedSections.solution}
                onToggle={() => handleToggleSection('solution')}
                icon={Lightbulb}
              >
                <SuggestionCard
                  title="Primary solution"
                  content={AI_ANALYSIS.solution.primary}
                  onApply={() => handleApplySuggestion('solution', AI_ANALYSIS.solution.primary)}
                  isApplied={customEdits.solution === AI_ANALYSIS.solution.primary}
                />

                <div className="analysis-two-column">
                  <div>
                    <h4 className="analysis-section-title">Key elements</h4>
                    <div className="analysis-list">
                      {AI_ANALYSIS.solution.keyElements.map(element => (
                        <div key={element} className="analysis-list__item">
                          <ArrowRight size={16} className="analysis-list__icon analysis-list__icon--accent" />
                          <span>{element}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="analysis-section-title">Design patterns</h4>
                    <div className="analysis-chips">
                      {AI_ANALYSIS.solution.designPatterns.map(pattern => (
                        <span key={pattern} className="analysis-chip">
                          {pattern}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </AnalysisCard>

              <AnalysisCard
                title="Impact &amp; results"
                confidence={AI_ANALYSIS.impact.confidence}
                isExpanded={expandedSections.impact}
                onToggle={() => handleToggleSection('impact')}
                icon={TrendingUp}
              >
                <SuggestionCard
                  title="Primary impact"
                  content={AI_ANALYSIS.impact.primary}
                  onApply={() => handleApplySuggestion('impact', AI_ANALYSIS.impact.primary)}
                  isApplied={customEdits.impact === AI_ANALYSIS.impact.primary}
                />

                <div>
                  <h4 className="analysis-section-title">Key metrics</h4>
                  <div className="analysis-metrics">
                    {AI_ANALYSIS.impact.metrics.map(metric => (
                      <div key={metric.metric} className="analysis-metric-card">
                        <strong>{metric.metric}</strong>
                        <span>Before: {metric.before}</span>
                        <span>After: {metric.after}</span>
                        <div className="analysis-metric-card__change">{metric.change}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="analysis-business-value">
                  <TrendingUp size={18} />
                  <span>{AI_ANALYSIS.impact.businessValue}</span>
                </div>
              </AnalysisCard>

              <AnalysisCard
                title="Generated story"
                confidence={91}
                isExpanded={expandedSections.narrative}
                onToggle={() => handleToggleSection('narrative')}
                icon={MessageSquare}
              >
                <SuggestionCard
                  title="Project story"
                  content={AI_ANALYSIS.narrative.story}
                  onApply={() => handleApplySuggestion('narrative', AI_ANALYSIS.narrative.story)}
                  isApplied={customEdits.narrative === AI_ANALYSIS.narrative.story}
                />

                <div className="analysis-two-column">
                  <div>
                    <h4 className="analysis-section-title">Key challenges</h4>
                    <div className="analysis-list">
                      {AI_ANALYSIS.narrative.challenges.map(challenge => (
                        <div key={challenge} className="analysis-list__item">
                          <AlertCircle size={18} className="analysis-list__icon analysis-list__icon--warning" />
                          <span>{challenge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="analysis-section-title">Process steps</h4>
                    <div className="analysis-process">
                      {AI_ANALYSIS.narrative.process.map((step, index) => (
                        <div key={step} className="analysis-process__step">
                          <span className="analysis-process__index">{index + 1}</span>
                          <span>{step}</span>
                        </div>
                      ))}
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
                  onClick={handleApplyAllSuggestions}
                  disabled={analysisStep !== 'complete'}
                >
                  <Sparkles size={16} />
                  Apply all suggestions
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
