<script lang="ts">
  /**
   * DesignerCanvas - Main canvas editing area for the form designer
   * Renders the form layout structure with drag-drop support
   */

  import type { LayoutNode } from '@vtt/shared';
  import CanvasNode from './CanvasNode.svelte';
  import DropZone from './DropZone.svelte';
  import { formDesignerStore } from '$lib/stores/formDesigner';

  interface Props {
    layout: LayoutNode[];
    selectedNodeId: string | null;
    onSelectNode: (nodeId: string | null) => void;
  }

  let { layout, selectedNodeId, onSelectNode }: Props = $props();

  // Handle drop event - create new node from palette
  function handleDrop(parentId: string, index: number, event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    const data = event.dataTransfer?.getData('application/vtt-component');
    if (!data) return;

    try {
      const { template } = JSON.parse(data);

      // Create new node with unique ID
      const newNode: LayoutNode = {
        ...template,
        id: crypto.randomUUID()
      };

      // Add to form via store
      formDesignerStore.addNode(parentId, newNode, index);
    } catch (err) {
      console.error('Failed to parse drop data:', err);
    }
  }

  // Handle node selection
  function handleSelectNode(nodeId: string) {
    onSelectNode(nodeId);
  }

  // Handle node deletion
  function handleDeleteNode(nodeId: string) {
    if (confirm('Are you sure you want to delete this node?')) {
      formDesignerStore.removeNode(nodeId);
    }
  }

  // Handle node duplication
  function handleDuplicateNode(nodeId: string) {
    formDesignerStore.copyNode(nodeId);
    // Find parent to paste into
    const parent = formDesignerStore.getParentNode(nodeId);
    if (parent) {
      formDesignerStore.pasteNode(parent.id);
    } else {
      // Top-level node, paste to root
      formDesignerStore.pasteNode('root');
    }
  }

  // Handle node movement
  function handleMoveUp(nodeId: string, parentId: string, currentIndex: number) {
    if (currentIndex > 0) {
      formDesignerStore.moveNode(nodeId, parentId, currentIndex - 1);
    }
  }

  function handleMoveDown(nodeId: string, parentId: string, currentIndex: number, totalChildren: number) {
    if (currentIndex < totalChildren - 1) {
      formDesignerStore.moveNode(nodeId, parentId, currentIndex + 1);
    }
  }

  // Handle clicking on canvas background (deselect)
  function handleCanvasClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onSelectNode(null);
    }
  }

  // Handle root-level drop
  function handleRootDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    const data = event.dataTransfer?.getData('application/vtt-component');
    if (!data) return;

    try {
      const { template } = JSON.parse(data);

      const newNode: LayoutNode = {
        ...template,
        id: crypto.randomUUID()
      };

      formDesignerStore.addNode('root', newNode, layout.length);
    } catch (err) {
      console.error('Failed to parse drop data:', err);
    }
  }

  function handleRootDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }
</script>

<div
  class="designer-canvas"
  onclick={handleCanvasClick}
  role="region"
  aria-label="Form canvas"
>
  {#if layout.length === 0}
    <!-- Empty canvas state -->
    <div
      class="empty-canvas"
      ondrop={handleRootDrop}
      ondragover={handleRootDragOver}
      role="region"
      aria-label="Empty canvas - drop components here"
    >
      <div class="empty-content">
        <div class="empty-icon">📋</div>
        <h3 class="empty-title">Empty Form</h3>
        <p class="empty-message">
          Drag components from the palette to start building your form
        </p>
      </div>
    </div>
  {:else}
    <!-- Canvas with nodes -->
    <div class="canvas-content">
      {#each layout as node, index}
        <DropZone
          parentId="root"
          {index}
          onDrop={handleDrop}
        />
        <CanvasNode
          {node}
          isSelected={selectedNodeId === node.id}
          depth={0}
          onSelect={() => handleSelectNode(node.id)}
          onDelete={() => handleDeleteNode(node.id)}
          onDuplicate={() => handleDuplicateNode(node.id)}
          onMoveUp={() => handleMoveUp(node.id, 'root', index)}
          onMoveDown={() => handleMoveDown(node.id, 'root', index, layout.length)}
          canMoveUp={index > 0}
          canMoveDown={index < layout.length - 1}
          onDrop={handleDrop}
        />
      {/each}
      <DropZone
        parentId="root"
        index={layout.length}
        onDrop={handleDrop}
      />
    </div>
  {/if}
</div>

<style>
  .designer-canvas {
    height: 100%;
    overflow: auto;
    padding: 16px;
    background: var(--canvas-bg, #fafafa);
  }

  .empty-canvas {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    height: 100%;
    border: 2px dashed var(--border-color, #ddd);
    border-radius: 8px;
    background: white;
    transition: all 0.2s ease;
  }

  .empty-canvas:dragover {
    border-color: var(--primary-color, #007bff);
    background: var(--drop-zone-bg, rgba(0, 123, 255, 0.05));
  }

  .empty-content {
    text-align: center;
    padding: 32px;
    max-width: 400px;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-title {
    margin: 0 0 8px 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary, #212121);
  }

  .empty-message {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-secondary, #757575);
    line-height: 1.5;
  }

  .canvas-content {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    min-height: 400px;
  }
</style>
