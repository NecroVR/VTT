<script lang="ts">
  import type { FieldNode, FormFieldType, LocalizedString } from '@vtt/shared';
  import BindingPicker from '../BindingPicker.svelte';
  import LocaleKeyPicker from '../LocaleKeyPicker.svelte';

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
        .map(opt => {
          const label = typeof opt.label === 'string' ? opt.label : (opt.label.literal || opt.label.localeKey || '');
          return `${opt.value}:${label}`;
        })
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
        return {
          value: value || '',
          label: { literal: label || value || '' } as LocalizedString
        };
      });

    onUpdate({
      options: {
        ...node.options,
        options
      }
    });
  }

  // Generate locale key prefix based on node ID
  function getLocaleKeyPrefix(property: string): string {
    return `form.{formName}.${node.id}.${property}`;
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
        <span title="The type of input field to display">Field Type</span>
        <select
          value={node.fieldType}
          onchange={(e) => onUpdate({ fieldType: (e.target as HTMLSelectElement).value as FormFieldType })}
          title="Select the type of input field"
        >
          {#each fieldTypes as type}
            <option value={type}>{type}</option>
          {/each}
        </select>
      </label>

      <LocaleKeyPicker
        bind:value={node.label}
        label="Label"
        placeholder="Field Label"
        suggestedPrefix={getLocaleKeyPrefix('label')}
        onchange={(value) => onUpdate({ label: value })}
      />

      <LocaleKeyPicker
        bind:value={node.helpText}
        label="Help Text"
        placeholder="Helpful description"
        suggestedPrefix={getLocaleKeyPrefix('helpText')}
        onchange={(value) => onUpdate({ helpText: value })}
      />
    </div>
  </div>

  <!-- Binding -->
  <div class="property-group">
    <div class="group-header">
      <h4>Binding</h4>
    </div>
    <div class="group-content">
      <label>
        <span title="The path to the property this field reads from and writes to">Property Path</span>
        <div class="input-with-button">
          <input
            type="text"
            value={node.binding || ''}
            oninput={(e) => onUpdate({ binding: (e.target as HTMLInputElement).value })}
            placeholder="attributes.strength.value"
            title="Enter the data binding path using dot notation (e.g., attributes.strength.value)"
          />
          <button type="button" class="btn-picker" title="Browse properties" onclick={() => showPicker = true}>
            📋
          </button>
        </div>
      </label>

      {#if node.fieldType === 'text' || node.fieldType === 'textarea'}
        <LocaleKeyPicker
          value={node.options?.placeholder}
          label="Placeholder"
          placeholder="Enter value..."
          suggestedPrefix={getLocaleKeyPrefix('placeholder')}
          onchange={(value) => onUpdate({
            options: { ...node.options, placeholder: value }
          })}
        />
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

      {#if node.fieldType === 'number' || node.fieldType === 'slider' || node.fieldType === 'rating'}
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
          {#if node.fieldType !== 'rating'}
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
          {/if}
        </div>
      {/if}

      {#if node.fieldType === 'resource'}
        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={node.options?.showMax ?? true}
            onchange={(e) => onUpdate({
              options: { ...node.options, showMax: (e.target as HTMLInputElement).checked }
            })}
          />
          <span>Show Max Value</span>
        </label>
        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={node.options?.showBar ?? false}
            onchange={(e) => onUpdate({
              options: { ...node.options, showBar: (e.target as HTMLInputElement).checked }
            })}
          />
          <span>Show Progress Bar</span>
        </label>
        {#if node.options?.showBar}
          <label>
            <span>Bar Color</span>
            <input
              type="color"
              value={node.options?.barColor ?? '#4CAF50'}
              oninput={(e) => onUpdate({
                options: { ...node.options, barColor: (e.target as HTMLInputElement).value }
              })}
            />
          </label>
        {/if}
      {/if}

      {#if node.fieldType === 'rating'}
        <label>
          <span>Icon Style</span>
          <select
            value={node.options?.iconStyle ?? 'stars'}
            onchange={(e) => onUpdate({
              options: { ...node.options, iconStyle: (e.target as HTMLSelectElement).value as 'stars' | 'circles' | 'pips' }
            })}
          >
            <option value="stars">Stars</option>
            <option value="circles">Circles</option>
            <option value="pips">Pips</option>
          </select>
        </label>
      {/if}

      {#if node.fieldType === 'slider'}
        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={node.options?.showValue ?? true}
            onchange={(e) => onUpdate({
              options: { ...node.options, showValue: (e.target as HTMLInputElement).checked }
            })}
          />
          <span>Show Value Label</span>
        </label>
        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={node.options?.showTicks ?? false}
            onchange={(e) => onUpdate({
              options: { ...node.options, showTicks: (e.target as HTMLInputElement).checked }
            })}
          />
          <span>Show Tick Marks</span>
        </label>
      {/if}

      {#if node.fieldType === 'tags'}
        <label>
          <span>Suggestions (one per line)</span>
          <textarea
            value={node.options?.suggestions?.join('\n') ?? ''}
            oninput={(e) => onUpdate({
              options: {
                ...node.options,
                suggestions: (e.target as HTMLTextAreaElement).value.split('\n').filter(s => s.trim())
              }
            })}
            placeholder="suggestion1&#10;suggestion2&#10;suggestion3"
            rows="4"
          ></textarea>
        </label>
        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={node.options?.allowCustom ?? true}
            onchange={(e) => onUpdate({
              options: { ...node.options, allowCustom: (e.target as HTMLInputElement).checked }
            })}
          />
          <span>Allow Custom Tags</span>
        </label>
      {/if}

      {#if node.fieldType === 'reference'}
        <label>
          <span>Entity Type</span>
          <input
            type="text"
            value={node.options?.entityType ?? ''}
            oninput={(e) => onUpdate({
              options: { ...node.options, entityType: (e.target as HTMLInputElement).value }
            })}
            placeholder="actor, item, etc."
          />
        </label>
        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={node.options?.allowCreate ?? false}
            onchange={(e) => onUpdate({
              options: { ...node.options, allowCreate: (e.target as HTMLInputElement).checked }
            })}
          />
          <span>Allow Creating New Entity</span>
        </label>
      {/if}

      {#if node.fieldType === 'richtext'}
        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={node.options?.showPreview ?? true}
            onchange={(e) => onUpdate({
              options: { ...node.options, showPreview: (e.target as HTMLInputElement).checked }
            })}
          />
          <span>Show Preview</span>
        </label>
      {/if}

      {#if node.fieldType === 'color'}
        <label>
          <span>Preset Colors (comma-separated hex values)</span>
          <input
            type="text"
            value={node.options?.presets?.join(', ') ?? ''}
            oninput={(e) => onUpdate({
              options: {
                ...node.options,
                presets: (e.target as HTMLInputElement).value.split(',').map(s => s.trim()).filter(s => s)
              }
            })}
            placeholder="#FF0000, #00FF00, #0000FF"
          />
        </label>
      {/if}

      {#if node.fieldType === 'image'}
        <label>
          <span>Accepted File Types</span>
          <input
            type="text"
            value={node.options?.accept ?? ''}
            oninput={(e) => onUpdate({
              options: { ...node.options, accept: (e.target as HTMLInputElement).value }
            })}
            placeholder="image/*"
          />
        </label>
        <label>
          <span>Max File Size (bytes)</span>
          <input
            type="number"
            value={node.options?.maxSize ?? ''}
            oninput={(e) => onUpdate({
              options: { ...node.options, maxSize: parseInt((e.target as HTMLInputElement).value) }
            })}
            placeholder="5242880"
          />
        </label>
      {/if}

      {#if node.fieldType === 'date'}
        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={node.options?.includeTime ?? false}
            onchange={(e) => onUpdate({
              options: { ...node.options, includeTime: (e.target as HTMLInputElement).checked }
            })}
          />
          <span>Include Time</span>
        </label>
        <label>
          <span>Date Format</span>
          <input
            type="text"
            value={node.options?.format ?? ''}
            oninput={(e) => onUpdate({
              options: { ...node.options, format: (e.target as HTMLInputElement).value }
            })}
            placeholder="YYYY-MM-DD"
          />
        </label>
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
          title="Mark this field as required (must have a value)"
        />
        <span title="Users must provide a value for this field">Required</span>
      </label>

      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={node.readonly || false}
          onchange={(e) => onUpdate({ readonly: (e.target as HTMLInputElement).checked })}
          title="Prevent users from editing this field"
        />
        <span title="Field displays value but cannot be edited">Read Only</span>
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
