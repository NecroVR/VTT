<script lang="ts">
  import type { FlexNode } from '@vtt/shared';

  interface Props {
    node: FlexNode;
    onUpdate: (updates: Partial<FlexNode>) => void;
  }

  let { node, onUpdate }: Props = $props();

  const directions = ['row', 'column', 'row-reverse', 'column-reverse'];
  const justifyOptions = ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'];
  const alignOptions = ['start', 'center', 'end', 'stretch', 'baseline'];
</script>

<div class="flex-properties">
  <div class="property-group">
    <div class="group-header">
      <h4>Layout</h4>
    </div>
    <div class="group-content">
      <label>
        <span>Direction</span>
        <select
          value={node.direction}
          onchange={(e) => onUpdate({ direction: (e.target as HTMLSelectElement).value as typeof node.direction })}
        >
          {#each directions as dir}
            <option value={dir}>{dir}</option>
          {/each}
        </select>
      </label>

      <label>
        <span>Justify Content</span>
        <select
          value={node.justify || 'start'}
          onchange={(e) => onUpdate({ justify: (e.target as HTMLSelectElement).value })}
        >
          {#each justifyOptions as opt}
            <option value={opt}>{opt}</option>
          {/each}
        </select>
      </label>

      <label>
        <span>Align Items</span>
        <select
          value={node.align || 'start'}
          onchange={(e) => onUpdate({ align: (e.target as HTMLSelectElement).value })}
        >
          {#each alignOptions as opt}
            <option value={opt}>{opt}</option>
          {/each}
        </select>
      </label>

      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={node.wrap || false}
          onchange={(e) => onUpdate({ wrap: (e.target as HTMLInputElement).checked })}
        />
        <span>Wrap</span>
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
</style>
