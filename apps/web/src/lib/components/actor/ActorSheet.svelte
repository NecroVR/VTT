<script lang="ts">
  import { onMount } from 'svelte';
  import type { Actor } from '@vtt/shared';
  import { API_BASE_URL } from '$lib/config/api';
  import ActorHeader from './ActorHeader.svelte';
  import StatsTab from './StatsTab.svelte';
  import InventoryTab from './InventoryTab.svelte';
  import NotesTab from './NotesTab.svelte';
  import EffectsList from '../effects/EffectsList.svelte';

  // Props
  export let actorId: string;
  export let campaignId: string;
  export let isGM: boolean = false;
  export let onClose: (() => void) | null = null;
  export let token: string = '';

  // State
  let actor: Actor | null = null;
  let loading = false;
  let error: string | null = null;
  let activeTab: 'stats' | 'inventory' | 'notes' | 'effects' = 'stats';
  let hasUnsavedChanges = false;

  onMount(async () => {
    await loadActor();
  });

  async function loadActor() {
    loading = true;
    error = null;

    try {
      const authToken = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

      if (!authToken) {
        error = 'No authentication token found';
        loading = false;
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/actors/${actorId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        actor = data.actor;
      } else {
        error = 'Failed to load actor';
      }
    } catch (err) {
      console.error('Error loading actor:', err);
      error = 'Failed to load actor';
    } finally {
      loading = false;
    }
  }

  async function updateActor(updates: Partial<Actor>) {
    if (!actor) return;

    try {
      const authToken = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

      if (!authToken) {
        error = 'No authentication token found';
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/actors/${actorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        actor = data.actor;
        hasUnsavedChanges = false;
      } else {
        error = 'Failed to update actor';
      }
    } catch (err) {
      console.error('Error updating actor:', err);
      error = 'Failed to update actor';
    }
  }

  function handleTabChange(tab: 'stats' | 'inventory' | 'notes' | 'effects') {
    activeTab = tab;
  }

  function handleClose() {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    onClose?.();
  }
</script>

<div class="actor-sheet">
  {#if loading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading actor...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <p class="error-message">{error}</p>
      <button class="retry-btn" on:click={loadActor}>Retry</button>
    </div>
  {:else if actor}
    <div class="sheet-container">
      <div class="sheet-header-bar">
        <h2 class="sheet-title">Character Sheet</h2>
        {#if onClose}
          <button class="close-btn" on:click={handleClose}>
            <span class="close-icon">&times;</span>
          </button>
        {/if}
      </div>

      <ActorHeader {actor} onUpdate={updateActor} />

      <div class="tabs-container">
        <div class="tabs-nav">
          <button
            class="tab-btn"
            class:active={activeTab === 'stats'}
            on:click={() => handleTabChange('stats')}
          >
            Stats
          </button>
          <button
            class="tab-btn"
            class:active={activeTab === 'inventory'}
            on:click={() => handleTabChange('inventory')}
          >
            Inventory
          </button>
          <button
            class="tab-btn"
            class:active={activeTab === 'notes'}
            on:click={() => handleTabChange('notes')}
          >
            Notes
          </button>
          <button
            class="tab-btn"
            class:active={activeTab === 'effects'}
            on:click={() => handleTabChange('effects')}
          >
            Effects
          </button>
        </div>

        <div class="tab-content">
          {#if activeTab === 'stats'}
            <StatsTab {actor} onUpdate={updateActor} />
          {:else if activeTab === 'inventory'}
            <InventoryTab {actorId} {campaignId} />
          {:else if activeTab === 'notes'}
            <NotesTab {actor} {isGM} onUpdate={updateActor} />
          {:else if activeTab === 'effects'}
            <EffectsList {actorId} {campaignId} {isGM} {token} />
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .actor-sheet {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #1f2937;
    color: #f9fafb;
  }

  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 1rem;
    padding: 2rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #374151;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-container p,
  .error-container p {
    color: #9ca3af;
    font-size: 1rem;
  }

  .error-message {
    color: #fca5a5;
  }

  .retry-btn {
    padding: 0.5rem 1rem;
    background-color: #3b82f6;
    color: #ffffff;
    border: none;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .retry-btn:hover {
    background-color: #2563eb;
  }

  .sheet-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .sheet-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background-color: #111827;
    border-bottom: 2px solid #374151;
  }

  .sheet-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #f9fafb;
  }

  .close-btn {
    padding: 0.25rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #9ca3af;
    transition: color 0.2s ease;
    font-size: 2rem;
    line-height: 1;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    color: #f9fafb;
  }

  .close-icon {
    font-weight: 300;
  }

  .tabs-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .tabs-nav {
    display: flex;
    background-color: #111827;
    border-bottom: 1px solid #374151;
    padding: 0 1rem;
  }

  .tab-btn {
    padding: 1rem 1.5rem;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: #9ca3af;
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .tab-btn:hover {
    color: #d1d5db;
    background-color: #1f2937;
  }

  .tab-btn.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
  }

  .tab-content {
    flex: 1;
    overflow-y: auto;
    background-color: #1f2937;
  }

  .tab-content::-webkit-scrollbar {
    width: 10px;
  }

  .tab-content::-webkit-scrollbar-track {
    background: #1f2937;
  }

  .tab-content::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 5px;
  }

  .tab-content::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
</style>
