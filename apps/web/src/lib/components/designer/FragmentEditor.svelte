<script lang="ts">
  import type { FormFragment, FragmentParameter, LayoutNode } from '@vtt/shared';
  import DesignerCanvas from './DesignerCanvas.svelte';

  interface Props {
    fragment: FormFragment | null;
    isOpen: boolean;
    onSave: (fragment: Partial<FormFragment>) => void;
    onCancel: () => void;
  }

  let { fragment, isOpen, onSave, onCancel }: Props = $props();

  // Form state
  let name = $state('');
  let description = $state('');
  let parameters = $state<FragmentParameter[]>([]);
  let content = $state<LayoutNode[]>([]);
  let selectedNodeId = $state<string | null>(null);

  // Parameter editor state
  let editingParamIndex = $state<number | null>(null);
  let newParamName = $state('');
  let newParamType = $state<'binding' | 'literal'>('binding');
  let newParamDefault = $state('');
  let newParamDescription = $state('');

  // Validation
  let errors = $state<string[]>([]);

  // Initialize form when fragment changes or modal opens
  $effect(() => {
    if (isOpen) {
      if (fragment) {
        // Editing existing fragment
        name = fragment.name;
        description = fragment.description || '';
        parameters = [...fragment.parameters];
        content = JSON.parse(JSON.stringify(fragment.content)); // Deep clone
      } else {
        // Creating new fragment
        name = '';
        description = '';
        parameters = [];
        content = [];
      }
      selectedNodeId = null;
      errors = [];
      resetParamForm();
    }
  });

  // Reset parameter form
  function resetParamForm() {
    editingParamIndex = null;
    newParamName = '';
    newParamType = 'binding';
    newParamDefault = '';
    newParamDescription = '';
  }

  // Add or update parameter
  function saveParameter() {
    // Validate
    if (!newParamName.trim()) {
      alert('Parameter name is required');
      return;
    }

    // Check for duplicate names (excluding current if editing)
    const isDuplicate = parameters.some((p, i) =>
      p.name === newParamName.trim() && i !== editingParamIndex
    );

    if (isDuplicate) {
      alert('Parameter name must be unique');
      return;
    }

    const param: FragmentParameter = {
      name: newParamName.trim(),
      type: newParamType,
      default: newParamDefault.trim() || undefined,
      description: newParamDescription.trim() || undefined
    };

    if (editingParamIndex !== null) {
      // Update existing
      parameters[editingParamIndex] = param;
      parameters = [...parameters];
    } else {
      // Add new
      parameters = [...parameters, param];
    }

    resetParamForm();
  }

  // Edit parameter
  function editParameter(index: number) {
    const param = parameters[index];
    editingParamIndex = index;
    newParamName = param.name;
    newParamType = param.type;
    newParamDefault = param.default || '';
    newParamDescription = param.description || '';
  }

  // Delete parameter
  function deleteParameter(index: number) {
    if (confirm('Delete this parameter?')) {
      parameters = parameters.filter((_, i) => i !== index);
      if (editingParamIndex === index) {
        resetParamForm();
      }
    }
  }

  // Validate form
  function validate(): boolean {
    errors = [];

    if (!name.trim()) {
      errors.push('Fragment name is required');
    }

    // Check for duplicate parameter names
    const paramNames = new Set<string>();
    for (const param of parameters) {
      if (paramNames.has(param.name)) {
        errors.push(`Duplicate parameter name: ${param.name}`);
      }
      paramNames.add(param.name);
    }

    return errors.length === 0;
  }

  // Handle save
  function handleSave() {
    if (!validate()) {
      return;
    }

    const fragmentData: Partial<FormFragment> = {
      name: name.trim(),
      description: description.trim() || undefined,
      parameters,
      content
    };

    if (fragment) {
      fragmentData.id = fragment.id;
    }

    onSave(fragmentData);
  }

  // Handle canvas node selection
  function handleSelectNode(nodeId: string | null) {
    selectedNodeId = nodeId;
  }

  // Handle content updates (for future canvas integration)
  function handleUpdateContent(newContent: LayoutNode[]) {
    content = newContent;
  }
</script>

{#if isOpen}
  <div class="modal-overlay" onclick={onCancel}>
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
      <!-- Header -->
      <div class="modal-header">
        <h2>{fragment ? 'Edit Fragment' : 'Create Fragment'}</h2>
        <button
          type="button"
          class="btn-close"
          onclick={onCancel}
          title="Close"
        >
          ✕
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        {#if errors.length > 0}
          <div class="error-box">
            <strong>Please fix the following errors:</strong>
            <ul>
              {#each errors as error}
                <li>{error}</li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- Basic Info -->
        <section class="form-section">
          <h3>Basic Information</h3>

          <div class="form-group">
            <label for="fragment-name">
              Name <span class="required">*</span>
            </label>
            <input
              id="fragment-name"
              type="text"
              class="form-control"
              bind:value={name}
              placeholder="e.g., Ability Score Block"
            />
          </div>

          <div class="form-group">
            <label for="fragment-description">Description</label>
            <textarea
              id="fragment-description"
              class="form-control"
              bind:value={description}
              placeholder="What does this fragment do?"
              rows="3"
            />
          </div>
        </section>

        <!-- Parameters -->
        <section class="form-section">
          <h3>Parameters</h3>
          <p class="section-description">
            Define parameters that can be customized when using this fragment.
          </p>

          <!-- Parameters List -->
          {#if parameters.length > 0}
            <div class="params-list">
              {#each parameters as param, i (i)}
                <div class="param-item">
                  <div class="param-info">
                    <div class="param-header">
                      <strong>{param.name}</strong>
                      <span class="param-type">{param.type}</span>
                    </div>
                    {#if param.description}
                      <div class="param-description">{param.description}</div>
                    {/if}
                    {#if param.default}
                      <div class="param-default">Default: {param.default}</div>
                    {/if}
                  </div>
                  <div class="param-actions">
                    <button
                      type="button"
                      class="btn-icon"
                      onclick={() => editParameter(i)}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      class="btn-icon btn-danger"
                      onclick={() => deleteParameter(i)}
                      title="Delete"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="no-params">No parameters defined yet.</p>
          {/if}

          <!-- Parameter Form -->
          <div class="param-form">
            <h4>{editingParamIndex !== null ? 'Edit Parameter' : 'Add Parameter'}</h4>

            <div class="form-row">
              <div class="form-group">
                <label for="param-name">Name</label>
                <input
                  id="param-name"
                  type="text"
                  class="form-control"
                  bind:value={newParamName}
                  placeholder="e.g., abilityName"
                />
              </div>

              <div class="form-group">
                <label for="param-type">Type</label>
                <select
                  id="param-type"
                  class="form-control"
                  bind:value={newParamType}
                >
                  <option value="binding">Binding (data path)</option>
                  <option value="literal">Literal (text value)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="param-default">Default Value</label>
              <input
                id="param-default"
                type="text"
                class="form-control"
                bind:value={newParamDefault}
                placeholder="Optional default value"
              />
            </div>

            <div class="form-group">
              <label for="param-description">Description</label>
              <input
                id="param-description"
                type="text"
                class="form-control"
                bind:value={newParamDescription}
                placeholder="What is this parameter for?"
              />
            </div>

            <div class="form-actions">
              {#if editingParamIndex !== null}
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  onclick={resetParamForm}
                >
                  Cancel
                </button>
              {/if}
              <button
                type="button"
                class="btn btn-primary btn-sm"
                onclick={saveParameter}
              >
                {editingParamIndex !== null ? 'Update' : 'Add'} Parameter
              </button>
            </div>
          </div>
        </section>

        <!-- Content Preview -->
        <section class="form-section">
          <h3>Content</h3>
          <p class="section-description">
            The fragment currently has {content.length} root node(s).
            You can edit the fragment's layout after saving.
          </p>

          <div class="content-preview">
            {#if content.length === 0}
              <p class="empty-content">No content yet. Add components after saving.</p>
            {:else}
              <div class="content-summary">
                {#each content as node}
                  <div class="node-preview">
                    {node.type}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </section>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-secondary"
          onclick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary"
          onclick={handleSave}
        >
          {fragment ? 'Save Changes' : 'Create Fragment'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Modal Overlay */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 800px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Header */
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--text-color, #212529);
  }

  .btn-close {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-muted, #6c757d);
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }

  .btn-close:hover {
    background: var(--hover-bg, #f0f0f0);
    color: var(--text-color, #212529);
  }

  /* Body */
  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  /* Error Box */
  .error-box {
    background: var(--error-bg, #f8d7da);
    color: var(--error-color, #721c24);
    border: 1px solid var(--error-border, #f5c6cb);
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .error-box ul {
    margin: 0.5rem 0 0 1.5rem;
    padding: 0;
  }

  .error-box li {
    margin: 0.25rem 0;
  }

  /* Form Sections */
  .form-section {
    margin-bottom: 2rem;
  }

  .form-section:last-child {
    margin-bottom: 0;
  }

  .form-section h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
    color: var(--text-color, #212529);
  }

  .section-description {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    color: var(--text-muted, #6c757d);
  }

  /* Form Controls */
  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color, #212529);
  }

  .required {
    color: var(--danger-bg, #dc3545);
  }

  .form-control {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .form-control:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
  }

  textarea.form-control {
    resize: vertical;
    font-family: inherit;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  /* Parameters */
  .params-list {
    margin-bottom: 1rem;
  }

  .param-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem;
    background: var(--bg-light, #f8f9fa);
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }

  .param-info {
    flex: 1;
  }

  .param-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .param-type {
    font-size: 0.75rem;
    color: white;
    background: var(--primary-color, #007bff);
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
  }

  .param-description {
    font-size: 0.875rem;
    color: var(--text-muted, #6c757d);
    margin-bottom: 0.25rem;
  }

  .param-default {
    font-size: 0.75rem;
    color: var(--text-muted, #6c757d);
    font-style: italic;
  }

  .param-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .no-params {
    text-align: center;
    padding: 1rem;
    color: var(--text-muted, #6c757d);
    font-style: italic;
  }

  /* Parameter Form */
  .param-form {
    background: var(--bg-light, #f8f9fa);
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    padding: 1rem;
  }

  .param-form h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: var(--text-color, #212529);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  /* Content Preview */
  .content-preview {
    background: var(--bg-light, #f8f9fa);
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    padding: 1rem;
    min-height: 100px;
  }

  .empty-content {
    text-align: center;
    color: var(--text-muted, #6c757d);
    font-style: italic;
    margin: 0;
  }

  .content-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .node-preview {
    background: white;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    font-family: monospace;
  }

  /* Footer */
  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color, #e0e0e0);
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
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

  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }

  .btn-primary {
    background: var(--primary-color, #007bff);
    color: white;
  }

  .btn-primary:hover {
    background: var(--primary-color-hover, #0056b3);
  }

  .btn-secondary {
    background: var(--secondary-bg, #6c757d);
    color: white;
  }

  .btn-secondary:hover {
    background: var(--secondary-bg-hover, #5a6268);
  }

  .btn-icon {
    background: transparent;
    border: none;
    padding: 0.25rem 0.5rem;
    font-size: 1rem;
    cursor: pointer;
    color: var(--text-muted, #6c757d);
    transition: color 0.2s;
  }

  .btn-icon:hover {
    color: var(--text-color, #212529);
  }

  .btn-icon.btn-danger:hover {
    color: var(--danger-bg, #dc3545);
  }

  /* Scrollbar styling */
  .modal-body::-webkit-scrollbar {
    width: 8px;
  }

  .modal-body::-webkit-scrollbar-track {
    background: var(--scrollbar-track, #f1f1f1);
  }

  .modal-body::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb, #c1c1c1);
    border-radius: 4px;
  }

  .modal-body::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover, #a8a8a8);
  }
</style>
