<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Scene, Token, Wall, AmbientLight } from '@vtt/shared';
  import { lightsStore } from '$lib/stores/lights';

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

  // Canvas refs
  let canvasContainer: HTMLDivElement;
  let backgroundCanvas: HTMLCanvasElement;
  let gridCanvas: HTMLCanvasElement;
  let tokensCanvas: HTMLCanvasElement;
  let lightingCanvas: HTMLCanvasElement;
  let wallsCanvas: HTMLCanvasElement;
  let controlsCanvas: HTMLCanvasElement;

  let backgroundCtx: CanvasRenderingContext2D | null = null;
  let gridCtx: CanvasRenderingContext2D | null = null;
  let tokensCtx: CanvasRenderingContext2D | null = null;
  let lightingCtx: CanvasRenderingContext2D | null = null;
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

  // Subscribe to lights store
  $: lights = Array.from($lightsStore.lights.values()).filter(light => light.sceneId === scene.id);

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

  // Watch for light changes
  $: if (lights) {
    renderLights();
  }

  function initializeCanvases() {
    backgroundCtx = backgroundCanvas.getContext('2d');
    gridCtx = gridCanvas.getContext('2d');
    tokensCtx = tokensCanvas.getContext('2d');
    lightingCtx = lightingCanvas.getContext('2d');
    wallsCtx = wallsCanvas ? wallsCanvas.getContext('2d') : null;
    controlsCtx = controlsCanvas.getContext('2d');
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
    renderLights();
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

      // Draw wall
      wallsCtx.strokeStyle = wall.wallType === 'door' ? '#fbbf24' : '#ef4444';
      wallsCtx.lineWidth = 3 / scale;

      wallsCtx.beginPath();
      wallsCtx.moveTo(wall.x1, wall.y1);
      wallsCtx.lineTo(wall.x2, wall.y2);
      wallsCtx.stroke();

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

  function renderLight(ctx: CanvasRenderingContext2D, light: AmbientLight, time: number) {
    const { x, y, bright, dim, color, alpha, angle, rotation, animationType, animationSpeed, animationIntensity } = light;

    ctx.save();

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
  }

  function renderTokenLight(ctx: CanvasRenderingContext2D, token: Token, time: number) {
    // Skip if token doesn't emit light
    if (token.lightBright <= 0 && token.lightDim <= 0) return;

    const gridSize = scene.gridSize;
    const width = token.width || 50;
    const height = token.height || 50;

    // Token center position
    const x = token.x + width / 2;
    const y = token.y + height / 2;

    // Convert light ranges from grid units to pixels
    const bright = token.lightBright * gridSize;
    const dim = token.lightDim * gridSize;
    const color = token.lightColor || '#ffffff';
    const angle = token.lightAngle || 360;

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
  }

  function renderTokenVision(ctx: CanvasRenderingContext2D, token: Token) {
    // Skip if token doesn't have vision
    if (!token.vision || token.visionRange <= 0) return;

    const gridSize = scene.gridSize;
    const width = token.width || 50;
    const height = token.height || 50;

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
    const width = token.width || 50;
    const height = token.height || 50;

    // Token center position
    const x = token.x + width / 2;
    const y = token.y + height / 2;

    // Convert vision range from grid units to pixels
    const visionRadius = token.visionRange * gridSize;

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
  }

  function renderLights() {
    if (!lightingCtx || !lightingCanvas) return;

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

  function startAnimationLoop() {
    const animate = (timestamp: number) => {
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

    // Handle select tool - check for wall selection
    if (activeTool === 'select' && isGM) {
      const wallId = findWallAtPoint(worldPos.x, worldPos.y);
      if (wallId) {
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
      const width = token.width || 50;
      const height = token.height || 50;
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
</script>

<div class="scene-canvas-container" bind:this={canvasContainer}>
  <canvas class="canvas-layer" bind:this={backgroundCanvas}></canvas>
  <canvas class="canvas-layer" bind:this={gridCanvas}></canvas>
  <canvas class="canvas-layer" bind:this={tokensCanvas}></canvas>
  <canvas class="canvas-layer" bind:this={lightingCanvas}></canvas>
  {#if isGM}
    <canvas class="canvas-layer" bind:this={wallsCanvas}></canvas>
  {/if}
  <canvas
    class="canvas-layer canvas-interactive"
    class:cursor-crosshair={activeTool === 'wall'}
    class:cursor-grab={activeTool === 'select'}
    bind:this={controlsCanvas}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseUp}
    on:wheel={handleWheel}
    on:contextmenu={handleContextMenu}
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
</style>
