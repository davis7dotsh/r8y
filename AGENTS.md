# Repository Guide for Agents

## Commands

- **Build:** `turbo run build` (or `bunx --bun vite build` in apps)
- **Lint:** `turbo run lint` (uses Prettier)
- **Check Types:** `bun check` (or `turbo run check`)
- **Test:** DO NOT add unit tests unless explicitly asked. No standard test command.

## Tech Stack & Style

- **Stack:** TypeScript, Svelte 5 (Runes), Tailwind CSS v4, Bun, Drizzle ORM.
- **Styling:** Tailwind v4. Use `clsx` or `tailwind-merge` if needed.
- **Icons:** Import from `@lucide/svelte`.

## Svelte 5 Conventions

- **Reactivity:** Use Runes! `$state`, `$derived`, `$effect`. NO `$:`.
- **Props:** Use `let { prop } = $props();` instead of `export let prop`.
- **Events:** Use `onclick={handler}` instead of `on:click`.
- **Snippets:** Use `{#snippet}` and `{@render}` instead of `<slot>`.
- **Async:** Use `<svelte:boundary>` and `{#await}`.
- **Data:** Use remote functions (`*.remote.ts`) for data fetching.

## General Rules

- **Conciseness:** Be extremely concise.
- **Types:** Do NOT write explicit return types unless necessary.
- **Files:** `apps/sv-web` (SvelteKit), `apps/bun-worker`, `packages/db`.

## Effect Solutions Usage

The Effect Solutions CLI provides curated best practices and patterns for Effect TypeScript. Before working on Effect code, check if there's a relevant topic that covers your use case.

- `effect-solutions list` - List all available topics
- `effect-solutions show <slug...>` - Read one or more topics
- `effect-solutions search <term>` - Search topics by keyword

**Local Effect Source:** The Effect repository is cloned to `~/.local/share/effect-solutions/effect` for reference. Use this to explore APIs, find usage examples, and understand implementation details when the documentation isn't enough.
