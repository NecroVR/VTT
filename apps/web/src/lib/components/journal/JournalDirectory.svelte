<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { journalsStore } from '$lib/stores/journals';
  import type { Journal, Folder } from '@vtt/shared';
  import FolderTree from '../folder/FolderTree.svelte';

  // Props
  export let gameId: string;
  export let isGM: boolean = false;
  export let onJournalSelect: ((journalId: string) => void) | null = null;

  // State
  let journals: Journal[] = [];
  let folders: Folder[] = [];
  let selectedFolderId: string | null = null;
  let expandedFolders = new Set<string>();
  let loading = false;

  // Subscribe to store
  const unsubscribe = journalsStore.subscribe(state => {
    journals = Array.from(state.journals.values());
    folders = Array.from(state.folders.values());
    loading = state.loading;
  });

  onMount(() => {
    loadData();
  });

  onDestroy(() => {
    unsubscribe();
  });

  async function loadData() {
    await Promise.all([
      journalsStore.loadJournals(gameId),
      journalsStore.loadFolders(gameId, 'journal'),
    ]);
  }

  function handleFolderSelect(event: CustomEvent<string | null>) {
    selectedFolderId = event.detail;
  }

  function handleFolderToggle(event: CustomEvent<string>) {
    const folderId = event.detail;
    if (expandedFolders.has(folderId)) {
      expandedFolders.delete(folderId);
    } else {
      expandedFolders.add(folderId);
    }
    expandedFolders = new Set(expandedFolders);
  }

  function handleJournalClick(journalId: string) {
    if (onJournalSelect) {
      onJournalSelect(journalId);
    }
  }

  function handleJournalContextMenu(journalId: string, event: MouseEvent) {
    event.preventDefault();
    // TODO: Implement context menu for journal actions (edit, delete)
    console.log('Context menu for journal:', journalId);
  }

  function handleFolderContextMenu(event: CustomEvent<{ folderId: string; event: MouseEvent }>) {
    event.detail.event.preventDefault();
    // TODO: Implement context menu for folder actions (create, edit, delete)
    console.log('Context menu for folder:', event.detail.folderId);
  }

  // Get journals in current selected folder or root
  $: displayedJournals = journals
    .filter(j => j.folderId === selectedFolderId)
    .sort((a, b) => a.sort - b.sort);

  // Get root folders
  $: rootFolders = folders.filter(f => f.parentId === null);
</script>

<div class="journal-directory">
  <div class="directory-header">
    <h3>Journals</h3>
    {#if isGM}
      <button class="create-button" on:click={() => console.log('Create journal')} title="Create Journal">
        +
      </button>
    {/if}
  </div>

  <div class="directory-content">
    {#if loading}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading journals...</p>
      </div>
    {:else}
      <!-- Folders -->
      {#if rootFolders.length > 0}
        <div class="folders-section">
          <FolderTree
            folders={rootFolders}
            {selectedFolderId}
            {expandedFolders}
            on:select={handleFolderSelect}
            on:toggle={handleFolderToggle}
            on:contextmenu={handleFolderContextMenu}
          />
        </div>
      {/if}

      <!-- Journals in selected folder -->
      <div class="journals-section">
        {#if displayedJournals.length === 0}
          <div class="no-journals">
            <p>No journals in this folder</p>
          </div>
        {:else}
          {#each displayedJournals as journal (journal.id)}
            <button
              class="journal-item"
              on:click={() => handleJournalClick(journal.id)}
              on:contextmenu={(e) => handleJournalContextMenu(journal.id, e)}
            >
              {#if journal.img}
                <img src={journal.img} alt={journal.name} class="journal-icon" />
              {:else}
                <span class="journal-icon-placeholder">📖</span>
              {/if}
              <span class="journal-name">{journal.name}</span>
            </button>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .journal-directory {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--color-bg-secondary, #1e1e1e);
    border-right: 1px solid var(--color-border, #333);
  }

  .directory-header {
    padding: 1rem;
    border-bottom: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--color-bg-primary, #121212);
  }

  .directory-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .create-button {
    width: 28px;
    height: 28px;
    padding: 0;
    background-color: #4a90e2;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .create-button:hover {
    background-color: #357abd;
  }

  .create-button:active {
    transform: scale(0.95);
  }

  .directory-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .directory-content::-webkit-scrollbar {
    width: 8px;
  }

  .directory-content::-webkit-scrollbar-track {
    background: var(--color-bg-secondary, #1e1e1e);
  }

  .directory-content::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
  }

  .directory-content::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    gap: 1rem;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #374151;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-state p {
    color: var(--color-text-secondary, #9ca3af);
    font-size: 0.875rem;
  }

  .folders-section {
    margin-bottom: 0.5rem;
  }

  .journals-section {
    margin-top: 0.5rem;
  }

  .no-journals {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--color-text-secondary, #9ca3af);
    font-size: 0.875rem;
  }

  .journal-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: background-color 0.15s;
    text-align: left;
    margin-bottom: 0.125rem;
  }

  .journal-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .journal-icon {
    width: 24px;
    height: 24px;
    object-fit: cover;
    border-radius: 0.25rem;
    flex-shrink: 0;
  }

  .journal-icon-placeholder {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
  }

  .journal-name {
    flex: 1;
    font-size: 0.875rem;
    color: var(--color-text-primary, #f9fafb);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
