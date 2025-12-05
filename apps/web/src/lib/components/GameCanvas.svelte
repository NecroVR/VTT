<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Token, RulerMeasurement, DrawingPoint } from '@vtt/shared';
  import MeasurementLayer from './scene/MeasurementLayer.svelte';
  import TemplateConfig from './scene/TemplateConfig.svelte';
  import DrawingLayer from './scene/DrawingLayer.svelte';
  import DrawingConfig from './scene/DrawingConfig.svelte';
  import TileLayer from './scene/TileLayer.svelte';
  import TileConfig from './scene/TileConfig.svelte';
  import RegionLayer from './scene/RegionLayer.svelte';
  import RegionConfig from './scene/RegionConfig.svelte';
  import ScenePinLayer from './scene/ScenePinLayer.svelte';
  import ScenePinConfig from './scene/ScenePinConfig.svelte';
  import { templatesStore } from '$lib/stores/templates';
  import { drawingsStore } from '$lib/stores/drawings';
  import { tilesStore } from '$lib/stores/tiles';
  import { regionsStore } from '$lib/stores/regions';
  import { scenePinsStore } from '$lib/stores/scenePins';
  import { API_BASE_URL } from '$lib/config/api';

  // Props
  export let tokens: Map<string, Token> = new Map();
  export let selectedTokenId: string | null = null;
  export let onTokenClick: (tokenId: string) => void = () => {};
  export let onTokenMove: (tokenId: string, x: number, y: number) => void = () => {};
  export let gridSize: number = 50;
  export let gridDistance: number = 5;
  export let gridUnits: string = 'ft';
  export let showGrid: boolean = true;
  export let activeTool: string = 'select';
  export let sceneId: string = '';
  export let userId: string = '';
  export let isGM: boolean = false;

  // Canvas state
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let canvasWidth = 800;
  let canvasHeight = 600;

  // Drag state
  let draggingTokenId: string | null = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  // Ruler state
  let isDrawingRuler = false;
  let rulerColor = '#00ff00';

  // Template state
  let showTemplateConfig = false;
  let templatePlacementX = 0;
  let templatePlacementY = 0;

  // Drawing state
  let isDrawing = false;
  let drawingStartX = 0;
  let drawingStartY = 0;
  let tempDrawingId: string | null = null;
  let showDrawingConfig = false;
  let selectedDrawingId: string | null = null;

  // Tile state
  let showTileConfig = false;
  let selectedTileId: string | null = null;
  let tilePlacementX = 0;
  let tilePlacementY = 0;

  // Region state
  let showRegionConfig = false;
  let selectedRegionId: string | null = null;
  let regionStartX = 0;
  let regionStartY = 0;

  // Pin state
  let showPinConfig = false;
  let selectedPinId: string | null = null;
  let pinPlacementX = 0;
  let pinPlacementY = 0;

  onMount(() => {
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initial render
    render();
  });

  onDestroy(() => {
    window.removeEventListener('resize', resizeCanvas);
  });

  // Reactive rendering when tokens or selection changes
  $: if (ctx && (tokens || selectedTokenId !== undefined)) {
    render();
  }

  function resizeCanvas() {
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    canvasWidth = container.clientWidth;
    canvasHeight = container.clientHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    render();
  }

  function render() {
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid
    if (showGrid) {
      drawGrid();
    }

    // Draw tokens
    tokens.forEach((token) => {
      drawToken(token, token.id === selectedTokenId);
    });
  }

  function drawGrid() {
    if (!ctx) return;

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }
  }

  function drawToken(token: Token, isSelected: boolean) {
    if (!ctx) return;

    const pixelX = token.x * gridSize;
    const pixelY = token.y * gridSize;
    const pixelWidth = token.width * gridSize;
    const pixelHeight = token.height * gridSize;

    // Draw token background
    if (token.imageUrl) {
      // TODO: Load and draw image
      // For now, draw a colored rectangle
      ctx.fillStyle = '#4ade80';
    } else {
      ctx.fillStyle = '#60a5fa';
    }

    ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);

    // Draw border
    ctx.strokeStyle = isSelected ? '#fbbf24' : '#1f2937';
    ctx.lineWidth = isSelected ? 3 : 1;
    ctx.strokeRect(pixelX, pixelY, pixelWidth, pixelHeight);

    // Draw token name
    if (token.name) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        token.name,
        pixelX + pixelWidth / 2,
        pixelY + pixelHeight / 2
      );
    }

    // Draw visibility indicator
    if (!token.visible) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👁', pixelX + pixelWidth / 2, pixelY + pixelHeight / 2);
    }
  }

  function getTokenAtPosition(x: number, y: number): string | null {
    // Check tokens in reverse order (top to bottom)
    const tokenArray = Array.from(tokens.values()).reverse();

    for (const token of tokenArray) {
      const pixelX = token.x * gridSize;
      const pixelY = token.y * gridSize;
      const pixelWidth = token.width * gridSize;
      const pixelHeight = token.height * gridSize;

      if (
        x >= pixelX &&
        x <= pixelX + pixelWidth &&
        y >= pixelY &&
        y <= pixelY + pixelHeight
      ) {
        return token.id;
      }
    }

    return null;
  }

  function handleMouseDown(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const gridX = x / gridSize;
    const gridY = y / gridSize;

    // Handle ruler tool
    if (activeTool === 'ruler') {
      if (!isDrawingRuler) {
        // Start new ruler measurement
        isDrawingRuler = true;
        const ruler: RulerMeasurement = {
          userId,
          sceneId,
          waypoints: [{ x: gridX, y: gridY }],
          color: rulerColor,
        };
        templatesStore.setActiveRuler(ruler);
      } else if (event.shiftKey) {
        // Add waypoint on shift+click
        templatesStore.addRulerWaypoint(gridX, gridY);
      } else {
        // End ruler on normal click
        isDrawingRuler = false;
        templatesStore.setActiveRuler(null);
      }
      return;
    }

    // Handle template tool
    if (activeTool === 'template') {
      templatePlacementX = gridX;
      templatePlacementY = gridY;
      showTemplateConfig = true;
      return;
    }

    // Handle tile placement tool
    if (activeTool === 'tile' && isGM) {
      tilePlacementX = gridX;
      tilePlacementY = gridY;
      createTile(gridX, gridY);
      return;
    }

    // Handle region creation tool
    if (activeTool === 'region' && isGM) {
      regionStartX = gridX;
      regionStartY = gridY;
      createRegion(gridX, gridY);
      return;
    }

    // Handle pin placement tool
    if (activeTool === 'pin') {
      pinPlacementX = gridX;
      pinPlacementY = gridY;
      createPin(gridX, gridY);
      return;
    }

    // Handle freehand drawing tool
    if (activeTool === 'freehand') {
      isDrawing = true;
      tempDrawingId = crypto.randomUUID();
      const points: DrawingPoint[] = [{ x: gridX, y: gridY }];
      drawingsStore.startTempDrawing(tempDrawingId, points);
      return;
    }

    // Handle rectangle drawing tool
    if (activeTool === 'rectangle') {
      isDrawing = true;
      drawingStartX = gridX;
      drawingStartY = gridY;
      return;
    }

    // Handle circle drawing tool
    if (activeTool === 'circle') {
      isDrawing = true;
      drawingStartX = gridX;
      drawingStartY = gridY;
      return;
    }

    // Handle text drawing tool
    if (activeTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        createDrawing({
          drawingType: 'text',
          x: gridX,
          y: gridY,
          text,
        });
      }
      return;
    }

    // Handle select tool (token interaction)
    if (activeTool === 'select') {
      const tokenId = getTokenAtPosition(x, y);

      if (tokenId) {
        const token = tokens.get(tokenId);
        if (!token) return;

        draggingTokenId = tokenId;
        dragStartX = x;
        dragStartY = y;
        dragOffsetX = x - token.x * gridSize;
        dragOffsetY = y - token.y * gridSize;

        onTokenClick(tokenId);
      }
    }
  }

  function handleMouseMove(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const gridX = x / gridSize;
    const gridY = y / gridSize;

    // Update ruler measurement while drawing
    if (activeTool === 'ruler' && isDrawingRuler) {
      templatesStore.updateLastRulerWaypoint(gridX, gridY);
      return;
    }

    // Handle freehand drawing
    if (activeTool === 'freehand' && isDrawing) {
      drawingsStore.addTempDrawingPoints([{ x: gridX, y: gridY }]);
      return;
    }

    // Handle rectangle preview (optional - could show preview overlay)
    if (activeTool === 'rectangle' && isDrawing) {
      // TODO: Add preview rendering if desired
      return;
    }

    // Handle circle preview (optional - could show preview overlay)
    if (activeTool === 'circle' && isDrawing) {
      // TODO: Add preview rendering if desired
      return;
    }

    // Handle token dragging
    if (activeTool === 'select' && draggingTokenId) {
      const token = tokens.get(draggingTokenId);
      if (!token) return;

      // Calculate new grid position
      const newPixelX = x - dragOffsetX;
      const newPixelY = y - dragOffsetY;
      const newGridX = Math.round(newPixelX / gridSize);
      const newGridY = Math.round(newPixelY / gridSize);

      // Update token position locally for smooth dragging
      token.x = newGridX;
      token.y = newGridY;

      render();
    }
  }

  function handleMouseUp(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const gridX = x / gridSize;
    const gridY = y / gridSize;

    // Handle freehand drawing completion
    if (activeTool === 'freehand' && isDrawing) {
      isDrawing = false;
      const storeState = drawingsStore.subscribe(state => state)();
      const points = storeState.activeDrawing.tempPoints || [];

      if (points.length > 1) {
        createDrawing({
          drawingType: 'freehand',
          points,
        });
      }

      drawingsStore.clearTempDrawing();
      return;
    }

    // Handle rectangle drawing completion
    if (activeTool === 'rectangle' && isDrawing) {
      isDrawing = false;
      const width = Math.abs(gridX - drawingStartX);
      const height = Math.abs(gridY - drawingStartY);
      const x = Math.min(gridX, drawingStartX);
      const y = Math.min(gridY, drawingStartY);

      if (width > 0.1 && height > 0.1) {
        createDrawing({
          drawingType: 'rectangle',
          x,
          y,
          width,
          height,
        });
      }
      return;
    }

    // Handle circle drawing completion
    if (activeTool === 'circle' && isDrawing) {
      isDrawing = false;
      const dx = gridX - drawingStartX;
      const dy = gridY - drawingStartY;
      const radius = Math.sqrt(dx * dx + dy * dy);

      if (radius > 0.1) {
        createDrawing({
          drawingType: 'circle',
          x: drawingStartX,
          y: drawingStartY,
          radius,
        });
      }
      return;
    }

    // Handle token dragging
    if (activeTool === 'select' && draggingTokenId) {
      const token = tokens.get(draggingTokenId);
      if (!token) {
        draggingTokenId = null;
        return;
      }

      // Calculate final grid position
      const newPixelX = x - dragOffsetX;
      const newPixelY = y - dragOffsetY;
      const newGridX = Math.max(0, Math.round(newPixelX / gridSize));
      const newGridY = Math.max(0, Math.round(newPixelY / gridSize));

      // Send move event
      onTokenMove(draggingTokenId, newGridX, newGridY);

      draggingTokenId = null;
    }
  }

  async function createDrawing(params: any) {
    try {
      const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const storeState = drawingsStore.subscribe(state => state)();
      const settings = storeState.activeDrawing;

      const drawingData = {
        ...params,
        strokeColor: settings.strokeColor,
        strokeWidth: settings.strokeWidth,
        strokeAlpha: settings.strokeAlpha,
        fillColor: settings.fillColor,
        fillAlpha: settings.fillAlpha,
        fontSize: settings.fontSize,
        fontFamily: settings.fontFamily,
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/drawings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(drawingData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create drawing: ${response.statusText}`);
      }

      const data = await response.json();
      drawingsStore.addDrawing(data.drawing);

      // TODO: Emit WebSocket event for real-time sync
      // websocketService.emit('drawing:create', { sceneId, drawing: data.drawing });
    } catch (error) {
      console.error('Error creating drawing:', error);
    }
  }

  function handleDrawingClick(drawingId: string) {
    drawingsStore.selectDrawing(drawingId);
  }

  function handleDrawingDoubleClick(event: MouseEvent) {
    const storeState = drawingsStore.subscribe(state => state)();
    if (storeState.selectedDrawingId) {
      selectedDrawingId = storeState.selectedDrawingId;
      showDrawingConfig = true;
    }
  }

  function handleTemplateConfigClose() {
    showTemplateConfig = false;
  }

  function handleDrawingConfigClose() {
    showDrawingConfig = false;
    selectedDrawingId = null;
  }

  async function createTile(x: number, y: number) {
    const tile = await tilesStore.createTile(sceneId, {
      img: 'https://via.placeholder.com/150', // Default placeholder
      x,
      y,
      width: 2,
      height: 2,
      z: 0,
      rotation: 0,
      alpha: 1,
      hidden: false,
      locked: false,
      overhead: false,
      roof: false,
    });

    if (tile) {
      selectedTileId = tile.id;
      showTileConfig = true;
    }
  }

  async function createRegion(x: number, y: number) {
    const region = await regionsStore.createRegion(sceneId, {
      name: 'New Region',
      shape: 'rectangle',
      x,
      y,
      width: 5,
      height: 5,
      color: '#3b82f6',
      alpha: 0.3,
      hidden: false,
      locked: false,
    });

    if (region) {
      selectedRegionId = region.id;
      showRegionConfig = true;
    }
  }

  async function createPin(x: number, y: number) {
    const pin = await scenePinsStore.createPin(sceneId, {
      x,
      y,
      iconSize: 1,
      fontSize: 14,
      textAnchor: 'bottom',
      textColor: '#ffffff',
      global: false,
    });

    if (pin) {
      selectedPinId = pin.id;
      showPinConfig = true;
    }
  }

  function handleTileClick(tileId: string) {
    tilesStore.selectTile(tileId);
    selectedTileId = tileId;
  }

  function handleRegionClick(regionId: string) {
    regionsStore.selectRegion(regionId);
  }

  function handlePinClick(pinId: string) {
    scenePinsStore.selectPin(pinId);
  }

  function handleTileConfigClose() {
    showTileConfig = false;
    selectedTileId = null;
  }

  function handleRegionConfigClose() {
    showRegionConfig = false;
    selectedRegionId = null;
  }

  function handlePinConfigClose() {
    showPinConfig = false;
    selectedPinId = null;
  }
</script>

<div class="canvas-container">
  <canvas
    bind:this={canvas}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:dblclick={handleDrawingDoubleClick}
    class="game-canvas"
  />

  <!-- Background tiles (z < 0) -->
  <TileLayer
    {sceneId}
    {gridSize}
    {canvasWidth}
    {canvasHeight}
    onTileClick={handleTileClick}
    zFilter="background"
  />

  <!-- Regions (GM only) -->
  <RegionLayer
    {sceneId}
    {gridSize}
    {canvasWidth}
    {canvasHeight}
    onRegionClick={handleRegionClick}
    {isGM}
  />

  <!-- Foreground/overhead tiles (z >= 0) -->
  <TileLayer
    {sceneId}
    {gridSize}
    {canvasWidth}
    {canvasHeight}
    onTileClick={handleTileClick}
    zFilter="foreground"
  />

  <!-- Scene pins -->
  <ScenePinLayer
    {sceneId}
    {gridSize}
    {canvasWidth}
    {canvasHeight}
    onPinClick={handlePinClick}
  />

  <!-- Drawing layer -->
  <DrawingLayer
    {sceneId}
    {gridSize}
    {canvasWidth}
    {canvasHeight}
    onDrawingClick={handleDrawingClick}
  />

  <!-- Measurement layer -->
  <MeasurementLayer
    {sceneId}
    {gridSize}
    {gridDistance}
    {gridUnits}
    {canvasWidth}
    {canvasHeight}
  />
</div>

<TemplateConfig
  isOpen={showTemplateConfig}
  {sceneId}
  x={templatePlacementX}
  y={templatePlacementY}
  onClose={handleTemplateConfigClose}
/>

<DrawingConfig
  isOpen={showDrawingConfig}
  drawingId={selectedDrawingId || ''}
  {sceneId}
  onClose={handleDrawingConfigClose}
/>

<TileConfig
  isOpen={showTileConfig}
  tileId={selectedTileId || ''}
  {sceneId}
  onClose={handleTileConfigClose}
/>

<RegionConfig
  isOpen={showRegionConfig}
  regionId={selectedRegionId || ''}
  {sceneId}
  onClose={handleRegionConfigClose}
/>

<ScenePinConfig
  isOpen={showPinConfig}
  pinId={selectedPinId || ''}
  {sceneId}
  onClose={handlePinConfigClose}
/>

<style>
  .canvas-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .game-canvas {
    width: 100%;
    height: 100%;
    background-color: #1a1a1a;
    cursor: crosshair;
    display: block;
  }

  .game-canvas:active {
    cursor: grabbing;
  }
</style>
