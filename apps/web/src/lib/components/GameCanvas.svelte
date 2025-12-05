<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Token, RulerMeasurement } from '@vtt/shared';
  import MeasurementLayer from './scene/MeasurementLayer.svelte';
  import TemplateConfig from './scene/TemplateConfig.svelte';
  import { templatesStore } from '$lib/stores/templates';

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
    if (activeTool === 'select' && draggingTokenId) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

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

  function handleTemplateConfigClose() {
    showTemplateConfig = false;
  }
</script>

<div class="canvas-container">
  <canvas
    bind:this={canvas}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    class="game-canvas"
  />

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
