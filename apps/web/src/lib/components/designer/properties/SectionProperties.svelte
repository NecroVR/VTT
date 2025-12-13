<script lang="ts">
  import type { SectionNode } from '@vtt/shared';

  interface Props {
    node: SectionNode;
    onUpdate: (updates: Partial<SectionNode>) => void;
  }

  let { node, onUpdate }: Props = $props();
</script>

<div class="section-properties">
  <div class="property-group">
    <div class="group-header">
      <h4>Basic</h4>
    </div>
    <div class="group-content">
      <label>
        <span>Title</span>
        <input
          type="text"
          value={node.title || ''}
          oninput={(e) => onUpdate({ title: (e.target as HTMLInputElement).value })}
          placeholder="Section Title"
        />
      </label>

      <label>
        <span>Icon</span>
        <input
          type="text"
          value={node.icon || ''}
          oninput={(e) => onUpdate({ icon: (e.target as HTMLInputElement).value })}
          placeholder="icon-name or ⚔️"
        />
      </label>
    </div>
  </div>

  <div class="property-group">
    <div class="group-header">
      <h4>Behavior</h4>
    </div>
    <div class="group-content">
      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={node.collapsible || false}
          onchange={(e) => onUpdate({ collapsible: (e.target as HTMLInputElement).checked })}
        />
        <span>Collapsible</span>
      </label>

      {#if node.collapsible}
        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={node.defaultCollapsed || false}
            onchange={(e) => onUpdate({ defaultCollapsed: (e.target as HTMLInputElement).checked })}
          />
          <span>Default Collapsed</span>
        </label>
      {/if}
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

  .checkbox-label {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }

  .checkbox-label input[type="checkbox"] {
    width: auto;
  }

  input[type="text"] {
    padding: 0.5rem;
    border: 1px solid var(--input-border, #ced4da);
    border-radius: 4px;
    font-size: 0.875rem;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
  }
</style>
