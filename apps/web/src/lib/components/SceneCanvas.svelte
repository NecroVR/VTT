<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Scene, Token, Wall, AmbientLight, FogGrid } from '@vtt/shared';
  import { lightsStore } from '$lib/stores/lights';
  import { fogStore } from '$lib/stores/fog';

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
  let lastMouseX = 0;
  let lastMouseY = 0;
  let selectedTokenId: string | null = null;
  let draggedTokenId: string | null = null;
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
  const DOUBLE_CLICK_THRESHOLD = 300; // ms

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

  // Watch for other scene changes (re-render without reloading image)
  $: if (scene) {
    render();
  }

  // Watch for token changes
  $: if (tokens) {
    renderTokens();
  }

  // Watch for wall changes
  $: if (walls && isGM) {
    invalidateVisibilityCache();
    renderWalls();
  }

  // Watch for light changes
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
   */
  function getVisibilityPolygon(sourceId: string, x: number, y: number, radius: number): Point[] {
    if (visibilityCacheValid && visibilityCache.has(sourceId)) {
      return visibilityCache.get(sourceId)!;
    }

    const polygon = computeVisibilityPolygon({ x, y }, walls, radius);
    visibilityCache.set(sourceId, polygon);

    return polygon;
  }

  function renderTokens() {
    if (!tokensCtx || !tokensCanvas) return;

    tokensCtx.clearRect(0, 0, tokensCanvas.width, tokensCanvas.height);
    tokensCtx.save();

    // Apply transform
    tokensCtx.translate(-viewX * scale, -viewY * scale);
    tokensCtx.scale(scale, scale);

    // Performance optimization: Filter to only visible tokens in viewport
    const visibleTokens = tokens.filter(token => {
      if (!token.visible) return false;

      const width = (token.width || 1) * scene.gridSize;
      const height = (token.height || 1) * scene.gridSize;
      return isInViewport(token.x, token.y, width, height);
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

    if (u >= 0 && u <= 1) {
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

  function computeVisibilityPolygon(
    source: Point,
    walls: Wall[],
    maxRadius: number
  ): Point[] {
    // Only consider walls with effective sense === 'block' (closed doors block, open doors don't)
    const blockingWalls = walls.filter(w => {
      const effectiveProps = getEffectiveWallProperties(w);
      return effectiveProps.sense === 'block';
    });

    if (blockingWalls.length === 0) {
      // No blocking walls, return full circle
      const points: Point[] = [];
      const steps = 32;
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        points.push({
          x: source.x + Math.cos(angle) * maxRadius,
          y: source.y + Math.sin(angle) * maxRadius
        });
      }
      return points;
    }

    // Collect all unique angles to wall endpoints
    const angles: number[] = [];

    for (const wall of blockingWalls) {
      // Add angles to each wall endpoint, plus slightly offset angles
      const angle1 = Math.atan2(wall.y1 - source.y, wall.x1 - source.x);
      const angle2 = Math.atan2(wall.y2 - source.y, wall.x2 - source.x);

      angles.push(angle1 - 0.0001, angle1, angle1 + 0.0001);
      angles.push(angle2 - 0.0001, angle2, angle2 + 0.0001);
    }

    // Sort angles
    angles.sort((a, b) => a - b);

    // Cast rays at each angle and build visibility polygon
    const segments: Segment[] = blockingWalls.map(w => ({
      x1: w.x1,
      y1: w.y1,
      x2: w.x2,
      y2: w.y2
    }));

    const points: Point[] = [];
    for (const angle of angles) {
      const point = castRay(source, angle, segments, maxRadius);
      points.push(point);
    }

    return points;
  }

  function renderClippedLight(
    ctx: CanvasRenderingContext2D,
    source: Point,
    maxRadius: number,
    visibilityPolygon: Point[],
    renderCallback: () => void
  ) {
    if (visibilityPolygon.length === 0) return;

    ctx.save();

    // Create clipping path from visibility polygon
    ctx.beginPath();
    ctx.moveTo(visibilityPolygon[0].x, visibilityPolygon[0].y);
    for (let i = 1; i < visibilityPolygon.length; i++) {
      ctx.lineTo(visibilityPolygon[i].x, visibilityPolygon[i].y);
    }
    ctx.closePath();
    ctx.clip();

    // Render light within clipped area
    renderCallback();

    ctx.restore();
  }

  function renderLight(ctx: CanvasRenderingContext2D, light: AmbientLight, time: number) {
    const { x, y, bright, dim, color, alpha, angle, rotation, animationType, animationSpeed, animationIntensity } = light;

    // Performance optimization: Cull lights outside viewport
    if (!isInViewport(x - dim, y - dim, dim * 2, dim * 2)) {
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
    }

    // Performance optimization: Get cached visibility polygon
    const visibilityPolygon = getVisibilityPolygon(
      `light-${light.id}`,
      x,
      y,
      animatedDim
    );

    // Render light with wall occlusion
    renderClippedLight(ctx, { x, y }, animatedDim, visibilityPolygon, () => {
      ctx.save();

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

      // Create radial gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, animatedDim);

      // Parse color and add alpha
      const baseColor = hexToRgba(color, alpha);
      const dimColor = hexToRgba(color, 0);

      // Bright zone (0 to bright radius)
      gradient.addColorStop(0, baseColor);
      if (animatedBright > 0 && animatedDim > 0) {
        gradient.addColorStop(Math.min(1, animatedBright / animatedDim), baseColor);
      }
      // Dim zone (bright to dim radius)
      gradient.addColorStop(1, dimColor);

      ctx.fillStyle = gradient;
      if (angle < 360) {
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, animatedDim, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
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
      const dimColor = hexToRgba(color, 0);

      // Bright zone (0 to bright radius)
      gradient.addColorStop(0, baseColor);
      if (bright > 0 && dim > 0) {
        gradient.addColorStop(Math.min(1, bright / dim), baseColor);
      }
      // Dim zone (bright to dim radius)
      gradient.addColorStop(1, dimColor);

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
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, visionRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  function renderLights() {
    if (!lightingCtx || !lightingCanvas) return;

    // Performance optimization: Pre-calculate visibility at start of frame
    if (!visibilityCacheValid) {
      visibilityCache.clear();
      visibilityCacheValid = true;
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
        lightingCtx.globalCompositeOperation = 'destination-out';
        lightingCtx.drawImage(tempCanvas, 0, 0);
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
  }

  function renderFog() {
    if (!fogCtx || !fogCanvas || !scene.fogExploration || isGM) return;
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
        light.animationType === 'torch' || light.animationType === 'pulse'
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
    // Controls like selection boxes, drawing tools, etc. can be rendered here
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
      // Place light at clicked position
      onLightAdd?.({
        x: snappedPos.x,
        y: snappedPos.y
      });
      return;
    }

    // Handle select tool - check for wall/door selection
    if (activeTool === 'select' && isGM) {
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
        onTokenSelect?.(null);
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
        draggedTokenId = clickedToken.id;
        isDraggingToken = true;
        dragOffsetX = clickedToken.x - worldPos.x;
        dragOffsetY = clickedToken.y - worldPos.y;
        onTokenSelect?.(clickedToken.id);
        renderControls();

        // Store click time and token for double-click detection
        lastClickTime = currentTime;
        lastClickTokenId = clickedToken.id;
      }
    } else {
      selectedTokenId = null;
      onTokenSelect?.(null);
      isPanning = true;
      lastClickTime = 0;
      lastClickTokenId = null;
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
    if (activeTool === 'select' && isGM && !isDraggingToken && !isPanning) {
      const wallId = findWallAtPoint(worldPos.x, worldPos.y);
      if (wallId !== hoveredWallId) {
        hoveredWallId = wallId;
        renderWalls();
      }
    }

    if (isDraggingToken && draggedTokenId) {
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
    if (isDraggingToken && draggedTokenId) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      let newX = worldPos.x + dragOffsetX;
      let newY = worldPos.y + dragOffsetY;

      // Apply grid snapping if enabled
      if (gridSnap) {
        const token = tokens.find(t => t.id === draggedTokenId);
        if (token) {
          const tokenWidth = (token.width || 1) * scene.gridSize;
          const tokenHeight = (token.height || 1) * scene.gridSize;

          // Snap token to grid cell boundaries
          // Find which cell the token center is in - this becomes the top-left cell
          // Token's top-left corner aligns with that cell's top-left corner
          // This ensures larger tokens (2x2, 3x3, etc.) fill complete grid cells
          const cellX = Math.floor((newX + tokenWidth / 2) / scene.gridSize);
          const cellY = Math.floor((newY + tokenHeight / 2) / scene.gridSize);
          newX = cellX * scene.gridSize;
          newY = cellY * scene.gridSize;
        }
      }

      // Send token move event
      onTokenMove?.(draggedTokenId, newX, newY);

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

  function handleKeyDown(e: KeyboardEvent) {
    // Ignore if typing in input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    // Escape - cancel wall drawing
    if (e.key === 'Escape') {
      if (isDrawingWall) {
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
    // Prevent context menu when drawing walls
    if (isDrawingWall) {
      e.preventDefault();
    }
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
  {#if scene.fogExploration && !isGM}
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

  <div class="canvas-controls">
    <div class="zoom-display">
      {Math.round(scale * 100)}%
    </div>
  </div>
</div>

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

  .canvas-interactive.drag-over {
    background-color: rgba(74, 144, 226, 0.1);
  }
</style>
