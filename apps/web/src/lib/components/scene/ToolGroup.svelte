<script lang="ts">
  import { slide } from 'svelte/transition';

  // Props
  export let label: string;
  export let icon: string = '';
  export let expanded: boolean = true;
  export let hasActiveTool: boolean = false;

  function toggleExpanded() {
    expanded = !expanded;
  }
</script>

<div class="tool-group">
  <button
    class="group-header"
    class:has-active={hasActiveTool}
    on:click={toggleExpanded}
    aria-expanded={expanded}
  >
    {#if icon}
      <span class="group-icon">{icon}</span>
    {/if}
    <span class="group-label">{label}</span>
    <span class="expand-icon" class:expanded>{expanded ? '▼' : '▶'}</span>
  </button>

  {#if expanded}
    <div class="group-tools" transition:slide={{ duration: 150 }}>
      <slot />
    </div>
  {/if}
</div>

<style>
  .tool-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 0.25rem;
  }

  .group-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.5rem;
    background-color: rgba(255, 255, 255, 0.05);
    border: none;
    border-radius: 0.25rem;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.15s ease;
    width: 100%;
    text-align: left;
  }

  .group-header:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }

  .group-header.has-active {
    background-color: rgba(59, 130, 246, 0.2);
    color: #93c5fd;
  }

  .group-icon {
    font-size: 0.875rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .group-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex: 1;
  }

  .expand-icon {
    font-size: 0.625rem;
    opacity: 0.6;
    transition: transform 0.15s ease;
  }

  .group-tools {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding-left: 0.75rem;
    padding-top: 0.25rem;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    margin-left: 0.5rem;
  }
</style>
