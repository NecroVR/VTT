<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { tilesStore } from '$lib/stores/tiles';
  import type { Tile } from '@vtt/shared';

  // Props
  export let sceneId: string = '';
  export let gridSize: number = 50;
  export let canvasWidth: number = 800;
  export let canvasHeight: number = 600;
  export let onTileClick: (tileId: string) => void = () => {};
  export let zFilter: 'background' | 'foreground' = 'background'; // background = z < 0, foreground = z >= 0

  // Canvas state
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;

  // Store subscriptions
  let tiles: Tile[] = [];
  let selectedTileId: string | null = null;

  // Image cache
  const imageCache = new Map<string, HTMLImageElement>();
  const imageLoadingStatus = new Map<string, 'loading' | 'loaded' | 'error'>();

  const unsubscribe = tilesStore.subscribe(state => {
    const allTiles = Array.from(state.tiles.values())
      .filter(t => t.sceneId === sceneId)
      .sort((a, b) => a.z - b.z);

    // Filter by z-index based on layer
    tiles = zFilter === 'background'
      ? allTiles.filter(t => t.z < 0)
      : allTiles.filter(t => t.z >= 0);

    selectedTileId = state.selectedTileId;
  });

  onMount(() => {
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    if (!ctx) return;

    render();
  });

  onDestroy(() => {
    unsubscribe();
  });

  // Re-render when tiles change
  $: if (ctx && (tiles || selectedTileId !== undefined)) {
    render();
  }

  // Re-render when canvas size changes
  $: if (ctx && (canvasWidth || canvasHeight)) {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    render();
  }

  function render() {
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw all tiles
    tiles.forEach(tile => {
      if (!tile.hidden) {
        const isSelected = tile.id === selectedTileId;
        renderTile(tile, isSelected);
      }
    });
  }

  function renderTile(tile: Tile, isSelected: boolean) {
    if (!ctx) return;

    const x = tile.x * gridSize;
    const y = tile.y * gridSize;
    const width = tile.width * gridSize;
    const height = tile.height * gridSize;

    ctx.save();

    // Apply rotation
    if (tile.rotation !== 0) {
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((tile.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Apply alpha
    ctx.globalAlpha = tile.alpha;

    // Try to load and draw image
    const img = getImage(tile.img);
    if (img && imageLoadingStatus.get(tile.img) === 'loaded') {
      // Apply tint if specified
      if (tile.tint) {
        ctx.fillStyle = tile.tint;
        ctx.fillRect(x, y, width, height);
        ctx.globalCompositeOperation = 'multiply';
      }

      ctx.drawImage(img, x, y, width, height);
      ctx.globalCompositeOperation = 'source-over';
    } else if (imageLoadingStatus.get(tile.img) === 'error') {
      // Draw error placeholder
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Error loading image', x + width / 2, y + height / 2);
    } else {
      // Draw loading placeholder
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Loading...', x + width / 2, y + height / 2);
    }

    // Draw selection outline
    if (isSelected) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
    }

    // Draw locked indicator
    if (tile.locked) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x, y, 30, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔒', x + 15, y + 15);
    }

    ctx.restore();
  }

  function getImage(url: string): HTMLImageElement | null {
    // Check cache first
    if (imageCache.has(url)) {
      return imageCache.get(url)!;
    }

    // Check if already loading
    if (imageLoadingStatus.has(url)) {
      return null;
    }

    // Start loading
    imageLoadingStatus.set(url, 'loading');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      imageLoadingStatus.set(url, 'loaded');
      imageCache.set(url, img);
      render(); // Re-render when image loads
    };

    img.onerror = () => {
      imageLoadingStatus.set(url, 'error');
      render(); // Re-render to show error
    };

    img.src = url;
    return null;
  }

  function handleClick(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / gridSize;
    const y = (event.clientY - rect.top) / gridSize;

    // Find clicked tile (check in reverse order for top-most)
    for (let i = tiles.length - 1; i >= 0; i--) {
      const tile = tiles[i];
      if (!tile.locked && isPointInTile(x, y, tile)) {
        onTileClick(tile.id);
        return;
      }
    }

    // No tile clicked, deselect
    tilesStore.selectTile(null);
  }

  function isPointInTile(x: number, y: number, tile: Tile): boolean {
    const tolerance = 0.1; // Grid units

    return (
      x >= tile.x - tolerance &&
      x <= tile.x + tile.width + tolerance &&
      y >= tile.y - tolerance &&
      y <= tile.y + tile.height + tolerance
    );
  }
</script>

<canvas
  bind:this={canvas}
  on:click={handleClick}
  class="tile-layer"
  class:background={zFilter === 'background'}
  class:foreground={zFilter === 'foreground'}
  style="width: {canvasWidth}px; height: {canvasHeight}px;"
/>

<style>
  .tile-layer {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: auto;
  }

  .tile-layer.background {
    z-index: 1;
  }

  .tile-layer.foreground {
    z-index: 8;
  }
</style>
