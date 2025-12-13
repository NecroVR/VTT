<script lang="ts">
  import type { ComputedNode } from '@vtt/shared';

  interface Props {
    node: ComputedNode;
    onUpdate: (updates: Partial<ComputedNode>) => void;
  }

  let { node, onUpdate }: Props = $props();
</script>

<div class="computed-properties">
  <div class="property-group">
    <div class="group-header">
      <h4>Computed Field</h4>
    </div>
    <div class="group-content">
      <label>
        <span>Field ID</span>
        <input
          type="text"
          value={node.fieldId}
          oninput={(e) => onUpdate({ fieldId: (e.target as HTMLInputElement).value })}
          placeholder="computedFieldId"
        />
        <span class="help-text">Reference to a computed field defined in the form</span>
      </label>

      <div class="info-box">
        <p>Computed fields are defined in the Form Settings.</p>
        <p class="note">Field selector will be added in future phase.</p>
      </div>
    </div>
  </div>

  <div class="property-group">
    <div class="group-header">
      <h4>Display</h4>
    </div>
    <div class="group-content">
      <label>
        <span>Label</span>
        <input
          type="text"
          value={node.label || ''}
          oninput={(e) => onUpdate({ label: (e.target as HTMLInputElement).value })}
          placeholder="Field Label"
        />
      </label>

      <label>
        <span>Format</span>
        <input
          type="text"
          value={node.format || ''}
          oninput={(e) => onUpdate({ format: (e.target as HTMLInputElement).value })}
          placeholder="{value} HP"
        />
        <span class="help-text">Use {value} as placeholder for the computed value</span>
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

  .info-box {
    padding: 0.75rem;
    background: var(--info-bg, #e7f3ff);
    border-left: 3px solid var(--info-border, #0066cc);
    border-radius: 4px;
  }

  .info-box p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-color, #212529);
  }

  .note {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-muted, #6c757d);
    font-style: italic;
  }
</style>
