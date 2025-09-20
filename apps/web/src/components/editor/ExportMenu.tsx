import { $, component$, useSignal } from '@builder.io/qwik';
import type { ProjectT, TemplateT } from '@portfolioforge/schemas';
import { exportPdf, publishProject } from '../../lib/api.js';

export type ExportMenuProps = {
  project: ProjectT;
  template?: TemplateT;
};

export const ExportMenu = component$<ExportMenuProps>(({ project, template }) => {
  const publishing = useSignal(false);
  const exporting = useSignal(false);
  const publishedUrl = useSignal(
    project.status === 'published' ? `https://portfolioforge.dev/projects/${project.id}` : ''
  );

  const handlePublish = $(async () => {
    try {
      publishing.value = true;
      const result = await publishProject(project.id);
      publishedUrl.value = result.url;
      alert(`Project published: ${result.url}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'unable to publish');
    } finally {
      publishing.value = false;
    }
  });

  const handleExport = $(async () => {
    try {
      exporting.value = true;
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
      exporting.value = false;
    }
  });

  return (
    <section class="grid gap-3 rounded-2xl border border-[#cbc0ff] px-4 py-4 text-sm text-[#1a1a1a]">
      <h3 class="text-sm font-medium lowercase text-[#1a1a1a]">publish & export</h3>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-full bg-[#5a3cf4] px-4 py-2 text-sm text-white disabled:opacity-60"
          onClick$={handlePublish}
          disabled={publishing.value}
        >
          Publish Project
        </button>
        <button
          type="button"
          class="rounded-full border border-[#cbc0ff] px-4 py-2 text-sm lowercase text-[#1a1a1a] transition hover:bg-[#cbc0ff] disabled:opacity-60"
          onClick$={handleExport}
          disabled={exporting.value}
        >
          Export PDF
        </button>
      </div>
      {publishedUrl.value && (
        <p class="text-xs lowercase text-[#5a3cf4]">
          public url: <a href={publishedUrl.value}>{publishedUrl.value}</a>
        </p>
      )}
    </section>
  );
});
