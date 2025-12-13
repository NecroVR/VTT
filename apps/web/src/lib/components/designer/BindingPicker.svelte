<script lang="ts">
  import { getEntitySchema, searchProperties, type PropertyDefinition } from './entitySchema';

  interface Props {
    open: boolean;
    currentBinding: string;
    onSelect: (path: string) => void;
    onClose: () => void;
    arrayOnly?: boolean; // If true, only show array properties (for repeater)
  }

  let { open, currentBinding, onSelect, onClose, arrayOnly = false }: Props = $props();

  let searchTerm = $state('');
  let selectedPath = $state(currentBinding);
  let expandedPaths = $state<Set<string>>(new Set());

  const schema = getEntitySchema();

  // Auto-expand parent nodes of currently selected binding
  $effect(() => {
    if (currentBinding) {
      const parts = currentBinding.split('.');
      let path = '';
      for (let i = 0; i < parts.length - 1; i++) {
        path = path ? `${path}.${parts[i]}` : parts[i];
        expandedPaths.add(path);
      }
      selectedPath = currentBinding;
    }
  });

  // Get filtered properties based on search
  const filteredSchema = $derived(() => {
    if (!searchTerm.trim()) {
      return schema;
    }

    const matches = searchProperties(schema, searchTerm);

    // Build a new schema tree containing only matches and their parents
    if (matches.length === 0) {
      return { ...schema, children: [] };
    }

    // Auto-expand all parents of search results
    matches.forEach(match => {
      const parts = match.path.split('.');
      let path = '';
      for (let i = 0; i < parts.length; i++) {
        path = path ? `${path}.${parts[i]}` : parts[i];
        expandedPaths.add(path);
      }
    });

    return schema;
  });

  function toggleExpand(path: string) {
    if (expandedPaths.has(path)) {
      expandedPaths.delete(path);
    } else {
      expandedPaths.add(path);
    }
    expandedPaths = new Set(expandedPaths); // Trigger reactivity
  }

  function selectProperty(prop: PropertyDefinition) {
    // Can only select leaf nodes or arrays
    if (prop.type !== 'object' || prop.type === 'array') {
      selectedPath = prop.path;
    }
  }

  function handleSelect() {
    if (selectedPath) {
      onSelect(selectedPath);
    }
  }

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function getTypeIcon(type: string): string {
    switch (type) {
      case 'string':
        return '📝';
      case 'number':
        return '🔢';
      case 'boolean':
        return '☑️';
      case 'array':
        return '📋';
      case 'object':
        return '📦';
      default:
        return '❓';
    }
  }

  function shouldShowProperty(prop: PropertyDefinition): boolean {
    // If arrayOnly mode, only show arrays
    if (arrayOnly && prop.type !== 'array' && prop.type !== 'object') {
      return false;
    }

    // If searching, show only matches
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const nameMatch = prop.name.toLowerCase().includes(term);
      const pathMatch = prop.path.toLowerCase().includes(term);

      // Show if this property matches or if any children match
      if (nameMatch || pathMatch) {
        return true;
      }

      if (prop.children) {
        return prop.children.some(child => shouldShowProperty(child));
      }

      return false;
    }

    return true;
  }

  function isSelectable(prop: PropertyDefinition): boolean {
    // Can't select objects (only their leaf properties)
    // Arrays are selectable for repeater binding
    return prop.type !== 'object';
  }
</script>

{#if open}
  <div class="modal-overlay" onclick={handleOverlayClick} role="presentation">
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="picker-title">
      <div class="modal-header">
        <h3 id="picker-title">Select Property</h3>
        <button type="button" class="btn-close" onclick={onClose} aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        <div class="search-box">
          <input
            type="text"
            bind:value={searchTerm}
            placeholder="Search properties..."
            class="search-input"
          />
        </div>

        <div class="tree-container">
          {#if schema.children}
            {#each schema.children as prop}
              {#if shouldShowProperty(prop)}
                <PropertyTreeNode
                  {prop}
                  {expandedPaths}
                  {selectedPath}
                  {searchTerm}
                  {arrayOnly}
                  onToggle={toggleExpand}
                  onSelect={selectProperty}
                  level={0}
                />
              {/if}
            {/each}
          {/if}
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-secondary" onclick={onClose}>Cancel</button>
        <button
          type="button"
          class="btn-primary"
          onclick={handleSelect}
          disabled={!selectedPath}
        >
          Select
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Recursive tree node component -->
{#snippet PropertyTreeNode(props: {
  prop: PropertyDefinition;
  expandedPaths: Set<string>;
  selectedPath: string;
  searchTerm: string;
  arrayOnly: boolean;
  onToggle: (path: string) => void;
  onSelect: (prop: PropertyDefinition) => void;
  level: number;
})}
  {@const { prop, expandedPaths, selectedPath, searchTerm, arrayOnly, onToggle, onSelect, level } = props}
  {@const hasChildren = prop.children && prop.children.length > 0}
  {@const isExpanded = expandedPaths.has(prop.path)}
  {@const isSelected = selectedPath === prop.path}
  {@const selectable = isSelectable(prop)}

  {#if shouldShowProperty(prop)}
    <div class="tree-node" style="padding-left: {level * 1.5}rem">
      <div
        class="tree-node-content"
        class:selected={isSelected}
        class:selectable={selectable}
        role="button"
        tabindex="0"
        onclick={() => {
          if (selectable) {
            onSelect(prop);
          }
          if (hasChildren) {
            onToggle(prop.path);
          }
        }}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (selectable) {
              onSelect(prop);
            }
            if (hasChildren) {
              onToggle(prop.path);
            }
          }
        }}
        title={prop.description || prop.path}
      >
        {#if hasChildren}
          <span class="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        {:else}
          <span class="expand-icon placeholder"></span>
        {/if}

        <span class="type-icon">{getTypeIcon(prop.type)}</span>

        <span class="prop-name">{prop.name}</span>

        {#if prop.computed}
          <span class="computed-badge" title="Computed field">ƒ</span>
        {/if}

        <span class="prop-type">{prop.type}</span>
      </div>

      {#if hasChildren && isExpanded}
        {#each prop.children as child}
          {#if shouldShowProperty(child)}
            {@render PropertyTreeNode({
              prop: child,
              expandedPaths,
              selectedPath,
              searchTerm,
              arrayOnly,
              onToggle,
              onSelect,
              level: level + 1
            })}
          {/if}
        {/each}
      {/if}
    </div>
  {/if}
{/snippet}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-dialog {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    width: 100%;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color, #ddd);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color, #212529);
  }

  .btn-close {
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    color: var(--text-muted, #6c757d);
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-close:hover {
    color: var(--text-color, #212529);
  }

  .modal-body {
    padding: 1rem 1.5rem;
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .search-box {
    flex-shrink: 0;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--input-border, #ced4da);
    border-radius: 4px;
    font-size: 0.875rem;
    box-sizing: border-box;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
  }

  .tree-container {
    flex: 1;
    overflow-y: auto;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    padding: 0.5rem;
  }

  .tree-node {
    margin: 0;
  }

  .tree-node-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    transition: background 0.15s;
  }

  .tree-node-content:hover {
    background: var(--hover-bg, #f0f0f0);
  }

  .tree-node-content.selected {
    background: var(--primary-color, #007bff);
    color: white;
  }

  .tree-node-content.selected .prop-type,
  .tree-node-content.selected .expand-icon {
    color: rgba(255, 255, 255, 0.7);
  }

  .tree-node-content:not(.selectable) {
    cursor: default;
  }

  .tree-node-content:not(.selectable):hover {
    background: transparent;
  }

  .expand-icon {
    width: 1rem;
    text-align: center;
    font-size: 0.75rem;
    color: var(--text-muted, #6c757d);
  }

  .expand-icon.placeholder {
    opacity: 0;
  }

  .type-icon {
    font-size: 1rem;
  }

  .prop-name {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .computed-badge {
    background: var(--warning-color, #ffc107);
    color: var(--text-dark, #212529);
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-size: 0.75rem;
    font-weight: 600;
    font-style: italic;
  }

  .tree-node-content.selected .computed-badge {
    background: rgba(255, 193, 7, 0.9);
  }

  .prop-type {
    font-size: 0.75rem;
    color: var(--text-muted, #6c757d);
    text-transform: uppercase;
    font-weight: 500;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color, #ddd);
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .btn-secondary,
  .btn-primary {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
  }

  .btn-secondary {
    background: var(--secondary-bg, #6c757d);
    color: white;
  }

  .btn-secondary:hover {
    background: var(--secondary-hover, #5a6268);
  }

  .btn-primary {
    background: var(--primary-color, #007bff);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--primary-hover, #0056b3);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Scrollbar styling */
  .tree-container::-webkit-scrollbar {
    width: 8px;
  }

  .tree-container::-webkit-scrollbar-track {
    background: var(--scrollbar-track, #f1f1f1);
    border-radius: 4px;
  }

  .tree-container::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb, #888);
    border-radius: 4px;
  }

  .tree-container::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover, #555);
  }
</style>
