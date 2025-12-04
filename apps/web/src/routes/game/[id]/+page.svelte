<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { websocket } from '$stores/websocket';
  import { authStore } from '$lib/stores/auth';

  let gameId: string;
  let canvasContainer: HTMLDivElement;
  let wsState: { connected: boolean; reconnecting: boolean; error: string | null };

  // Subscribe to WebSocket state
  const unsubscribeState = websocket.state.subscribe(state => {
    wsState = state;
  });

  // Subscribe to page params to get game ID
  const unsubscribePage = page.subscribe(p => {
    gameId = p.params.id;
  });

  onMount(async () => {
    // Check if user is authenticated
    const isAuthenticated = await authStore.checkSession();
    if (!isAuthenticated) {
      goto('/login');
      return;
    }
    // Connect to WebSocket
    const wsUrl = import.meta.env.DEV
      ? 'ws://localhost:3000/ws'
      : `ws://${window.location.host}/ws`;

    websocket.connect(wsUrl);

    // Subscribe to WebSocket messages
    const unsubscribeMessages = websocket.subscribe((message) => {
      console.log('Received WebSocket message:', message);
      // Handle game state updates here
    });

    // Join game room
    websocket.send('game:join', { gameId });

    // PixiJS canvas will be initialized here in the future

    return () => {
      unsubscribeMessages();
    };
  });

  onDestroy(() => {
    unsubscribeState();
    unsubscribePage();
    websocket.disconnect();
  });
</script>

<svelte:head>
  <title>Game {gameId} - VTT</title>
</svelte:head>

<div class="game-container">
  <header class="game-header">
    <div class="game-info">
      <h1>Game Session</h1>
      <span class="game-id">ID: {gameId}</span>
    </div>
    <div class="connection-status">
      {#if wsState?.connected}
        <span class="status-indicator connected">Connected</span>
      {:else if wsState?.reconnecting}
        <span class="status-indicator reconnecting">Reconnecting...</span>
      {:else}
        <span class="status-indicator disconnected">Disconnected</span>
      {/if}
    </div>
  </header>

  <div class="game-content">
    <div class="canvas-container" bind:this={canvasContainer}>
      <!-- PixiJS canvas will be rendered here -->
      <div class="placeholder">
        <p>PixiJS Canvas</p>
        <p class="placeholder-text">Game canvas will be rendered here</p>
      </div>
    </div>

    <aside class="sidebar">
      <div class="card">
        <h2>Players</h2>
        <p class="placeholder-text">Player list will appear here</p>
      </div>

      <div class="card">
        <h2>Chat</h2>
        <p class="placeholder-text">Chat will appear here</p>
      </div>
    </aside>
  </div>
</div>

<style>
  .game-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md) var(--spacing-lg);
    background-color: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
  }

  .game-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .game-info h1 {
    font-size: var(--font-size-lg);
    font-weight: 600;
  }

  .game-id {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    font-family: monospace;
  }

  .connection-status {
    display: flex;
    align-items: center;
  }

  .status-indicator {
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-sm);
    font-weight: 500;
  }

  .status-indicator.connected {
    background-color: rgba(74, 222, 128, 0.2);
    color: #4ade80;
  }

  .status-indicator.reconnecting {
    background-color: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
  }

  .status-indicator.disconnected {
    background-color: rgba(248, 113, 113, 0.2);
    color: #f87171;
  }

  .game-content {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 300px;
    overflow: hidden;
  }

  .canvas-container {
    position: relative;
    background-color: var(--color-bg-primary);
    overflow: hidden;
  }

  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text-secondary);
  }

  .placeholder p:first-child {
    font-size: var(--font-size-xl);
    font-weight: 600;
    margin-bottom: var(--spacing-sm);
  }

  .placeholder-text {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .sidebar {
    background-color: var(--color-bg-secondary);
    border-left: 1px solid var(--color-border);
    padding: var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    overflow-y: auto;
  }

  .sidebar .card {
    flex-shrink: 0;
  }

  .sidebar h2 {
    font-size: var(--font-size-md);
    font-weight: 600;
    margin-bottom: var(--spacing-sm);
  }

  @media (max-width: 768px) {
    .game-content {
      grid-template-columns: 1fr;
    }

    .sidebar {
      display: none;
    }
  }
</style>
