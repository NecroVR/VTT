<script lang="ts">
  import type { FormDefinition } from '@vtt/shared';
  import FormRenderer from '$lib/components/forms/FormRenderer.svelte';
  import { sampleEntities, getSampleEntityData } from './sampleEntities';

  // Props
  interface Props {
    form: FormDefinition;
  }

  let { form }: Props = $props();

  // Local state
  let selectedEntityId = $state('basic');
  let viewportSize = $state<'mobile' | 'tablet' | 'desktop' | 'full'>('full');
  let previewMode = $state<'view' | 'edit'>('view');
  let customData = $state('{}');
  let showCustomEditor = $state(false);
  let customDataError = $state<string | null>(null);

  // Derived state
  let entityData = $derived.by(() => {
    if (selectedEntityId === 'custom') {
      try {
        const parsed = JSON.parse(customData);
        customDataError = null;
        return parsed;
      } catch (err) {
        customDataError = err instanceof Error ? err.message : 'Invalid JSON';
        return {};
      }
    }
    return getSampleEntityData(selectedEntityId);
  });

  let viewportWidth = $derived.by(() => {
    switch (viewportSize) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': return '1024px';
      case 'full': return '100%';
      default: return '100%';
    }
  });

  // Handlers
  function handleEntityChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedEntityId = target.value;
    if (target.value === 'custom') {
      showCustomEditor = true;
    } else {
      showCustomEditor = false;
    }
  }

  function handleViewportChange(size: 'mobile' | 'tablet' | 'desktop' | 'full') {
    viewportSize = size;
  }

  function handleModeToggle() {
    previewMode = previewMode === 'view' ? 'edit' : 'view';
  }

  function handleCustomDataChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    customData = target.value;
  }

  function handleFieldChange(path: string, value: unknown) {
    console.log('Preview field changed:', path, value);
  }

  function handleSave() {
    console.log('Preview save clicked');
  }
</script>

<div class="preview-panel">
  <!-- Preview Controls -->
  <div class="preview-controls">
    <div class="control-section">
      <label for="entity-select">Sample Data:</label>
      <select
        id="entity-select"
        value={selectedEntityId}
        onchange={handleEntityChange}
      >
        {#each sampleEntities as entity}
          <option value={entity.id}>{entity.name}</option>
        {/each}
        <option value="custom">Custom JSON</option>
      </select>
    </div>

    <div class="control-section">
      <label>Viewport:</label>
      <div class="viewport-buttons">
        <button
          type="button"
          class="viewport-btn"
          class:active={viewportSize === 'mobile'}
          onclick={() => handleViewportChange('mobile')}
          title="Mobile (375px)"
        >
          📱
        </button>
        <button
          type="button"
          class="viewport-btn"
          class:active={viewportSize === 'tablet'}
          onclick={() => handleViewportChange('tablet')}
          title="Tablet (768px)"
        >
          📱
        </button>
        <button
          type="button"
          class="viewport-btn"
          class:active={viewportSize === 'desktop'}
          onclick={() => handleViewportChange('desktop')}
          title="Desktop (1024px)"
        >
          💻
        </button>
        <button
          type="button"
          class="viewport-btn"
          class:active={viewportSize === 'full'}
          onclick={() => handleViewportChange('full')}
          title="Full Width"
        >
          ⬛
        </button>
      </div>
    </div>

    <div class="control-section">
      <label for="mode-toggle">Mode:</label>
      <button
        id="mode-toggle"
        type="button"
        class="mode-toggle-btn"
        onclick={handleModeToggle}
      >
        {previewMode === 'view' ? 'View' : 'Edit'}
      </button>
    </div>
  </div>

  <!-- Custom Data Editor -->
  {#if showCustomEditor}
    <div class="custom-editor">
      <div class="editor-header">
        <label for="custom-json">Custom Entity Data (JSON):</label>
        {#if customDataError}
          <span class="error-text">{customDataError}</span>
        {/if}
      </div>
      <textarea
        id="custom-json"
        value={customData}
        oninput={handleCustomDataChange}
        placeholder={JSON.stringify({ name: "Custom Character", level: 5 })}
        rows="6"
      ></textarea>
    </div>
  {/if}

  <!-- Preview Container -->
  <div class="preview-container">
    <div class="preview-viewport" style="width: {viewportWidth}">
      <div class="preview-content">
        <FormRenderer
          {form}
          entity={entityData}
          mode={previewMode}
          onChange={handleFieldChange}
          onSave={handleSave}
        />
      </div>
    </div>
  </div>

  <!-- Viewport Size Indicator -->
  <div class="viewport-indicator">
    {#if viewportSize !== 'full'}
      <span class="size-badge">{viewportWidth}</span>
    {/if}
  </div>
</div>

<style>
  .preview-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-color, #fafafa);
    overflow: hidden;
  }

  /* Preview Controls */
  .preview-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: white;
    border-bottom: 1px solid var(--border-color, #ddd);
    align-items: center;
  }

  .control-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .control-section label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--label-color, #495057);
    white-space: nowrap;
  }

  select {
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--input-border, #ced4da);
    border-radius: 4px;
    font-size: 0.875rem;
    background: white;
    cursor: pointer;
  }

  select:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
  }

  /* Viewport Buttons */
  .viewport-buttons {
    display: flex;
    gap: 0.25rem;
  }

  .viewport-btn {
    padding: 0.375rem 0.625rem;
    border: 1px solid var(--border-color, #ddd);
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
  }

  .viewport-btn:hover {
    background: var(--hover-bg, #f0f0f0);
  }

  .viewport-btn.active {
    background: var(--primary-color, #007bff);
    color: white;
    border-color: var(--primary-color, #007bff);
  }

  /* Mode Toggle */
  .mode-toggle-btn {
    padding: 0.375rem 1rem;
    border: 1px solid var(--border-color, #ddd);
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    min-width: 70px;
    transition: all 0.2s;
  }

  .mode-toggle-btn:hover {
    background: var(--hover-bg, #f0f0f0);
  }

  /* Custom Editor */
  .custom-editor {
    padding: 1rem;
    background: white;
    border-bottom: 1px solid var(--border-color, #ddd);
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .editor-header label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--label-color, #495057);
  }

  .error-text {
    font-size: 0.75rem;
    color: var(--error-color, #dc3545);
  }

  textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--input-border, #ced4da);
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    resize: vertical;
    box-sizing: border-box;
  }

  textarea:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
  }

  /* Preview Container */
  .preview-container {
    flex: 1;
    overflow: auto;
    padding: 1rem;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .preview-viewport {
    background: white;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: width 0.3s ease;
    min-height: 400px;
    max-width: 100%;
  }

  .preview-content {
    height: 100%;
    overflow: auto;
  }

  /* Viewport Indicator */
  .viewport-indicator {
    position: sticky;
    bottom: 0;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.95);
    border-top: 1px solid var(--border-color, #ddd);
    text-align: center;
    min-height: 2rem;
  }

  .size-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: var(--badge-bg, #e9ecef);
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-muted, #6c757d);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .preview-controls {
      flex-direction: column;
      align-items: stretch;
    }

    .control-section {
      width: 100%;
      justify-content: space-between;
    }

    .viewport-buttons {
      flex: 1;
      justify-content: flex-end;
    }
  }
</style>
