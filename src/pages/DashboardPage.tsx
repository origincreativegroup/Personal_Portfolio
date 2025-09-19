import React, { useState, useRef } from 'react';
import {
  Plus, X, ArrowLeft, Folder, Image, FileText, Video, Settings,
  Search, Filter, Grid, List, MoreVertical, Edit2, Trash2,
  Copy, Move, Star, Clock, Tag, Palette, Layout, Eye, Share2,
  ChevronDown, Check, AlertCircle, Upload, User, Zap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    category: '',
    description: '',
    color: '#5a3cf4',
    template: 'custom',
    visibility: 'public'
  });

  const projectTemplates = [
    {
      id: 'web-dev',
      name: 'Web Development',
      description: 'Perfect for websites, web apps, and frontend projects',
      icon: '🌐',
      fields: ['Live URL', 'GitHub Repo', 'Technologies', 'Browser Support']
    },
    {
      id: 'mobile-app',
      name: 'Mobile App',
      description: 'iOS and Android app projects',
      icon: '📱',
      fields: ['App Store Link', 'Platform', 'Framework', 'Key Features']
    },
    {
      id: 'design',
      name: 'Design Portfolio',
      description: 'UI/UX, graphic design, and visual projects',
      icon: '🎨',
      fields: ['Design Tool', 'Client', 'Project Duration', 'Style Guide']
    },
    {
      id: 'photography',
      name: 'Photography',
      description: 'Photo galleries and visual storytelling',
      icon: '📸',
      fields: ['Camera Used', 'Location', 'Editing Software', 'Print Available']
    },
    {
      id: 'custom',
      name: 'Custom Project',
      description: 'Build your own project structure',
      icon: '⚙️',
      fields: []
    }
  ];

  const projects = [
    {
      id: 'web-dev-2024',
      name: 'Web Development Portfolio',
      category: 'Development',
      fileCount: 12,
      lastModified: '2 hours ago',
      color: '#5a3cf4',
      status: 'active',
      visibility: 'public'
    },
    {
      id: 'ui-designs',
      name: 'UI/UX Designs',
      category: 'Design',
      fileCount: 8,
      lastModified: '1 day ago',
      color: '#10b981',
      status: 'active',
      visibility: 'public'
    },
    {
      id: 'mobile-apps',
      name: 'Mobile Applications',
      category: 'Development',
      fileCount: 5,
      lastModified: '3 days ago',
      color: '#f59e0b',
      status: 'draft',
      visibility: 'private'
    }
  ];

  const colorOptions = [
    '#5a3cf4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];

  const handleNewProject = () => {
    setShowNewProjectModal(true);
  };

  const handleProjectSubmit = () => {
    // Handle project creation
    setShowNewProjectModal(false);
    setNewProjectForm({
      name: '',
      category: '',
      description: '',
      color: '#5a3cf4',
      template: 'custom',
      visibility: 'public'
    });
  };

  const handleProjectClick = (project) => {
    // Navigate to project editor
    navigate(`/editor/${project.id}`);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b ${
        isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Folder className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">Portfolio Dashboard</h1>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Manage your creative projects
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/settings"
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings size={20} />
              </Link>

              <button
                onClick={handleNewProject}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                New Project
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`rounded-xl border p-6 ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Folder className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Projects</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border p-6 ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Image className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {projects.reduce((sum, p) => sum + p.fileCount, 0)}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Files</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border p-6 ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {projects.filter(p => p.visibility === 'public').length}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Public Projects</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border p-6 ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {projects.filter(p => p.status === 'active').length}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Projects</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={20} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search projects..."
              className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                isDarkMode
                  ? 'border-gray-700 bg-gray-800 focus:border-purple-500'
                  : 'border-gray-200 bg-white focus:border-purple-500'
              }`}
            />
          </div>

          <button className={`p-3 rounded-xl border transition-colors ${
            isDarkMode
              ? 'border-gray-700 hover:bg-gray-800'
              : 'border-gray-200 hover:bg-gray-50'
          }`}>
            <Filter size={20} />
          </button>

          <div className="flex items-center border rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-purple-100 text-purple-600 dark:bg-purple-900'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Grid size={20} />
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`p-3 transition-colors ${
                viewMode === 'list'
                  ? 'bg-purple-100 text-purple-600 dark:bg-purple-900'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className={viewMode === 'grid' ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
          {projects.map((project) => (
            <div
              key={project.id}
              className={`rounded-xl border p-6 transition-all hover:shadow-lg cursor-pointer group ${
                isDarkMode ? 'border-gray-700 bg-gray-800 hover:bg-gray-750' : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
              onClick={() => handleProjectClick(project)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <div>
                    <h3 className="font-semibold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {project.name}
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {project.category}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}>
                    {project.status}
                  </span>

                  <button
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle project menu
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Files:</span>
                  <span className="font-medium">{project.fileCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Updated:</span>
                  <span>{project.lastModified}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Visibility:</span>
                  <div className="flex items-center gap-1">
                    {project.visibility === 'public' ? <Eye size={12} /> : <AlertCircle size={12} />}
                    <span className="capitalize">{project.visibility}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}>
                  <Edit2 size={14} className="inline mr-1" />
                  Edit
                </button>

                <button className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}>
                  <Share2 size={14} className="inline mr-1" />
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Folder className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Create your first project to get started with your portfolio
            </p>
            <button
              onClick={handleNewProject}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Create Your First Project
            </button>
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Create New Project</h2>
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3">Choose Template</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {projectTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setNewProjectForm(prev => ({ ...prev, template: template.id }))}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          newProjectForm.template === template.id
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                            : isDarkMode
                              ? 'border-gray-700 hover:bg-gray-750'
                              : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{template.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium">{template.name}</h4>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {template.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Project Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Project Name *</label>
                    <input
                      type="text"
                      value={newProjectForm.name}
                      onChange={(e) => setNewProjectForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Mobile App Portfolio 2024"
                      className={`w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        isDarkMode
                          ? 'border-gray-700 bg-gray-700 focus:border-purple-500'
                          : 'border-gray-200 bg-white focus:border-purple-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={newProjectForm.description}
                      onChange={(e) => setNewProjectForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of this project collection..."
                      rows={3}
                      className={`w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                        isDarkMode
                          ? 'border-gray-700 bg-gray-700 focus:border-purple-500'
                          : 'border-gray-200 bg-white focus:border-purple-500'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select
                        value={newProjectForm.category}
                        onChange={(e) => setNewProjectForm(prev => ({ ...prev, category: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          isDarkMode
                            ? 'border-gray-700 bg-gray-700 focus:border-purple-500'
                            : 'border-gray-200 bg-white focus:border-purple-500'
                        }`}
                      >
                        <option value="">Select category</option>
                        <option value="Development">Development</option>
                        <option value="Design">Design</option>
                        <option value="Photography">Photography</option>
                        <option value="Writing">Writing</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Project Color</label>
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewProjectForm(prev => ({ ...prev, color }))}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              newProjectForm.color === color ? 'border-gray-400 scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Visibility</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="public"
                          checked={newProjectForm.visibility === 'public'}
                          onChange={(e) => setNewProjectForm(prev => ({ ...prev, visibility: e.target.value }))}
                          className="text-purple-600"
                        />
                        <span>Public</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="private"
                          checked={newProjectForm.visibility === 'private'}
                          onChange={(e) => setNewProjectForm(prev => ({ ...prev, visibility: e.target.value }))}
                          className="text-purple-600"
                        />
                        <span>Private</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowNewProjectModal(false)}
                    className={`flex-1 py-3 rounded-xl font-medium border transition-colors ${
                      isDarkMode
                        ? 'border-gray-700 hover:bg-gray-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleProjectSubmit}
                    disabled={!newProjectForm.name}
                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                      newProjectForm.name
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700'
                    }`}
                  >
                    Create Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;