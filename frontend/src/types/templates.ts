export interface Template {
  id: string
  name: string
  category: 'social' | 'print' | 'web' | 'video'
  type: string
  description: string
  thumbnail: string
  dimensions: {
    width: number
    height: number
    unit: 'px' | 'in' | 'mm' | 'cm'
  }
  aspectRatio: number
  layers: TemplateLayer[]
  constraints: TemplateConstraints
  preview: string
}

export interface TemplateLayer {
  id: string
  name: string
  type: 'image' | 'text' | 'shape' | 'video' | 'background'
  position: { x: number; y: number }
  size: { width: number; height: number }
  properties: Record<string, any>
  editable: boolean
  required: boolean
  assetSlot?: string
}

export interface TemplateConstraints {
  minLayers: number
  maxLayers: number
  requiredSlots: string[]
  aspectRatioLocked: boolean
  resizable: boolean
}

export interface MockupProject {
  id: string
  templateId: string
  name: string
  assets: Record<string, string> // slotId -> assetId
  customizations: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// Social Media Templates
export const SOCIAL_TEMPLATES: Template[] = [
  {
    id: 'facebook-post',
    name: 'Facebook Post',
    category: 'social',
    type: 'facebook-post',
    description: 'Standard Facebook post with image and text',
    thumbnail: '/templates/facebook-post-thumb.jpg',
    dimensions: { width: 1200, height: 630, unit: 'px' },
    aspectRatio: 1.91,
    layers: [
      {
        id: 'background',
        name: 'Background',
        type: 'background',
        position: { x: 0, y: 0 },
        size: { width: 1200, height: 630 },
        properties: { color: '#ffffff' },
        editable: true,
        required: true
      },
      {
        id: 'main-image',
        name: 'Main Image',
        type: 'image',
        position: { x: 50, y: 50 },
        size: { width: 500, height: 500 },
        properties: { borderRadius: 8 },
        editable: true,
        required: true,
        assetSlot: 'main-image'
      },
      {
        id: 'title',
        name: 'Title',
        type: 'text',
        position: { x: 600, y: 80 },
        size: { width: 500, height: 60 },
        properties: { 
          fontSize: 24, 
          fontWeight: 'bold', 
          color: '#1a1a1a',
          text: 'Your Post Title Here'
        },
        editable: true,
        required: true
      },
      {
        id: 'description',
        name: 'Description',
        type: 'text',
        position: { x: 600, y: 160 },
        size: { width: 500, height: 200 },
        properties: { 
          fontSize: 16, 
          color: '#666666',
          text: 'Write your post description here...'
        },
        editable: true,
        required: false
      },
      {
        id: 'logo',
        name: 'Logo',
        type: 'image',
        position: { x: 600, y: 400 },
        size: { width: 100, height: 100 },
        properties: { borderRadius: 50 },
        editable: true,
        required: false,
        assetSlot: 'logo'
      }
    ],
    constraints: {
      minLayers: 2,
      maxLayers: 8,
      requiredSlots: ['main-image'],
      aspectRatioLocked: true,
      resizable: false
    },
    preview: '/templates/facebook-post-preview.jpg'
  },
  {
    id: 'instagram-reel',
    name: 'Instagram Reel',
    category: 'social',
    type: 'instagram-reel',
    description: 'Vertical video format for Instagram Reels',
    thumbnail: '/templates/instagram-reel-thumb.jpg',
    dimensions: { width: 1080, height: 1920, unit: 'px' },
    aspectRatio: 0.5625,
    layers: [
      {
        id: 'video-background',
        name: 'Video Background',
        type: 'video',
        position: { x: 0, y: 0 },
        size: { width: 1080, height: 1920 },
        properties: { autoplay: true, muted: true },
        editable: true,
        required: true,
        assetSlot: 'video-background'
      },
      {
        id: 'overlay',
        name: 'Overlay',
        type: 'shape',
        position: { x: 0, y: 0 },
        size: { width: 1080, height: 1920 },
        properties: { 
          type: 'gradient',
          gradient: 'linear-gradient(45deg, rgba(0,0,0,0.3), rgba(0,0,0,0.1))'
        },
        editable: true,
        required: false
      },
      {
        id: 'title',
        name: 'Title',
        type: 'text',
        position: { x: 50, y: 100 },
        size: { width: 980, height: 80 },
        properties: { 
          fontSize: 32, 
          fontWeight: 'bold', 
          color: '#ffffff',
          textAlign: 'center',
          text: 'Your Reel Title'
        },
        editable: true,
        required: true
      },
      {
        id: 'subtitle',
        name: 'Subtitle',
        type: 'text',
        position: { x: 50, y: 200 },
        size: { width: 980, height: 60 },
        properties: { 
          fontSize: 18, 
          color: '#ffffff',
          textAlign: 'center',
          text: 'Add your subtitle here'
        },
        editable: true,
        required: false
      }
    ],
    constraints: {
      minLayers: 2,
      maxLayers: 6,
      requiredSlots: ['video-background'],
      aspectRatioLocked: true,
      resizable: false
    },
    preview: '/templates/instagram-reel-preview.jpg'
  },
  {
    id: 'twitter-card',
    name: 'Twitter Card',
    category: 'social',
    type: 'twitter-card',
    description: 'Twitter post with image and text',
    thumbnail: '/templates/twitter-card-thumb.jpg',
    dimensions: { width: 1200, height: 675, unit: 'px' },
    aspectRatio: 1.78,
    layers: [
      {
        id: 'background',
        name: 'Background',
        type: 'background',
        position: { x: 0, y: 0 },
        size: { width: 1200, height: 675 },
        properties: { color: '#ffffff' },
        editable: true,
        required: true
      },
      {
        id: 'main-image',
        name: 'Main Image',
        type: 'image',
        position: { x: 50, y: 50 },
        size: { width: 400, height: 400 },
        properties: { borderRadius: 12 },
        editable: true,
        required: true,
        assetSlot: 'main-image'
      },
      {
        id: 'content',
        name: 'Content',
        type: 'text',
        position: { x: 500, y: 80 },
        size: { width: 650, height: 400 },
        properties: { 
          fontSize: 20, 
          color: '#1a1a1a',
          text: 'Your tweet content goes here. Keep it engaging and within the character limit!'
        },
        editable: true,
        required: true
      }
    ],
    constraints: {
      minLayers: 2,
      maxLayers: 6,
      requiredSlots: ['main-image'],
      aspectRatioLocked: true,
      resizable: false
    },
    preview: '/templates/twitter-card-preview.jpg'
  }
]

// Print Media Templates
export const PRINT_TEMPLATES: Template[] = [
  {
    id: 'brochure-trifold',
    name: 'Brochure (Trifold)',
    category: 'print',
    type: 'brochure-trifold',
    description: 'Standard trifold brochure template',
    thumbnail: '/templates/brochure-trifold-thumb.jpg',
    dimensions: { width: 11, height: 8.5, unit: 'in' },
    aspectRatio: 1.29,
    layers: [
      {
        id: 'cover',
        name: 'Cover Panel',
        type: 'background',
        position: { x: 0, y: 0 },
        size: { width: 3.67, height: 8.5 },
        properties: { color: '#f8f9fa' },
        editable: true,
        required: true
      },
      {
        id: 'cover-image',
        name: 'Cover Image',
        type: 'image',
        position: { x: 0.25, y: 1 },
        size: { width: 3.17, height: 2 },
        properties: { borderRadius: 4 },
        editable: true,
        required: true,
        assetSlot: 'cover-image'
      },
      {
        id: 'cover-title',
        name: 'Cover Title',
        type: 'text',
        position: { x: 0.25, y: 3.5 },
        size: { width: 3.17, height: 1 },
        properties: { 
          fontSize: 18, 
          fontWeight: 'bold', 
          color: '#1a1a1a',
          textAlign: 'center',
          text: 'Your Company'
        },
        editable: true,
        required: true
      },
      {
        id: 'inside-left',
        name: 'Inside Left Panel',
        type: 'background',
        position: { x: 3.67, y: 0 },
        size: { width: 3.67, height: 8.5 },
        properties: { color: '#ffffff' },
        editable: true,
        required: true
      },
      {
        id: 'inside-right',
        name: 'Inside Right Panel',
        type: 'background',
        position: { x: 7.34, y: 0 },
        size: { width: 3.67, height: 8.5 },
        properties: { color: '#ffffff' },
        editable: true,
        required: true
      }
    ],
    constraints: {
      minLayers: 5,
      maxLayers: 15,
      requiredSlots: ['cover-image'],
      aspectRatioLocked: true,
      resizable: false
    },
    preview: '/templates/brochure-trifold-preview.jpg'
  },
  {
    id: 'billboard',
    name: 'Billboard',
    category: 'print',
    type: 'billboard',
    description: 'Large format billboard template',
    thumbnail: '/templates/billboard-thumb.jpg',
    dimensions: { width: 48, height: 14, unit: 'in' },
    aspectRatio: 3.43,
    layers: [
      {
        id: 'background',
        name: 'Background',
        type: 'background',
        position: { x: 0, y: 0 },
        size: { width: 48, height: 14 },
        properties: { color: '#ffffff' },
        editable: true,
        required: true
      },
      {
        id: 'main-image',
        name: 'Main Image',
        type: 'image',
        position: { x: 2, y: 2 },
        size: { width: 20, height: 10 },
        properties: {},
        editable: true,
        required: true,
        assetSlot: 'main-image'
      },
      {
        id: 'headline',
        name: 'Headline',
        type: 'text',
        position: { x: 24, y: 3 },
        size: { width: 22, height: 3 },
        properties: { 
          fontSize: 72, 
          fontWeight: 'bold', 
          color: '#1a1a1a',
          text: 'YOUR HEADLINE HERE'
        },
        editable: true,
        required: true
      },
      {
        id: 'subheadline',
        name: 'Subheadline',
        type: 'text',
        position: { x: 24, y: 7 },
        size: { width: 22, height: 2 },
        properties: { 
          fontSize: 36, 
          color: '#666666',
          text: 'Your compelling subheadline'
        },
        editable: true,
        required: false
      },
      {
        id: 'logo',
        name: 'Logo',
        type: 'image',
        position: { x: 24, y: 10 },
        size: { width: 8, height: 2 },
        properties: {},
        editable: true,
        required: false,
        assetSlot: 'logo'
      }
    ],
    constraints: {
      minLayers: 3,
      maxLayers: 8,
      requiredSlots: ['main-image'],
      aspectRatioLocked: true,
      resizable: false
    },
    preview: '/templates/billboard-preview.jpg'
  },
  {
    id: 'business-card',
    name: 'Business Card',
    category: 'print',
    type: 'business-card',
    description: 'Standard business card template',
    thumbnail: '/templates/business-card-thumb.jpg',
    dimensions: { width: 3.5, height: 2, unit: 'in' },
    aspectRatio: 1.75,
    layers: [
      {
        id: 'background',
        name: 'Background',
        type: 'background',
        position: { x: 0, y: 0 },
        size: { width: 3.5, height: 2 },
        properties: { color: '#ffffff' },
        editable: true,
        required: true
      },
      {
        id: 'logo',
        name: 'Logo',
        type: 'image',
        position: { x: 0.25, y: 0.25 },
        size: { width: 0.75, height: 0.75 },
        properties: {},
        editable: true,
        required: true,
        assetSlot: 'logo'
      },
      {
        id: 'name',
        name: 'Name',
        type: 'text',
        position: { x: 1.25, y: 0.3 },
        size: { width: 2, height: 0.3 },
        properties: { 
          fontSize: 14, 
          fontWeight: 'bold', 
          color: '#1a1a1a',
          text: 'John Doe'
        },
        editable: true,
        required: true
      },
      {
        id: 'title',
        name: 'Title',
        type: 'text',
        position: { x: 1.25, y: 0.6 },
        size: { width: 2, height: 0.25 },
        properties: { 
          fontSize: 10, 
          color: '#666666',
          text: 'Creative Director'
        },
        editable: true,
        required: true
      },
      {
        id: 'contact',
        name: 'Contact Info',
        type: 'text',
        position: { x: 0.25, y: 1.2 },
        size: { width: 3, height: 0.6 },
        properties: { 
          fontSize: 8, 
          color: '#333333',
          text: 'john@company.com\n(555) 123-4567\nwww.company.com'
        },
        editable: true,
        required: true
      }
    ],
    constraints: {
      minLayers: 4,
      maxLayers: 8,
      requiredSlots: ['logo'],
      aspectRatioLocked: true,
      resizable: false
    },
    preview: '/templates/business-card-preview.jpg'
  }
]

export const ALL_TEMPLATES = [...SOCIAL_TEMPLATES, ...PRINT_TEMPLATES]
