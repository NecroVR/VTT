<script lang="ts">
  import type { FieldNode, FormFieldType } from '@vtt/shared';
  import BindingPicker from '../BindingPicker.svelte';

  interface Props {
    node: FieldNode;
    onUpdate: (updates: Partial<FieldNode>) => void;
  }

  let { node, onUpdate }: Props = $props();

  let showPicker = $state(false);

  const fieldTypes: FormFieldType[] = [
    'text',
    'number',
    'checkbox',
    'select',
    'textarea',
    'dice',
    'resource',
    'rating',
    'slider',
    'tags',
    'reference',
    'richtext',
    'color',
    'image',
    'date'
  ];

  // Local state for options editor (for select fields)
  let optionsText = $state('');

  // Initialize options text from node
  $effect(() => {
    if (node.options?.options) {
      optionsText = node.options.options
        .map(opt => `${opt.value}:${opt.label}`)
        .join('\n');
    }
  });

  function handleOptionsChange(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    optionsText = target.value;

    // Parse options format: value:label (one per line)
    const options = target.value
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [value, label] = line.split(':').map(s => s.trim());
        return { value: value || '', label: label || value || '' };
      });

    onUpdate({
      options: {
        ...node.options,
        options
      }
    });
  }
</script>

<div class="field-properties">
  <!-- Basic Properties -->
  <div class="property-group">
    <div class="group-header">
      <h4>Basic</h4>
    </div>
    <div class="group-content">
      <label>
        <span>Field Type</span>
        <select
          value={node.fieldType}
          onchange={(e) => onUpdate({ fieldType: (e.target as HTMLSelectElement).value as FormFieldType })}
        >
          {#each fieldTypes as type}
            <option value={type}>{type}</option>
          {/each}
        </select>
      </label>

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
        <span>Help Text</span>
        <input
          type="text"
          value={node.helpText || ''}
          oninput={(e) => onUpdate({ helpText: (e.target as HTMLInputElement).value })}
          placeholder="Helpful description"
        />
      </label>
    </div>
  </div>

  <!-- Binding -->
  <div class="property-group">
    <div class="group-header">
      <h4>Binding</h4>
    </div>
    <div class="group-content">
      <label>
        <span>Property Path</span>
        <div class="input-with-button">
          <input
            type="text"
            value={node.binding || ''}
            oninput={(e) => onUpdate({ binding: (e.target as HTMLInputElement).value })}
            placeholder="attributes.strength.value"
          />
          <button type="button" class="btn-picker" title="Browse properties" onclick={() => showPicker = true}>
            📋
          </button>
        </div>
      </label>

      {#if node.fieldType === 'text' || node.fieldType === 'textarea'}
        <label>
          <span>Placeholder</span>
          <input
            type="text"
            value={node.options?.placeholder || ''}
            oninput={(e) => onUpdate({
              options: { ...node.options, placeholder: (e.target as HTMLInputElement).value }
            })}
            placeholder="Enter value..."
          />
        </label>
      {/if}

      {#if node.fieldType === 'select' && node.options}
        <label>
          <span>Options (value:label per line)</span>
          <textarea
            value={optionsText}
            oninput={handleOptionsChange}
            placeholder="option1:Option 1&#10;option2:Option 2"
            rows="5"
          ></textarea>
        </label>
      {/if}

      {#if node.fieldType === 'number' || node.fieldType === 'slider'}
        <div class="inline-fields">
          <label>
            <span>Min</span>
            <input
              type="number"
              value={node.options?.min ?? ''}
              oninput={(e) => onUpdate({
                options: { ...node.options, min: parseFloat((e.target as HTMLInputElement).value) }
              })}
            />
          </label>
          <label>
            <span>Max</span>
            <input
              type="number"
              value={node.options?.max ?? ''}
              oninput={(e) => onUpdate({
                options: { ...node.options, max: parseFloat((e.target as HTMLInputElement).value) }
              })}
            />
          </label>
          <label>
            <span>Step</span>
            <input
              type="number"
              value={node.options?.step ?? ''}
              oninput={(e) => onUpdate({
                options: { ...node.options, step: parseFloat((e.target as HTMLInputElement).value) }
              })}
            />
          </label>
        </div>
      {/if}
    </div>
  </div>

  <!-- Validation -->
  <div class="property-group">
    <div class="group-header">
      <h4>Validation</h4>
    </div>
    <div class="group-content">
      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={node.required || false}
          onchange={(e) => onUpdate({ required: (e.target as HTMLInputElement).checked })}
        />
        <span>Required</span>
      </label>

      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={node.readonly || false}
          onchange={(e) => onUpdate({ readonly: (e.target as HTMLInputElement).checked })}
        />
        <span>Read Only</span>
      </label>
    </div>
  </div>
</div>

<BindingPicker
  open={showPicker}
  currentBinding={node.binding || ''}
  onSelect={(path) => {
    onUpdate({ binding: path });
    showPicker = false;
  }}
  onClose={() => showPicker = false}
/>

<style>
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

  .checkbox-label {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }

  .checkbox-label input[type="checkbox"] {
    width: auto;
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
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }
</style>
