import { ReactNode, forwardRef, useCallback, useState, useRef, DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../shared/utils'
import { Upload, File, Image, Video, Music, FileText, X } from 'lucide-react'

// ===== TYPES =====

export interface DragDropFile {
  id: string
  file: File
  preview?: string
  type: 'image' | 'video' | 'audio' | 'document' | 'other'
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress?: number
  error?: string
}

export interface DragDropProps {
  children?: ReactNode
  onFilesDrop: (files: File[]) => void
  onFileRemove?: (fileId: string) => void
  onFileRetry?: (fileId: string) => void
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
  // Animation props
  animate?: boolean
  stagger?: number
}

// ===== UTILITIES =====

const getFileType = (file: File): DragDropFile['type'] => {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type.startsWith('text/') || file.type.includes('pdf') || file.type.includes('document')) return 'document'
  return 'other'
}

const getFileIcon = (type: DragDropFile['type']) => {
  switch (type) {
    case 'image': return Image
    case 'video': return Video
    case 'audio': return Music
    case 'document': return FileText
    default: return File
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ===== DRAG DROP ZONE =====

export const DragDropZone = forwardRef<HTMLDivElement, DragDropProps>(({
  children,
  onFilesDrop,
  onFileRemove,
  onFileRetry,
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
  animate = true,
  stagger = 0.1,
}, ref) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [files, setFiles] = useState<DragDropFile[]>([])
  const [errors, setErrors] = useState<string[]>([])
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

  const handleFiles = useCallback((fileList: FileList) => {
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
      setErrors(validationErrors)
      return
    }

    // Check max files
    if (files.length + newFiles.length > maxFiles) {
      setErrors([`Maximum ${maxFiles} files allowed`])
      return
    }

    // Create file objects
    const dragDropFiles: DragDropFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: getFileType(file),
      status: 'pending',
    }))

    // Generate previews for images
    dragDropFiles.forEach(dragDropFile => {
      if (dragDropFile.type === 'image') {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFiles(prev => prev.map(f => 
            f.id === dragDropFile.id ? { ...f, preview: e.target?.result as string } : f
          ))
        }
        reader.readAsDataURL(dragDropFile.file)
      }
    })

    setFiles(prev => [...prev, ...dragDropFiles])
    setErrors([])
    onFilesDrop(newFiles)
  }, [files.length, maxFiles, maxSize, accept, onFilesDrop])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (disabled) return

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles)
    }
  }, [disabled, handleFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles)
    }
  }, [handleFiles])

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    onFileRemove?.(fileId)
  }, [onFileRemove])

  const handleRetryFile = useCallback((fileId: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'pending', error: undefined } : f
    ))
    onFileRetry?.(fileId)
  }, [onFileRetry])

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
      {/* Drop Zone */}
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

      {/* Error Messages */}
      {errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Upload Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
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
                onRemove={handleRemoveFile}
                onRetry={handleRetryFile}
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

DragDropZone.displayName = 'DragDropZone'

// ===== FILE ITEM =====

interface FileItemProps {
  file: DragDropFile
  index: number
  showPreview: boolean
  showProgress: boolean
  showRemove: boolean
  onRemove: (fileId: string) => void
  onRetry: (fileId: string) => void
  animate: boolean
  stagger: number
}

const FileItem = ({
  file,
  index,
  showPreview,
  showProgress,
  showRemove,
  onRemove,
  onRetry,
  animate,
  stagger,
}: FileItemProps) => {
  const IconComponent = getFileIcon(file.type)

  const itemContent = (
    <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      {/* Preview/Icon */}
      <div className="flex-shrink-0">
        {showPreview && file.preview ? (
          <img
            src={file.preview}
            alt={file.file.name}
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
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {file.file.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(file.file.size)}
        </p>
        
        {/* Progress Bar */}
        {showProgress && file.status === 'uploading' && file.progress !== undefined && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div
                className="bg-primary-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${file.progress}%` }}
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
          <button
            onClick={() => onRetry(file.id)}
            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Retry
          </button>
        )}
        {showRemove && (
          <button
            onClick={() => onRemove(file.id)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
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

// ===== EXPORT =====

export default DragDropZone
