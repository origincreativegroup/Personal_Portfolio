import React, { useState, useEffect } from 'react';
import {
  Plus, ArrowRight, Folder, Image, Video, FileText, Upload,
  Zap, Globe, Smartphone, Monitor, Camera, Palette, Code,
  Star, Clock, User, Search, Filter, Grid, List, Trash2,
  Eye, Download, Settings, ChevronDown, X, AlertCircle,
  HelpCircle, BookOpen, Layout
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { newProject } from '../intake/schema';
import { buildCaseStudyTemplate } from '../utils/caseStudyTemplates';
import { saveProject } from '../utils/storageManager';

interface ProjectCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  color: string;
  templates: string[];
}

const NewIntakePage = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [showTemplateDetails, setShowTemplateDetails] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    category: '',
    template: '',
    color: '#5a3cf4',
    visibility: 'public',
    tags: [] as string[],
    files: [] as File[]
  });

  const projectCategories: ProjectCategory[] = [
    {
      id: 'web-development',
      name: 'Web Development',
      icon: Globe,
      description: 'Websites, web applications, and frontend projects',
      color: '#3B82F6',
      templates: ['Landing Page', 'E-commerce', 'Dashboard', 'Blog', 'Portfolio']
    },
    {
      id: 'mobile-development',
      name: 'Mobile Development',
      icon: Smartphone,
      description: 'iOS and Android applications',
      color: '#10B981',
      templates: ['Social App', 'E-commerce App', 'Productivity', 'Game', 'Utility']
    },
    {
      id: 'ui-ux-design',
      name: 'UI/UX Design',
      icon: Palette,
      description: 'User interface and experience design projects',
      color: '#8B5CF6',
      templates: ['Design System', 'Mobile UI', 'Web UI', 'Wireframes', 'Prototypes']
    },
    {
      id: 'photography',
      name: 'Photography',
      icon: Camera,
      description: 'Photo galleries and visual storytelling',
      color: '#F59E0B',
      templates: ['Portrait Gallery', 'Wedding', 'Nature', 'Product', 'Event']
    },
    {
      id: 'branding',
      name: 'Branding & Identity',
      icon: Star,
      description: 'Brand identity and visual communication',
      color: '#EF4444',
      templates: ['Logo Design', 'Brand Guidelines', 'Packaging', 'Print Design', 'Marketing']
    },
    {
      id: 'development',
      name: 'Software Development',
      icon: Code,
      description: 'Backend, APIs, and software engineering',
      color: '#06B6D4',
      templates: ['API Documentation', 'Library', 'Tool', 'Framework', 'Algorithm']
    }
  ];

  const colorOptions = [
    '#5a3cf4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];

  const handleCategorySelect = (category: ProjectCategory) => {
    setFormData(prev => ({ ...prev, category: category.id }));
    setActiveStep(2);
  };

  const handleTemplateSelect = (template: string) => {
    setFormData(prev => ({ ...prev, template }));
    setActiveStep(3);
  };

  const handleProjectSubmit = async () => {
    const title = formData.projectName.trim();
    if (!title) {
      return;
    }

    const project = newProject(title);
    project.summary = formData.description.trim() || undefined;
    project.problem = formData.description.trim();
    project.solution = 'Use the editor to describe the approach, process, and collaboration.';
    project.outcomes = 'Add measurable impact or learnings from the project in the editor.';
    project.tags = Array.isArray(formData.tags) ? formData.tags : [];

    const template = buildCaseStudyTemplate(project);
    project.caseStudyHtml = template.html;
    project.caseStudyCss = template.css;

    await saveProject(project);
    navigate(`/editor/${project.slug}`);
  };

  const selectedCategory = projectCategories.find(cat => cat.id === formData.category);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`border-b ${
        isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowRight className="rotate-180" size={16} />
                <span>Back to Dashboard</span>
              </Link>

              <div className="border-l border-gray-300 dark:border-gray-700 h-6"></div>

              <div>
                <h1 className="text-xl font-semibold">Create New Project</h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Set up your portfolio project in just a few steps
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>

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
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className={`border-b ${isDarkMode ? 'border-gray-800 bg-gray-850' : 'border-gray-200 bg-gray-25'}`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-8">
              {[
                { step: 1, title: 'Category', icon: Layout },
                { step: 2, title: 'Template', icon: BookOpen },
                { step: 3, title: 'Details', icon: User },
                { step: 4, title: 'Files', icon: Upload }
              ].map(({ step, title, icon: Icon }) => (
                <div key={step} className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                    activeStep >= step
                      ? 'bg-purple-600 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {activeStep > step ? (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    activeStep >= step
                      ? 'text-purple-600 dark:text-purple-400'
                      : isDarkMode
                        ? 'text-gray-400'
                        : 'text-gray-500'
                  }`}>
                    {title}
                  </span>
                  {step < 4 && (
                    <div className={`w-12 h-px ${
                      activeStep > step
                        ? 'bg-purple-600'
                        : isDarkMode
                          ? 'bg-gray-700'
                          : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Step 1: Category Selection */}
          {activeStep === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Choose Your Project Category</h2>
                <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Select the type of project you want to showcase
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectCategories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg group ${
                        formData.category === category.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                          : isDarkMode
                            ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          <IconComponent size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {category.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-3">
                            {category.templates.slice(0, 3).map((template) => (
                              <span
                                key={template}
                                className={`px-2 py-1 text-xs rounded-full ${
                                  isDarkMode
                                    ? 'bg-gray-700 text-gray-300'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {template}
                              </span>
                            ))}
                            {category.templates.length > 3 && (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                isDarkMode
                                  ? 'bg-gray-700 text-gray-400'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                +{category.templates.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Template Selection */}
          {activeStep === 2 && selectedCategory && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Choose a Template</h2>
                <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Pick a starting template for your {selectedCategory.name.toLowerCase()} project
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedCategory.templates.map((template) => (
                  <button
                    key={template}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg group ${
                      formData.template === template
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                        : isDarkMode
                          ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="aspect-video rounded-lg mb-4 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 flex items-center justify-center">
                      <div className="text-4xl opacity-50">📱</div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{template}</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Perfect starting point for {template.toLowerCase()} projects
                    </p>
                  </button>
                ))}

                {/* Custom Template Option */}
                <button
                  onClick={() => handleTemplateSelect('Custom')}
                  className={`p-6 rounded-xl border-2 border-dashed text-left transition-all hover:shadow-lg group ${
                    formData.template === 'Custom'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                      : isDarkMode
                        ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-video rounded-lg mb-4 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Plus size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Start from Scratch</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Build your own custom project structure
                  </p>
                </button>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setActiveStep(1)}
                  className={`px-6 py-3 rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'border-gray-700 hover:bg-gray-800'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  ← Back to Categories
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Project Details */}
          {activeStep === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Project Details</h2>
                <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Tell us about your project
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Name *</label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                    placeholder="e.g., My Awesome Mobile App"
                    className={`w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isDarkMode
                        ? 'border-gray-700 bg-gray-800 focus:border-purple-500'
                        : 'border-gray-200 bg-white focus:border-purple-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of your project..."
                    rows={4}
                    className={`w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                      isDarkMode
                        ? 'border-gray-700 bg-gray-800 focus:border-purple-500'
                        : 'border-gray-200 bg-white focus:border-purple-500'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Project Color</label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          onClick={() => setFormData(prev => ({ ...prev, color }))}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            formData.color === color ? 'border-gray-400 scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Visibility</label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          value="public"
                          checked={formData.visibility === 'public'}
                          onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                          className="text-purple-600"
                        />
                        <div>
                          <div className="font-medium">Public</div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Visible to everyone
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          value="private"
                          checked={formData.visibility === 'private'}
                          onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                          className="text-purple-600"
                        />
                        <div>
                          <div className="font-medium">Private</div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Only visible to you
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    onClick={() => setActiveStep(2)}
                    className={`flex-1 py-3 rounded-xl font-medium border transition-colors ${
                      isDarkMode
                        ? 'border-gray-700 hover:bg-gray-800'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    ← Back to Templates
                  </button>

                  <button
                    onClick={() => setActiveStep(4)}
                    disabled={!formData.projectName}
                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                      formData.projectName
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700'
                    }`}
                  >
                    Continue to Files →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: File Upload */}
          {activeStep === 4 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Add Your Files</h2>
                <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Upload images, videos, and documents for your project
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                {/* File Upload Area */}
                <div className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  isDarkMode
                    ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}>
                  <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Drop files here or click to browse</h3>
                  <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Support for images, videos, PDFs, and more
                  </p>
                  <button className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                    Choose Files
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <button className={`p-4 rounded-xl border text-left transition-colors ${
                    isDarkMode
                      ? 'border-gray-700 bg-gray-800 hover:bg-gray-750'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}>
                    <Image size={24} className="mb-2 text-blue-500" />
                    <h4 className="font-medium mb-1">Add Images</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Screenshots, designs, photos
                    </p>
                  </button>

                  <button className={`p-4 rounded-xl border text-left transition-colors ${
                    isDarkMode
                      ? 'border-gray-700 bg-gray-800 hover:bg-gray-750'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}>
                    <Video size={24} className="mb-2 text-green-500" />
                    <h4 className="font-medium mb-1">Add Videos</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Demos, presentations, clips
                    </p>
                  </button>

                  <button className={`p-4 rounded-xl border text-left transition-colors ${
                    isDarkMode
                      ? 'border-gray-700 bg-gray-800 hover:bg-gray-750'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}>
                    <FileText size={24} className="mb-2 text-purple-500" />
                    <h4 className="font-medium mb-1">Add Documents</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      PDFs, wireframes, specs
                    </p>
                  </button>
                </div>

                <div className="flex gap-4 pt-8">
                  <button
                    onClick={() => setActiveStep(3)}
                    className={`flex-1 py-3 rounded-xl font-medium border transition-colors ${
                      isDarkMode
                        ? 'border-gray-700 hover:bg-gray-800'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    ← Back to Details
                  </button>

                  <button
                    onClick={handleProjectSubmit}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors"
                  >
                    Create Project & Continue →
                  </button>
                </div>

                <div className="text-center mt-6">
                  <button
                    onClick={handleProjectSubmit}
                    className={`text-sm underline ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Skip file upload for now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NewIntakePage;