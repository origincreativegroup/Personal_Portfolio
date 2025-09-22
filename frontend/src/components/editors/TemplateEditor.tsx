import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Save, Eye, Download, Undo, Redo, Copy, Trash2, Plus, 
  Move, RotateCcw, ZoomIn, ZoomOut, Grid, Layers, 
  Type, Image, Video, Palette, Settings, Maximize2
} from 'lucide-react'
import ModernButton from '../ui/ModernButton'
import ModernCard from '../ui/ModernCard'
import ModernInput from '../ui/ModernInput'
import { Template, MockupProject, ALL_TEMPLATES } from '../../types/templates'
import { ProjectAsset } from '../../types/asset'

interface TemplateEditorProps {
  template: Template
  projectAssets: ProjectAsset[]
  onSave: (project: MockupProject) => void
  onPreview: (project: MockupProject) => void
  onExport: (project: MockupProject, format: 'png' | 'pdf' | 'jpg') => void
}

interface EditorState {
  selectedLayer: string | null
  zoom: number
  showGrid: boolean
  showLayers: boolean
  isDragging: boolean
  dragStart: { x: number; y: number }
  history: MockupProject[]
  historyIndex: number
}

export default function TemplateEditor({ 
  template, 
  projectAssets, 
  onSave, 
  onPreview, 
  onExport 
}: TemplateEditorProps) {
  const [project, setProject] = useState<MockupProject>({
    id: `mockup-${Date.now()}`,
    templateId: template.id,
    name: `${template.name} Mockup`,
    assets: {},
    customizations: {},
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const [editorState, setEditorState] = useState<EditorState>({
    selectedLayer: null,
    zoom: 1,
    showGrid: true,
    showLayers: true,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    history: [],
    historyIndex: -1
  })

  const canvasRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize project with template
  useEffect(() => {
    if (!isInitialized) {
      const initialProject: MockupProject = {
        ...project,
        customizations: template.layers.reduce((acc, layer) => {
          acc[layer.id] = { ...layer.properties }
          return acc
        }, {} as Record<string, any>)
      }
      setProject(initialProject)
      setEditorState(prev => ({
        ...prev,
        history: [initialProject],
        historyIndex: 0
      }))
      setIsInitialized(true)
    }
  }, [template, isInitialized])

  // Save to history
  const saveToHistory = useCallback((newProject: MockupProject) => {
    setEditorState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1)
      newHistory.push(newProject)
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1
      }
    })
  }, [])

  // Undo/Redo
  const undo = useCallback(() => {
    if (editorState.historyIndex > 0) {
      const newIndex = editorState.historyIndex - 1
      setProject(editorState.history[newIndex])
      setEditorState(prev => ({ ...prev, historyIndex: newIndex }))
    }
  }, [editorState.historyIndex, editorState.history])

  const redo = useCallback(() => {
    if (editorState.historyIndex < editorState.history.length - 1) {
      const newIndex = editorState.historyIndex + 1
      setProject(editorState.history[newIndex])
      setEditorState(prev => ({ ...prev, historyIndex: newIndex }))
    }
  }, [editorState.historyIndex, editorState.history])

  // Layer selection
  const selectLayer = useCallback((layerId: string) => {
    setEditorState(prev => ({ ...prev, selectedLayer: layerId }))
  }, [])

  // Asset assignment
  const assignAsset = useCallback((layerId: string, assetId: string) => {
    const newProject = {
      ...project,
      assets: { ...project.assets, [layerId]: assetId },
      updatedAt: new Date()
    }
    setProject(newProject)
    saveToHistory(newProject)
  }, [project, saveToHistory])

  // Layer property updates
  const updateLayerProperty = useCallback((layerId: string, property: string, value: any) => {
    const newProject = {
      ...project,
      customizations: {
        ...project.customizations,
        [layerId]: {
          ...project.customizations[layerId],
          [property]: value
        }
      },
      updatedAt: new Date()
    }
    setProject(newProject)
    saveToHistory(newProject)
  }, [project, saveToHistory])

  // Drag and drop
  const handleMouseDown = useCallback((e: React.MouseEvent, layerId: string) => {
    e.preventDefault()
    setEditorState(prev => ({
      ...prev,
      isDragging: true,
      selectedLayer: layerId,
      dragStart: { x: e.clientX, y: e.clientY }
    }))
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!editorState.isDragging || !editorState.selectedLayer) return

    const deltaX = (e.clientX - editorState.dragStart.x) / editorState.zoom
    const deltaY = (e.clientY - editorState.dragStart.y) / editorState.zoom

    const layer = template.layers.find(l => l.id === editorState.selectedLayer)
    if (!layer) return

    const newX = Math.max(0, layer.position.x + deltaX)
    const newY = Math.max(0, layer.position.y + deltaY)

    updateLayerProperty(editorState.selectedLayer, 'x', newX)
    updateLayerProperty(editorState.selectedLayer, 'y', newY)

    setEditorState(prev => ({
      ...prev,
      dragStart: { x: e.clientX, y: e.clientY }
    }))
  }, [editorState.isDragging, editorState.selectedLayer, editorState.dragStart, template.layers, updateLayerProperty])

  const handleMouseUp = useCallback(() => {
    setEditorState(prev => ({ ...prev, isDragging: false }))
  }, [])

  // Render layer
  const renderLayer = useCallback((layer: any) => {
    const isSelected = editorState.selectedLayer === layer.id
    const customizations = project.customizations[layer.id] || {}
    const assetId = project.assets[layer.id]
    const asset = assetId ? projectAssets.find(a => a.id === assetId) : null

    const layerStyle = {
      position: 'absolute' as const,
      left: customizations.x ?? layer.position.x,
      top: customizations.y ?? layer.position.y,
      width: customizations.width ?? layer.size.width,
      height: customizations.height ?? layer.size.height,
      zIndex: isSelected ? 1000 : 1
    }

    switch (layer.type) {
      case 'background':
        return (
          <div
            key={layer.id}
            style={{
              ...layerStyle,
              backgroundColor: customizations.color ?? layer.properties.color
            }}
            className={`${isSelected ? 'ring-2 ring-primary-500' : ''} cursor-move`}
            onMouseDown={(e) => handleMouseDown(e, layer.id)}
          />
        )

      case 'image':
        return (
          <div
            key={layer.id}
            style={layerStyle}
            className={`${isSelected ? 'ring-2 ring-primary-500' : ''} cursor-move overflow-hidden rounded-lg`}
            onMouseDown={(e) => handleMouseDown(e, layer.id)}
          >
            {asset ? (
              <img
                src={asset.dataUrl}
                alt={asset.name}
                className="w-full h-full object-cover"
                style={{ borderRadius: customizations.borderRadius }}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Image className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Click to add image</p>
                </div>
              </div>
            )}
          </div>
        )

      case 'video':
        return (
          <div
            key={layer.id}
            style={layerStyle}
            className={`${isSelected ? 'ring-2 ring-primary-500' : ''} cursor-move overflow-hidden rounded-lg`}
            onMouseDown={(e) => handleMouseDown(e, layer.id)}
          >
            {asset ? (
              <video
                src={asset.dataUrl}
                className="w-full h-full object-cover"
                autoPlay={customizations.autoplay ?? layer.properties.autoplay}
                muted={customizations.muted ?? layer.properties.muted}
                loop
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Video className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Click to add video</p>
                </div>
              </div>
            )}
          </div>
        )

      case 'text':
        return (
          <div
            key={layer.id}
            style={layerStyle}
            className={`${isSelected ? 'ring-2 ring-primary-500' : ''} cursor-move`}
            onMouseDown={(e) => handleMouseDown(e, layer.id)}
          >
            <div
              style={{
                fontSize: customizations.fontSize ?? layer.properties.fontSize,
                fontWeight: customizations.fontWeight ?? layer.properties.fontWeight,
                color: customizations.color ?? layer.properties.color,
                textAlign: customizations.textAlign ?? layer.properties.textAlign
              }}
              className="w-full h-full flex items-center"
            >
              {customizations.text ?? layer.properties.text}
            </div>
          </div>
        )

      case 'shape':
        return (
          <div
            key={layer.id}
            style={{
              ...layerStyle,
              background: customizations.gradient ?? customizations.color ?? layer.properties.gradient ?? layer.properties.color
            }}
            className={`${isSelected ? 'ring-2 ring-primary-500' : ''} cursor-move`}
            onMouseDown={(e) => handleMouseDown(e, layer.id)}
          />
        )

      default:
        return null
    }
  }, [editorState.selectedLayer, project, projectAssets, handleMouseDown])

  // Asset panel
  const renderAssetPanel = () => (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Assets</h3>
      
      <div className="space-y-2">
        {projectAssets.map(asset => (
          <ModernCard
            key={asset.id}
            variant="default"
            padding="sm"
            hover
            className="cursor-pointer"
            onClick={() => {
              if (editorState.selectedLayer) {
                assignAsset(editorState.selectedLayer, asset.id)
              }
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                {asset.type === 'image' ? (
                  <img src={asset.dataUrl} alt={asset.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <Image className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {asset.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {asset.type.toUpperCase()}
                </p>
              </div>
            </div>
          </ModernCard>
        ))}
      </div>
    </div>
  )

  // Properties panel
  const renderPropertiesPanel = () => {
    const selectedLayer = template.layers.find(l => l.id === editorState.selectedLayer)
    if (!selectedLayer) return null

    const customizations = project.customizations[selectedLayer.id] || {}

    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {selectedLayer.name} Properties
        </h3>

        <div className="space-y-4">
          {/* Position */}
          <div className="grid grid-cols-2 gap-2">
            <ModernInput
              label="X"
              type="number"
              value={customizations.x ?? selectedLayer.position.x}
              onChange={(e) => updateLayerProperty(selectedLayer.id, 'x', parseFloat(e.target.value))}
            />
            <ModernInput
              label="Y"
              type="number"
              value={customizations.y ?? selectedLayer.position.y}
              onChange={(e) => updateLayerProperty(selectedLayer.id, 'y', parseFloat(e.target.value))}
            />
          </div>

          {/* Size */}
          <div className="grid grid-cols-2 gap-2">
            <ModernInput
              label="Width"
              type="number"
              value={customizations.width ?? selectedLayer.size.width}
              onChange={(e) => updateLayerProperty(selectedLayer.id, 'width', parseFloat(e.target.value))}
            />
            <ModernInput
              label="Height"
              type="number"
              value={customizations.height ?? selectedLayer.size.height}
              onChange={(e) => updateLayerProperty(selectedLayer.id, 'height', parseFloat(e.target.value))}
            />
          </div>

          {/* Text properties */}
          {selectedLayer.type === 'text' && (
            <>
              <ModernInput
                label="Text"
                value={customizations.text ?? selectedLayer.properties.text}
                onChange={(e) => updateLayerProperty(selectedLayer.id, 'text', e.target.value)}
              />
              <ModernInput
                label="Font Size"
                type="number"
                value={customizations.fontSize ?? selectedLayer.properties.fontSize}
                onChange={(e) => updateLayerProperty(selectedLayer.id, 'fontSize', parseInt(e.target.value))}
              />
              <ModernInput
                label="Color"
                type="color"
                value={customizations.color ?? selectedLayer.properties.color}
                onChange={(e) => updateLayerProperty(selectedLayer.id, 'color', e.target.value)}
              />
            </>
          )}

          {/* Background properties */}
          {selectedLayer.type === 'background' && (
            <ModernInput
              label="Background Color"
              type="color"
              value={customizations.color ?? selectedLayer.properties.color}
              onChange={(e) => updateLayerProperty(selectedLayer.id, 'color', e.target.value)}
            />
          )}
        </div>
      </div>
    )
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
              disabled={editorState.historyIndex <= 0}
            >
              Undo
            </ModernButton>
            <ModernButton
              variant="ghost"
              size="sm"
              leftIcon={<Redo className="w-4 h-4" />}
              onClick={redo}
              disabled={editorState.historyIndex >= editorState.history.length - 1}
            >
              Redo
            </ModernButton>
            
            <div className="w-px h-6 bg-gray-300" />
            
            <ModernButton
              variant="ghost"
              size="sm"
              leftIcon={<ZoomOut className="w-4 h-4" />}
              onClick={() => setEditorState(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom - 0.1) }))}
            >
              Zoom Out
            </ModernButton>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round(editorState.zoom * 100)}%
            </span>
            <ModernButton
              variant="ghost"
              size="sm"
              leftIcon={<ZoomIn className="w-4 h-4" />}
              onClick={() => setEditorState(prev => ({ ...prev, zoom: Math.min(3, prev.zoom + 0.1) }))}
            >
              Zoom In
            </ModernButton>
          </div>

          <div className="flex items-center space-x-4">
            <ModernButton
              variant="secondary"
              leftIcon={<Eye className="w-4 h-4" />}
              onClick={() => onPreview(project)}
            >
              Preview
            </ModernButton>
            <ModernButton
              variant="secondary"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => onExport(project, 'png')}
            >
              Export
            </ModernButton>
            <ModernButton
              variant="primary"
              leftIcon={<Save className="w-4 h-4" />}
              onClick={() => onSave(project)}
            >
              Save
            </ModernButton>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Asset Panel */}
        {renderAssetPanel()}

        {/* Canvas */}
        <div className="flex-1 relative overflow-auto bg-gray-100 dark:bg-gray-900">
          <div className="p-8 flex justify-center">
            <div
              ref={canvasRef}
              className="relative bg-white shadow-2xl"
              style={{
                width: template.dimensions.width * (template.dimensions.unit === 'px' ? 1 : 100) * editorState.zoom,
                height: template.dimensions.height * (template.dimensions.unit === 'px' ? 1 : 100) * editorState.zoom,
                transform: `scale(${editorState.zoom})`,
                transformOrigin: 'top left'
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {/* Grid overlay */}
              {editorState.showGrid && (
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                      linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }}
                />
              )}

              {/* Layers */}
              {template.layers.map(renderLayer)}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        {renderPropertiesPanel()}
      </div>
    </div>
  )
}
