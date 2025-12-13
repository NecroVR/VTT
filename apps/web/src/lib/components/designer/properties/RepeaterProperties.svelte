<script lang="ts">
  import type { RepeaterNode } from '@vtt/shared';

  interface Props {
    node: RepeaterNode;
    onUpdate: (updates: Partial<RepeaterNode>) => void;
  }

  let { node, onUpdate }: Props = $props();
</script>

<div class="repeater-properties">
  <div class="property-group">
    <div class="group-header">
      <h4>Binding</h4>
    </div>
    <div class="group-content">
      <label>
        <span>Array Property</span>
        <div class="input-with-button">
          <input
            type="text"
            value={node.binding}
            oninput={(e) => onUpdate({ binding: (e.target as HTMLInputElement).value })}
            placeholder="items"
          />
          <button type="button" class="btn-picker" title="Pick property">
            📋
          </button>
        </div>
        <span class="help-text">Path to array property (e.g., inventory.items)</span>
      </label>
    </div>
  </div>

  <div class="property-group">
    <div class="group-header">
      <h4>Labels</h4>
    </div>
    <div class="group-content">
      <label>
        <span>Add Button Label</span>
        <input
          type="text"
          value={node.addLabel || ''}
          oninput={(e) => onUpdate({ addLabel: (e.target as HTMLInputElement).value })}
          placeholder="Add Item"
        />
      </label>

      <label>
        <span>Empty Message</span>
        <input
          type="text"
          value={node.emptyMessage || ''}
          oninput={(e) => onUpdate({ emptyMessage: (e.target as HTMLInputElement).value })}
          placeholder="No items"
        />
      </label>
    </div>
  </div>

  <div class="property-group">
    <div class="group-header">
      <h4>Constraints</h4>
    </div>
    <div class="group-content">
      <div class="inline-fields">
        <label>
          <span>Min Items</span>
          <input
            type="number"
            value={node.minItems ?? ''}
            oninput={(e) => {
              const value = (e.target as HTMLInputElement).value;
              onUpdate({ minItems: value ? parseInt(value) : undefined });
            }}
            min="0"
          />
        </label>

        <label>
          <span>Max Items</span>
          <input
            type="number"
            value={node.maxItems ?? ''}
            oninput={(e) => {
              const value = (e.target as HTMLInputElement).value;
              onUpdate({ maxItems: value ? parseInt(value) : undefined });
            }}
            min="0"
          />
        </label>
      </div>
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
          checked={node.allowReorder !== false}
          onchange={(e) => onUpdate({ allowReorder: (e.target as HTMLInputElement).checked })}
        />
        <span>Allow Reorder</span>
      </label>

      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={node.allowDelete !== false}
          onchange={(e) => onUpdate({ allowDelete: (e.target as HTMLInputElement).checked })}
        />
        <span>Allow Delete</span>
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

  .help-text {
    font-size: 0.75rem;
    color: var(--text-muted, #6c757d);
    font-weight: normal;
  }

  input[type="text"],
  input[type="number"] {
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

  .input-with-button {
    display: flex;
    gap: 0.25rem;
  }

  .input-with-button input {
    flex: 1;
  }

  .btn-picker {
    padding: 0.5rem;
    border: 1px solid var(--input-border, #ced4da);
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 1rem;
  }

  .btn-picker:hover {
    background: var(--hover-bg, #f0f0f0);
  }

  .inline-fields {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
</style>
