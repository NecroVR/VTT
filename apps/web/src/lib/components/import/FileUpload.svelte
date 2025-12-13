<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let loading = false;
  export let error: string | null = null;

  const dispatch = createEventDispatcher<{
    fileSelected: File;
  }>();

  let dragActive = false;
  let fileInput: HTMLInputElement;
  let selectedFile: File | null = null;

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

  function processFile(file: File) {
    const validTypes = ['application/json', 'application/zip', 'application/x-zip-compressed'];
    const validExtensions = ['.json', '.zip'];
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      error = 'Please select a JSON or ZIP file';
      selectedFile = null;
      return;
    }

    error = null;
    selectedFile = file;
    dispatch('fileSelected', file);
  }

  function handleBrowseClick() {
    fileInput.click();
  }

  function handleClearFile() {
    selectedFile = null;
    error = null;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
</script>

<div class="file-upload">
  {#if !selectedFile}
    <div
      class="file-dropzone"
      class:drag-active={dragActive}
      class:loading
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
      on:drop={handleDrop}
      on:click={handleBrowseClick}
      role="button"
      tabindex="0"
      on:keydown={(e) => e.key === 'Enter' && handleBrowseClick()}
    >
      {#if loading}
        <div class="spinner"></div>
        <p class="dropzone-text">Uploading...</p>
      {:else}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p class="dropzone-text">
          Drag and drop a Foundry VTT export file here, or click to browse
        </p>
        <p class="dropzone-hint">
          Accepts .json or .zip files (max 50MB)
        </p>
      {/if}
    </div>

    <input
      bind:this={fileInput}
      type="file"
      accept=".json,.zip,application/json,application/zip"
      on:change={handleFileSelect}
      style="display: none;"
      disabled={loading}
    />
  {:else}
    <div class="file-info">
      <div class="file-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
        </svg>
      </div>
      <div class="file-details">
        <div class="file-name">{selectedFile.name}</div>
        <div class="file-size">{formatFileSize(selectedFile.size)}</div>
      </div>
      <button
        class="clear-button"
        on:click={handleClearFile}
        disabled={loading}
        aria-label="Clear file"
      >
        &times;
      </button>
    </div>
  {/if}

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}
</div>

<style>
  .file-upload {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .file-dropzone {
    border: 2px dashed var(--color-border, #333);
    border-radius: 8px;
    padding: 3rem 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background-color: var(--color-bg-primary, #121212);
  }

  .file-dropzone:hover:not(.loading),
  .file-dropzone.drag-active {
    border-color: #4a90e2;
    background-color: rgba(74, 144, 226, 0.05);
  }

  .file-dropzone.loading {
    cursor: wait;
    opacity: 0.7;
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

  .spinner {
    width: 64px;
    height: 64px;
    margin: 0 auto;
    border: 4px solid var(--color-border, #333);
    border-top-color: #4a90e2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .file-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
  }

  .file-icon {
    flex-shrink: 0;
  }

  .file-icon svg {
    width: 48px;
    height: 48px;
    color: #4a90e2;
  }

  .file-details {
    flex: 1;
    min-width: 0;
  }

  .file-name {
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-text-primary, #ffffff);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-size {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #666);
    margin-top: 0.25rem;
  }

  .clear-button {
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
    flex-shrink: 0;
  }

  .clear-button:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary, #ffffff);
  }

  .clear-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error-message {
    padding: 0.75rem;
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    border-radius: 4px;
    color: #ef4444;
    font-size: 0.875rem;
  }
</style>
