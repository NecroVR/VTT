<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { drawingsStore } from '$lib/stores/drawings';
  import type { Drawing, DrawingPoint } from '@vtt/shared';

  // Props
  export let sceneId: string = '';
  export let gridSize: number = 50;
  export let canvasWidth: number = 800;
  export let canvasHeight: number = 600;
  export let onDrawingClick: (drawingId: string) => void = () => {};

  // Canvas state
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;

  // Store subscriptions
  let drawings: Drawing[] = [];
  let selectedDrawingId: string | null = null;
  let tempPoints: DrawingPoint[] | undefined = undefined;
  let activeDrawingType: string | null = null;
  let activeDrawingSettings: any = {};

  const unsubscribe = drawingsStore.subscribe(state => {
    drawings = Array.from(state.drawings.values())
      .filter(d => d.sceneId === sceneId)
      .sort((a, b) => a.z - b.z);
    selectedDrawingId = state.selectedDrawingId;
    tempPoints = state.activeDrawing.tempPoints;
    activeDrawingType = state.activeDrawing.type;
    activeDrawingSettings = state.activeDrawing;
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

  // Re-render when drawings change
  $: if (ctx && (drawings || selectedDrawingId !== undefined || tempPoints !== undefined)) {
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

    // Draw all permanent drawings
    drawings.forEach(drawing => {
      const isSelected = drawing.id === selectedDrawingId;
      renderDrawing(drawing, isSelected);
    });

    // Draw temporary drawing (for freehand in progress)
    if (tempPoints && tempPoints.length > 0 && activeDrawingType) {
      renderTempDrawing();
    }
  }

  function renderDrawing(drawing: Drawing, isSelected: boolean) {
    if (!ctx) return;

    switch (drawing.drawingType) {
      case 'freehand':
        renderFreehand(drawing, isSelected);
        break;
      case 'rectangle':
        renderRectangle(drawing, isSelected);
        break;
      case 'circle':
        renderCircle(drawing, isSelected);
        break;
      case 'ellipse':
        renderEllipse(drawing, isSelected);
        break;
      case 'polygon':
        renderPolygon(drawing, isSelected);
        break;
      case 'text':
        renderText(drawing, isSelected);
        break;
    }
  }

  function renderFreehand(drawing: Drawing, isSelected: boolean) {
    if (!ctx || !drawing.points || drawing.points.length < 2) return;

    const points = drawing.points.map(p => ({
      x: p.x * gridSize,
      y: p.y * gridSize,
    }));

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    // Draw smooth curve through points
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.strokeStyle = drawing.strokeColor;
    ctx.lineWidth = drawing.strokeWidth;
    ctx.globalAlpha = drawing.strokeAlpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw selection outline
    if (isSelected) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = drawing.strokeWidth + 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  function renderRectangle(drawing: Drawing, isSelected: boolean) {
    if (!ctx || drawing.width === null || drawing.height === null) return;

    const x = drawing.x * gridSize;
    const y = drawing.y * gridSize;
    const width = (drawing.width || 0) * gridSize;
    const height = (drawing.height || 0) * gridSize;

    ctx.save();

    // Draw fill
    if (drawing.fillColor) {
      ctx.fillStyle = drawing.fillColor;
      ctx.globalAlpha = drawing.fillAlpha;
      ctx.fillRect(x, y, width, height);
    }

    // Draw stroke
    ctx.strokeStyle = drawing.strokeColor;
    ctx.lineWidth = drawing.strokeWidth;
    ctx.globalAlpha = drawing.strokeAlpha;
    ctx.strokeRect(x, y, width, height);

    // Draw selection outline
    if (isSelected) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = drawing.strokeWidth + 2;
      ctx.strokeRect(x, y, width, height);
    }

    ctx.restore();
  }

  function renderCircle(drawing: Drawing, isSelected: boolean) {
    if (!ctx || drawing.radius === null) return;

    const centerX = drawing.x * gridSize;
    const centerY = drawing.y * gridSize;
    const radius = (drawing.radius || 0) * gridSize;

    ctx.save();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);

    // Draw fill
    if (drawing.fillColor) {
      ctx.fillStyle = drawing.fillColor;
      ctx.globalAlpha = drawing.fillAlpha;
      ctx.fill();
    }

    // Draw stroke
    ctx.strokeStyle = drawing.strokeColor;
    ctx.lineWidth = drawing.strokeWidth;
    ctx.globalAlpha = drawing.strokeAlpha;
    ctx.stroke();

    // Draw selection outline
    if (isSelected) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = drawing.strokeWidth + 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  function renderEllipse(drawing: Drawing, isSelected: boolean) {
    if (!ctx || drawing.width === null || drawing.height === null) return;

    const centerX = drawing.x * gridSize;
    const centerY = drawing.y * gridSize;
    const radiusX = ((drawing.width || 0) / 2) * gridSize;
    const radiusY = ((drawing.height || 0) / 2) * gridSize;

    ctx.save();

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);

    // Draw fill
    if (drawing.fillColor) {
      ctx.fillStyle = drawing.fillColor;
      ctx.globalAlpha = drawing.fillAlpha;
      ctx.fill();
    }

    // Draw stroke
    ctx.strokeStyle = drawing.strokeColor;
    ctx.lineWidth = drawing.strokeWidth;
    ctx.globalAlpha = drawing.strokeAlpha;
    ctx.stroke();

    // Draw selection outline
    if (isSelected) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = drawing.strokeWidth + 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  function renderPolygon(drawing: Drawing, isSelected: boolean) {
    if (!ctx || !drawing.points || drawing.points.length < 3) return;

    const points = drawing.points.map(p => ({
      x: p.x * gridSize,
      y: p.y * gridSize,
    }));

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();

    // Draw fill
    if (drawing.fillColor) {
      ctx.fillStyle = drawing.fillColor;
      ctx.globalAlpha = drawing.fillAlpha;
      ctx.fill();
    }

    // Draw stroke
    ctx.strokeStyle = drawing.strokeColor;
    ctx.lineWidth = drawing.strokeWidth;
    ctx.globalAlpha = drawing.strokeAlpha;
    ctx.stroke();

    // Draw selection outline
    if (isSelected) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = drawing.strokeWidth + 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  function renderText(drawing: Drawing, isSelected: boolean) {
    if (!ctx || !drawing.text) return;

    const x = drawing.x * gridSize;
    const y = drawing.y * gridSize;
    const fontSize = drawing.fontSize || 16;
    const fontFamily = drawing.fontFamily || 'Arial';

    ctx.save();

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = drawing.textColor || drawing.strokeColor;
    ctx.globalAlpha = drawing.strokeAlpha;
    ctx.textBaseline = 'top';
    ctx.fillText(drawing.text, x, y);

    // Draw selection outline
    if (isSelected) {
      const metrics = ctx.measureText(drawing.text);
      const textWidth = metrics.width;
      const textHeight = fontSize;

      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 2, y - 2, textWidth + 4, textHeight + 4);
    }

    ctx.restore();
  }

  function renderTempDrawing() {
    if (!ctx || !tempPoints || tempPoints.length < 2) return;

    const points = tempPoints.map(p => ({
      x: p.x * gridSize,
      y: p.y * gridSize,
    }));

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.strokeStyle = activeDrawingSettings.strokeColor || '#000000';
    ctx.lineWidth = activeDrawingSettings.strokeWidth || 2;
    ctx.globalAlpha = activeDrawingSettings.strokeAlpha || 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.restore();
  }

  function handleClick(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / gridSize;
    const y = (event.clientY - rect.top) / gridSize;

    // Find clicked drawing (check in reverse order for top-most)
    for (let i = drawings.length - 1; i >= 0; i--) {
      const drawing = drawings[i];
      if (isPointInDrawing(x, y, drawing)) {
        onDrawingClick(drawing.id);
        return;
      }
    }

    // No drawing clicked, deselect
    drawingsStore.selectDrawing(null);
  }

  function isPointInDrawing(x: number, y: number, drawing: Drawing): boolean {
    const tolerance = 0.2; // Grid units

    switch (drawing.drawingType) {
      case 'rectangle':
      case 'ellipse':
        if (drawing.width === null || drawing.height === null) return false;
        return (
          x >= drawing.x - tolerance &&
          x <= drawing.x + drawing.width + tolerance &&
          y >= drawing.y - tolerance &&
          y <= drawing.y + drawing.height + tolerance
        );

      case 'circle':
        if (drawing.radius === null) return false;
        const dx = x - drawing.x;
        const dy = y - drawing.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= drawing.radius + tolerance;

      case 'freehand':
      case 'polygon':
        if (!drawing.points || drawing.points.length === 0) return false;
        // Simple bounding box check
        const xs = drawing.points.map(p => p.x);
        const ys = drawing.points.map(p => p.y);
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

      case 'text':
        // Approximate text bounding box
        const textWidth = (drawing.text?.length || 0) * ((drawing.fontSize || 16) * 0.6) / gridSize;
        const textHeight = (drawing.fontSize || 16) / gridSize;
        return (
          x >= drawing.x - tolerance &&
          x <= drawing.x + textWidth + tolerance &&
          y >= drawing.y - tolerance &&
          y <= drawing.y + textHeight + tolerance
        );

      default:
        return false;
    }
  }
</script>

<canvas
  bind:this={canvas}
  on:click={handleClick}
  class="drawing-layer"
  style="width: {canvasWidth}px; height: {canvasHeight}px;"
/>

<style>
  .drawing-layer {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: auto;
    z-index: 10;
  }
</style>
