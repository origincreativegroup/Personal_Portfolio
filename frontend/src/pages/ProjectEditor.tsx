import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Save, Eye, Download, ArrowLeft, FileText, Palette, Sparkles, Wand2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { PageHeader } from '../components/navigation/Breadcrumbs'
import SimpleAssetManager from '../components/asset-manager/SimpleAssetManager'
import GrapesJSEditor from '../components/GrapesJSEditor'
import ProjectDesignEditor from '../components/editors/ProjectDesignEditor'
import { createCaseStudyBlocks, buildCaseStudyTemplate, type ProjectMeta } from '../utils/caseStudyTemplates'
import { useProjectSave } from '../hooks/useProjectSave'
import { generateThumbnail, getAssetThumbnail } from '../utils/thumbnailUtils'
import { AssetStorage } from '../utils/assetStorage'
import type { ProjectAsset } from '../types/asset'

export default function ProjectEditor() {
  const { id } = useParams()
  const [title, setTitle] = useState('')
  const [editorMode, setEditorMode] = useState<'design' | 'grapes' | 'code'>('design')
  
  // Save functionality
  const { isSaving, lastSaved, error, saveProject, autoSaveContent } = useProjectSave({
    projectId: id || 'new',
    autoSave: true
  })
  const [client, setClient] = useState('')
  const [summary, setSummary] = useState('')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [results, setResults] = useState('')
  const [tags, setTags] = useState('')
  const [assets, setAssets] = useState<ProjectAsset[]>([])
  const [heroAssetId, setHeroAssetId] = useState<string | null>(null)
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [showVisualEditor, setShowVisualEditor] = useState(false)
  const [editorHtml, setEditorHtml] = useState('<div class="case-study"><p>Start building your case study...</p></div>')
  const [editorCss, setEditorCss] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)

  const isNewProject = id === 'new'

  // Load assets from storage on component mount
  useEffect(() => {
    const loadAssets = () => {
      try {
        const storedAssets = AssetStorage.getAssets(id || 'new')
        if (storedAssets.length > 0) {
          // Convert stored assets back to ProjectAsset format
          const projectAssets: ProjectAsset[] = storedAssets.map(stored => ({
            ...stored,
            dataUrl: '', // Will be empty - files need to be re-uploaded
            thumbnailUrl: undefined
          }))
          setAssets(projectAssets)
          console.log('Loaded asset metadata from storage:', projectAssets)
        }
      } catch (error) {
        console.error('Failed to load assets from storage:', error)
      }
    }
    
    loadAssets()
  }, [id])

  // Asset management handlers
  const handleAssetUpload = async (files: FileList) => {
    console.log('🚀 Uploading files:', files.length, 'files')
    console.log('Files:', Array.from(files).map(f => ({ name: f.name, type: f.type, size: f.size })))
    const newAssets: ProjectAsset[] = []

    // Process each file sequentially to ensure proper state updates
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Create a data URL for the file
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })

      // Create asset object
      const newAsset: ProjectAsset = {
        id: Date.now().toString() + i,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 
              file.type.startsWith('audio/') ? 'audio' : 'document',
        size: file.size,
        mimeType: file.type,
        dataUrl,
        addedAt: new Date().toISOString(),
        description: `Project asset: ${file.name}`,
        tags: ['project-asset'],
        folder: 'project-assets',
        featured: false,
        visibility: 'public',
      }

      // Add dimensions and thumbnail for images synchronously
      if (file.type.startsWith('image/')) {
        await new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = async () => {
            newAsset.width = img.width
            newAsset.height = img.height
            
            // Generate thumbnail
            try {
              newAsset.thumbnailUrl = await generateThumbnail(file, 150, 150)
            } catch (error) {
              console.warn('Failed to generate thumbnail:', error)
            }
            
            resolve()
          }
          img.onerror = () => resolve() // Continue even if image fails to load
          img.src = dataUrl
        })
      }

      newAssets.push(newAsset)
    }

    // Add all new assets to the existing list
    console.log('Adding new assets:', newAssets)
    setAssets(prev => {
      const updated = [...prev, ...newAssets]
      console.log('Updated assets:', updated)
      
      // Save each asset to storage
      newAssets.forEach(asset => {
        AssetStorage.saveAsset(id || 'new', {
          id: asset.id,
          name: asset.name,
          type: asset.type,
          size: asset.size,
          mimeType: asset.mimeType,
          addedAt: asset.addedAt,
          description: asset.description,
          tags: asset.tags,
          folder: asset.folder,
          featured: asset.featured,
          visibility: asset.visibility,
          width: asset.width,
          height: asset.height,
          duration: asset.duration
        })
      })
      
      return updated
    })
  }

  const handleAssetRemove = (assetId: string) => {
    setAssets(prev => {
      const updated = prev.filter(asset => asset.id !== assetId)
      
      // Remove from storage
      AssetStorage.removeAsset(id || 'new', assetId)
      
      return updated
    })
    
    if (heroAssetId === assetId) {
      setHeroAssetId(null)
    }
    
    // Remove from selected assets
    setSelectedAssets(prev => prev.filter(id => id !== assetId))
  }

  const handleAssetSelect = (assetId: string) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    )
  }

  const handleAssetToggle = (assetId: string) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    )
  }

  const handleSave = async () => {
    console.log('Saving project with data:', {
      title,
      client,
      summary,
      problem,
      solution,
      results,
      assets: assets.length,
      heroAssetId
    })
    
    const projectData = {
      title,
      client,
      summary,
      problem,
      solution,
      results,
      technologies: [], // TODO: Add technologies state
      timeframe: '', // TODO: Add timeframe state
      role: '', // TODO: Add role state
      assets,
      heroAssetId
    }
    
    const success = await saveProject(projectData)
    if (success) {
      console.log('Project saved successfully')
      alert('Project saved successfully!')
    } else {
      console.error('Failed to save project')
      alert('Failed to save project. Check console for details.')
    }
  }

  const handlePreview = (content: any) => {
    console.log('Previewing content:', content)
    // Open preview in new window or modal
  }


  // AI handlers
  const handleAIAnalysis = async () => {
    if (!title || !problem || !solution || !results) {
      alert('Please fill in the basic project information (title, problem, solution, results) before running AI analysis.')
      return
    }

    setAiLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/ai/analyze-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          summary,
          description: `${problem}\n\n${solution}\n\n${results}`,
          narrativeHooks: {
            problem,
            challenge: 'Project constraints and challenges',
            solution,
            impact: results,
          },
          technologies: tags ? tags.split(',').map(t => t.trim()) : [],
          role: client || 'Designer',
        }),
      })

      const data = await response.json()
      setAiAnalysis(data.analysis)
      
      // Auto-populate suggestions
      if (data.analysis.suggestedTitle && data.analysis.suggestedTitle !== title) {
        if (confirm(`AI suggests this title: "${data.analysis.suggestedTitle}". Apply it?`)) {
          setTitle(data.analysis.suggestedTitle)
        }
      }
      
      if (data.analysis.suggestedTags && data.analysis.suggestedTags.length > 0) {
        const suggestedTags = data.analysis.suggestedTags.join(', ')
        if (confirm(`AI suggests these tags: "${suggestedTags}". Apply them?`)) {
          setTags(suggestedTags)
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error)
      alert('Failed to analyze project with AI. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleGenerateNarrative = async () => {
    if (!problem || !solution || !results) {
      alert('Please fill in problem, solution, and results before generating narrative.')
      return
    }

    setAiLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/ai/generate-narrative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          narrativeHooks: {
            problem,
            challenge: 'Project constraints and timeline',
            solution,
            impact: results,
          },
          tone: 'professional',
        }),
      })

      const data = await response.json()
      
      // Replace the visual editor content with the generated narrative
      setEditorHtml(`
        <div class="case-study">
          <h1>${title}</h1>
          ${data.narrative.replace(/\n/g, '<br>')}
        </div>
      `)
      setShowVisualEditor(true)
    } catch (error) {
      console.error('Narrative generation error:', error)
      alert('Failed to generate narrative. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleGenerateExecutiveSummary = async () => {
    const content = `${title}\n\n${summary}\n\nProblem: ${problem}\n\nSolution: ${solution}\n\nResults: ${results}`
    
    setAiLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/ai/executive-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      const data = await response.json()
      setSummary(data.summary)
    } catch (error) {
      console.error('Executive summary error:', error)
      alert('Failed to generate executive summary. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  // GrapesJS editor handlers
  const handleEditorChange = (document: { html: string; css: string }) => {
    setEditorHtml(document.html)
    setEditorCss(document.css)
  }

  const generateCaseStudyTemplate = () => {
    // Use selected assets or all assets if none selected
    const assetsToUse = selectedAssets.length > 0 
      ? assets.filter(asset => selectedAssets.includes(asset.id))
      : assets

    const projectMeta: ProjectMeta = {
      title: title || 'Untitled Project',
      summary: summary || 'Project summary',
      problem: problem || 'Project challenge',
      solution: solution || 'Project solution',
      outcomes: results || 'Project outcomes',
      role: client || 'Project role',
      tags: tags ? tags.split(',').map(t => t.trim()) : ['Case Study'],
      cover: heroAssetId || undefined,
      assets: assetsToUse,
    }

    const template = buildCaseStudyTemplate(projectMeta)
    setEditorHtml(template.html)
    setEditorCss(template.css)
    setShowVisualEditor(true)
  }

  const getCaseStudyBlocks = () => {
    if (!title) return []
    
    // Use selected assets or all assets if none selected
    const assetsToUse = selectedAssets.length > 0 
      ? assets.filter(asset => selectedAssets.includes(asset.id))
      : assets
    
    const projectMeta: ProjectMeta = {
      title: title || 'Untitled Project',
      summary: summary || 'Project summary',
      problem: problem || 'Project challenge',
      solution: solution || 'Project solution',
      outcomes: results || 'Project outcomes',
      role: client || 'Project role',
      tags: tags ? tags.split(',').map(t => t.trim()) : ['Case Study'],
      cover: heroAssetId || undefined,
      assets: assetsToUse,
    }

    return createCaseStudyBlocks(projectMeta)
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={isNewProject ? 'New Case Study' : 'Edit Case Study'}
        subtitle="Create and edit your portfolio case study"
        actions={
          <div className="flex items-center space-x-3">
            <Button as={Link} to="/projects" variant="outline" icon={<ArrowLeft className="w-4 h-4" />}>
              Back to Projects
            </Button>
            <Button variant="outline" icon={<Eye className="w-4 h-4" />}>
              Preview
            </Button>
            <Button variant="outline" icon={<Download className="w-4 h-4" />}>
              Export
            </Button>
            <Button
              variant="outline"
              icon={<Sparkles className="w-4 h-4" />}
              onClick={handleAIAnalysis}
              loading={aiLoading}
            >
              AI Analysis
            </Button>
            <Button
              variant="outline"
              icon={<Wand2 className="w-4 h-4" />}
              onClick={handleGenerateNarrative}
              loading={aiLoading}
            >
              Generate Narrative
            </Button>
            <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleSave}>
              Save Case Study
            </Button>
          </div>
        }
      />

      <div className="py-8">
        <div className="container-responsive">
          <main className="space-y-8">

        {/* Project Metadata */}
            <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Project Information</h2>
          <div className="form-grid form-grid--two-column">
            <Input
              label="Project Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., E-commerce Platform Redesign"
              fullWidth
            />
            
            <Input
              label="Client/Organization"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="e.g., TechCorp Inc."
              fullWidth
            />

                   <div className="form-control form-control--full">
                     <div className="flex items-center justify-between mb-2">
                       <label htmlFor="summary" className="form-control__label">
                         Project Summary
                       </label>
                       <Button
                         variant="outline"
                         size="sm"
                         icon={<Sparkles className="w-3 h-3" />}
                         onClick={handleGenerateExecutiveSummary}
                         loading={aiLoading}
                       >
                         AI Summary
                       </Button>
                     </div>
                     <textarea
                       id="summary"
                       value={summary}
                       onChange={(e) => setSummary(e.target.value)}
                       placeholder="Brief overview of the project and its impact..."
                       rows={3}
                       className="form-control__textarea"
                     />
                   </div>

            <Input
              label="Tags (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="UX Design, E-commerce, React, JavaScript"
              fullWidth
            />
          </div>
        </div>

        {/* Case Study Content */}
            <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Case Study Content</h2>
          <div className="form-grid">
            <div className="form-control">
              <label htmlFor="problem" className="form-control__label">
                Problem Statement
              </label>
              <textarea
                id="problem"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="What problem were you trying to solve? What challenges did the client face?"
                rows={4}
                className="form-control__textarea"
              />
            </div>

            <div className="form-control">
              <label htmlFor="solution" className="form-control__label">
                Solution & Process
              </label>
              <textarea
                id="solution"
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="How did you approach the problem? What was your methodology and process?"
                rows={6}
                className="form-control__textarea"
              />
            </div>

            <div className="form-control">
              <label htmlFor="results" className="form-control__label">
                Results & Impact
              </label>
              <textarea
                id="results"
                value={results}
                onChange={(e) => setResults(e.target.value)}
                placeholder="What were the outcomes? Include metrics, testimonials, and measurable results..."
                rows={4}
                className="form-control__textarea"
              />
            </div>
          </div>
        </div>

               {/* Asset Management */}
                   <div className="bg-surface border border-border rounded-2xl p-6">
                 <h2 className="text-xl font-semibold text-text-primary mb-2">Project Assets</h2>
                 <p className="text-text-secondary">Manage images, videos, documents, and other project files</p>
                 <p className="text-sm text-text-tertiary mt-1">Current assets: {assets.length}</p>
                 
                 <div className="mt-6">
                   <SimpleAssetManager
                     assets={assets}
                     onAssetUpload={handleAssetUpload}
                     onAssetRemove={handleAssetRemove}
                     onAssetSelect={(asset) => {
                       console.log('Selected asset:', asset)
                       // Handle asset selection for project
                     }}
                     onAssetToggle={handleAssetToggle}
                     selectedAssets={selectedAssets}
                     showSelection={true}
                   />
                 </div>
               </div>

               {/* Selected Assets for Case Study */}
               {selectedAssets.length > 0 && (
                 <div className="bg-surface border border-border rounded-2xl p-6">
                   <h2 className="text-xl font-semibold text-text-primary mb-2">Selected Assets for Case Study</h2>
                   <p className="text-text-secondary mb-4">
                     {selectedAssets.length} asset{selectedAssets.length > 1 ? 's' : ''} selected for use in case study generation
                   </p>
                   <div className="flex flex-wrap gap-2">
                     {selectedAssets.map(assetId => {
                       const asset = assets.find(a => a.id === assetId)
                       return asset ? (
                         <div key={assetId} className="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 px-3 py-2 rounded-lg">
                           <img 
                             src={getAssetThumbnail(asset)} 
                             alt={asset.name}
                             className="w-8 h-8 object-cover rounded"
                           />
                           <span className="text-sm font-medium text-text-primary">{asset.name}</span>
                           <button
                             onClick={() => handleAssetToggle(assetId)}
                             className="text-primary-600 hover:text-primary-800"
                           >
                             <X size={16} />
                           </button>
                         </div>
                       ) : null
                     })}
                   </div>
                 </div>
               )}

               {/* AI Analysis Results */}
               {aiAnalysis && (
                     <div className="bg-surface border border-border rounded-2xl p-6">
                   <h2 className="text-xl font-semibold text-text-primary mb-2">AI Analysis Results</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <h3 className="text-lg font-semibold mb-3">Project Insights</h3>
                       <div className="space-y-3">
                         <div>
                           <label className="text-sm font-medium text-gray-600">Suggested Title:</label>
                           <p className="text-sm">{aiAnalysis.suggestedTitle}</p>
                         </div>
                         <div>
                           <label className="text-sm font-medium text-gray-600">Category:</label>
                           <p className="text-sm">{aiAnalysis.suggestedCategory}</p>
                         </div>
                         <div>
                           <label className="text-sm font-medium text-gray-600">Suggested Tags:</label>
                           <p className="text-sm">{aiAnalysis.suggestedTags.join(', ')}</p>
                         </div>
                       </div>
                     </div>
                     <div>
                       <h3 className="text-lg font-semibold mb-3">Analysis Confidence</h3>
                       <div className="space-y-3">
                         <div>
                           <label className="text-sm font-medium text-gray-600">Problem Analysis:</label>
                           <div className="w-full bg-gray-200 rounded-full h-2">
                             <div 
                               className="bg-blue-600 h-2 rounded-full" 
                               style={{ width: `${aiAnalysis.problemConfidence * 100}%` }}
                             ></div>
                           </div>
                           <p className="text-xs text-gray-500">{Math.round(aiAnalysis.problemConfidence * 100)}% confidence</p>
                         </div>
                         <div>
                           <label className="text-sm font-medium text-gray-600">Solution Analysis:</label>
                           <div className="w-full bg-gray-200 rounded-full h-2">
                             <div 
                               className="bg-green-600 h-2 rounded-full" 
                               style={{ width: `${aiAnalysis.solutionConfidence * 100}%` }}
                             ></div>
                           </div>
                           <p className="text-xs text-gray-500">{Math.round(aiAnalysis.solutionConfidence * 100)}% confidence</p>
                         </div>
                         <div>
                           <label className="text-sm font-medium text-gray-600">Impact Analysis:</label>
                           <div className="w-full bg-gray-200 rounded-full h-2">
                             <div 
                               className="bg-purple-600 h-2 rounded-full" 
                               style={{ width: `${aiAnalysis.impactConfidence * 100}%` }}
                             ></div>
                           </div>
                           <p className="text-xs text-gray-500">{Math.round(aiAnalysis.impactConfidence * 100)}% confidence</p>
                         </div>
                       </div>
                     </div>
                   </div>
                   <div className="mt-6">
                     <h3 className="text-lg font-semibold mb-3">Generated Story</h3>
                     <p className="text-sm text-gray-700 leading-relaxed">{aiAnalysis.story}</p>
                   </div>
                 </div>
               )}

               {/* Visual Case Study Builder */}
                   <div className="bg-surface border border-border rounded-2xl p-6">
                 <div className="flex items-center justify-between mb-6">
                   <div>
                     <h3 className="text-xl font-semibold text-text-primary mb-2">Visual Case Study Builder</h3>
                     <p className="text-text-secondary">Build beautiful case studies with drag-and-drop blocks</p>
                   </div>
                   <div className="flex items-center space-x-3">
                     <Button
                       variant="outline"
                       icon={<Palette className="w-4 h-4" />}
                       onClick={() => setShowVisualEditor(!showVisualEditor)}
                     >
                       {showVisualEditor ? 'Hide Editor' : 'Show Visual Editor'}
                     </Button>
                     <Button
                       variant="primary"
                       icon={<FileText className="w-4 h-4" />}
                       onClick={generateCaseStudyTemplate}
                     >
                       Generate Template
                     </Button>
                   </div>
                 </div>

                 {showVisualEditor ? (
                   <div className="border border-gray-200 rounded-xl overflow-hidden" style={{ height: '600px' }}>
                     {editorMode === 'design' ? (
                       <ProjectDesignEditor
                         projectId={id || 'new'}
                         initialContent={{
                           title,
                           description: summary,
                           heroImage: heroAssetId ? assets.find(a => a.id === heroAssetId)?.dataUrl : '',
                           sections: []
                         }}
                         onSave={handleSave}
                         onPreview={handlePreview}
                       />
                     ) : (
                       <GrapesJSEditor
                         initialHtml={editorHtml}
                         initialCss={editorCss}
                         blocks={getCaseStudyBlocks()}
                         onChange={handleEditorChange}
                         height="600px"
                         className="w-full"
                       />
                     )}
                   </div>
                 ) : (
                   <div className="upload-dropzone">
                     <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
                     <p className="text-lg font-medium mb-2">Visual Editor Ready</p>
                     <p className="text-sm mb-4">Click "Show Visual Editor" to start building your case study with drag-and-drop blocks, media galleries, and custom layouts.</p>
                     <Button
                       variant="primary"
                       icon={<Palette className="w-4 h-4" />}
                       onClick={() => setShowVisualEditor(true)}
                     >
                       Launch Visual Editor
                     </Button>
                   </div>
                 )}
               </div>
          </main>
        </div>
      </div>
    </div>
  )
}
