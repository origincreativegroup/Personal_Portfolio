import { PrismaClient } from '@prisma/client'
import { logStructured } from '../observability/logger'

let cachedClient: PrismaClient | null = null
let cachedError: Error | null = null
let errorProxy: PrismaClient | null = null

const createErrorProxy = (error: Error): PrismaClient =>
  new Proxy({}, {
    get: () => {
      throw error
    },
  }) as PrismaClient

export const getPrismaClient = (): PrismaClient => {
  if (cachedClient) {
    return cachedClient
  }

  if (cachedError) {
    errorProxy = errorProxy ?? createErrorProxy(cachedError)
    return errorProxy
  }

  try {
    cachedClient = new PrismaClient()
    return cachedClient
  } catch (error) {
    const normalized = error instanceof Error ? error : new Error(String(error))
    cachedError = normalized
    logStructured('error', 'Failed to initialize Prisma client', { error: normalized.message })
    errorProxy = createErrorProxy(normalized)
    return errorProxy
  }
}

export const resetPrismaClientForTests = (): void => {
  cachedClient = null
  cachedError = null
  errorProxy = null
}
