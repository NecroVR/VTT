<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { FieldDefinition, FieldType, ValidationRule } from '@vtt/shared';

  export let field: Partial<FieldDefinition> = {
    id: '',
    name: '',
    fieldType: 'text',
    required: false,
    defaultValue: undefined,
    options: [],
    validation: [],
  };

  export let isNew = true;

  const dispatch = createEventDispatcher<{
    save: FieldDefinition;
    cancel: void;
    delete: void;
  }>();

  // Field type options
  const fieldTypes: { value: FieldType; label: string; description: string }[] = [
    { value: 'text', label: 'Text', description: 'Single line text input' },
    { value: 'textarea', label: 'Text Area', description: 'Multi-line text input' },
    { value: 'number', label: 'Number', description: 'Numeric value' },
    { value: 'boolean', label: 'Boolean', description: 'True/false checkbox' },
    { value: 'select', label: 'Select', description: 'Dropdown selection' },
    { value: 'multiselect', label: 'Multi-select', description: 'Multiple choice selection' },
    { value: 'resource', label: 'Resource', description: 'Current/max value with bar' },
    { value: 'slots', label: 'Slots', description: 'Checkbox array for limited uses' },
    { value: 'clock', label: 'Clock', description: 'Progress clock (Blades in the Dark style)' },
    { value: 'dice', label: 'Dice Formula', description: 'Dice roll formula input' },
    { value: 'reference', label: 'Reference', description: 'Link to another entity' },
    { value: 'reference_list', label: 'Reference List', description: 'List of entity references' },
    { value: 'calculated', label: 'Calculated', description: 'Read-only computed value' },
  ];

  // Width options
  const widthOptions: { value: string; label: string }[] = [
    { value: 'quarter', label: '25%' },
    { value: 'third', label: '33%' },
    { value: 'half', label: '50%' },
    { value: 'full', label: '100%' },
  ];

  // Local state for editing
  let formData = {
    id: field.id || '',
    name: field.name || '',
    fieldType: field.fieldType || ('text' as FieldType),
    required: field.required ?? false,
    defaultValue: field.defaultValue ?? '',
    options: field.options || [],
    referenceType: field.referenceType || '',
    placeholder: field.placeholder || '',
    helpText: field.helpText || '',
    width: field.width || 'full',
    validation: field.validation || [],
  };

  // For select/multiselect options
  let newOptionValue = '';
  let newOptionLabel = '';

  // Validation rules
  let newValidationRule: Partial<ValidationRule> = {
    type: 'min',
    value: '',
    message: '',
  };

  const validationTypes = [
    { value: 'min', label: 'Minimum Value' },
    { value: 'max', label: 'Maximum Value' },
    { value: 'pattern', label: 'Pattern (Regex)' },
  ];

  function handleSave() {
    // Validate
    if (!formData.id.trim()) {
      alert('Field ID is required');
      return;
    }
    if (!formData.name.trim()) {
      alert('Field name is required');
      return;
    }

    // Build the field definition
    const fieldDef: FieldDefinition = {
      id: formData.id.trim(),
      name: formData.name.trim(),
      fieldType: formData.fieldType,
      required: formData.required,
    };

    // Add optional fields if present
    if (formData.defaultValue !== '' && formData.defaultValue !== undefined) {
      fieldDef.defaultValue = formData.defaultValue;
    }

    if (formData.options.length > 0 && (formData.fieldType === 'select' || formData.fieldType === 'multiselect')) {
      fieldDef.options = formData.options;
    }

    if (formData.referenceType && (formData.fieldType === 'reference' || formData.fieldType === 'reference_list')) {
      fieldDef.referenceType = formData.referenceType;
    }

    if (formData.placeholder) {
      fieldDef.placeholder = formData.placeholder;
    }

    if (formData.helpText) {
      fieldDef.helpText = formData.helpText;
    }

    if (formData.width) {
      fieldDef.width = formData.width as 'quarter' | 'third' | 'half' | 'full';
    }

    if (formData.validation.length > 0) {
      fieldDef.validation = formData.validation;
    }

    dispatch('save', fieldDef);
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function handleDelete() {
    if (confirm(`Are you sure you want to delete field "${formData.name}"?`)) {
      dispatch('delete');
    }
  }

  function addOption() {
    if (!newOptionValue.trim() || !newOptionLabel.trim()) {
      alert('Both value and label are required');
      return;
    }

    formData.options = [
      ...formData.options,
      { value: newOptionValue.trim(), label: newOptionLabel.trim() },
    ];

    newOptionValue = '';
    newOptionLabel = '';
  }

  function removeOption(index: number) {
    formData.options = formData.options.filter((_, i) => i !== index);
  }

  function addValidationRule() {
    if (!newValidationRule.type || !newValidationRule.message) {
      alert('Validation type and message are required');
      return;
    }

    formData.validation = [
      ...formData.validation,
      {
        type: newValidationRule.type,
        value: newValidationRule.value,
        message: newValidationRule.message,
      } as ValidationRule,
    ];

    newValidationRule = {
      type: 'min',
      value: '',
      message: '',
    };
  }

  function removeValidationRule(index: number) {
    formData.validation = formData.validation.filter((_, i) => i !== index);
  }

  // Generate ID from name
  function generateId() {
    if (!formData.name) return;
    const id = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    formData.id = id;
  }

  // Show/hide options based on field type
  $: needsOptions = formData.fieldType === 'select' || formData.fieldType === 'multiselect';
  $: needsReference = formData.fieldType === 'reference' || formData.fieldType === 'reference_list';
  $: canHaveDefault =
    formData.fieldType !== 'reference' &&
    formData.fieldType !== 'reference_list' &&
    formData.fieldType !== 'calculated';
</script>

<div class="field-editor">
  <div class="editor-header">
    <h3>{isNew ? 'Add Field' : 'Edit Field'}</h3>
  </div>

  <div class="editor-body">
    <form on:submit|preventDefault={handleSave}>
      <!-- Basic Properties -->
      <section class="form-section">
        <h4>Basic Properties</h4>

        <div class="form-row">
          <label for="field-name">
            Field Name *
            <input
              id="field-name"
              type="text"
              bind:value={formData.name}
              on:blur={generateId}
              required
              placeholder="e.g., Weapon Type"
            />
          </label>
          <span class="help-text">Display name shown to users</span>
        </div>

        <div class="form-row">
          <label for="field-id">
            Field ID *
            <input
              id="field-id"
              type="text"
              bind:value={formData.id}
              required
              placeholder="e.g., weapon_type"
              pattern="[a-z0-9_]+"
              title="Lowercase letters, numbers, and underscores only"
            />
          </label>
          <span class="help-text">Unique identifier (auto-generated from name)</span>
        </div>

        <div class="form-row">
          <label for="field-type">
            Field Type *
            <select id="field-type" bind:value={formData.fieldType}>
              {#each fieldTypes as type}
                <option value={type.value}>{type.label}</option>
              {/each}
            </select>
          </label>
          <span class="help-text">
            {fieldTypes.find((t) => t.value === formData.fieldType)?.description}
          </span>
        </div>
      </section>

      <!-- Field Configuration -->
      <section class="form-section">
        <h4>Configuration</h4>

        <div class="form-row-checkbox">
          <label>
            <input type="checkbox" bind:checked={formData.required} />
            Required Field
          </label>
          <span class="help-text">Users must provide a value for this field</span>
        </div>

        {#if canHaveDefault}
          <div class="form-row">
            <label for="default-value">
              Default Value
              {#if formData.fieldType === 'number'}
                <input id="default-value" type="number" bind:value={formData.defaultValue} />
              {:else if formData.fieldType === 'boolean'}
                <input id="default-value" type="checkbox" bind:checked={formData.defaultValue} />
              {:else}
                <input id="default-value" type="text" bind:value={formData.defaultValue} />
              {/if}
            </label>
          </div>
        {/if}

        <div class="form-row">
          <label for="placeholder">
            Placeholder
            <input
              id="placeholder"
              type="text"
              bind:value={formData.placeholder}
              placeholder="Hint text shown in empty field"
            />
          </label>
        </div>

        <div class="form-row">
          <label for="help-text">
            Help Text
            <input
              id="help-text"
              type="text"
              bind:value={formData.helpText}
              placeholder="Additional guidance for users"
            />
          </label>
        </div>

        <div class="form-row">
          <label for="width">
            Field Width
            <select id="width" bind:value={formData.width}>
              {#each widthOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </label>
          <span class="help-text">Width on the form (in percentage)</span>
        </div>
      </section>

      <!-- Options (for select/multiselect) -->
      {#if needsOptions}
        <section class="form-section">
          <h4>Options</h4>

          {#if formData.options.length === 0}
            <div class="empty-state">
              <p>No options added yet</p>
            </div>
          {:else}
            <div class="options-list">
              {#each formData.options as option, index}
                <div class="option-row">
                  <div class="option-details">
                    <span class="option-value">{option.value}</span>
                    <span class="option-label">{option.label}</span>
                  </div>
                  <button
                    type="button"
                    class="remove-btn"
                    on:click={() => removeOption(index)}
                    title="Remove option"
                  >
                    ×
                  </button>
                </div>
              {/each}
            </div>
          {/if}

          <div class="add-option-form">
            <input
              type="text"
              bind:value={newOptionValue}
              placeholder="Value (internal)"
              class="option-input"
            />
            <input
              type="text"
              bind:value={newOptionLabel}
              placeholder="Label (displayed)"
              class="option-input"
            />
            <button type="button" class="button-secondary" on:click={addOption}>
              + Add Option
            </button>
          </div>
        </section>
      {/if}

      <!-- Reference Type (for reference fields) -->
      {#if needsReference}
        <section class="form-section">
          <h4>Reference Configuration</h4>

          <div class="form-row">
            <label for="reference-type">
              Reference Type *
              <input
                id="reference-type"
                type="text"
                bind:value={formData.referenceType}
                placeholder="e.g., item, spell, feat"
                required={needsReference}
              />
            </label>
            <span class="help-text">Type of entity this field references</span>
          </div>
        </section>
      {/if}

      <!-- Validation Rules -->
      <section class="form-section">
        <h4>Validation Rules</h4>

        {#if formData.validation.length === 0}
          <div class="empty-state">
            <p>No validation rules</p>
          </div>
        {:else}
          <div class="validation-list">
            {#each formData.validation as rule, index}
              <div class="validation-row">
                <div class="validation-details">
                  <span class="validation-type">{rule.type}</span>
                  {#if rule.value !== undefined && rule.value !== ''}
                    <span class="validation-value">= {rule.value}</span>
                  {/if}
                  <span class="validation-message">"{rule.message}"</span>
                </div>
                <button
                  type="button"
                  class="remove-btn"
                  on:click={() => removeValidationRule(index)}
                  title="Remove validation rule"
                >
                  ×
                </button>
              </div>
            {/each}
          </div>
        {/if}

        <div class="add-validation-form">
          <select bind:value={newValidationRule.type} class="validation-type-select">
            {#each validationTypes as vt}
              <option value={vt.value}>{vt.label}</option>
            {/each}
          </select>
          <input
            type="text"
            bind:value={newValidationRule.value}
            placeholder="Value (if needed)"
            class="validation-input"
          />
          <input
            type="text"
            bind:value={newValidationRule.message}
            placeholder="Error message"
            class="validation-input"
          />
          <button type="button" class="button-secondary" on:click={addValidationRule}>
            + Add Rule
          </button>
        </div>
      </section>

      <!-- Field Preview -->
      <section class="form-section preview-section">
        <h4>Preview</h4>
        <div class="field-preview">
          <label class="preview-label">
            {formData.name || 'Field Name'}
            {#if formData.required}
              <span class="required-mark">*</span>
            {/if}
            {#if formData.fieldType === 'text'}
              <input
                type="text"
                placeholder={formData.placeholder || ''}
                class="preview-input"
                disabled
              />
            {:else if formData.fieldType === 'textarea'}
              <textarea
                placeholder={formData.placeholder || ''}
                class="preview-input"
                rows="3"
                disabled
              ></textarea>
            {:else if formData.fieldType === 'number'}
              <input type="number" class="preview-input" disabled />
            {:else if formData.fieldType === 'boolean'}
              <input type="checkbox" class="preview-checkbox" disabled />
            {:else if formData.fieldType === 'select'}
              <select class="preview-input" disabled>
                {#if formData.options.length === 0}
                  <option>No options</option>
                {:else}
                  {#each formData.options as option}
                    <option>{option.label}</option>
                  {/each}
                {/if}
              </select>
            {:else}
              <div class="preview-placeholder">[{formData.fieldType} field]</div>
            {/if}
          </label>
          {#if formData.helpText}
            <span class="preview-help-text">{formData.helpText}</span>
          {/if}
        </div>
      </section>
    </form>
  </div>

  <div class="editor-footer">
    <div class="footer-left">
      {#if !isNew}
        <button type="button" class="button-danger" on:click={handleDelete}> Delete Field </button>
      {/if}
    </div>
    <div class="footer-right">
      <button type="button" class="button-secondary" on:click={handleCancel}> Cancel </button>
      <button type="button" class="button-primary" on:click={handleSave}>
        {isNew ? 'Add Field' : 'Save Changes'}
      </button>
    </div>
  </div>
</div>

<style>
  .field-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--color-bg-secondary, #1e1e1e);
  }

  .editor-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border, #333);
  }

  .editor-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .editor-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .form-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background-color: var(--color-bg-primary, #121212);
    border-radius: 6px;
    border: 1px solid var(--color-border, #333);
  }

  .form-section:last-child {
    margin-bottom: 0;
  }

  .form-section h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
    border-bottom: 1px solid var(--color-border, #333);
    padding-bottom: 0.5rem;
  }

  .form-row {
    margin-bottom: 1rem;
  }

  .form-row:last-child {
    margin-bottom: 0;
  }

  .form-row-checkbox {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary, #aaa);
    margin-bottom: 0.25rem;
  }

  .form-row-checkbox label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .help-text {
    display: block;
    font-size: 0.75rem;
    color: var(--color-text-tertiary, #888);
    margin-top: 0.25rem;
    font-weight: normal;
  }

  input[type='text'],
  input[type='number'],
  select,
  textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    background-color: var(--color-bg-secondary, #1e1e1e);
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  input[type='text']:focus,
  input[type='number']:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: #4a90e2;
  }

  input[type='checkbox'] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }

  textarea {
    resize: vertical;
    font-family: inherit;
  }

  .empty-state {
    padding: 1.5rem;
    text-align: center;
    color: var(--color-text-tertiary, #888);
    font-size: 0.875rem;
  }

  .options-list,
  .validation-list {
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .option-row,
  .validation-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background-color: var(--color-bg-secondary, #1e1e1e);
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
  }

  .option-details,
  .validation-details {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
  }

  .option-value,
  .validation-type {
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .option-label,
  .validation-value,
  .validation-message {
    color: var(--color-text-secondary, #aaa);
  }

  .remove-btn {
    width: 2rem;
    height: 2rem;
    padding: 0;
    background-color: transparent;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    color: var(--color-text-secondary, #aaa);
    font-size: 1.5rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .remove-btn:hover {
    background-color: #7f1d1d;
    border-color: #ef4444;
    color: #fca5a5;
  }

  .add-option-form,
  .add-validation-form {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .option-input,
  .validation-input {
    flex: 1;
  }

  .validation-type-select {
    flex: 0 0 auto;
    width: auto;
    min-width: 150px;
  }

  .preview-section {
    background-color: var(--color-bg-tertiary, #0d0d0d);
    border: 2px dashed var(--color-border, #333);
  }

  .field-preview {
    padding: 1rem;
    background-color: var(--color-bg-primary, #121212);
    border-radius: 4px;
  }

  .preview-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary, #aaa);
    margin-bottom: 0.5rem;
  }

  .required-mark {
    color: #ef4444;
  }

  .preview-input,
  .preview-checkbox {
    opacity: 0.6;
  }

  .preview-placeholder {
    padding: 0.5rem;
    background-color: var(--color-bg-secondary, #1e1e1e);
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    text-align: center;
    color: var(--color-text-tertiary, #888);
    font-style: italic;
  }

  .preview-help-text {
    display: block;
    font-size: 0.75rem;
    color: var(--color-text-tertiary, #888);
    margin-top: 0.5rem;
  }

  .editor-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .footer-left,
  .footer-right {
    display: flex;
    gap: 0.75rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
  }

  button:active {
    transform: scale(0.98);
  }

  .button-primary {
    background-color: #4a90e2;
    color: white;
  }

  .button-primary:hover {
    background-color: #357abd;
  }

  .button-secondary {
    background-color: transparent;
    color: var(--color-text-secondary, #aaa);
    border: 1px solid var(--color-border, #333);
  }

  .button-secondary:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }

  .button-danger {
    background-color: #ef4444;
    color: white;
  }

  .button-danger:hover {
    background-color: #dc2626;
  }

  @media (max-width: 640px) {
    .add-option-form,
    .add-validation-form {
      flex-direction: column;
    }

    .option-input,
    .validation-input,
    .validation-type-select {
      width: 100%;
    }
  }
</style>
