<script lang="ts">
  import type { TabsNode, TabDefinition } from '@vtt/shared';

  interface Props {
    node: TabsNode;
    onUpdate: (updates: Partial<TabsNode>) => void;
  }

  let { node, onUpdate }: Props = $props();

  function handleTabChange(index: number, field: keyof TabDefinition, value: string) {
    const newTabs = [...node.tabs];
    newTabs[index] = { ...newTabs[index], [field]: value };
    onUpdate({ tabs: newTabs });
  }

  function addTab() {
    const newTab: TabDefinition = {
      id: crypto.randomUUID(),
      label: 'New Tab',
      children: []
    };
    onUpdate({ tabs: [...node.tabs, newTab] });
  }

  function removeTab(index: number) {
    if (node.tabs.length <= 1) return; // Keep at least one tab
    const newTabs = node.tabs.filter((_, i) => i !== index);
    onUpdate({ tabs: newTabs });
  }

  const positions = ['top', 'bottom', 'left', 'right'];
</script>

<div class="tabs-properties">
  <div class="property-group">
    <div class="group-header">
      <h4>Tabs</h4>
    </div>
    <div class="group-content">
      {#each node.tabs as tab, index}
        <div class="tab-item">
          <div class="tab-item-header">
            <span class="tab-number">Tab {index + 1}</span>
            {#if node.tabs.length > 1}
              <button
                type="button"
                class="btn-remove-small"
                onclick={() => removeTab(index)}
                title="Remove tab"
              >
                ✕
              </button>
            {/if}
          </div>

          <label>
            <span>Label</span>
            <input
              type="text"
              value={tab.label}
              oninput={(e) => handleTabChange(index, 'label', (e.target as HTMLInputElement).value)}
            />
          </label>

          <label>
            <span>Icon</span>
            <input
              type="text"
              value={tab.icon || ''}
              oninput={(e) => handleTabChange(index, 'icon', (e.target as HTMLInputElement).value)}
              placeholder="icon-name or 🎲"
            />
          </label>
        </div>
      {/each}

      <button type="button" class="btn-add" onclick={addTab}>
        + Add Tab
      </button>
    </div>
  </div>

  <div class="property-group">
    <div class="group-header">
      <h4>Layout</h4>
    </div>
    <div class="group-content">
      <label>
        <span>Tab Position</span>
        <select
          value={node.position || 'top'}
          onchange={(e) => onUpdate({ position: (e.target as HTMLSelectElement).value as typeof node.position })}
        >
          {#each positions as pos}
            <option value={pos}>{pos}</option>
          {/each}
        </select>
      </label>

      <label>
        <span>Default Tab</span>
        <select
          value={node.defaultTab || ''}
          onchange={(e) => onUpdate({ defaultTab: (e.target as HTMLSelectElement).value })}
        >
          <option value="">First Tab</option>
          {#each node.tabs as tab}
            <option value={tab.id}>{tab.label}</option>
          {/each}
        </select>
      </label>
    </div>
  </div>
</div>

<style>
  .property-group {
    border-bottom: 1px solid var(--border-color, #ddd);
  }

  .group-header {
    padding: 0.75rem 1rem;
    background: var(--group-header-bg, #f8f9fa);
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

  .tab-item {
    padding: 0.75rem;
    background: var(--item-bg, #f8f9fa);
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .tab-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tab-number {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text-color, #212529);
  }

  .btn-remove-small {
    padding: 0.25rem 0.5rem;
    border: none;
    background: transparent;
    color: var(--danger-color, #dc3545);
    cursor: pointer;
    font-size: 1rem;
  }

  .btn-remove-small:hover {
    background: var(--danger-bg, #f8d7da);
    border-radius: 4px;
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
  select:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
  }

  .btn-add {
    padding: 0.5rem;
    border: 1px solid var(--input-border, #ced4da);
    border-radius: 4px;
    background: var(--primary-color, #007bff);
    color: white;
    cursor: pointer;
    font-size: 0.875rem;
    width: 100%;
  }

  .btn-add:hover {
    background: var(--primary-color-hover, #0056b3);
  }
</style>
