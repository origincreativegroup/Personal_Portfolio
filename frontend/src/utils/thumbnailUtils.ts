/**
 * Utility functions for generating and managing image thumbnails
 */

export const generateThumbnail = (file: File, maxWidth: number = 150, maxHeight: number = 150): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate thumbnail dimensions while maintaining aspect ratio
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw the image to canvas
      ctx?.drawImage(img, 0, 0, width, height)

      // Convert to data URL
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8)
      resolve(thumbnailDataUrl)
    }

    img.onerror = () => {
      reject(new Error('Failed to load image for thumbnail generation'))
    }

    img.src = URL.createObjectURL(file)
  })
}

export const getAssetThumbnail = (asset: any): string => {
  // If asset has a thumbnail URL, use it
  if (asset.thumbnailUrl) {
    return asset.thumbnailUrl
  }
  
  // If it's an image, use the dataUrl
  if (asset.mimeType?.startsWith('image/') && asset.dataUrl) {
    return asset.dataUrl
  }
  
  // Return a placeholder based on file type
  const type = asset.mimeType?.split('/')[0] || 'file'
  
  switch (type) {
    case 'image':
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iI0YzRjNGMyIvPgo8cGF0aCBkPSJNMTYgMjBMMjAgMTZMMjggMjRMMzYgMTZMMzYgMzJIMTZWMjBaIiBmaWxsPSIjOTk5OTk5Ii8+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjMiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+'
    case 'video':
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iI0YzRjNGMyIvPgo8cGF0aCBkPSJNMTggMTZMMzAgMjRMMTggMzJWMTZaIiBmaWxsPSIjOTk5OTk5Ii8+Cjwvc3ZnPg=='
    case 'audio':
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iI0YzRjNGMyIvPgo8cGF0aCBkPSJNMjQgMTJWMzZMMTggMzBIMTRWMThIMThMMjQgMTJaIiBmaWxsPSIjOTk5OTk5Ii8+CjxwYXRoIGQ9Ik0yOCAyMEwzMiAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+'
    default:
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iI0YzRjNGMyIvPgo8cGF0aCBkPSJNMTYgMTZIMzJWMzJIMTZWMzJaIiBmaWxsPSJub25lIiBzdHJva2U9IiM5OTk5OTkiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMjAgMjBIMjgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik0yMCAyNEgyOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+'
  }
}
