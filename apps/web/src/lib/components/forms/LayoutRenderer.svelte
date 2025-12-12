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

  // Repeater array manipulation helpers
  function addItem(path: string): void {
    const currentArray = (getValueByPath(entity, path) as unknown[]) || [];
    const newArray = [...currentArray, {}]; // Add empty object
    onChange(path, newArray);
  }

  function removeItem(path: string, index: number): void {
    const currentArray = (getValueByPath(entity, path) as unknown[]) || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    onChange(path, newArray);
  }

  function moveItem(path: string, fromIndex: number, toIndex: number): void {
    const currentArray = (getValueByPath(entity, path) as unknown[]) || [];
    if (fromIndex < 0 || fromIndex >= currentArray.length || toIndex < 0 || toIndex >= currentArray.length) {
      return; // Invalid indices
    }
    const newArray = [...currentArray];
    const [movedItem] = newArray.splice(fromIndex, 1);
    newArray.splice(toIndex, 0, movedItem);
    onChange(path, newArray);
  }

  // Substitute fragment parameters in node tree
  function substituteFragmentParameters(nodes: LayoutNode[], parameters: Record<string, string>): LayoutNode[] {
    return nodes.map(node => substituteNodeParameters(node, parameters));
  }

  function substituteNodeParameters(node: LayoutNode, parameters: Record<string, string>): LayoutNode {
    // Deep clone and substitute parameters in all string properties
    const substituted = JSON.parse(JSON.stringify(node));
    return substituteInObject(substituted, parameters) as LayoutNode;
  }

  function substituteInObject(obj: unknown, parameters: Record<string, string>): unknown {
    if (typeof obj === 'string') {
      // Replace all {{paramName}} with parameter values
      let result = obj;
      for (const [paramName, paramValue] of Object.entries(parameters)) {
        result = result.replace(new RegExp(`\\{\\{${paramName}\\}\\}`, 'g'), paramValue);
      }
      return result;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => substituteInObject(item, parameters));
    }

    if (obj && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = substituteInObject(value, parameters);
      }
      return result;
    }

    return obj;
  }

  // Interpolate {{path}} patterns in content strings
  function interpolateContent(content: string): string {
    // First handle {{index}} if in repeater context
    if (repeaterContext) {
      content = content.replace(/\{\{index\}\}/g, String(repeaterContext.index));
    }

    // Handle {{path}} patterns
    return content.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = getValueByPath(entity, path.trim());
      return value != null ? String(value) : '';
    });
  }

  // Icon mapping for simple emoji-based icons
  const iconMap: Record<string, string> = {
    sword: '⚔️',
    shield: '🛡️',
    heart: '❤️',
    star: '⭐',
    fire: '🔥',
    water: '💧',
    lightning: '⚡',
    skull: '💀',
    book: '📖',
    scroll: '📜',
    potion: '🧪',
    coin: '🪙',
    bag: '🎒',
    gem: '💎',
    key: '🔑',
    lock: '🔒',
    crown: '👑',
    dice: '🎲',
    map: '🗺️',
    compass: '🧭'
  };

  function getIcon(iconName: string): string {
    return iconMap[iconName.toLowerCase()] || iconName;
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
  {:else if node.type === 'columns'}
    <div
      class="layout-columns"
      style="
        display: grid;
        grid-template-columns: {node.widths.join(' ')};
        gap: {node.gap || '1rem'};
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
    {@const interpolated = interpolateContent(node.content)}
    <div
      class="layout-static"
      class:static-{node.contentType || 'text'}
      style={node.style ? Object.entries(node.style).map(([k, v]) => `${k}: ${v}`).join(';') : ''}
    >
      {#if node.contentType === 'html'}
        {@html interpolated}
      {:else if node.contentType === 'image'}
        <img
          src={interpolated}
          alt={node.alt || ''}
          style="
            {node.width ? `width: ${node.width};` : ''}
            {node.height ? `height: ${node.height};` : ''}
          "
        />
      {:else if node.contentType === 'icon'}
        <span
          class="static-icon-content"
          style={node.size ? `font-size: ${node.size};` : ''}
        >
          {getIcon(interpolated)}
        </span>
      {:else}
        {interpolated}
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
            <div class="repeater-item-content">
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
            {#if mode === 'edit' && node.allowDelete !== false}
              <div class="repeater-item-controls">
                {#if node.allowReorder !== false && items.length > 1}
                  <button
                    class="repeater-control-btn move-up"
                    type="button"
                    disabled={index === 0}
                    onclick={() => moveItem(node.binding, index, index - 1)}
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    class="repeater-control-btn move-down"
                    type="button"
                    disabled={index === items.length - 1}
                    onclick={() => moveItem(node.binding, index, index + 1)}
                    title="Move down"
                  >
                    ▼
                  </button>
                {/if}
                <button
                  class="repeater-control-btn remove"
                  type="button"
                  disabled={node.minItems !== undefined && items.length <= node.minItems}
                  onclick={() => removeItem(node.binding, index)}
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            {/if}
          </div>
        {/each}
      {/if}
      {#if mode === 'edit'}
        <button
          class="add-item-btn"
          type="button"
          disabled={node.maxItems !== undefined && items.length >= node.maxItems}
          onclick={() => addItem(node.binding)}
        >
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
  {:else if node.type === 'fragmentRef'}
    {@const fragment = fragments.find(f => f.id === node.fragmentId)}
    {#if fragment}
      {@const substitutedContent = substituteFragmentParameters(fragment.content, node.parameters || {})}
      {#each substitutedContent as fragmentNode}
        <svelte:self
          node={fragmentNode}
          {entity}
          {mode}
          {fragments}
          {computedFields}
          {onChange}
          {repeaterContext}
        />
      {/each}
    {:else}
      <div class="fragment-error">Fragment not found: {node.fragmentId}</div>
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

  /* Columns layout */
  .layout-columns {
    width: 100%;
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
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    align-items: start;
  }
  .repeater-item-content {
    flex: 1;
  }
  .repeater-item-controls {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .repeater-control-btn {
    padding: 0.25rem 0.5rem;
    background: var(--bg-hover, #f0f0f0);
    border: 1px solid var(--border-color, #ccc);
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.875rem;
    line-height: 1;
    min-width: 24px;
    text-align: center;
  }
  .repeater-control-btn:hover:not(:disabled) {
    background: var(--bg-active, #e0e0e0);
  }
  .repeater-control-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .repeater-control-btn.remove {
    color: var(--danger-color, #d00);
  }
  .repeater-control-btn.remove:hover:not(:disabled) {
    background: var(--danger-bg, #fee);
    border-color: var(--danger-color, #d00);
  }
  .repeater-empty { color: var(--muted-color, #666); font-style: italic; }
  .add-item-btn {
    padding: 0.5rem;
    background: var(--bg-hover, #f0f0f0);
    border: 1px dashed var(--border-color, #ccc);
    border-radius: 4px;
    cursor: pointer;
  }
  .add-item-btn:hover:not(:disabled) {
    background: var(--bg-active, #e0e0e0);
    border-color: var(--primary-color, #007bff);
  }
  .add-item-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Static content styles */
  .layout-static {
    display: block;
  }

  .static-image img {
    max-width: 100%;
    height: auto;
    display: block;
  }

  .static-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .static-icon-content {
    line-height: 1;
    display: inline-block;
  }

  /* Spacing */
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

  .unknown-node, .fragment-error {
    background: #fee;
    color: #c00;
    padding: 0.5rem;
    border-radius: 4px;
  }
</style>
