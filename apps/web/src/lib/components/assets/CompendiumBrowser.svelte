<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import type { FileCompendiumEntry, FileCompendiumType } from '@vtt/shared';
  import { actorsStore } from '$lib/stores/actors';
  import { API_BASE_URL } from '$lib/config/api';

  // Props
  export let systemId: string;
  export let type: FileCompendiumType;
  export let campaignId: string;

  // State
  let entries: FileCompendiumEntry[] = [];
  let loading = false;
  let error: string | null = null;
  let searchQuery = '';
  let selectedCategory = 'all';
  let total = 0;
  let openDropdownId: string | null = null;
  let addingToActor: string | null = null;
  let addSuccess: string | null = null;
  let addError: string | null = null;

  // Get actors from store
  $: actors = Array.from($actorsStore.actors.values());

  // Reactive search/filter
  $: if (browser) {
    loadEntries();
  }

  onMount(() => {
    loadEntries();
  });

  async function loadEntries() {
    if (!browser) return;

    loading = true;
    error = null;

    try {
      const params = new URLSearchParams();

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (selectedCategory && selectedCategory !== 'all') {
        params.append(`filter[category]`, selectedCategory);
      }

      // Load all items at once by setting a very high limit
      params.append('limit', '10000');

      const url = `${API_BASE_URL}/api/v1/compendium/${systemId}/${type}?${params}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch compendium entries: ${response.statusText}`);
      }

      const data = await response.json();
      entries = data.entries || [];
      total = data.total || 0;

    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load compendium entries';
      console.error('Error loading compendium:', err);
    } finally {
      loading = false;
    }
  }

  function toggleDropdown(entryId: string, event: Event) {
    event.stopPropagation();
    openDropdownId = openDropdownId === entryId ? null : entryId;
  }

  function closeDropdown() {
    openDropdownId = null;
  }

  async function addToActor(entry: FileCompendiumEntry, actorId: string) {
    if (!browser) return;

    addingToActor = entry.id;
    addError = null;
    addSuccess = null;
    closeDropdown();

    try {
      const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/actors/${actorId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromCompendium: {
            systemId,
            type,
            entryId: entry.id,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Failed to add item to actor');
      }

      addSuccess = `Added ${entry.name} to actor`;
      setTimeout(() => {
        addSuccess = null;
      }, 3000);

    } catch (err) {
      addError = err instanceof Error ? err.message : 'Failed to add item to actor';
      console.error('Error adding item to actor:', err);
      setTimeout(() => {
        addError = null;
      }, 5000);
    } finally {
      addingToActor = null;
    }
  }

  function getEntrySubtitle(entry: FileCompendiumEntry): string {
    if (!entry.data) return '';

    const parts: string[] = [];

    // Type-specific subtitle information
    if (type === 'items' || type === 'spells') {
      if (entry.data.weaponType) parts.push(String(entry.data.weaponType).replace(/-/g, ' '));
      if (entry.data.damage && entry.data.damageType) {
        parts.push(`${entry.data.damage} ${entry.data.damageType}`);
      }
      if (entry.data.level !== undefined) {
        const level = entry.data.level;
        parts.push(level === '0' || level === 0 ? 'Cantrip' : `Level ${level}`);
      }
      if (entry.data.school) parts.push(String(entry.data.school));
    }

    return parts.join(' | ');
  }

  function truncateDescription(description: string | undefined, maxLength: number = 100): string {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  }
</script>

<svelte:window on:click={closeDropdown} />

<div class="compendium-browser">
  <!-- Success/Error Messages -->
  {#if addSuccess}
    <div class="notification success">
      {addSuccess}
    </div>
  {/if}

  {#if addError}
    <div class="notification error">
      {addError}
    </div>
  {/if}

  <!-- Search and Filters -->
  <div class="browser-toolbar">
    <input
      type="text"
      class="search-input"
      placeholder="Search {type}..."
      bind:value={searchQuery}
    />
  </div>

  <!-- Content -->
  <div class="browser-content">
    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading {type}...</p>
      </div>
    {:else if error}
      <div class="empty-state">
        <p>Error: {error}</p>
        <button class="button-secondary" on:click={loadEntries}>
          Try Again
        </button>
      </div>
    {:else if entries.length === 0}
      <div class="empty-state">
        <p>No {type} found</p>
        {#if searchQuery}
          <p class="empty-hint">Try adjusting your search</p>
        {/if}
      </div>
    {:else}
      <div class="entries-list">
        {#each entries as entry (entry.id)}
          <div class="entry-card">
            <div class="entry-info">
              <div class="entry-name">{entry.name}</div>
              {#if getEntrySubtitle(entry)}
                <div class="entry-subtitle">{getEntrySubtitle(entry)}</div>
              {/if}
              {#if entry.description}
                <div class="entry-description">
                  {truncateDescription(entry.description)}
                </div>
              {/if}
            </div>
            <div class="entry-actions">
              {#if actors.length > 0}
                <div class="dropdown-wrapper">
                  <button
                    class="button-primary"
                    class:loading={addingToActor === entry.id}
                    disabled={addingToActor === entry.id}
                    on:click={(e) => toggleDropdown(entry.id, e)}
                  >
                    {addingToActor === entry.id ? 'Adding...' : 'Add to Actor'}
                    {#if addingToActor !== entry.id}
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M3.5 6.5a.5.5 0 0 1 .5.5L8 11l4-4a.5.5 0 0 1 .707.707l-4.5 4.5a.5.5 0 0 1-.707 0l-4.5-4.5A.5.5 0 0 1 3.5 6.5z"/>
                      </svg>
                    {/if}
                  </button>
                  {#if openDropdownId === entry.id}
                    <div class="actor-dropdown" on:click|stopPropagation>
                      {#each actors as actor}
                        <button
                          class="dropdown-item"
                          on:click={() => addToActor(entry, actor.id)}
                        >
                          {actor.name}
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
              {:else}
                <div class="no-actors-hint">
                  Create an actor to add items
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      {#if total > 0}
        <div class="end-message">
          Showing all {total} {type}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .compendium-browser {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
  }

  .notification {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    z-index: 100;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .notification.success {
    background-color: rgba(74, 222, 128, 0.2);
    color: #4ade80;
    border: 1px solid #4ade80;
  }

  .notification.error {
    background-color: rgba(248, 113, 113, 0.2);
    color: #f87171;
    border: 1px solid #f87171;
  }

  .browser-toolbar {
    display: flex;
    align-items: center;
    padding: 1rem;
    gap: 0.75rem;
    border-bottom: 1px solid #374151;
    background-color: #1f2937;
  }

  .search-input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #4b5563;
    border-radius: 0.375rem;
    background-color: #374151;
    color: #f9fafb;
    font-size: 0.875rem;
  }

  .search-input:focus {
    outline: none;
    border-color: #60a5fa;
  }

  .search-input::placeholder {
    color: #6b7280;
  }

  .browser-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .browser-content::-webkit-scrollbar {
    width: 8px;
  }

  .browser-content::-webkit-scrollbar-track {
    background: #1f2937;
  }

  .browser-content::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
  }

  .browser-content::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
    color: #9ca3af;
  }

  .empty-hint {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #374151;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .entries-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .entry-card {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    background-color: #111827;
    transition: all 0.2s;
  }

  .entry-card:hover {
    border-color: #60a5fa;
    background-color: #1f2937;
  }

  .entry-info {
    flex: 1;
    min-width: 0;
  }

  .entry-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: #f9fafb;
    margin-bottom: 0.25rem;
  }

  .entry-subtitle {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-bottom: 0.5rem;
    text-transform: capitalize;
  }

  .entry-description {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.4;
  }

  .entry-actions {
    flex-shrink: 0;
  }

  .dropdown-wrapper {
    position: relative;
  }

  .button-primary {
    padding: 0.5rem 1rem;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
  }

  .button-primary:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .button-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .button-primary.loading {
    opacity: 0.7;
  }

  .button-secondary {
    padding: 0.5rem 1rem;
    background-color: transparent;
    color: #9ca3af;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button-secondary:hover {
    background-color: #374151;
    color: #d1d5db;
  }

  .actor-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    background-color: #1f2937;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    z-index: 100;
    min-width: 200px;
    max-height: 300px;
    overflow-y: auto;
  }

  .dropdown-item {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: #d1d5db;
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .dropdown-item:hover {
    background-color: #374151;
  }

  .no-actors-hint {
    font-size: 0.75rem;
    color: #6b7280;
    padding: 0.5rem;
  }

  .end-message {
    text-align: center;
    padding: 1rem;
    font-size: 0.875rem;
    color: #6b7280;
    border-top: 1px solid #374151;
    margin-top: 1rem;
  }
</style>
