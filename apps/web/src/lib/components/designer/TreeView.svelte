<script lang="ts">
  import type { LayoutNode } from '@vtt/shared';
  import TreeNode from './TreeNode.svelte';

  interface Props {
    layout: LayoutNode[];
    selectedNodeId?: string | null;
    onSelectNode?: (nodeId: string) => void;
  }

  let { layout, selectedNodeId = null, onSelectNode }: Props = $props();

  // Track expanded nodes
  let expandedNodes = $state(new Set<string>());

  function handleToggleExpand(nodeId: string) {
    if (expandedNodes.has(nodeId)) {
      expandedNodes.delete(nodeId);
    } else {
      expandedNodes.add(nodeId);
    }
    // Force reactivity
    expandedNodes = new Set(expandedNodes);
  }

  function handleSelectNode(nodeId: string) {
    onSelectNode?.(nodeId);
  }

  // Auto-expand parent nodes when a node is selected
  function expandToNode(nodes: LayoutNode[], targetId: string, parentId?: string): boolean {
    for (const node of nodes) {
      if (node.id === targetId) {
        if (parentId) {
          expandedNodes.add(parentId);
        }
        return true;
      }

      // Check children
      let childNodes: LayoutNode[] = [];
      if ('children' in node && Array.isArray(node.children)) {
        childNodes = node.children;
      } else if (node.type === 'tabs' && node.tabs) {
        childNodes = node.tabs.flatMap(tab => tab.children || []);
      } else if (node.type === 'repeater' && node.itemTemplate) {
        childNodes = node.itemTemplate;
      } else if (node.type === 'conditional') {
        childNodes = [...(node.then || []), ...(node.else || [])];
      }

      if (childNodes.length > 0) {
        const found = expandToNode(childNodes, targetId, node.id);
        if (found) {
          if (parentId) {
            expandedNodes.add(parentId);
          }
          expandedNodes.add(node.id);
          return true;
        }
      }
    }
    return false;
  }

  // Watch for selection changes and auto-expand
  $effect(() => {
    if (selectedNodeId) {
      expandToNode(layout, selectedNodeId);
      expandedNodes = new Set(expandedNodes);
    }
  });
</script>

<div class="tree-view">
  <div class="tree-view-header">
    <h4>Structure</h4>
    {#if layout.length === 0}
      <span class="node-count">Empty</span>
    {:else}
      <span class="node-count">{layout.length} root node(s)</span>
    {/if}
  </div>

  <div class="tree-view-content">
    {#if layout.length === 0}
      <div class="empty-message">
        <p>No components yet</p>
        <p class="hint">Drag components from the palette to get started</p>
      </div>
    {:else}
      {#each layout as node (node.id)}
        <TreeNode
          {node}
          depth={0}
          isSelected={node.id === selectedNodeId}
          {expandedNodes}
          {selectedNodeId}
          onSelect={handleSelectNode}
          onToggleExpand={handleToggleExpand}
        />
      {/each}
    {/if}
  </div>
</div>

<style>
  .tree-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .tree-view-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    background: var(--panel-header-bg, #f8f9fa);
    border-bottom: 1px solid var(--border-color, #ddd);
  }

  .tree-view-header h4 {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-muted, #6c757d);
  }

  .node-count {
    font-size: 0.75rem;
    color: var(--text-muted, #6c757d);
  }

  .tree-view-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .empty-message {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--text-muted, #6c757d);
  }

  .empty-message p {
    margin: 0 0 0.5rem 0;
  }

  .hint {
    font-size: 0.75rem;
    font-style: italic;
  }
</style>
