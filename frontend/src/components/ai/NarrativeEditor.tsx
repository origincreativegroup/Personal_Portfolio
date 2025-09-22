import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wand2, 
  RefreshCw, 
  Save, 
  Edit3, 
  Eye, 
  Download, 
  Share2,
  Lightbulb,
  Target,
  Clock,
  FileText,
  CheckCircle
} from 'lucide-react'
import { cn } from '../../shared/utils'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { 
  GeneratedNarrative, 
  NarrativePrompt, 
  AINarrativeService,
  narrativeTemplates 
} from '../../services/aiNarrativeService'

// ===== TYPES =====

interface NarrativeEditorProps {
  initialData?: {
    title: string
    description?: string
    metadata?: Record<string, any>
    assets?: Array<{
      type: string
      name: string
      description?: string
    }>
  }
  type: 'project' | 'casestudy' | 'portfolio' | 'asset'
  onSave?: (narrative: GeneratedNarrative) => void
  onGenerate?: (prompt: NarrativePrompt) => void
  className?: string
}

interface NarrativeSection {
  id: string
  title: string
  content: string
  placeholder: string
  required: boolean
  maxLength?: number
}

// ===== COMPONENT =====

export default function NarrativeEditor({
  initialData,
  type,
  onSave,
  className}: NarrativeEditorProps) {
  const [narrative, setNarrative] = useState<GeneratedNarrative | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showVariations, setShowVariations] = useState(false)
  const [variations, setVariations] = useState<GeneratedNarrative[]>([])
  const [prompt, setPrompt] = useState<NarrativePrompt>({
    type,
    content: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      metadata: initialData?.metadata || {},
      assets: initialData?.assets || []
    },
    tone: 'professional',
    length: 'medium',
    targetAudience: 'public'
  })

  const aiService = useRef(new AINarrativeService('mock-api-key'))
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement>>({})

  // Initialize narrative sections
  const sections: NarrativeSection[] = [
    {
      id: 'summary',
      title: 'Summary',
      content: narrative?.content.summary || '',
      placeholder: 'A compelling overview that captures the essence of your work...',
      required: true,
      maxLength: 200
    },
    {
      id: 'problem',
      title: 'Problem',
      content: narrative?.content.problem || '',
      placeholder: 'Describe the challenge or problem that needed to be solved...',
      required: true,
      maxLength: 300
    },
    {
      id: 'solution',
      title: 'Solution',
      content: narrative?.content.solution || '',
      placeholder: 'Explain your approach and the solution you developed...',
      required: true,
      maxLength: 400
    },
    {
      id: 'process',
      title: 'Process',
      content: narrative?.content.process || '',
      placeholder: 'Walk through your methodology and key steps taken...',
      required: false,
      maxLength: 500
    },
    {
      id: 'results',
      title: 'Results',
      content: narrative?.content.results || '',
      placeholder: 'Share the outcomes, metrics, and achievements...',
      required: true,
      maxLength: 300
    },
    {
      id: 'impact',
      title: 'Impact',
      content: narrative?.content.impact || '',
      placeholder: 'Describe the broader impact and learnings...',
      required: false,
      maxLength: 250
    }
  ]

  // Generate initial narrative
  useEffect(() => {
    if (initialData && !narrative) {
      handleGenerate()
    }
  }, [initialData])

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const generated = await aiService.current.generateNarrative(prompt)
      setNarrative(generated)
      setIsEditing(false)
    } catch (error) {
      console.error('Error generating narrative:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateVariations = async () => {
    setIsGenerating(true)
    try {
      const generatedVariations = await aiService.current.generateVariations(prompt, 3)
      setVariations(generatedVariations)
      setShowVariations(true)
    } catch (error) {
      console.error('Error generating variations:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSectionChange = (sectionId: string, content: string) => {
    if (!narrative) return

    setNarrative({
      ...narrative,
      content: {
        ...narrative.content,
        [sectionId]: content
      }
    })
  }

  const handleSave = () => {
    if (narrative && onSave) {
      onSave(narrative)
    }
  }

  const handleSelectVariation = (variation: GeneratedNarrative) => {
    setNarrative(variation)
    setShowVariations(false)
  }


  const getWordCount = (text: string) => {
    return text.split(' ').filter(word => word.length > 0).length
  }

  const getReadingTime = (text: string) => {
    const wordCount = getWordCount(text)
    return Math.ceil(wordCount / 200)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
            AI Narrative Editor
          </h2>
          <p className="text-text-secondary dark:text-text-secondary-dark">
            Generate compelling stories from your creative work
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2"
          >
            <FileText size={16} />
            Templates
          </Button>
          <Button
            variant="outline"
            onClick={handleGenerateVariations}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
            Variations
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <Wand2 size={16} className={isGenerating ? 'animate-pulse' : ''} />
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </div>
      </div>

      {/* Prompt Configuration */}
      <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-text-primary dark:text-text-primary-dark">Generation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
              Tone
            </label>
            <select
              value={prompt.tone}
              onChange={(e) => setPrompt({ ...prompt, tone: e.target.value as any })}
              className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="professional">Professional</option>
              <option value="creative">Creative</option>
              <option value="casual">Casual</option>
              <option value="technical">Technical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
              Length
            </label>
            <select
              value={prompt.length}
              onChange={(e) => setPrompt({ ...prompt, length: e.target.value as any })}
              className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
              Target Audience
            </label>
            <select
              value={prompt.targetAudience}
              onChange={(e) => setPrompt({ ...prompt, targetAudience: e.target.value as any })}
              className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="client">Client</option>
              <option value="peer">Peer</option>
              <option value="public">Public</option>
              <option value="recruiter">Recruiter</option>
            </select>
          </div>
        </div>
      </div>

      {/* Narrative Content */}
      {narrative && (
        <div className="space-y-6">
          {/* Narrative Stats */}
          <div className="flex items-center gap-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-primary-600 dark:text-primary-400" />
              <span className="text-sm text-primary-700 dark:text-primary-300">
                {narrative.metadata.wordCount} words
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-primary-600 dark:text-primary-400" />
              <span className="text-sm text-primary-700 dark:text-primary-300">
                {narrative.metadata.readingTime} min read
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target size={16} className="text-primary-600 dark:text-primary-400" />
              <span className="text-sm text-primary-700 dark:text-primary-300">
                {narrative.metadata.tone} tone
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className="text-primary-600 dark:text-primary-400" />
              <span className="text-sm text-primary-700 dark:text-primary-300">
                {Math.round(narrative.metadata.confidence * 100)}% confidence
              </span>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                    {section.title}
                    {section.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="flex items-center gap-2 text-xs text-text-tertiary dark:text-text-tertiary-dark">
                    <span>{getWordCount(section.content)} words</span>
                    <span>•</span>
                    <span>{getReadingTime(section.content)} min</span>
                    {section.maxLength && (
                      <>
                        <span>•</span>
                        <span className={section.content.length > section.maxLength ? 'text-red-500' : ''}>
                          {section.content.length}/{section.maxLength}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <textarea
                  ref={(el) => {
                    if (el) textareaRefs.current[section.id] = el
                  }}
                  value={section.content}
                  onChange={(e) => handleSectionChange(section.id, e.target.value)}
                  placeholder={section.placeholder}
                  className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows={4}
                  maxLength={section.maxLength}
                />
              </div>
            ))}
          </div>

          {/* AI Suggestions */}
          {narrative.suggestions && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <Lightbulb size={16} />
                AI Suggestions
              </h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Improvements:</p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    {narrative.suggestions.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-blue-500 rounded-full" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Key Points:</p>
                  <div className="flex flex-wrap gap-1">
                    {narrative.suggestions.keyPoints.map((point, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded"
                      >
                        {point}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border dark:border-border-dark">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                {isEditing ? 'Preview' : 'Edit'}
              </Button>
              <Button
                variant="outline"
                onClick={handleSave}
                className="flex items-center gap-2"
              >
                <Save size={16} />
                Save
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <Eye size={16} />
                Preview
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Export
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Share
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Variations Modal */}
      <Modal
        isOpen={showVariations}
        onClose={() => setShowVariations(false)}
        title="Choose a Variation"
        size="lg"
      >
        <div className="space-y-4">
          {variations.map((variation, index) => (
            <div
              key={index}
              className="p-4 border border-border dark:border-border-dark rounded-lg hover:bg-surface-secondary dark:hover:bg-surface-secondary-dark cursor-pointer transition-colors"
              onClick={() => handleSelectVariation(variation)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-text-primary dark:text-text-primary-dark">
                  Variation {index + 1} - {variation.metadata.tone} tone
                </h4>
                <span className="text-xs text-text-tertiary dark:text-text-tertiary-dark">
                  {variation.metadata.wordCount} words
                </span>
              </div>
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark line-clamp-3">
                {variation.content.summary}
              </p>
            </div>
          ))}
        </div>
      </Modal>

      {/* Templates Modal */}
      <Modal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        title="Narrative Templates"
        size="lg"
      >
        <div className="space-y-4">
          {narrativeTemplates
            .filter(template => template.category === type)
            .map((template) => (
              <div
                key={template.id}
                className="p-4 border border-border dark:border-border-dark rounded-lg hover:bg-surface-secondary dark:hover:bg-surface-secondary-dark cursor-pointer transition-colors"
                onClick={() => {
                  // Apply template settings
                  setPrompt({
                    ...prompt,
                    tone: template.settings.defaultTone as any,
                    length: template.settings.defaultLength as any
                  })
                  setShowTemplates(false)
                }}
              >
                <h4 className="font-medium text-text-primary dark:text-text-primary-dark mb-2">
                  {template.name}
                </h4>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-3">
                  {template.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-text-tertiary dark:text-text-tertiary-dark">
                  <span>Tone: {template.settings.defaultTone}</span>
                  <span>Length: {template.settings.defaultLength}</span>
                  <span>Fields: {template.settings.requiredFields.length}</span>
                </div>
              </div>
            ))}
        </div>
      </Modal>
    </div>
  )
}
