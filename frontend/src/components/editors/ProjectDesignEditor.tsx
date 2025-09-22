import { useState, useRef, useEffect } from 'react'
import { Save, Eye, Undo, Redo, Copy, Trash2 } from 'lucide-react'
import ModernButton from '../ui/ModernButton'
import ModernCard from '../ui/ModernCard'
import ModernInput from '../ui/ModernInput'

interface ProjectDesignEditorProps {
  projectId: string
  initialContent?: {
    title: string
    description: string
    heroImage?: string
    sections: ProjectSection[]
  }
  onSave: (content: any) => void
  onPreview: (content: any) => void
}

interface ProjectSection {
  id: string
  type: 'hero' | 'text' | 'image' | 'gallery' | 'metrics' | 'testimonial'
  content: any
  position: { x: number; y: number; width: number; height: number }
  constraints: {
    minWidth: number
    maxWidth: number
    minHeight: number
    maxHeight: number
    aspectRatio?: number
  }
}

const SECTION_TYPES = [
  { id: 'hero', name: 'Hero Section', icon: '🎯', description: 'Main project showcase' },
  { id: 'text', name: 'Text Block', icon: '📝', description: 'Rich text content' },
  { id: 'image', name: 'Image', icon: '🖼️', description: 'Single image display' },
  { id: 'gallery', name: 'Gallery', icon: '🖼️', description: 'Image gallery' },
  { id: 'metrics', name: 'Metrics', icon: '📊', description: 'Key performance indicators' },
  { id: 'testimonial', name: 'Testimonial', icon: '💬', description: 'Client testimonial' },
]

const DESIGN_CONSTRAINTS = {
  maxSections: 12,
  maxWidth: 1200,
  minWidth: 320,
  gridSize: 20,
  snapThreshold: 10,
  aspectRatios: {
    hero: 16/9,
    image: 4/3,
    gallery: 1/1,
    metrics: 3/2,
    testimonial: 2/1,
  }
}

export default function ProjectDesignEditor({ 
  projectId, 
  initialContent, 
  onSave, 
  onPreview 
}: ProjectDesignEditorProps) {
  const [content, setContent] = useState(initialContent || {
    title: '',
    description: '',
    heroImage: '',
    sections: []
  })
  
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [history, setHistory] = useState([content])
  const [historyIndex, setHistoryIndex] = useState(0)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Undo/Redo functionality
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const saveToHistory = (newContent: typeof content) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newContent)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1)
      setContent(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1)
      setContent(history[historyIndex + 1])
    }
  }

  // Add new section
  const addSection = (type: string) => {
    if (content.sections.length >= DESIGN_CONSTRAINTS.maxSections) {
      alert('Maximum number of sections reached')
      return
    }

    const newSection: ProjectSection = {
      id: `section-${Date.now()}`,
      type: type as any,
      content: getDefaultContent(type),
      position: { x: 20, y: 20 + (content.sections.length * 100), width: 300, height: 200 },
      constraints: getConstraints(type)
    }

    const newContent = {
      ...content,
      sections: [...content.sections, newSection]
    }
    
    setContent(newContent)
    saveToHistory(newContent)
  }

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'hero':
        return { title: 'Project Title', subtitle: 'Project Subtitle', image: '' }
      case 'text':
        return { text: 'Enter your text content here...' }
      case 'image':
        return { src: '', alt: 'Image description', caption: '' }
      case 'gallery':
        return { images: [] }
      case 'metrics':
        return { items: [{ label: 'Metric 1', value: '100%' }] }
      case 'testimonial':
        return { quote: 'Great work!', author: 'Client Name', role: 'CEO' }
      default:
        return {}
    }
  }

  const getConstraints = (type: string) => {
    const aspectRatio = DESIGN_CONSTRAINTS.aspectRatios[type as keyof typeof DESIGN_CONSTRAINTS.aspectRatios]
    return {
      minWidth: 200,
      maxWidth: DESIGN_CONSTRAINTS.maxWidth,
      minHeight: 100,
      maxHeight: 600,
      aspectRatio
    }
  }

  // Drag and drop functionality
  const handleMouseDown = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault()
    setIsDragging(true)
    setSelectedSection(sectionId)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedSection) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    const newSections = content.sections.map(section => {
      if (section.id === selectedSection) {
        const newX = Math.max(0, section.position.x + deltaX)
        const newY = Math.max(0, section.position.y + deltaY)
        
        return {
          ...section,
          position: {
            ...section.position,
            x: Math.round(newX / DESIGN_CONSTRAINTS.gridSize) * DESIGN_CONSTRAINTS.gridSize,
            y: Math.round(newY / DESIGN_CONSTRAINTS.gridSize) * DESIGN_CONSTRAINTS.gridSize
          }
        }
      }
      return section
    })

    setContent({ ...content, sections: newSections })
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (selectedSection) {
      saveToHistory(content)
    }
  }

  // Resize functionality
  const handleResize = (sectionId: string, direction: string, deltaX: number, deltaY: number) => {
    const section = content.sections.find(s => s.id === sectionId)
    if (!section) return

    const { constraints } = section
    let newWidth = section.position.width
    let newHeight = section.position.height

    if (direction.includes('e')) newWidth += deltaX
    if (direction.includes('w')) newWidth -= deltaX
    if (direction.includes('s')) newHeight += deltaY
    if (direction.includes('n')) newHeight -= deltaY

    // Apply constraints
    newWidth = Math.max(constraints.minWidth, Math.min(constraints.maxWidth, newWidth))
    newHeight = Math.max(constraints.minHeight, Math.min(constraints.maxHeight, newHeight))

    // Maintain aspect ratio if specified
    if (constraints.aspectRatio) {
      newHeight = newWidth / constraints.aspectRatio
    }

    const newSections = content.sections.map(s => 
      s.id === sectionId 
        ? { ...s, position: { ...s.position, width: newWidth, height: newHeight } }
        : s
    )

    setContent({ ...content, sections: newSections })
  }

  // Delete section
  const deleteSection = (sectionId: string) => {
    const newSections = content.sections.filter(s => s.id !== sectionId)
    const newContent = { ...content, sections: newSections }
    setContent(newContent)
    saveToHistory(newContent)
  }

  // Duplicate section
  const duplicateSection = (sectionId: string) => {
    const section = content.sections.find(s => s.id === sectionId)
    if (!section) return

    const newSection = {
      ...section,
      id: `section-${Date.now()}`,
      position: {
        ...section.position,
        x: section.position.x + 20,
        y: section.position.y + 20
      }
    }

    const newContent = {
      ...content,
      sections: [...content.sections, newSection]
    }
    
    setContent(newContent)
    saveToHistory(newContent)
  }

  // Update section content
  const updateSectionContent = (sectionId: string, newContent: any) => {
    const newSections = content.sections.map(section =>
      section.id === sectionId 
        ? { ...section, content: { ...section.content, ...newContent } }
        : section
    )
    
    const updatedContent = { ...content, sections: newSections }
    setContent(updatedContent)
    saveToHistory(updatedContent)
  }

  // Render section based on type
  const renderSection = (section: ProjectSection) => {
    const { type, content: sectionContent, position } = section
    const isSelected = selectedSection === section.id

    const baseClasses = `absolute border-2 rounded-lg cursor-move transition-all duration-200 ${
      isSelected 
        ? 'border-primary-500 shadow-lg' 
        : 'border-gray-300 hover:border-gray-400'
    }`

    switch (type) {
      case 'hero':
        return (
          <div
            key={section.id}
            className={baseClasses}
            style={{
              left: position.x,
              top: position.y,
              width: position.width,
              height: position.height
            }}
            onMouseDown={(e) => handleMouseDown(e, section.id)}
          >
            <div className="w-full h-full bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">{sectionContent.title}</h2>
                <p className="text-lg opacity-90">{sectionContent.subtitle}</p>
              </div>
            </div>
            {isSelected && <ResizeHandles sectionId={section.id} onResize={handleResize} />}
          </div>
        )

      case 'text':
        return (
          <div
            key={section.id}
            className={`${baseClasses} bg-white p-4`}
            style={{
              left: position.x,
              top: position.y,
              width: position.width,
              height: position.height
            }}
            onMouseDown={(e) => handleMouseDown(e, section.id)}
          >
            <p className="text-gray-700">{sectionContent.text}</p>
            {isSelected && <ResizeHandles sectionId={section.id} onResize={handleResize} />}
          </div>
        )

      case 'image':
        return (
          <div
            key={section.id}
            className={`${baseClasses} bg-gray-100`}
            style={{
              left: position.x,
              top: position.y,
              width: position.width,
              height: position.height
            }}
            onMouseDown={(e) => handleMouseDown(e, section.id)}
          >
            <div className="w-full h-full flex items-center justify-center">
              {sectionContent.src ? (
                <img src={sectionContent.src} alt={sectionContent.alt} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="text-gray-500">Click to add image</div>
              )}
            </div>
            {isSelected && <ResizeHandles sectionId={section.id} onResize={handleResize} />}
          </div>
        )

      default:
        return (
          <div
            key={section.id}
            className={`${baseClasses} bg-gray-50`}
            style={{
              left: position.x,
              top: position.y,
              width: position.width,
              height: position.height
            }}
            onMouseDown={(e) => handleMouseDown(e, section.id)}
          >
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              {type} section
            </div>
            {isSelected && <ResizeHandles sectionId={section.id} onResize={handleResize} />}
          </div>
        )
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ModernButton
              variant="ghost"
              size="sm"
              leftIcon={<Undo className="w-4 h-4" />}
              onClick={undo}
              disabled={!canUndo}
            >
              Undo
            </ModernButton>
            <ModernButton
              variant="ghost"
              size="sm"
              leftIcon={<Redo className="w-4 h-4" />}
              onClick={redo}
              disabled={!canRedo}
            >
              Redo
            </ModernButton>
          </div>

          <div className="flex items-center space-x-4">
            <ModernButton
              variant="secondary"
              leftIcon={<Eye className="w-4 h-4" />}
              onClick={() => onPreview(content)}
            >
              Preview
            </ModernButton>
            <ModernButton
              variant="primary"
              leftIcon={<Save className="w-4 h-4" />}
              onClick={() => onSave(content)}
            >
              Save
            </ModernButton>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Sections</h3>
          
          <div className="space-y-2">
            {SECTION_TYPES.map(type => (
              <ModernCard
                key={type.id}
                variant="default"
                padding="sm"
                hover
                className="cursor-pointer"
                onClick={() => addSection(type.id)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{type.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{type.description}</div>
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>

          {/* Section Properties */}
          {selectedSection && (
            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Properties</h4>
              <div className="space-y-3">
                <ModernInput
                  label="Width"
                  type="number"
                  value={content.sections.find(s => s.id === selectedSection)?.position.width || 0}
                  onChange={(e) => {
                    const section = content.sections.find(s => s.id === selectedSection)
                    if (section) {
                      updateSectionContent(selectedSection, {
                        position: { ...section.position, width: parseInt(e.target.value) }
                      })
                    }
                  }}
                />
                <ModernInput
                  label="Height"
                  type="number"
                  value={content.sections.find(s => s.id === selectedSection)?.position.height || 0}
                  onChange={(e) => {
                    const section = content.sections.find(s => s.id === selectedSection)
                    if (section) {
                      updateSectionContent(selectedSection, {
                        position: { ...section.position, height: parseInt(e.target.value) }
                      })
                    }
                  }}
                />
                <div className="flex space-x-2">
                  <ModernButton
                    variant="outline"
                    size="sm"
                    leftIcon={<Copy className="w-4 h-4" />}
                    onClick={() => duplicateSection(selectedSection)}
                  >
                    Duplicate
                  </ModernButton>
                  <ModernButton
                    variant="outline"
                    size="sm"
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    onClick={() => deleteSection(selectedSection)}
                  >
                    Delete
                  </ModernButton>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-auto">
          <div
            ref={canvasRef}
            className="relative w-full h-full min-h-screen bg-white dark:bg-gray-900"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid background */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: `${DESIGN_CONSTRAINTS.gridSize}px ${DESIGN_CONSTRAINTS.gridSize}px`
            }} />
            
            {/* Sections */}
            {content.sections.map(renderSection)}
          </div>
        </div>
      </div>
    </div>
  )
}

// Resize handles component
function ResizeHandles({ sectionId, onResize }: { sectionId: string; onResize: (sectionId: string, direction: string, deltaX: number, deltaY: number) => void }) {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, direction: '' })

  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({ x: e.clientX, y: e.clientY, direction })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isResizing) return

    const deltaX = e.clientX - resizeStart.x
    const deltaY = e.clientY - resizeStart.y

    onResize(sectionId, resizeStart.direction, deltaX, deltaY)
    setResizeStart({ x: e.clientX, y: e.clientY, direction: resizeStart.direction })
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove as any)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, resizeStart])

  return (
    <>
      {/* Corner handles */}
      <div
        className="absolute -top-1 -left-1 w-3 h-3 bg-primary-500 rounded-full cursor-nw-resize"
        onMouseDown={(e) => handleMouseDown(e, 'nw')}
      />
      <div
        className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full cursor-ne-resize"
        onMouseDown={(e) => handleMouseDown(e, 'ne')}
      />
      <div
        className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary-500 rounded-full cursor-sw-resize"
        onMouseDown={(e) => handleMouseDown(e, 'sw')}
      />
      <div
        className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary-500 rounded-full cursor-se-resize"
        onMouseDown={(e) => handleMouseDown(e, 'se')}
      />
      
      {/* Edge handles */}
      <div
        className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-primary-500 rounded-full cursor-n-resize"
        onMouseDown={(e) => handleMouseDown(e, 'n')}
      />
      <div
        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-primary-500 rounded-full cursor-s-resize"
        onMouseDown={(e) => handleMouseDown(e, 's')}
      />
      <div
        className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-primary-500 rounded-full cursor-w-resize"
        onMouseDown={(e) => handleMouseDown(e, 'w')}
      />
      <div
        className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-primary-500 rounded-full cursor-e-resize"
        onMouseDown={(e) => handleMouseDown(e, 'e')}
      />
    </>
  )
}
