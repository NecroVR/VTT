<script lang="ts">
  import type { FormDefinition } from '@vtt/shared';
  import { formDesignerStore, canUndo, canRedo, isSaving, selectedNode } from '$lib/stores/formDesigner';
  import { goto } from '$app/navigation';
  import FormRenderer from '$lib/components/forms/FormRenderer.svelte';
  import ComponentPalette from './ComponentPalette.svelte';
  import DesignerCanvas from './DesignerCanvas.svelte';
  import TreeView from './TreeView.svelte';
  import PropertyEditor from './PropertyEditor.svelte';

  // Props
  interface Props {
    formDefinition: FormDefinition;
  }

  let { formDefinition }: Props = $props();

  // Store subscriptions
  let store = $derived($formDesignerStore);
  let _canUndo = $derived($canUndo);
  let _canRedo = $derived($canRedo);
  let _isSaving = $derived($isSaving);
  let _selectedNode = $derived($selectedNode);

  // Local state
  let formName = $state(formDefinition.name);
  let saveError = $state<string | null>(null);

  // Initialize the store with the form
  $effect(() => {
    formDesignerStore.initializeForm(formDefinition);
  });

  // Sync form name with store
  $effect(() => {
    if (store.form) {
      formName = store.form.name;
    }
  });

  // Handle form name change
  function handleNameChange(event: Event) {
    const target = event.target as HTMLInputElement;
    formName = target.value;
    formDesignerStore.updateFormName(formName);
  }

  // Handle save
  async function handleSave() {
    saveError = null;
    try {
      await formDesignerStore.save();
    } catch (err) {
      saveError = err instanceof Error ? err.message : 'Failed to save form';
    }
  }

  // Handle preview toggle
  function togglePreview() {
    const newMode = store.mode === 'design' ? 'preview' : 'design';
    formDesignerStore.setMode(newMode);
  }

  // Handle undo
  function handleUndo() {
    formDesignerStore.undo();
  }

  // Handle redo
  function handleRedo() {
    formDesignerStore.redo();
  }

  // Handle back navigation
  function handleBack() {
    // TODO: Check for unsaved changes
    if (store.isDirty) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    goto('/forms');
  }

  // Sample entity data for preview mode
  const sampleEntity = {
    name: 'Sample Character',
    attributes: {
      strength: { value: 10 },
      dexterity: { value: 12 },
      constitution: { value: 14 }
    }
  };

  // Handle node selection
  function handleSelectNode(nodeId: string | null) {
    formDesignerStore.selectNode(nodeId);
  }

  // Handle node property updates
  function handleUpdateNode(updates: Partial<typeof store.form.layout[0]>) {
    if (store.selectedNodeId) {
      formDesignerStore.updateNode(store.selectedNodeId, updates);
    }
  }
</script>

<div class="form-designer">
  <!-- Toolbar -->
  <div class="toolbar">
    <div class="toolbar-left">
      <button
        type="button"
        class="btn btn-secondary"
        onclick={handleBack}
      >
        Back
      </button>
    </div>

    <div class="toolbar-center">
      <input
        type="text"
        class="form-name-input"
        value={formName}
        oninput={handleNameChange}
        placeholder="Form Name"
      />
    </div>

    <div class="toolbar-right">
      <button
        type="button"
        class="btn btn-icon"
        onclick={handleUndo}
        disabled={!_canUndo}
        title="Undo"
      >
        ↶
      </button>
      <button
        type="button"
        class="btn btn-icon"
        onclick={handleRedo}
        disabled={!_canRedo}
        title="Redo"
      >
        ↷
      </button>
      <button
        type="button"
        class="btn btn-secondary"
        onclick={togglePreview}
      >
        {store.mode === 'design' ? 'Preview' : 'Design'}
      </button>
      <button
        type="button"
        class="btn btn-primary"
        onclick={handleSave}
        disabled={!store.isDirty || _isSaving}
      >
        {_isSaving ? 'Saving...' : 'Save'}
      </button>
    </div>
  </div>

  {#if saveError}
    <div class="error-banner">
      {saveError}
      <button onclick={() => saveError = null}>✕</button>
    </div>
  {/if}

  <!-- Main Content Area -->
  {#if store.mode === 'preview'}
    <!-- Preview Mode: Show form renderer -->
    <div class="preview-container">
      {#if store.form}
        <FormRenderer
          form={store.form}
          entity={sampleEntity}
          mode="view"
        />
      {/if}
    </div>
  {:else}
    <!-- Design Mode: Three-panel layout -->
    <div class="designer-layout">
      <!-- Left Panel: Component Palette & Tree View -->
      <div class="panel panel-left">
        <div class="palette-section">
          <div class="panel-header">
            <h3>Components</h3>
          </div>
          <div class="panel-content palette-content">
            <ComponentPalette />
          </div>
        </div>

        <div class="tree-section">
          {#if store.form}
            <TreeView
              layout={store.form.layout}
              selectedNodeId={store.selectedNodeId}
              onSelectNode={handleSelectNode}
            />
          {/if}
        </div>
      </div>

      <!-- Center Panel: Canvas -->
      <div class="panel panel-center">
        <div class="panel-header">
          <h3>Canvas</h3>
        </div>
        <div class="panel-content canvas-panel">
          {#if store.form}
            <DesignerCanvas
              layout={store.form.layout}
              selectedNodeId={store.selectedNodeId}
              onSelectNode={handleSelectNode}
            />
          {/if}
        </div>
      </div>

      <!-- Right Panel: Properties -->
      <div class="panel panel-right">
        <div class="panel-header">
          <h3>Properties</h3>
        </div>
        <div class="panel-content">
          <div class="placeholder">
            <p>Node Properties</p>
            <p class="placeholder-note">(To be implemented in Phase 3.4)</p>
            {#if store.selectedNodeId}
              <p class="placeholder-info">
                Selected: {store.selectedNodeId}
              </p>
            {:else}
              <p class="placeholder-info">
                No node selected
              </p>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .form-designer {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg-color, #f5f5f5);
  }

  /* Toolbar */
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    background: var(--toolbar-bg, white);
    border-bottom: 1px solid var(--border-color, #ddd);
    position: sticky;
    top: 0;
    z-index: 100;
    gap: 1rem;
  }

  .toolbar-left,
  .toolbar-right {
    display: flex;
    gap: 0.5rem;
  }

  .toolbar-center {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .form-name-input {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    min-width: 300px;
    text-align: center;
  }

  .form-name-input:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
  }

  /* Buttons */
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--primary-color, #007bff);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--primary-color-hover, #0056b3);
  }

  .btn-secondary {
    background: var(--secondary-bg, #6c757d);
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--secondary-bg-hover, #5a6268);
  }

  .btn-icon {
    background: transparent;
    border: 1px solid var(--border-color, #ddd);
    padding: 0.5rem 0.75rem;
    font-size: 1.2rem;
    line-height: 1;
  }

  .btn-icon:hover:not(:disabled) {
    background: var(--hover-bg, #f0f0f0);
  }

  /* Error Banner */
  .error-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--error-bg, #f8d7da);
    color: var(--error-color, #721c24);
    border-bottom: 1px solid var(--error-border, #f5c6cb);
  }

  .error-banner button {
    background: transparent;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0 0.5rem;
  }

  /* Preview Container */
  .preview-container {
    flex: 1;
    overflow: auto;
    padding: 2rem;
    background: white;
  }

  /* Designer Layout */
  .designer-layout {
    flex: 1;
    display: grid;
    grid-template-columns: 250px 1fr 300px;
    gap: 0;
    overflow: hidden;
  }

  /* Panels */
  .panel {
    display: flex;
    flex-direction: column;
    background: white;
    border-right: 1px solid var(--border-color, #ddd);
    overflow: hidden;
  }

  .panel:last-child {
    border-right: none;
  }

  .panel-header {
    padding: 0.75rem 1rem;
    background: var(--panel-header-bg, #f8f9fa);
    border-bottom: 1px solid var(--border-color, #ddd);
  }

  .panel-header h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-muted, #6c757d);
  }

  .panel-content {
    flex: 1;
    overflow: auto;
    padding: 1rem;
  }

  .panel-content.canvas-panel {
    padding: 0;
  }

  /* Left Panel */
  .panel-left {
    grid-column: 1;
    display: flex;
    flex-direction: column;
  }

  .palette-section {
    flex: 0 0 auto;
    max-height: 40%;
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid var(--border-color, #ddd);
    overflow: hidden;
  }

  .palette-content {
    flex: 1;
    overflow-y: auto;
  }

  .tree-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Center Panel */
  .panel-center {
    grid-column: 2;
    background: var(--canvas-bg, #fafafa);
  }

  /* Right Panel */
  .panel-right {
    grid-column: 3;
  }

  /* Placeholder Styles */
  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted, #6c757d);
    text-align: center;
    gap: 0.5rem;
  }

  .placeholder p {
    margin: 0;
  }

  .placeholder-note {
    font-size: 0.875rem;
    font-style: italic;
  }

  .placeholder-info {
    font-size: 0.875rem;
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: var(--info-bg, #e7f3ff);
    border-radius: 4px;
  }

  /* Responsive adjustments */
  @media (max-width: 1200px) {
    .designer-layout {
      grid-template-columns: 200px 1fr 250px;
    }
  }

  @media (max-width: 900px) {
    .designer-layout {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr auto;
    }

    .panel-left {
      grid-column: 1;
      grid-row: 1;
      max-height: 200px;
    }

    .panel-center {
      grid-column: 1;
      grid-row: 2;
    }

    .panel-right {
      grid-column: 1;
      grid-row: 3;
      max-height: 200px;
    }

    .panel {
      border-right: none;
      border-bottom: 1px solid var(--border-color, #ddd);
    }
  }
</style>
