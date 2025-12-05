<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CompendiumImportData } from '@vtt/shared';
  import { compendiumsStore } from '$lib/stores/compendiums';

  export let compendiumId: string;

  const dispatch = createEventDispatcher<{
    close: void;
    imported: void;
  }>();

  let isImporting = false;
  let importData: CompendiumImportData | null = null;
  let fileInput: HTMLInputElement;
  let dragActive = false;
  let error: string | null = null;

  function handleClose() {
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragActive = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dragActive = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragActive = false;

    const file = event.dataTransfer?.files[0];
    if (file) {
      processFile(file);
    }
  }

  async function processFile(file: File) {
    error = null;

    if (!file.name.endsWith('.json')) {
      error = 'Please select a JSON file';
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text) as CompendiumImportData;

      // Validate the import data
      if (!data.name || !data.label || !data.entityType || !Array.isArray(data.entries)) {
        error = 'Invalid compendium data format';
        return;
      }

      importData = data;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to parse JSON file';
      importData = null;
    }
  }

  async function handleImport() {
    if (!importData) return;

    isImporting = true;
    error = null;

    const success = await compendiumsStore.importEntries(compendiumId, importData);

    isImporting = false;

    if (success) {
      dispatch('imported');
      handleClose();
    } else {
      error = $compendiumsStore.error || 'Failed to import entries';
    }
  }

  function handleBrowseClick() {
    fileInput.click();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-backdrop" on:click={handleBackdropClick}>
  <div class="modal-content" on:click|stopPropagation>
    <header class="modal-header">
      <h2>Import Compendium Data</h2>
      <button class="close-button" on:click={handleClose} aria-label="Close">
        &times;
      </button>
    </header>

    <div class="modal-body">
      {#if !importData}
        <div
          class="file-dropzone"
          class:drag-active={dragActive}
          on:dragover={handleDragOver}
          on:dragleave={handleDragLeave}
          on:drop={handleDrop}
          on:click={handleBrowseClick}
          role="button"
          tabindex="0"
          on:keydown={(e) => e.key === 'Enter' && handleBrowseClick()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p class="dropzone-text">
            Drag and drop a JSON file here, or click to browse
          </p>
          <p class="dropzone-hint">
            File must contain compendium entries in the correct format
          </p>
        </div>

        <input
          bind:this={fileInput}
          type="file"
          accept=".json"
          on:change={handleFileSelect}
          style="display: none;"
        />
      {:else}
        <div class="import-preview">
          <div class="preview-header">
            <h3>Import Preview</h3>
            <button
              class="button-link"
              on:click={() => { importData = null; error = null; }}
            >
              Choose different file
            </button>
          </div>

          <div class="preview-details">
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">{importData.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Label:</span>
              <span class="detail-value">{importData.label}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Type:</span>
              <span class="detail-value">{importData.entityType}</span>
            </div>
            {#if importData.system}
              <div class="detail-row">
                <span class="detail-label">System:</span>
                <span class="detail-value">{importData.system}</span>
              </div>
            {/if}
            <div class="detail-row">
              <span class="detail-label">Entries:</span>
              <span class="detail-value">{importData.entries.length}</span>
            </div>
          </div>

          <div class="entry-list-preview">
            <h4>Entries to Import:</h4>
            <div class="entry-items">
              {#each importData.entries.slice(0, 10) as entry}
                <div class="entry-item">
                  {entry.name}
                </div>
              {/each}
              {#if importData.entries.length > 10}
                <div class="entry-item more">
                  And {importData.entries.length - 10} more...
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      {#if error}
        <div class="error-message">
          {error}
        </div>
      {/if}
    </div>

    <footer class="modal-footer">
      <div class="footer-left"></div>
      <div class="footer-right">
        <button class="button-secondary" on:click={handleClose} disabled={isImporting}>
          Cancel
        </button>
        <button
          class="button-primary"
          on:click={handleImport}
          disabled={!importData || isImporting}
        >
          {isImporting ? 'Importing...' : 'Import'}
        </button>
      </div>
    </footer>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
  }

  .modal-content {
    background-color: var(--color-bg-secondary, #1e1e1e);
    border-radius: 8px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .close-button {
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    color: var(--color-text-secondary, #aaa);
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s, color 0.2s;
  }

  .close-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary, #ffffff);
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .file-dropzone {
    border: 2px dashed var(--color-border, #333);
    border-radius: 8px;
    padding: 3rem 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .file-dropzone:hover,
  .file-dropzone.drag-active {
    border-color: #4a90e2;
    background-color: rgba(74, 144, 226, 0.05);
  }

  .file-dropzone svg {
    width: 64px;
    height: 64px;
    margin: 0 auto;
    color: var(--color-text-secondary, #666);
  }

  .dropzone-text {
    margin-top: 1rem;
    font-size: 1rem;
    color: var(--color-text-primary, #ffffff);
  }

  .dropzone-hint {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text-secondary, #666);
  }

  .import-preview {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .preview-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .button-link {
    background: none;
    border: none;
    color: #4a90e2;
    font-size: 0.875rem;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
  }

  .button-link:hover {
    color: #357abd;
  }

  .preview-details {
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    padding: 1rem;
  }

  .detail-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-border, #333);
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .detail-label {
    font-weight: 600;
    color: var(--color-text-secondary, #aaa);
    min-width: 100px;
  }

  .detail-value {
    color: var(--color-text-primary, #ffffff);
  }

  .entry-list-preview h4 {
    margin: 0 0 0.75rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .entry-items {
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    padding: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
  }

  .entry-item {
    padding: 0.5rem;
    border-bottom: 1px solid var(--color-border, #333);
    font-size: 0.875rem;
    color: var(--color-text-primary, #ffffff);
  }

  .entry-item:last-child {
    border-bottom: none;
  }

  .entry-item.more {
    font-style: italic;
    color: var(--color-text-secondary, #666);
  }

  .error-message {
    margin-top: 1rem;
    padding: 0.75rem;
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    border-radius: 4px;
    color: #ef4444;
    font-size: 0.875rem;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
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

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-primary {
    background-color: #4a90e2;
    color: white;
  }

  .button-primary:hover:not(:disabled) {
    background-color: #357abd;
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

  @media (max-width: 640px) {
    .modal-backdrop {
      padding: 0;
    }

    .modal-content {
      max-height: 100vh;
      border-radius: 0;
    }
  }
</style>
