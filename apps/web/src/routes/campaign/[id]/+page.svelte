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
  import { windowsStore } from '$lib/stores/windows';
  import { doorsStore } from '$lib/stores/doors';
  import { lightsStore } from '$lib/stores/lights';
  import { pathPointsStore } from '$lib/stores/paths';
  import { actorsStore } from '$lib/stores/actors';
  import { sidebarStore } from '$lib/stores/sidebar';
  import { toolbarStore } from '$lib/stores/toolbar';
  import SceneCanvas from '$lib/components/SceneCanvas.svelte';
  import SceneControls from '$lib/components/scene/SceneControls.svelte';
  import PropertiesPanel from '$lib/components/scene/PropertiesPanel.svelte';
  import SceneManagementModal from '$lib/components/scene/SceneManagementModal.svelte';
  import ChatPanel from '$lib/components/chat/ChatPanel.svelte';
  import CombatTracker from '$lib/components/combat/CombatTracker.svelte';
  import ActorSheet from '$lib/components/actor/ActorSheet.svelte';
  import ActorManager from '$lib/components/campaign/ActorManager.svelte';
  import ActorCreateModal from '$lib/components/actor/ActorCreateModal.svelte';
  import TokenConfig from '$lib/components/TokenConfig.svelte';
  import CampaignTab from '$lib/components/campaign/CampaignTab.svelte';
  import AdminPanel from '$lib/components/campaign/AdminPanel.svelte';
  import LightingConfig from '$lib/components/LightingConfig.svelte';
  import OverlaySidebar from '$lib/components/sidebar/OverlaySidebar.svelte';
  import WindowManager from '$lib/components/sidebar/WindowManager.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import type { ComponentType, SvelteComponent } from 'svelte';
  import type { Scene, Token, Wall, Door } from '@vtt/shared';
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
  let openDropdownId: string | null = null;
  let showDeleteConfirm = false;
  let sceneToDelete: string | null = null;
  let headerElement: HTMLElement;
  let containerElement: HTMLElement;
  let calculatedHeaderHeight = 0;

  // Selection state (bound to SceneCanvas)
  let selectedTokenIds: Set<string> = new Set();
  let selectedLightIds: Set<string> = new Set();
  let selectedWallIds: Set<string> = new Set();
  let selectedDoorIds: Set<string> = new Set();
  let selectedWindowIds: Set<string> = new Set();
  let selectedDrawingIds: Set<string> = new Set();
  let selectedTileIds: Set<string> = new Set();
  let selectedRegionIds: Set<string> = new Set();

  // Grid snap state
  let gridSnapEnabled = false;

  // Sidebar resize state
  let isResizingSidebar = false;
  let resizeStartX = 0;
  let resizeStartWidth = 0;

  // Toolbar resize state
  let isResizingToolbar = false;
  const MIN_TOOLBAR_WIDTH = 48;
  const COLLAPSED_TOOLBAR_WIDTH = 45;

  // Subscribe to toolbar store
  $: toolbarCollapsed = $toolbarStore.collapsed;
  $: toolbarWidth = $toolbarStore.width;

  // Use auto-subscription with $ prefix - Svelte handles cleanup automatically
  $: campaignId = $page.params.id;
  $: currentCampaign = $campaignsStore.currentCampaign;
  $: currentUser = $authStore.user;
  $: scenes = Array.from($scenesStore.scenes.values());
  $: activeScene = $scenesStore.activeSceneId
    ? $scenesStore.scenes.get($scenesStore.activeSceneId)
    : null;
  // Load tokens, lights, walls, windows, and doors when active scene changes
  $: if (activeScene?.id) {
    tokensStore.loadTokens(activeScene.id);
    const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id') || '';
    lightsStore.loadLights(activeScene.id, token);
    wallsStore.loadWalls(activeScene.id, token);
    windowsStore.loadWindows(activeScene.id, token);
    doorsStore.loadDoors(activeScene.id, token);
    pathPointsStore.loadPathPoints(activeScene.id, token);
  }
  $: tokens = Array.from($tokensStore.tokens.values()).filter(
    token => activeScene && token.sceneId === activeScene.id
  );
  $: walls = Array.from($wallsStore.walls.values()).filter(
    wall => activeScene && wall.sceneId === activeScene.id
  );
  $: windows = Array.from($windowsStore.windows.values()).filter(
    window => activeScene && window.sceneId === activeScene.id
  );
  $: doors = Array.from($doorsStore.doors.values()).filter(
    door => activeScene && door.sceneId === activeScene.id
  );

  // Determine if current user is GM
  // User is GM if they are the owner OR in the gmUserIds list
  $: isGM = currentCampaign && currentUser
    ? currentCampaign.ownerId === currentUser.id || (currentCampaign.gmUserIds || []).includes(currentUser.id)
    : false;

  // Get actors for campaign tab
  $: actors = Array.from($actorsStore.actors.values());

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
      id: 'campaign',
      label: 'Campaign',
      icon: 'folder',
      component: CampaignTab,
      props: {
        campaignId: campaignId,
        gameSystemId: currentCampaign?.gameSystemId || null,
        isGM: isGM,
        actors: actors
      }
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

  // PropertiesPanel handlers
  function handleToolSettingsChange(event: CustomEvent<{ tool: string; settings: Record<string, any> }>) {
    // Store tool settings for future use when placing objects
    console.log('Tool settings changed:', event.detail);
    // TODO: Store these settings in a local state or store for use when placing objects
  }

  function handleObjectPropertyChange(event: CustomEvent<{ objectType: string; objectId: string; property: string; value: any }>) {
    const { objectType, objectId, property, value } = event.detail;

    // Optimistic update: Update local store immediately, then send WebSocket message
    // This ensures the UI updates immediately without waiting for the server round-trip
    switch (objectType) {
      case 'token':
        tokensStore.updateToken(objectId, { [property]: value });
        websocket.sendTokenUpdate({ tokenId: objectId, updates: { [property]: value } });
        break;
      case 'light':
        lightsStore.updateLight(objectId, { [property]: value });
        websocket.sendLightUpdate({ lightId: objectId, updates: { [property]: value } });
        break;
      case 'wall':
        wallsStore.updateWall(objectId, { [property]: value });
        websocket.sendWallUpdate({ wallId: objectId, updates: { [property]: value } });
        break;
      case 'door':
        doorsStore.updateDoorLocal(objectId, { [property]: value });
        websocket.sendDoorUpdate({ doorId: objectId, updates: { [property]: value } });
        break;
      case 'window':
        windowsStore.updateWindowLocal(objectId, { [property]: value });
        websocket.sendWindowUpdate({ windowId: objectId, updates: { [property]: value } });
        break;
      default:
        console.warn(`Unknown object type: ${objectType}`);
    }
  }

  function handleObjectDelete(event: CustomEvent<{ objectType: string; objectId: string }>) {
    const { objectType, objectId } = event.detail;

    switch (objectType) {
      case 'token':
        websocket.sendTokenRemove({ tokenId: objectId });
        break;
      case 'light':
        websocket.sendLightRemove({ lightId: objectId });
        break;
      case 'wall':
        websocket.sendWallRemove({ wallId: objectId });
        break;
      case 'door':
        websocket.sendDoorRemove({ doorId: objectId });
        break;
      case 'window':
        websocket.sendWindowRemove({ windowId: objectId });
        break;
      default:
        console.warn(`Unknown object type: ${objectType}`);
    }
  }

  function handleObjectsDelete(event: CustomEvent<{ objectType: string; objectIds: string[] }>) {
    const { objectType, objectIds } = event.detail;

    // Delete each object in the array
    for (const objectId of objectIds) {
      switch (objectType) {
        case 'token':
          websocket.sendTokenRemove({ tokenId: objectId });
          break;
        case 'light':
          websocket.sendLightRemove({ lightId: objectId });
          break;
        case 'wall':
          websocket.sendWallRemove({ wallId: objectId });
          break;
        case 'door':
          websocket.sendDoorRemove({ doorId: objectId });
          break;
        case 'window':
          websocket.sendWindowRemove({ windowId: objectId });
          break;
        default:
          console.warn(`Unknown object type: ${objectType}`);
      }
    }
  }

  function handleOpenFullEditor(event: CustomEvent<{ objectType: string; objectId: string }>) {
    const { objectType, objectId } = event.detail;

    switch (objectType) {
      case 'token':
        const token = Array.from($tokensStore.tokens.values()).find(t => t.id === objectId);
        if (token) {
          selectedToken = token;
          showTokenConfig = true;
        }
        break;
      case 'light':
        selectedLightId = objectId;
        showLightConfig = true;
        break;
      default:
        console.log(`Full editor not implemented for ${objectType}`);
    }
  }

  function handleGridSnapToggle(event: CustomEvent<boolean>) {
    gridSnapEnabled = event.detail;
  }

  onMount(async () => {
    // Calculate header height for sidebar positioning
    if (headerElement) {
      calculatedHeaderHeight = headerElement.offsetHeight;
    }

    // Toolbar width is now managed by toolbarStore (loaded from localStorage automatically)

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
      console.log('wall:added received:', payload);
      console.log('wall:added wall details:', {
        id: payload.wall.id,
        sceneId: payload.wall.sceneId,
        wallShape: payload.wall.wallShape,
        controlPoints: payload.wall.controlPoints,
        activeSceneId: activeScene?.id
      });
      wallsStore.addWall(payload.wall);
    });

    const unsubscribeWallUpdated = websocket.onWallUpdated((payload) => {
      wallsStore.updateWall(payload.wall.id, payload.wall);
    });

    const unsubscribeWallRemoved = websocket.onWallRemoved((payload) => {
      wallsStore.removeWall(payload.wallId);
    });

    // Subscribe to window events
    const unsubscribeWindowAdded = websocket.onWindowAdded((payload) => {
      console.log('window:added received:', payload);
      windowsStore.addWindow(payload.window);
    });

    const unsubscribeWindowUpdated = websocket.onWindowUpdated((payload) => {
      windowsStore.updateWindowLocal(payload.window.id, payload.window);
    });

    const unsubscribeWindowRemoved = websocket.onWindowRemoved((payload) => {
      windowsStore.removeWindow(payload.windowId);
    });

    // Subscribe to door events
    const unsubscribeDoorAdded = websocket.onDoorAdded((payload) => {
      console.log('door:added received:', payload);
      doorsStore.addDoor(payload.door);
    });

    const unsubscribeDoorUpdated = websocket.onDoorUpdated((payload) => {
      doorsStore.updateDoorLocal(payload.door.id, payload.door);
    });

    const unsubscribeDoorRemoved = websocket.onDoorRemoved((payload) => {
      doorsStore.removeDoor(payload.doorId);
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

    // Subscribe to path point events
    const unsubscribePathPointAdded = websocket.onPathPointAdded((payload) => {
      pathPointsStore.addPathPoint(payload.pathPoint);
    });

    const unsubscribePathPointUpdated = websocket.onPathPointUpdated((payload) => {
      pathPointsStore.updatePathPoint(payload.pathPoint.id, payload.pathPoint);
    });

    const unsubscribePathPointRemoved = websocket.onPathPointRemoved((payload) => {
      pathPointsStore.removePathPoint(payload.pathPointId);
    });

    // Join campaign room
    const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id') || '';
    websocket.joinCampaign(campaignId, token);

    // Add window event listeners for sidebar resize
    window.addEventListener('mousemove', handleDividerMouseMove);
    window.addEventListener('mouseup', handleDividerMouseUp);

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
      unsubscribeWindowAdded();
      unsubscribeWindowUpdated();
      unsubscribeWindowRemoved();
      unsubscribeDoorAdded();
      unsubscribeDoorUpdated();
      unsubscribeDoorRemoved();
      unsubscribeLightAdded();
      unsubscribeLightUpdated();
      unsubscribeLightRemoved();
      unsubscribePathPointAdded();
      unsubscribePathPointUpdated();
      unsubscribePathPointRemoved();

      // Remove window event listeners
      window.removeEventListener('mousemove', handleDividerMouseMove);
      window.removeEventListener('mouseup', handleDividerMouseUp);

      campaignsStore.clearCurrentCampaign();
      scenesStore.clear();
      tokensStore.clear();
      wallsStore.clear();
      windowsStore.clear();
      doorsStore.clear();
      lightsStore.clear();
      pathPointsStore.clearPathPoints();
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

  function handleWallAdd(wall: { x1: number; y1: number; x2: number; y2: number; snapToGrid?: boolean; wallShape?: 'straight' | 'curved' }) {
    console.log('handleWallAdd called with:', wall);
    if (!activeScene) {
      console.log('No active scene, cannot add wall');
      return;
    }

    const wallPayload = {
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
      doorState: 'closed',
      wallShape: wall.wallShape,
      snapToGrid: wall.snapToGrid
    };

    console.log('Sending wall to WebSocket:', wallPayload);
    websocket.sendWallAdd(wallPayload);
  }

  function handleWallRemove(wallId: string) {
    websocket.sendWallRemove({ wallId });
  }

  function handleWallUpdate(wallId: string, updates: Partial<Wall>) {
    websocket.sendWallUpdate({ wallId, updates });
  }

  function handleWindowAdd(window: { x1: number; y1: number; x2: number; y2: number; snapToGrid?: boolean; wallShape?: 'straight' | 'curved' }) {
    console.log('handleWindowAdd called with:', window);
    if (!activeScene) {
      console.log('No active scene, cannot add window');
      return;
    }

    const windowPayload = {
      sceneId: activeScene.id,
      x1: window.x1,
      y1: window.y1,
      x2: window.x2,
      y2: window.y2,
      wallShape: window.wallShape || 'straight',
      snapToGrid: window.snapToGrid
    };

    console.log('Sending window to WebSocket:', windowPayload);
    websocket.sendWindowAdd(windowPayload);
  }

  function handleWindowRemove(windowId: string) {
    websocket.sendWindowRemove({ windowId });
  }

  function handleWindowUpdate(windowId: string, updates: any) {
    websocket.sendWindowUpdate({ windowId, updates });
  }

  function handleWindowSelect(windowId: string | null) {
    console.log('Window selected:', windowId);
    // TODO: Implement window selection handling (e.g., open config panel)
  }

  function handleDoorAdd(door: { x1: number; y1: number; x2: number; y2: number; snapToGrid?: boolean; wallShape?: 'straight' | 'curved' }) {
    console.log('handleDoorAdd called with:', door);
    if (!activeScene) {
      console.log('No active scene, cannot add door');
      return;
    }

    const doorPayload = {
      sceneId: activeScene.id,
      x1: door.x1,
      y1: door.y1,
      x2: door.x2,
      y2: door.y2,
      wallShape: door.wallShape || 'straight',
      snapToGrid: door.snapToGrid,
      status: 'closed' as const,
      isLocked: false
    };

    console.log('Sending door to WebSocket:', doorPayload);
    websocket.sendDoorAdd(doorPayload);
  }

  function handleDoorRemove(doorId: string) {
    websocket.sendDoorRemove({ doorId });
  }

  function handleDoorUpdate(doorId: string, updates: Partial<Door>) {
    websocket.sendDoorUpdate({ doorId, updates });
  }

  function handleDoorSelect(doorId: string | null) {
    console.log('Door selected:', doorId);
    // TODO: Implement door selection handling (e.g., open config panel)
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

  function handlePathPointAdd(pointData: { pathName: string; pathIndex: number; x: number; y: number; color: string; visible: boolean }) {
    if (!activeScene) {
      return;
    }
    websocket.sendPathPointAdd({
      sceneId: activeScene.id,
      pathName: pointData.pathName,
      pathIndex: pointData.pathIndex,
      x: pointData.x,
      y: pointData.y,
      color: pointData.color,
      visible: pointData.visible
    });
  }

  function handlePathPointRemove(pathPointId: string) {
    websocket.sendPathPointRemove({ pathPointId });
  }

  function handlePathPointUpdate(pathPointId: string, updates: { pathName?: string; pathIndex?: number; x?: number; y?: number }) {
    websocket.sendPathPointUpdate({ pathPointId, updates });
  }

  function handleLightDoubleClick(lightId: string) {
    selectedLightId = lightId;
    showLightConfig = true;
  }

  function handleLightMove(lightId: string, x: number, y: number) {
    // Optimistic update: Update local store immediately, then send WebSocket message
    lightsStore.updateLight(lightId, { x, y });
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

  function toggleDropdown(sceneId: string, event: Event) {
    event.stopPropagation();
    openDropdownId = openDropdownId === sceneId ? null : sceneId;
  }

  function closeDropdown() {
    openDropdownId = null;
  }

  function handleMovePlayersHere(sceneId: string) {
    handleSceneChange(sceneId);
    closeDropdown();
  }

  function confirmDeleteScene(sceneId: string) {
    sceneToDelete = sceneId;
    showDeleteConfirm = true;
    closeDropdown();
  }

  async function handleDeleteScene() {
    if (!sceneToDelete) return;

    const deletingActiveScene = activeScene?.id === sceneToDelete;

    await scenesStore.deleteScene(sceneToDelete);

    // If we deleted the active scene, switch to the first available scene
    if (deletingActiveScene && scenes.length > 0) {
      const firstAvailableScene = scenes.find(s => s.id !== sceneToDelete);
      if (firstAvailableScene) {
        handleSceneChange(firstAvailableScene.id);
      }
    }

    showDeleteConfirm = false;
    sceneToDelete = null;
  }

  function cancelDeleteScene() {
    showDeleteConfirm = false;
    sceneToDelete = null;
  }

  // Sidebar resize handlers
  function handleDividerMouseDown(e: MouseEvent) {
    isResizingSidebar = true;
    resizeStartX = e.clientX;
    resizeStartWidth = $sidebarStore.dockedWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }

  // Toolbar resize handlers
  function handleToolbarDividerMouseDown(e: MouseEvent) {
    isResizingToolbar = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }

  function handleDividerMouseMove(e: MouseEvent) {
    // Handle toolbar resize
    if (isResizingToolbar) {
      const newWidth = e.clientX;
      toolbarStore.updateWidth(Math.max(MIN_TOOLBAR_WIDTH, newWidth));
      return;
    }

    // Handle sidebar resize
    if (isResizingSidebar) {
      // Moving left increases sidebar width, moving right decreases it
      const delta = resizeStartX - e.clientX;
      let newWidth = resizeStartWidth + delta;

      // Constrain to min/max bounds
      const MIN_WIDTH = 280;
      const MAX_WIDTH = 600;
      newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));

      sidebarStore.updateDockedWidth(newWidth);
    }
  }

  function handleDividerMouseUp() {
    if (isResizingToolbar) {
      isResizingToolbar = false;
      // Width is already saved by the store
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      return;
    }

    if (isResizingSidebar) {
      isResizingSidebar = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }

  function handleToolbarExpand() {
    toolbarStore.setCollapsed(false);
  }
</script>

<svelte:head>
  <title>Campaign {campaignId} - VTT</title>
</svelte:head>

<svelte:window on:click={closeDropdown} />

<div class="campaign-container" bind:this={containerElement}>
  <header class="campaign-header" bind:this={headerElement}>
    <div class="campaign-controls">

      {#if scenes.length > 0 || isGM}
        <div class="scene-tabs">
          {#each scenes as scene}
            <div class="scene-tab-wrapper">
              <button
                class="scene-tab"
                class:active={activeScene?.id === scene.id}
                on:click={() => handleSceneChange(scene.id)}
                title={scene.name}
              >
                {scene.name}
                {#if isGM}
                  <span
                    class="scene-menu-button"
                    on:click={(e) => toggleDropdown(scene.id, e)}
                    on:keydown={(e) => e.key === 'Enter' && toggleDropdown(scene.id, e)}
                    role="button"
                    tabindex="0"
                    aria-label="Scene menu"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M3.5 6.5a.5.5 0 0 1 .5.5L8 11l4-4a.5.5 0 0 1 .707.707l-4.5 4.5a.5.5 0 0 1-.707 0l-4.5-4.5A.5.5 0 0 1 3.5 6.5z"/>
                    </svg>
                  </span>
                {/if}
              </button>
              {#if isGM && openDropdownId === scene.id}
                <div class="scene-dropdown" on:click|stopPropagation>
                  <button
                    class="dropdown-item"
                    on:click={() => handleMovePlayersHere(scene.id)}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1a2 2 0 0 1 2 2v2H6V3a2 2 0 0 1 2-2zm3 4V3a3 3 0 1 0-6 0v2H3.36a1.5 1.5 0 0 0-1.483 1.277L.85 13.13A2.5 2.5 0 0 0 3.322 16h9.355a2.5 2.5 0 0 0 2.473-2.87l-1.028-6.853A1.5 1.5 0 0 0 12.64 5H11z"/>
                    </svg>
                    Move Players Here
                  </button>
                  <button
                    class="dropdown-item danger"
                    on:click={() => confirmDeleteScene(scene.id)}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                      <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                    Delete Scene
                  </button>
                </div>
              {/if}
            </div>
          {/each}
          {#if isGM}
            <button
              class="scene-tab create-scene-tab"
              on:click={() => showSceneModal = true}
              title="Create New Scene"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3.5a.5.5 0 0 1 .5.5v3.5H12a.5.5 0 0 1 0 1H8.5V12a.5.5 0 0 1-1 0V8.5H4a.5.5 0 0 1 0-1h3.5V4a.5.5 0 0 1 .5-.5z"/>
              </svg>
            </button>
          {/if}
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

  <div class="campaign-content">
    {#if isGM}
      {#if toolbarCollapsed}
        <!-- Collapsed toolbar: just an expand button strip -->
        <div class="toolbar-collapsed">
          <button
            class="toolbar-expand-button"
            on:click={handleToolbarExpand}
            type="button"
            title="Expand toolbar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      {:else}
        <div class="toolbar-frame" style="width: {toolbarWidth}px">
          <SceneControls
            {isGM}
            {activeTool}
            onToolChange={handleToolChange}
          >
            <PropertiesPanel
              slot="properties"
              {activeTool}
              tokens={$tokensStore.tokens}
              lights={$lightsStore.lights}
              {walls}
              {doors}
              {windows}
              drawings={[]}
              tiles={[]}
              regions={[]}
              {selectedTokenIds}
              {selectedLightIds}
              {selectedWallIds}
              {selectedDoorIds}
              {selectedWindowIds}
              {selectedDrawingIds}
              {selectedTileIds}
              {selectedRegionIds}
              sceneId={activeScene?.id || ''}
              {campaignId}
              {isGM}
              {gridSnapEnabled}
              on:toolSettingsChange={handleToolSettingsChange}
              on:objectPropertyChange={handleObjectPropertyChange}
              on:objectDelete={handleObjectDelete}
              on:objectsDelete={handleObjectsDelete}
              on:openFullEditor={handleOpenFullEditor}
              on:gridSnapToggle={handleGridSnapToggle}
            />
          </SceneControls>
        </div>
        <div
          class="toolbar-divider"
          class:resizing={isResizingToolbar}
          on:mousedown={handleToolbarDividerMouseDown}
          role="separator"
          aria-orientation="vertical"
        ></div>
      {/if}
    {/if}

    <div class="canvas-frame">
      <div class="canvas-container">
        {#if activeScene}
          <SceneCanvas
            scene={activeScene}
            {tokens}
            {walls}
            {windows}
            {doors}
            {isGM}
            {activeTool}
            gridSnap={gridSnapEnabled || (currentCampaign?.settings?.snapToGrid ?? false)}
            wallEndpointSnapRange={currentCampaign?.settings?.wallEndpointSnapRange ?? 4}
            bind:selectedTokenIds
            bind:selectedLightIds
            bind:selectedWallIds
            bind:selectedDoorIds
            bind:selectedWindowIds
            onTokenMove={handleTokenMove}
            onTokenAdd={handleTokenAdd}
            onTokenSelect={handleTokenSelect}
            onTokenDoubleClick={handleTokenDoubleClick}
            onWallAdd={handleWallAdd}
            onWallRemove={handleWallRemove}
            onWallUpdate={handleWallUpdate}
            onWindowAdd={handleWindowAdd}
            onWindowRemove={handleWindowRemove}
            onWindowUpdate={handleWindowUpdate}
            onWindowSelect={handleWindowSelect}
            onDoorAdd={handleDoorAdd}
            onDoorRemove={handleDoorRemove}
            onDoorUpdate={handleDoorUpdate}
            onDoorSelect={handleDoorSelect}
            onLightAdd={handleLightAdd}
            onLightSelect={handleLightSelect}
            onLightDoubleClick={handleLightDoubleClick}
            onLightMove={handleLightMove}
            onPathPointAdd={handlePathPointAdd}
            onPathPointRemove={handlePathPointRemove}
            onPathPointUpdate={handlePathPointUpdate}
          />
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

    {#if $sidebarStore.docked && !$sidebarStore.collapsed}
      <div
        class="sidebar-divider"
        class:resizing={isResizingSidebar}
        on:mousedown={handleDividerMouseDown}
        role="separator"
        aria-orientation="vertical"
      ></div>
    {/if}

    {#if $sidebarStore.docked}
      <div class="sidebar-frame" style="width: {$sidebarStore.collapsed ? '45px' : $sidebarStore.dockedWidth + 'px'}">
        <OverlaySidebar
          {tabs}
          bind:activeTabId
          headerHeight={calculatedHeaderHeight}
          on:create-actor={handleCreateActor}
          on:edit-actor={handleEditActor}
          on:select-token={handleSelectToken}
        />
      </div>
    {:else}
      <OverlaySidebar
        {tabs}
        bind:activeTabId
        headerHeight={calculatedHeaderHeight}
        on:create-actor={handleCreateActor}
        on:edit-actor={handleEditActor}
        on:select-token={handleSelectToken}
      />
    {/if}
  </div>

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

  {#if showDeleteConfirm && sceneToDelete}
    <ConfirmDialog
      title="Delete Scene"
      message="Are you sure you want to delete this scene? This action cannot be undone."
      confirmText="Delete"
      cancelText="Cancel"
      danger={true}
      on:confirm={handleDeleteScene}
      on:cancel={cancelDeleteScene}
    />
  {/if}
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
    background-color: #111827;
    border-bottom: 2px solid #374151;
  }

  .campaign-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .scene-tabs {
    display: flex;
    align-items: center;
    gap: 4px;
    max-width: 600px;
    padding: 2px 0;
  }

  .scene-tab {
    padding: 8px 16px;
    border: 1px solid #374151;
    border-radius: var(--border-radius-sm);
    background-color: #1f2937;
    color: #9ca3af;
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
    position: relative;
  }

  .scene-tab:hover {
    background-color: #374151;
    color: #d1d5db;
    border-color: #4b5563;
  }

  .scene-tab.active {
    background-color: #1e3a5f;
    color: #60a5fa;
    border-color: #3b82f6;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  }

  .scene-tab.active:hover {
    background-color: #1e3a5f;
    border-color: #3b82f6;
  }

  .create-scene-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    min-width: 40px;
  }

  .create-scene-tab:hover {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .create-scene-tab svg {
    display: block;
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
    flex-direction: row;
    overflow: hidden;
    position: relative;
  }

  .canvas-frame {
    flex: 1;
    position: relative;
    overflow: hidden;
    min-width: 0;
  }

  .canvas-container {
    position: relative;
    background-color: var(--color-bg-primary);
    overflow: hidden;
    width: 100%;
    height: 100%;
  }

  .sidebar-divider {
    width: 6px;
    background: var(--color-border, #333);
    cursor: col-resize;
    flex-shrink: 0;
    transition: background-color 0.15s ease;
  }

  .sidebar-divider:hover {
    background: rgba(59, 130, 246, 0.5);
  }

  .sidebar-divider.resizing {
    background: rgba(59, 130, 246, 0.8);
  }

  .toolbar-frame {
    flex-shrink: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: #111827;
    padding: 0;
    overflow: hidden;
  }

  .toolbar-collapsed {
    flex-shrink: 0;
    width: 45px;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: #111827;
    border-right: 1px solid #374151;
  }

  .toolbar-expand-button {
    width: 100%;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    border: none;
    border-bottom: 1px solid #374151;
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toolbar-expand-button:hover {
    background-color: #1f2937;
    color: #d1d5db;
  }

  .toolbar-divider {
    width: 6px;
    background: var(--color-border, #333);
    cursor: col-resize;
    flex-shrink: 0;
    transition: background-color 0.15s ease;
  }

  .toolbar-divider:hover {
    background: rgba(59, 130, 246, 0.5);
  }

  .toolbar-divider.resizing {
    background: rgba(59, 130, 246, 0.8);
  }

  .sidebar-frame {
    flex-shrink: 0;
    position: relative;
    height: 100%;
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

  .scene-tab-wrapper {
    position: relative;
    display: inline-block;
  }

  .scene-menu-button {
    margin-left: 8px;
    padding: 2px 4px;
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 2px;
    transition: background-color 0.2s ease;
  }

  .scene-menu-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .scene-menu-button svg {
    display: block;
  }

  .scene-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    background-color: #1f2937;
    border: 1px solid #374151;
    border-radius: 6px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    z-index: 1000;
    min-width: 180px;
    overflow: hidden;
  }

  .dropdown-item {
    width: 100%;
    padding: 10px 16px;
    background: transparent;
    border: none;
    color: #d1d5db;
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: background-color 0.15s ease;
  }

  .dropdown-item:hover {
    background-color: #374151;
  }

  .dropdown-item.danger {
    color: #ef4444;
  }

  .dropdown-item.danger:hover {
    background-color: rgba(239, 68, 68, 0.1);
  }

  .dropdown-item svg {
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    .campaign-content {
      flex-direction: column;
    }
  }
</style>
