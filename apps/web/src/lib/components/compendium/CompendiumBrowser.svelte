<script lang="ts">
  import { onMount } from 'svelte';
  import { compendiumsStore } from '$lib/stores/compendiums';
  import type { Compendium, CompendiumEntry, CompendiumEntityType } from '@vtt/shared';
  import CompendiumList from './CompendiumList.svelte';
  import CompendiumEntryList from './CompendiumEntryList.svelte';
  import CompendiumEntrySheet from './CompendiumEntrySheet.svelte';
  import CompendiumConfig from './CompendiumConfig.svelte';
  import CompendiumImport from './CompendiumImport.svelte';

  export let gameId: string;
  export let isGM: boolean = false;
  export let isOpen: boolean = false;
  export let fullPage: boolean = false;

  // State
  let searchQuery = '';
  let viewMode: 'grid' | 'list' = 'grid';
  let filterEntityType: CompendiumEntityType | 'all' = 'all';
  let selectedEntry: CompendiumEntry | null = null;
  let showEntrySheet = false;
  let showCompendiumConfig = false;
  let showImport = false;
  let compendiumToEdit: Compendium | null = null;

  // Reactive data
  $: compendiums = Array.from($compendiumsStore.compendiums.values());
  $: entries = Array.from($compendiumsStore.entries.values());
  $: selectedCompendiumId = $compendiumsStore.selectedCompendiumId;
  $: selectedCompendium = selectedCompendiumId
    ? $compendiumsStore.compendiums.get(selectedCompendiumId)
    : null;

  // Filter compendiums by entity type
  $: filteredCompendiums = filterEntityType === 'all'
    ? compendiums
    : compendiums.filter(c => c.entityType === filterEntityType);

  onMount(async () => {
    await compendiumsStore.loadCompendiums();
  });

  async function handleCompendiumSelect(event: CustomEvent<string>) {
    const compendiumId = event.detail;
    compendiumsStore.selectCompendium(compendiumId);
    await compendiumsStore.loadEntries(compendiumId);
  }

  function handleCreateCompendium() {
    compendiumToEdit = null;
    showCompendiumConfig = true;
  }

  function handleEditCompendium() {
    if (selectedCompendium) {
      compendiumToEdit = selectedCompendium;
      showCompendiumConfig = true;
    }
  }

  async function handleDeleteCompendium() {
    if (!selectedCompendium) return;

    if (confirm(`Are you sure you want to delete "${selectedCompendium.label}"?`)) {
      const success = await compendiumsStore.deleteCompendium(selectedCompendium.id);
      if (!success) {
        alert('Failed to delete compendium');
      }
    }
  }

  function handleCompendiumConfigClose() {
    showCompendiumConfig = false;
    compendiumToEdit = null;
  }

  function handleCompendiumCreated(event: CustomEvent<Compendium>) {
    // Automatically select the new compendium
    compendiumsStore.selectCompendium(event.detail.id);
    compendiumsStore.loadEntries(event.detail.id);
  }

  function handleEntrySelect(event: CustomEvent<CompendiumEntry>) {
    selectedEntry = event.detail;
    showEntrySheet = true;
  }

  function handleEntryInstantiate(event: CustomEvent<CompendiumEntry>) {
    selectedEntry = event.detail;
    showEntrySheet = true;
  }

  function handleEntrySheetClose() {
    showEntrySheet = false;
    selectedEntry = null;
  }

  function handleImportClick() {
    if (selectedCompendiumId) {
      showImport = true;
    }
  }

  function handleImportClose() {
    showImport = false;
  }

  async function handleImported() {
    // Reload entries after import
    if (selectedCompendiumId) {
      await compendiumsStore.loadEntries(selectedCompendiumId);
    }
  }

  async function handleExportClick() {
    if (!selectedCompendiumId) return;

    const exportData = await compendiumsStore.exportCompendium(selectedCompendiumId);
    if (exportData) {
      // Create download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedCompendium?.name || 'compendium'}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert('Failed to export compendium');
    }
  }

  function handleClose() {
    isOpen = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !showEntrySheet && !showCompendiumConfig && !showImport) {
      handleClose();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div
    class="browser-wrapper"
    class:modal={!fullPage}
    class:fullpage={fullPage}
    on:click={fullPage ? undefined : handleBackdropClick}
  >
    <div class="browser-container" class:fullpage={fullPage} on:click|stopPropagation>
      {#if !fullPage}
        <header class="browser-header">
          <h1>Compendium Browser</h1>
          <button class="close-button" on:click={handleClose} aria-label="Close">
            &times;
          </button>
        </header>
      {/if}

      <div class="browser-toolbar">
        <div class="toolbar-left">
          <input
            type="text"
            class="search-input"
            placeholder="Search entries..."
            bind:value={searchQuery}
          />

          <select class="filter-select" bind:value={filterEntityType}>
            <option value="all">All Types</option>
            <option value="Actor">Actors</option>
            <option value="Item">Items</option>
            <option value="JournalEntry">Journal Entries</option>
            <option value="Scene">Scenes</option>
          </select>
        </div>

        <div class="toolbar-right">
          {#if isGM && selectedCompendiumId}
            <button
              class="toolbar-button"
              on:click={handleImportClick}
              title="Import Data"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Import
            </button>

            <button
              class="toolbar-button"
              on:click={handleExportClick}
              title="Export Data"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>

            <button
              class="toolbar-button"
              on:click={handleEditCompendium}
              title="Edit Compendium"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>

            <button
              class="toolbar-button danger"
              on:click={handleDeleteCompendium}
              title="Delete Compendium"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Delete
            </button>
          {/if}

          <div class="view-mode-toggle">
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
      </div>

      <div class="browser-content">
        <div class="sidebar">
          <CompendiumList
            compendiums={filteredCompendiums}
            {selectedCompendiumId}
            {isGM}
            on:select={handleCompendiumSelect}
            on:create={handleCreateCompendium}
          />
        </div>

        <div class="main-area">
          {#if !selectedCompendiumId}
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <p>Select a compendium to view its contents</p>
            </div>
          {:else}
            <CompendiumEntryList
              {entries}
              selectedEntryId={selectedEntry?.id || null}
              loading={$compendiumsStore.loading}
              {viewMode}
              {searchQuery}
              on:select={handleEntrySelect}
              on:instantiate={handleEntryInstantiate}
            />
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Modals -->
{#if showEntrySheet && selectedEntry}
  <CompendiumEntrySheet
    entry={selectedEntry}
    {gameId}
    {isGM}
    isLocked={selectedCompendium?.locked || false}
    on:close={handleEntrySheetClose}
  />
{/if}

{#if showCompendiumConfig}
  <CompendiumConfig
    compendium={compendiumToEdit}
    {gameId}
    on:close={handleCompendiumConfigClose}
    on:created={handleCompendiumCreated}
  />
{/if}

{#if showImport && selectedCompendiumId}
  <CompendiumImport
    compendiumId={selectedCompendiumId}
    on:close={handleImportClose}
    on:imported={handleImported}
  />
{/if}

<style>
  .browser-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 900;
  }

  .browser-wrapper.modal {
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .browser-wrapper.fullpage {
    background-color: var(--color-bg-primary, #1a1a1a);
  }

  .browser-container {
    background-color: var(--color-bg-primary, #1a1a1a);
    border-radius: 8px;
    width: 100%;
    max-width: 1400px;
    height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .browser-container.fullpage {
    max-width: none;
    height: 100vh;
    border-radius: 0;
  }

  .browser-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .browser-header h1 {
    margin: 0;
    font-size: 1.75rem;
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

  .browser-toolbar {
    padding: 1rem;
    border-bottom: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    background-color: var(--color-bg-secondary, #2d2d2d);
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
    background-color: var(--color-bg-primary, #121212);
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
    background-color: var(--color-bg-primary, #121212);
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
    align-items: center;
    gap: 0.5rem;
  }

  .toolbar-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background-color: transparent;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    color: var(--color-text-secondary, #aaa);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toolbar-button:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
    border-color: #4a90e2;
  }

  .toolbar-button.danger:hover {
    border-color: #ef4444;
    color: #ef4444;
  }

  .toolbar-button svg {
    width: 1rem;
    height: 1rem;
  }

  .view-mode-toggle {
    display: flex;
    gap: 0.25rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    padding: 0.125rem;
  }

  .view-mode-button {
    padding: 0.5rem;
    background: none;
    border: none;
    border-radius: 3px;
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
    color: #4a90e2;
  }

  .view-mode-button.active {
    background-color: #4a90e2;
    color: white;
  }

  .browser-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .sidebar {
    width: 280px;
    flex-shrink: 0;
    overflow-y: auto;
  }

  .main-area {
    flex: 1;
    overflow-y: auto;
    background-color: var(--color-bg-primary, #1a1a1a);
  }

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

  @media (max-width: 1024px) {
    .sidebar {
      width: 240px;
    }

    .toolbar-button span {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .browser-wrapper.modal {
      padding: 0;
    }

    .browser-container {
      height: 100vh;
      border-radius: 0;
    }

    .browser-content {
      flex-direction: column;
    }

    .sidebar {
      width: 100%;
      max-height: 200px;
    }
  }
</style>
