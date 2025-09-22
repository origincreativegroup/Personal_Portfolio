import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {Wand2, 
  Eye,Save,RefreshCw} from 'lucide-react'
import { cn } from '../../shared/utils'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Modal from '../ui/Modal'
import PortfolioGrid from './PortfolioGrid'
import NarrativeEditor from '../ai/NarrativeEditor'
import { 
  Project, 
  CaseStudy, 
  Portfolio, 
  GeneratedNarrative 
} from '../../types/portfolio'
import { AINarrativeService } from '../../services/aiNarrativeService'

// ===== TYPES =====

interface AIPortfolioBuilderProps {
  initialPortfolio?: Portfolio
  onSave?: (portfolio: Portfolio) => void
  onPublish?: (portfolio: Portfolio) => void
  className?: string
}

interface AIGenerationStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'error'
  progress: number
  result?: any
}

// ===== COMPONENT =====

export default function AIPortfolioBuilder({
  initialPortfolio,
  onSave,
  onPublish,
  className}: AIPortfolioBuilderProps) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(initialPortfolio || null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [showNarrativeEditor, setShowNarrativeEditor] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Project | CaseStudy | null>(null)
  const [generationSteps, setGenerationSteps] = useState<AIGenerationStep[]>([])
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [show, setShow] = useState(false)

  const aiService = useRef(new AINarrativeService('mock-api-key'))

  // Initialize portfolio if not provided
  useEffect(() => {
    if (!portfolio) {
      setPortfolio({
        id: 'portfolio-1',
        title: 'My Portfolio',
        description: 'A showcase of my creative work',
        slug: 'my-portfolio',
        published: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {
          theme: 'minimal',
          layout: 'grid',
          showCategories: true,
          showTags: true,
          showDates: true,
          showMetrics: true,
          enableFiltering: true,
          enableSearch: true,
          seo: {
            title: 'My Portfolio',
            description: 'A showcase of my creative work'
          }
        },
        projects: [],
        caseStudies: []
      })
    }
  }, [portfolio])

  // AI Generation Steps
  const steps: AIGenerationStep[] = [
    {
      id: 'analyze-content',
      title: 'Analyze Content',
      description: 'Reviewing your assets and projects to understand your work',
      status: 'pending',
      progress: 0
    },
    {
      id: 'generate-narratives',
      title: 'Generate Narratives',
      description: 'Creating compelling stories for each project and case study',
      status: 'pending',
      progress: 0
    },
    {
      id: 'optimize-layout',
      title: 'Optimize Layout',
      description: 'Arranging content for maximum visual impact',
      status: 'pending',
      progress: 0
    },
    {
      id: 'enhance-seo',
      title: 'Enhance SEO',
      description: 'Optimizing content for search engines',
      status: 'pending',
      progress: 0
    },
    {
      id: 'finalize',
      title: 'Finalize Portfolio',
      description: 'Applying final touches and quality checks',
      status: 'pending',
      progress: 0
    }
  ]

  const handleAIGenerate = async () => {
    if (!portfolio) return

    setIsGenerating(true)
    setGenerationSteps([...steps])

    try {
      // Step 1: Analyze Content
      await updateStep('analyze-content', 'in-progress', 0)
      await simulateProgress('analyze-content', 100, 1000)
      await updateStep('analyze-content', 'completed', 100)

      // Step 2: Generate Narratives
      await updateStep('generate-narratives', 'in-progress', 0)
      const updatedProjects = await generateProjectNarratives(portfolio.projects)
      const updatedCaseStudies = await generateCaseStudyNarratives(portfolio.caseStudies)
      await updateStep('generate-narratives', 'completed', 100)

      // Step 3: Optimize Layout
      await updateStep('optimize-layout', 'in-progress', 0)
      await simulateProgress('optimize-layout', 100, 800)
      await updateStep('optimize-layout', 'completed', 100)

      // Step 4: Enhance SEO
      await updateStep('enhance-seo', 'in-progress', 0)
      await simulateProgress('enhance-seo', 100, 600)
      await updateStep('enhance-seo', 'completed', 100)

      // Step 5: Finalize
      await updateStep('finalize', 'in-progress', 0)
      await simulateProgress('finalize', 100, 400)
      await updateStep('finalize', 'completed', 100)

      // Update portfolio with generated content
      setPortfolio({
        ...portfolio,
        projects: updatedProjects,
        caseStudies: updatedCaseStudies,
        updatedAt: new Date().toISOString()
      })

    } catch (error) {
      console.error('Error during AI generation:', error)
      // Mark current step as error
      const currentStepIndex = generationSteps.findIndex(step => step.status === 'in-progress')
      if (currentStepIndex !== -1) {
        await updateStep(generationSteps[currentStepIndex].id, 'error', 0)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const updateStep = async (stepId: string, status: AIGenerationStep['status'], progress: number) => {
    setGenerationSteps(prev => 
      prev.map(step => 
        step.id === stepId 
          ? { ...step, status, progress }
          : step
      )
    )
  }

  const simulateProgress = async (stepId: string, targetProgress: number, duration: number) => {
    const steps = 20
    const stepDuration = duration / steps
    const progressIncrement = targetProgress / steps

    for (let i = 0; i < steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration))
      const currentProgress = Math.min((i + 1) * progressIncrement, targetProgress)
      setGenerationSteps(prev => 
        prev.map(step => 
          step.id === stepId 
            ? { ...step, progress: currentProgress }
            : step
        )
      )
    }
  }

  const generateProjectNarratives = async (projects: Project[]): Promise<Project[]> => {
    const updatedProjects = []
    
    for (const project of projects) {
      try {
        const narrative = await aiService.current.generateProjectNarrative(project)
        // Here you would integrate the narrative into the project
        updatedProjects.push(project)
      } catch (error) {
        console.error(`Error generating narrative for project ${project.id}:`, error)
        updatedProjects.push(project)
      }
    }
    
    return updatedProjects
  }

  const generateCaseStudyNarratives = async (caseStudies: CaseStudy[]): Promise<CaseStudy[]> => {
    const updatedCaseStudies = []
    
    for (const caseStudy of caseStudies) {
      try {
        const narrative = await aiService.current.generateCaseStudyNarrative(caseStudy)
        // Here you would integrate the narrative into the case study
        updatedCaseStudies.push(caseStudy)
      } catch (error) {
        console.error(`Error generating narrative for case study ${caseStudy.id}:`, error)
        updatedCaseStudies.push(caseStudy)
      }
    }
    
    return updatedCaseStudies
  }

  const handleEditNarrative = (item: Project | CaseStudy) => {
    setSelectedItem(item)
    setShowNarrativeEditor(true)
  }

  const handleSaveNarrative = (narrative: GeneratedNarrative) => {
    if (!portfolio || !selectedItem) return

    // Update the item with the new narrative
    if ('category' in selectedItem) {
      // It's a project
      setPortfolio({
        ...portfolio,
        projects: portfolio.projects.map(p => 
          p.id === selectedItem.id 
            ? { ...p, description: narrative.content.summary }
            : p
        )
      })
    } else {
      // It's a case study
      setPortfolio({
        ...portfolio,
        caseStudies: portfolio.caseStudies.map(c => 
          c.id === selectedItem.id 
            ? { ...c, description: narrative.content.summary }
            : c
        )
      })
    }

    setShowNarrativeEditor(false)
    setSelectedItem(null)
  }

  const handleSave = () => {
    if (portfolio && onSave) {
      onSave(portfolio)
    }
  }

  const handlePublish = () => {
    if (portfolio && onPublish) {
      onPublish({ ...portfolio, published: true, publishedAt: new Date().toISOString() })
    }
  }

  if (!portfolio) return null

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark">
            AI Portfolio Builder
          </h1>
          <p className="text-text-secondary dark:text-text-secondary-dark">
            Let AI help you create compelling narratives and optimize your portfolio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShow(true)}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="flex items-center gap-2"
          >
            <Eye size={16} />
            {isPreviewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button
            variant="primary"
            onClick={handleAIGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <Wand2 size={16} className={isGenerating ? 'animate-pulse' : ''} />
            {isGenerating ? 'Generating...' : 'AI Generate'}
          </Button>
        </div>
      </div>

      {/* AI Generation Progress */}
      {isGenerating && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <RefreshCw size={20} className="animate-spin text-primary-500" />
              <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
                AI is working its magic...
              </h3>
            </div>
            <div className="space-y-3">
              {generationSteps.map((step, index) => (
                <div key={step.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                      {step.title}
                    </span>
                    <span className="text-sm text-text-tertiary dark:text-text-tertiary-dark">
                      {step.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all duration-300',
                        step.status === 'completed' ? 'bg-green-500' :
                        step.status === 'in-progress' ? 'bg-primary-500' :
                        step.status === 'error' ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                      )}
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-secondary dark:text-text-secondary-dark">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Portfolio Content */}
      {!isPreviewMode ? (
        <div className="space-y-6">
          {/* Portfolio*/}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-4">
              Portfolio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={portfolio.title}
                  onChange={(e) => setPortfolio({ ...portfolio, title: e.target.value })}
                  className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={portfolio.description}
                  onChange={(e) => setPortfolio({ ...portfolio, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </Card>

          {/* Projects and Case Studies */}
          <PortfolioGrid
            projects={portfolio.projects}
            caseStudies={portfolio.caseStudies}
            onProjectView={(project) => handleEditNarrative(project)}
            onProjectEdit={(project) => handleEditNarrative(project)}
            onCaseStudyView={(caseStudy) => handleEditNarrative(caseStudy)}
            onCaseStudyEdit={(caseStudy) => handleEditNarrative(caseStudy)}
            onAddProject={() => {
              // Handle add project
            }}
            onAddCaseStudy={() => {
              // Handle add case study
            }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Preview Mode */}
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-4">
              Portfolio Preview
            </h2>
            <p className="text-text-secondary dark:text-text-secondary-dark mb-6">
              This is how your portfolio will look to visitors
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="primary"
                onClick={handleSave}
                className="flex items-center gap-2"
              >
                <Save size={16} />
                Save Draft
              </Button>
              <Button
                variant="primary"
                onClick={handlePublish}
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Publish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Narrative Editor Modal */}
      <Modal
        isOpen={showNarrativeEditor}
        onClose={() => setShowNarrativeEditor(false)}
        title="Edit Narrative"
        size="xl"
      >
        {selectedItem && (
          <NarrativeEditor
            initialData={{
              title: selectedItem.title,
              description: selectedItem.description,
              metadata: 'category' in selectedItem ? selectedItem.metadata : {},
              assets: 'assets' in selectedItem ? selectedItem.assets : []
            }}
            type={'category' in selectedItem ? 'project' : 'casestudy'}
            onSave={handleSaveNarrative}
          />
        )}
      </Modal>

      {/*Modal */}
      <Modal
        isOpen={show}
        onClose={() => setShow(false)}
        title="Portfolio"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-text-primary dark:text-text-primary-dark mb-3">
              Display</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                  Show Categories
                </span>
                <input
                  type="checkbox"
                  checked={portfolio.settings.showCategories}
                  onChange={(e) => setPortfolio({
                    ...portfolio,
                    settings: { ...portfolio.settings, showCategories: e.target.checked }
                  })}
                  className="w-4 h-4 text-primary-600 bg-surface dark:bg-surface-dark border-border dark:border-border-dark rounded focus:ring-primary-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                  Show Tags
                </span>
                <input
                  type="checkbox"
                  checked={portfolio.settings.showTags}
                  onChange={(e) => setPortfolio({
                    ...portfolio,
                    settings: { ...portfolio.settings, showTags: e.target.checked }
                  })}
                  className="w-4 h-4 text-primary-600 bg-surface dark:bg-surface-dark border-border dark:border-border-dark rounded focus:ring-primary-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                  Show Dates
                </span>
                <input
                  type="checkbox"
                  checked={portfolio.settings.showDates}
                  onChange={(e) => setPortfolio({
                    ...portfolio,
                    settings: { ...portfolio.settings, showDates: e.target.checked }
                  })}
                  className="w-4 h-4 text-primary-600 bg-surface dark:bg-surface-dark border-border dark:border-border-dark rounded focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
