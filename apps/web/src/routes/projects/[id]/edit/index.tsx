import { component$ } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { qwikify$ } from '@builder.io/qwik-react';
import { getProject, listTemplates, recommendTemplates } from '../../../../lib/api.js';
import type { ProjectT, TemplateT } from '@portfolioforge/schemas';
import { ProjectEditor } from '../../../../components/editor/ProjectEditor.js';

const ProjectEditorIsland = qwikify$(ProjectEditor, { eagerness: 'load' });

export const useProject = routeLoader$(async ({ params }) => {
  const project = await getProject(params.id);
  return project satisfies ProjectT;
});

export const useTemplates = routeLoader$(async ({ params }) => {
  const templates = await listTemplates();
  const recommended = await recommendTemplates(params.id).catch(() => [] as TemplateT[]);
  const combined = [...recommended, ...templates.filter((template) => !recommended.some((item) => item.id === template.id))];
  return combined satisfies TemplateT[];
});

export default component$(() => {
  const project = useProject();
  const templates = useTemplates();

  return (
    <div class="grid gap-6">
      <ProjectEditorIsland project={project.value} templates={templates.value} />
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const project = resolveValue(useProject);
  return {
    title: `${project.title} • edit`,
    meta: [
      {
        name: 'description',
        content: project.summary ?? 'Edit project blocks and publish.',
      },
    ],
  };
};
