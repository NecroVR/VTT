<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Scene, Token, Wall, AmbientLight, FogGrid } from '@vtt/shared';
  import { lightsStore } from '$lib/stores/lights';
  import { fogStore } from '$lib/stores/fog';
  import { websocket } from '$lib/stores/websocket';
  import SceneContextMenu from './SceneContextMenu.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';
  import { computeViewport, breakIntersections } from 'visibility-polygon';

  // Props
  export let scene: Scene;
  export let tokens: Token[] = [];
  export let walls: Wall[] = [];
  export let isGM: boolean = false;
  export let activeTool: string = 'select';
  export let gridSnap: boolean = false;
  export let onTokenMove: ((tokenId: string, x: number, y: number) => void) | undefined = undefined;
  export let onTokenSelect: ((tokenId: string | null) => void) | undefined = undefined;
  export let onTokenDoubleClick: ((tokenId: string) => void) | undefined = undefined;
  export let onWallAdd: ((wall: { x1: number; y1: number; x2: number; y2: number }) => void) | undefined = undefined;
  export let onWallRemove: ((wallId: string) => void) | undefined = undefined;
  export let onWallUpdate: ((wallId: string, updates: Partial<Wall>) => void) | undefined = undefined;
  export let onTokenAdd: ((tokenData: any) => void) | undefined = undefined;
  export let onLightAdd: ((lightData: { x: number; y: number }) => void) | undefined = undefined;
  export let onLightSelect: ((lightId: string | null) => void) | undefined = undefined;
  export let onLightDoubleClick: ((lightId: string) => void) | undefined = undefined;
  export let onLightMove: ((lightId: string, x: number, y: number) => void) | undefined = undefined;

  // Canvas refs
  let canvasContainer: HTMLDivElement;
  let backgroundCanvas: HTMLCanvasElement;
  let gridCanvas: HTMLCanvasElement;
  let tokensCanvas: HTMLCanvasElement;
  let lightingCanvas: HTMLCanvasElement;
  let fogCanvas: HTMLCanvasElement;
  let wallsCanvas: HTMLCanvasElement;
  let controlsCanvas: HTMLCanvasElement;

  let backgroundCtx: CanvasRenderingContext2D | null = null;
  let gridCtx: CanvasRenderingContext2D | null = null;
  let tokensCtx: CanvasRenderingContext2D | null = null;
  let lightingCtx: CanvasRenderingContext2D | null = null;
  let fogCtx: CanvasRenderingContext2D | null = null;
  let wallsCtx: CanvasRenderingContext2D | null = null;
  let controlsCtx: CanvasRenderingContext2D | null = null;

  // View state
  let viewX = scene.initialX ?? 0;
  let viewY = scene.initialY ?? 0;
  let scale = scene.initialScale ?? 1;

  // Interaction state
  let isPanning = false;
  let isDraggingToken = false;
  let isDraggingLight = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let selectedTokenId: string | null = null;
  let selectedLightId: string | null = null;
  let draggedTokenId: string | null = null;
  let draggedLightId: string | null = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  // Wall drawing state
  let isDrawingWall = false;
  let wallStartPoint: { x: number; y: number } | null = null;
  let wallPreview: { x1: number; y1: number; x2: number; y2: number } | null = null;
  let selectedWallId: string | null = null;
  let hoveredWallId: string | null = null;

  // Double-click detection
  let lastClickTime = 0;
  let lastClickTokenId: string | null = null;
  let lastClickLightId: string | null = null;
  const DOUBLE_CLICK_THRESHOLD = 300; // ms

  // Context menu state
  let showContextMenu = false;
  let contextMenuX = 0;
  let contextMenuY = 0;
  let contextMenuElementType: 'token' | 'light' | 'wall' | null = null;
  let contextMenuElementId: string | null = null;
  let contextMenuElementVisible = true;

  // Delete confirmation dialog state
  let showDeleteDialog = false;
  let deleteDialogTitle = '';
  let deleteDialogMessage = '';

  // Token possession state (GM only)
  let possessedTokenId: string | null = null;

  // Drag-and-drop state
  let isDragOver = false;

  // Background image state
  let backgroundImage: HTMLImageElement | null = null;
  let imageLoadingState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';
  let imageErrorMessage: string | null = null;
  let currentImageUrl: string | null = null;

  // Image cache (module-level to persist across component instances)
  const imageCache = new Map<string, HTMLImageElement>();

  // Token image cache
  const tokenImageCache = new Map<string, HTMLImageElement>();
  const tokenImageLoadingState = new Map<string, 'loading' | 'loaded' | 'error'>();

  // Animation state
  let animationFrameId: number | null = null;
  let animationTime = 0;

  const MIN_SCALE = 0.25;
  const MAX_SCALE = 4;

  // Performance optimization: Layer caching
  let backgroundCached = false;
  let gridCached = false;
  let backgroundNeedsUpdate = true;
  let gridNeedsUpdate = true;

  // Performance optimization: Visibility cache
  let visibilityCache = new Map<string, Point[]>();
  let visibilityCacheValid = false;

  // Debug: Track light rendering issues (set to true to enable verbose console logging)
  const DEBUG_LIGHTS = false; // Disabled - re-enable for debugging light issues
  let debugLightFrame = 0;

  // Performance optimization: Animation throttling
  const TARGET_FPS = 30;
  const FRAME_TIME = 1000 / TARGET_FPS;
  let lastAnimationTime = 0;

  // Subscribe to lights store
  $: lights = Array.from($lightsStore.lights.values()).filter(light => light.sceneId === scene.id);

  // Subscribe to fog store
  $: fogData = scene ? $fogStore.fog.get(scene.id) : undefined;

  onMount(() => {
    initializeCanvases();
    loadBackgroundImage();
    resizeCanvases();
    render();
    startAnimationLoop();

    window.addEventListener('resize', resizeCanvases);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', resizeCanvases);
      window.removeEventListener('keydown', handleKeyDown);
      stopAnimationLoop();
    };
  });

  onDestroy(() => {
    stopAnimationLoop();
  });

  // Watch for background image URL changes only
  $: if (scene.backgroundImage !== currentImageUrl) {
    loadBackgroundImage();
    backgroundNeedsUpdate = true;
  }

  // Watch for background dimension changes
  $: if (scene.backgroundWidth || scene.backgroundHeight) {
    backgroundNeedsUpdate = true;
  }

  // Watch for grid setting changes
  $: if (scene.gridSize || scene.gridColor || scene.gridAlpha || scene.gridType || scene.gridVisible !== undefined || scene.gridLineWidth) {
    gridNeedsUpdate = true;
  }

  // Track walls for reactivity - use JSON to detect content changes
  let lastWallsJson = '';
  $: wallsJson = JSON.stringify(walls.map(w => ({ id: w.id, x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2, sense: w.sense })));

  // Watch for scene ID changes (clear caches when switching scenes)
  $: if (scene.id) {
    visibilityCache.clear();
    visibilityCacheValid = false;
    lastWallsJson = '';  // Reset wall tracking
  }

  // Watch for other scene changes (re-render without reloading image)
  $: if (scene) {
    render();
  }

  // Watch for token changes
  $: if (tokens) {
    renderTokens();
  }

  // Watch for wall changes - detect any change in wall data
  $: if (wallsJson !== lastWallsJson) {
    lastWallsJson = wallsJson;
    visibilityCache.clear();  // Force clear on any wall change
    visibilityCacheValid = false;
    if (isGM) {
      renderWalls();
    }
    renderLights();
  }

  // Watch for light changes - render without full cache invalidation
  // (new lights get cache miss by ID, moved lights get cache miss by position)
  $: if (lights) {
    renderLights();
  }

  // Watch for fog changes
  $: if (scene.fogExploration && fogData) {
    renderFog();
  }

  // Update explored areas when tokens move (with vision enabled)
  $: if (scene.fogExploration && tokens && !isGM) {
    updateExploredAreas();
  }

  function initializeCanvases() {
    backgroundCtx = backgroundCanvas.getContext('2d');
    gridCtx = gridCanvas.getContext('2d');
    tokensCtx = tokensCanvas.getContext('2d');
    lightingCtx = lightingCanvas.getContext('2d');
    fogCtx = fogCanvas ? fogCanvas.getContext('2d') : null;
    wallsCtx = wallsCanvas ? wallsCanvas.getContext('2d') : null;
    controlsCtx = controlsCanvas.getContext('2d');

    // Load fog data when canvas initializes
    if (scene && scene.fogExploration) {
      fogStore.loadFog(scene.id);
    }
  }

  function resizeCanvases() {
    if (!canvasContainer) return;

    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight;

    [backgroundCanvas, gridCanvas, tokensCanvas, lightingCanvas, controlsCanvas].forEach(canvas => {
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
    });

    if (fogCanvas) {
      fogCanvas.width = width;
      fogCanvas.height = height;
    }

    if (wallsCanvas) {
      wallsCanvas.width = width;
      wallsCanvas.height = height;
    }

    // Invalidate caches on resize
    backgroundNeedsUpdate = true;
    gridNeedsUpdate = true;

    render();
  }

  function loadBackgroundImage() {
    const imageUrl = scene.backgroundImage;

    // Update current URL tracker
    currentImageUrl = imageUrl || null;

    // Clear image if no URL provided
    if (!imageUrl) {
      backgroundImage = null;
      imageLoadingState = 'idle';
      imageErrorMessage = null;
      renderBackground();
      return;
    }

    // Check cache first
    const cachedImage = imageCache.get(imageUrl);
    if (cachedImage) {
      backgroundImage = cachedImage;
      imageLoadingState = 'loaded';
      imageErrorMessage = null;
      renderBackground();
      return;
    }

    // Load new image
    imageLoadingState = 'loading';
    imageErrorMessage = null;
    renderBackground(); // Show loading state

    const img = new Image();

    img.onload = () => {
      // Only update if this is still the current image URL
      if (imageUrl === currentImageUrl) {
        backgroundImage = img;
        imageLoadingState = 'loaded';
        imageErrorMessage = null;
        imageCache.set(imageUrl, img);
        renderBackground();
      }
    };

    img.onerror = (error) => {
      // Only update if this is still the current image URL
      if (imageUrl === currentImageUrl) {
        console.error('Failed to load background image:', imageUrl, error);
        backgroundImage = null;
        imageLoadingState = 'error';
        imageErrorMessage = `Failed to load image: ${imageUrl}`;
        renderBackground();
      }
    };

    img.src = imageUrl;
  }

  function loadTokenImage(imageUrl: string) {
    // Skip if no URL
    if (!imageUrl) return;

    // Check if already loaded or loading
    if (tokenImageCache.has(imageUrl) || tokenImageLoadingState.get(imageUrl) === 'loading') {
      return;
    }

    // Mark as loading
    tokenImageLoadingState.set(imageUrl, 'loading');

    const img = new Image();

    img.onload = () => {
      tokenImageCache.set(imageUrl, img);
      tokenImageLoadingState.set(imageUrl, 'loaded');
      renderTokens(); // Re-render tokens to show the loaded image
    };

    img.onerror = (error) => {
      console.error('Failed to load token image:', imageUrl, error);
      tokenImageLoadingState.set(imageUrl, 'error');
      renderTokens(); // Re-render tokens to show error state
    };

    img.src = imageUrl;
  }

  function render() {
    renderBackground();
    renderGrid();
    renderTokens();
    renderLights();
    if (scene.fogExploration && !isGM) {
      renderFog();
    }
    if (isGM) {
      renderWalls();
    }
    renderControls();
  }

  function renderBackground() {
    if (!backgroundCtx || !backgroundCanvas) return;

    // Performance optimization: Skip re-render if cached and no updates needed
    if (backgroundCached && !backgroundNeedsUpdate) {
      return;
    }

    backgroundCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    backgroundCtx.save();

    // Apply transform
    backgroundCtx.translate(-viewX * scale, -viewY * scale);
    backgroundCtx.scale(scale, scale);

    const sceneWidth = scene.backgroundWidth || 4000;
    const sceneHeight = scene.backgroundHeight || 4000;

    if (backgroundImage && imageLoadingState === 'loaded' && scene.backgroundWidth && scene.backgroundHeight) {
      // Draw loaded background image
      backgroundCtx.drawImage(backgroundImage, 0, 0, scene.backgroundWidth, scene.backgroundHeight);
    } else {
      // Draw default gray background
      backgroundCtx.fillStyle = '#2a2a2a';
      backgroundCtx.fillRect(0, 0, sceneWidth, sceneHeight);

      // Show loading or error state
      if (imageLoadingState === 'loading') {
        drawCenteredMessage('Loading background image...', sceneWidth, sceneHeight, '#4a90e2');
      } else if (imageLoadingState === 'error') {
        drawCenteredMessage('Failed to load background image', sceneWidth, sceneHeight, '#ef4444');
      }
    }

    backgroundCtx.restore();

    // Mark as cached and up to date
    backgroundCached = true;
    backgroundNeedsUpdate = false;
  }

  function drawCenteredMessage(message: string, width: number, height: number, color: string) {
    if (!backgroundCtx) return;

    const centerX = width / 2;
    const centerY = height / 2;

    backgroundCtx.fillStyle = color;
    backgroundCtx.font = `${24 / scale}px sans-serif`;
    backgroundCtx.textAlign = 'center';
    backgroundCtx.textBaseline = 'middle';
    backgroundCtx.fillText(message, centerX, centerY);
  }

  function renderGrid() {
    if (!gridCtx || !gridCanvas) return;

    // Performance optimization: Skip re-render if cached and no updates needed
    if (gridCached && !gridNeedsUpdate) {
      return;
    }

    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    // Check if grid should be visible
    if (scene.gridVisible === false) {
      gridCached = true;
      gridNeedsUpdate = false;
      return;
    }

    gridCtx.save();

    // Apply transform
    gridCtx.translate(-viewX * scale, -viewY * scale);
    gridCtx.scale(scale, scale);

    const gridSize = scene.gridSize;
    const sceneWidth = scene.backgroundWidth || 4000;
    const sceneHeight = scene.backgroundHeight || 4000;

    gridCtx.strokeStyle = scene.gridColor;
    gridCtx.globalAlpha = scene.gridAlpha;
    gridCtx.lineWidth = (scene.gridLineWidth || 1) / scale; // Use configurable line width, keep constant in screen space

    if (scene.gridType === 'square') {
      // Draw vertical lines
      for (let x = 0; x <= sceneWidth; x += gridSize) {
        gridCtx.beginPath();
        gridCtx.moveTo(x, 0);
        gridCtx.lineTo(x, sceneHeight);
        gridCtx.stroke();
      }

      // Draw horizontal lines
      for (let y = 0; y <= sceneHeight; y += gridSize) {
        gridCtx.beginPath();
        gridCtx.moveTo(0, y);
        gridCtx.lineTo(sceneWidth, y);
        gridCtx.stroke();
      }
    } else if (scene.gridType === 'hex') {
      // Hex grid (pointy-top)
      renderHexGrid(gridCtx, sceneWidth, sceneHeight, gridSize);
    }

    gridCtx.restore();

    // Mark as cached and up to date
    gridCached = true;
    gridNeedsUpdate = false;
  }

  function renderHexGrid(ctx: CanvasRenderingContext2D, width: number, height: number, size: number) {
    const hexHeight = size;
    const hexWidth = (size * 2) / Math.sqrt(3);
    const hexVertDist = hexHeight * 0.75;

    for (let row = 0; row < height / hexVertDist + 2; row++) {
      for (let col = 0; col < width / hexWidth + 2; col++) {
        const x = col * hexWidth + (row % 2) * (hexWidth / 2);
        const y = row * hexVertDist;

        drawHexagon(ctx, x, y, size);
      }
    }
  }

  function drawHexagon(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, size: number) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6; // Start from top point
      const x = centerX + size * Math.cos(angle);
      const y = centerY + size * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }

  /**
   * Performance optimization: Check if entity is in viewport
   */
  function isInViewport(x: number, y: number, width: number, height: number): boolean {
    if (!backgroundCanvas) return true;

    const canvasWidth = backgroundCanvas.width;
    const canvasHeight = backgroundCanvas.height;

    const viewLeft = viewX;
    const viewTop = viewY;
    const viewRight = viewX + canvasWidth / scale;
    const viewBottom = viewY + canvasHeight / scale;

    // Check if entity bounds intersect viewport
    return !(x + width < viewLeft ||
             x > viewRight ||
             y + height < viewTop ||
             y > viewBottom);
  }

  /**
   * Performance optimization: Invalidate visibility cache
   */
  function invalidateVisibilityCache() {
    visibilityCacheValid = false;
  }

  /**
   * Performance optimization: Get cached visibility polygon
   * Cache key includes position and radius so moved lights get fresh polygons
   */
  function getVisibilityPolygon(sourceId: string, x: number, y: number, radius: number): Point[] {
    // Use floor + 0.5 to center on pixel - MUST match renderLight and renderClippedLight
    const adjustedX = Math.floor(x) + 0.5;
    const adjustedY = Math.floor(y) + 0.5;
    const roundedRadius = Math.round(radius);

    // Early exit: if no walls are within range, skip polygon computation
    if (!hasWallsInRange({ x: adjustedX, y: adjustedY }, walls, roundedRadius)) {
      return [];
    }

    // Cache key uses floor values (all positions in same pixel share visibility polygon)
    const cacheKey = `${sourceId}-${Math.floor(x)}-${Math.floor(y)}-${roundedRadius}`;

    if (visibilityCacheValid && visibilityCache.has(cacheKey)) {
      if (DEBUG_LIGHTS && debugLightFrame % 60 === 0) {
        console.log(`[Light Debug] Cache HIT for ${sourceId.slice(-12)}: ${cacheKey.slice(-30)}`);
      }
      return visibilityCache.get(cacheKey)!;
    }

    if (DEBUG_LIGHTS && debugLightFrame % 60 === 0) {
      console.log(`[Light Debug] Cache MISS for ${sourceId.slice(-12)}: ${cacheKey.slice(-30)}`);
    }

    // Use adjusted coordinates for polygon computation
    const polygon = computeVisibilityPolygon({ x: adjustedX, y: adjustedY }, walls, roundedRadius);
    visibilityCache.set(cacheKey, polygon);

    return polygon;
  }

  function renderTokens() {
    if (!tokensCtx || !tokensCanvas) return;

    tokensCtx.clearRect(0, 0, tokensCanvas.width, tokensCanvas.height);
    tokensCtx.save();

    // Apply transform
    tokensCtx.translate(-viewX * scale, -viewY * scale);
    tokensCtx.scale(scale, scale);

    // Get possessed token for vision-based filtering
    const possessedToken = possessedTokenId ? tokens.find(t => t.id === possessedTokenId) : null;

    // Compute vision polygon if needed for vision-based token hiding
    let visionPolygon: Point[] | null = null;
    // Apply vision hiding for: (1) non-GM players, or (2) GMs who are possessing a token to preview player view
    const shouldApplyVisionHiding = (!isGM || possessedTokenId) && !scene.globalLight && possessedToken && scene.tokenVision && possessedToken.vision && possessedToken.visionRange > 0;

    if (shouldApplyVisionHiding && possessedToken) {
      const tokenWidth = (possessedToken.width || 1) * scene.gridSize;
      const tokenHeight = (possessedToken.height || 1) * scene.gridSize;
      const tokenCenterX = possessedToken.x + tokenWidth / 2;
      const tokenCenterY = possessedToken.y + tokenHeight / 2;
      const visionRadius = possessedToken.visionRange * scene.gridSize;

      // Compute visibility polygon for wall occlusion
      visionPolygon = computeVisibilityPolygon(
        { x: tokenCenterX, y: tokenCenterY },
        walls,
        visionRadius
      );
    }

    // Performance optimization: Filter to only visible tokens in viewport
    const visibleTokens = tokens.filter(token => {
      if (!token.visible) return false;

      const width = (token.width || 1) * scene.gridSize;
      const height = (token.height || 1) * scene.gridSize;

      // Check viewport visibility
      if (!isInViewport(token.x, token.y, width, height)) {
        return false;
      }

      // Apply vision-based token hiding for players with possessed tokens
      if (shouldApplyVisionHiding && possessedToken) {
        // Always show the possessed token itself
        if (token.id === possessedTokenId) {
          return true;
        }

        // Check if token is within vision range
        const tokenCenterX = token.x + width / 2;
        const tokenCenterY = token.y + height / 2;
        const possessedWidth = (possessedToken.width || 1) * scene.gridSize;
        const possessedHeight = (possessedToken.height || 1) * scene.gridSize;
        const possessedCenterX = possessedToken.x + possessedWidth / 2;
        const possessedCenterY = possessedToken.y + possessedHeight / 2;

        const dx = tokenCenterX - possessedCenterX;
        const dy = tokenCenterY - possessedCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const visionRangePixels = possessedToken.visionRange * scene.gridSize;

        // Token must be within vision range
        if (distance > visionRangePixels) {
          return false;
        }

        // If we have a vision polygon (wall occlusion), check if token center is visible
        if (visionPolygon && visionPolygon.length > 0) {
          if (!isPointInPolygon({ x: tokenCenterX, y: tokenCenterY }, visionPolygon)) {
            return false;
          }
        }
      }

      return true;
    });

    visibleTokens.forEach(token => {

      const x = token.x;
      const y = token.y;
      const width = (token.width || 1) * scene.gridSize;
      const height = (token.height || 1) * scene.gridSize;
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const radius = width / 2;

      // Load token image if it has one and isn't loaded yet
      if (token.imageUrl) {
        loadTokenImage(token.imageUrl);
      }

      // Get token image if available and loaded
      const tokenImage = token.imageUrl ? tokenImageCache.get(token.imageUrl) : null;
      const imageState = token.imageUrl ? tokenImageLoadingState.get(token.imageUrl) : null;

      // Render vision indicator before the token (if selected)
      if (selectedTokenId === token.id) {
        renderTokenVision(tokensCtx, token);
      }

      // Create circular clipping path
      tokensCtx.save();
      tokensCtx.beginPath();
      tokensCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      tokensCtx.clip();

      if (tokenImage && imageState === 'loaded') {
        // Draw token image (circular clipped)
        // Calculate aspect ratio to cover the circle
        const imgAspect = tokenImage.width / tokenImage.height;
        let drawWidth, drawHeight;

        if (imgAspect > 1) {
          // Image is wider than tall
          drawHeight = height;
          drawWidth = height * imgAspect;
        } else {
          // Image is taller than wide
          drawWidth = width;
          drawHeight = width / imgAspect;
        }

        // Center the image
        const drawX = centerX - drawWidth / 2;
        const drawY = centerY - drawHeight / 2;

        tokensCtx.drawImage(tokenImage, drawX, drawY, drawWidth, drawHeight);
      } else {
        // Fallback to colored circle
        tokensCtx.fillStyle = imageState === 'error' ? '#ef4444' : '#4a90e2';
        tokensCtx.fill();

        // Draw token name on colored circle
        tokensCtx.fillStyle = '#ffffff';
        tokensCtx.font = `${12 / scale}px sans-serif`;
        tokensCtx.textAlign = 'center';
        tokensCtx.textBaseline = 'middle';
        tokensCtx.fillText(token.name, centerX, centerY);
      }

      tokensCtx.restore();

      // Draw selection highlight (outside the clip)
      tokensCtx.strokeStyle = selectedTokenId === token.id ? '#fbbf24' : '#ffffff';
      tokensCtx.lineWidth = 2 / scale;
      tokensCtx.beginPath();
      tokensCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      tokensCtx.stroke();

      // Draw error indicator for failed images
      if (imageState === 'error') {
        tokensCtx.fillStyle = '#ef4444';
        tokensCtx.font = `${10 / scale}px sans-serif`;
        tokensCtx.textAlign = 'center';
        tokensCtx.textBaseline = 'top';
        tokensCtx.fillText('!', centerX, y + height + 2);
      }
    });

    tokensCtx.restore();
  }

  /**
   * Draw a door on the canvas with visual state (open/closed/locked)
   */
  function renderDoor(ctx: CanvasRenderingContext2D, wall: Wall) {
    const { x1, y1, x2, y2, door, doorState } = wall;

    // Calculate door center and dimensions
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const doorWidth = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    if (doorState === 'open') {
      // Draw open door - dashed blue line
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3 / scale;
      ctx.setLineDash([10 / scale, 5 / scale]);
      ctx.beginPath();
      ctx.moveTo(-doorWidth/2, 0);
      ctx.lineTo(doorWidth/2, 0);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw open door icon
      drawOpenDoorIcon(ctx, door);
    } else if (doorState === 'locked') {
      // Draw locked door - solid red line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4 / scale;
      ctx.beginPath();
      ctx.moveTo(-doorWidth/2, 0);
      ctx.lineTo(doorWidth/2, 0);
      ctx.stroke();

      // Draw lock icon
      drawLockIcon(ctx);
    } else {
      // Closed door - solid amber line
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4 / scale;
      ctx.beginPath();
      ctx.moveTo(-doorWidth/2, 0);
      ctx.lineTo(doorWidth/2, 0);
      ctx.stroke();

      // Draw closed door icon
      drawClosedDoorIcon(ctx, door);
    }

    ctx.restore();
  }

  /**
   * Draw a closed door icon (single or double)
   */
  function drawClosedDoorIcon(ctx: CanvasRenderingContext2D, doorType: string) {
    const iconSize = 8 / scale;

    ctx.fillStyle = '#fbbf24';

    if (doorType === 'double') {
      // Two small rectangles for double door
      ctx.fillRect(-iconSize/2 - 1/scale, -iconSize/2, iconSize/2 - 1/scale, iconSize);
      ctx.fillRect(1/scale, -iconSize/2, iconSize/2 - 1/scale, iconSize);
    } else {
      // Single rectangle for single door
      ctx.fillRect(-iconSize/2, -iconSize/2, iconSize, iconSize);
    }
  }

  /**
   * Draw an open door icon (single or double)
   */
  function drawOpenDoorIcon(ctx: CanvasRenderingContext2D, doorType: string) {
    const iconSize = 8 / scale;

    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1.5 / scale;

    if (doorType === 'double') {
      // Two door frames for double door
      ctx.strokeRect(-iconSize/2 - 1/scale, -iconSize/2, iconSize/2 - 1/scale, iconSize);
      ctx.strokeRect(1/scale, -iconSize/2, iconSize/2 - 1/scale, iconSize);
    } else {
      // Single door frame
      ctx.strokeRect(-iconSize/2, -iconSize/2, iconSize, iconSize);
    }
  }

  /**
   * Draw a lock icon for locked doors
   */
  function drawLockIcon(ctx: CanvasRenderingContext2D) {
    const size = 6 / scale;

    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5 / scale;

    // Lock body (filled rectangle)
    ctx.fillRect(-size/2, -size/4, size, size/2);

    // Lock shackle (arc)
    ctx.beginPath();
    ctx.arc(0, -size/4, size/3, Math.PI, 0, false);
    ctx.stroke();
  }

  function renderWalls() {
    if (!wallsCtx || !wallsCanvas) return;

    wallsCtx.clearRect(0, 0, wallsCanvas.width, wallsCanvas.height);
    wallsCtx.save();

    // Apply transform
    wallsCtx.translate(-viewX * scale, -viewY * scale);
    wallsCtx.scale(scale, scale);

    // Render existing walls
    walls.forEach(wall => {
      const isSelected = wall.id === selectedWallId;
      const isHovered = wall.id === hoveredWallId;

      // Draw selection/hover glow
      if (isSelected || isHovered) {
        wallsCtx.strokeStyle = isSelected ? '#fbbf24' : '#60a5fa';
        wallsCtx.lineWidth = 6 / scale;
        wallsCtx.globalAlpha = 0.5;

        wallsCtx.beginPath();
        wallsCtx.moveTo(wall.x1, wall.y1);
        wallsCtx.lineTo(wall.x2, wall.y2);
        wallsCtx.stroke();

        wallsCtx.globalAlpha = 1.0;
      }

      // Render door or normal wall
      if (wall.door !== 'none') {
        renderDoor(wallsCtx, wall);
      } else {
        // Draw normal wall
        wallsCtx.strokeStyle = '#ef4444';
        wallsCtx.lineWidth = 3 / scale;

        wallsCtx.beginPath();
        wallsCtx.moveTo(wall.x1, wall.y1);
        wallsCtx.lineTo(wall.x2, wall.y2);
        wallsCtx.stroke();
      }

      // Draw endpoints for selected wall
      if (isSelected) {
        wallsCtx.fillStyle = '#fbbf24';
        const endpointRadius = 4 / scale;

        wallsCtx.beginPath();
        wallsCtx.arc(wall.x1, wall.y1, endpointRadius, 0, Math.PI * 2);
        wallsCtx.fill();

        wallsCtx.beginPath();
        wallsCtx.arc(wall.x2, wall.y2, endpointRadius, 0, Math.PI * 2);
        wallsCtx.fill();
      }
    });

    // Render wall preview
    if (wallPreview) {
      wallsCtx.strokeStyle = '#fbbf24';
      wallsCtx.lineWidth = 3 / scale;
      wallsCtx.globalAlpha = 0.7;
      wallsCtx.setLineDash([10 / scale, 5 / scale]);

      wallsCtx.beginPath();
      wallsCtx.moveTo(wallPreview.x1, wallPreview.y1);
      wallsCtx.lineTo(wallPreview.x2, wallPreview.y2);
      wallsCtx.stroke();

      wallsCtx.setLineDash([]);
      wallsCtx.globalAlpha = 1.0;

      // Draw preview endpoints
      wallsCtx.fillStyle = '#fbbf24';
      const endpointRadius = 4 / scale;

      wallsCtx.beginPath();
      wallsCtx.arc(wallPreview.x1, wallPreview.y1, endpointRadius, 0, Math.PI * 2);
      wallsCtx.fill();

      wallsCtx.beginPath();
      wallsCtx.arc(wallPreview.x2, wallPreview.y2, endpointRadius, 0, Math.PI * 2);
      wallsCtx.fill();
    }

    wallsCtx.restore();
  }

  function hexToRgba(hex: string, alpha: number): string {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse hex color
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Seeded random number generator for deterministic sparks
  function createSeededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x7fffffff;
    };
  }

  // String hash for light ID
  function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  interface Spark {
    x: number;
    y: number;
    color: string;
    birthTime: number;
    lifetime: number;
    size: number;
  }

  interface SparkleConfig {
    sparkleColors?: string[];
    sparkleCount?: number;
    sparkleSize?: number;
    sparkleLifetime?: number;
    sparkleFade?: boolean;
    sparkleDistribution?: 'uniform' | 'center-weighted' | 'edge-weighted';
  }

  function getSparkleConfig(light: AmbientLight): SparkleConfig {
    const data = light.data as SparkleConfig | undefined;
    return {
      sparkleColors: data?.sparkleColors,
      sparkleCount: data?.sparkleCount,
      sparkleSize: data?.sparkleSize,
      sparkleLifetime: data?.sparkleLifetime,
      sparkleFade: data?.sparkleFade,
      sparkleDistribution: data?.sparkleDistribution
    };
  }

  function generateSparkPosition(
    radius: number,
    distribution: string,
    rng: () => number
  ): { x: number; y: number } {
    const angle = rng() * Math.PI * 2;
    let distance: number;

    switch (distribution) {
      case 'center-weighted':
        distance = Math.sqrt(rng()) * radius * 0.7;
        break;
      case 'edge-weighted':
        distance = (0.5 + rng() * 0.5) * radius;
        break;
      case 'uniform':
      default:
        distance = Math.sqrt(rng()) * radius;
    }

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  }

  function generateSparks(light: AmbientLight, time: number): Spark[] {
    const config = getSparkleConfig(light);
    const sparkleCount = config.sparkleCount ?? 10;
    const sparkleLifetime = config.sparkleLifetime ?? 1000;
    const colors = config.sparkleColors?.length ? config.sparkleColors : [light.color];
    const sparkleSize = config.sparkleSize ?? 3;
    const distribution = config.sparkleDistribution ?? 'uniform';

    const seed = hashString(light.id);
    const sparks: Spark[] = [];

    for (let i = 0; i < sparkleCount; i++) {
      const slotOffset = (i / sparkleCount) * sparkleLifetime;
      const cycleTime = sparkleLifetime;
      const adjustedTime = time + slotOffset;
      const cycleNumber = Math.floor(adjustedTime / cycleTime);
      const birthTime = cycleNumber * cycleTime - slotOffset;
      const age = time - birthTime;

      if (age < 0 || age > sparkleLifetime) continue;

      const sparkSeed = seed + cycleNumber * 1000 + i;
      const sparkRng = createSeededRandom(sparkSeed);

      const position = generateSparkPosition(light.dim, distribution, sparkRng);
      const colorIndex = Math.floor(sparkRng() * colors.length);

      sparks.push({
        x: position.x,
        y: position.y,
        color: colors[colorIndex],
        birthTime,
        lifetime: sparkleLifetime,
        size: sparkleSize * (0.7 + sparkRng() * 0.6)
      });
    }

    return sparks;
  }

  // Wall occlusion helpers
  interface Point {
    x: number;
    y: number;
  }

  interface Segment {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }

  function lineIntersection(
    p1: Point,
    p2: Point,
    p3: Point,
    p4: Point
  ): Point | null {
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
    const x4 = p4.x, y4 = p4.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 0.0001) return null; // Parallel or coincident

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      };
    }

    return null;
  }

  function castRay(
    origin: Point,
    angle: number,
    walls: Segment[],
    maxDistance: number
  ): Point {
    const rayEnd: Point = {
      x: origin.x + Math.cos(angle) * maxDistance,
      y: origin.y + Math.sin(angle) * maxDistance
    };

    let closestPoint = rayEnd;
    let closestDist = maxDistance;

    for (const wall of walls) {
      const intersection = lineIntersection(
        origin,
        rayEnd,
        { x: wall.x1, y: wall.y1 },
        { x: wall.x2, y: wall.y2 }
      );

      if (intersection) {
        const dx = intersection.x - origin.x;
        const dy = intersection.y - origin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < closestDist) {
          closestDist = dist;
          closestPoint = intersection;
        }
      }
    }

    return closestPoint;
  }

  /**
   * Check if any walls are within range of a point
   * Used to skip visibility polygon computation when no walls affect the light
   */
  function hasWallsInRange(source: Point, walls: Wall[], maxRadius: number): boolean {
    const radiusSq = maxRadius * maxRadius;

    for (const wall of walls) {
      // Check if wall has blocking sense
      const effectiveProps = getEffectiveWallProperties(wall);
      if (effectiveProps.sense !== 'block') continue;

      // Check if either endpoint is within radius
      const d1Sq = (wall.x1 - source.x) ** 2 + (wall.y1 - source.y) ** 2;
      const d2Sq = (wall.x2 - source.x) ** 2 + (wall.y2 - source.y) ** 2;
      if (d1Sq <= radiusSq || d2Sq <= radiusSq) return true;

      // Check if wall segment passes through the circle
      // Project source point onto wall line segment
      const dx = wall.x2 - wall.x1;
      const dy = wall.y2 - wall.y1;
      const lengthSq = dx * dx + dy * dy;
      if (lengthSq === 0) continue;

      const t = Math.max(0, Math.min(1, ((source.x - wall.x1) * dx + (source.y - wall.y1) * dy) / lengthSq));
      const closestX = wall.x1 + t * dx;
      const closestY = wall.y1 + t * dy;
      const distSq = (source.x - closestX) ** 2 + (source.y - closestY) ** 2;
      if (distSq <= radiusSq) return true;
    }

    return false;
  }

  function computeVisibilityPolygon(
    source: Point,
    walls: Wall[],
    maxRadius: number
  ): Point[] {
    // Filter walls to only blocking ones (respects door open/close state)
    const blockingWalls = walls.filter(w => {
      const effectiveProps = getEffectiveWallProperties(w);
      return effectiveProps.sense === 'block';
    });

    // If no blocking walls, return empty array (caller should skip clipping)
    if (blockingWalls.length === 0) {
      return [];
    }

    // Convert walls to visibility-polygon segment format: [[x1, y1], [x2, y2]]
    // Create fresh arrays to avoid any mutation issues with the library
    const segments: [number, number][][] = blockingWalls.map(w => [
      [w.x1, w.y1] as [number, number],
      [w.x2, w.y2] as [number, number]
    ]);

    // Define viewport bounds (light radius circle bounding box)
    const viewportMin: [number, number] = [source.x - maxRadius, source.y - maxRadius];
    const viewportMax: [number, number] = [source.x + maxRadius, source.y + maxRadius];

    // Debug: Check if walls have valid coordinates
    if (DEBUG_LIGHTS && debugLightFrame % 60 === 0) {
      const invalidWalls = blockingWalls.filter(w =>
        !isFinite(w.x1) || !isFinite(w.y1) || !isFinite(w.x2) || !isFinite(w.y2)
      );
      if (invalidWalls.length > 0) {
        console.error(`[Light Debug] Found ${invalidWalls.length} walls with invalid coordinates!`);
      }
    }

    // IMPORTANT: Use breakIntersections to handle intersecting wall segments
    // The visibility-polygon library requires non-intersecting segments to work correctly
    // Without this, if walls intersect, the library may produce incorrect/empty polygons
    const processedSegments = breakIntersections(segments);

    // Compute visibility polygon using the library
    // computeViewport is faster when many segments are outside the viewport
    let polygonTuples: [number, number][];
    try {
      polygonTuples = computeViewport(
        [source.x, source.y],
        processedSegments,
        viewportMin,
        viewportMax
      );
    } catch (error) {
      console.error(`[Light Debug] computeViewport FAILED for source=(${source.x.toFixed(1)},${source.y.toFixed(1)}):`, error);
      return []; // Return empty to render light without clipping
    }

    // Debug: Log if polygon has very few vertices or seems degenerate
    if (DEBUG_LIGHTS && debugLightFrame % 60 === 0) {
      if (polygonTuples.length < 3) {
        console.warn(`[Light Debug] computeVisibilityPolygon: degenerate polygon with ${polygonTuples.length} vertices! source=(${source.x.toFixed(1)},${source.y.toFixed(1)}), segments=${segments.length}`);
      }
    }

    // If polygon has fewer than 3 vertices, it's degenerate - return empty to skip clipping
    if (polygonTuples.length < 3) {
      return [];
    }

    // Convert from [x, y] tuples back to {x, y} Point objects
    const polygon = polygonTuples.map(([x, y]) => ({ x, y }));

    // Validate: Check if source point is inside the polygon
    // If not, the polygon is invalid for this light and we should skip clipping
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      if (((yi > source.y) !== (yj > source.y)) && (source.x < (xj - xi) * (source.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    if (!inside) {
      if (DEBUG_LIGHTS) {
        console.warn(`[Light Debug] computeVisibilityPolygon: source NOT inside polygon! Returning empty. source=(${source.x.toFixed(1)},${source.y.toFixed(1)}), verts=${polygon.length}`);
      }
      // Return empty so the light renders without clipping rather than being invisible
      return [];
    }

    return polygon;
  }

  /**
   * Convert hex color to HSL
   */
  function hexToHSL(hex: string): { h: number; s: number; l: number } {
    hex = hex.replace(/^#/, "");
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (diff !== 0) {
      s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / diff + 2) / 6;
          break;
        case b:
          h = ((r - g) / diff + 4) / 6;
          break;
      }
    }
    return { h, s, l };
  }

  /**
   * Convert HSL to RGB
   */
  function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  /**
   * Shift hue by specified amount (0-1 range)
   */
  function shiftHue(hexColor: string, hueShift: number): string {
    const hsl = hexToHSL(hexColor);
    let newHue = (hsl.h + hueShift) % 1;
    if (newHue < 0) newHue += 1;
    const rgb = hslToRgb(newHue, hsl.s, hsl.l);
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }


  function renderClippedLight(
    ctx: CanvasRenderingContext2D,
    source: Point,
    maxRadius: number,
    visibilityPolygon: Point[],
    renderCallback: () => void,
    lightId?: string
  ) {
    if (visibilityPolygon.length === 0) {
      if (DEBUG_LIGHTS && debugLightFrame % 60 === 0) {
        console.log(`[Light Debug] renderClippedLight id=${lightId?.slice(-8)} SKIPPED: empty polygon`);
      }
      return;
    }

    // Debug: Check if source is inside the polygon
    if (DEBUG_LIGHTS && debugLightFrame % 60 === 0) {
      // Simple point-in-polygon check using winding number
      let inside = false;
      for (let i = 0, j = visibilityPolygon.length - 1; i < visibilityPolygon.length; j = i++) {
        const xi = visibilityPolygon[i].x, yi = visibilityPolygon[i].y;
        const xj = visibilityPolygon[j].x, yj = visibilityPolygon[j].y;
        if (((yi > source.y) !== (yj > source.y)) && (source.x < (xj - xi) * (source.y - yi) / (yj - yi) + xi)) {
          inside = !inside;
        }
      }
      if (!inside) {
        console.warn(`[Light Debug] WARNING: id=${lightId?.slice(-8)} source NOT inside polygon! source=(${source.x.toFixed(1)},${source.y.toFixed(1)})`);
        // Log first few polygon vertices
        const sample = visibilityPolygon.slice(0, 4).map(p => `(${p.x.toFixed(0)},${p.y.toFixed(0)})`).join(', ');
        console.warn(`[Light Debug]   polygon vertices (first 4): ${sample}`);
      }
    }

    ctx.save();

    // Expand the clipping polygon slightly outward from the light center
    // This ensures the light center is always inside the clipping region
    // while walls still properly occlude the light edges
    const CLIP_EXPANSION = 0.5;

    ctx.beginPath();

    // Calculate expanded vertex for the first point
    const firstVertex = visibilityPolygon[0];
    const firstDx = firstVertex.x - source.x;
    const firstDy = firstVertex.y - source.y;
    const firstDist = Math.sqrt(firstDx * firstDx + firstDy * firstDy);

    if (firstDist > 0.1) {
      const firstRatio = (firstDist + CLIP_EXPANSION) / firstDist;
      const firstExpandedX = source.x + firstDx * firstRatio;
      const firstExpandedY = source.y + firstDy * firstRatio;
      ctx.moveTo(firstExpandedX, firstExpandedY);
    } else {
      ctx.moveTo(firstVertex.x, firstVertex.y);
    }

    // Expand and add remaining vertices
    for (let i = 1; i < visibilityPolygon.length; i++) {
      const vertex = visibilityPolygon[i];
      const dx = vertex.x - source.x;
      const dy = vertex.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.1) {
        const ratio = (dist + CLIP_EXPANSION) / dist;
        const expandedX = source.x + dx * ratio;
        const expandedY = source.y + dy * ratio;
        ctx.lineTo(expandedX, expandedY);
      } else {
        ctx.lineTo(vertex.x, vertex.y);
      }
    }

    ctx.closePath();
    ctx.clip();

    // Render light within clipped area
    renderCallback();

    ctx.restore();
  }

  function renderLight(ctx: CanvasRenderingContext2D, light: AmbientLight, time: number) {
    // Use floor + 0.5 to center on pixel and avoid exact grid boundaries
    // This prevents edge cases when light is at grid cell corners
    const x = Math.floor(light.x) + 0.5;
    const y = Math.floor(light.y) + 0.5;
    const { bright, dim, color, alpha, angle, rotation, animationType, animationSpeed, animationIntensity, walls: wallsEnabled, hidden, negative } = light;

    // Skip hidden lights
    if (hidden) {
      if (DEBUG_LIGHTS && debugLightFrame % 60 === 0) {
        console.log(`[Light Debug] id=${light.id.slice(-8)} SKIPPED: hidden`);
      }
      return;
    }

    // Check darkness activation range
    const darknessMin = light.darknessMin ?? 0;
    const darknessMax = light.darknessMax ?? 1;
    const sceneDarkness = scene.darkness ?? 0;

    // Skip if scene darkness is outside this light's activation range
    if (sceneDarkness < darknessMin || sceneDarkness > darknessMax) {
      if (DEBUG_LIGHTS && debugLightFrame % 60 === 0) {
        console.log(`[Light Debug] id=${light.id.slice(-8)} SKIPPED: darkness range (scene=${sceneDarkness}, min=${darknessMin}, max=${darknessMax})`);
      }
      return;
    }

    // Performance optimization: Cull lights outside viewport
    if (!isInViewport(x - dim, y - dim, dim * 2, dim * 2)) {
      if (DEBUG_LIGHTS && debugLightFrame % 60 === 0) {
        console.log(`[Light Debug] id=${light.id.slice(-8)} SKIPPED: outside viewport`);
      }
      return;
    }

    // Calculate animated radius for animations
    let animatedBright = bright;
    let animatedDim = dim;

    if (animationType === 'torch') {
      // Torch flicker - random-like variation using sine waves at different frequencies
      const flicker = Math.sin(time * animationSpeed * 0.003) * 0.5 +
                     Math.sin(time * animationSpeed * 0.005) * 0.3 +
                     Math.sin(time * animationSpeed * 0.007) * 0.2;
      const intensity = animationIntensity / 100;
      animatedBright = bright * (1 + flicker * intensity * 0.15);
      animatedDim = dim * (1 + flicker * intensity * 0.15);
    } else if (animationType === 'pulse') {
      // Smooth pulse animation
      const pulse = Math.sin(time * animationSpeed * 0.002);
      const intensity = animationIntensity / 100;
      animatedBright = bright * (1 + pulse * intensity * 0.3);
      animatedDim = dim * (1 + pulse * intensity * 0.3);
    } else if (animationType === "chroma") {
      // Chroma animation - color cycling effect
      // Speed and intensity remain unchanged, color will be modified below
    } else if (animationType === "wave") {
      // Wave animation - ripple effect
      // Speed and intensity will be used in gradient rendering below
    } else if (animationType === 'sparkle') {
      // Sparkle uses base light settings, sparks rendered separately
    }

    // Round animated radii to fix canvas rendering issues with sub-pixel precision
    animatedBright = Math.round(animatedBright);
    animatedDim = Math.round(animatedDim);

    // Determine if we should apply wall occlusion based on light.walls property
    const visibilityPolygon = wallsEnabled
      ? getVisibilityPolygon(`light-${light.id}`, x, y, animatedDim)
      : null;

    // Debug logging for light rendering issues
    if (DEBUG_LIGHTS && debugLightFrame % 60 === 0) {
      const hasWalls = hasWallsInRange({ x, y }, walls, animatedDim);
      console.log(`[Light Debug] id=${light.id.slice(-8)}, pos=(${x.toFixed(0)},${y.toFixed(0)}), dim=${animatedDim}, alpha=${alpha}, wallsEnabled=${wallsEnabled}, hasWallsInRange=${hasWalls}, polygonVerts=${visibilityPolygon?.length ?? 'null'}`);

      // If polygon exists, log its bounding box
      if (visibilityPolygon && visibilityPolygon.length > 0) {
        const minX = Math.min(...visibilityPolygon.map(p => p.x));
        const maxX = Math.max(...visibilityPolygon.map(p => p.x));
        const minY = Math.min(...visibilityPolygon.map(p => p.y));
        const maxY = Math.max(...visibilityPolygon.map(p => p.y));
        const containsSource = x >= minX && x <= maxX && y >= minY && y <= maxY;
        console.log(`[Light Debug]   polygon bounds: (${minX.toFixed(0)},${minY.toFixed(0)}) to (${maxX.toFixed(0)},${maxY.toFixed(0)}), containsSource=${containsSource}`);
      }
    }

    // Determine if this is a darkness source (negative light)
    const isNegative = negative === true;

    // Define the rendering function for the light
    const renderLightGradient = () => {
      ctx.save();

      // Set composite operation based on light type
      if (isNegative) {
        // Darkness sources cut out existing light
        ctx.globalCompositeOperation = 'destination-out';
      }

      // If cone light, clip to cone shape
      if (angle < 360) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        const startAngle = (rotation - angle / 2) * Math.PI / 180;
        const endAngle = (rotation + angle / 2) * Math.PI / 180;
        ctx.arc(x, y, animatedDim, startAngle, endAngle);
        ctx.closePath();
        ctx.clip();
      }

      // Create radial gradient with attenuation-based falloff
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, animatedDim);

      // Apply chroma animation - shift hue over time
      let effectiveColor = color;
      if (animationType === "chroma") {
        const speed = animationSpeed / 5;
        const intensity = animationIntensity / 10;
        const hueShift = (time * speed * 0.001) % 1;
        effectiveColor = shiftHue(color, hueShift * intensity);
      }

      // Parse color and add alpha
      const baseColor = hexToRgba(effectiveColor, alpha);
      const dimColor = hexToRgba(effectiveColor, 0);

      // Get attenuation value (default 0.5 for smooth falloff)
      const attenuation = light.attenuation ?? 0.5;

      // Calculate normalized bright radius (0-1 range within dim radius)
      const brightStop = animatedBright > 0 && animatedDim > 0
        ? Math.min(1, animatedBright / animatedDim)
        : 0;

      // Wave animation overrides normal gradient
      if (animationType === "wave") {
        const speed = animationSpeed / 5;
        const intensity = animationIntensity / 10;
        const wavePhase = (time * speed * 0.002) % 1;
        
        // Add base gradient stops first
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(1, dimColor);
        
        // Create multiple wave rings on top
        const numRings = 3;
        for (let i = 0; i < numRings; i++) {
          const ringPhase = (wavePhase + i / numRings) % 1;
          const ringAlpha = Math.abs(Math.sin(ringPhase * Math.PI)) * intensity;
          
          if (ringPhase > 0 && ringPhase < 1) {
            const waveColor = hexToRgba(effectiveColor, alpha * ringAlpha * 2);
            gradient.addColorStop(ringPhase, waveColor);
          }
        }
      } else {
      // Create gradient stops based on attenuation
      // - attenuation = 0: Sharp transition (step function)
      // - attenuation = 0.5: Default gradual fade
      // - attenuation = 1: Very smooth/soft transition

      // Inner bright zone (full brightness from center to bright radius)
      gradient.addColorStop(0, baseColor);

      if (brightStop > 0) {
        // Maintain full brightness up to bright radius
        // Lower attenuation = more stops clustered near bright edge (sharper)
        // Higher attenuation = more distributed stops (smoother)
        const transitionStart = brightStop * (1 - attenuation * 0.3);
        gradient.addColorStop(transitionStart, baseColor);

        // Transition zone - use attenuation to control the curve
        if (attenuation < 0.3) {
          // Sharp falloff - add intermediate stop close to bright edge
          const midAlpha = alpha * 0.5;
          gradient.addColorStop(brightStop, hexToRgba(effectiveColor, midAlpha));
          gradient.addColorStop(brightStop + (1 - brightStop) * 0.3, hexToRgba(effectiveColor, midAlpha * 0.3));
        } else if (attenuation > 0.7) {
          // Soft falloff - distributed stops for smooth gradient
          gradient.addColorStop(brightStop, hexToRgba(effectiveColor, alpha * 0.85));
          gradient.addColorStop(brightStop + (1 - brightStop) * 0.4, hexToRgba(effectiveColor, alpha * 0.5));
          gradient.addColorStop(brightStop + (1 - brightStop) * 0.7, hexToRgba(effectiveColor, alpha * 0.2));
        } else {
          // Medium falloff - default smooth transition
          gradient.addColorStop(brightStop, hexToRgba(effectiveColor, alpha * 0.7));
          gradient.addColorStop(brightStop + (1 - brightStop) * 0.5, hexToRgba(effectiveColor, alpha * 0.3));
        }
      }

      // Outer edge (fully transparent)
      gradient.addColorStop(1, dimColor);
      }

      ctx.fillStyle = gradient;
      if (angle < 360) {
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, animatedDim, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render sparkles on top of base light
      if (animationType === 'sparkle') {
        const config = getSparkleConfig(light);
        const sparks = generateSparks(light, time);
        const intensity = animationIntensity / 10;

        sparks.forEach(spark => {
          const age = time - spark.birthTime;
          const lifeProgress = age / spark.lifetime;

          let fadeAlpha: number;
          if (config.sparkleFade !== false) {
            fadeAlpha = Math.sin(lifeProgress * Math.PI);
          } else {
            fadeAlpha = 1;
          }

          const finalAlpha = alpha * intensity * fadeAlpha;
          if (finalAlpha <= 0.01) return;

          const sparkX = Math.floor(x + spark.x) + 0.5;
          const sparkY = Math.floor(y + spark.y) + 0.5;

          const sparkGradient = ctx.createRadialGradient(
            sparkX, sparkY, 0,
            sparkX, sparkY, spark.size
          );

          sparkGradient.addColorStop(0, hexToRgba(spark.color, finalAlpha));
          sparkGradient.addColorStop(0.5, hexToRgba(spark.color, finalAlpha * 0.5));
          sparkGradient.addColorStop(1, hexToRgba(spark.color, 0));

          ctx.fillStyle = sparkGradient;
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, spark.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      ctx.restore();
    };

    // Render light with or without wall occlusion based on light.walls property
    // Empty polygon means no walls are affecting this light - render without clipping
    if (wallsEnabled && visibilityPolygon && visibilityPolygon.length > 0) {
      if (DEBUG_LIGHTS && debugLightFrame % 60 === 0) {
        console.log(`[Light Debug] id=${light.id.slice(-8)} RENDERING with clipping (${visibilityPolygon.length} vertices)`);
      }
      renderClippedLight(ctx, { x, y }, animatedDim, visibilityPolygon, renderLightGradient, light.id);
    } else {
      // Log every frame if walls are enabled but polygon is empty/missing - this is suspicious!
      if (DEBUG_LIGHTS && wallsEnabled && hasWallsInRange({ x, y }, walls, animatedDim)) {
        console.warn(`[Light Debug] id=${light.id.slice(-8)} SUSPICIOUS: wallsEnabled=true, hasWallsInRange=true, but polygon=${visibilityPolygon?.length ?? 'null'}`);
      } else if (DEBUG_LIGHTS && debugLightFrame % 60 === 0) {
        console.log(`[Light Debug] id=${light.id.slice(-8)} RENDERING without clipping (wallsEnabled=${wallsEnabled}, polygon=${visibilityPolygon?.length ?? 'null'})`);
      }
      renderLightGradient();
    }
  }

  function renderTokenLight(ctx: CanvasRenderingContext2D, token: Token, time: number) {
    // Skip if token doesn't emit light
    if (token.lightBright <= 0 && token.lightDim <= 0) return;

    const gridSize = scene.gridSize;
    const width = (token.width || 1) * gridSize;
    const height = (token.height || 1) * gridSize;

    // Token center position
    const x = token.x + width / 2;
    const y = token.y + height / 2;

    // Convert light ranges from grid units to pixels
    const bright = token.lightBright * gridSize;
    const dim = token.lightDim * gridSize;
    const color = token.lightColor || '#ffffff';
    const angle = token.lightAngle || 360;

    // Performance optimization: Cull lights outside viewport
    if (!isInViewport(x - dim, y - dim, dim * 2, dim * 2)) {
      return;
    }

    // Performance optimization: Get cached visibility polygon
    const visibilityPolygon = getVisibilityPolygon(
      `token-light-${token.id}`,
      x,
      y,
      dim
    );

    // Render light with wall occlusion
    renderClippedLight(ctx, { x, y }, dim, visibilityPolygon, () => {
      ctx.save();

      // If cone light, clip to cone shape
      if (angle < 360) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        const rotation = token.rotation || 0; // Use token rotation for light direction
        const startAngle = (rotation - angle / 2) * Math.PI / 180;
        const endAngle = (rotation + angle / 2) * Math.PI / 180;
        ctx.arc(x, y, dim, startAngle, endAngle);
        ctx.closePath();
        ctx.clip();
      }

      // Create radial gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, dim);

      // Parse color with alpha (using default 0.8 alpha for token lights)
      const baseColor = hexToRgba(color, 0.8);
      const dimColor = hexToRgba(effectiveColor, 0);

        // Wave animation - create ripple effect with multiple rings
        if (animationType === "wave") {
          const speed = animationSpeed / 5;
          const intensity = animationIntensity / 10;
          const wavePhase = (time * speed * 0.002) % 1;
          
          // Create multiple wave rings
          const numRings = 3;
          for (let i = 0; i < numRings; i++) {
            const ringPhase = (wavePhase + i / numRings) % 1;
            const ringPos = ringPhase;
            const ringAlpha = Math.abs(Math.sin(ringPhase * Math.PI)) * intensity;
            
            if (ringPos > 0 && ringPos < 1) {
              const waveColor = hexToRgba(effectiveColor, alpha * ringAlpha);
              gradient.addColorStop(ringPos, waveColor);
            }
          }
        } else {
          // Normal gradient (non-wave animations)
          gradient.addColorStop(0, baseColor);
          if (animatedBright > 0 && animatedDim > 0) {
            gradient.addColorStop(Math.min(1, animatedBright / animatedDim), baseColor);
          }
          gradient.addColorStop(1, dimColor);
        }
      if (bright > 0 && dim > 0) {
      }

      ctx.fillStyle = gradient;
      if (angle < 360) {
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, dim, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  function renderTokenVision(ctx: CanvasRenderingContext2D, token: Token) {
    // Skip if token doesn't have vision
    if (!token.vision || token.visionRange <= 0) return;

    const gridSize = scene.gridSize;
    const width = (token.width || 1) * gridSize;
    const height = (token.height || 1) * gridSize;

    // Token center position
    const x = token.x + width / 2;
    const y = token.y + height / 2;

    // Convert vision range from grid units to pixels
    const visionRadius = token.visionRange * gridSize;

    ctx.save();

    // Draw vision range indicator (subtle circle for selected tokens)
    const isSelected = selectedTokenId === token.id;

    if (isSelected) {
      // Draw a subtle vision range circle
      ctx.strokeStyle = '#60a5fa'; // Light blue
      ctx.lineWidth = 2 / scale;
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([10 / scale, 5 / scale]);

      ctx.beginPath();
      ctx.arc(x, y, visionRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  }

  function renderTokenVisionArea(ctx: CanvasRenderingContext2D, token: Token) {
    // This renders the actual vision area when tokenVision is enabled
    if (!token.vision || token.visionRange <= 0) return;

    const gridSize = scene.gridSize;
    const width = (token.width || 1) * gridSize;
    const height = (token.height || 1) * gridSize;

    // Token center position
    const x = token.x + width / 2;
    const y = token.y + height / 2;

    // Convert vision range from grid units to pixels
    const visionRadius = token.visionRange * gridSize;

    // Compute visibility polygon for wall occlusion
    const visibilityPolygon = computeVisibilityPolygon(
      { x, y },
      walls,
      visionRadius
    );

    // Render vision with wall occlusion
    renderClippedLight(ctx, { x, y }, visionRadius, visibilityPolygon, () => {
      ctx.save();

      // Create radial gradient for vision area
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, visionRadius);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, visionRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  function renderLights() {
    if (!lightingCtx || !lightingCanvas) return;

    // Debug frame counter
    if (DEBUG_LIGHTS) {
      debugLightFrame++;
    }

    // Performance optimization: Pre-calculate visibility at start of frame
    // Capture whether cache needs clearing, but defer setting the flag until after rendering
    const shouldClearCache = !visibilityCacheValid;
    if (shouldClearCache) {
      visibilityCache.clear();
    }

    lightingCtx.clearRect(0, 0, lightingCanvas.width, lightingCanvas.height);
    lightingCtx.save();

    // Apply transform
    lightingCtx.translate(-viewX * scale, -viewY * scale);
    lightingCtx.scale(scale, scale);

    const sceneWidth = scene.backgroundWidth || 4000;
    const sceneHeight = scene.backgroundHeight || 4000;

    // Check if we need darkness overlay
    const hasDarkness = scene.darkness > 0 && !scene.globalLight;

    if (hasDarkness) {
      // Create a temporary canvas for light compositing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = lightingCanvas.width;
      tempCanvas.height = lightingCanvas.height;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        tempCtx.save();
        tempCtx.translate(-viewX * scale, -viewY * scale);
        tempCtx.scale(scale, scale);

        // Set composite mode to lighten (lights add together)
        tempCtx.globalCompositeOperation = 'lighten';

        // Render all ambient lights on temp canvas
        lights.forEach(light => {
          renderLight(tempCtx, light, animationTime);
        });

        // Render token lights on temp canvas
        tokens.forEach(token => {
          if (token.visible) {
            renderTokenLight(tempCtx, token, animationTime);
          }
        });

        // If tokenVision is enabled, also render vision areas
        if (scene.tokenVision) {
          tokens.forEach(token => {
            if (token.visible && token.vision) {
              renderTokenVisionArea(tempCtx, token);
            }
          });
        }

        tempCtx.restore();

        // Now draw darkness on main lighting canvas
        lightingCtx.fillStyle = `rgba(0, 0, 0, ${scene.darkness})`;
        lightingCtx.fillRect(0, 0, sceneWidth, sceneHeight);

        // Cut out lit areas using destination-out
        // Must reset transform to draw tempCanvas at screen coordinates (0,0)
        // since tempCanvas was rendered in screen space
        lightingCtx.globalCompositeOperation = 'destination-out';
        lightingCtx.save();
        lightingCtx.setTransform(1, 0, 0, 1, 0, 0);  // Reset to identity transform
        lightingCtx.drawImage(tempCanvas, 0, 0);
        lightingCtx.restore();
        lightingCtx.globalCompositeOperation = 'source-over';
      }
    } else {
      // No darkness - just render lights normally with additive blending
      lightingCtx.globalCompositeOperation = 'lighten';

      lights.forEach(light => {
        renderLight(lightingCtx, light, animationTime);
      });

      // Render token lights even without darkness
      tokens.forEach(token => {
        if (token.visible) {
          renderTokenLight(lightingCtx, token, animationTime);
        }
      });

      lightingCtx.globalCompositeOperation = 'source-over';
    }

    lightingCtx.restore();

    // Only mark cache as valid after all lights have been rendered
    if (shouldClearCache) {
      visibilityCacheValid = true;
    }
  }

  /**
   * Render light handles/indicators for interactive light sources
   * Shows a visible icon at each light's position that can be selected and dragged
   */
  function renderLightHandles() {
    if (!controlsCtx || !controlsCanvas || !isGM) return;

    controlsCtx.save();

    // Apply transform
    controlsCtx.translate(-viewX * scale, -viewY * scale);
    controlsCtx.scale(scale, scale);

    // Performance optimization: Filter to only visible lights in viewport
    const visibleLights = lights.filter(light => {
      const radius = light.dim || 100;
      return isInViewport(light.x - radius, light.y - radius, radius * 2, radius * 2);
    });

    visibleLights.forEach(light => {
      const isSelected = selectedLightId === light.id;
      const handleRadius = 12 / scale; // Keep constant size in screen space

      // Draw outer glow for selection
      if (isSelected) {
        controlsCtx.fillStyle = 'rgba(251, 191, 36, 0.3)'; // Amber glow
        controlsCtx.beginPath();
        controlsCtx.arc(light.x, light.y, handleRadius * 1.8, 0, Math.PI * 2);
        controlsCtx.fill();
      }

      // Draw light handle circle
      controlsCtx.fillStyle = isSelected ? '#fbbf24' : light.color;
      controlsCtx.strokeStyle = '#ffffff';
      controlsCtx.lineWidth = 2 / scale;

      controlsCtx.beginPath();
      controlsCtx.arc(light.x, light.y, handleRadius, 0, Math.PI * 2);
      controlsCtx.fill();
      controlsCtx.stroke();

      // Draw light icon (sun rays)
      controlsCtx.strokeStyle = '#ffffff';
      controlsCtx.lineWidth = 1.5 / scale;
      const rayLength = handleRadius * 0.6;
      const numRays = 8;

      for (let i = 0; i < numRays; i++) {
        const angle = (i / numRays) * Math.PI * 2;
        const startRadius = handleRadius * 0.5;
        const endRadius = handleRadius * 0.9;

        controlsCtx.beginPath();
        controlsCtx.moveTo(
          light.x + Math.cos(angle) * startRadius,
          light.y + Math.sin(angle) * startRadius
        );
        controlsCtx.lineTo(
          light.x + Math.cos(angle) * endRadius,
          light.y + Math.sin(angle) * endRadius
        );
        controlsCtx.stroke();
      }
    });

    controlsCtx.restore();
  }

  function renderFog() {
    // When GM is possessing a token, show fog from that token's perspective
    // Otherwise, GMs see no fog
    if (!fogCtx || !fogCanvas || !scene.fogExploration) return;
    if (isGM && !possessedTokenId) return;
    if (!fogData) return;

    fogCtx.clearRect(0, 0, fogCanvas.width, fogCanvas.height);
    fogCtx.save();

    // Apply transform
    fogCtx.translate(-viewX * scale, -viewY * scale);
    fogCtx.scale(scale, scale);

    const sceneWidth = scene.backgroundWidth || 4000;
    const sceneHeight = scene.backgroundHeight || 4000;
    const cellSize = fogData.gridCellSize;

    // Draw dark overlay for entire scene
    fogCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    fogCtx.fillRect(0, 0, sceneWidth, sceneHeight);

    // Cut out explored areas
    fogCtx.globalCompositeOperation = 'destination-out';

    // Render explored grid
    const exploredGrid = fogData.exploredGrid as FogGrid;
    if (exploredGrid && Array.isArray(exploredGrid)) {
      for (let row = 0; row < exploredGrid.length; row++) {
        for (let col = 0; col < exploredGrid[row].length; col++) {
          if (exploredGrid[row][col]) {
            fogCtx.fillStyle = 'rgba(0, 0, 0, 1)';
            fogCtx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    // Render revealed grid (GM-revealed areas)
    const revealedGrid = fogData.revealedGrid as FogGrid;
    if (revealedGrid && Array.isArray(revealedGrid)) {
      for (let row = 0; row < revealedGrid.length; row++) {
        for (let col = 0; col < revealedGrid[row].length; col++) {
          if (revealedGrid[row][col]) {
            fogCtx.fillStyle = 'rgba(0, 0, 0, 1)';
            fogCtx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    // When GM is possessing a token, also cut out the current vision
    if (possessedTokenId) {
      const possessedToken = tokens.find(t => t.id === possessedTokenId);
      if (possessedToken && possessedToken.vision && possessedToken.visionRange > 0) {
        const tokenCenterX = possessedToken.x + ((possessedToken.width || 1) * scene.gridSize) / 2;
        const tokenCenterY = possessedToken.y + ((possessedToken.height || 1) * scene.gridSize) / 2;
        const visionRadius = possessedToken.visionRange * scene.gridSize;

        // Compute visibility polygon for the possessed token
        const visibilityPolygon = computeVisibilityPolygon(
          { x: tokenCenterX, y: tokenCenterY },
          walls,
          visionRadius
        );

        // Cut out the current vision area
        if (visibilityPolygon.length > 0) {
          fogCtx.fillStyle = 'rgba(0, 0, 0, 1)';
          fogCtx.beginPath();
          fogCtx.moveTo(visibilityPolygon[0].x, visibilityPolygon[0].y);
          for (let i = 1; i < visibilityPolygon.length; i++) {
            fogCtx.lineTo(visibilityPolygon[i].x, visibilityPolygon[i].y);
          }
          fogCtx.closePath();
          fogCtx.fill();
        }
      }
    }

    fogCtx.globalCompositeOperation = 'source-over';
    fogCtx.restore();
  }

  /**
   * Update explored areas based on current token vision
   * Called when tokens move or vision changes
   */
  function updateExploredAreas() {
    if (!scene.fogExploration || isGM || !fogData) return;

    const cellSize = fogData.gridCellSize;
    const sceneWidth = scene.backgroundWidth || 4000;
    const sceneHeight = scene.backgroundHeight || 4000;

    // Calculate grid dimensions
    const gridWidth = Math.ceil(sceneWidth / cellSize);
    const gridHeight = Math.ceil(sceneHeight / cellSize);

    // Initialize explored grid if needed
    let exploredGrid: FogGrid = fogData.exploredGrid as FogGrid || [];
    while (exploredGrid.length < gridHeight) {
      exploredGrid.push([]);
    }
    for (let row = 0; row < gridHeight; row++) {
      while (exploredGrid[row].length < gridWidth) {
        exploredGrid[row].push(false);
      }
    }

    let hasChanges = false;

    // Mark cells visible by tokens with vision as explored
    tokens.forEach(token => {
      if (!token.visible || !token.vision || token.visionRange <= 0) return;

      const tokenX = token.x + ((token.width || 1) * scene.gridSize) / 2;
      const tokenY = token.y + ((token.height || 1) * scene.gridSize) / 2;
      const visionRadius = token.visionRange * scene.gridSize;

      // Compute visibility polygon for this token
      const visibilityPolygon = computeVisibilityPolygon(
        { x: tokenX, y: tokenY },
        walls,
        visionRadius
      );

      // Mark grid cells within the visibility polygon as explored
      for (let row = 0; row < gridHeight; row++) {
        for (let col = 0; col < gridWidth; col++) {
          if (exploredGrid[row][col]) continue; // Already explored

          // Check if cell center is within visibility polygon
          const cellCenterX = (col + 0.5) * cellSize;
          const cellCenterY = (row + 0.5) * cellSize;

          if (isPointInPolygon({ x: cellCenterX, y: cellCenterY }, visibilityPolygon)) {
            exploredGrid[row][col] = true;
            hasChanges = true;
          }
        }
      }
    });

    // Update fog store if there are changes
    if (hasChanges) {
      // Performance optimization: Use requestIdleCallback for non-critical updates
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          fogStore.updateExplored(scene.id, exploredGrid);
        });
      } else {
        setTimeout(() => {
          fogStore.updateExplored(scene.id, exploredGrid);
        }, 0);
      }
    }
  }

  /**
   * Check if a point is inside a polygon
   */
  function isPointInPolygon(point: { x: number; y: number }, polygon: Array<{ x: number; y: number }>): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;

      const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function startAnimationLoop() {
    const animate = (timestamp: number) => {
      // Performance optimization: Throttle animation to target FPS
      if (timestamp - lastAnimationTime < FRAME_TIME) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      lastAnimationTime = timestamp;

      animationTime = timestamp;

      // Only re-render lights if there are animated lights or token lights
      const hasAnimatedLights = lights.some(light =>
        light.animationType === 'torch' || light.animationType === 'pulse' || light.animationType === 'chroma' || light.animationType === 'wave' || light.animationType === 'sparkle'
      );

      // Check if any tokens emit light (for now we always re-render if they exist)
      const hasTokenLights = tokens.some(token =>
        token.visible && (token.lightBright > 0 || token.lightDim > 0)
      );

      if (hasAnimatedLights || hasTokenLights) {
        renderLights();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
  }

  function stopAnimationLoop() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function renderControls() {
    if (!controlsCtx || !controlsCanvas) return;

    controlsCtx.clearRect(0, 0, controlsCanvas.width, controlsCanvas.height);

    // Render light handles for GM
    if (isGM) {
      renderLightHandles();
    }
  }

  /**
   * Toggle door state (open/closed)
   * Locked doors can only be toggled by GMs
   */
  function toggleDoor(wall: Wall) {
    // Cannot toggle locked doors unless GM
    if (wall.doorState === 'locked' && !isGM) {
      return;
    }

    // Toggle between open and closed
    const newState = wall.doorState === 'open' ? 'closed' : 'open';

    // Update via callback
    onWallUpdate?.(wall.id, { doorState: newState });
  }

  /**
   * Get effective wall properties considering door state
   * Open doors allow vision and movement
   */
  function getEffectiveWallProperties(wall: Wall): { sense: string; move: string } {
    if (wall.door !== 'none' && wall.doorState === 'open') {
      return {
        sense: 'flow',
        move: 'flow'
      };
    }
    return {
      sense: wall.sense,
      move: wall.move
    };
  }

  // Mouse event handlers
  function handleMouseDown(e: MouseEvent) {
    // Right-click cancels wall drawing
    if (e.button === 2) {
      if (isDrawingWall) {
        cancelWallDrawing();
        e.preventDefault();
        return;
      }
    }

    // Close context menu on any mouse interaction (left-click, drag, etc.)
    if (showContextMenu) {
      showContextMenu = false;
    }

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    const worldPos = screenToWorld(e.clientX, e.clientY);
    const snappedPos = snapToGrid(worldPos.x, worldPos.y);

    // Handle wall tool
    if (activeTool === 'wall' && isGM) {
      if (!isDrawingWall) {
        // Start drawing wall
        isDrawingWall = true;
        wallStartPoint = snappedPos;
        wallPreview = { x1: snappedPos.x, y1: snappedPos.y, x2: snappedPos.x, y2: snappedPos.y };
        renderWalls();
      } else {
        // Complete wall
        completeWallDrawing(snappedPos);
      }
      return;
    }

    // Handle light tool
    if (activeTool === 'light' && isGM) {
      // Place light at clicked position (no snapping by default)
      onLightAdd?.({
        x: worldPos.x,
        y: worldPos.y
      });
      return;
    }

    // Handle select tool - check for light/wall/door/token selection
    if (activeTool === 'select') {
      // Check for light selection first (GM only)
      if (isGM) {
        const lightId = findLightAtPoint(worldPos.x, worldPos.y);
        if (lightId) {
          // Check for double-click on light
          const currentTime = Date.now();
          const timeSinceLastClick = currentTime - lastClickTime;
          const isDoubleClick = timeSinceLastClick < DOUBLE_CLICK_THRESHOLD && lastClickLightId === lightId;

          if (isDoubleClick) {
            // Double-click detected - open light config
            onLightDoubleClick?.(lightId);
            lastClickTime = 0;
            lastClickLightId = null;
            return;
          } else {
            // Single click - prepare for drag
            const light = lights.find(l => l.id === lightId);
            if (light) {
              selectedLightId = lightId;
              selectedTokenId = null;
              selectedWallId = null;
              draggedLightId = lightId;
              isDraggingLight = true;
              dragOffsetX = light.x - worldPos.x;
              dragOffsetY = light.y - worldPos.y;
              onLightSelect?.(lightId);
              onTokenSelect?.(null);
              renderControls();

              // Store click time and light for double-click detection
              lastClickTime = currentTime;
              lastClickLightId = lightId;
              lastClickTokenId = null;
              return;
            }
          }
        }

        // Check for wall/door selection
        const wallId = findWallAtPoint(worldPos.x, worldPos.y);
        if (wallId) {
          // Check if this is a door and if we clicked near the center (for toggling)
          const wall = walls.find(w => w.id === wallId);
          if (wall && wall.door !== 'none') {
            const centerX = (wall.x1 + wall.x2) / 2;
            const centerY = (wall.y1 + wall.y2) / 2;
            const distToCenter = Math.hypot(worldPos.x - centerX, worldPos.y - centerY);
            const clickThreshold = 20 / scale;

            if (distToCenter <= clickThreshold) {
              // Clicking near door center - toggle door
              toggleDoor(wall);
              return;
            }
          }

          // Regular wall selection
          selectedWallId = wallId;
          selectedTokenId = null;
          selectedLightId = null;
          onTokenSelect?.(null);
          onLightSelect?.(null);
          renderWalls();
          return;
        } else {
          selectedWallId = null;
        }
      }

      // Check if clicking on a token
      const clickedToken = tokens.find(token => {
        const width = (token.width || 1) * scene.gridSize;
        const height = (token.height || 1) * scene.gridSize;
        const dx = worldPos.x - (token.x + width / 2);
        const dy = worldPos.y - (token.y + height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= width / 2;
      });

      if (clickedToken) {
        // Check for double-click
        const currentTime = Date.now();
        const timeSinceLastClick = currentTime - lastClickTime;
        const isDoubleClick = timeSinceLastClick < DOUBLE_CLICK_THRESHOLD && lastClickTokenId === clickedToken.id;

        if (isDoubleClick) {
          // Double-click detected - open token config
          onTokenDoubleClick?.(clickedToken.id);
          lastClickTime = 0; // Reset to prevent triple-click
          lastClickTokenId = null;
        } else {
          // Single click - prepare for drag
          selectedTokenId = clickedToken.id;
          selectedLightId = null;
          draggedTokenId = clickedToken.id;
          isDraggingToken = true;
          dragOffsetX = clickedToken.x - worldPos.x;
          dragOffsetY = clickedToken.y - worldPos.y;
          onTokenSelect?.(clickedToken.id);
          onLightSelect?.(null);
          renderControls();

          // Store click time and token for double-click detection
          lastClickTime = currentTime;
          lastClickTokenId = clickedToken.id;
          lastClickLightId = null;
        }
      } else {
        // Clicking on empty space - exit possession, clear selections and start panning
        exitPossession();
        selectedTokenId = null;
        selectedLightId = null;
        onTokenSelect?.(null);
        onLightSelect?.(null);
        isPanning = true;
        lastClickTime = 0;
        lastClickTokenId = null;
        lastClickLightId = null;
      }
    } else {
      // Non-select tool - clear selections and start panning if clicking empty space
      selectedTokenId = null;
      selectedLightId = null;
      onTokenSelect?.(null);
      onLightSelect?.(null);
      isPanning = true;
      lastClickTime = 0;
      lastClickTokenId = null;
      lastClickLightId = null;
    }
  }

  function completeWallDrawing(endPos: { x: number; y: number }) {
    if (!wallStartPoint) return;

    // Don't create zero-length walls
    if (wallStartPoint.x === endPos.x && wallStartPoint.y === endPos.y) {
      cancelWallDrawing();
      return;
    }

    // Create wall via callback
    onWallAdd?.({
      x1: wallStartPoint.x,
      y1: wallStartPoint.y,
      x2: endPos.x,
      y2: endPos.y,
    });

    // Reset drawing state
    isDrawingWall = false;
    wallStartPoint = null;
    wallPreview = null;
    renderWalls();
  }

  function cancelWallDrawing() {
    isDrawingWall = false;
    wallStartPoint = null;
    wallPreview = null;
    renderWalls();
  }

  function handleMouseMove(e: MouseEvent) {
    const worldPos = screenToWorld(e.clientX, e.clientY);

    // Update wall preview
    if (isDrawingWall && wallStartPoint) {
      const snappedPos = snapToGrid(worldPos.x, worldPos.y);
      wallPreview = {
        x1: wallStartPoint.x,
        y1: wallStartPoint.y,
        x2: snappedPos.x,
        y2: snappedPos.y,
      };
      renderWalls();
      return;
    }

    // Update wall hover
    if (activeTool === 'select' && isGM && !isDraggingToken && !isDraggingLight && !isPanning) {
      const wallId = findWallAtPoint(worldPos.x, worldPos.y);
      if (wallId !== hoveredWallId) {
        hoveredWallId = wallId;
        renderWalls();
      }
    }

    if (isDraggingLight && draggedLightId) {
      const newX = worldPos.x + dragOffsetX;
      const newY = worldPos.y + dragOffsetY;

      // Update light position locally for immediate feedback
      const light = lights.find(l => l.id === draggedLightId);
      if (light) {
        light.x = newX;
        light.y = newY;
        // Invalidate visibility cache so radiance updates during drag
        invalidateVisibilityCache();
        // Re-render both lights and controls
        renderLights();
        renderControls();
      }
    } else if (isDraggingToken && draggedTokenId) {
      const newX = worldPos.x + dragOffsetX;
      const newY = worldPos.y + dragOffsetY;

      // Update token position locally for immediate feedback
      const token = tokens.find(t => t.id === draggedTokenId);
      if (token) {
        token.x = newX;
        token.y = newY;
        renderTokens();
      }
    } else if (isPanning) {
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;

      viewX -= dx / scale;
      viewY -= dy / scale;

      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      // Invalidate caches on pan
      invalidateVisibilityCache();
      gridNeedsUpdate = true;
      backgroundNeedsUpdate = true;

      render();
    }
  }

  function handleMouseUp(e: MouseEvent) {
    if (isDraggingLight && draggedLightId) {
      const light = lights.find(l => l.id === draggedLightId);
      if (light) {
        const worldPos = screenToWorld(e.clientX, e.clientY);
        let newX = worldPos.x + dragOffsetX;
        let newY = worldPos.y + dragOffsetY;

        // Apply grid snapping if the light has it enabled
        if (light.snapToGrid) {
          const snappedPos = snapToGridCenter(newX, newY);
          newX = snappedPos.x;
          newY = snappedPos.y;
        }

        // Only send move event if position actually changed
        const positionChanged = Math.abs(newX - light.x) > 1 || Math.abs(newY - light.y) > 1;
        if (positionChanged) {
          onLightMove?.(draggedLightId, newX, newY);
        }
      }

      isDraggingLight = false;
      draggedLightId = null;
    } else if (isDraggingToken && draggedTokenId) {
      const token = tokens.find(t => t.id === draggedTokenId);
      if (token) {
        const worldPos = screenToWorld(e.clientX, e.clientY);
        let newX = worldPos.x + dragOffsetX;
        let newY = worldPos.y + dragOffsetY;

        // Apply grid snapping if enabled
        if (gridSnap) {
          // Snap the token's top-left corner to the nearest grid intersection
          newX = Math.round(newX / scene.gridSize) * scene.gridSize;
          newY = Math.round(newY / scene.gridSize) * scene.gridSize;
        }

        // Only send move event if position actually changed
        const positionChanged = Math.abs(newX - token.x) > 1 || Math.abs(newY - token.y) > 1;
        if (positionChanged) {
          onTokenMove?.(draggedTokenId, newX, newY);
        }
      }

      isDraggingToken = false;
      draggedTokenId = null;
    }

    isPanning = false;
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * zoomFactor));

    if (newScale !== scale) {
      // Zoom towards mouse position
      const rect = controlsCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX + viewX * scale) / scale;
      const worldY = (mouseY + viewY * scale) / scale;

      scale = newScale;

      viewX = worldX - mouseX / scale;
      viewY = worldY - mouseY / scale;

      // Invalidate caches on zoom
      invalidateVisibilityCache();
      gridNeedsUpdate = true;
      backgroundNeedsUpdate = true;

      render();
    }
  }

  function screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const rect = controlsCanvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;

    return {
      x: (canvasX + viewX * scale) / scale,
      y: (canvasY + viewY * scale) / scale,
    };
  }

  function snapToGrid(x: number, y: number): { x: number; y: number } {
    if (!gridSnap) return { x, y };
    const gridSize = scene.gridSize;
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  }

  function snapToGridCenter(x: number, y: number): { x: number; y: number } {
    const gridSize = scene.gridSize;
    // Snap to center of cell (add half grid size after rounding to corner)
    return {
      x: Math.floor(x / gridSize) * gridSize + gridSize / 2,
      y: Math.floor(y / gridSize) * gridSize + gridSize / 2,
    };
  }

  function distanceToLineSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      // Line segment is a point
      return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    }

    // Calculate projection of point onto line segment
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
  }

  function findWallAtPoint(worldX: number, worldY: number): string | null {
    const threshold = 10 / scale; // 10 pixels in screen space

    for (const wall of walls) {
      const distance = distanceToLineSegment(worldX, worldY, wall.x1, wall.y1, wall.x2, wall.y2);
      if (distance <= threshold) {
        return wall.id;
      }
    }

    return null;
  }

  function findLightAtPoint(worldX: number, worldY: number): string | null {
    const handleRadius = 12 / scale; // Match the render size

    // Check lights in reverse order (top-most first)
    for (let i = lights.length - 1; i >= 0; i--) {
      const light = lights[i];
      const dx = worldX - light.x;
      const dy = worldY - light.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= handleRadius) {
        return light.id;
      }
    }

    return null;
  }

  function handleKeyDown(e: KeyboardEvent) {
    // Ignore if typing in input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    // Escape - exit possession, or cancel wall drawing
    if (e.key === 'Escape') {
      if (possessedTokenId) {
        exitPossession();
        e.preventDefault();
      } else if (isDrawingWall) {
        cancelWallDrawing();
        e.preventDefault();
      }
    }

    // Delete - remove selected wall
    if (e.key === 'Delete' && selectedWallId && isGM) {
      onWallRemove?.(selectedWallId);
      selectedWallId = null;
      renderWalls();
      e.preventDefault();
    }
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();

    // Cancel if drawing walls
    if (isDrawingWall) {
      return;
    }

    const rect = controlsCanvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert to world coordinates
    const worldX = (clientX + viewX * scale) / scale;
    const worldY = (clientY + viewY * scale) / scale;

    // Check for token at position
    const clickedToken = tokens.find(token => {
      const width = (token.width || 1) * scene.gridSize;
      const height = (token.height || 1) * scene.gridSize;
      const tokenCenterX = token.x + width / 2;
      const tokenCenterY = token.y + height / 2;
      const radius = Math.min(width, height) / 2;
      const distance = Math.sqrt(Math.pow(worldX - tokenCenterX, 2) + Math.pow(worldY - tokenCenterY, 2));
      return distance <= radius;
    });

    if (clickedToken) {
      showContextMenu = true;
      contextMenuX = e.clientX;
      contextMenuY = e.clientY;
      contextMenuElementType = 'token';
      contextMenuElementId = clickedToken.id;
      contextMenuElementVisible = clickedToken.visible !== false;
      return;
    }

    // Check for light at position (if GM)
    if (isGM) {
      const clickedLight = lights.find(light => {
        const distance = Math.sqrt(Math.pow(worldX - light.x, 2) + Math.pow(worldY - light.y, 2));
        const handleRadius = 12 / scale;
        return distance <= handleRadius;
      });

      if (clickedLight) {
        showContextMenu = true;
        contextMenuX = e.clientX;
        contextMenuY = e.clientY;
        contextMenuElementType = 'light';
        contextMenuElementId = clickedLight.id;
        contextMenuElementVisible = true; // Lights don't have visibility toggle yet
        return;
      }

      // Check for wall at position
      const clickedWallId = findWallAtPoint(worldX, worldY);
      if (clickedWallId) {
        showContextMenu = true;
        contextMenuX = e.clientX;
        contextMenuY = e.clientY;
        contextMenuElementType = 'wall';
        contextMenuElementId = clickedWallId;
        contextMenuElementVisible = true; // Walls don't have visibility toggle
        return;
      }
    }

    // No element clicked - close any existing menu
    showContextMenu = false;
  }

  // Context menu action handlers
  function handleContextMenuEdit() {
    showContextMenu = false;
    if (contextMenuElementType === 'token' && contextMenuElementId) {
      onTokenDoubleClick?.(contextMenuElementId);
    } else if (contextMenuElementType === 'light' && contextMenuElementId) {
      onLightDoubleClick?.(contextMenuElementId);
    } else if (contextMenuElementType === 'wall' && contextMenuElementId) {
      // Wall edit - select the wall for now
      selectedWallId = contextMenuElementId;
      renderWalls();
      // Could open a wall config modal if one exists in the future
    }
  }

  function handleContextMenuToggleVisibility() {
    showContextMenu = false;
    if (contextMenuElementType === 'token' && contextMenuElementId) {
      const token = tokens.find(t => t.id === contextMenuElementId);
      if (token) {
        websocket.sendTokenUpdate({
          tokenId: contextMenuElementId,
          updates: { visible: !contextMenuElementVisible }
        });
      }
    }
    // Add similar for lights/walls if they support visibility in the future
  }

  function handleContextMenuPossess() {
    showContextMenu = false;
    if (contextMenuElementType === 'token' && contextMenuElementId && isGM) {
      possessedTokenId = contextMenuElementId;
      // Re-render fog with the possessed token's perspective
      renderFog();
    }
  }

  function exitPossession() {
    if (possessedTokenId) {
      possessedTokenId = null;
      // Re-render fog from GM perspective
      renderFog();
    }
  }

  function handleContextMenuDelete() {
    showContextMenu = false;

    // Set up delete dialog
    if (contextMenuElementType === 'token') {
      const token = tokens.find(t => t.id === contextMenuElementId);
      deleteDialogTitle = 'Delete Token';
      deleteDialogMessage = `Are you sure you want to delete "${token?.name || 'this token'}"? This action cannot be undone.`;
    } else if (contextMenuElementType === 'light') {
      deleteDialogTitle = 'Delete Light';
      deleteDialogMessage = 'Are you sure you want to delete this light? This action cannot be undone.';
    } else if (contextMenuElementType === 'wall') {
      deleteDialogTitle = 'Delete Wall';
      deleteDialogMessage = 'Are you sure you want to delete this wall? This action cannot be undone.';
    }

    showDeleteDialog = true;
  }

  function handleDeleteConfirm() {
    showDeleteDialog = false;

    if (contextMenuElementType === 'token' && contextMenuElementId) {
      websocket.sendTokenRemove({ tokenId: contextMenuElementId });
    } else if (contextMenuElementType === 'light' && contextMenuElementId) {
      websocket.sendLightRemove({ lightId: contextMenuElementId });
    } else if (contextMenuElementType === 'wall' && contextMenuElementId) {
      websocket.sendWallRemove({ wallId: contextMenuElementId });
    }

    // Clear selection
    if (contextMenuElementType === 'token') {
      selectedTokenId = null;
      onTokenSelect?.(null);
    }
    if (contextMenuElementType === 'light') {
      selectedLightId = null;
      onLightSelect?.(null);
    }
    if (contextMenuElementType === 'wall') {
      selectedWallId = null;
    }

    contextMenuElementId = null;
    contextMenuElementType = null;
  }

  function handleDeleteCancel() {
    showDeleteDialog = false;
  }

  // Drag-and-drop handlers
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    isDragOver = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;

    if (!e.dataTransfer || !onTokenAdd) {
      return;
    }

    try {
      // Parse token data from dataTransfer
      const tokenDataString = e.dataTransfer.getData('application/json');
      if (!tokenDataString) {
        return;
      }

      const tokenData = JSON.parse(tokenDataString);

      // Get drop position in screen coordinates
      const worldPos = screenToWorld(e.clientX, e.clientY);

      // Apply grid snapping if enabled
      const finalPos = gridSnap ? snapToGrid(worldPos.x, worldPos.y) : worldPos;

      // Call onTokenAdd with token data including position
      onTokenAdd({
        ...tokenData,
        x: finalPos.x,
        y: finalPos.y
      });
    } catch (error) {
      console.error('Failed to handle token drop:', error);
    }
  }
</script>

<div class="scene-canvas-container" bind:this={canvasContainer}>
  <canvas class="canvas-layer" bind:this={backgroundCanvas}></canvas>
  <canvas class="canvas-layer" bind:this={gridCanvas}></canvas>
  <canvas class="canvas-layer" bind:this={tokensCanvas}></canvas>
  <canvas class="canvas-layer" bind:this={lightingCanvas}></canvas>
  {#if scene.fogExploration && (!isGM || possessedTokenId)}
    <canvas class="canvas-layer" bind:this={fogCanvas}></canvas>
  {/if}
  {#if isGM}
    <canvas class="canvas-layer" bind:this={wallsCanvas}></canvas>
  {/if}
  <canvas
    class="canvas-layer canvas-interactive"
    class:cursor-crosshair={activeTool === 'wall' || activeTool === 'light'}
    class:cursor-grab={activeTool === 'select'}
    class:drag-over={isDragOver}
    bind:this={controlsCanvas}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseUp}
    on:wheel={handleWheel}
    on:contextmenu={handleContextMenu}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
  ></canvas>

  <!-- Possession indicator -->
  {#if possessedTokenId}
    {#each tokens as token}
      {#if token.id === possessedTokenId}
        <div class="possession-indicator">
          <div class="possession-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Possessing: {token.name || 'Token'}</span>
            <button class="exit-button" on:click={exitPossession} title="Exit Possession (ESC)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      {/if}
    {/each}
  {/if}

  <div class="canvas-controls">
    <div class="zoom-display">
      {Math.round(scale * 100)}%
    </div>
  </div>
</div>

{#if showContextMenu && contextMenuElementType && contextMenuElementId}
  <SceneContextMenu
    x={contextMenuX}
    y={contextMenuY}
    elementType={contextMenuElementType}
    elementId={contextMenuElementId}
    {isGM}
    isVisible={contextMenuElementVisible}
    on:edit={handleContextMenuEdit}
    on:possess={handleContextMenuPossess}
    on:toggleVisibility={handleContextMenuToggleVisibility}
    on:delete={handleContextMenuDelete}
    on:close={() => showContextMenu = false}
  />
{/if}

{#if showDeleteDialog}
  <ConfirmDialog
    title={deleteDialogTitle}
    message={deleteDialogMessage}
    confirmText="Delete"
    cancelText="Cancel"
    danger={true}
    on:confirm={handleDeleteConfirm}
    on:cancel={handleDeleteCancel}
  />
{/if}

<style>
  .scene-canvas-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #1a1a1a;
  }

  .canvas-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .canvas-interactive {
    cursor: grab;
  }

  .canvas-interactive:active {
    cursor: grabbing;
  }

  .canvas-interactive.cursor-crosshair {
    cursor: crosshair;
  }

  .canvas-interactive.cursor-crosshair:active {
    cursor: crosshair;
  }

  .canvas-interactive.cursor-grab {
    cursor: grab;
  }

  .canvas-interactive.cursor-grab:active {
    cursor: grabbing;
  }

  .canvas-controls {
    position: absolute;
    bottom: 16px;
    right: 16px;
    display: flex;
    gap: 8px;
    pointer-events: none;
  }

  .zoom-display {
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
  }

  .possession-indicator {
    position: absolute;
    top: 16px;
    left: 16px;
    pointer-events: all;
    z-index: 100;
  }

  .possession-content {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: rgba(251, 191, 36, 0.95);
    color: #1f2937;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: possession-pulse 2s ease-in-out infinite;
  }

  @keyframes possession-pulse {
    0%, 100% {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    50% {
      box-shadow: 0 4px 16px rgba(251, 191, 36, 0.5);
    }
  }

  .possession-content svg {
    flex-shrink: 0;
  }

  .exit-button {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.2);
    border: none;
    border-radius: 3px;
    padding: 2px;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .exit-button:hover {
    background: rgba(0, 0, 0, 0.35);
  }

  .canvas-interactive.drag-over {
    background-color: rgba(74, 144, 226, 0.1);
  }
</style>
