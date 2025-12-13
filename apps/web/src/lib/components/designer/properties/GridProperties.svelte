<script lang="ts">
  import type { GridNode } from '@vtt/shared';

  interface Props {
    node: GridNode;
    onUpdate: (updates: Partial<GridNode>) => void;
  }

  let { node, onUpdate }: Props = $props();
</script>

<div class="grid-properties">
  <div class="property-group">
    <div class="group-header">
      <h4>Layout</h4>
    </div>
    <div class="group-content">
      <label>
        <span>Columns</span>
        <input
          type="text"
          value={node.columns}
          oninput={(e) => {
            const value = (e.target as HTMLInputElement).value;
            // Try to parse as number, otherwise keep as string
            const columns = /^\d+$/.test(value) ? parseInt(value) : value;
            onUpdate({ columns });
          }}
          placeholder="3 or 1fr 2fr 1fr"
        />
        <span class="help-text">Number (e.g., 3) or CSS grid template (e.g., 1fr 2fr 1fr)</span>
      </label>

      <label>
        <span>Rows</span>
        <input
          type="text"
          value={node.rows || ''}
          oninput={(e) => onUpdate({ rows: (e.target as HTMLInputElement).value })}
          placeholder="auto"
        />
        <span class="help-text">CSS grid-template-rows value</span>
      </label>

      <label>
        <span>Gap</span>
        <input
          type="text"
          value={node.gap || ''}
          oninput={(e) => onUpdate({ gap: (e.target as HTMLInputElement).value })}
          placeholder="1rem"
        />
      </label>

      <label>
        <span>Column Gap</span>
        <input
          type="text"
          value={node.columnGap || ''}
          oninput={(e) => onUpdate({ columnGap: (e.target as HTMLInputElement).value })}
          placeholder="1rem"
        />
      </label>

      <label>
        <span>Row Gap</span>
        <input
          type="text"
          value={node.rowGap || ''}
          oninput={(e) => onUpdate({ rowGap: (e.target as HTMLInputElement).value })}
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

  .help-text {
    font-size: 0.75rem;
    color: var(--text-muted, #6c757d);
    font-weight: normal;
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
