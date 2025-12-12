<script lang="ts">
  import type { SectionDefinition, FieldDefinition } from '@vtt/shared';
  import TemplateField from './TemplateField.svelte';

  // Props
  export let section: SectionDefinition;
  export let fields: FieldDefinition[]; // All available fields
  export let data: Record<string, any>; // Item data
  export let onChange: (fieldId: string, value: any) => void;
  export let readonly: boolean = false;

  // State
  let isCollapsed = section.defaultCollapsed ?? false;

  // Get fields for this section
  $: sectionFields = section.fields
    .map(fieldId => fields.find(f => f.id === fieldId))
    .filter((f): f is FieldDefinition => f !== undefined);

  function handleFieldChange(fieldId: string, value: any) {
    onChange(fieldId, value);
  }

  function toggleCollapse() {
    if (section.collapsible) {
      isCollapsed = !isCollapsed;
    }
  }

  // Determine grid columns based on field widths
  function getGridColumns(): string {
    // Default to single column
    return '1fr';
  }
</script>

<div class="template-section" class:readonly>
  <div class="section-header" class:collapsible={section.collapsible} on:click={toggleCollapse}>
    <h3 class="section-title">
      {#if section.collapsible}
        <span class="collapse-icon" class:collapsed={isCollapsed}>
          {isCollapsed ? '▶' : '▼'}
        </span>
      {/if}
      {section.name}
    </h3>
  </div>

  {#if !isCollapsed}
    <div class="section-content">
      <div class="fields-grid">
        {#each sectionFields as field (field.id)}
          <div class="field-wrapper" class:full-width={field.width === 'full'} class:half-width={field.width === 'half'} class:third-width={field.width === 'third'} class:quarter-width={field.width === 'quarter'}>
            <TemplateField
              {field}
              value={data[field.id]}
              onChange={(value) => handleFieldChange(field.id, value)}
              {readonly}
            />
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .template-section {
    margin-bottom: 1.5rem;
    background-color: var(--color-bg-secondary, #1e1e1e);
    border-radius: 8px;
    overflow: hidden;
  }

  .section-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border, #333);
    background-color: rgba(0, 0, 0, 0.2);
  }

  .section-header.collapsible {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;
  }

  .section-header.collapsible:hover {
    background-color: rgba(0, 0, 0, 0.3);
  }

  .section-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .collapse-icon {
    font-size: 0.75rem;
    transition: transform 0.2s;
    display: inline-block;
    width: 1rem;
  }

  .section-content {
    padding: 1.5rem;
  }

  .fields-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 1rem;
  }

  .field-wrapper {
    grid-column: span 12;
  }

  .field-wrapper.full-width {
    grid-column: span 12;
  }

  .field-wrapper.half-width {
    grid-column: span 6;
  }

  .field-wrapper.third-width {
    grid-column: span 4;
  }

  .field-wrapper.quarter-width {
    grid-column: span 3;
  }

  /* Responsive breakpoints */
  @media (max-width: 768px) {
    .field-wrapper.half-width,
    .field-wrapper.third-width,
    .field-wrapper.quarter-width {
      grid-column: span 12;
    }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    .field-wrapper.third-width,
    .field-wrapper.quarter-width {
      grid-column: span 6;
    }
  }

  .template-section.readonly {
    opacity: 0.9;
  }
</style>
