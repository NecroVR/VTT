<script lang="ts">
  import type { FieldNode } from '@vtt/shared';

  interface Props {
    node: FieldNode;
    entity: Record<string, unknown>;
    mode: 'view' | 'edit';
    onChange: (path: string, value: unknown) => void;
    repeaterContext?: { index: number; item: unknown };
  }

  let { node, entity, mode, onChange, repeaterContext }: Props = $props();

  // Resolve binding path (handle {{index}} for repeaters)
  let resolvedBinding = $derived.by(() => {
    let path = node.binding;
    if (repeaterContext && path.includes('{{index}}')) {
      path = path.replace(/\{\{index\}\}/g, String(repeaterContext.index));
    }
    return path;
  });

  // Get current value
  let value = $derived.by(() => {
    return resolvedBinding.split('.').reduce((obj, key) => {
      if (obj == null) return undefined;
      const match = key.match(/^(.+)\[(\d+)\]$/);
      if (match) {
        const arr = (obj as Record<string, unknown>)[match[1]] as unknown[];
        return arr?.[parseInt(match[2])];
      }
      return (obj as Record<string, unknown>)[key];
    }, entity as unknown);
  });

  function handleChange(newValue: unknown) {
    onChange(resolvedBinding, newValue);
  }
</script>

<div class="field-wrapper" class:required={node.required}>
  {#if node.label}
    <label class="field-label">
      {node.label}
      {#if node.required}<span class="required-indicator">*</span>{/if}
    </label>
  {/if}

  {#if mode === 'view'}
    <div class="field-value">
      {#if node.fieldType === 'checkbox'}
        {value ? '✓' : '✗'}
      {:else if node.fieldType === 'select' && node.options?.options}
        {node.options.options.find(o => o.value === value)?.label || value}
      {:else}
        {value ?? '-'}
      {/if}
    </div>
  {:else}
    {#if node.fieldType === 'text'}
      <input
        type="text"
        class="field-input"
        value={value ?? ''}
        readonly={node.readonly}
        placeholder={node.options?.placeholder}
        oninput={(e) => handleChange(e.currentTarget.value)}
      />
    {:else if node.fieldType === 'number'}
      <input
        type="number"
        class="field-input"
        value={value ?? ''}
        readonly={node.readonly}
        min={node.options?.min}
        max={node.options?.max}
        step={node.options?.step}
        oninput={(e) => handleChange(parseFloat(e.currentTarget.value) || 0)}
      />
    {:else if node.fieldType === 'textarea'}
      <textarea
        class="field-input field-textarea"
        value={value ?? ''}
        readonly={node.readonly}
        placeholder={node.options?.placeholder}
        oninput={(e) => handleChange(e.currentTarget.value)}
      ></textarea>
    {:else if node.fieldType === 'checkbox'}
      <input
        type="checkbox"
        class="field-checkbox"
        checked={!!value}
        disabled={node.readonly}
        onchange={(e) => handleChange(e.currentTarget.checked)}
      />
    {:else if node.fieldType === 'select'}
      <select
        class="field-input field-select"
        value={value ?? ''}
        disabled={node.readonly}
        onchange={(e) => handleChange(e.currentTarget.value)}
      >
        <option value="">--Select--</option>
        {#each node.options?.options || [] as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    {:else if node.fieldType === 'resource'}
      <div class="field-resource">
        <input
          type="number"
          class="field-input resource-current"
          value={(value as {current?: number})?.current ?? value ?? 0}
          oninput={(e) => handleChange({
            ...(typeof value === 'object' ? value : {}),
            current: parseFloat(e.currentTarget.value) || 0
          })}
        />
        {#if node.options?.showMax}
          <span class="resource-separator">/</span>
          <input
            type="number"
            class="field-input resource-max"
            value={(value as {max?: number})?.max ?? 0}
            oninput={(e) => handleChange({
              ...(typeof value === 'object' ? value : {}),
              max: parseFloat(e.currentTarget.value) || 0
            })}
          />
        {/if}
      </div>
    {:else}
      <!-- Default fallback to text input -->
      <input
        type="text"
        class="field-input"
        value={value ?? ''}
        oninput={(e) => handleChange(e.currentTarget.value)}
      />
    {/if}
  {/if}

  {#if node.helpText}
    <div class="field-help">{node.helpText}</div>
  {/if}
</div>

<style>
  .field-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.5rem;
  }

  .field-label {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .required-indicator { color: #c00; }

  .field-input {
    padding: 0.5rem;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    font-size: 1rem;
  }

  .field-input:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .field-input:read-only {
    background: var(--bg-muted, #f5f5f5);
  }

  .field-textarea {
    min-height: 80px;
    resize: vertical;
  }

  .field-value {
    padding: 0.5rem 0;
  }

  .field-help {
    font-size: 0.75rem;
    color: var(--muted-color, #666);
  }

  .field-resource {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .resource-current, .resource-max {
    width: 60px;
    text-align: center;
  }

  .resource-separator {
    font-weight: bold;
  }
</style>
