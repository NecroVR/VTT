<script lang="ts">
  import type { ColumnsNode } from '@vtt/shared';

  interface Props {
    node: ColumnsNode;
    onUpdate: (updates: Partial<ColumnsNode>) => void;
  }

  let { node, onUpdate }: Props = $props();

  function handleWidthChange(index: number, value: string) {
    const newWidths = [...node.widths];
    newWidths[index] = value;
    onUpdate({ widths: newWidths });
  }

  function addColumn() {
    const newWidths = [...node.widths, '1fr'];
    onUpdate({ widths: newWidths });
  }

  function removeColumn(index: number) {
    if (node.widths.length <= 1) return; // Keep at least one column
    const newWidths = node.widths.filter((_, i) => i !== index);
    onUpdate({ widths: newWidths });
  }
</script>

<div class="columns-properties">
  <div class="property-group">
    <div class="group-header">
      <h4>Columns</h4>
    </div>
    <div class="group-content">
      {#each node.widths as width, index}
        <div class="column-item">
          <label>
            <span>Column {index + 1} Width</span>
            <div class="input-with-button">
              <input
                type="text"
                value={width}
                oninput={(e) => handleWidthChange(index, (e.target as HTMLInputElement).value)}
                placeholder="1fr"
              />
              {#if node.widths.length > 1}
                <button
                  type="button"
                  class="btn-remove"
                  onclick={() => removeColumn(index)}
                  title="Remove column"
                >
                  ✕
                </button>
              {/if}
            </div>
          </label>
        </div>
      {/each}

      <button type="button" class="btn-add" onclick={addColumn}>
        + Add Column
      </button>

      <label>
        <span>Gap</span>
        <input
          type="text"
          value={node.gap || ''}
          oninput={(e) => onUpdate({ gap: (e.target as HTMLInputElement).value })}
          placeholder="1rem"
        />
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

  .column-item {
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-light, #e9ecef);
  }

  .column-item:last-of-type {
    border-bottom: none;
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

  .input-with-button {
    display: flex;
    gap: 0.25rem;
  }

  .input-with-button input {
    flex: 1;
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

  .btn-add,
  .btn-remove {
    padding: 0.5rem;
    border: 1px solid var(--input-border, #ced4da);
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .btn-add {
    width: 100%;
    background: var(--primary-color, #007bff);
    color: white;
    border-color: var(--primary-color, #007bff);
  }

  .btn-add:hover {
    background: var(--primary-color-hover, #0056b3);
  }

  .btn-remove {
    flex-shrink: 0;
    color: var(--danger-color, #dc3545);
  }

  .btn-remove:hover {
    background: var(--danger-bg, #f8d7da);
  }
</style>
