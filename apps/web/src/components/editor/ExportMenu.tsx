import { useState } from 'react';
import { Button } from '@portfolioforge/ui';
import { exportPdf, publishProject } from '../../lib/api.js';
import type { ProjectT, TemplateT } from '@portfolioforge/schemas';

export type ExportMenuProps = {
  project: ProjectT;
  template?: TemplateT;
};

export const ExportMenu = ({ project, template }: ExportMenuProps) => {
  const [publishing, setPublishing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState(project.status === 'published' ? `https://portfolioforge.dev/projects/${project.id}` : '');

  const handlePublish = async () => {
    try {
      setPublishing(true);
      const result = await publishProject(project.id);
      setPublishedUrl(result.url);
      alert(`Project published: ${result.url}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'unable to publish');
    } finally {
      setPublishing(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await exportPdf(project.id, template?.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-portfolioforge.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'unable to export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="grid gap-3 rounded-2xl border border-[#cbc0ff] px-4 py-4 text-sm text-[#1a1a1a]">
      <h3 className="text-sm font-medium lowercase text-[#1a1a1a]">publish & export</h3>
      <div className="flex flex-wrap gap-2">
        <Button onClick={handlePublish} disabled={publishing}>
          Publish Project
        </Button>
        <Button variant="ghost" onClick={handleExport} disabled={exporting}>
          Export PDF
        </Button>
      </div>
      {publishedUrl && (
        <p className="text-xs lowercase text-[#5a3cf4]">
          public url: <a href={publishedUrl}>{publishedUrl}</a>
        </p>
      )}
    </section>
  );
};
