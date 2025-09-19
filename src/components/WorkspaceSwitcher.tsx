import React from 'react';
import { useAuth } from '../context/AuthContext';

export const WorkspaceSwitcher: React.FC = () => {
  const { workspaces, activeWorkspaceId, switchWorkspace } = useAuth();

  if (!workspaces.length) {
    return null;
  }

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const workspaceId = event.target.value;
    if (workspaceId && workspaceId !== activeWorkspaceId) {
      switchWorkspace(workspaceId).catch((error) => {
        console.error('Failed to switch workspace', error);
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="workspace-selector" className="text-sm font-medium text-gray-600">
        Workspace
      </label>
      <select
        id="workspace-selector"
        value={activeWorkspaceId ?? ''}
        onChange={handleChange}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
      >
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name} ({workspace.role.toLowerCase()})
          </option>
        ))}
      </select>
    </div>
  );
};

export default WorkspaceSwitcher;
