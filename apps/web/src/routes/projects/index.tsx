import { component$ } from '@builder.io/qwik';
import { routeLoader$, Link, Form, z, zod$ } from '@builder.io/qwik-city';
import { createProject, listProjects } from '../../lib/api.js';
import type { ProjectT } from '@portfolioforge/schemas';

export const useProjects = routeLoader$(async () => {
  const projects = await listProjects();
  return projects satisfies ProjectT[];
});

export const useCreateProject = zod$(z.object({
  title: z.string().min(3),
  summary: z.string().optional(),
}));

export default component$(() => {
  const projects = useProjects();

  return (
    <section class="flex flex-col gap-8">
      <header class="flex flex-col gap-2">
        <h1 class="text-2xl font-semibold lowercase text-[#5a3cf4]">Projects</h1>
        <p class="text-sm text-[#333333]">Create a project, then open the editor to add blocks and publish.</p>
      </header>

      <Form action={async (values, requestEvent) => {
        await createProject({ title: values.title, summary: values.summary });
        await requestEvent.redirect(302, '/projects');
      }} class="flex items-end gap-4 rounded-2xl border border-[#cbc0ff] px-4 py-4">
        <div class="flex flex-col gap-2">
          <label class="text-xs uppercase tracking-wide text-[#333333]" for="title">
            project title
          </label>
          <input
            id="title"
            name="title"
            class="rounded-md border border-[#cbc0ff] px-3 py-2 text-sm"
            placeholder="new case study"
            required
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-xs uppercase tracking-wide text-[#333333]" htmlFor="summary">
            summary
          </label>
          <input id="summary" name="summary" class="w-64 rounded-md border border-[#cbc0ff] px-3 py-2 text-sm" />
        </div>
        <button type="submit" class="rounded-full bg-[#5a3cf4] px-4 py-2 text-sm text-white">
          create project
        </button>
      </Form>

      <ul class="grid gap-4">
        {projects.value.map((project) => (
          <li key={project.id} class="rounded-2xl border border-[#cbc0ff] px-5 py-4">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-medium lowercase text-[#1a1a1a]">{project.title}</h2>
                {project.summary && <p class="text-sm text-[#333333]">{project.summary}</p>}
              </div>
              <div class="flex gap-2 text-sm lowercase text-[#5a3cf4]">
                <Link href={`/projects/${project.id}/edit`} class="underline">
                  open editor
                </Link>
                {project.status === 'published' && (
                  <Link href={`/projects/${project.id}/view`} class="underline">
                    view public page
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
});
