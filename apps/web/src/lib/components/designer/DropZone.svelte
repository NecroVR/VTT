<script lang="ts">
  /**
   * DropZone - Visual indicator for drag-and-drop insertion points
   */

  interface Props {
    parentId: string;
    index: number;
    onDrop: (parentId: string, index: number, event: DragEvent) => void;
  }

  let { parentId, index, onDrop }: Props = $props();

  // State
  let isDragOver = $state(false);
  let dragCounter = $state(0);

  // Handlers
  function handleDragEnter(event: DragEvent) {
    event.preventDefault();
    dragCounter++;
    isDragOver = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      isDragOver = false;
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragCounter = 0;
    isDragOver = false;

    // Check if we have valid drop data
    const data = event.dataTransfer?.getData('application/vtt-component');
    if (data) {
      onDrop(parentId, index, event);
    }
  }
</script>

<div
  class="drop-zone"
  class:active={isDragOver}
  ondragenter={handleDragEnter}
  ondragleave={handleDragLeave}
  ondragover={handleDragOver}
  ondrop={handleDrop}
  role="region"
  aria-label="Drop zone for adding components"
>
  {#if isDragOver}
    <div class="drop-indicator">
      <span class="drop-text">Drop here</span>
    </div>
  {/if}
</div>

<style>
  .drop-zone {
    position: relative;
    height: 4px;
    margin: 4px 0;
    transition: all 0.2s ease;
  }

  .drop-zone::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--border-color, #ddd);
    transform: translateY(-50%);
  }

  .drop-zone.active {
    height: 32px;
    margin: 8px 0;
    background: var(--drop-zone-bg, rgba(0, 123, 255, 0.05));
  }

  .drop-zone.active::before {
    height: 2px;
    background: var(--primary-color, #007bff);
  }

  .drop-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .drop-text {
    display: inline-block;
    padding: 4px 12px;
    background: var(--primary-color, #007bff);
    color: white;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
  }
</style>
