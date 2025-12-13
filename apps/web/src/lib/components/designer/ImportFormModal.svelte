<script lang="ts">
  import type { FormExport, FormImportValidation } from '@vtt/shared';
  import { formsStore } from '$lib/stores/forms';
  import { createEventDispatcher } from 'svelte';

  interface Props {
    gameSystemId: string;
    isOpen: boolean;
  }

  let { gameSystemId, isOpen = $bindable() }: Props = $props();

  const dispatch = createEventDispatcher();

  let fileInput: HTMLInputElement | undefined;
  let formData: FormExport | null = $state(null);
  let validation: FormImportValidation | null = $state(null);
  let error: string | null = $state(null);
  let importing = $state(false);
  let conflictResolution = $state<{
    nameConflict?: 'rename' | 'replace';
    fragmentConflict?: 'regenerate' | 'keep';
  }>({
    nameConflict: 'rename',
    fragmentConflict: 'regenerate',
  });

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        formData = JSON.parse(content);
        error = null;
        validation = null;
      } catch (err) {
        error = 'Invalid JSON file';
        formData = null;
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!formData) return;

    importing = true;
    error = null;

    try {
      const result = await formsStore.importForm(gameSystemId, {
        formData,
        conflictResolution,
      });

      validation = result.validation;

      if (result.validation.valid) {
        dispatch('imported', result.form);
        handleClose();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to import form';
    } finally {
      importing = false;
    }
  }

  function handleClose() {
    isOpen = false;
    formData = null;
    validation = null;
    error = null;
    if (fileInput) {
      fileInput.value = '';
    }
  }
</script>

{#if isOpen}
  <div class="modal-overlay" onclick={handleClose} role="dialog" aria-modal="true">
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>Import Form</h2>
        <button class="close-btn" onclick={handleClose} aria-label="Close">&times;</button>
      </div>

      <div class="modal-body">
        {#if !formData}
          <div class="file-upload">
            <input
              bind:this={fileInput}
              type="file"
              accept=".json"
              onchange={handleFileSelect}
              class="file-input"
              id="form-file-input"
            />
            <label for="form-file-input" class="file-label">
              <i class="fas fa-upload"></i>
              Choose JSON file to import
            </label>
          </div>
        {:else}
          <div class="form-preview">
            <h3>Form Details</h3>
            <dl>
              <dt>Name:</dt>
              <dd>{formData.form.name}</dd>

              <dt>Entity Type:</dt>
              <dd>{formData.form.entityType}</dd>

              <dt>Version:</dt>
              <dd>{formData.form.version}</dd>

              {#if formData.form.description}
                <dt>Description:</dt>
                <dd>{formData.form.description}</dd>
              {/if}

              <dt>Exported:</dt>
              <dd>{new Date(formData.exportedAt).toLocaleString()}</dd>
            </dl>

            {#if formData.form.gameSystemId && formData.form.gameSystemId !== gameSystemId}
              <div class="warning">
                <i class="fas fa-exclamation-triangle"></i>
                This form was created for a different game system ({formData.form.gameSystemId})
              </div>
            {/if}

            <div class="conflict-resolution">
              <h4>Conflict Resolution</h4>

              <label>
                <span>If name exists:</span>
                <select bind:value={conflictResolution.nameConflict}>
                  <option value="rename">Rename (add "Imported" suffix)</option>
                  <option value="replace">Replace existing</option>
                </select>
              </label>

              <label>
                <span>Fragment IDs:</span>
                <select bind:value={conflictResolution.fragmentConflict}>
                  <option value="regenerate">Regenerate all IDs</option>
                  <option value="keep">Keep original IDs</option>
                </select>
              </label>
            </div>

            {#if validation}
              {#if validation.warnings.length > 0}
                <div class="warnings">
                  <h4>Warnings</h4>
                  <ul>
                    {#each validation.warnings as warning}
                      <li>{warning}</li>
                    {/each}
                  </ul>
                </div>
              {/if}

              {#if validation.errors.length > 0}
                <div class="errors">
                  <h4>Errors</h4>
                  <ul>
                    {#each validation.errors as validationError}
                      <li>{validationError}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
            {/if}

            {#if error}
              <div class="error-message">{error}</div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={handleClose}>
          Cancel
        </button>
        {#if formData}
          <button
            class="btn btn-primary"
            onclick={handleImport}
            disabled={importing}
          >
            {#if importing}
              <i class="fas fa-spinner fa-spin"></i>
              Importing...
            {:else}
              <i class="fas fa-file-import"></i>
              Import Form
            {/if}
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
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
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #64748b;
  }

  .close-btn:hover {
    color: #334155;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .file-upload {
    text-align: center;
    padding: 3rem 1rem;
  }

  .file-input {
    display: none;
  }

  .file-label {
    display: inline-block;
    padding: 1rem 2rem;
    background: #3b82f6;
    color: white;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .file-label:hover {
    background: #2563eb;
  }

  .form-preview h3 {
    margin-top: 0;
    margin-bottom: 1rem;
  }

  .form-preview dl {
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .form-preview dt {
    font-weight: 600;
    color: #64748b;
  }

  .form-preview dd {
    margin: 0;
  }

  .warning {
    padding: 1rem;
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
    margin: 1rem 0;
    border-radius: 4px;
  }

  .warning i {
    margin-right: 0.5rem;
  }

  .conflict-resolution {
    background: #f8fafc;
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
  }

  .conflict-resolution h4 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1rem;
  }

  .conflict-resolution label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .conflict-resolution select {
    padding: 0.5rem;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
  }

  .warnings, .errors {
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
  }

  .warnings {
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
  }

  .errors {
    background: #fee2e2;
    border-left: 4px solid #ef4444;
  }

  .warnings h4, .errors h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
  }

  .warnings ul, .errors ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .error-message {
    padding: 1rem;
    background: #fee2e2;
    color: #b91c1c;
    border-radius: 8px;
    margin-top: 1rem;
  }

  .modal-footer {
    padding: 1.5rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-secondary {
    background: #e2e8f0;
    color: #475569;
  }

  .btn-secondary:hover {
    background: #cbd5e1;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
