<script lang="ts">
  /**
   * CanvasNode - Wrapper component for each node in the canvas
   * Handles selection, hover states, and quick actions
   */

  import type { LayoutNode } from '@vtt/shared';
  import { getNodeDisplayInfo, getNodeChildren, canHaveChildren } from './nodeDisplayHelpers';
  import DropZone from './DropZone.svelte';

  interface Props {
    node: LayoutNode;
    isSelected: boolean;
    depth: number;
    onSelect: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onDrop: (parentId: string, index: number, event: DragEvent) => void;
  }

  let {
    node,
    isSelected,
    depth,
    onSelect,
    onDelete,
    onDuplicate,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
    onDrop
  }: Props = $props();

  // Derived state
  let displayInfo = $derived(getNodeDisplayInfo(node));
  let children = $derived(getNodeChildren(node));
  let hasChildren = $derived(children.length > 0);
  let isContainer = $derived(canHaveChildren(node.type));

  // Local state
  let isHovered = $state(false);

  // Handle click to select
  function handleClick(event: MouseEvent) {
    event.stopPropagation();
    onSelect();
  }

  // Handle action button clicks
  function handleDelete(event: MouseEvent) {
    event.stopPropagation();
    onDelete();
  }

  function handleDuplicate(event: MouseEvent) {
    event.stopPropagation();
    onDuplicate();
  }

  function handleMoveUp(event: MouseEvent) {
    event.stopPropagation();
    onMoveUp();
  }

  function handleMoveDown(event: MouseEvent) {
    event.stopPropagation();
    onMoveDown();
  }

  // Calculate indentation
  let indentPx = $derived(depth * 16);
</script>

<div
  class="canvas-node"
  class:selected={isSelected}
  class:hovered={isHovered}
  class:container={isContainer}
  style="margin-left: {indentPx}px; background-color: {displayInfo.color};"
  onclick={handleClick}
  onmouseenter={() => isHovered = true}
  onmouseleave={() => isHovered = false}
  role="button"
  tabindex="0"
  aria-label={`${displayInfo.label} node`}
>
  <div class="node-header">
    <div class="node-info">
      <span class="node-icon">{displayInfo.icon}</span>
      <span class="node-label">{displayInfo.label}</span>
      {#if displayInfo.description}
        <span class="node-description">{displayInfo.description}</span>
      {/if}
    </div>

    {#if isHovered || isSelected}
      <div class="node-actions">
        {#if canMoveUp}
          <button
            class="action-btn move-up"
            type="button"
            onclick={handleMoveUp}
            title="Move up"
            aria-label="Move up"
          >
            ▲
          </button>
        {/if}
        {#if canMoveDown}
          <button
            class="action-btn move-down"
            type="button"
            onclick={handleMoveDown}
            title="Move down"
            aria-label="Move down"
          >
            ▼
          </button>
        {/if}
        <button
          class="action-btn duplicate"
          type="button"
          onclick={handleDuplicate}
          title="Duplicate"
          aria-label="Duplicate node"
        >
          ⎘
        </button>
        <button
          class="action-btn delete"
          type="button"
          onclick={handleDelete}
          title="Delete"
          aria-label="Delete node"
        >
          🗑️
        </button>
      </div>
    {/if}
  </div>

  {#if isContainer && hasChildren}
    <div class="node-children">
      {#each children as child, index}
        <DropZone
          parentId={node.id}
          {index}
          {onDrop}
        />
        <svelte:self
          node={child}
          isSelected={false}
          depth={depth + 1}
          onSelect={() => {}}
          onDelete={() => {}}
          onDuplicate={() => {}}
          onMoveUp={() => {}}
          onMoveDown={() => {}}
          canMoveUp={index > 0}
          canMoveDown={index < children.length - 1}
          {onDrop}
        />
      {/each}
      <DropZone
        parentId={node.id}
        index={children.length}
        {onDrop}
      />
    </div>
  {:else if isContainer}
    <div class="node-empty">
      <DropZone
        parentId={node.id}
        index={0}
        {onDrop}
      />
      <span class="empty-text">Empty container - drop components here</span>
    </div>
  {/if}
</div>

<style>
  .canvas-node {
    position: relative;
    margin: 8px 0;
    padding: 8px;
    border-radius: 4px;
    border: 2px solid transparent;
    transition: all 0.2s ease;
    cursor: pointer;
    user-select: none;
  }

  .canvas-node:hover {
    border-color: var(--hover-border, #90caf9);
  }

  .canvas-node.selected {
    border-color: var(--primary-color, #007bff);
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
  }

  .canvas-node.container {
    border-style: dashed;
  }

  .node-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .node-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .node-icon {
    flex-shrink: 0;
    font-size: 1.2rem;
    line-height: 1;
  }

  .node-label {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--text-primary, #212121);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .node-description {
    font-size: 0.75rem;
    color: var(--text-secondary, #757575);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .node-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .action-btn {
    padding: 4px 8px;
    background: white;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.75rem;
    line-height: 1;
    transition: all 0.15s ease;
    min-width: 24px;
    text-align: center;
  }

  .action-btn:hover {
    background: var(--bg-hover, #f5f5f5);
    transform: scale(1.05);
  }

  .action-btn:active {
    transform: scale(0.95);
  }

  .action-btn.delete {
    color: var(--danger-color, #d32f2f);
  }

  .action-btn.delete:hover {
    background: var(--danger-bg, #ffebee);
    border-color: var(--danger-color, #d32f2f);
  }

  .action-btn.duplicate {
    color: var(--primary-color, #007bff);
  }

  .action-btn.duplicate:hover {
    background: var(--primary-bg, #e3f2fd);
    border-color: var(--primary-color, #007bff);
  }

  .node-children {
    margin-top: 8px;
    padding-left: 8px;
    border-left: 2px solid var(--border-color, #e0e0e0);
  }

  .node-empty {
    margin-top: 8px;
    padding: 16px;
    border: 2px dashed var(--border-color, #ddd);
    border-radius: 4px;
    text-align: center;
  }

  .empty-text {
    display: block;
    margin-top: 8px;
    font-size: 0.75rem;
    color: var(--text-muted, #9e9e9e);
    font-style: italic;
  }
</style>
