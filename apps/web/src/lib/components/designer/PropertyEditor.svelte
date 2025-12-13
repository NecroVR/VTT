<script lang="ts">
  import type { LayoutNode } from '@vtt/shared';
  import FieldProperties from './properties/FieldProperties.svelte';
  import ContainerProperties from './properties/ContainerProperties.svelte';
  import GridProperties from './properties/GridProperties.svelte';
  import FlexProperties from './properties/FlexProperties.svelte';
  import ColumnsProperties from './properties/ColumnsProperties.svelte';
  import TabsProperties from './properties/TabsProperties.svelte';
  import SectionProperties from './properties/SectionProperties.svelte';
  import RepeaterProperties from './properties/RepeaterProperties.svelte';
  import ConditionalProperties from './properties/ConditionalProperties.svelte';
  import StaticProperties from './properties/StaticProperties.svelte';
  import ComputedProperties from './properties/ComputedProperties.svelte';

  // Props
  interface Props {
    node: LayoutNode | null;
    onUpdate: (updates: Partial<LayoutNode>) => void;
  }

  let { node, onUpdate }: Props = $props();
</script>

<div class="property-editor" role="form" aria-label="Component properties editor">
  {#if !node}
    <div class="no-selection" role="status" aria-live="polite">
      <p>No node selected</p>
      <p class="help-text">Select a component from the canvas to edit its properties</p>
    </div>
  {:else}
    <div class="property-content">
      <!-- Node Type Badge -->
      <div class="node-type-badge" role="status" aria-label="Selected component: {node.type}">
        <span class="type-label">{node.type}</span>
        <span class="node-id" aria-label="Node ID">{node.id.slice(0, 8)}...</span>
      </div>

      <!-- Type-specific properties -->
      {#if node.type === 'field'}
        <FieldProperties {node} {onUpdate} />
      {:else if node.type === 'container'}
        <ContainerProperties {node} {onUpdate} />
      {:else if node.type === 'grid'}
        <GridProperties {node} {onUpdate} />
      {:else if node.type === 'flex'}
        <FlexProperties {node} {onUpdate} />
      {:else if node.type === 'columns'}
        <ColumnsProperties {node} {onUpdate} />
      {:else if node.type === 'tabs'}
        <TabsProperties {node} {onUpdate} />
      {:else if node.type === 'section'}
        <SectionProperties {node} {onUpdate} />
      {:else if node.type === 'repeater'}
        <RepeaterProperties {node} {onUpdate} />
      {:else if node.type === 'conditional'}
        <ConditionalProperties {node} {onUpdate} />
      {:else if node.type === 'static'}
        <StaticProperties {node} {onUpdate} />
      {:else if node.type === 'computed'}
        <ComputedProperties {node} {onUpdate} />
      {:else}
        <div class="unsupported-type" role="alert">
          <p>Unsupported node type: {node.type}</p>
        </div>
      {/if}

      <!-- Common properties for all nodes -->
      <div class="property-group">
        <div class="group-header">
          <h4 id="appearance-section">Appearance</h4>
        </div>
        <div class="group-content" role="group" aria-labelledby="appearance-section">
          <label for="css-class-input">
            <span title="Add custom CSS class names to style this component">CSS Class</span>
            <input
              id="css-class-input"
              type="text"
              value={node.className || ''}
              oninput={(e) => onUpdate({ className: (e.target as HTMLInputElement).value })}
              placeholder="custom-class"
              title="Enter custom CSS class names separated by spaces"
              aria-describedby="css-class-help"
            />
            <span id="css-class-help" class="sr-only">Enter custom CSS class names separated by spaces</span>
          </label>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .property-editor {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .no-selection {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--text-muted, #6c757d);
    padding: 2rem;
    gap: 0.5rem;
  }

  .no-selection p {
    margin: 0;
  }

  .help-text {
    font-size: 0.875rem;
  }

  .property-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .node-type-badge {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--badge-bg, #e9ecef);
    border-bottom: 1px solid var(--border-color, #ddd);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .type-label {
    font-weight: 600;
    text-transform: capitalize;
    color: var(--primary-color, #007bff);
  }

  .node-id {
    font-size: 0.75rem;
    color: var(--text-muted, #6c757d);
    font-family: monospace;
  }

  .property-group {
    border-bottom: 1px solid var(--border-color, #ddd);
  }

  .group-header {
    padding: 0.75rem 1rem;
    background: var(--group-header-bg, #f8f9fa);
    cursor: pointer;
    user-select: none;
  }

  .group-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color, #212529);
  }

  .group-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
  }

  label > span {
    font-weight: 500;
    color: var(--label-color, #495057);
  }

  input[type="text"],
  input[type="number"],
  textarea,
  select {
    padding: 0.5rem;
    border: 1px solid var(--input-border, #ced4da);
    border-radius: 4px;
    font-size: 0.875rem;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  input:focus,
  textarea:focus,
  select:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
  }

  .unsupported-type {
    padding: 1rem;
    text-align: center;
    color: var(--text-muted, #6c757d);
  }

  /* Screen reader only text */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
