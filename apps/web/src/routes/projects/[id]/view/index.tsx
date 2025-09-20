import { component$ } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import type { AnyBlockT, ProjectT, TemplateT } from '@portfolioforge/schemas';
import { getProject, recommendTemplates } from '../../../../lib/api.js';

export const useProject = routeLoader$(async ({ params }) => {
  const project = await getProject(params.id);
  return project satisfies ProjectT;
});

export const useTemplate = routeLoader$(async ({ params }) => {
  const recommended = await recommendTemplates(params.id).catch(() => [] as TemplateT[]);
  return recommended[0] ?? null;
});

export default component$(() => {
  const project = useProject();
  const template = useTemplate();

  return (
    <article class="grid gap-8">
      <header class="grid gap-2 border-b border-[#cbc0ff] pb-6">
        <h1 class="text-3xl font-semibold lowercase text-[#5a3cf4]">{project.value.title}</h1>
        {project.value.summary && <p class="text-base text-[#333333]">{project.value.summary}</p>}
        {template.value && (
          <p class="text-xs uppercase text-[#333333]">template: {template.value.name}</p>
        )}
      </header>
      <section class="grid gap-4">
        {project.value.blocks
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((block) => (
            <div key={block.id} class="rounded-2xl border border-[#cbc0ff] px-5 py-4">
              {renderBlock(block)}
            </div>
          ))}
      </section>
    </article>
  );
});

const renderBlock = (block: AnyBlockT) => {
  switch (block.type) {
    case 'text':
      return (
        <div class="grid gap-2">
          <span class="text-xs uppercase text-[#5a3cf4]">text</span>
          {block.variant === 'heading' ? (
            <h2 class="text-xl font-semibold lowercase text-[#1a1a1a]">{block.content}</h2>
          ) : block.variant === 'quote' ? (
            <blockquote class="border-l-4 border-[#cbc0ff] pl-4 italic text-[#333333]">{block.content}</blockquote>
          ) : (
            <p class="text-sm text-[#333333]">{block.content}</p>
          )}
        </div>
      );
    case 'media':
      return (
        <figure class="grid gap-2">
          <span class="text-xs uppercase text-[#5a3cf4]">media • {block.media.kind}</span>
          <a class="text-sm lowercase text-[#5a3cf4] underline" href={block.media.url}>
            {block.media.url}
          </a>
          {block.caption && <figcaption class="text-xs text-[#333333]">{block.caption}</figcaption>}
        </figure>
      );
    case 'timeline':
      return (
        <ol class="grid gap-2 text-sm text-[#1a1a1a]">
          {block.items.map((item, index) => (
            <li key={`${item.label}-${index}`} class="rounded-xl border border-[#cbc0ff] px-3 py-2">
              <div class="flex justify-between text-xs uppercase text-[#5a3cf4]">
                <span>{item.label}</span>
                <span>
                  {item.start}
                  {item.end ? ` → ${item.end}` : ''}
                </span>
              </div>
              {item.note && <p class="mt-1 text-xs text-[#333333]">{item.note}</p>}
            </li>
          ))}
        </ol>
      );
    case 'chart':
      return (
        <div class="grid gap-2 text-sm text-[#1a1a1a]">
          <span class="text-xs uppercase text-[#5a3cf4]">{block.kind} chart</span>
          <p class="text-xs text-[#333333]">labels: {block.labels.join(', ')}</p>
          <ul class="text-xs text-[#333333]">
            {block.series.map((series) => (
              <li key={series.name}>{series.name}: {series.data.join(', ')}</li>
            ))}
          </ul>
        </div>
      );
    case 'impact':
      return (
        <div class="grid gap-2 text-sm text-[#1a1a1a]">
          <span class="text-xs uppercase text-[#5a3cf4]">impact</span>
          <p><strong>problem:</strong> {block.problem}</p>
          <p><strong>solution:</strong> {block.solution}</p>
          <ul class="list-disc pl-4 text-xs text-[#333333]">
            {block.outcomes.map((outcome, index) => (
              <li key={`${outcome}-${index}`}>{outcome}</li>
            ))}
          </ul>
          {block.metrics && (
            <dl class="grid grid-cols-2 gap-2 text-xs text-[#333333]">
              {Object.entries(block.metrics).map(([name, value]) => (
                <div key={name} class="rounded-md bg-[#cbc0ff] px-2 py-1">
                  <dt class="lowercase">{name}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      );
    default:
      return null;
  }
};

export const head: DocumentHead = ({ resolveValue }) => {
  const project = resolveValue(useProject);
  return {
    title: `${project.title} • project`,
    meta: [
      {
        name: 'description',
        content: project.summary ?? 'PortfolioForge project',
      },
    ],
  };
};
