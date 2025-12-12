<script lang="ts">
  import type { ItemTemplate } from '@vtt/shared';
  import TemplateSection from './TemplateSection.svelte';
  import { createEventDispatcher } from 'svelte';

  // Props
  export let template: ItemTemplate;
  export let item: any; // Item instance data
  export let onChange: (data: Record<string, any>) => void;
  export let readonly: boolean = false;

  const dispatch = createEventDispatcher<{
    save: any;
    cancel: void;
  }>();

  // Local state for item data
  let itemData: Record<string, any> = { ...item };

  // Initialize missing fields with defaults
  $: {
    if (template && template.fields) {
      template.fields.forEach(field => {
        if (!(field.id in itemData)) {
          itemData[field.id] = field.defaultValue ?? null;
        }
      });
    }
  }

  // Handle field changes
  function handleFieldChange(fieldId: string, value: any) {
    itemData = {
      ...itemData,
      [fieldId]: value
    };
    onChange(itemData);
  }

  // Handle section field changes
  function handleSectionChange(fieldId: string, value: any) {
    handleFieldChange(fieldId, value);
  }

  // Item name and description (always shown at top)
  let itemName = item.name || '';
  let itemDescription = item.description || '';

  function handleNameChange(event: Event) {
    const target = event.target as HTMLInputElement;
    itemName = target.value;
    itemData = { ...itemData, name: itemName };
    onChange(itemData);
  }

  function handleDescriptionChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    itemDescription = target.value;
    itemData = { ...itemData, description: itemDescription };
    onChange(itemData);
  }

  function handleSave() {
    dispatch('save', { ...itemData, name: itemName, description: itemDescription });
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

<div class="template-item-sheet" class:readonly>
  <div class="sheet-header">
    <div class="header-content">
      <div class="item-name-section">
        <label for="item-name" class="sr-only">Item Name</label>
        <input
          id="item-name"
          type="text"
          class="item-name-input"
          value={itemName}
          on:input={handleNameChange}
          placeholder="Item Name"
          disabled={readonly}
        />
      </div>

      <div class="item-category-badge">
        <span class="category-label">{template.category}</span>
      </div>
    </div>
  </div>

  <div class="sheet-body">
    <div class="description-section">
      <label for="item-description" class="description-label">Description</label>
      <textarea
        id="item-description"
        class="description-input"
        value={itemDescription}
        on:input={handleDescriptionChange}
        placeholder="Item description..."
        disabled={readonly}
        rows="3"
      />
    </div>

    {#if template.sections && template.sections.length > 0}
      <div class="sections-container">
        {#each template.sections as section (section.id)}
          <TemplateSection
            {section}
            fields={template.fields || []}
            data={itemData}
            onChange={handleSectionChange}
            {readonly}
          />
        {/each}
      </div>
    {:else}
      <div class="no-sections-message">
        <p>This item template has no configured sections.</p>
      </div>
    {/if}
  </div>

  {#if !readonly}
    <div class="sheet-footer">
      <button class="button-secondary" on:click={handleCancel}>
        Cancel
      </button>
      <button class="button-primary" on:click={handleSave}>
        Save
      </button>
    </div>
  {/if}
</div>

<style>
  .template-item-sheet {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--color-bg-primary, #121212);
    color: var(--color-text-primary, #ffffff);
  }

  .sheet-header {
    padding: 1.5rem;
    border-bottom: 2px solid var(--color-border, #333);
    background-color: var(--color-bg-secondary, #1e1e1e);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .item-name-section {
    flex: 1;
    min-width: 200px;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .item-name-input {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1.5rem;
    font-weight: 700;
    background-color: transparent;
    border: 2px solid transparent;
    border-radius: 6px;
    color: var(--color-text-primary, #ffffff);
    transition: border-color 0.2s, background-color 0.2s;
  }

  .item-name-input:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .item-name-input:focus {
    outline: none;
    border-color: var(--color-accent, #4a90e2);
    background-color: rgba(255, 255, 255, 0.05);
  }

  .item-name-input:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .item-name-input::placeholder {
    color: var(--color-text-secondary, #666);
  }

  .item-category-badge {
    flex-shrink: 0;
  }

  .category-label {
    display: inline-block;
    padding: 0.5rem 1rem;
    background-color: var(--color-accent, #4a90e2);
    color: #ffffff;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }

  .sheet-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .description-section {
    margin-bottom: 2rem;
  }

  .description-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary, #aaa);
    margin-bottom: 0.5rem;
  }

  .description-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 6px;
    background-color: var(--color-bg-secondary, #1e1e1e);
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    font-family: inherit;
    resize: vertical;
    min-height: 80px;
    transition: border-color 0.2s;
  }

  .description-input:focus {
    outline: none;
    border-color: var(--color-accent, #4a90e2);
  }

  .description-input:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .description-input::placeholder {
    color: var(--color-text-secondary, #666);
  }

  .sections-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .no-sections-message {
    padding: 3rem 2rem;
    text-align: center;
    color: var(--color-text-secondary, #aaa);
    background-color: var(--color-bg-secondary, #1e1e1e);
    border-radius: 8px;
  }

  .no-sections-message p {
    margin: 0;
  }

  .sheet-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #333);
    background-color: var(--color-bg-secondary, #1e1e1e);
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  button {
    padding: 0.5rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  button:active:not(:disabled) {
    transform: scale(0.98);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-primary {
    background-color: var(--color-accent, #4a90e2);
    color: #ffffff;
  }

  .button-primary:hover:not(:disabled) {
    background-color: var(--color-accent-hover, #357abd);
  }

  .button-secondary {
    background-color: transparent;
    color: var(--color-text-secondary, #aaa);
    border: 1px solid var(--color-border, #333);
  }

  .button-secondary:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }

  .sheet-body::-webkit-scrollbar {
    width: 10px;
  }

  .sheet-body::-webkit-scrollbar-track {
    background: var(--color-bg-primary, #121212);
  }

  .sheet-body::-webkit-scrollbar-thumb {
    background: var(--color-border, #333);
    border-radius: 5px;
  }

  .sheet-body::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  .template-item-sheet.readonly .sheet-footer {
    display: none;
  }

  @media (max-width: 640px) {
    .sheet-header {
      padding: 1rem;
    }

    .sheet-body {
      padding: 1rem;
    }

    .item-name-input {
      font-size: 1.25rem;
    }

    .sheet-footer {
      padding: 0.75rem 1rem;
      flex-direction: column-reverse;
    }

    button {
      width: 100%;
    }
  }
</style>
