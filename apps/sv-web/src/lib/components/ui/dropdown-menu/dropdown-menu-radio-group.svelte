<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		value = $bindable(),
		...restProps
	}: DropdownMenuPrimitive.RadioGroupProps = $props();

	// Handle value prop to avoid exactOptionalPropertyTypes issues
	$effect(() => {
		if (value !== undefined) {
			// Value is handled via bind:value
		}
	});
</script>

<DropdownMenuPrimitive.RadioGroup
	bind:ref
	bind:value
	data-slot="dropdown-menu-radio-group"
	{...restProps as any}
/>
