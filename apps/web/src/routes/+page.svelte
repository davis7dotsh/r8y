<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';

	let { data, form } = $props();

	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>r8y - YT Analytics & Sponsor Tracking</title>
	<meta
		name="description"
		content="Track YouTube channel analytics, monitor sponsors, and analyze video performance across your channels."
	/>
</svelte:head>

{#if data.isAuthenticated}
	<main class="flex min-h-screen w-full grow flex-col items-center justify-center">
		<div class="flex flex-col items-center gap-6 text-center">
			<div class="space-y-2">
				<h1 class="text-foreground text-4xl font-bold">r8y 3.0</h1>
				<p class="text-muted-foreground">YouTube channel analytics and sponsor tracking</p>
			</div>
			<Button href="/app" size="lg">Go to Dashboard</Button>
		</div>
	</main>
{:else}
	<main class="flex min-h-screen w-full grow flex-col items-center justify-center p-4">
		<div class="w-full max-w-sm space-y-8">
			<div class="space-y-2 text-center">
				<h1 class="text-foreground text-3xl font-bold">r8y 3.0</h1>
				<p class="text-muted-foreground text-sm">Sign in to access your dashboard</p>
			</div>
			<form
				method="POST"
				action="?/signin"
				class="space-y-4"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
					};
				}}
			>
				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input
						type="password"
						id="password"
						name="authPassword"
						placeholder="Enter your password"
						class="w-full"
					/>
				</div>
				{#if form?.error}
					<p class="text-sm text-destructive">{form.error}</p>
				{/if}
				<Button type="submit" class="w-full" disabled={isSubmitting}>
					{#if isSubmitting}
						<Spinner />
					{:else}
						Sign in
					{/if}
				</Button>
			</form>
		</div>
	</main>
{/if}
