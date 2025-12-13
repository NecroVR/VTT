<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CompendiumEntry } from '@vtt/shared';
  import CompendiumEntryCard from './CompendiumEntryCard.svelte';
  import EntityImage from '../common/EntityImage.svelte';

  export let entries: CompendiumEntry[];
  export let selectedEntryId: string | null = null;
  export let loading: boolean = false;
  export let viewMode: 'grid' | 'list' = 'grid';
  export let searchQuery: string = '';

  const dispatch = createEventDispatcher<{
    select: CompendiumEntry;
    instantiate: CompendiumEntry;
  }>();

  // Filter entries based on search query
  $: filteredEntries = searchQuery
    ? entries.filter((entry) => {
        const query = searchQuery.toLowerCase();
        return (
          entry.name.toLowerCase().includes(query) ||
          entry.searchText?.toLowerCase().includes(query) ||
          entry.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      })
    : entries;

  function handleEntryClick(event: CustomEvent<CompendiumEntry>) {
    dispatch('select', event.detail);
  }

  function handleEntryInstantiate(event: CustomEvent<CompendiumEntry>) {
    dispatch('instantiate', event.detail);
  }
</script>

<div class="entry-list">
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading entries...</p>
    </div>
  {:else if filteredEntries.length === 0}
    <div class="empty-state">
      {#if searchQuery}
        <p>No entries match your search</p>
        <p class="hint">Try a different search term</p>
      {:else}
        <p>This compendium is empty</p>
        <p class="hint">Add entries to get started</p>
      {/if}
    </div>
  {:else if viewMode === 'grid'}
    <div class="entries-grid">
      {#each filteredEntries as entry (entry.id)}
        <CompendiumEntryCard
          {entry}
          selected={selectedEntryId === entry.id}
          draggable={true}
          on:click={handleEntryClick}
          on:instantiate={handleEntryInstantiate}
        />
      {/each}
    </div>
  {:else}
    <div class="entries-list">
      {#each filteredEntries as entry (entry.id)}
        <div
          class="entry-row"
          class:selected={selectedEntryId === entry.id}
          on:click={() => dispatch('select', entry)}
          on:keydown={(e) => e.key === 'Enter' && dispatch('select', entry)}
          role="button"
          tabindex="0"
        >
          <div class="row-thumbnail">
            <EntityImage
              src={entry.img}
              alt={entry.name}
              entityType={entry.entityType}
              size="medium"
            />
          </div>
          <div class="row-info">
            <div class="row-name">{entry.name}</div>
            <div class="row-meta">
              {entry.entityType}
              {#if entry.tags && entry.tags.length > 0}
                • {entry.tags.join(', ')}
              {/if}
            </div>
          </div>
          <button
            class="row-action"
            on:click|stopPropagation={() => dispatch('instantiate', entry)}
            title="Add to Game"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .entry-list {
    height: 100%;
    overflow-y: auto;
    padding: 1rem;
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
    color: var(--color-text-secondary, #888);
  }

  .empty-state .hint {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #666);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--color-border, #333);
    border-top-color: #4a90e2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .entries-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .entries-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .entry-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background-color: var(--color-bg-secondary, #1e1e1e);
  }

  .entry-row:hover {
    border-color: #4a90e2;
    background-color: rgba(74, 144, 226, 0.05);
  }

  .entry-row.selected {
    border-color: #4a90e2;
    background-color: rgba(74, 144, 226, 0.1);
  }

  .row-thumbnail {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: 4px;
    overflow: hidden;
    background-color: var(--color-bg-primary, #121212);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .row-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .row-icon {
    font-size: 1.5rem;
  }

  .row-info {
    flex: 1;
    min-width: 0;
  }

  .row-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary, #ffffff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .row-meta {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #888);
    margin-top: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .row-action {
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
    opacity: 0;
  }

  .entry-row:hover .row-action {
    opacity: 1;
  }

  .row-action:hover {
    background-color: #357abd;
  }

  .row-action svg {
    width: 100%;
    height: 100%;
  }
</style>
