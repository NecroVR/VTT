<script lang="ts">
  import type { LayoutNode } from '@vtt/shared';
  import TreeNode from './TreeNode.svelte';
  import { formDesignerStore } from '$lib/stores/formDesigner';

  interface Props {
    layout: LayoutNode[];
    selectedNodeId?: string | null;
    onSelectNode?: (nodeId: string) => void;
  }

  let { layout, selectedNodeId = null, onSelectNode }: Props = $props();

  // Track expanded nodes
  let expandedNodes = $state(new Set<string>());

  // Reference to tree view content for focus management
  let treeViewContent: HTMLDivElement | undefined = $state();

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

  // Keyboard navigation handler
  function handleKeyDown(event: KeyboardEvent) {
    if (!selectedNodeId) return;

    let nextNodeId: string | null = null;
    let shouldExpand = false;
    let shouldCollapse = false;

    switch (event.key) {
      case 'ArrowDown':
        // Select next visible node
        nextNodeId = formDesignerStore.getNextVisibleNode(selectedNodeId, expandedNodes);
        if (nextNodeId) {
          event.preventDefault();
        }
        break;

      case 'ArrowUp':
        // Select previous visible node
        nextNodeId = formDesignerStore.getPrevVisibleNode(selectedNodeId, expandedNodes);
        if (nextNodeId) {
          event.preventDefault();
        }
        break;

      case 'ArrowRight':
        event.preventDefault();
        // If collapsed, expand
        if (formDesignerStore.hasChildren(selectedNodeId) && !expandedNodes.has(selectedNodeId)) {
          handleToggleExpand(selectedNodeId);
        } else {
          // If already expanded, select first child
          const firstChildId = formDesignerStore.getFirstChildId(selectedNodeId);
          if (firstChildId) {
            nextNodeId = firstChildId;
          }
        }
        break;

      case 'ArrowLeft':
        event.preventDefault();
        // If expanded, collapse
        if (expandedNodes.has(selectedNodeId)) {
          handleToggleExpand(selectedNodeId);
        } else {
          // If collapsed, select parent
          const parentId = formDesignerStore.getParentNodeId(selectedNodeId);
          if (parentId) {
            nextNodeId = parentId;
          }
        }
        break;

      case 'Home':
        // Select first node
        nextNodeId = formDesignerStore.getFirstNode();
        if (nextNodeId) {
          event.preventDefault();
        }
        break;

      case 'End':
        // Select last visible node
        nextNodeId = formDesignerStore.getLastVisibleNode(expandedNodes);
        if (nextNodeId) {
          event.preventDefault();
        }
        break;
    }

    // Apply selection change
    if (nextNodeId && nextNodeId !== selectedNodeId) {
      handleSelectNode(nextNodeId);

      // Scroll selected node into view
      $effect(() => {
        if (treeViewContent) {
          const selectedElement = treeViewContent.querySelector(`[data-node-id="${nextNodeId}"]`);
          if (selectedElement) {
            selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }
      });
    }
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

  <div
    class="tree-view-content"
    bind:this={treeViewContent}
    tabindex="0"
    onkeydown={handleKeyDown}
    role="tree"
    aria-label="Form structure tree"
  >
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

  .tree-view-content:focus {
    outline: 2px solid var(--primary-color, #007bff);
    outline-offset: -2px;
  }

  .tree-view-content:focus-visible {
    outline: 2px solid var(--primary-color, #007bff);
    outline-offset: -2px;
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
