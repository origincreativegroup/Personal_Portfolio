import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';

export default component$(() => {
  return (
    <section class="flex flex-col gap-6">
      <h1 class="text-3xl font-semibold lowercase text-[#5a3cf4]">Case study builder</h1>
      <p class="max-w-2xl text-sm text-[#333333]">
        Manage projects from creation through publishing. Use the editor to assemble text, media, timeline, chart, and impact
        blocks, then preview, publish, and export without metaphors.
      </p>
      <Link href="/projects" class="text-sm lowercase text-[#5a3cf4] underline">
        Go to projects
      </Link>
    </section>
  );
});
