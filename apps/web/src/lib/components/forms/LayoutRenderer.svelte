<script lang="ts">
  import type { LayoutNode, FormFragment, FormComputedField, VisibilityCondition } from '@vtt/shared';
  import FieldRenderer from './FieldRenderer.svelte';

  interface Props {
    node: LayoutNode;
    entity: Record<string, unknown>;
    mode: 'view' | 'edit';
    fragments: FormFragment[];
    computedFields: FormComputedField[];
    onChange: (path: string, value: unknown) => void;
    repeaterContext?: { index: number; item: unknown };  // For repeater items
  }

  let { node, entity, mode, fragments, computedFields, onChange, repeaterContext }: Props = $props();

  // Check visibility condition
  function evaluateCondition(condition: VisibilityCondition | undefined): boolean {
    if (!condition) return true;

    if (condition.type === 'simple') {
      const value = getValueByPath(entity, condition.field);
      switch (condition.operator) {
        case 'equals': return value === condition.value;
        case 'notEquals': return value !== condition.value;
        case 'isEmpty': return value == null || value === '';
        case 'isNotEmpty': return value != null && value !== '';
        case 'greaterThan': return (value as number) > (condition.value as number);
        case 'lessThan': return (value as number) < (condition.value as number);
        case 'contains': return String(value).includes(String(condition.value));
        default: return true;
      }
    }

    if (condition.type === 'compound') {
      if (condition.operator === 'and') {
        return condition.conditions.every(c => evaluateCondition(c));
      } else {
        return condition.conditions.some(c => evaluateCondition(c));
      }
    }

    return true;
  }

  // Get nested value by dot notation path
  function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
    // Replace {{index}} with actual repeater index if in repeater context
    let resolvedPath = path;
    if (repeaterContext && path.includes('[{{index}}]')) {
      resolvedPath = path.replace('[{{index}}]', `[${repeaterContext.index}]`);
    }

    return resolvedPath.split('.').reduce((current, key) => {
      if (current == null) return undefined;
      // Handle array access like [0]
      const match = key.match(/^(.+)\[(\d+)\]$/);
      if (match) {
        const arr = (current as Record<string, unknown>)[match[1]] as unknown[];
        return arr?.[parseInt(match[2])];
      }
      return (current as Record<string, unknown>)[key];
    }, obj as unknown);
  }

  let isVisible = $derived(evaluateCondition(node.visibility));
</script>

{#if isVisible}
  {#if node.type === 'field'}
    <FieldRenderer
      {node}
      {entity}
      {mode}
      {onChange}
      {repeaterContext}
    />
  {:else if node.type === 'container' || node.type === 'group'}
    <div
      class="layout-container"
      class:group={node.type === 'group'}
      class:has-border={node.type === 'group' && node.border}
      style={node.style ? Object.entries(node.style).map(([k, v]) => `${k}: ${v}`).join(';') : ''}
    >
      {#if node.type === 'group' && node.title}
        <div class="group-title">{node.title}</div>
      {/if}
      {#each node.children as child}
        <svelte:self
          node={child}
          {entity}
          {mode}
          {fragments}
          {computedFields}
          {onChange}
          {repeaterContext}
        />
      {/each}
    </div>
  {:else if node.type === 'grid'}
    <div
      class="layout-grid"
      style="
        display: grid;
        grid-template-columns: {typeof node.columns === 'number' ? `repeat(${node.columns}, 1fr)` : node.columns};
        gap: {node.gap || '0.5rem'};
        {node.style ? Object.entries(node.style).map(([k, v]) => `${k}: ${v}`).join(';') : ''}
      "
    >
      {#each node.children as child}
        <svelte:self
          node={child}
          {entity}
          {mode}
          {fragments}
          {computedFields}
          {onChange}
          {repeaterContext}
        />
      {/each}
    </div>
  {:else if node.type === 'flex'}
    <div
      class="layout-flex"
      style="
        display: flex;
        flex-direction: {node.direction};
        justify-content: {node.justify || 'flex-start'};
        align-items: {node.align || 'stretch'};
        flex-wrap: {node.wrap ? 'wrap' : 'nowrap'};
        gap: {node.gap || '0.5rem'};
      "
    >
      {#each node.children as child}
        <svelte:self
          node={child}
          {entity}
          {mode}
          {fragments}
          {computedFields}
          {onChange}
          {repeaterContext}
        />
      {/each}
    </div>
  {:else if node.type === 'section'}
    {@const isCollapsed = $state(node.defaultCollapsed || false)}
    <div class="layout-section">
      <div
        class="section-header"
        class:collapsible={node.collapsible}
        onclick={() => { if (node.collapsible) isCollapsed = !isCollapsed; }}
      >
        {#if node.icon}
          <span class="section-icon">{node.icon}</span>
        {/if}
        <span class="section-title">{node.title}</span>
        {#if node.collapsible}
          <span class="collapse-indicator">{isCollapsed ? '▶' : '▼'}</span>
        {/if}
      </div>
      {#if !isCollapsed}
        <div class="section-content">
          {#each node.children as child}
            <svelte:self
              node={child}
              {entity}
              {mode}
              {fragments}
              {computedFields}
              {onChange}
              {repeaterContext}
            />
          {/each}
        </div>
      {/if}
    </div>
  {:else if node.type === 'tabs'}
    {@const activeTab = $state(node.defaultTab || node.tabs[0]?.id)}
    <div class="layout-tabs" class:tabs-{node.position || 'top'}>
      <div class="tab-bar">
        {#each node.tabs as tab}
          <button
            class="tab-button"
            class:active={activeTab === tab.id}
            onclick={() => { activeTab = tab.id; }}
          >
            {#if tab.icon}
              <span class="tab-icon">{tab.icon}</span>
            {/if}
            {tab.label}
          </button>
        {/each}
      </div>
      <div class="tab-content">
        {#each node.tabs as tab}
          {#if activeTab === tab.id}
            {#each tab.children as child}
              <svelte:self
                node={child}
                {entity}
                {mode}
                {fragments}
                {computedFields}
                {onChange}
                {repeaterContext}
              />
            {/each}
          {/if}
        {/each}
      </div>
    </div>
  {:else if node.type === 'static'}
    <div class="layout-static" class:static-{node.contentType || 'text'}>
      {#if node.contentType === 'html'}
        {@html node.content}
      {:else}
        {node.content}
      {/if}
    </div>
  {:else if node.type === 'spacer'}
    <div
      class="layout-spacer"
      style="
        {node.orientation === 'horizontal' ? 'width' : 'height'}: {node.size || '1rem'};
      "
    ></div>
  {:else if node.type === 'divider'}
    <hr
      class="layout-divider"
      class:vertical={node.orientation === 'vertical'}
    />
  {:else if node.type === 'repeater'}
    {@const items = (getValueByPath(entity, node.binding) as unknown[]) || []}
    <div class="layout-repeater">
      {#if items.length === 0 && node.emptyMessage}
        <div class="repeater-empty">{node.emptyMessage}</div>
      {:else}
        {#each items as item, index}
          <div class="repeater-item">
            {#each node.itemTemplate as templateNode}
              <svelte:self
                node={templateNode}
                {entity}
                {mode}
                {fragments}
                {computedFields}
                {onChange}
                repeaterContext={{ index, item }}
              />
            {/each}
          </div>
        {/each}
      {/if}
      {#if mode === 'edit'}
        <button class="add-item-btn" type="button">
          {node.addLabel || 'Add Item'}
        </button>
      {/if}
    </div>
  {:else if node.type === 'conditional'}
    {#if evaluateCondition(node.condition)}
      {#each node.then as thenNode}
        <svelte:self
          node={thenNode}
          {entity}
          {mode}
          {fragments}
          {computedFields}
          {onChange}
          {repeaterContext}
        />
      {/each}
    {:else if node.else}
      {#each node.else as elseNode}
        <svelte:self
          node={elseNode}
          {entity}
          {mode}
          {fragments}
          {computedFields}
          {onChange}
          {repeaterContext}
        />
      {/each}
    {/if}
  {:else}
    <!-- Unknown node type -->
    <div class="unknown-node">Unknown node type: {(node as unknown as {type: string}).type}</div>
  {/if}
{/if}

<style>
  /* Container styles */
  .layout-container { display: contents; }
  .group {
    display: block;
    margin: 0.5rem 0;
  }
  .has-border {
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    padding: 0.5rem;
  }
  .group-title {
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  /* Section styles */
  .layout-section {
    margin: 0.5rem 0;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
  }
  .section-header {
    padding: 0.5rem;
    background: var(--section-bg, #f5f5f5);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .section-header.collapsible { cursor: pointer; }
  .section-title { font-weight: bold; flex: 1; }
  .section-content { padding: 0.5rem; }

  /* Tabs styles */
  .layout-tabs { display: flex; flex-direction: column; }
  .tab-bar { display: flex; gap: 0.25rem; border-bottom: 1px solid var(--border-color, #ccc); }
  .tab-button {
    padding: 0.5rem 1rem;
    background: none;
    border: none;
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }
  .tab-button.active {
    border-bottom-color: var(--primary-color, #007bff);
    color: var(--primary-color, #007bff);
  }
  .tab-content { padding: 0.5rem 0; }

  /* Repeater styles */
  .layout-repeater { display: flex; flex-direction: column; gap: 0.5rem; }
  .repeater-item {
    padding: 0.5rem;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
  }
  .repeater-empty { color: var(--muted-color, #666); font-style: italic; }
  .add-item-btn {
    padding: 0.5rem;
    background: var(--bg-hover, #f0f0f0);
    border: 1px dashed var(--border-color, #ccc);
    border-radius: 4px;
    cursor: pointer;
  }

  /* Static and spacing */
  .layout-spacer { display: block; }
  .layout-divider {
    border: none;
    border-top: 1px solid var(--border-color, #ccc);
    margin: 0.5rem 0;
  }
  .layout-divider.vertical {
    border-top: none;
    border-left: 1px solid var(--border-color, #ccc);
    height: 100%;
    margin: 0 0.5rem;
  }

  .unknown-node {
    background: #fee;
    color: #c00;
    padding: 0.5rem;
    border-radius: 4px;
  }
</style>
