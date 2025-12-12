<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let groupKey: string | number;
	export let groupLabel: string;
	export let count: number;
	export let isCollapsed = false;

	const dispatch = createEventDispatcher<{ toggle: { groupKey: string | number } }>();

	function handleToggle() {
		dispatch('toggle', { groupKey });
	}
</script>

<div class="collapsible-group">
	<button class="group-header" on:click={handleToggle} type="button">
		<svg
			class="chevron"
			class:collapsed={isCollapsed}
			width="20"
			height="20"
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M7.5 15L12.5 10L7.5 5"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
		<span class="group-label">{groupLabel}</span>
		<span class="group-count">{count}</span>
	</button>

	{#if !isCollapsed}
		<div class="group-content">
			<slot />
		</div>
	{/if}
</div>

<style>
	.collapsible-group {
		margin-bottom: 0.75rem;
	}

	.group-header {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background-color: #1f2937;
		border: 1px solid #374151;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		color: #f9fafb;
		font-size: 0.875rem;
		font-weight: 600;
		text-align: left;
	}

	.group-header:hover {
		background-color: #374151;
		border-color: #4b5563;
	}

	.group-header:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	.chevron {
		flex-shrink: 0;
		color: #9ca3af;
		transition: transform 0.2s ease;
		transform: rotate(90deg);
	}

	.chevron.collapsed {
		transform: rotate(0deg);
	}

	.group-label {
		flex: 1;
		color: #f9fafb;
		font-weight: 600;
	}

	.group-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.5rem;
		height: 1.5rem;
		padding: 0 0.5rem;
		background-color: #374151;
		color: #9ca3af;
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: 9999px;
		line-height: 1;
	}

	.group-content {
		margin-top: 0.5rem;
		padding-left: 0.5rem;
		animation: slideDown 0.2s ease;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-0.5rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
