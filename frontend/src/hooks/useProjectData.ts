import { useState, useEffect, useCallback } from 'react'
import { ProjectAsset } from '../types/asset'

export interface Project {
  id: string
  title: string
  client: string
  status: 'draft' | 'in-progress' | 'review' | 'published' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  progress: number
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
  description: string
  assets: ProjectAsset[]
  teamSize: number
  budget: number
  tags: string[]
  category: string
  lastActivity: string
  nextMilestone?: string
  completionDate?: string
}

export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalAssets: number
  totalBudget: number
  averageProjectDuration: number
  teamProductivity: number
  clientSatisfaction: number
}

export interface ProjectActivity {
  id: string
  projectId: string
  type: 'created' | 'updated' | 'asset_uploaded' | 'milestone_reached' | 'status_changed'
  description: string
  timestamp: string
  user: string
}

export function useProjectData() {
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<ProjectActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch projects from API
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      const data = await response.json()
      // Handle both direct array and object with projects property
      const apiProjects = Array.isArray(data) ? data : data.projects || []
      
      // Transform API projects to match our interface
      const transformedProjects = apiProjects.map((apiProject: any) => ({
        id: apiProject.id,
        title: apiProject.title,
        client: apiProject.organization || 'Unknown Client',
        status: 'in-progress' as const, // Default status since API doesn't have this
        priority: 'medium' as const, // Default priority since API doesn't have this
        progress: 50, // Default progress since API doesn't have this
        startDate: apiProject.createdAt ? new Date(apiProject.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: apiProject.updatedAt ? new Date(apiProject.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        createdAt: apiProject.createdAt || new Date().toISOString(),
        updatedAt: apiProject.updatedAt || new Date().toISOString(),
        description: apiProject.description || apiProject.summary || '',
        assets: apiProject.files ? apiProject.files.map((file: any) => ({
          id: file.id,
          name: file.name,
          type: file.mimeType?.startsWith('image/') ? 'image' : file.mimeType?.startsWith('video/') ? 'video' : 'document',
          size: file.size || 0,
          mimeType: file.mimeType || 'application/octet-stream',
          dataUrl: file.url || '',
          thumbnailUrl: file.thumbnailUrl || null,
          addedAt: file.createdAt || new Date().toISOString(),
          description: file.description || '',
          tags: file.tags || [],
          folder: apiProject.folder || '',
          featured: file.featured || false,
          visibility: 'public' as const,
          isHero: file.featured || false,
          width: null,
          height: null,
          duration: null,
          projectId: apiProject.id
        })) : [],
        teamSize: 1, // Default since API doesn't have this
        budget: 0, // Default since API doesn't have this
        tags: apiProject.tags ? apiProject.tags.split(',').map((tag: string) => tag.trim()) : [],
        category: apiProject.workType || apiProject.categories || 'General',
        lastActivity: apiProject.updatedAt || new Date().toISOString(),
        nextMilestone: 'In Progress',
        completionDate: undefined
      }))
      
      setProjects(transformedProjects)
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Fallback to mock data
      setProjects(getMockProjects())
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching stats:', err)
      // Calculate stats from projects
      setStats(calculateStats(projects))
    }
  }, [projects])

  // Fetch recent activities
  const fetchActivities = useCallback(async () => {
    try {
      const response = await fetch('/api/activities')
      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }
      const data = await response.json()
      setActivities(data)
    } catch (err) {
      console.error('Error fetching activities:', err)
      // Fallback to mock activities
      setActivities(getMockActivities())
    }
  }, [])

  // Create new project
  const createProject = useCallback(async (projectData: Partial<Project>) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create project')
      }
      
      const newProject = await response.json()
      setProjects(prev => [newProject, ...prev])
      return newProject
    } catch (err) {
      console.error('Error creating project:', err)
      throw err
    }
  }, [])

  // Update project
  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update project')
      }
      
      const updatedProject = await response.json()
      setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p))
      return updatedProject
    } catch (err) {
      console.error('Error updating project:', err)
      throw err
    }
  }, [])

  // Delete project
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete project')
      }
      
      setProjects(prev => prev.filter(p => p.id !== projectId))
    } catch (err) {
      console.error('Error deleting project:', err)
      throw err
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    if (projects.length > 0) {
      fetchStats()
      fetchActivities()
    }
  }, [projects, fetchStats, fetchActivities])

  return {
    projects,
    stats,
    activities,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects
  }
}

// Mock data for development
function getMockProjects(): Project[] {
  return [
    {
      id: '1',
      title: 'E-commerce Platform Redesign',
      client: 'Acme Corporation',
      status: 'in-progress',
      priority: 'high',
      progress: 75,
      startDate: '2024-01-15',
      endDate: '2024-03-15',
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-02-20T14:30:00Z',
      description: 'Complete redesign of the e-commerce platform with modern UI/UX',
      assets: [],
      teamSize: 5,
      budget: 50000,
      tags: ['UI/UX', 'E-commerce', 'React'],
      category: 'Web Development',
      lastActivity: '2024-02-20T14:30:00Z',
      nextMilestone: 'User Testing Phase',
      completionDate: '2024-03-15'
    },
    {
      id: '2',
      title: 'Brand Identity Package',
      client: 'StartupXYZ',
      status: 'review',
      priority: 'medium',
      progress: 90,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      createdAt: '2024-01-25T09:00:00Z',
      updatedAt: '2024-02-22T16:45:00Z',
      description: 'Complete brand identity including logo, guidelines, and marketing materials',
      assets: [],
      teamSize: 3,
      budget: 25000,
      tags: ['Branding', 'Logo Design', 'Marketing'],
      category: 'Brand Identity',
      lastActivity: '2024-02-22T16:45:00Z',
      nextMilestone: 'Final Review',
      completionDate: '2024-02-28'
    },
    {
      id: '3',
      title: 'Mobile App Development',
      client: 'TechCorp',
      status: 'draft',
      priority: 'urgent',
      progress: 25,
      startDate: '2024-03-01',
      endDate: '2024-06-01',
      createdAt: '2024-02-15T11:20:00Z',
      updatedAt: '2024-02-23T09:15:00Z',
      description: 'Native mobile app for iOS and Android platforms',
      assets: [],
      teamSize: 8,
      budget: 120000,
      tags: ['Mobile', 'iOS', 'Android', 'React Native'],
      category: 'Mobile Development',
      lastActivity: '2024-02-23T09:15:00Z',
      nextMilestone: 'Wireframes Complete'
    },
    {
      id: '4',
      title: 'Marketing Campaign',
      client: 'RetailPlus',
      status: 'published',
      priority: 'medium',
      progress: 100,
      startDate: '2024-01-01',
      endDate: '2024-02-15',
      createdAt: '2023-12-20T14:00:00Z',
      updatedAt: '2024-02-15T17:00:00Z',
      description: 'Complete digital marketing campaign with social media and email marketing',
      assets: [],
      teamSize: 4,
      budget: 35000,
      tags: ['Marketing', 'Social Media', 'Email'],
      category: 'Marketing',
      lastActivity: '2024-02-15T17:00:00Z',
      completionDate: '2024-02-15'
    },
    {
      id: '5',
      title: 'Website Maintenance',
      client: 'Local Business',
      status: 'in-progress',
      priority: 'low',
      progress: 60,
      startDate: '2024-02-01',
      endDate: '2024-04-01',
      createdAt: '2024-01-28T13:30:00Z',
      updatedAt: '2024-02-21T10:20:00Z',
      description: 'Ongoing website maintenance and updates',
      assets: [],
      teamSize: 2,
      budget: 15000,
      tags: ['Maintenance', 'WordPress', 'Updates'],
      category: 'Maintenance',
      lastActivity: '2024-02-21T10:20:00Z',
      nextMilestone: 'Security Updates'
    }
  ]
}

function getMockActivities(): ProjectActivity[] {
  return [
    {
      id: '1',
      projectId: '1',
      type: 'milestone_reached',
      description: 'User Testing Phase completed',
      timestamp: '2024-02-20T14:30:00Z',
      user: 'John Doe'
    },
    {
      id: '2',
      projectId: '2',
      type: 'status_changed',
      description: 'Project status changed to Review',
      timestamp: '2024-02-22T16:45:00Z',
      user: 'Jane Smith'
    },
    {
      id: '3',
      projectId: '3',
      type: 'asset_uploaded',
      description: 'Wireframes uploaded',
      timestamp: '2024-02-23T09:15:00Z',
      user: 'Mike Johnson'
    },
    {
      id: '4',
      projectId: '4',
      type: 'status_changed',
      description: 'Project completed and published',
      timestamp: '2024-02-15T17:00:00Z',
      user: 'Sarah Wilson'
    },
    {
      id: '5',
      projectId: '5',
      type: 'updated',
      description: 'Security updates applied',
      timestamp: '2024-02-21T10:20:00Z',
      user: 'Tom Brown'
    }
  ]
}

function calculateStats(projects: Project[]): DashboardStats {
  const totalProjects = projects.length
  const activeProjects = projects.filter(p => p.status === 'in-progress').length
  const completedProjects = projects.filter(p => p.status === 'published').length
  const totalAssets = projects.reduce((sum, p) => sum + p.assets.length, 0)
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0)
  
  // Calculate average project duration
  const completedProjectsWithDates = projects.filter(p => p.completionDate && p.startDate)
  const averageProjectDuration = completedProjectsWithDates.length > 0
    ? completedProjectsWithDates.reduce((sum, p) => {
        const start = new Date(p.startDate)
        const end = new Date(p.completionDate!)
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) // days
      }, 0) / completedProjectsWithDates.length
    : 0

  // Mock calculations for team productivity and client satisfaction
  const teamProductivity = Math.min(95, 70 + (completedProjects / totalProjects) * 25)
  const clientSatisfaction = Math.min(98, 85 + (completedProjects / totalProjects) * 13)

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    totalAssets,
    totalBudget,
    averageProjectDuration: Math.round(averageProjectDuration),
    teamProductivity: Math.round(teamProductivity),
    clientSatisfaction: Math.round(clientSatisfaction)
  }
}
