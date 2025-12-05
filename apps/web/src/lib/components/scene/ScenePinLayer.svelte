<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { scenePinsStore } from '$lib/stores/scenePins';
  import type { ScenePin } from '@vtt/shared';

  // Props
  export let sceneId: string = '';
  export let gridSize: number = 50;
  export let canvasWidth: number = 800;
  export let canvasHeight: number = 600;
  export let onPinClick: (pinId: string) => void = () => {};

  // Canvas state
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;

  // Store subscriptions
  let pins: ScenePin[] = [];
  let selectedPinId: string | null = null;

  // Hover state
  let hoveredPinId: string | null = null;

  // Icon cache
  const iconCache = new Map<string, HTMLImageElement>();
  const iconLoadingStatus = new Map<string, 'loading' | 'loaded' | 'error'>();

  const unsubscribe = scenePinsStore.subscribe(state => {
    pins = Array.from(state.pins.values()).filter(p => p.sceneId === sceneId || p.global);
    selectedPinId = state.selectedPinId;
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

  // Re-render when pins change
  $: if (ctx && (pins || selectedPinId !== undefined || hoveredPinId !== undefined)) {
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

    // Draw all pins
    pins.forEach(pin => {
      const isSelected = pin.id === selectedPinId;
      const isHovered = pin.id === hoveredPinId;
      renderPin(pin, isSelected, isHovered);
    });
  }

  function renderPin(pin: ScenePin, isSelected: boolean, isHovered: boolean) {
    if (!ctx) return;

    const x = pin.x * gridSize;
    const y = pin.y * gridSize;
    const iconSize = pin.iconSize * gridSize;

    ctx.save();

    // Draw icon
    if (pin.icon) {
      const img = getIcon(pin.icon);
      if (img && iconLoadingStatus.get(pin.icon) === 'loaded') {
        // Apply tint if specified
        if (pin.iconTint) {
          ctx.fillStyle = pin.iconTint;
          ctx.beginPath();
          ctx.arc(x, y, iconSize / 2, 0, 2 * Math.PI);
          ctx.fill();
          ctx.globalCompositeOperation = 'multiply';
        }

        ctx.drawImage(img, x - iconSize / 2, y - iconSize / 2, iconSize, iconSize);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        // Draw default pin icon
        renderDefaultIcon(x, y, iconSize, pin.iconTint || '#3b82f6');
      }
    } else {
      // Draw default pin icon
      renderDefaultIcon(x, y, iconSize, pin.iconTint || '#3b82f6');
    }

    // Draw selection outline
    if (isSelected) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, iconSize / 2 + 2, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw hover highlight
    if (isHovered) {
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, iconSize / 2 + 1, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw tooltip on hover
    if (isHovered && pin.text) {
      renderTooltip(x, y + iconSize / 2 + 10, pin.text, pin.textColor);
    }

    ctx.restore();
  }

  function renderDefaultIcon(x: number, y: number, size: number, color: string) {
    if (!ctx) return;

    // Draw pin shape
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📍', x, y);
  }

  function renderTooltip(x: number, y: number, text: string, textColor: string) {
    if (!ctx) return;

    ctx.font = `${14}px sans-serif`;
    const textWidth = ctx.measureText(text).width;
    const padding = 8;
    const tooltipWidth = textWidth + padding * 2;
    const tooltipHeight = 30;

    // Center tooltip horizontally on pin
    const tooltipX = x - tooltipWidth / 2;
    const tooltipY = y;

    // Draw tooltip background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

    // Draw tooltip border
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

    // Draw text
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, tooltipY + tooltipHeight / 2);
  }

  function getIcon(url: string): HTMLImageElement | null {
    // Check cache first
    if (iconCache.has(url)) {
      return iconCache.get(url)!;
    }

    // Check if already loading
    if (iconLoadingStatus.has(url)) {
      return null;
    }

    // Start loading
    iconLoadingStatus.set(url, 'loading');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      iconLoadingStatus.set(url, 'loaded');
      iconCache.set(url, img);
      render(); // Re-render when icon loads
    };

    img.onerror = () => {
      iconLoadingStatus.set(url, 'error');
      render(); // Re-render to show default
    };

    img.src = url;
    return null;
  }

  function handleClick(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / gridSize;
    const y = (event.clientY - rect.top) / gridSize;

    // Find clicked pin (check in reverse order for top-most)
    for (let i = pins.length - 1; i >= 0; i--) {
      const pin = pins[i];
      if (isPointInPin(x, y, pin)) {
        onPinClick(pin.id);

        // If pin has a journal link, open it
        if (pin.journalId) {
          openJournal(pin.journalId, pin.pageId);
        }
        return;
      }
    }

    // No pin clicked, deselect
    scenePinsStore.selectPin(null);
  }

  function handleMouseMove(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / gridSize;
    const y = (event.clientY - rect.top) / gridSize;

    // Find hovered pin
    let foundHover = false;
    for (let i = pins.length - 1; i >= 0; i--) {
      const pin = pins[i];
      if (isPointInPin(x, y, pin)) {
        hoveredPinId = pin.id;
        foundHover = true;
        break;
      }
    }

    if (!foundHover) {
      hoveredPinId = null;
    }
  }

  function isPointInPin(x: number, y: number, pin: ScenePin): boolean {
    const dx = x - pin.x;
    const dy = y - pin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = pin.iconSize / 2 + 0.2; // Add tolerance
    return distance <= radius;
  }

  function openJournal(journalId: string, pageId: string | null | undefined) {
    // TODO: Implement journal opening
    // This should dispatch an event or call a function to open the journal sheet
    console.log('Opening journal:', journalId, 'page:', pageId);

    // Dispatch custom event that parent components can listen to
    const event = new CustomEvent('open-journal', {
      detail: { journalId, pageId },
      bubbles: true,
    });
    canvas.dispatchEvent(event);
  }
</script>

<canvas
  bind:this={canvas}
  on:click={handleClick}
  on:mousemove={handleMouseMove}
  class="scene-pin-layer"
  style="width: {canvasWidth}px; height: {canvasHeight}px;"
/>

<style>
  .scene-pin-layer {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: auto;
    z-index: 9;
    cursor: pointer;
  }
</style>
