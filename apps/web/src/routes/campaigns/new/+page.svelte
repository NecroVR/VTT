<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { campaignsStore } from '$lib/stores/campaigns';
  import { authStore } from '$lib/stores/auth';
  import { API_BASE_URL } from '$lib/config/api';
  import type { CampaignSettings } from '@vtt/shared';

  interface GameSystem {
    systemId: string;
    name: string;
    version: string;
    publisher: string;
    description: string;
    type: string;
  }

  let user: any = null;
  let loading = false;
  let error: string | null = null;

  // Game Systems
  let gameSystems: GameSystem[] = [];
  let gameSystemsLoading = false;
  let gameSystemsError: string | null = null;

  // Form fields
  let campaignName = '';
  let selectedGameSystemId = '';
  let gridType: 'square' | 'hex' | 'none' = 'square';
  let gridSize = 50;
  let snapToGrid = true;

  onMount(async () => {
    // Subscribe inside onMount to ensure proper cleanup
    const unsubscribeCampaigns = campaignsStore.subscribe(state => {
      loading = state.loading;
      error = state.error;
    });

    const unsubscribeAuth = authStore.subscribe(state => {
      user = state.user;
    });

    // Check if user is authenticated
    if (!user) {
      const isAuthenticated = await authStore.checkSession();
      if (!isAuthenticated) {
        goto('/login');
        return;
      }
    }

    // Fetch available game systems
    await fetchGameSystems();

    // Return cleanup function
    return () => {
      unsubscribeCampaigns();
      unsubscribeAuth();
    };
  });

  async function fetchGameSystems() {
    gameSystemsLoading = true;
    gameSystemsError = null;

    try {
      const sessionId = localStorage.getItem('vtt_session_id');
      if (!sessionId) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/game-systems`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch game systems');
      }

      const data = await response.json();
      gameSystems = data.gameSystems || [];
      gameSystemsLoading = false;
    } catch (err) {
      gameSystemsError = err instanceof Error ? err.message : 'Failed to load game systems';
      gameSystemsLoading = false;
    }
  }

  async function handleSubmit() {
    if (!campaignName.trim()) {
      error = 'Campaign name is required';
      return;
    }

    if (!selectedGameSystemId) {
      error = 'Game system is required';
      return;
    }

    const settings: Partial<CampaignSettings> = {
      gridType,
      gridSize,
      snapToGrid,
    };

    const campaign = await campaignsStore.createCampaign({
      name: campaignName.trim(),
      gameSystemId: selectedGameSystemId,
      settings,
    });

    if (campaign) {
      // Redirect to the new campaign
      goto(`/campaign/${campaign.id}`);
    }
  }

  function handleCancel() {
    goto('/campaigns');
  }
</script>

<svelte:head>
  <title>Create New Campaign - VTT</title>
</svelte:head>

<main class="container">
  <div class="header">
    <h1>Create New Campaign</h1>
  </div>

  {#if error}
    <div class="error-message">
      <p>{error}</p>
      <button class="btn-text" on:click={() => campaignsStore.clearError()}>Dismiss</button>
    </div>
  {/if}

  {#if gameSystemsError}
    <div class="error-message">
      <p>{gameSystemsError}</p>
      <button class="btn-text" on:click={fetchGameSystems}>Retry</button>
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="form">
    <div class="form-group">
      <label for="campaignName">Campaign Name <span class="required">*</span></label>
      <input
        id="campaignName"
        type="text"
        bind:value={campaignName}
        placeholder="Enter campaign name"
        required
        disabled={loading}
      />
    </div>

    <div class="form-group">
      <label for="gameSystem">Game System <span class="required">*</span></label>
      {#if gameSystemsLoading}
        <div class="loading-inline">Loading game systems...</div>
      {:else if gameSystems.length === 0}
        <div class="warning-message">
          No game systems available. Please contact your administrator.
        </div>
      {:else}
        <select
          id="gameSystem"
          bind:value={selectedGameSystemId}
          required
          disabled={loading}
        >
          <option value="">Select a game system</option>
          {#each gameSystems as system (system.systemId)}
            <option value={system.systemId}>
              {system.name} ({system.publisher})
            </option>
          {/each}
        </select>
        {#if selectedGameSystemId}
          {@const selectedSystem = gameSystems.find(s => s.systemId === selectedGameSystemId)}
          {#if selectedSystem}
            <div class="system-description">
              <p><strong>{selectedSystem.name}</strong> v{selectedSystem.version}</p>
              <p>{selectedSystem.description}</p>
            </div>
          {/if}
        {/if}
      {/if}
      <small>The game system cannot be changed after campaign creation.</small>
    </div>

    <div class="form-section">
      <h2>Grid Settings</h2>

      <div class="form-group">
        <label for="gridType">Grid Type</label>
        <select id="gridType" bind:value={gridType} disabled={loading}>
          <option value="square">Square</option>
          <option value="hex">Hexagonal</option>
          <option value="none">None</option>
        </select>
      </div>

      <div class="form-group">
        <label for="gridSize">Grid Size (pixels)</label>
        <input
          id="gridSize"
          type="number"
          bind:value={gridSize}
          min="20"
          max="200"
          step="5"
          disabled={loading}
        />
        <small>Size of each grid cell in pixels (20-200)</small>
      </div>

      <div class="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            bind:checked={snapToGrid}
            disabled={loading}
          />
          <span>Snap tokens to grid</span>
        </label>
        <small>Automatically align tokens to grid cells</small>
      </div>
    </div>

    <div class="form-actions">
      <button
        type="button"
        class="btn btn-secondary"
        on:click={handleCancel}
        disabled={loading}
      >
        Cancel
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        disabled={loading || !campaignName.trim() || !selectedGameSystemId || gameSystemsLoading}
      >
        {loading ? 'Creating...' : 'Create Campaign'}
      </button>
    </div>
  </form>
</main>

<style>
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: var(--spacing-xl) var(--spacing-lg);
  }

  .header {
    margin-bottom: var(--spacing-xl);
  }

  .header h1 {
    font-size: var(--font-size-2xl);
    font-weight: 700;
  }

  .error-message {
    background-color: rgba(248, 113, 113, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.3);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .error-message p {
    color: #f87171;
    margin: 0;
  }

  .form {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-xl);
  }

  .form-section {
    margin-top: var(--spacing-xl);
    padding-top: var(--spacing-xl);
    border-top: 1px solid var(--color-border);
  }

  .form-section h2 {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin-bottom: var(--spacing-lg);
  }

  .form-group {
    margin-bottom: var(--spacing-lg);
  }

  .form-group label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: 500;
    margin-bottom: var(--spacing-xs);
    color: var(--color-text-primary);
  }

  .form-group input[type="text"],
  .form-group input[type="number"],
  .form-group select {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  .form-group input:disabled,
  .form-group select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .form-group small {
    display: block;
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    margin-top: var(--spacing-xs);
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    cursor: pointer;
  }

  .checkbox-group input[type="checkbox"] {
    width: auto;
    cursor: pointer;
  }

  .checkbox-group span {
    font-size: var(--font-size-md);
    font-weight: normal;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
    margin-top: var(--spacing-xl);
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--color-border);
  }

  .btn-text {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: var(--font-size-sm);
    text-decoration: underline;
  }

  .btn-text:hover {
    color: var(--color-text-primary);
  }

  .btn-secondary {
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: var(--color-bg-secondary);
  }

  .required {
    color: #f87171;
    margin-left: var(--spacing-xs);
  }

  .loading-inline {
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    color: var(--color-text-secondary);
    font-size: var(--font-size-md);
    font-style: italic;
  }

  .warning-message {
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: rgba(251, 191, 36, 0.1);
    border: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: var(--border-radius-sm);
    color: #f59e0b;
    font-size: var(--font-size-sm);
  }

  .system-description {
    margin-top: var(--spacing-sm);
    padding: var(--spacing-md);
    background-color: rgba(59, 130, 246, 0.05);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: var(--border-radius-sm);
  }

  .system-description p {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
  }

  .system-description p:first-child {
    margin-bottom: var(--spacing-xs);
  }

  .system-description p:last-child {
    color: var(--color-text-secondary);
  }
</style>
