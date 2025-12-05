<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { actorsStore } from '$lib/stores/actors';
  import { tokensStore } from '$lib/stores/tokens';
  import type { Actor, Token } from '@vtt/shared';
  import { API_BASE_URL } from '$lib/config/api';
  import { browser } from '$app/environment';

  // Props
  export let gameId: string;
  export let isGM: boolean = false;
  export let currentSceneId: string | null = null;

  const dispatch = createEventDispatcher();

  // State
  let searchFilter = '';
  let filteredActors: Actor[] = [];
  let templatesExpanded = true;
  let instancesExpanded = true;
  let confirmDeleteId: string | null = null;

  // Subscribe to stores
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

  // Get scene instances grouped by actor
  $: sceneInstances = getSceneInstances($tokensStore.tokens, currentSceneId);

  function getSceneInstances(tokensMap: Map<string, Token>, sceneId: string | null) {
    if (!sceneId) return new Map<string, Token[]>();

    const instances = new Map<string, Token[]>();
    const tokensList = Array.from(tokensMap.values());

    // Filter tokens in current scene and group by actorId
    tokensList
      .filter(token => token.sceneId === sceneId && token.actorId)
      .forEach(token => {
        const actorId = token.actorId!;
        if (!instances.has(actorId)) {
          instances.set(actorId, []);
        }
        instances.get(actorId)!.push(token);
      });

    return instances;
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

    event.dataTransfer.effectAllowed = 'copy';

    const tokenData = {
      actorId: actor.id,
      name: actor.name,
      imageUrl: actor.img || null,
      width: 1,
      height: 1,
      visible: true
    };

    event.dataTransfer.setData('application/json', JSON.stringify(tokenData));
    event.dataTransfer.setData('text/plain', actor.name);

    console.log('[ActorManager] Drag started for actor:', actor.name, tokenData);
  }

  /**
   * Get initials from actor name for placeholder avatar
   */
  function getInitials(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  /**
   * Create a new actor
   */
  async function handleCreateActor() {
    dispatch('create-actor');
  }

  /**
   * Edit an actor
   */
  function handleEditActor(actor: Actor) {
    dispatch('edit-actor', { actorId: actor.id });
  }

  /**
   * Show delete confirmation
   */
  function showDeleteConfirm(actorId: string) {
    confirmDeleteId = actorId;
  }

  /**
   * Cancel delete
   */
  function cancelDelete() {
    confirmDeleteId = null;
  }

  /**
   * Delete an actor
   */
  async function handleDeleteActor(actorId: string) {
    if (!browser) return;

    try {
      const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/actors/${actorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete actor: ${response.statusText}`);
      }

      // Remove from store
      actorsStore.removeActor(actorId);
      confirmDeleteId = null;
    } catch (error) {
      console.error('Error deleting actor:', error);
      alert('Failed to delete actor. Please try again.');
    }
  }

  /**
   * Select a token on the canvas
   */
  function handleSelectToken(tokenId: string) {
    tokensStore.selectToken(tokenId);
    dispatch('select-token', { tokenId });
  }

  /**
   * Get actor by ID
   */
  function getActor(actorId: string): Actor | undefined {
    return $actorsStore.actors.get(actorId);
  }

  /**
   * Toggle section expansion
   */
  function toggleTemplates() {
    templatesExpanded = !templatesExpanded;
  }

  function toggleInstances() {
    instancesExpanded = !instancesExpanded;
  }
</script>

<div class="actor-manager">
  <div class="manager-header">
    <h3>Actor Manager</h3>
  </div>

  <!-- Actor Templates Section -->
  <div class="section">
    <button class="section-header" on:click={toggleTemplates} type="button">
      <span class="chevron" class:expanded={templatesExpanded}>▶</span>
      <span class="section-title">Actor Library</span>
    </button>

    {#if templatesExpanded}
      <div class="section-content">
        <!-- Search -->
        <div class="search-container">
          <input
            type="text"
            bind:value={searchFilter}
            placeholder="Search actors..."
            class="search-input"
          />
        </div>

        <!-- Create New Actor Button (GM only) -->
        {#if isGM}
          <div class="action-container">
            <button class="create-btn" on:click={handleCreateActor} type="button">
              <span class="plus-icon">+</span>
              Create New Actor
            </button>
          </div>
        {/if}

        <!-- Actors List -->
        <div class="actors-container">
          {#if $actorsStore.loading}
            <div class="status-message">
              <p>Loading actors...</p>
            </div>
          {:else if $actorsStore.error}
            <div class="error-message">
              <p>Error: {$actorsStore.error}</p>
            </div>
          {:else if filteredActors.length === 0}
            <div class="empty-message">
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
              <div class="actor-item-wrapper">
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

                <!-- Action Buttons (GM only) -->
                {#if isGM}
                  <div class="actor-actions">
                    <button
                      class="action-btn edit-btn"
                      on:click={() => handleEditActor(actor)}
                      title="Edit Actor"
                      type="button"
                    >
                      ✎
                    </button>
                    {#if confirmDeleteId === actor.id}
                      <div class="confirm-delete">
                        <button
                          class="action-btn confirm-btn"
                          on:click={() => handleDeleteActor(actor.id)}
                          title="Confirm Delete"
                          type="button"
                        >
                          ✓
                        </button>
                        <button
                          class="action-btn cancel-btn"
                          on:click={cancelDelete}
                          title="Cancel"
                          type="button"
                        >
                          ✗
                        </button>
                      </div>
                    {:else}
                      <button
                        class="action-btn delete-btn"
                        on:click={() => showDeleteConfirm(actor.id)}
                        title="Delete Actor"
                        type="button"
                      >
                        🗑
                      </button>
                    {/if}
                  </div>
                {/if}
              </div>
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Scene Instances Section -->
  <div class="section">
    <button class="section-header" on:click={toggleInstances} type="button">
      <span class="chevron" class:expanded={instancesExpanded}>▶</span>
      <span class="section-title">Scene Instances</span>
    </button>

    {#if instancesExpanded}
      <div class="section-content">
        <div class="instances-container">
          {#if !currentSceneId}
            <div class="empty-message">
              <p>No scene selected</p>
            </div>
          {:else if sceneInstances.size === 0}
            <div class="empty-message">
              <p>No actor instances in this scene</p>
              <p class="hint">Drag actors from the library to add them to the scene</p>
            </div>
          {:else}
            {#each Array.from(sceneInstances.entries()) as [actorId, tokens]}
              {@const actor = getActor(actorId)}
              {#if actor}
                <div class="instance-group">
                  <div class="instance-header">
                    <div class="actor-thumbnail small">
                      {#if actor.img}
                        <img src={actor.img} alt={actor.name} />
                      {:else}
                        <div class="actor-placeholder">
                          {getInitials(actor.name)}
                        </div>
                      {/if}
                    </div>
                    <div class="instance-info">
                      <span class="instance-name">{actor.name}</span>
                      <span class="instance-count">{tokens.length} instance{tokens.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div class="instance-tokens">
                    {#each tokens as token}
                      <button
                        class="token-item"
                        on:click={() => handleSelectToken(token.id)}
                        class:selected={$tokensStore.selectedTokenId === token.id}
                        type="button"
                      >
                        <span class="token-name">{token.name}</span>
                        <span class="token-position">({Math.round(token.x)}, {Math.round(token.y)})</span>
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}
            {/each}
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .actor-manager {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #1f2937;
    border-left: 1px solid #374151;
  }

  .manager-header {
    padding: 1rem;
    border-bottom: 1px solid #374151;
    background-color: #111827;
  }

  .manager-header h3 {
    margin: 0;
    color: #f9fafb;
    font-size: 1.125rem;
    font-weight: 600;
  }

  /* Section Styles */
  .section {
    border-bottom: 1px solid #374151;
  }

  .section-header {
    width: 100%;
    padding: 0.75rem 1rem;
    background-color: #111827;
    border: none;
    color: #f9fafb;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background-color 0.2s;
  }

  .section-header:hover {
    background-color: #1f2937;
  }

  .chevron {
    color: #9ca3af;
    font-size: 0.75rem;
    transition: transform 0.2s;
    display: inline-block;
  }

  .chevron.expanded {
    transform: rotate(90deg);
  }

  .section-title {
    flex: 1;
  }

  .section-content {
    display: flex;
    flex-direction: column;
  }

  /* Search Styles */
  .search-container {
    padding: 0.75rem;
    border-bottom: 1px solid #374151;
    background-color: #1f2937;
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

  /* Action Container */
  .action-container {
    padding: 0.75rem;
    border-bottom: 1px solid #374151;
    background-color: #1f2937;
  }

  .create-btn {
    width: 100%;
    padding: 0.625rem 1rem;
    background-color: #3b82f6;
    border: none;
    border-radius: 0.375rem;
    color: #ffffff;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .create-btn:hover {
    background-color: #2563eb;
  }

  .plus-icon {
    font-size: 1.125rem;
    font-weight: 600;
  }

  /* Actors Container */
  .actors-container {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 400px;
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

  /* Actor Item */
  .actor-item-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #1f2937;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    padding: 0.5rem;
    transition: background-color 0.2s, border-color 0.2s;
  }

  .actor-item-wrapper:hover {
    background-color: #374151;
    border-color: #60a5fa;
  }

  .actor-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    cursor: grab;
    min-width: 0;
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

  .actor-thumbnail.small {
    width: 24px;
    height: 24px;
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

  /* Actor Actions */
  .actor-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .action-btn {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    transition: background-color 0.2s, color 0.2s;
  }

  .edit-btn {
    background-color: #4b5563;
    color: #d1d5db;
  }

  .edit-btn:hover {
    background-color: #6b7280;
    color: #f9fafb;
  }

  .delete-btn {
    background-color: #4b5563;
    color: #d1d5db;
  }

  .delete-btn:hover {
    background-color: #dc2626;
    color: #ffffff;
  }

  .confirm-delete {
    display: flex;
    gap: 0.25rem;
  }

  .confirm-btn {
    background-color: #dc2626;
    color: #ffffff;
  }

  .confirm-btn:hover {
    background-color: #b91c1c;
  }

  .cancel-btn {
    background-color: #4b5563;
    color: #d1d5db;
  }

  .cancel-btn:hover {
    background-color: #6b7280;
    color: #f9fafb;
  }

  /* Status Messages */
  .status-message,
  .error-message,
  .empty-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    color: #9ca3af;
    text-align: center;
  }

  .error-message {
    color: #ef4444;
  }

  .status-message p,
  .error-message p,
  .empty-message p {
    margin: 0.25rem 0;
    font-size: 0.875rem;
  }

  .hint {
    font-size: 0.75rem;
    color: #6b7280;
  }

  /* Instances Container */
  .instances-container {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 300px;
  }

  .instances-container::-webkit-scrollbar {
    width: 8px;
  }

  .instances-container::-webkit-scrollbar-track {
    background: #1f2937;
  }

  .instances-container::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
  }

  .instances-container::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }

  /* Instance Group */
  .instance-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background-color: #1f2937;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    padding: 0.75rem;
  }

  .instance-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .instance-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }

  .instance-name {
    color: #d1d5db;
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .instance-count {
    color: #9ca3af;
    font-size: 0.75rem;
  }

  .instance-tokens {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding-left: 2rem;
  }

  .token-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.375rem 0.5rem;
    background-color: #374151;
    border: 1px solid #4b5563;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s;
    color: #d1d5db;
    font-size: 0.8125rem;
    text-align: left;
  }

  .token-item:hover {
    background-color: #4b5563;
    border-color: #60a5fa;
  }

  .token-item.selected {
    background-color: #1e40af;
    border-color: #3b82f6;
    color: #ffffff;
  }

  .token-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .token-position {
    color: #9ca3af;
    font-size: 0.75rem;
    margin-left: 0.5rem;
    flex-shrink: 0;
  }

  .token-item.selected .token-position {
    color: #93c5fd;
  }
</style>
