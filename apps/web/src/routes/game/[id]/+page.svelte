<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { websocket } from '$stores/websocket';
  import { authStore } from '$lib/stores/auth';
  import { gamesStore } from '$lib/stores/games';
  import { scenesStore } from '$lib/stores/scenes';
  import { tokensStore } from '$lib/stores/tokens';
  import { wallsStore } from '$lib/stores/walls';
  import SceneCanvas from '$lib/components/SceneCanvas.svelte';
  import SceneControls from '$lib/components/scene/SceneControls.svelte';
  import ChatPanel from '$lib/components/chat/ChatPanel.svelte';
  import CombatTracker from '$lib/components/combat/CombatTracker.svelte';
  import ActorSheet from '$lib/components/actor/ActorSheet.svelte';
  import type { Scene } from '@vtt/shared';

  let wsState: { connected: boolean; reconnecting: boolean; error: string | null };
  let activeTool = 'select';
  let gridSnap = false;
  let showActorSheet = false;
  let selectedActorId: string | null = null;

  // Use auto-subscription with $ prefix - Svelte handles cleanup automatically
  $: gameId = $page.params.id;
  $: currentGame = $gamesStore.currentGame;
  $: currentUser = $authStore.user;
  $: scenes = Array.from($scenesStore.scenes.values());
  $: activeScene = $scenesStore.activeSceneId
    ? $scenesStore.scenes.get($scenesStore.activeSceneId)
    : null;
  $: tokens = Array.from($tokensStore.tokens.values()).filter(
    token => activeScene && token.sceneId === activeScene.id
  );
  $: walls = Array.from($wallsStore.walls.values()).filter(
    wall => activeScene && wall.sceneId === activeScene.id
  );

  // Determine if current user is GM
  // User is GM if they are the owner OR in the gmUserIds list
  $: isGM = currentGame && currentUser
    ? currentGame.ownerId === currentUser.id || (currentGame.gmUserIds || []).includes(currentUser.id)
    : false;

  onMount(async () => {
    // Check if user is authenticated
    const isAuthenticated = await authStore.checkSession();
    if (!isAuthenticated) {
      goto('/login');
      return;
    }

    // Fetch game data to determine GM status
    await gamesStore.fetchGame(gameId);

    // Connect to WebSocket
    const wsUrl = import.meta.env.DEV
      ? 'ws://localhost:3000/ws'
      : `ws://${window.location.host}/ws`;

    websocket.connect(wsUrl);

    // Load scenes and tokens
    await scenesStore.loadScenes(gameId);
    await tokensStore.loadTokens(gameId);

    // Subscribe to WebSocket state
    const unsubscribeState = websocket.state.subscribe(state => {
      wsState = state;
    });

    // Subscribe to token events
    const unsubscribeTokenMove = websocket.onTokenMove((payload) => {
      tokensStore.moveToken(payload.tokenId, payload.x, payload.y);
    });

    const unsubscribeTokenAdded = websocket.onTokenAdded((payload) => {
      tokensStore.addToken(payload.token);
    });

    const unsubscribeTokenUpdated = websocket.onTokenUpdated((payload) => {
      tokensStore.updateToken(payload.token.id, payload.token);
    });

    const unsubscribeTokenRemoved = websocket.onTokenRemoved((payload) => {
      tokensStore.removeToken(payload.tokenId);
    });

    // Subscribe to scene events
    const unsubscribeSceneSwitched = websocket.onSceneSwitched((payload) => {
      scenesStore.setActiveScene(payload.scene.id);
    });

    const unsubscribeSceneUpdated = websocket.onSceneUpdated((payload) => {
      scenesStore.updateScene(payload.scene.id, payload.scene);
    });

    // Subscribe to wall events
    const unsubscribeWallAdded = websocket.onWallAdded((payload) => {
      wallsStore.addWall(payload.wall);
    });

    const unsubscribeWallUpdated = websocket.onWallUpdated((payload) => {
      wallsStore.updateWall(payload.wall.id, payload.wall);
    });

    const unsubscribeWallRemoved = websocket.onWallRemoved((payload) => {
      wallsStore.removeWall(payload.wallId);
    });

    // Join game room
    const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id') || '';
    websocket.joinGame(gameId, token);

    // Return cleanup function that will be called when component is destroyed
    return () => {
      unsubscribeState();
      unsubscribeTokenMove();
      unsubscribeTokenAdded();
      unsubscribeTokenUpdated();
      unsubscribeTokenRemoved();
      unsubscribeSceneSwitched();
      unsubscribeSceneUpdated();
      unsubscribeWallAdded();
      unsubscribeWallUpdated();
      unsubscribeWallRemoved();

      gamesStore.clearCurrentGame();
      scenesStore.clear();
      tokensStore.clear();
      wallsStore.clear();
      websocket.disconnect();
    };
  });

  function handleTokenMove(tokenId: string, x: number, y: number) {
    websocket.sendTokenMove({ tokenId, x, y });
  }

  function handleTokenSelect(tokenId: string | null) {
    tokensStore.selectToken(tokenId);
  }

  function handleSceneChange(sceneId: string) {
    scenesStore.setActiveScene(sceneId);
    websocket.sendSceneSwitch({ sceneId });
  }

  function handleToolChange(tool: string) {
    activeTool = tool;
  }

  function handleWallAdd(wall: { x1: number; y1: number; x2: number; y2: number }) {
    if (!activeScene) return;
    websocket.wallAdd({
      sceneId: activeScene.id,
      x1: wall.x1,
      y1: wall.y1,
      x2: wall.x2,
      y2: wall.y2,
      wallType: 'wall',
      move: 'none',
      sense: 'none',
      sound: 'none',
      door: 'none',
      doorState: 'closed'
    });
  }

  function handleWallRemove(wallId: string) {
    websocket.wallRemove({ wallId });
  }

  function handleOpenActorSheet(actorId: string) {
    selectedActorId = actorId;
    showActorSheet = true;
  }

  function handleCloseActorSheet() {
    showActorSheet = false;
    selectedActorId = null;
  }
</script>

<svelte:head>
  <title>Game {gameId} - VTT</title>
</svelte:head>

<div class="game-container">
  <header class="game-header">
    <div class="game-info">
      <h1>Game Session</h1>
      <span class="game-id">ID: {gameId}</span>

      {#if scenes.length > 0}
        <div class="scene-selector">
          <label for="scene-select">Scene:</label>
          <select
            id="scene-select"
            value={activeScene?.id || ''}
            on:change={(e) => handleSceneChange(e.currentTarget.value)}
          >
            {#each scenes as scene}
              <option value={scene.id}>{scene.name}</option>
            {/each}
          </select>
        </div>
      {/if}
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
    <div class="canvas-container">
      {#if activeScene}
        <SceneCanvas
          scene={activeScene}
          {tokens}
          {walls}
          {isGM}
          {activeTool}
          {gridSnap}
          onTokenMove={handleTokenMove}
          onTokenSelect={handleTokenSelect}
          onWallAdd={handleWallAdd}
          onWallRemove={handleWallRemove}
        />
        {#if isGM}
          <div class="scene-controls-overlay">
            <SceneControls
              {isGM}
              {activeTool}
              onToolChange={handleToolChange}
            />
          </div>
        {/if}
      {:else}
        <div class="placeholder">
          <p>No Scene Available</p>
          <p class="placeholder-text">Create a scene to get started</p>
        </div>
      {/if}
    </div>

    <aside class="sidebar">
      <div class="sidebar-section">
        <ChatPanel {gameId} />
      </div>

      <div class="sidebar-section">
        <CombatTracker {gameId} {isGM} />
      </div>
    </aside>
  </div>

  {#if showActorSheet && selectedActorId}
    <div class="actor-sheet-overlay">
      <div class="actor-sheet-modal">
        <ActorSheet
          actorId={selectedActorId}
          {gameId}
          {isGM}
          onClose={handleCloseActorSheet}
        />
      </div>
    </div>
  {/if}
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

  .scene-selector {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .scene-selector label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .scene-selector select {
    padding: var(--spacing-xs) var(--spacing-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    cursor: pointer;
  }

  .scene-selector select:focus {
    outline: none;
    border-color: #4a90e2;
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

  .scene-controls-overlay {
    position: absolute;
    top: 1rem;
    left: 1rem;
    z-index: 10;
    pointer-events: auto;
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

  .sidebar-section {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .sidebar-section:not(:last-child) {
    border-bottom: 1px solid var(--color-border);
  }

  .actor-sheet-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .actor-sheet-modal {
    width: 90%;
    max-width: 800px;
    height: 90%;
    max-height: 800px;
    background-color: var(--color-bg-secondary);
    border-radius: var(--border-radius-lg);
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
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
