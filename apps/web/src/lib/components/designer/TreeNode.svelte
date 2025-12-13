<script lang="ts">
  import type { LayoutNode } from '@vtt/shared';
  import { getTreeNodeInfo, getNodeChildren, hasChildren } from './treeHelpers';

  interface Props {
    node: LayoutNode;
    depth?: number;
    isSelected?: boolean;
    isExpanded?: boolean;
    onSelect?: (nodeId: string) => void;
    onToggleExpand?: (nodeId: string) => void;
    expandedNodes?: Set<string>;
    selectedNodeId?: string | null;
  }

  let {
    node,
    depth = 0,
    isSelected = false,
    isExpanded = false,
    onSelect,
    onToggleExpand,
    expandedNodes,
    selectedNodeId
  }: Props = $props();

  const nodeInfo = $derived(getTreeNodeInfo(node));
  const children = $derived(getNodeChildren(node));
  const _hasChildren = $derived(children.length > 0);
  const _isExpanded = $derived(expandedNodes?.has(node.id) ?? isExpanded);

  function handleClick(event: MouseEvent) {
    event.stopPropagation();
    onSelect?.(node.id);
  }

  function handleToggleExpand(event: MouseEvent) {
    event.stopPropagation();
    if (_hasChildren) {
      onToggleExpand?.(node.id);
    }
  }

  function handleDoubleClick(event: MouseEvent) {
    event.stopPropagation();
    if (_hasChildren) {
      onToggleExpand?.(node.id);
    }
  }
</script>

<div class="tree-node" class:selected={isSelected} data-node-id={node.id}>
  <div
    class="tree-node-content"
    style="padding-left: {depth * 16}px"
    onclick={handleClick}
    ondblclick={handleDoubleClick}
    role="treeitem"
    aria-selected={isSelected}
    aria-expanded={_hasChildren ? _isExpanded : undefined}
    aria-level={depth + 1}
    aria-label="{nodeInfo.label} - {node.type}"
    tabindex="-1"
  >
    {#if _hasChildren}
      <button
        class="expand-arrow"
        class:expanded={_isExpanded}
        onclick={handleToggleExpand}
        aria-label="{_isExpanded ? 'Collapse' : 'Expand'} {nodeInfo.label}"
        tabindex="-1"
      >
        ▶
      </button>
    {:else}
      <span class="expand-spacer"></span>
    {/if}

    <span class="node-icon" aria-hidden="true">{nodeInfo.icon}</span>
    <span class="node-label">{nodeInfo.label}</span>
  </div>

  {#if _hasChildren && _isExpanded}
    <div class="tree-node-children" role="group">
      {#each children as child (child.id)}
        <svelte:self
          node={child}
          depth={depth + 1}
          isSelected={child.id === selectedNodeId}
          {expandedNodes}
          {selectedNodeId}
          {onSelect}
          {onToggleExpand}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .tree-node {
    user-select: none;
  }

  .tree-node-content {
    display: flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    transition: background-color 0.15s;
    gap: 0.25rem;
  }

  .tree-node-content:hover {
    background: var(--hover-bg, #f0f0f0);
  }

  .tree-node.selected > .tree-node-content {
    background: var(--primary-color, #007bff);
    color: white;
  }

  .tree-node.selected > .tree-node-content:hover {
    background: var(--primary-color-hover, #0056b3);
  }

  .expand-arrow {
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    font-size: 0.625rem;
    line-height: 1;
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
    color: inherit;
  }

  .expand-arrow.expanded {
    transform: rotate(90deg);
  }

  .expand-spacer {
    width: 12px;
    height: 12px;
    display: inline-block;
  }

  .node-icon {
    font-size: 1rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .node-label {
    font-size: 0.875rem;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tree-node-children {
    /* Children are rendered recursively */
  }
</style>
