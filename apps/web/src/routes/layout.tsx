import { component$, Slot } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';

export default component$(() => {
  return (
    <div class="min-h-screen bg-white text-[#1a1a1a]">
      <header class="border-b border-[#cbc0ff] bg-white">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div class="flex items-center gap-4">
            <Link href="/projects" class="text-xl font-semibold lowercase text-[#5a3cf4]">
              PortfolioForge
            </Link>
            <span class="text-sm text-gray-500">Qwik Editor</span>
          </div>
          <div class="flex items-center gap-6">
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
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center px-3 py-2 border border-[#cbc0ff] rounded-md text-sm font-medium text-[#1a1a1a] bg-white hover:bg-gray-50 transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              React App
            </a>
          </div>
        </div>
      </header>
      <main class="mx-auto max-w-6xl px-4 py-8">
        <Slot />
      </main>
    </div>
  );
});
