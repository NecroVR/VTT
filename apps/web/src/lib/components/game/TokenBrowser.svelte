<script lang="ts">
  import { onMount } from 'svelte';
  import { actorsStore } from '$lib/stores/actors';
  import type { Actor } from '@vtt/shared';

  // Props
  export let gameId: string;
  export let isGM: boolean = false;

  // State
  let searchFilter = '';
  let filteredActors: Actor[] = [];

  // Subscribe to actors store
  $: {
    const actorsList = Array.from($actorsStore.actors.values());

    // Filter actors based on search
    if (searchFilter.trim()) {
      const searchLower = searchFilter.toLowerCase();
      filteredActors = actorsList.filter(actor =>
        actor.name.toLowerCase().includes(searchLower)
      );
    } else {
      filteredActors = actorsList;
    }
  }

  onMount(async () => {
    // Load actors for the current game
    await actorsStore.loadActors(gameId);
  });

  /**
   * Handle drag start for an actor item
   */
  function handleDragStart(event: DragEvent, actor: Actor) {
    if (!event.dataTransfer) return;

    // Set drag effect
    event.dataTransfer.effectAllowed = 'copy';

    // Prepare token creation data
    const tokenData = {
      actorId: actor.id,
      name: actor.name,
      imageUrl: actor.img || null,
      width: 1,
      height: 1,
      visible: true
    };

    // Set data transfer
    event.dataTransfer.setData('application/json', JSON.stringify(tokenData));
    event.dataTransfer.setData('text/plain', actor.name);

    console.log('[TokenBrowser] Drag started for actor:', actor.name, tokenData);
  }

  /**
   * Get initials from actor name for placeholder avatar
   */
  function getInitials(name: string): string {
    return name.charAt(0).toUpperCase();
  }
</script>

<div class="token-browser">
  <div class="browser-header">
    <h3>Token Browser</h3>
  </div>

  <div class="search-container">
    <input
      type="text"
      bind:value={searchFilter}
      placeholder="Search actors..."
      class="search-input"
    />
  </div>

  <div class="actors-container">
    {#if $actorsStore.loading}
      <div class="loading-message">
        <p>Loading actors...</p>
      </div>
    {:else if $actorsStore.error}
      <div class="error-message">
        <p>Error: {$actorsStore.error}</p>
      </div>
    {:else if filteredActors.length === 0}
      <div class="no-actors">
        {#if searchFilter.trim()}
          <p>No actors found matching "{searchFilter}"</p>
        {:else}
          <p>No actors available.</p>
          {#if isGM}
            <p class="hint">Create actors to add them to scenes.</p>
          {/if}
        {/if}
      </div>
    {:else}
      {#each filteredActors as actor (actor.id)}
        <div
          class="actor-item"
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, actor)}
        >
          <div class="actor-thumbnail">
            {#if actor.img}
              <img src={actor.img} alt={actor.name} />
            {:else}
              <div class="actor-placeholder">
                {getInitials(actor.name)}
              </div>
            {/if}
          </div>
          <div class="actor-info">
            <span class="actor-name">{actor.name}</span>
            <span class="actor-type">{actor.actorType}</span>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .token-browser {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #1f2937;
    border-left: 1px solid #374151;
  }

  .browser-header {
    padding: 1rem;
    border-bottom: 1px solid #374151;
    background-color: #111827;
  }

  .browser-header h3 {
    margin: 0;
    color: #f9fafb;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .search-container {
    padding: 0.75rem;
    border-bottom: 1px solid #374151;
    background-color: #111827;
  }

  .search-input {
    width: 100%;
    background-color: #374151;
    border: 1px solid #4b5563;
    border-radius: 0.375rem;
    padding: 0.5rem;
    color: #f9fafb;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.2s, background-color 0.2s;
  }

  .search-input:focus {
    border-color: #60a5fa;
    background-color: #1f2937;
  }

  .search-input::placeholder {
    color: #6b7280;
  }

  .actors-container {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .actors-container::-webkit-scrollbar {
    width: 8px;
  }

  .actors-container::-webkit-scrollbar-track {
    background: #1f2937;
  }

  .actors-container::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
  }

  .actors-container::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }

  .actor-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background-color: #1f2937;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    cursor: grab;
    transition: background-color 0.2s, border-color 0.2s;
  }

  .actor-item:hover {
    background-color: #374151;
    border-color: #60a5fa;
  }

  .actor-item:active {
    cursor: grabbing;
  }

  .actor-thumbnail {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    background-color: #374151;
    border: 1px solid #4b5563;
  }

  .actor-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .actor-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #3b82f6;
    color: #ffffff;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .actor-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }

  .actor-name {
    color: #d1d5db;
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .actor-type {
    color: #9ca3af;
    font-size: 0.75rem;
    text-transform: capitalize;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .loading-message,
  .error-message,
  .no-actors {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: #9ca3af;
    text-align: center;
  }

  .error-message {
    color: #ef4444;
  }

  .loading-message p,
  .error-message p,
  .no-actors p {
    margin: 0.5rem 0;
  }

  .hint {
    font-size: 0.875rem;
    color: #6b7280;
  }
</style>
