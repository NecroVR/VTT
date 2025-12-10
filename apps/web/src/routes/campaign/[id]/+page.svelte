<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { websocket } from '$stores/websocket';
  import { authStore } from '$lib/stores/auth';
  import { campaignsStore } from '$lib/stores/campaigns';
  import { scenesStore } from '$lib/stores/scenes';
  import { tokensStore } from '$lib/stores/tokens';
  import { wallsStore } from '$lib/stores/walls';
  import { lightsStore } from '$lib/stores/lights';
  import { actorsStore } from '$lib/stores/actors';
  import SceneCanvas from '$lib/components/SceneCanvas.svelte';
  import SceneControls from '$lib/components/scene/SceneControls.svelte';
  import SceneManagementModal from '$lib/components/scene/SceneManagementModal.svelte';
  import ChatPanel from '$lib/components/chat/ChatPanel.svelte';
  import CombatTracker from '$lib/components/combat/CombatTracker.svelte';
  import ActorSheet from '$lib/components/actor/ActorSheet.svelte';
  import ActorManager from '$lib/components/campaign/ActorManager.svelte';
  import ActorCreateModal from '$lib/components/actor/ActorCreateModal.svelte';
  import TokenConfig from '$lib/components/TokenConfig.svelte';
  import AssetBrowser from '$lib/components/assets/AssetBrowser.svelte';
  import AdminPanel from '$lib/components/campaign/AdminPanel.svelte';
  import LightingConfig from '$lib/components/LightingConfig.svelte';
  import OverlaySidebar from '$lib/components/sidebar/OverlaySidebar.svelte';
  import WindowManager from '$lib/components/sidebar/WindowManager.svelte';
  import type { ComponentType, SvelteComponent } from 'svelte';
  import type { Scene, Token, Wall } from '@vtt/shared';
  import { getWebSocketUrl } from '$lib/config/api';

  interface Tab {
    id: string;
    label: string;
    icon?: string;
    component: ComponentType<SvelteComponent>;
    props?: Record<string, any>;
  }

  let wsState: { connected: boolean; reconnecting: boolean; error: string | null };
  let activeTool = 'select';
  let showActorSheet = false;
  let selectedActorId: string | null = null;
  let showTokenConfig = false;
  let selectedToken: Token | null = null;
  let showLightConfig = false;
  let selectedLightId: string | null = null;
  let showSceneModal = false;
  let showActorCreateModal = false;
  let activeTabId = 'chat';

  // Use auto-subscription with $ prefix - Svelte handles cleanup automatically
  $: campaignId = $page.params.id;
  $: currentCampaign = $campaignsStore.currentCampaign;
  $: currentUser = $authStore.user;
  $: scenes = Array.from($scenesStore.scenes.values());
  $: activeScene = $scenesStore.activeSceneId
    ? $scenesStore.scenes.get($scenesStore.activeSceneId)
    : null;
  // Load tokens, lights, and walls when active scene changes
  $: if (activeScene?.id) {
    tokensStore.loadTokens(activeScene.id);
    const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id') || '';
    lightsStore.loadLights(activeScene.id, token);
    wallsStore.loadWalls(activeScene.id, token);
  }
  $: tokens = Array.from($tokensStore.tokens.values()).filter(
    token => activeScene && token.sceneId === activeScene.id
  );
  $: walls = Array.from($wallsStore.walls.values()).filter(
    wall => activeScene && wall.sceneId === activeScene.id
  );

  // Determine if current user is GM
  // User is GM if they are the owner OR in the gmUserIds list
  $: isGM = currentCampaign && currentUser
    ? currentCampaign.ownerId === currentUser.id || (currentCampaign.gmUserIds || []).includes(currentUser.id)
    : false;

  // Define sidebar tabs
  $: tabs = [
    {
      id: 'chat',
      label: 'Chat',
      icon: 'chat',
      component: ChatPanel,
      props: { campaignId: campaignId }
    },
    {
      id: 'combat',
      label: 'Combat',
      icon: 'swords',
      component: CombatTracker,
      props: { campaignId: campaignId, isGM }
    },
    {
      id: 'tokens',
      label: 'Tokens',
      icon: 'person',
      component: ActorManager,
      props: { campaignId: campaignId, isGM, currentSceneId: activeScene?.id || null }
    },
    {
      id: 'assets',
      label: 'Assets',
      icon: 'image',
      component: AssetBrowser,
      props: { campaignId: campaignId }
    },
    // Admin tab - only visible to GMs
    ...(isGM ? [{
      id: 'admin',
      label: 'Admin',
      icon: 'gear',
      component: AdminPanel,
      props: { campaignId: campaignId }
    }] : [])
  ] as Tab[];

  onMount(async () => {
    // Check if user is authenticated
    const isAuthenticated = await authStore.checkSession();
    if (!isAuthenticated) {
      goto('/login');
      return;
    }

    // Fetch campaign data to determine GM status
    await campaignsStore.fetchCampaign(campaignId);

    // Connect to WebSocket
    const wsUrl = getWebSocketUrl();

    websocket.connect(wsUrl);

    // Load scenes and actors (tokens are loaded reactively when active scene changes)
    await scenesStore.loadScenes(campaignId);
    await actorsStore.loadActors(campaignId);

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
      scenesStore.setActiveScene(payload.scene.id, campaignId);
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

    // Subscribe to light events
    const unsubscribeLightAdded = websocket.onLightAdded((payload) => {
      lightsStore.addLight(payload.light);
    });

    const unsubscribeLightUpdated = websocket.onLightUpdated((payload) => {
      lightsStore.updateLight(payload.light.id, payload.light);
    });

    const unsubscribeLightRemoved = websocket.onLightRemoved((payload) => {
      lightsStore.removeLight(payload.lightId);
    });

    // Join campaign room
    const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id') || '';
    websocket.joinCampaign(campaignId, token);

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
      unsubscribeLightAdded();
      unsubscribeLightUpdated();
      unsubscribeLightRemoved();

      campaignsStore.clearCurrentCampaign();
      scenesStore.clear();
      tokensStore.clear();
      wallsStore.clear();
      lightsStore.clear();
      actorsStore.clear();
      websocket.disconnect();
    };
  });

  function handleTokenMove(tokenId: string, x: number, y: number) {
    websocket.sendTokenMove({ tokenId, x, y });
  }

  function handleTokenAdd(tokenData: any) {
    if (!activeScene) {
      console.error('Cannot add token: no active scene');
      return;
    }

    websocket.sendTokenAdd({
      sceneId: activeScene.id,
      name: tokenData.name,
      x: tokenData.x,
      y: tokenData.y,
      width: tokenData.width || 1,
      height: tokenData.height || 1,
      imageUrl: tokenData.imageUrl || null,
      visible: tokenData.visible !== undefined ? tokenData.visible : true,
      actorId: tokenData.actorId || null
    });
  }

  function handleTokenSelect(tokenId: string | null) {
    tokensStore.selectToken(tokenId);
  }

  function handleTokenDoubleClick(tokenId: string) {
    const token = Array.from($tokensStore.tokens.values()).find(t => t.id === tokenId);
    if (token) {
      selectedToken = token;
      showTokenConfig = true;
    }
  }

  function handleCloseTokenConfig() {
    showTokenConfig = false;
    selectedToken = null;
  }

  function handleDeleteToken() {
    showTokenConfig = false;
    selectedToken = null;
  }

  function handleSceneChange(sceneId: string) {
    scenesStore.setActiveScene(sceneId, campaignId);
    websocket.sendSceneSwitch({ sceneId });
  }

  function handleToolChange(tool: string) {
    activeTool = tool;
  }

  function handleWallAdd(wall: { x1: number; y1: number; x2: number; y2: number }) {
    if (!activeScene) return;
    websocket.sendWallAdd({
      sceneId: activeScene.id,
      x1: wall.x1,
      y1: wall.y1,
      x2: wall.x2,
      y2: wall.y2,
      wallType: 'wall',
      move: 'none',
      sense: 'block',
      sound: 'none',
      door: 'none',
      doorState: 'closed'
    });
  }

  function handleWallRemove(wallId: string) {
    websocket.sendWallRemove({ wallId });
  }

  function handleWallUpdate(wallId: string, updates: Partial<Wall>) {
    websocket.sendWallUpdate({ wallId, updates });
  }

  function handleLightAdd(lightData: { x: number; y: number }) {
    if (!activeScene) return;
    websocket.sendLightAdd({
      sceneId: activeScene.id,
      x: lightData.x,
      y: lightData.y,
      rotation: 0,
      bright: 100,
      dim: 200,
      angle: 360,
      color: '#ffffff',
      alpha: 0.5,
      animationType: null,
      animationSpeed: 5,
      animationIntensity: 5,
      walls: true,
      vision: false
    });
  }

  function handleLightSelect(lightId: string | null) {
    selectedLightId = lightId;
    lightsStore.selectLight(lightId);
  }

  function handleLightDoubleClick(lightId: string) {
    selectedLightId = lightId;
    showLightConfig = true;
  }

  function handleLightMove(lightId: string, x: number, y: number) {
    websocket.sendLightUpdate({
      lightId,
      updates: { x, y }
    });
  }

  function handleCloseLightConfig() {
    showLightConfig = false;
    selectedLightId = null;
  }

  function handleDeleteLight() {
    showLightConfig = false;
    selectedLightId = null;
  }

  function handleOpenActorSheet(actorId: string) {
    selectedActorId = actorId;
    showActorSheet = true;
  }

  function handleCloseActorSheet() {
    showActorSheet = false;
    selectedActorId = null;
  }

  function handleSceneCreated(scene: Scene) {
    showSceneModal = false;
    // Add the scene to the store and set it as active
    scenesStore.addScene(scene);
    scenesStore.setActiveScene(scene.id, campaignId);
  }

  function handleCreateActor() {
    showActorCreateModal = true;
  }

  function handleActorCreated(actor: any) {
    // Add actor to store
    actorsStore.addActor(actor);
    showActorCreateModal = false;
  }

  function handleEditActor(event: CustomEvent<{ actorId: string }>) {
    selectedActorId = event.detail.actorId;
    showActorSheet = true;
  }

  function handleSelectToken(event: CustomEvent<{ tokenId: string }>) {
    // Token selection is already handled by tokensStore, just ensure UI updates
    tokensStore.selectToken(event.detail.tokenId);
  }
</script>

<svelte:head>
  <title>Campaign {campaignId} - VTT</title>
</svelte:head>

<div class="campaign-container">
  <header class="campaign-header">
    <div class="campaign-controls">

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

      {#if isGM}
        <button class="btn btn-primary create-scene-btn" on:click={() => showSceneModal = true}>
          Create Scene
        </button>
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

  <div class="campaign-content">
    <div class="canvas-container">
      {#if activeScene}
        <SceneCanvas
          scene={activeScene}
          {tokens}
          {walls}
          {isGM}
          {activeTool}
          gridSnap={currentCampaign?.settings?.snapToGrid ?? false}
          onTokenMove={handleTokenMove}
          onTokenAdd={handleTokenAdd}
          onTokenSelect={handleTokenSelect}
          onTokenDoubleClick={handleTokenDoubleClick}
          onWallAdd={handleWallAdd}
          onWallRemove={handleWallRemove}
          onWallUpdate={handleWallUpdate}
          onLightAdd={handleLightAdd}
          onLightSelect={handleLightSelect}
          onLightDoubleClick={handleLightDoubleClick}
          onLightMove={handleLightMove}
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
          {#if isGM}
            <button class="btn btn-primary" on:click={() => showSceneModal = true}>
              Create Scene
            </button>
          {:else}
            <p class="placeholder-text">Waiting for GM to create a scene</p>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <OverlaySidebar
    {tabs}
    bind:activeTabId
    width={350}
    headerHeight={60}
    on:create-actor={handleCreateActor}
    on:edit-actor={handleEditActor}
    on:select-token={handleSelectToken}
  />

  <WindowManager
    {tabs}
    on:create-actor={handleCreateActor}
    on:edit-actor={handleEditActor}
    on:select-token={handleSelectToken}
  />

  {#if showActorSheet && selectedActorId}
    <div class="actor-sheet-overlay">
      <div class="actor-sheet-modal">
        <ActorSheet
          actorId={selectedActorId}
          campaignId={campaignId}
          {isGM}
          onClose={handleCloseActorSheet}
        />
      </div>
    </div>
  {/if}

  {#if showTokenConfig && selectedToken}
    <TokenConfig
      token={selectedToken}
      campaignId={campaignId}
      {isGM}
      on:close={handleCloseTokenConfig}
      on:delete={handleDeleteToken}
    />
  {/if}

  {#if showLightConfig && selectedLightId && activeScene}
    <LightingConfig
      isOpen={showLightConfig}
      light={$lightsStore.lights.get(selectedLightId) || null}
      sceneId={activeScene.id}
      token={localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id') || ''}
      on:close={handleCloseLightConfig}
      on:delete={handleDeleteLight}
    />
  {/if}

  <SceneManagementModal
    isOpen={showSceneModal}
    campaignId={campaignId}
    onClose={() => showSceneModal = false}
    onSceneCreated={handleSceneCreated}
  />

  <ActorCreateModal
    isOpen={showActorCreateModal}
    campaignId={campaignId}
    onClose={() => showActorCreateModal = false}
    onActorCreated={handleActorCreated}
  />
</div>

<style>
  .campaign-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .campaign-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md) var(--spacing-lg);
    background-color: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
  }

  .campaign-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
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

  .create-scene-btn {
    padding: var(--spacing-xs) var(--spacing-md);
    font-size: var(--font-size-sm);
    white-space: nowrap;
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

  .campaign-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }

  .canvas-container {
    position: relative;
    background-color: var(--color-bg-primary);
    overflow: hidden;
    width: 100%;
    height: 100%;
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
    .campaign-content {
      flex-direction: column;
    }
  }
</style>
