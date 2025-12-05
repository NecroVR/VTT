<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { Journal, JournalPage } from '@vtt/shared';
  import { journalsStore } from '$lib/stores/journals';
  import { API_BASE_URL } from '$lib/config/api';
  import JournalPageComponent from './JournalPage.svelte';

  // Props
  export let isOpen: boolean;
  export let journalId: string | null;
  export let campaignId: string;
  export let isGM: boolean = false;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  // State
  let journal: Journal | null = null;
  let pages: JournalPage[] = [];
  let selectedPageId: string | null = null;
  let editMode = false;
  let loading = false;
  let error: string | null = null;

  // Reactive page selection
  $: selectedPage = pages.find(p => p.id === selectedPageId) || null;

  onMount(() => {
    if (journalId) {
      loadJournal();
    }
  });

  // Reload when journal changes
  $: if (journalId && isOpen) {
    loadJournal();
  }

  async function loadJournal() {
    if (!journalId) return;

    loading = true;
    error = null;

    try {
      const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Load journal
      const journalResponse = await fetch(`${API_BASE_URL}/api/v1/journals/${journalId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!journalResponse.ok) {
        throw new Error('Failed to load journal');
      }

      const journalData = await journalResponse.json();
      journal = journalData.journal;

      // Load pages
      const pagesResponse = await fetch(`${API_BASE_URL}/api/v1/journals/${journalId}/pages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!pagesResponse.ok) {
        throw new Error('Failed to load pages');
      }

      const pagesData = await pagesResponse.json();
      pages = (pagesData.journalPages || []).sort((a: JournalPage, b: JournalPage) => a.sort - b.sort);

      // Select first page if available
      if (pages.length > 0 && !selectedPageId) {
        selectedPageId = pages[0].id;
      }
    } catch (err) {
      console.error('Error loading journal:', err);
      error = err instanceof Error ? err.message : 'Failed to load journal';
    } finally {
      loading = false;
    }
  }

  async function updatePage(updates: Partial<JournalPage>) {
    if (!selectedPageId) return;

    try {
      const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/pages/${selectedPageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update page');
      }

      const data = await response.json();
      const updatedPage = data.journalPage;

      // Update local state
      pages = pages.map(p => p.id === updatedPage.id ? updatedPage : p);

      // Update store
      journalsStore.updatePage(selectedPageId, updatedPage);

      editMode = false;
    } catch (err) {
      console.error('Error updating page:', err);
      error = err instanceof Error ? err.message : 'Failed to update page';
    }
  }

  function handleClose() {
    dispatch('close');
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !editMode) {
      handleClose();
    }
  }

  function selectPage(pageId: string) {
    selectedPageId = pageId;
    editMode = false;
  }

  function toggleEditMode() {
    editMode = !editMode;
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal-content" on:click|stopPropagation>
      {#if loading}
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading journal...</p>
        </div>
      {:else if error}
        <div class="error-container">
          <p class="error-message">{error}</p>
          <button class="button-primary" on:click={loadJournal}>Retry</button>
        </div>
      {:else if journal}
        <header class="modal-header">
          <div class="header-content">
            {#if journal.img}
              <img src={journal.img} alt={journal.name} class="journal-image" />
            {/if}
            <div class="header-text">
              <h2>{journal.name}</h2>
            </div>
          </div>
          <div class="header-actions">
            {#if isGM && selectedPage && selectedPage.pageType === 'text'}
              <button
                class="button-edit"
                class:active={editMode}
                on:click={toggleEditMode}
              >
                {editMode ? 'View' : 'Edit'}
              </button>
            {/if}
            <button class="close-button" on:click={handleClose} aria-label="Close">
              &times;
            </button>
          </div>
        </header>

        <div class="modal-body">
          {#if pages.length === 0}
            <div class="no-pages">
              <p>This journal has no pages yet.</p>
            </div>
          {:else}
            <div class="journal-layout">
              <aside class="pages-sidebar">
                <h3>Pages</h3>
                <nav class="pages-list">
                  {#each pages as page (page.id)}
                    {#if page.showInNavigation}
                      <button
                        class="page-nav-item"
                        class:active={selectedPageId === page.id}
                        on:click={() => selectPage(page.id)}
                      >
                        {page.name}
                      </button>
                    {/if}
                  {/each}
                </nav>
              </aside>

              <main class="page-content">
                <JournalPageComponent
                  page={selectedPage}
                  {editMode}
                  onUpdate={updatePage}
                />
              </main>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

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
    max-width: 1200px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    gap: 1rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #374151;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error-message {
    color: #fca5a5;
    margin-bottom: 1rem;
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }

  .journal-image {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: 6px;
    border: 2px solid var(--color-border, #333);
  }

  .header-text h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .button-edit {
    padding: 0.5rem 1rem;
    background-color: transparent;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    color: var(--color-text-secondary, #aaa);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }

  .button-edit:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }

  .button-edit.active {
    background-color: #4a90e2;
    border-color: #4a90e2;
    color: white;
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
    flex: 1;
    overflow: hidden;
  }

  .no-pages {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text-secondary, #9ca3af);
    padding: 2rem;
  }

  .journal-layout {
    display: flex;
    height: 100%;
  }

  .pages-sidebar {
    width: 220px;
    border-right: 1px solid var(--color-border, #333);
    background-color: var(--color-bg-primary, #121212);
    padding: 1rem;
    overflow-y: auto;
  }

  .pages-sidebar h3 {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-secondary, #aaa);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .pages-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .page-nav-item {
    width: 100%;
    text-align: left;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .page-nav-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .page-nav-item.active {
    background-color: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }

  .page-content {
    flex: 1;
    overflow: hidden;
  }

  button {
    transition: transform 0.1s;
  }

  button:active:not(:disabled) {
    transform: scale(0.98);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

  .button-primary:hover:not(:disabled) {
    background-color: #357abd;
  }

  @media (max-width: 768px) {
    .modal-backdrop {
      padding: 0;
    }

    .modal-content {
      max-height: 100vh;
      border-radius: 0;
    }

    .journal-layout {
      flex-direction: column;
    }

    .pages-sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid var(--color-border, #333);
      max-height: 150px;
    }

    .pages-list {
      flex-direction: row;
      overflow-x: auto;
      gap: 0.5rem;
    }

    .page-nav-item {
      white-space: nowrap;
    }
  }
</style>
