<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CompendiumEntry, CompendiumEntityType } from '@vtt/shared';

  export let entry: CompendiumEntry;
  export let selected: boolean = false;
  export let draggable: boolean = false;

  const dispatch = createEventDispatcher<{
    click: CompendiumEntry;
    instantiate: CompendiumEntry;
  }>();

  function handleClick() {
    dispatch('click', entry);
  }

  function handleInstantiate(event: MouseEvent) {
    event.stopPropagation();
    dispatch('instantiate', entry);
  }

  function getEntityIcon(type: CompendiumEntityType): string {
    switch (type) {
      case 'Actor':
        return '👤';
      case 'Item':
        return '⚔️';
      case 'JournalEntry':
        return '📖';
      case 'Scene':
        return '🗺️';
      default:
        return '📄';
    }
  }

  function handleDragStart(event: DragEvent) {
    if (!draggable) return;
    event.dataTransfer!.effectAllowed = 'copy';
    event.dataTransfer!.setData('application/json', JSON.stringify({
      type: 'compendium-entry',
      entry: entry,
    }));
  }
</script>

<div
  class="entry-card"
  class:selected
  class:draggable
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
  on:dragstart={handleDragStart}
  draggable={draggable}
  role="button"
  tabindex="0"
>
  <div class="entry-thumbnail">
    {#if entry.img}
      <img src={entry.img} alt={entry.name} />
    {:else}
      <div class="entry-icon">
        {getEntityIcon(entry.entityType)}
      </div>
    {/if}
  </div>
  <div class="entry-info">
    <div class="entry-name" title={entry.name}>
      {entry.name}
    </div>
    <div class="entry-type">
      {entry.entityType}
    </div>
  </div>
  <div class="entry-actions">
    <button
      class="action-button"
      on:click={handleInstantiate}
      title="Add to Game"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  </div>
</div>

<style>
  .entry-card {
    position: relative;
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
    background-color: var(--color-bg-secondary, #1e1e1e);
    display: flex;
    flex-direction: column;
  }

  .entry-card:hover {
    border-color: #4a90e2;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .entry-card.selected {
    border-color: #4a90e2;
    box-shadow: 0 0 0 2px #4a90e2;
  }

  .entry-card.draggable {
    cursor: grab;
  }

  .entry-card.draggable:active {
    cursor: grabbing;
  }

  .entry-thumbnail {
    width: 100%;
    aspect-ratio: 1;
    background-color: var(--color-bg-primary, #121212);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .entry-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .entry-icon {
    font-size: 3rem;
  }

  .entry-info {
    padding: 0.75rem;
    flex: 1;
  }

  .entry-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary, #ffffff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .entry-type {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #888);
    margin-top: 0.25rem;
  }

  .entry-actions {
    padding: 0 0.75rem 0.75rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .entry-card:hover .entry-actions {
    opacity: 1;
  }

  .action-button {
    width: 2rem;
    height: 2rem;
    padding: 0.25rem;
    background-color: #4a90e2;
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-button:hover {
    background-color: #357abd;
  }

  .action-button svg {
    width: 100%;
    height: 100%;
  }
</style>
