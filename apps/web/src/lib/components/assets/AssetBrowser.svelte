<script lang="ts">
  import { onMount } from 'svelte';
  import type { Asset, AssetType } from '@vtt/shared';
  import { assetsStore } from '$lib/stores/assets';
  import AssetUploader from './AssetUploader.svelte';

  // Props
  export let campaignId: string | undefined = undefined;
  export let selectionMode: boolean = false;
  export let allowedTypes: AssetType[] | undefined = undefined;

  // State
  let viewMode: 'grid' | 'list' = 'grid';
  let filterType: AssetType | 'all' = 'all';
  let searchQuery = '';
  let selectedAssetId: string | null = null;
  let showUploader = false;

  // Reactive assets list
  $: assets = Array.from($assetsStore.assets.values())
    .filter(asset => {
      // Filter by type
      if (filterType !== 'all' && asset.assetType !== filterType) {
        return false;
      }
      // Filter by allowed types (if in selection mode)
      if (allowedTypes && !allowedTypes.includes(asset.assetType)) {
        return false;
      }
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          asset.name?.toLowerCase().includes(query) ||
          asset.originalName.toLowerCase().includes(query) ||
          asset.description?.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Asset type options
  const assetTypes: { value: AssetType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'map', label: 'Maps' },
    { value: 'token', label: 'Tokens' },
    { value: 'portrait', label: 'Portraits' },
    { value: 'tile', label: 'Tiles' },
    { value: 'other', label: 'Other' },
  ];

  onMount(async () => {
    // Load all user assets (not filtered by campaign)
    // Assets are tied to user accounts, not campaigns
    await assetsStore.loadAssets();
  });

  function handleUpload(event: CustomEvent<Asset>) {
    showUploader = false;
  }

  function handleUploadError(event: CustomEvent<string>) {
    alert(`Upload failed: ${event.detail}`);
  }

  function handleAssetClick(asset: Asset) {
    if (selectionMode) {
      selectedAssetId = asset.id;
    }
  }

  async function handleDelete(asset: Asset) {
    if (confirm(`Are you sure you want to delete "${asset.name || asset.originalName}"?`)) {
      const success = await assetsStore.deleteAsset(asset.id);
      if (!success) {
        alert('Failed to delete asset');
      }
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  function getImageUrl(asset: Asset): string {
    return assetsStore.getThumbnailUrl(asset);
  }

  export function getSelectedAsset(): Asset | null {
    if (!selectedAssetId) return null;
    return $assetsStore.assets.get(selectedAssetId) || null;
  }
</script>

<div class="asset-browser">
  <!-- Header -->
  <div class="browser-header">
    <div class="header-left">
      <h3>Assets</h3>
      <span class="asset-count">{assets.length} items</span>
    </div>
    <div class="header-right">
      <button
        class="button-primary"
        on:click={() => (showUploader = !showUploader)}
      >
        {showUploader ? 'Hide Uploader' : 'Upload New'}
      </button>
    </div>
  </div>

  <!-- Uploader -->
  {#if showUploader}
    <div class="uploader-container">
      <AssetUploader
        assetType={filterType === 'all' ? 'other' : filterType}
        {campaignId}
        on:upload={handleUpload}
        on:error={handleUploadError}
      />
    </div>
  {/if}

  <!-- Toolbar -->
  <div class="browser-toolbar">
    <div class="toolbar-left">
      <input
        type="text"
        class="search-input"
        placeholder="Search assets..."
        bind:value={searchQuery}
      />

      <select class="filter-select" bind:value={filterType}>
        {#each assetTypes as type}
          <option value={type.value}>{type.label}</option>
        {/each}
      </select>
    </div>

    <div class="toolbar-right">
      <button
        class="view-mode-button"
        class:active={viewMode === 'grid'}
        on:click={() => (viewMode = 'grid')}
        title="Grid view"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      </button>

      <button
        class="view-mode-button"
        class:active={viewMode === 'list'}
        on:click={() => (viewMode = 'list')}
        title="List view"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      </button>
    </div>
  </div>

  <!-- Assets Display -->
  <div class="browser-content">
    {#if $assetsStore.loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading assets...</p>
      </div>
    {:else if assets.length === 0}
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p>No assets found</p>
        <button class="button-secondary" on:click={() => (showUploader = true)}>
          Upload your first asset
        </button>
      </div>
    {:else if viewMode === 'grid'}
      <div class="assets-grid">
        {#each assets as asset (asset.id)}
          <div
            class="asset-card"
            class:selected={selectedAssetId === asset.id}
            on:click={() => handleAssetClick(asset)}
            on:keydown={(e) => e.key === 'Enter' && handleAssetClick(asset)}
            role="button"
            tabindex="0"
          >
            <div class="asset-thumbnail">
              {#if asset.mimeType.startsWith('image/')}
                <img src={getImageUrl(asset)} alt={asset.name || asset.originalName} />
              {:else}
                <div class="file-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <polyline points="13 2 13 9 20 9" />
                  </svg>
                </div>
              {/if}
            </div>
            <div class="asset-info">
              <div class="asset-name" title={asset.name || asset.originalName}>
                {asset.name || asset.originalName}
              </div>
              <div class="asset-meta">
                {formatFileSize(asset.size)}
              </div>
            </div>
            {#if !selectionMode}
              <button
                class="delete-button"
                on:click|stopPropagation={() => handleDelete(asset)}
                title="Delete asset"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <div class="assets-list">
        {#each assets as asset (asset.id)}
          <div
            class="asset-row"
            class:selected={selectedAssetId === asset.id}
            on:click={() => handleAssetClick(asset)}
            on:keydown={(e) => e.key === 'Enter' && handleAssetClick(asset)}
            role="button"
            tabindex="0"
          >
            <div class="row-thumbnail">
              {#if asset.mimeType.startsWith('image/')}
                <img src={getImageUrl(asset)} alt={asset.name || asset.originalName} />
              {:else}
                <div class="file-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <polyline points="13 2 13 9 20 9" />
                  </svg>
                </div>
              {/if}
            </div>
            <div class="row-info">
              <div class="row-name">{asset.name || asset.originalName}</div>
              <div class="row-meta">
                {asset.assetType} • {formatFileSize(asset.size)} • {formatDate(asset.createdAt)}
              </div>
            </div>
            {#if !selectionMode}
              <button
                class="delete-button"
                on:click|stopPropagation={() => handleDelete(asset)}
                title="Delete asset"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .asset-browser {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--color-bg-primary, #121212);
  }

  .browser-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border, #333);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .browser-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .asset-count {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #888);
  }

  .uploader-container {
    padding: 1rem;
    border-bottom: 1px solid var(--color-border, #333);
  }

  .browser-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    gap: 1rem;
    border-bottom: 1px solid var(--color-border, #333);
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .search-input {
    flex: 1;
    max-width: 300px;
    padding: 0.5rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    background-color: var(--color-bg-secondary, #1e1e1e);
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
  }

  .search-input:focus {
    outline: none;
    border-color: #4a90e2;
  }

  .filter-select {
    padding: 0.5rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    background-color: var(--color-bg-secondary, #1e1e1e);
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    cursor: pointer;
  }

  .filter-select:focus {
    outline: none;
    border-color: #4a90e2;
  }

  .toolbar-right {
    display: flex;
    gap: 0.5rem;
  }

  .view-mode-button {
    padding: 0.5rem;
    background: none;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    color: var(--color-text-secondary, #aaa);
    cursor: pointer;
    transition: all 0.2s;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .view-mode-button svg {
    width: 1rem;
    height: 1rem;
  }

  .view-mode-button:hover {
    border-color: #4a90e2;
    color: #4a90e2;
  }

  .view-mode-button.active {
    background-color: #4a90e2;
    border-color: #4a90e2;
    color: white;
  }

  .browser-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
    color: var(--color-text-secondary, #888);
  }

  .empty-state svg {
    width: 64px;
    height: 64px;
    opacity: 0.5;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--color-border, #333);
    border-top-color: #4a90e2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .assets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .asset-card {
    position: relative;
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
    background-color: var(--color-bg-secondary, #1e1e1e);
  }

  .asset-card:hover {
    border-color: #4a90e2;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .asset-card.selected {
    border-color: #4a90e2;
    box-shadow: 0 0 0 2px #4a90e2;
  }

  .asset-thumbnail {
    width: 100%;
    aspect-ratio: 1;
    background-color: var(--color-bg-primary, #121212);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .asset-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .file-icon {
    width: 48px;
    height: 48px;
    color: var(--color-text-secondary, #666);
  }

  .file-icon svg {
    width: 100%;
    height: 100%;
  }

  .asset-info {
    padding: 0.75rem;
  }

  .asset-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary, #ffffff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .asset-meta {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #888);
    margin-top: 0.25rem;
  }

  .delete-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 2rem;
    height: 2rem;
    padding: 0.25rem;
    background-color: rgba(0, 0, 0, 0.7);
    border: none;
    border-radius: 4px;
    color: #ef4444;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .asset-card:hover .delete-button,
  .asset-row:hover .delete-button {
    opacity: 1;
  }

  .delete-button:hover {
    background-color: #ef4444;
    color: white;
  }

  .delete-button svg {
    width: 100%;
    height: 100%;
  }

  .assets-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .asset-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background-color: var(--color-bg-secondary, #1e1e1e);
  }

  .asset-row:hover {
    border-color: #4a90e2;
    background-color: rgba(74, 144, 226, 0.05);
  }

  .asset-row.selected {
    border-color: #4a90e2;
    background-color: rgba(74, 144, 226, 0.1);
  }

  .row-thumbnail {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: 4px;
    overflow: hidden;
    background-color: var(--color-bg-primary, #121212);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .row-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .row-thumbnail .file-icon {
    width: 24px;
    height: 24px;
  }

  .row-info {
    flex: 1;
    min-width: 0;
  }

  .row-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary, #ffffff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .row-meta {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #888);
    margin-top: 0.25rem;
  }

  .asset-row .delete-button {
    position: static;
    margin-left: auto;
  }

  button {
    transition: all 0.2s;
  }

  .button-primary {
    padding: 0.5rem 1rem;
    background-color: #4a90e2;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
  }

  .button-primary:hover {
    background-color: #357abd;
  }

  .button-secondary {
    padding: 0.5rem 1rem;
    background-color: transparent;
    color: var(--color-text-secondary, #aaa);
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
  }

  .button-secondary:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }
</style>
