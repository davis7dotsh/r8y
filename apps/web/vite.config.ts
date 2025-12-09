import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
	ssr: {
		// Bundle all dependencies for a self-contained build
		noExternal: ['effect', '@effect/platform-bun', '@effect/cluster', '@effect/workflow', 'zod', 'runed', 'mode-watcher']
	}
});
