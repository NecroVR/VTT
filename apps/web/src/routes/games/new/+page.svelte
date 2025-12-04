<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { gamesStore } from '$lib/stores/games';
  import { authStore } from '$lib/stores/auth';
  import type { GameSettings } from '@vtt/shared';

  let user: any = null;
  let loading = false;
  let error: string | null = null;

  // Form fields
  let gameName = '';
  let gridType: 'square' | 'hex' | 'none' = 'square';
  let gridSize = 50;
  let snapToGrid = true;

  const unsubscribeGames = gamesStore.subscribe(state => {
    loading = state.loading;
    error = state.error;
  });

  const unsubscribeAuth = authStore.subscribe(state => {
    user = state.user;
  });

  onMount(async () => {
    // Check if user is authenticated
    if (!user) {
      const isAuthenticated = await authStore.checkSession();
      if (!isAuthenticated) {
        goto('/login');
        return;
      }
    }
  });

  async function handleSubmit() {
    if (!gameName.trim()) {
      error = 'Game name is required';
      return;
    }

    const settings: Partial<GameSettings> = {
      gridType,
      gridSize,
      snapToGrid,
    };

    const game = await gamesStore.createGame({
      name: gameName.trim(),
      settings,
    });

    if (game) {
      // Redirect to the new game
      goto(`/game/${game.id}`);
    }
  }

  function handleCancel() {
    goto('/games');
  }
</script>

<svelte:head>
  <title>Create New Game - VTT</title>
</svelte:head>

<main class="container">
  <div class="header">
    <h1>Create New Game</h1>
  </div>

  {#if error}
    <div class="error-message">
      <p>{error}</p>
      <button class="btn-text" on:click={() => gamesStore.clearError()}>Dismiss</button>
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="form">
    <div class="form-group">
      <label for="gameName">Game Name</label>
      <input
        id="gameName"
        type="text"
        bind:value={gameName}
        placeholder="Enter game name"
        required
        disabled={loading}
      />
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
        disabled={loading || !gameName.trim()}
      >
        {loading ? 'Creating...' : 'Create Game'}
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
</style>
