<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { remoteSignIn } from '$lib/remote/auth.remote.js';
	import { getAuthStore } from '$lib/stores/AuthStore.svelte';

	const authStore = getAuthStore();

	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
</script>

{#if authStore.isAuthenticated}
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
				class="space-y-4"
				{...remoteSignIn.enhance(async ({ submit }) => {
					isSubmitting = true;
					error = null;
					try {
						await submit();
						if (remoteSignIn.result?.success) {
							await goto('/app');
						} else {
							error = 'Invalid password';
						}
					} catch {
						error = 'Sign in failed';
					} finally {
						isSubmitting = false;
					}
				})}
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
				{#if error}
					<p class="text-destructive text-sm">{error}</p>
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
