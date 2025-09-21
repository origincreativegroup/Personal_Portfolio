import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Project } from '../types/blocks';

const CaseStudyPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectSummary, setNewProjectSummary] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Mock data for now - this will be replaced with actual API calls
  useEffect(() => {
    const mockProjects: Project[] = [
      {
        id: '1',
        title: 'E-commerce Platform Redesign',
        summary: 'Complete overhaul of the user experience for better conversions',
        status: 'published',
        blocks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Mobile App User Research',
        summary: 'Comprehensive user research and testing for mobile application',
        status: 'draft',
        blocks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setProjects(mockProjects);
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    setIsCreating(true);

    // Mock API call - replace with actual implementation
    const newProject: Project = {
      id: Date.now().toString(),
      title: newProjectTitle,
      summary: newProjectSummary || undefined,
      status: 'draft',
      blocks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects(prev => [...prev, newProject]);
    setNewProjectTitle('');
    setNewProjectSummary('');
    setIsCreating(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <section className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold lowercase text-[#5a3cf4]">
            Case Studies
          </h1>
          <p className="text-sm text-[#333333]">
            Create a case study, then open the editor to add blocks and publish.
          </p>
        </header>

        <form
          onSubmit={handleCreateProject}
          className="flex items-end gap-4 rounded-2xl border border-[#cbc0ff] px-4 py-4"
        >
          <div className="flex flex-col gap-2">
            <label
              className="text-xs uppercase tracking-wide text-[#333333]"
              htmlFor="title"
            >
              project title
            </label>
            <input
              id="title"
              name="title"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              className="rounded-md border border-[#cbc0ff] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5a3cf4] focus:ring-opacity-50"
              placeholder="new case study"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-xs uppercase tracking-wide text-[#333333]"
              htmlFor="summary"
            >
              summary
            </label>
            <input
              id="summary"
              name="summary"
              value={newProjectSummary}
              onChange={(e) => setNewProjectSummary(e.target.value)}
              className="w-64 rounded-md border border-[#cbc0ff] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5a3cf4] focus:ring-opacity-50"
              placeholder="brief description"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating || !newProjectTitle.trim()}
            className="rounded-full bg-[#5a3cf4] px-4 py-2 text-sm text-white hover:bg-[#4a2ce3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? 'creating...' : 'create project'}
          </button>
        </form>

        <ul className="grid gap-4">
          {projects.map((project) => (
            <li
              key={project.id}
              className="rounded-2xl border border-[#cbc0ff] px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium lowercase text-[#1a1a1a]">
                    {project.title}
                  </h2>
                  {project.summary && (
                    <p className="text-sm text-[#333333]">{project.summary}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        project.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {project.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {project.blocks.length} blocks
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 text-sm lowercase text-[#5a3cf4]">
                  <Link
                    to={`/case-studies/${project.id}/edit`}
                    className="underline hover:text-[#4a2ce3] transition-colors"
                  >
                    open editor
                  </Link>
                  {project.status === 'published' && (
                    <Link
                      to={`/case-studies/${project.id}/view`}
                      className="underline hover:text-[#4a2ce3] transition-colors"
                    >
                      view public page
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {projects.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No case studies yet. Create your first one above!</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default CaseStudyPage;