<script lang="ts">
	import { goto } from '$app/navigation';
	import { getAuthStore } from '$lib/stores/AuthStore.svelte.js';
	import RootLoader from '$lib/components/RootLoader.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	const authStore = getAuthStore();

	let authPassword = $state('');

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();
		const result = await authStore.handleSignIn(authPassword);
		if (!result) {
			alert('Failed to sign in');
			return;
		}
		goto('/app');
	};
</script>

<svelte:head>
	<title>r8y 3.0 - YouTube Channel Analytics & Sponsor Tracking</title>
	<meta
		name="description"
		content="Track YouTube channel analytics, monitor sponsors, and analyze video performance across your channels."
	/>
</svelte:head>

{#if authStore.isLoading}
	<RootLoader />
{:else if authStore.isAuthenticated}
	<main class="flex min-h-screen w-full grow flex-col items-center justify-center">
		<div class="flex flex-col items-center gap-6 text-center">
			<div class="space-y-2">
				<h1 class="text-4xl font-bold text-foreground">r8y 3.0</h1>
				<p class="text-muted-foreground">YouTube channel analytics and sponsor tracking</p>
			</div>
			<Button href="/app" size="lg">Go to Dashboard</Button>
		</div>
	</main>
{:else}
	<main class="flex min-h-screen w-full grow flex-col items-center justify-center p-4">
		<div class="w-full max-w-sm space-y-8">
			<div class="space-y-2 text-center">
				<h1 class="text-3xl font-bold text-foreground">r8y 3.0</h1>
				<p class="text-sm text-muted-foreground">Sign in to access your dashboard</p>
			</div>
			<form class="space-y-4" onsubmit={handleSubmit}>
				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input
						type="password"
						id="password"
						placeholder="Enter your password"
						bind:value={authPassword}
						class="w-full"
					/>
				</div>
				<Button type="submit" class="w-full">Sign in</Button>
			</form>
		</div>
	</main>
{/if}
