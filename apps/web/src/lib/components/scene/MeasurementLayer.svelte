<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { MeasurementTemplate, RulerMeasurement, TemplateType } from '@vtt/shared';
  import { templatesStore } from '$lib/stores/templates';

  // Props
  export let sceneId: string;
  export let gridSize: number = 50;
  export let gridDistance: number = 5;
  export let gridUnits: string = 'ft';
  export let canvasWidth: number = 800;
  export let canvasHeight: number = 600;

  // Canvas state
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;

  // Store subscriptions
  let templates: Map<string, MeasurementTemplate> = new Map();
  let activeRuler: RulerMeasurement | null = null;
  let selectedTemplateId: string | null = null;

  const unsubscribe = templatesStore.subscribe(state => {
    templates = state.templates;
    activeRuler = state.activeRuler;
    selectedTemplateId = state.selectedTemplateId;
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

  // Reactive rendering when state changes
  $: if (ctx && (templates || activeRuler || selectedTemplateId !== undefined)) {
    render();
  }

  $: if (canvas && (canvasWidth || canvasHeight)) {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    render();
  }

  function render() {
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw templates
    templates.forEach((template) => {
      if (template.sceneId === sceneId) {
        drawTemplate(template, template.id === selectedTemplateId);
      }
    });

    // Draw active ruler
    if (activeRuler && activeRuler.sceneId === sceneId) {
      drawRuler(activeRuler);
    }
  }

  function drawTemplate(template: MeasurementTemplate, isSelected: boolean) {
    if (!ctx) return;

    ctx.save();

    // Set fill and stroke styles
    ctx.fillStyle = hexToRgba(template.color, template.fillAlpha);
    ctx.strokeStyle = template.borderColor || template.color;
    ctx.lineWidth = isSelected ? 3 : 2;

    switch (template.templateType) {
      case 'circle':
        drawCircle(template);
        break;
      case 'cone':
        drawCone(template);
        break;
      case 'ray':
        drawRay(template);
        break;
      case 'rectangle':
        drawRectangle(template);
        break;
    }

    ctx.restore();
  }

  function drawCircle(template: MeasurementTemplate) {
    if (!ctx) return;

    const pixelX = template.x * gridSize;
    const pixelY = template.y * gridSize;
    const radius = (template.distance * gridSize) / gridDistance;

    ctx.beginPath();
    ctx.arc(pixelX, pixelY, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw center point
    ctx.fillStyle = template.borderColor || template.color;
    ctx.beginPath();
    ctx.arc(pixelX, pixelY, 4, 0, 2 * Math.PI);
    ctx.fill();
  }

  function drawCone(template: MeasurementTemplate) {
    if (!ctx) return;

    const pixelX = template.x * gridSize;
    const pixelY = template.y * gridSize;
    const length = (template.distance * gridSize) / gridDistance;
    const direction = (template.direction || 0) * Math.PI / 180; // Convert to radians
    const coneAngle = (template.angle || 53) * Math.PI / 180; // Default 53 degrees for D&D 5e

    // Calculate cone endpoints
    const halfAngle = coneAngle / 2;
    const leftAngle = direction - halfAngle;
    const rightAngle = direction + halfAngle;

    const leftX = pixelX + length * Math.cos(leftAngle);
    const leftY = pixelY + length * Math.sin(leftAngle);
    const rightX = pixelX + length * Math.cos(rightAngle);
    const rightY = pixelY + length * Math.sin(rightAngle);

    // Draw cone
    ctx.beginPath();
    ctx.moveTo(pixelX, pixelY);
    ctx.lineTo(leftX, leftY);
    ctx.arc(pixelX, pixelY, length, leftAngle, rightAngle);
    ctx.lineTo(pixelX, pixelY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw origin point
    ctx.fillStyle = template.borderColor || template.color;
    ctx.beginPath();
    ctx.arc(pixelX, pixelY, 4, 0, 2 * Math.PI);
    ctx.fill();
  }

  function drawRay(template: MeasurementTemplate) {
    if (!ctx) return;

    const pixelX = template.x * gridSize;
    const pixelY = template.y * gridSize;
    const length = (template.distance * gridSize) / gridDistance;
    const width = ((template.width || 1) * gridSize) / gridDistance;
    const direction = (template.direction || 0) * Math.PI / 180;

    // Calculate ray rectangle corners
    const endX = pixelX + length * Math.cos(direction);
    const endY = pixelY + length * Math.sin(direction);

    const perpAngle = direction + Math.PI / 2;
    const halfWidth = width / 2;

    const x1 = pixelX + halfWidth * Math.cos(perpAngle);
    const y1 = pixelY + halfWidth * Math.sin(perpAngle);
    const x2 = pixelX - halfWidth * Math.cos(perpAngle);
    const y2 = pixelY - halfWidth * Math.sin(perpAngle);
    const x3 = endX - halfWidth * Math.cos(perpAngle);
    const y3 = endY - halfWidth * Math.sin(perpAngle);
    const x4 = endX + halfWidth * Math.cos(perpAngle);
    const y4 = endY + halfWidth * Math.sin(perpAngle);

    // Draw ray
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x4, y4);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw origin point
    ctx.fillStyle = template.borderColor || template.color;
    ctx.beginPath();
    ctx.arc(pixelX, pixelY, 4, 0, 2 * Math.PI);
    ctx.fill();
  }

  function drawRectangle(template: MeasurementTemplate) {
    if (!ctx) return;

    const pixelX = template.x * gridSize;
    const pixelY = template.y * gridSize;
    const width = ((template.width || template.distance) * gridSize) / gridDistance;
    const height = (template.distance * gridSize) / gridDistance;

    ctx.fillRect(pixelX, pixelY, width, height);
    ctx.strokeRect(pixelX, pixelY, width, height);

    // Draw corner point
    ctx.fillStyle = template.borderColor || template.color;
    ctx.beginPath();
    ctx.arc(pixelX, pixelY, 4, 0, 2 * Math.PI);
    ctx.fill();
  }

  function drawRuler(ruler: RulerMeasurement) {
    if (!ctx || ruler.waypoints.length === 0) return;

    ctx.save();

    // Draw ruler lines
    ctx.strokeStyle = ruler.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    const firstPoint = ruler.waypoints[0];
    ctx.moveTo(firstPoint.x * gridSize, firstPoint.y * gridSize);

    for (let i = 1; i < ruler.waypoints.length; i++) {
      const point = ruler.waypoints[i];
      ctx.lineTo(point.x * gridSize, point.y * gridSize);
    }
    ctx.stroke();

    // Draw waypoints
    ctx.fillStyle = ruler.color;
    ctx.shadowColor = 'transparent';

    ruler.waypoints.forEach((point, index) => {
      const pixelX = point.x * gridSize;
      const pixelY = point.y * gridSize;

      // Draw waypoint circle
      ctx.beginPath();
      ctx.arc(pixelX, pixelY, index === 0 ? 6 : 4, 0, 2 * Math.PI);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw distance labels
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;

    let totalDistance = 0;
    for (let i = 1; i < ruler.waypoints.length; i++) {
      const p1 = ruler.waypoints[i - 1];
      const p2 = ruler.waypoints[i];

      const segmentDistance = calculateDistance(p1.x, p1.y, p2.x, p2.y, gridSize, gridDistance);
      totalDistance += segmentDistance;

      // Draw label at midpoint
      const midX = ((p1.x + p2.x) / 2) * gridSize;
      const midY = ((p1.y + p2.y) / 2) * gridSize;
      const label = `${segmentDistance.toFixed(1)} ${gridUnits}`;

      ctx.strokeText(label, midX, midY - 10);
      ctx.fillText(label, midX, midY - 10);
    }

    // Draw total distance at end
    if (ruler.waypoints.length > 1) {
      const lastPoint = ruler.waypoints[ruler.waypoints.length - 1];
      const endX = lastPoint.x * gridSize;
      const endY = lastPoint.y * gridSize;
      const totalLabel = `Total: ${totalDistance.toFixed(1)} ${gridUnits}`;

      ctx.strokeText(totalLabel, endX, endY + 20);
      ctx.fillText(totalLabel, endX, endY + 20);
    }

    ctx.restore();
  }

  function calculateDistance(x1: number, y1: number, x2: number, y2: number, gridSize: number, gridDistance: number): number {
    const pixelDistance = Math.sqrt(Math.pow((x2 - x1) * gridSize, 2) + Math.pow((y2 - y1) * gridSize, 2));
    return (pixelDistance / gridSize) * gridDistance;
  }

  function hexToRgba(hex: string, alpha: number): string {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
</script>

<canvas
  bind:this={canvas}
  width={canvasWidth}
  height={canvasHeight}
  class="measurement-layer"
  style="pointer-events: none;"
/>

<style>
  .measurement-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
  }
</style>
