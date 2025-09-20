import { component$, Slot } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';

export default component$(() => {
  return (
    <div class="min-h-screen bg-white text-[#1a1a1a]">
      <header class="border-b border-[#cbc0ff] bg-white">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/projects" class="text-xl font-semibold lowercase text-[#5a3cf4]">
            PortfolioForge
          </Link>
          <nav class="flex gap-6 text-sm lowercase text-[#1a1a1a]">
            <Link href="/projects/new" class="hover:text-[#5a3cf4]">
              New Projects
            </Link>
            <Link href="/templates" class="hover:text-[#5a3cf4]">
              Templates
            </Link>
            <Link href="/projects/published" class="hover:text-[#5a3cf4]">
              Published Projects
            </Link>
            <Link href="/updates" class="hover:text-[#5a3cf4]">
              Updates
            </Link>
          </nav>
        </div>
      </header>
      <main class="mx-auto max-w-6xl px-4 py-8">
        <Slot />
      </main>
    </div>
  );
});
