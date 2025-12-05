<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { regionsStore } from '$lib/stores/regions';
  import type { Region, RegionPoint } from '@vtt/shared';

  // Props
  export let sceneId: string = '';
  export let gridSize: number = 50;
  export let canvasWidth: number = 800;
  export let canvasHeight: number = 600;
  export let onRegionClick: (regionId: string) => void = () => {};
  export let isGM: boolean = false; // Only GMs can see regions

  // Canvas state
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;

  // Store subscriptions
  let regions: Region[] = [];
  let selectedRegionId: string | null = null;

  // Hover state
  let hoveredRegionId: string | null = null;

  const unsubscribe = regionsStore.subscribe(state => {
    regions = Array.from(state.regions.values()).filter(r => r.sceneId === sceneId);
    selectedRegionId = state.selectedRegionId;
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

  // Re-render when regions change
  $: if (ctx && (regions || selectedRegionId !== undefined || hoveredRegionId !== undefined)) {
    render();
  }

  // Re-render when canvas size changes
  $: if (ctx && (canvasWidth || canvasHeight)) {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    render();
  }

  function render() {
    if (!ctx || !isGM) return; // Only render for GMs

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw all regions
    regions.forEach(region => {
      if (!region.hidden) {
        const isSelected = region.id === selectedRegionId;
        const isHovered = region.id === hoveredRegionId;
        renderRegion(region, isSelected, isHovered);
      }
    });
  }

  function renderRegion(region: Region, isSelected: boolean, isHovered: boolean) {
    if (!ctx) return;

    ctx.save();

    // Draw region based on shape
    switch (region.shape) {
      case 'rectangle':
        renderRectangle(region);
        break;
      case 'circle':
        renderCircle(region);
        break;
      case 'ellipse':
        renderEllipse(region);
        break;
      case 'polygon':
        renderPolygon(region);
        break;
    }

    // Apply fill
    ctx.fillStyle = region.color;
    ctx.globalAlpha = isHovered ? Math.min(region.alpha + 0.2, 1) : region.alpha;
    ctx.fill();

    // Apply stroke
    ctx.strokeStyle = isSelected ? '#fbbf24' : region.color;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.globalAlpha = 1;
    ctx.stroke();

    // Draw region name on hover
    if (isHovered && region.name) {
      const centerX = region.x * gridSize;
      const centerY = region.y * gridSize;

      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.font = '14px sans-serif';
      const textWidth = ctx.measureText(region.name).width;
      ctx.fillRect(centerX - textWidth / 2 - 5, centerY - 20, textWidth + 10, 25);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(region.name, centerX, centerY - 7);
    }

    ctx.restore();
  }

  function renderRectangle(region: Region) {
    if (!ctx || region.width === null || region.height === null) return;

    const x = region.x * gridSize;
    const y = region.y * gridSize;
    const width = (region.width || 0) * gridSize;
    const height = (region.height || 0) * gridSize;

    ctx.beginPath();
    ctx.rect(x, y, width, height);
  }

  function renderCircle(region: Region) {
    if (!ctx || region.radius === null) return;

    const centerX = region.x * gridSize;
    const centerY = region.y * gridSize;
    const radius = (region.radius || 0) * gridSize;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  }

  function renderEllipse(region: Region) {
    if (!ctx || region.width === null || region.height === null) return;

    const centerX = region.x * gridSize;
    const centerY = region.y * gridSize;
    const radiusX = ((region.width || 0) / 2) * gridSize;
    const radiusY = ((region.height || 0) / 2) * gridSize;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
  }

  function renderPolygon(region: Region) {
    if (!ctx || !region.points || region.points.length < 3) return;

    const points = region.points.map(p => ({
      x: p.x * gridSize,
      y: p.y * gridSize,
    }));

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
  }

  function handleClick(event: MouseEvent) {
    if (!isGM) return; // Only GMs can interact with regions

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / gridSize;
    const y = (event.clientY - rect.top) / gridSize;

    // Find clicked region (check in reverse order for top-most)
    for (let i = regions.length - 1; i >= 0; i--) {
      const region = regions[i];
      if (!region.locked && isPointInRegion(x, y, region)) {
        onRegionClick(region.id);
        return;
      }
    }

    // No region clicked, deselect
    regionsStore.selectRegion(null);
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isGM) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / gridSize;
    const y = (event.clientY - rect.top) / gridSize;

    // Find hovered region
    let foundHover = false;
    for (let i = regions.length - 1; i >= 0; i--) {
      const region = regions[i];
      if (isPointInRegion(x, y, region)) {
        hoveredRegionId = region.id;
        foundHover = true;
        break;
      }
    }

    if (!foundHover) {
      hoveredRegionId = null;
    }
  }

  function isPointInRegion(x: number, y: number, region: Region): boolean {
    const tolerance = 0.1;

    switch (region.shape) {
      case 'rectangle':
        if (region.width === null || region.height === null) return false;
        return (
          x >= region.x - tolerance &&
          x <= region.x + region.width + tolerance &&
          y >= region.y - tolerance &&
          y <= region.y + region.height + tolerance
        );

      case 'circle':
        if (region.radius === null) return false;
        const dx = x - region.x;
        const dy = y - region.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= region.radius + tolerance;

      case 'ellipse':
        if (region.width === null || region.height === null) return false;
        const radiusX = region.width / 2;
        const radiusY = region.height / 2;
        const dx2 = x - region.x;
        const dy2 = y - region.y;
        const normalized = (dx2 * dx2) / (radiusX * radiusX) + (dy2 * dy2) / (radiusY * radiusY);
        return normalized <= 1 + tolerance;

      case 'polygon':
        if (!region.points || region.points.length < 3) return false;
        // Simple bounding box check
        const xs = region.points.map(p => p.x);
        const ys = region.points.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        return (
          x >= minX - tolerance &&
          x <= maxX + tolerance &&
          y >= minY - tolerance &&
          y <= maxY + tolerance
        );

      default:
        return false;
    }
  }
</script>

{#if isGM}
  <canvas
    bind:this={canvas}
    on:click={handleClick}
    on:mousemove={handleMouseMove}
    class="region-layer"
    style="width: {canvasWidth}px; height: {canvasHeight}px;"
  />
{/if}

<style>
  .region-layer {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: auto;
    z-index: 3;
  }
</style>
