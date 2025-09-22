import { ReactNode, forwardRef, useState, useCallback, useRef, ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../shared/utils'
import { Upload, X, CheckCircle, AlertCircle, File, Image, Video, Music, FileText, Download } from 'lucide-react'
import Button from './Button'
import Input from './Input'

// ===== TYPES =====

export interface UploadFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  preview?: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress?: number
  error?: string
  uploadedAt?: Date
  url?: string
}

export interface FileUploadProps {
  children?: ReactNode
  onUpload: (files: File[]) => void | Promise<void>
  onRemove?: (fileId: string) => void
  onRetry?: (fileId: string) => void
  onDownload?: (file: UploadFile) => void
  accept?: string[]
  maxFiles?: number
  maxSize?: number // in bytes
  multiple?: boolean
  disabled?: boolean
  className?: string
  // Visual props
  variant?: 'default' | 'minimal' | 'card' | 'list'
  showPreview?: boolean
  showProgress?: boolean
  showRemove?: boolean
  showDownload?: boolean
  showFileInfo?: boolean
  // Animation props
  animate?: boolean
  stagger?: number
  // Upload behavior
  autoUpload?: boolean
  chunkSize?: number
  retryAttempts?: number
  // Accessibility
  'aria-label'?: string
}

// ===== UTILITIES =====

const getFileType = (file: File): 'image' | 'video' | 'audio' | 'document' | 'other' => {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type.startsWith('text/') || file.type.includes('pdf') || file.type.includes('document')) return 'document'
  return 'other'
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image
  if (type.startsWith('video/')) return Video
  if (type.startsWith('audio/')) return Music
  if (type.startsWith('text/') || type.includes('pdf') || type.includes('document')) return FileText
  return File
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ===== FILE UPLOAD =====

export const FileUpload = forwardRef<HTMLDivElement, FileUploadProps>(({
  children,
  onUpload,
  onRemove,
  onRetry,
  onDownload,
  accept = [],
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = true,
  disabled = false,
  className = '',
  variant = 'default',
  showPreview = true,
  showProgress = true,
  showRemove = true,
  showDownload = false,
  showFileInfo = true,
  animate = true,
  stagger = 0.1,
  autoUpload = false,
  chunkSize = 1024 * 1024, // 1MB
  retryAttempts = 3,
  'aria-label': ariaLabel,
}, ref) => {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (accept.length > 0 && !accept.some(type => file.type.includes(type))) {
      return `File type ${file.type} is not allowed`
    }

    // Check file size
    if (file.size > maxSize) {
      return `File size ${formatFileSize(file.size)} exceeds maximum ${formatFileSize(maxSize)}`
    }

    return null
  }

  const createUploadFile = (file: File): UploadFile => ({
    id: Math.random().toString(36).substr(2, 9),
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    status: 'pending',
  })

  const generatePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        resolve(undefined)
      }
    })
  }

  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles: File[] = Array.from(fileList)
    const validationErrors: string[] = []

    // Validate files
    newFiles.forEach(file => {
      const error = validateFile(file)
      if (error) {
        validationErrors.push(`${file.name}: ${error}`)
      }
    })

    if (validationErrors.length > 0) {
      console.error('File validation errors:', validationErrors)
      return
    }

    // Check max files
    if (files.length + newFiles.length > maxFiles) {
      console.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Create upload file objects
    const uploadFiles: UploadFile[] = await Promise.all(
      newFiles.map(async (file) => {
        const uploadFile = createUploadFile(file)
        const preview = await generatePreview(file)
        return { ...uploadFile, preview }
      })
    )

    setFiles(prev => [...prev, ...uploadFiles])

    // Auto upload if enabled
    if (autoUpload) {
      await handleUpload(uploadFiles)
    } else {
      onUpload(newFiles)
    }
  }, [files.length, maxFiles, maxSize, accept, autoUpload, onUpload])

  const handleUpload = async (filesToUpload: UploadFile[] = files) => {
    setIsUploading(true)

    for (const uploadFile of filesToUpload) {
      if (uploadFile.status === 'pending') {
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f
        ))

        try {
          // Simulate upload progress
          for (let progress = 0; progress <= 100; progress += 10) {
            await new Promise(resolve => setTimeout(resolve, 100))
            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id ? { ...f, progress } : f
            ))
          }

          // Simulate successful upload
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { 
              ...f, 
              status: 'success', 
              progress: 100,
              uploadedAt: new Date(),
              url: URL.createObjectURL(uploadFile.file)
            } : f
          ))
        } catch (error) {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed'
            } : f
          ))
        }
      }
    }

    setIsUploading(false)
  }

  const handleRemove = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    onRemove?.(fileId)
  }, [onRemove])

  const handleRetry = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (file) {
      handleUpload([file])
    }
    onRetry?.(fileId)
  }, [files, onRetry])

  const handleDownload = useCallback((file: UploadFile) => {
    if (file.url) {
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      link.click()
    }
    onDownload?.(file)
  }, [onDownload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (disabled) return

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles)
    }
  }, [disabled, handleFiles])

  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles)
    }
  }, [handleFiles])

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  // Variant styles
  const variantClasses = {
    default: 'border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8',
    minimal: 'border border-dashed border-gray-200 dark:border-gray-700 rounded p-4',
    card: 'border-2 border-dashed border-primary-300 dark:border-primary-600 rounded-xl p-12',
    list: 'border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6',
  }

  const dragOverClasses = isDragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Zone */}
      <motion.div
        ref={ref}
        className={cn(
          'relative transition-all duration-200 ease-in-out',
          'hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          variantClasses[variant],
          dragOverClasses,
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!disabled ? openFileDialog : undefined}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
        aria-label={ariaLabel}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        {children || (
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Drop files here or click to browse
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {accept.length > 0 && `Accepted formats: ${accept.join(', ')}`}
                {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
                {maxFiles > 1 && ` • Max files: ${maxFiles}`}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Upload Controls */}
      {files.length > 0 && !autoUpload && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setFiles([])}
              disabled={isUploading}
            >
              Clear All
            </Button>
            <Button
              onClick={() => handleUpload()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload All'}
            </Button>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <AnimatePresence mode="popLayout">
            {files.map((file, index) => (
              <FileItem
                key={file.id}
                file={file}
                index={index}
                showPreview={showPreview}
                showProgress={showProgress}
                showRemove={showRemove}
                showDownload={showDownload}
                showFileInfo={showFileInfo}
                onRemove={handleRemove}
                onRetry={handleRetry}
                onDownload={handleDownload}
                animate={animate}
                stagger={stagger}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
})

FileUpload.displayName = 'FileUpload'

// ===== FILE ITEM =====

interface FileItemProps {
  file: UploadFile
  index: number
  showPreview: boolean
  showProgress: boolean
  showRemove: boolean
  showDownload: boolean
  showFileInfo: boolean
  onRemove: (fileId: string) => void
  onRetry: (fileId: string) => void
  onDownload: (file: UploadFile) => void
  animate: boolean
  stagger: number
}

const FileItem = ({
  file,
  index,
  showPreview,
  showProgress,
  showRemove,
  showDownload,
  showFileInfo,
  onRemove,
  onRetry,
  onDownload,
  animate,
  stagger,
}: FileItemProps) => {
  const IconComponent = getFileIcon(file.type)

  const getStatusIcon = () => {
    switch (file.status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'uploading':
        return <div className="h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      default:
        return <IconComponent className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (file.status) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20'
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20'
      case 'uploading':
        return 'border-primary-200 bg-primary-50 dark:bg-primary-900/20'
      default:
        return 'border-gray-200 bg-white dark:bg-gray-800'
    }
  }

  const itemContent = (
    <div className={cn(
      'flex items-center space-x-3 p-3 border rounded-lg transition-all duration-200',
      getStatusColor()
    )}>
      {/* Preview/Icon */}
      <div className="flex-shrink-0">
        {showPreview && file.preview ? (
          <img
            src={file.preview}
            alt={file.name}
            className="h-10 w-10 rounded object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <IconComponent className="h-5 w-5 text-gray-500" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {file.name}
          </p>
          {getStatusIcon()}
        </div>
        
        {showFileInfo && (
          <div className="flex items-center space-x-4 mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(file.size)}
            </p>
            {file.uploadedAt && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {file.uploadedAt.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
        
        {/* Progress Bar */}
        {showProgress && file.status === 'uploading' && file.progress !== undefined && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <motion.div
                className="bg-primary-500 h-1 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${file.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {file.progress}%
            </p>
          </div>
        )}

        {/* Error Message */}
        {file.status === 'error' && file.error && (
          <p className="text-xs text-red-500 mt-1">{file.error}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        {file.status === 'error' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRetry(file.id)}
            className="text-xs"
          >
            Retry
          </Button>
        )}
        {showDownload && file.status === 'success' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDownload(file)}
            className="text-xs"
          >
            <Download className="h-3 w-3" />
          </Button>
        )}
        {showRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(file.id)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ delay: index * stagger }}
        layout
      >
        {itemContent}
      </motion.div>
    )
  }

  return itemContent
}

export default FileUpload
