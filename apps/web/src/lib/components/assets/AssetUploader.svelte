<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Asset, AssetType } from '@vtt/shared';
  import { assetsStore } from '$lib/stores/assets';

  // Props
  export let assetType: AssetType = 'other';
  export let gameId: string | undefined = undefined;
  export let maxSizeMB: number = 10;

  const dispatch = createEventDispatcher<{
    upload: Asset;
    error: string;
  }>();

  // State
  let isDragging = false;
  let isUploading = false;
  let uploadProgress = 0;
  let fileInput: HTMLInputElement;

  // Accepted file types by asset type
  const acceptedTypes: Record<AssetType, string> = {
    map: 'image/*',
    token: 'image/*',
    portrait: 'image/*',
    tile: 'image/*',
    other: '*/*',
  };

  function handleDragEnter(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  }

  function handleClick() {
    fileInput.click();
  }

  function handleFileInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }

  async function handleFile(file: File) {
    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const error = `File size exceeds ${maxSizeMB}MB limit`;
      dispatch('error', error);
      return;
    }

    // Validate file type for images
    if (assetType !== 'other' && !file.type.startsWith('image/')) {
      const error = 'Only image files are allowed for this asset type';
      dispatch('error', error);
      return;
    }

    isUploading = true;
    uploadProgress = 0;

    try {
      // Simulate progress (in a real app, you'd track actual upload progress)
      const progressInterval = setInterval(() => {
        uploadProgress = Math.min(uploadProgress + 10, 90);
      }, 100);

      const asset = await assetsStore.uploadAsset(file, {
        assetType,
        gameId,
        name: file.name,
      });

      clearInterval(progressInterval);
      uploadProgress = 100;

      if (asset) {
        dispatch('upload', asset);
      } else {
        dispatch('error', 'Upload failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      dispatch('error', message);
    } finally {
      isUploading = false;
      uploadProgress = 0;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }
</script>

<div
  class="uploader"
  class:dragging={isDragging}
  class:uploading={isUploading}
  on:dragenter={handleDragEnter}
  on:dragleave={handleDragLeave}
  on:dragover={handleDragOver}
  on:drop={handleDrop}
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabindex="0"
>
  <input
    bind:this={fileInput}
    type="file"
    accept={acceptedTypes[assetType]}
    on:change={handleFileInputChange}
    style="display: none;"
  />

  {#if isUploading}
    <div class="upload-progress">
      <div class="progress-icon">
        <svg class="spinner" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke-width="2" />
        </svg>
      </div>
      <div class="progress-text">Uploading...</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: {uploadProgress}%"></div>
      </div>
      <div class="progress-percentage">{uploadProgress}%</div>
    </div>
  {:else}
    <div class="upload-prompt">
      <div class="upload-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div class="upload-text">
        <strong>Drop files here</strong> or click to browse
      </div>
      <div class="upload-hint">
        {#if assetType === 'other'}
          Maximum file size: {maxSizeMB}MB
        {:else}
          Images only, max {maxSizeMB}MB
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .uploader {
    border: 2px dashed var(--color-border, #444);
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: var(--color-bg-primary, #121212);
  }

  .uploader:hover {
    border-color: #4a90e2;
    background-color: rgba(74, 144, 226, 0.05);
  }

  .uploader.dragging {
    border-color: #4a90e2;
    background-color: rgba(74, 144, 226, 0.1);
    transform: scale(1.02);
  }

  .uploader.uploading {
    cursor: not-allowed;
    border-color: var(--color-border, #444);
  }

  .upload-prompt,
  .upload-progress {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .upload-icon {
    width: 48px;
    height: 48px;
    color: var(--color-text-secondary, #aaa);
  }

  .upload-icon svg {
    width: 100%;
    height: 100%;
  }

  .upload-text {
    font-size: 1rem;
    color: var(--color-text-primary, #ffffff);
  }

  .upload-text strong {
    color: #4a90e2;
  }

  .upload-hint {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #888);
  }

  .progress-icon {
    width: 48px;
    height: 48px;
  }

  .spinner {
    width: 100%;
    height: 100%;
    animation: spin 1s linear infinite;
  }

  .spinner circle {
    fill: none;
    stroke: #4a90e2;
    stroke-dasharray: 50;
    stroke-dashoffset: 25;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .progress-text {
    font-size: 1rem;
    color: var(--color-text-primary, #ffffff);
    font-weight: 500;
  }

  .progress-bar {
    width: 100%;
    max-width: 300px;
    height: 8px;
    background-color: var(--color-bg-secondary, #1e1e1e);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background-color: #4a90e2;
    transition: width 0.3s ease;
  }

  .progress-percentage {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #aaa);
    font-weight: 500;
  }
</style>
