import { z } from 'zod'

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Validate request body against Zod schema
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      throw new ValidationError(
        `${firstError.path.join('.')}: ${firstError.message}`,
        firstError.path.join('.')
      )
    }
    throw new ValidationError('Invalid request body')
  }
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000) // Limit length
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: {
  filename: string
  mimetype: string
  size: number
}): void {
  // Check filename
  if (!file.filename || file.filename.length > 255) {
    throw new ValidationError('Invalid filename')
  }

  // Check for dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.jar']
  const ext = file.filename.toLowerCase().split('.').pop()
  if (ext && dangerousExtensions.includes(`.${ext}`)) {
    throw new ValidationError('File type not allowed')
  }

  // Check mime type
  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mov', 'video/avi', 'video/webm',
    'audio/mp3', 'audio/wav', 'audio/ogg',
    'application/pdf', 'text/plain'
  ]

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new ValidationError(`File type ${file.mimetype} not allowed`)
  }

  // Check file size (50MB)
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    throw new ValidationError('File too large (max 50MB)')
  }
}

/**
 * Validate project slug format
 */
export function validateSlug(slug: string): string {
  const sanitized = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (sanitized.length < 1 || sanitized.length > 100) {
    throw new ValidationError('Slug must be 1-100 characters')
  }

  return sanitized
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  id: z.string().min(1, 'ID is required'),
  email: z.string().email('Invalid email format'),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  projectId: z.string().cuid('Invalid project ID'),
  pagination: z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20)
  })
}

/**
 * Enhanced error response formatting
 */
export function formatValidationError(error: ValidationError) {
  return {
    error: 'Validation Error',
    message: error.message,
    field: error.field,
    code: 'VALIDATION_ERROR'
  }
}

/**
 * Generic error response formatting
 */
export function formatError(error: Error, code = 'INTERNAL_ERROR') {
  return {
    error: error.name || 'Error',
    message: error.message,
    code
  }
}