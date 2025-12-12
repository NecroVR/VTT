<script lang="ts">
  import type { FieldDefinition } from '@vtt/shared';

  // Props
  export let field: FieldDefinition;
  export let value: any = null;
  export let onChange: (value: any) => void;
  export let readonly: boolean = false;

  // Initialize value based on field type and default
  $: if (value === null || value === undefined) {
    value = field.defaultValue ?? getDefaultValueForType(field.fieldType);
  }

  function getDefaultValueForType(fieldType: string): any {
    switch (fieldType) {
      case 'boolean':
        return false;
      case 'number':
        return 0;
      case 'multiselect':
        return [];
      case 'resource':
        return { current: 0, max: 0 };
      case 'dice':
        return '';
      default:
        return '';
    }
  }

  function handleInputChange(event: Event) {
    if (readonly) return;

    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    let newValue: any;

    switch (field.fieldType) {
      case 'boolean':
        newValue = (target as HTMLInputElement).checked;
        break;
      case 'number':
        newValue = parseFloat(target.value) || 0;
        break;
      case 'multiselect':
        const selectElement = target as HTMLSelectElement;
        newValue = Array.from(selectElement.selectedOptions).map(opt => opt.value);
        break;
      default:
        newValue = target.value;
    }

    onChange(newValue);
  }

  function handleResourceChange(field: 'current' | 'max', newVal: number) {
    if (readonly) return;

    const resourceValue = typeof value === 'object' && value !== null
      ? { ...value }
      : { current: 0, max: 0 };

    resourceValue[field] = newVal;
    onChange(resourceValue);
  }

  // Helper to check if field is required and empty
  $: isInvalid = field.required && (value === null || value === undefined || value === '');
</script>

<div class="template-field" class:readonly class:invalid={isInvalid}>
  <label for={field.id} class="field-label">
    {field.name}
    {#if field.required}
      <span class="required-indicator">*</span>
    {/if}
  </label>

  {#if field.helpText}
    <div class="help-text">{field.helpText}</div>
  {/if}

  <div class="field-input">
    {#if field.fieldType === 'text'}
      <input
        id={field.id}
        type="text"
        value={value || ''}
        on:input={handleInputChange}
        placeholder={field.placeholder || ''}
        disabled={readonly}
        class="text-input"
      />

    {:else if field.fieldType === 'textarea'}
      <textarea
        id={field.id}
        value={value || ''}
        on:input={handleInputChange}
        placeholder={field.placeholder || ''}
        disabled={readonly}
        class="textarea-input"
        rows="3"
      />

    {:else if field.fieldType === 'number'}
      <input
        id={field.id}
        type="number"
        value={value ?? 0}
        on:input={handleInputChange}
        placeholder={field.placeholder || ''}
        disabled={readonly}
        class="number-input"
      />

    {:else if field.fieldType === 'boolean'}
      <label class="checkbox-wrapper">
        <input
          id={field.id}
          type="checkbox"
          checked={value || false}
          on:change={handleInputChange}
          disabled={readonly}
          class="checkbox-input"
        />
        <span class="checkbox-label">Enabled</span>
      </label>

    {:else if field.fieldType === 'select'}
      <select
        id={field.id}
        value={value || ''}
        on:change={handleInputChange}
        disabled={readonly}
        class="select-input"
      >
        <option value="">-- Select --</option>
        {#if field.options}
          {#each field.options as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        {/if}
      </select>

    {:else if field.fieldType === 'multiselect'}
      <select
        id={field.id}
        multiple
        value={value || []}
        on:change={handleInputChange}
        disabled={readonly}
        class="multiselect-input"
        size="4"
      >
        {#if field.options}
          {#each field.options as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        {/if}
      </select>

    {:else if field.fieldType === 'resource'}
      <div class="resource-input">
        <div class="resource-field">
          <label for="{field.id}-current" class="resource-label">Current</label>
          <input
            id="{field.id}-current"
            type="number"
            value={value?.current ?? 0}
            on:input={(e) => handleResourceChange('current', parseFloat(e.currentTarget.value) || 0)}
            disabled={readonly}
            class="number-input small"
          />
        </div>
        <span class="resource-separator">/</span>
        <div class="resource-field">
          <label for="{field.id}-max" class="resource-label">Max</label>
          <input
            id="{field.id}-max"
            type="number"
            value={value?.max ?? 0}
            on:input={(e) => handleResourceChange('max', parseFloat(e.currentTarget.value) || 0)}
            disabled={readonly}
            class="number-input small"
          />
        </div>
      </div>

    {:else if field.fieldType === 'dice'}
      <input
        id={field.id}
        type="text"
        value={value || ''}
        on:input={handleInputChange}
        placeholder={field.placeholder || 'e.g., 1d6+3'}
        disabled={readonly}
        class="dice-input"
      />

    {:else}
      <div class="unsupported-field">
        <span>Unsupported field type: {field.fieldType}</span>
      </div>
    {/if}
  </div>

  {#if isInvalid}
    <div class="validation-error">This field is required</div>
  {/if}
</div>

<style>
  .template-field {
    margin-bottom: 1rem;
  }

  .field-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary, #aaa);
    margin-bottom: 0.25rem;
  }

  .required-indicator {
    color: #ef4444;
    margin-left: 0.125rem;
  }

  .help-text {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #888);
    margin-bottom: 0.5rem;
    font-style: italic;
  }

  .field-input {
    margin-top: 0.5rem;
  }

  .text-input,
  .textarea-input,
  .number-input,
  .select-input,
  .multiselect-input,
  .dice-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    background-color: var(--color-bg-primary, #121212);
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .text-input:focus,
  .textarea-input:focus,
  .number-input:focus,
  .select-input:focus,
  .multiselect-input:focus,
  .dice-input:focus {
    outline: none;
    border-color: var(--color-accent, #4a90e2);
  }

  .text-input:disabled,
  .textarea-input:disabled,
  .number-input:disabled,
  .select-input:disabled,
  .multiselect-input:disabled,
  .dice-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .textarea-input {
    resize: vertical;
    font-family: inherit;
    min-height: 60px;
  }

  .multiselect-input {
    min-height: 100px;
  }

  .checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .checkbox-input {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }

  .checkbox-input:disabled {
    cursor: not-allowed;
  }

  .checkbox-label {
    font-size: 0.875rem;
    color: var(--color-text-primary, #ffffff);
  }

  .resource-input {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .resource-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .resource-label {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #aaa);
  }

  .resource-separator {
    font-size: 1.25rem;
    color: var(--color-text-secondary, #aaa);
    margin-top: 1rem;
  }

  .number-input.small {
    width: 100%;
  }

  .unsupported-field {
    padding: 0.75rem;
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 4px;
    color: #fca5a5;
    font-size: 0.875rem;
  }

  .validation-error {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: #ef4444;
  }

  .template-field.invalid .text-input,
  .template-field.invalid .textarea-input,
  .template-field.invalid .number-input,
  .template-field.invalid .select-input,
  .template-field.invalid .dice-input {
    border-color: #ef4444;
  }

  .template-field.readonly {
    opacity: 0.8;
  }
</style>
