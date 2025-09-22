import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check, Upload, Image, FileText, Calendar, User, Building, Target, Zap, Sparkles, Plus } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'
import { ProjectAsset } from '../../types/asset'

interface ProjectIntakeData {
  // Basic Info
  title: string
  client: string
  clientContact: string
  clientEmail: string
  projectType: string
  industry: string
  
  // Timeline
  startDate: string
  endDate: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  
  // Project Details
  description: string
  objectives: string[]
  targetAudience: string
  keyMessages: string[]
  
  // Assets
  assets: ProjectAsset[]
  brandGuidelines: File[]
  referenceMaterials: File[]
  
  // Success Metrics
  successMetrics: string[]
  kpis: string[]
  
  // Budget & Resources
  budget: number
  teamSize: number
  externalVendors: string[]
}

interface ProjectIntakeWizardProps {
  onComplete: (data: ProjectIntakeData) => void
  onCancel: () => void
}

const STEPS = [
  { id: 'basic', title: 'Basic Information', icon: User, description: 'Project overview and client details' },
  { id: 'timeline', title: 'Timeline & Priority', icon: Calendar, description: 'Project schedule and urgency' },
  { id: 'details', title: 'Project Details', icon: FileText, description: 'Objectives and requirements' },
  { id: 'assets', title: 'Assets & Materials', icon: Image, description: 'Upload files and reference materials' },
  { id: 'metrics', title: 'Success Metrics', icon: Target, description: 'Define success criteria and KPIs' },
  { id: 'resources', title: 'Budget & Resources', icon: Building, description: 'Budget and team information' },
  { id: 'review', title: 'Review & Submit', icon: Check, description: 'Review all information before submitting' }
]

export default function ProjectIntakeWizard({ onComplete, onCancel }: ProjectIntakeWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<ProjectIntakeData>({
    title: '',
    client: '',
    clientContact: '',
    clientEmail: '',
    projectType: '',
    industry: '',
    startDate: '',
    endDate: '',
    priority: 'medium',
    description: '',
    objectives: [''],
    targetAudience: '',
    keyMessages: [''],
    assets: [],
    brandGuidelines: [],
    referenceMaterials: [],
    successMetrics: [''],
    kpis: [''],
    budget: 0,
    teamSize: 1,
    externalVendors: ['']
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step validation
  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (stepIndex) {
      case 0: // Basic Info
        if (!data.title.trim()) newErrors.title = 'Project title is required'
        if (!data.client.trim()) newErrors.client = 'Client name is required'
        if (!data.clientEmail.trim()) newErrors.clientEmail = 'Client email is required'
        if (!data.projectType.trim()) newErrors.projectType = 'Project type is required'
        break

      case 1: // Timeline
        if (!data.startDate) newErrors.startDate = 'Start date is required'
        if (!data.endDate) newErrors.endDate = 'End date is required'
        if (data.startDate && data.endDate && new Date(data.startDate) >= new Date(data.endDate)) {
          newErrors.endDate = 'End date must be after start date'
        }
        break

      case 2: // Details
        if (!data.description.trim()) newErrors.description = 'Project description is required'
        if (data.objectives.every(obj => !obj.trim())) newErrors.objectives = 'At least one objective is required'
        break

      case 3: // Assets (optional)
        break

      case 4: // Metrics
        if (data.successMetrics.every(metric => !metric.trim())) newErrors.successMetrics = 'At least one success metric is required'
        break

      case 5: // Resources
        if (data.budget <= 0) newErrors.budget = 'Budget must be greater than 0'
        if (data.teamSize < 1) newErrors.teamSize = 'Team size must be at least 1'
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Navigation
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  // Data updates
  const updateData = (field: keyof ProjectIntakeData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const updateArrayField = (field: keyof ProjectIntakeData, index: number, value: string) => {
    setData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field: keyof ProjectIntakeData) => {
    setData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), '']
    }))
  }

  const removeArrayItem = (field: keyof ProjectIntakeData, index: number) => {
    setData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }))
  }

  // File upload
  const handleFileUpload = (files: FileList, type: 'assets' | 'brandGuidelines' | 'referenceMaterials') => {
    const newFiles = Array.from(files)
    
    if (type === 'assets') {
      // Convert files to ProjectAsset format
      const newAssets: ProjectAsset[] = newFiles.map(file => ({
        id: `asset-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        size: file.size,
        mimeType: file.type,
        dataUrl: URL.createObjectURL(file),
        addedAt: new Date().toISOString(),
        isHero: false
      }))
      
      setData(prev => ({
        ...prev,
        assets: [...prev.assets, ...newAssets]
      }))
    } else {
      setData(prev => ({
        ...prev,
        [type]: [...prev[type], ...newFiles]
      }))
    }
  }

  // Submit
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      onComplete(data)
    } catch (error) {
      console.error('Error submitting project:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Let's start with the basics
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Tell us about your project and client information
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Project Title *"
                value={data.title}
                onChange={(e) => updateData('title', e.target.value)}
                error={errors.title}
                placeholder="e.g., E-commerce Website Redesign"
              />

              <Input
                label="Client Name *"
                value={data.client}
                onChange={(e) => updateData('client', e.target.value)}
                error={errors.client}
                placeholder="e.g., Acme Corporation"
              />

              <Input
                label="Client Contact"
                value={data.clientContact}
                onChange={(e) => updateData('clientContact', e.target.value)}
                placeholder="e.g., John Smith"
              />

              <Input
                label="Client Email *"
                type="email"
                value={data.clientEmail}
                onChange={(e) => updateData('clientEmail', e.target.value)}
                error={errors.clientEmail}
                placeholder="john@acme.com"
              />

              <Input
                label="Project Type *"
                value={data.projectType}
                onChange={(e) => updateData('projectType', e.target.value)}
                error={errors.projectType}
                placeholder="e.g., Website Design, Brand Identity, Marketing Campaign"
              />

              <Input
                label="Industry"
                value={data.industry}
                onChange={(e) => updateData('industry', e.target.value)}
                placeholder="e.g., Technology, Healthcare, Finance"
              />
            </div>
          </div>
        )

      case 1: // Timeline
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Project Timeline
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                When will this project start and end?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Start Date *"
                type="date"
                value={data.startDate}
                onChange={(e) => updateData('startDate', e.target.value)}
                error={errors.startDate}
              />

              <Input
                label="End Date *"
                type="date"
                value={data.endDate}
                onChange={(e) => updateData('endDate', e.target.value)}
                error={errors.endDate}
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority Level *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'urgent'] as const).map(priority => (
                    <button
                      key={priority}
                      type="button"
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        data.priority === priority
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => updateData('priority', priority)}
                    >
                      <div className="text-sm font-medium capitalize">{priority}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 2: // Details
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Project Details
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                What are the project objectives and requirements?
              </p>
            </div>

            <div className="space-y-6">
              <Input
                label="Project Description *"
                value={data.description}
                onChange={(e) => updateData('description', e.target.value)}
                error={errors.description}
                placeholder="Describe the project in detail..."
                multiline
                rows={4}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Objectives *
                </label>
                {data.objectives.map((objective, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={objective}
                      onChange={(e) => updateArrayField('objectives', index, e.target.value)}
                      placeholder="Enter an objective..."
                      className="flex-1"
                    />
                    {data.objectives.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('objectives', index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('objectives')}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Objective
                </Button>
                {errors.objectives && (
                  <p className="text-sm text-red-500 mt-1">{errors.objectives}</p>
                )}
              </div>

              <Input
                label="Target Audience"
                value={data.targetAudience}
                onChange={(e) => updateData('targetAudience', e.target.value)}
                placeholder="Who is the target audience for this project?"
                multiline
                rows={2}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Key Messages
                </label>
                {data.keyMessages.map((message, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={message}
                      onChange={(e) => updateArrayField('keyMessages', index, e.target.value)}
                      placeholder="Enter a key message..."
                      className="flex-1"
                    />
                    {data.keyMessages.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('keyMessages', index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('keyMessages')}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Key Message
                </Button>
              </div>
            </div>
          </div>
        )

      case 3: // Assets
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Assets & Materials
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Upload project assets and reference materials
              </p>
            </div>

            <div className="space-y-8">
              {/* Project Assets */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Project Assets
                </h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Drag and drop images, videos, or documents here
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'assets')}
                    className="hidden"
                    id="asset-upload"
                  />
                  <label htmlFor="asset-upload">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Choose Files
                    </Button>
                  </label>
                </div>
                
                {data.assets.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {data.assets.map(asset => (
                      <div key={asset.id} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          {asset.type === 'image' ? (
                            <img src={asset.dataUrl} alt={asset.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                          {asset.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Brand Guidelines */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Brand Guidelines
                </h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Upload brand guidelines, style guides, or brand assets
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'brandGuidelines')}
                    className="hidden"
                    id="brand-upload"
                  />
                  <label htmlFor="brand-upload">
                    <Button variant="outline" size="sm">
                      Upload Brand Files
                    </Button>
                  </label>
                </div>
              </div>

              {/* Reference Materials */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Reference Materials
                </h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Image className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Upload inspiration, references, or example materials
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'referenceMaterials')}
                    className="hidden"
                    id="reference-upload"
                  />
                  <label htmlFor="reference-upload">
                    <Button variant="outline" size="sm">
                      Upload References
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )

      case 4: // Metrics
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Success Metrics
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                How will you measure the success of this project?
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Success Metrics *
                </label>
                {data.successMetrics.map((metric, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={metric}
                      onChange={(e) => updateArrayField('successMetrics', index, e.target.value)}
                      placeholder="e.g., Increase conversion rate by 25%"
                      className="flex-1"
                    />
                    {data.successMetrics.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('successMetrics', index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('successMetrics')}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Metric
                </Button>
                {errors.successMetrics && (
                  <p className="text-sm text-red-500 mt-1">{errors.successMetrics}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Key Performance Indicators (KPIs)
                </label>
                {data.kpis.map((kpi, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={kpi}
                      onChange={(e) => updateArrayField('kpis', index, e.target.value)}
                      placeholder="e.g., Page load time < 2 seconds"
                      className="flex-1"
                    />
                    {data.kpis.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('kpis', index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('kpis')}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add KPI
                </Button>
              </div>
            </div>
          </div>
        )

      case 5: // Resources
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Budget & Resources
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                What's the budget and team for this project?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Project Budget *"
                type="number"
                value={data.budget}
                onChange={(e) => updateData('budget', parseFloat(e.target.value))}
                error={errors.budget}
                placeholder="0"
                leftIcon={<span className="text-gray-500">$</span>}
              />

              <Input
                label="Team Size *"
                type="number"
                value={data.teamSize}
                onChange={(e) => updateData('teamSize', parseInt(e.target.value))}
                error={errors.teamSize}
                placeholder="1"
                min="1"
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  External Vendors
                </label>
                {data.externalVendors.map((vendor, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={vendor}
                      onChange={(e) => updateArrayField('externalVendors', index, e.target.value)}
                      placeholder="e.g., Photography Studio, Copywriter"
                      className="flex-1"
                    />
                    {data.externalVendors.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('externalVendors', index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('externalVendors')}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Vendor
                </Button>
              </div>
            </div>
          </div>
        )

      case 6: // Review
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Review & Submit
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please review all information before submitting
              </p>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Project Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Title:</span>
                    <p className="text-gray-900 dark:text-gray-100">{data.title}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Client:</span>
                    <p className="text-gray-900 dark:text-gray-100">{data.client}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                    <p className="text-gray-900 dark:text-gray-100">{data.projectType}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Priority:</span>
                    <p className="text-gray-900 dark:text-gray-100 capitalize">{data.priority}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Timeline:</span>
                    <p className="text-gray-900 dark:text-gray-100">
                      {data.startDate} to {data.endDate}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Budget:</span>
                    <p className="text-gray-900 dark:text-gray-100">${data.budget.toLocaleString()}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Project Details
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">{data.description}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Objectives:</span>
                    <ul className="list-disc list-inside text-gray-900 dark:text-gray-100 mt-1">
                      {data.objectives.filter(obj => obj.trim()).map((obj, index) => (
                        <li key={index}>{obj}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Success Metrics:</span>
                    <ul className="list-disc list-inside text-gray-900 dark:text-gray-100 mt-1">
                      {data.successMetrics.filter(metric => metric.trim()).map((metric, index) => (
                        <li key={index}>{metric}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Assets & Materials
                </h3>
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Project Assets:</span>
                    <p className="text-gray-900 dark:text-gray-100">{data.assets.length} files uploaded</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Brand Guidelines:</span>
                    <p className="text-gray-900 dark:text-gray-100">{data.brandGuidelines.length} files uploaded</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Reference Materials:</span>
                    <p className="text-gray-900 dark:text-gray-100">{data.referenceMaterials.length} files uploaded</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                New Project Intake
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
              </p>
            </div>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            {STEPS.map((step, index) => {
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              const Icon = step.icon

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${isActive 
                      ? 'bg-primary-500 text-white' 
                      : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }
                  `}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-gray-400 mx-4" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {renderStepContent()}
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center space-x-3">
              {currentStep === STEPS.length - 1 ? (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSubmitting ? 'Creating Project...' : 'Create Project'}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={nextStep}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
