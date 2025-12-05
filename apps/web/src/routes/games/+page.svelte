<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { gamesStore } from '$lib/stores/games';
  import { authStore } from '$lib/stores/auth';
  import GMManagement from '$lib/components/game/GMManagement.svelte';
  import type { Game } from '@vtt/shared';

  let games: Game[] = [];
  let loading = false;
  let error: string | null = null;
  let user: any = null;
  let gmManagementOpen = false;
  let selectedGame: Game | null = null;
  let token = '';

  const unsubscribeGames = gamesStore.subscribe(state => {
    games = state.games;
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

    // Get session token for GM management
    token = localStorage.getItem('vtt_session_id') || '';

    // Fetch games
    await gamesStore.fetchGames();
  });

  function createNewGame() {
    goto('/games/new');
  }

  function openGame(gameId: string) {
    goto(`/game/${gameId}`);
  }

  async function deleteGame(gameId: string, gameName: string) {
    if (confirm(`Are you sure you want to delete "${gameName}"?`)) {
      const success = await gamesStore.deleteGame(gameId);
      if (success) {
        // Game deleted, list will update automatically
      }
    }
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function openGMManagement(game: Game) {
    selectedGame = game;
    gmManagementOpen = true;
  }

  function closeGMManagement() {
    gmManagementOpen = false;
    selectedGame = null;
  }

  async function handleGMUpdated() {
    // Refresh the games list to get updated GM info
    await gamesStore.fetchGames();
  }
</script>

<svelte:head>
  <title>My Games - VTT</title>
</svelte:head>

<main class="container">
  <div class="header">
    <h1>My Games</h1>
    <button class="btn btn-primary" on:click={createNewGame}>
      Create New Game
    </button>
  </div>

  {#if error}
    <div class="error-message">
      <p>{error}</p>
      <button class="btn-text" on:click={() => gamesStore.clearError()}>Dismiss</button>
    </div>
  {/if}

  {#if loading}
    <div class="loading">
      <p>Loading games...</p>
    </div>
  {:else if games.length === 0}
    <div class="empty-state">
      <h2>No games yet</h2>
      <p>Create your first game to get started!</p>
      <button class="btn btn-primary" on:click={createNewGame}>
        Create Game
      </button>
    </div>
  {:else}
    <div class="games-grid">
      {#each games as game (game.id)}
        <div class="game-card">
          <div class="game-card-header">
            <h2>{game.name}</h2>
            <div class="game-card-actions">
              <button
                class="btn-icon"
                on:click={() => openGMManagement(game)}
                title="Manage GMs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </button>
              <button
                class="btn-icon"
                on:click={() => openGame(game.id)}
                title="Open game"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </button>
              <button
                class="btn-icon btn-danger"
                on:click={() => deleteGame(game.id, game.name)}
                title="Delete game"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="game-card-body">
            <div class="game-info">
              <span class="label">Grid:</span>
              <span class="value">{game.settings.gridType}</span>
            </div>
            <div class="game-info">
              <span class="label">Grid Size:</span>
              <span class="value">{game.settings.gridSize}px</span>
            </div>
            <div class="game-info">
              <span class="label">Snap to Grid:</span>
              <span class="value">{game.settings.snapToGrid ? 'Yes' : 'No'}</span>
            </div>
            <div class="game-info">
              <span class="label">Created:</span>
              <span class="value">{formatDate(game.createdAt)}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</main>

<!-- GM Management Modal -->
{#if selectedGame && user}
  <GMManagement
    isOpen={gmManagementOpen}
    game={selectedGame}
    currentUserId={user.id}
    {token}
    on:close={closeGMManagement}
    on:updated={handleGMUpdated}
  />
{/if}

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-xl) var(--spacing-lg);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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

  .loading {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--color-text-secondary);
  }

  .empty-state {
    text-align: center;
    padding: var(--spacing-xl) var(--spacing-lg);
    background-color: var(--color-bg-secondary);
    border-radius: var(--border-radius-lg);
    margin-top: var(--spacing-xl);
  }

  .empty-state h2 {
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-sm);
  }

  .empty-state p {
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-lg);
  }

  .games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--spacing-lg);
  }

  .game-card {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-lg);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .game-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .game-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-md);
  }

  .game-card-header h2 {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin: 0;
    flex: 1;
  }

  .game-card-actions {
    display: flex;
    gap: var(--spacing-xs);
  }

  .btn-icon {
    background: none;
    border: none;
    padding: var(--spacing-xs);
    cursor: pointer;
    color: var(--color-text-secondary);
    border-radius: var(--border-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s, color 0.2s;
  }

  .btn-icon:hover {
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .btn-icon.btn-danger:hover {
    background-color: rgba(248, 113, 113, 0.1);
    color: #f87171;
  }

  .game-card-body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .game-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .game-info .label {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .game-info .value {
    font-size: var(--font-size-sm);
    font-weight: 500;
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
</style>
