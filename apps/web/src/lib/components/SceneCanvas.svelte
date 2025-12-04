<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Scene, Token, Wall } from '@vtt/shared';

  // Props
  export let scene: Scene;
  export let tokens: Token[] = [];
  export let walls: Wall[] = [];
  export let isGM: boolean = false;
  export let onTokenMove: ((tokenId: string, x: number, y: number) => void) | undefined = undefined;
  export let onTokenSelect: ((tokenId: string | null) => void) | undefined = undefined;

  // Canvas refs
  let canvasContainer: HTMLDivElement;
  let backgroundCanvas: HTMLCanvasElement;
  let gridCanvas: HTMLCanvasElement;
  let tokensCanvas: HTMLCanvasElement;
  let wallsCanvas: HTMLCanvasElement;
  let controlsCanvas: HTMLCanvasElement;

  let backgroundCtx: CanvasRenderingContext2D | null = null;
  let gridCtx: CanvasRenderingContext2D | null = null;
  let tokensCtx: CanvasRenderingContext2D | null = null;
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

  const MIN_SCALE = 0.25;
  const MAX_SCALE = 4;

  onMount(() => {
    initializeCanvases();
    loadBackgroundImage();
    resizeCanvases();
    render();

    window.addEventListener('resize', resizeCanvases);

    return () => {
      window.removeEventListener('resize', resizeCanvases);
    };
  });

  onDestroy(() => {
    // Cleanup
  });

  // Watch for background image URL changes only
  $: if (scene.backgroundImage !== currentImageUrl) {
    loadBackgroundImage();
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
    renderWalls();
  }

  function initializeCanvases() {
    backgroundCtx = backgroundCanvas.getContext('2d');
    gridCtx = gridCanvas.getContext('2d');
    tokensCtx = tokensCanvas.getContext('2d');
    wallsCtx = wallsCanvas ? wallsCanvas.getContext('2d') : null;
    controlsCtx = controlsCanvas.getContext('2d');
  }

  function resizeCanvases() {
    if (!canvasContainer) return;

    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight;

    [backgroundCanvas, gridCanvas, tokensCanvas, controlsCanvas].forEach(canvas => {
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
    });

    if (wallsCanvas) {
      wallsCanvas.width = width;
      wallsCanvas.height = height;
    }

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
    if (isGM) {
      renderWalls();
    }
    renderControls();
  }

  function renderBackground() {
    if (!backgroundCtx || !backgroundCanvas) return;

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

    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    gridCtx.save();

    // Apply transform
    gridCtx.translate(-viewX * scale, -viewY * scale);
    gridCtx.scale(scale, scale);

    const gridSize = scene.gridSize;
    const sceneWidth = scene.backgroundWidth || 4000;
    const sceneHeight = scene.backgroundHeight || 4000;

    gridCtx.strokeStyle = scene.gridColor;
    gridCtx.globalAlpha = scene.gridAlpha;
    gridCtx.lineWidth = 1 / scale; // Keep line width constant in screen space

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

  function renderTokens() {
    if (!tokensCtx || !tokensCanvas) return;

    tokensCtx.clearRect(0, 0, tokensCanvas.width, tokensCanvas.height);
    tokensCtx.save();

    // Apply transform
    tokensCtx.translate(-viewX * scale, -viewY * scale);
    tokensCtx.scale(scale, scale);

    tokens.forEach(token => {
      if (!token.visible) return; // Skip invisible tokens (unless GM, but we'll add that later)

      const x = token.x;
      const y = token.y;
      const width = token.width || 50;
      const height = token.height || 50;
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

  function renderWalls() {
    if (!wallsCtx || !wallsCanvas) return;

    wallsCtx.clearRect(0, 0, wallsCanvas.width, wallsCanvas.height);
    wallsCtx.save();

    // Apply transform
    wallsCtx.translate(-viewX * scale, -viewY * scale);
    wallsCtx.scale(scale, scale);

    walls.forEach(wall => {
      wallsCtx.strokeStyle = wall.wallType === 'door' ? '#fbbf24' : '#ef4444';
      wallsCtx.lineWidth = 3 / scale;

      wallsCtx.beginPath();
      wallsCtx.moveTo(wall.x1, wall.y1);
      wallsCtx.lineTo(wall.x2, wall.y2);
      wallsCtx.stroke();
    });

    wallsCtx.restore();
  }

  function renderControls() {
    if (!controlsCtx || !controlsCanvas) return;

    controlsCtx.clearRect(0, 0, controlsCanvas.width, controlsCanvas.height);
    // Controls like selection boxes, drawing tools, etc. can be rendered here
  }

  // Mouse event handlers
  function handleMouseDown(e: MouseEvent) {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    // Check if clicking on a token
    const worldPos = screenToWorld(e.clientX, e.clientY);
    const clickedToken = tokens.find(token => {
      const width = token.width || 50;
      const height = token.height || 50;
      const dx = worldPos.x - (token.x + width / 2);
      const dy = worldPos.y - (token.y + height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= width / 2;
    });

    if (clickedToken) {
      selectedTokenId = clickedToken.id;
      draggedTokenId = clickedToken.id;
      isDraggingToken = true;
      dragOffsetX = clickedToken.x - worldPos.x;
      dragOffsetY = clickedToken.y - worldPos.y;
      onTokenSelect?.(clickedToken.id);
      renderControls();
    } else {
      selectedTokenId = null;
      onTokenSelect?.(null);
      isPanning = true;
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (isDraggingToken && draggedTokenId) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
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

      render();
    }
  }

  function handleMouseUp(e: MouseEvent) {
    if (isDraggingToken && draggedTokenId) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      const newX = worldPos.x + dragOffsetX;
      const newY = worldPos.y + dragOffsetY;

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
</script>

<div class="scene-canvas-container" bind:this={canvasContainer}>
  <canvas class="canvas-layer" bind:this={backgroundCanvas}></canvas>
  <canvas class="canvas-layer" bind:this={gridCanvas}></canvas>
  <canvas class="canvas-layer" bind:this={tokensCanvas}></canvas>
  {#if isGM}
    <canvas class="canvas-layer" bind:this={wallsCanvas}></canvas>
  {/if}
  <canvas
    class="canvas-layer canvas-interactive"
    bind:this={controlsCanvas}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseUp}
    on:wheel={handleWheel}
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
</style>
