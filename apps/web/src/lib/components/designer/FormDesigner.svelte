<script lang="ts">
  import type { FormDefinition, FormFragment, FormStyles } from '@vtt/shared';
  import { formDesignerStore, canUndo, canRedo, isSaving, selectedNode, hasClipboard, designerFeedback } from '$lib/stores/formDesigner';
  import { formsStore } from '$lib/stores/forms';
  import { goto } from '$app/navigation';
  import FormRenderer from '$lib/components/forms/FormRenderer.svelte';
  import ComponentPalette from './ComponentPalette.svelte';
  import DesignerCanvas from './DesignerCanvas.svelte';
  import TreeView from './TreeView.svelte';
  import PropertyEditor from './PropertyEditor.svelte';
  import JsonEditor from './JsonEditor.svelte';
  import PreviewPanel from './PreviewPanel.svelte';
  import FragmentLibrary from './FragmentLibrary.svelte';
  import FragmentEditor from './FragmentEditor.svelte';
  import StyleEditor from './StyleEditor.svelte';
  import ImportFormModal from './ImportFormModal.svelte';
  import UndoHistoryPanel from './UndoHistoryPanel.svelte';
  import SaveAsTemplateDialog from './SaveAsTemplateDialog.svelte';
  import KeyboardShortcutsHelp from './KeyboardShortcutsHelp.svelte';

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
  let _hasClipboard = $derived($hasClipboard);
  let _feedback = $derived($designerFeedback);

  // Local state
  let formName = $state(formDefinition.name);
  let saveError = $state<string | null>(null);
  let viewMode = $state<'canvas' | 'json'>('canvas');
  let showInlinePreview = $state(false);
  let rightPanelTab = $state<'properties' | 'styles'>('properties');

  // Fragment editor state
  let fragmentEditorOpen = $state(false);
  let editingFragment = $state<FormFragment | null>(null);

  // History panel state
  let historyPanelOpen = $state(false);

  // Keyboard shortcuts help state
  let shortcutsHelpOpen = $state(false);

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

  // Auto-dismiss feedback messages after 3 seconds
  $effect(() => {
    if (_feedback.message) {
      const timer = setTimeout(() => {
        formDesignerStore.clearFeedback();
      }, 3000);

      return () => clearTimeout(timer);
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

  // Handle JSON apply
  function handleJsonApply(formJson: string) {
    try {
      const parsed = JSON.parse(formJson) as FormDefinition;
      formDesignerStore.updateFromJson(parsed);
      saveError = null;
    } catch (err) {
      saveError = err instanceof Error ? err.message : 'Failed to apply JSON changes';
    }
  }

  // Toggle view mode
  function toggleViewMode() {
    viewMode = viewMode === 'canvas' ? 'json' : 'canvas';
  }

  // Toggle inline preview
  function toggleInlinePreview() {
    showInlinePreview = !showInlinePreview;
  }

  // Fragment CRUD handlers
  function handleCreateFragment() {
    editingFragment = null;
    fragmentEditorOpen = true;
  }

  function handleEditFragment(fragment: FormFragment) {
    editingFragment = fragment;
    fragmentEditorOpen = true;
  }

  function handleDeleteFragment(fragmentId: string) {
    formDesignerStore.deleteFragment(fragmentId);
  }

  function handleSaveFragment(fragmentData: Partial<FormFragment>) {
    if (editingFragment && fragmentData.id) {
      // Update existing fragment
      formDesignerStore.updateFragment(fragmentData.id, fragmentData);
    } else {
      // Create new fragment
      formDesignerStore.createFragment(fragmentData as Omit<FormFragment, 'id' | 'createdAt' | 'updatedAt'>);
    }
    fragmentEditorOpen = false;
    editingFragment = null;
  }

  function handleCancelFragment() {
    fragmentEditorOpen = false;
    editingFragment = null;
  }

  // Handle style updates
  function handleUpdateStyles(styles: FormStyles) {
    formDesignerStore.updateStyles(styles);
  }

  // Import modal state
  let importModalOpen = $state(false);

  // Save as template modal state
  let saveAsTemplateModalOpen = $state(false);

  // Handle export
  async function handleExport() {
    if (!formDefinition.id) return;

    try {
      const exportData = await formsStore.exportForm(formDefinition.id);

      // Create filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `form-${formDefinition.name.toLowerCase().replace(/\s+/g, '-')}-v${formDefinition.version}-${timestamp}.json`;

      // Download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      saveError = err instanceof Error ? err.message : 'Failed to export form';
    }
  }

  // Handle import
  function handleImport() {
    importModalOpen = true;
  }

  // Handle imported form
  function handleImported(event: CustomEvent) {
    const form = event.detail;
    saveError = null;
    // Optionally navigate to the imported form or show success message
    console.log('Form imported successfully:', form);
  }

  // Handle save as template
  function handleSaveAsTemplate() {
    saveAsTemplateModalOpen = true;
  }

  // Handle template save
  async function handleTemplateSave(templateName: string, description: string) {
    if (!formDefinition.id) return;

    try {
      await formsStore.saveAsTemplate(formDefinition.id, templateName, description);
      saveAsTemplateModalOpen = false;
      // Show success message
      alert(`Template "${templateName}" saved successfully!`);
    } catch (err) {
      saveError = err instanceof Error ? err.message : 'Failed to save template';
    }
  }

  // Handle keyboard shortcuts
  function handleKeydown(event: KeyboardEvent) {
    // Check for help shortcut (? or F1) - works in any mode
    if (event.key === '?' || event.key === 'F1') {
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' ||
                       target.tagName === 'TEXTAREA' ||
                       target.isContentEditable;

      // Only show help if not typing in an input field
      if (!isTyping) {
        event.preventDefault();
        shortcutsHelpOpen = true;
        return;
      }
    }

    // Only handle other shortcuts in design mode
    if (store.mode !== 'design') return;

    // Skip if user is typing in an input field
    const target = event.target as HTMLElement;
    const isTyping = target.tagName === 'INPUT' ||
                     target.tagName === 'TEXTAREA' ||
                     target.isContentEditable;

    // Check for undo (Ctrl/Cmd + Z)
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      if (_canUndo) {
        handleUndo();
      }
      return;
    }

    // Check for redo (Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z)
    if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
      event.preventDefault();
      if (_canRedo) {
        handleRedo();
      }
      return;
    }

    // Check for copy (Ctrl/Cmd + C)
    if ((event.ctrlKey || event.metaKey) && event.key === 'c' && !isTyping) {
      if (_selectedNode) {
        event.preventDefault();
        formDesignerStore.copyNode(_selectedNode.id);
      }
      return;
    }

    // Check for cut (Ctrl/Cmd + X)
    if ((event.ctrlKey || event.metaKey) && event.key === 'x' && !isTyping) {
      if (_selectedNode) {
        event.preventDefault();
        formDesignerStore.cutNode(_selectedNode.id);
      }
      return;
    }

    // Check for paste (Ctrl/Cmd + V)
    if ((event.ctrlKey || event.metaKey) && event.key === 'v' && !isTyping) {
      event.preventDefault();
      // If a node is selected, paste as child; otherwise paste to root
      const parentId = _selectedNode ? _selectedNode.id : 'root';
      formDesignerStore.pasteNode(parentId);
      return;
    }

    // Don't handle other shortcuts if typing in input
    if (isTyping) return;

    // Delete key - delete selected node
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (_selectedNode) {
        event.preventDefault();

        // Check if node has children
        const hasChildren = formDesignerStore.hasChildren(_selectedNode.id);
        const nodeName = 'label' in _selectedNode ? _selectedNode.label : _selectedNode.type;

        // Show confirmation if node has children
        if (hasChildren) {
          const confirmed = confirm(
            `Are you sure you want to delete "${nodeName}" and all its children?`
          );
          if (!confirmed) return;
        }

        formDesignerStore.removeNode(_selectedNode.id);
      }
      return;
    }

    // Enter key - focus property editor
    if (event.key === 'Enter') {
      if (_selectedNode) {
        event.preventDefault();
        // Switch to properties tab
        rightPanelTab = 'properties';

        // Focus first input in property editor
        setTimeout(() => {
          const propertyEditor = document.querySelector('.properties-panel');
          const firstInput = propertyEditor?.querySelector('input, select, textarea') as HTMLElement;
          firstInput?.focus();
        }, 100);
      }
      return;
    }

    // Escape key - deselect node
    if (event.key === 'Escape') {
      if (_selectedNode) {
        event.preventDefault();
        formDesignerStore.selectNode(null);
      }
      return;
    }
  }

  // Toggle history panel
  function toggleHistoryPanel() {
    historyPanelOpen = !historyPanelOpen;
  }

</script>

<svelte:window on:keydown={handleKeydown} />

<div class="form-designer">
  <!-- Toolbar -->
  <div class="toolbar" role="toolbar" aria-label="Form designer toolbar">
    <div class="toolbar-left">
      <button
        type="button"
        class="btn btn-secondary"
        onclick={handleBack}
        aria-label="Go back to forms list"
      >
        Back
      </button>
    </div>

    <div class="toolbar-center">
      <label for="form-name-input" class="sr-only">Form Name</label>
      <input
        id="form-name-input"
        type="text"
        class="form-name-input"
        value={formName}
        oninput={handleNameChange}
        placeholder="Form Name"
        aria-label="Form name"
      />
    </div>

    <div class="toolbar-right" role="group" aria-label="Toolbar actions">
      <button
        type="button"
        class="btn btn-icon"
        onclick={handleUndo}
        disabled={!_canUndo}
        title="Undo last action"
        aria-label="Undo last action"
        aria-keyshortcuts="Control+Z"
      >
        ↶
      </button>
      <button
        type="button"
        class="btn btn-icon"
        onclick={handleRedo}
        disabled={!_canRedo}
        title="Redo last undone action"
        aria-label="Redo last undone action"
        aria-keyshortcuts="Control+Y"
      >
        ↷
      </button>
      <button
        type="button"
        class="btn btn-secondary"
        onclick={togglePreview}
        aria-label={store.mode === 'design' ? 'Switch to preview mode' : 'Switch to design mode'}
        aria-pressed={store.mode === 'preview'}
      >
        {store.mode === 'design' ? 'Preview' : 'Design'}
      </button>
      {#if store.mode === 'design'}
        <button
          type="button"
          class="btn btn-secondary"
          onclick={toggleViewMode}
          title="Toggle between visual canvas and JSON editor"
          aria-label="Toggle between visual canvas and JSON editor"
          aria-pressed={viewMode === 'json'}
        >
          {viewMode === 'canvas' ? 'JSON' : 'Canvas'}
        </button>
        {#if viewMode === 'canvas'}
          <button
            type="button"
            class="btn btn-secondary"
            onclick={toggleInlinePreview}
            title="Toggle inline preview panel"
            aria-label="Toggle inline preview panel"
            aria-pressed={showInlinePreview}
          >
            {showInlinePreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        {/if}
      {/if}
      <button
        type="button"
        class="btn btn-secondary"
        onclick={handleExport}
        title="Export form as JSON"
        aria-label="Export form as JSON file"
      >
        <i class="fas fa-download" aria-hidden="true"></i> Export
      </button>
      <button
        type="button"
        class="btn btn-secondary"
        onclick={handleImport}
        title="Import form from JSON"
        aria-label="Import form from JSON file"
      >
        <i class="fas fa-upload" aria-hidden="true"></i> Import
      </button>
      <button
        type="button"
        class="btn btn-secondary"
        onclick={handleSaveAsTemplate}
        title="Save this form as a reusable template"
        aria-label="Save form as template"
      >
        <i class="fas fa-bookmark" aria-hidden="true"></i> Save as Template
      </button>
      <button
        type="button"
        class="btn btn-icon"
        onclick={() => shortcutsHelpOpen = true}
        title="Keyboard shortcuts (? or F1)"
        aria-label="Show keyboard shortcuts help"
        aria-keyshortcuts="? F1"
      >
        ?
      </button>
      <button
        type="button"
        class="btn btn-primary"
        onclick={handleSave}
        disabled={!store.isDirty || _isSaving}
        aria-label={_isSaving ? 'Saving form...' : store.isDirty ? 'Save form changes' : 'No changes to save'}
      >
        {_isSaving ? 'Saving...' : 'Save'}
      </button>
    </div>
  </div>

  {#if saveError}
    <div class="error-banner" role="alert" aria-live="assertive">
      {saveError}
      <button onclick={() => saveError = null} aria-label="Dismiss error message">✕</button>
    </div>
  {/if}

  <!-- Main Content Area -->
  {#if store.mode === 'preview'}
    <!-- Preview Mode: Show form renderer -->
    <div class="preview-container" role="main" aria-label="Form preview">
      {#if store.form}
        <FormRenderer
          form={store.form}
          entity={sampleEntity}
          mode="view"
        />
      {/if}
    </div>
  {:else if viewMode === 'json'}
    <!-- JSON Editor View -->
    <div class="json-view" role="main" aria-label="JSON editor">
      <JsonEditor
        form={store.form}
        onApply={handleJsonApply}
      />
    </div>
  {:else}
    <!-- Design Mode: Three or Four-panel layout -->
    <div class="designer-layout" class:with-preview={showInlinePreview}>
      <!-- Left Panel: Component Palette & Tree View -->
      <aside class="panel panel-left" aria-label="Component palette and structure">
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

        <div class="fragment-section">
          {#if store.form}
            <FragmentLibrary
              fragments={store.form.fragments}
              onCreateFragment={handleCreateFragment}
              onEditFragment={handleEditFragment}
              onDeleteFragment={handleDeleteFragment}
            />
          {/if}
        </div>
      </aside>

      <!-- Center Panel: Canvas -->
      <main class="panel panel-center" aria-label="Form canvas">
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
      </main>

      <!-- Preview Panel (optional) -->
      {#if showInlinePreview}
        <aside class="panel panel-preview" aria-label="Live preview">
          <div class="panel-header">
            <h3>Preview</h3>
          </div>
          <div class="panel-content preview-panel-content">
            {#if store.form}
              <PreviewPanel form={store.form} />
            {/if}
          </div>
        </aside>
      {/if}

      <!-- Right Panel: Properties & Styles -->
      <aside class="panel panel-right" aria-label="Properties and styles">
        <div class="panel-tabs" role="tablist" aria-label="Property tabs">
          <button
            class="panel-tab"
            class:active={rightPanelTab === 'properties'}
            onclick={() => rightPanelTab = 'properties'}
            role="tab"
            aria-selected={rightPanelTab === 'properties'}
            aria-controls="properties-panel"
            id="properties-tab"
          >
            Properties
          </button>
          <button
            class="panel-tab"
            class:active={rightPanelTab === 'styles'}
            onclick={() => rightPanelTab = 'styles'}
            role="tab"
            aria-selected={rightPanelTab === 'styles'}
            aria-controls="styles-panel"
            id="styles-tab"
          >
            Styles
          </button>
        </div>
        <div
          class="panel-content properties-panel"
          role="tabpanel"
          id="properties-panel"
          aria-labelledby={rightPanelTab === 'properties' ? 'properties-tab' : 'styles-tab'}
        >
          {#if rightPanelTab === 'properties'}
            <PropertyEditor
              node={_selectedNode}
              onUpdate={handleUpdateNode}
            />
          {:else if store.form}
            <StyleEditor
              styles={store.form.styles}
              onUpdate={handleUpdateStyles}
            />
          {/if}
        </div>
      </aside>
    </div>
  {/if}

  <!-- Fragment Editor Modal -->
  <FragmentEditor
    fragment={editingFragment}
    isOpen={fragmentEditorOpen}
    onSave={handleSaveFragment}
    onCancel={handleCancelFragment}
  />

  <!-- Import Form Modal -->
  <ImportFormModal
    gameSystemId={formDefinition.gameSystemId}
    bind:isOpen={importModalOpen}
    on:imported={handleImported}
  />

  <!-- Save as Template Dialog -->
  <SaveAsTemplateDialog
    isOpen={saveAsTemplateModalOpen}
    currentForm={store.form}
    onSave={handleTemplateSave}
    onClose={() => saveAsTemplateModalOpen = false}
  />

  <!-- Toast Notification -->
  {#if _feedback.message}
    <div
      class="toast-notification toast-{_feedback.type}"
      role="alert"
      aria-live="polite"
    >
      <span>{_feedback.message}</span>
      <button
        type="button"
        class="toast-close"
        onclick={() => formDesignerStore.clearFeedback()}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  {/if}
</div>

  <!-- Undo History Panel -->
  <UndoHistoryPanel
    bind:isOpen={historyPanelOpen}
    onClose={() => historyPanelOpen = false}
  />

  <!-- Keyboard Shortcuts Help -->
  <KeyboardShortcutsHelp
    isOpen={shortcutsHelpOpen}
    onClose={() => shortcutsHelpOpen = false}
  />

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

  /* JSON View */
  .json-view {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Designer Layout */
  .designer-layout {
    flex: 1;
    display: grid;
    grid-template-columns: 250px 1fr 300px;
    gap: 0;
    overflow: hidden;
  }

  /* Four-panel layout when preview is visible */
  .designer-layout.with-preview {
    grid-template-columns: 250px 1fr 400px 300px;
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

  .panel-tabs {
    display: flex;
    background: var(--panel-header-bg, #f8f9fa);
    border-bottom: 1px solid var(--border-color, #ddd);
  }

  .panel-tab {
    flex: 1;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-muted, #6c757d);
    transition: all 0.2s;
  }

  .panel-tab:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .panel-tab.active {
    color: var(--primary-color, #007bff);
    border-bottom-color: var(--primary-color, #007bff);
    background: white;
  }

  .panel-content {
    flex: 1;
    overflow: auto;
    padding: 1rem;
  }

  .panel-content.canvas-panel {
    padding: 0;
  }

  .panel-content.properties-panel {
    padding: 0;
  }

  .panel-content.preview-panel-content {
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
    border-bottom: 1px solid var(--border-color, #ddd);
  }

  .fragment-section {
    flex: 0 0 auto;
    max-height: 30%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Center Panel */
  .panel-center {
    grid-column: 2;
    background: var(--canvas-bg, #fafafa);
  }

  /* Preview Panel */
  .panel-preview {
    grid-column: 3;
    background: var(--bg-color, #fafafa);
  }

  /* Right Panel */
  .panel-right {
    grid-column: 3;
  }

  /* Adjust right panel position when preview is visible */
  .with-preview .panel-right {
    grid-column: 4;
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

  /* Screen reader only text */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Focus styles for accessibility */
  .btn:focus-visible,
  .form-name-input:focus-visible,
  .panel-tab:focus-visible {
    outline: 2px solid var(--primary-color, #007bff);
    outline-offset: 2px;
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

  /* Toast Notification */
  .toast-notification {
    position: fixed;
    top: 4rem;
    right: 1rem;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    min-width: 250px;
    max-width: 400px;
    border-radius: 4px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: toast-slide-in 0.3s ease-out;
    font-size: 0.875rem;
  }

  @keyframes toast-slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .toast-success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .toast-error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .toast-info {
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
  }

  .toast-notification span {
    flex: 1;
  }

  .toast-close {
    background: transparent;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0 0.25rem;
    color: inherit;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .toast-close:hover {
    opacity: 1;
  }
</style>
