import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import type { ProjectMeta } from '../src/intake/schema.ts'
import {
  resetStorageDependencies,
  resetStorageManagerForTesting,
  setStorageDependencies,
  storageManager
} from '../src/utils/storageManager.ts'

const createProject = (overrides: Partial<ProjectMeta> = {}): ProjectMeta => ({
  title: 'Test Project',
  slug: 'test-project',
  summary: 'Summary',
  problem: 'Problem',
  challenge: 'Challenge',
  solution: 'Solution',
  outcomes: 'Outcomes',
  tags: ['test'],
  status: 'draft',
  role: 'developer',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  assets: [],
  ...overrides
})

type StorageMocks = {
  indexedDbStore: ReturnType<typeof createIndexedDbStoreMock>
  fileStore: ReturnType<typeof createFileStoreMock>
  isIndexedDBSupported: ReturnType<typeof mock.fn>
}

const createIndexedDbStoreMock = () => ({
  init: mock.fn(async () => {}),
  saveProject: mock.fn(async (_project: ProjectMeta) => {}),
  loadProject: mock.fn(async (_slug: string) => null),
  listProjects: mock.fn(async () => [] as ProjectMeta[]),
  deleteProject: mock.fn(async (_slug: string) => {}),
  clearAllProjects: mock.fn(async () => {}),
  getStorageUsage: mock.fn(async () => ({ used: 0, available: 100, percentage: 0 })),
  getProjectSizes: mock.fn(async () => [] as Array<{ slug: string, title: string, size: number, sizeMB: string }>)
})

const createFileStoreMock = () => ({
  saveProject: mock.fn((_project: ProjectMeta) => {}),
  loadProject: mock.fn((_slug: string) => null as ProjectMeta | null),
  listProjects: mock.fn(() => [] as ProjectMeta[]),
  deleteProject: mock.fn((_slug: string) => {}),
  clearAllProjects: mock.fn(() => {}),
  getStorageUsage: mock.fn(() => ({ used: 0, available: 10, percentage: 0 })),
  getProjectSizes: mock.fn(() => [] as Array<{ slug: string, title: string, size: number, sizeMB: string }>)
})

const setupMocks = (): StorageMocks => {
  const indexedDbStore = createIndexedDbStoreMock()
  const fileStore = createFileStoreMock()
  const isIndexedDBSupported = mock.fn(() => true)

  setStorageDependencies({ indexedDbStore, fileStore, isIndexedDBSupported })

  return { indexedDbStore, fileStore, isIndexedDBSupported }
}

describe('storageManager', () => {
  let mocks: StorageMocks

  beforeEach(() => {
    resetStorageDependencies()
    resetStorageManagerForTesting()
    mock.restoreAll()
    mocks = setupMocks()
  })

  afterEach(() => {
    resetStorageDependencies()
    resetStorageManagerForTesting()
    mock.restoreAll()
  })

  it('uses IndexedDB when it is supported and initialisation succeeds', async () => {
    mocks.isIndexedDBSupported.mock.mockImplementation(() => true)

    await storageManager.init()

    assert.strictEqual(storageManager.getStorageType(), 'indexedDB')
    assert.strictEqual(mocks.indexedDbStore.init.mock.calls.length, 1)
    assert.strictEqual(mocks.fileStore.listProjects.mock.calls.length, 1)
    assert.strictEqual(mocks.indexedDbStore.listProjects.mock.calls.length, 1)
  })

  it('falls back to localStorage when IndexedDB is not supported', async () => {
    mocks.isIndexedDBSupported.mock.mockImplementation(() => false)

    await storageManager.init()

    assert.strictEqual(storageManager.getStorageType(), 'localStorage')
    assert.strictEqual(mocks.indexedDbStore.init.mock.calls.length, 0)
  })

  it('falls back to localStorage when IndexedDB initialisation fails', async () => {
    mocks.isIndexedDBSupported.mock.mockImplementation(() => true)
    mocks.indexedDbStore.init.mock.mockImplementation(async () => {
      throw new Error('boom')
    })

    await storageManager.init()

    assert.strictEqual(storageManager.getStorageType(), 'localStorage')
  })

  it('migrates projects from localStorage when IndexedDB is empty', async () => {
    const projectA = createProject({ slug: 'a', title: 'A' })
    const projectB = createProject({ slug: 'b', title: 'B' })

    mocks.fileStore.listProjects.mock.mockImplementation(() => [projectA, projectB])
    mocks.indexedDbStore.listProjects.mock.mockImplementation(async () => [])

    await storageManager.init()

    assert.strictEqual(mocks.indexedDbStore.saveProject.mock.calls.length, 2)
    assert.deepStrictEqual(mocks.indexedDbStore.saveProject.mock.calls[0].arguments, [projectA])
    assert.deepStrictEqual(mocks.indexedDbStore.saveProject.mock.calls[1].arguments, [projectB])
  })

  it('delegates operations to IndexedDB when that store is active', async () => {
    const project = createProject()
    const projects = [project]
    const usage = { used: 4, available: 100, percentage: 4 }
    const sizes = [{ slug: project.slug, title: project.title, size: 42, sizeMB: '0.04MB' }]

    mocks.indexedDbStore.loadProject.mock.mockImplementation(async () => project)
    mocks.indexedDbStore.listProjects.mock.mockImplementation(async () => projects)
    mocks.indexedDbStore.getStorageUsage.mock.mockImplementation(async () => usage)
    mocks.indexedDbStore.getProjectSizes.mock.mockImplementation(async () => sizes)

    await storageManager.saveProject(project)
    const loaded = await storageManager.loadProject(project.slug)
    const listed = await storageManager.listProjects()
    await storageManager.deleteProject(project.slug)
    await storageManager.clearAllProjects()
    const usageResult = await storageManager.getStorageUsage()
    const sizesResult = await storageManager.getProjectSizes()

    assert.strictEqual(mocks.indexedDbStore.saveProject.mock.calls.length, 1)
    assert.deepStrictEqual(mocks.indexedDbStore.saveProject.mock.calls[0].arguments, [project])
    assert.deepStrictEqual(loaded, project)
    assert.deepStrictEqual(listed, projects)
    assert.strictEqual(mocks.indexedDbStore.deleteProject.mock.calls.length, 1)
    assert.strictEqual(mocks.indexedDbStore.clearAllProjects.mock.calls.length, 1)
    assert.deepStrictEqual(usageResult, { ...usage, type: 'indexedDB' })
    assert.deepStrictEqual(sizesResult, sizes)
  })

  it('delegates operations to localStorage when IndexedDB is unavailable', async () => {
    mocks.isIndexedDBSupported.mock.mockImplementation(() => false)
    const project = createProject({ slug: 'local' })
    const projects = [project]
    const usage = { used: 2, available: 10, percentage: 20 }
    const sizes = [{ slug: project.slug, title: project.title, size: 21, sizeMB: '0.02MB' }]

    mocks.fileStore.loadProject.mock.mockImplementation(() => project)
    mocks.fileStore.listProjects.mock.mockImplementation(() => projects)
    mocks.fileStore.getStorageUsage.mock.mockImplementation(() => usage)
    mocks.fileStore.getProjectSizes.mock.mockImplementation(() => sizes)

    await storageManager.saveProject(project)
    const loaded = await storageManager.loadProject(project.slug)
    const listed = await storageManager.listProjects()
    await storageManager.deleteProject(project.slug)
    await storageManager.clearAllProjects()
    const usageResult = await storageManager.getStorageUsage()
    const sizesResult = await storageManager.getProjectSizes()

    assert.strictEqual(mocks.fileStore.saveProject.mock.calls.length, 1)
    assert.deepStrictEqual(mocks.fileStore.saveProject.mock.calls[0].arguments, [project])
    assert.deepStrictEqual(loaded, project)
    assert.deepStrictEqual(listed, projects)
    assert.strictEqual(mocks.fileStore.deleteProject.mock.calls.length, 1)
    assert.strictEqual(mocks.fileStore.clearAllProjects.mock.calls.length, 1)
    assert.deepStrictEqual(usageResult, { ...usage, type: 'localStorage' })
    assert.deepStrictEqual(sizesResult, sizes)
  })
})
