import { useState } from 'react'
import EnhancedAssetManager from '../components/asset-manager/EnhancedAssetManager'
import { PageHeader } from '../components/navigation/Breadcrumbs'
import type { ProjectAsset } from '../types/asset'

export default function AssetManagement() {
  // Enhanced mock data with new features
  const [allAssets, setAllAssets] = useState<ProjectAsset[]>([
    {
      id: '1',
      name: 'hero-image.jpg',
      type: 'image',
      size: 2048000,
      mimeType: 'image/jpeg',
      dataUrl: 'https://via.placeholder.com/800x600/3b82f6/ffffff?text=Hero+Image',
      addedAt: '2024-01-15T10:00:00Z',
      description: 'Main hero image for the landing page',
      tags: ['hero', 'landing', 'main'],
      folder: 'marketing',
      featured: true,
      visibility: 'public',
      width: 800,
      height: 600,
    },
    {
      id: '2',
      name: 'project-screenshot.png',
      type: 'image',
      size: 1536000,
      mimeType: 'image/png',
      dataUrl: 'https://via.placeholder.com/800x600/10b981/ffffff?text=Project+Screenshot',
      addedAt: '2024-01-14T14:30:00Z',
      description: 'Screenshot of the completed project dashboard',
      tags: ['dashboard', 'ui', 'screenshot'],
      folder: 'projects',
      featured: false,
      visibility: 'public',
      width: 1200,
      height: 800,
    },
    {
      id: '3',
      name: 'presentation.pdf',
      type: 'document',
      size: 5120000,
      mimeType: 'application/pdf',
      dataUrl: 'data:application/pdf;base64,',
      addedAt: '2024-01-13T09:15:00Z',
      description: 'Project presentation for stakeholders',
      tags: ['presentation', 'business', 'stakeholders'],
      folder: 'documents',
      featured: false,
      visibility: 'private',
    },
    {
      id: '4',
      name: 'demo-video.mp4',
      type: 'video',
      size: 15728640,
      mimeType: 'video/mp4',
      dataUrl: 'https://via.placeholder.com/800x600/8b5cf6/ffffff?text=Demo+Video',
      thumbnailUrl: 'https://via.placeholder.com/400x300/8b5cf6/ffffff?text=Video+Thumbnail',
      addedAt: '2024-01-12T16:45:00Z',
      description: 'Product demo video showcasing key features',
      tags: ['demo', 'video', 'product', 'features'],
      folder: 'marketing',
      featured: true,
      visibility: 'public',
      duration: 180, // 3 minutes
    },
    {
      id: '5',
      name: 'user-research-report.pdf',
      type: 'document',
      size: 8192000,
      mimeType: 'application/pdf',
      dataUrl: 'data:application/pdf;base64,',
      addedAt: '2024-01-11T11:20:00Z',
      description: 'Comprehensive user research findings and insights',
      tags: ['research', 'users', 'insights', 'report'],
      folder: 'research',
      featured: false,
      visibility: 'private',
    },
    {
      id: '6',
      name: 'brand-guidelines.pdf',
      type: 'document',
      size: 3072000,
      mimeType: 'application/pdf',
      dataUrl: 'data:application/pdf;base64,',
      addedAt: '2024-01-10T15:30:00Z',
      description: 'Brand guidelines and style guide documentation',
      tags: ['brand', 'guidelines', 'design', 'style'],
      folder: 'branding',
      featured: true,
      visibility: 'public',
    },
    {
      id: '7',
      name: 'wireframes.fig',
      type: 'document',
      size: 2560000,
      mimeType: 'application/octet-stream',
      dataUrl: 'data:application/octet-stream;base64,',
      addedAt: '2024-01-09T09:45:00Z',
      description: 'Low-fidelity wireframes for the mobile app',
      tags: ['wireframes', 'mobile', 'app', 'design'],
      folder: 'design',
      featured: false,
      visibility: 'private',
    },
    {
      id: '8',
      name: 'background-music.mp3',
      type: 'audio',
      size: 4096000,
      mimeType: 'audio/mpeg',
      dataUrl: 'data:audio/mpeg;base64,',
      addedAt: '2024-01-08T13:15:00Z',
      description: 'Background music for video presentations',
      tags: ['audio', 'music', 'background', 'presentation'],
      folder: 'assets',
      featured: false,
      visibility: 'public',
      duration: 240, // 4 minutes
    },
  ])

  const handleAssetUpload = async (files: FileList) => {
    console.log('Upload files:', files)

    // Process each file and add to assets
    const newAssets: ProjectAsset[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Create a data URL for the file
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })

      // Create asset object
      const asset: ProjectAsset = {
        id: Date.now().toString() + i,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 
              file.type.startsWith('audio/') ? 'audio' : 'document',
        size: file.size,
        mimeType: file.type,
        dataUrl,
        addedAt: new Date().toISOString(),
        description: `Uploaded ${file.name}`,
        tags: ['uploaded'],
        folder: 'uploads',
        featured: false,
        visibility: 'public',
      }

      // Add dimensions for images
      if (file.type.startsWith('image/')) {
        const img = new Image()
        img.onload = () => {
          asset.width = img.width
          asset.height = img.height
        }
        img.src = dataUrl
      }

      newAssets.push(asset)
    }

    // Add new assets to the existing list
    setAllAssets(prev => [...prev, ...newAssets])
  }

  const handleAssetRemove = (assetId: string) => {
    console.log('Remove asset:', assetId)
    setAllAssets(prev => prev.filter(asset => asset.id !== assetId))
  }

  const handleAssetSelect = (asset: ProjectAsset) => {
    console.log('Selected asset:', asset)
    // In a real app, this would handle asset selection
  }

  const handleAssetEdit = (updatedAsset: ProjectAsset) => {
    console.log('Edit asset:', updatedAsset)
    setAllAssets(prev => prev.map(asset => asset.id === updatedAsset.id ? updatedAsset : asset))
  }

  const handleAssetDelete = (assetId: string) => {
    console.log('Delete asset:', assetId)
    setAllAssets(prev => prev.filter(asset => asset.id !== assetId))
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Asset Management"
        subtitle="Manage all your project assets in one place"
      />

      <div className="py-8">
        <EnhancedAssetManager
          onAssetSelect={handleAssetSelect}
          onAssetEdit={handleAssetEdit}
          onAssetDelete={handleAssetDelete}
          className="stagger-animation"
        />
      </div>
    </div>
  )
}
