import { writable } from 'svelte/store';
import type { Journal, JournalPage, Folder } from '@vtt/shared';
import { browser } from '$app/environment';
import { API_BASE_URL } from '$lib/config/api';

interface JournalsState {
  journals: Map<string, Journal>;
  pages: Map<string, JournalPage>;
  folders: Map<string, Folder>;
  selectedJournalId: string | null;
  selectedPageId: string | null;
  loading: boolean;
  error: string | null;
}

function createJournalsStore() {
  const { subscribe, set, update } = writable<JournalsState>({
    journals: new Map(),
    pages: new Map(),
    folders: new Map(),
    selectedJournalId: null,
    selectedPageId: null,
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load journals for a game from the API
     */
    async loadJournals(gameId: string): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/games/${gameId}/journals`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch journals: ${response.statusText}`);
        }

        const data = await response.json();
        const journals = new Map<string, Journal>();

        if (data.journals && Array.isArray(data.journals)) {
          data.journals.forEach((journal: Journal) => {
            journals.set(journal.id, journal);
          });
        }

        update(state => ({
          ...state,
          journals,
          loading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load journals';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error loading journals:', error);
      }
    },

    /**
     * Load folders for a game
     */
    async loadFolders(gameId: string, folderType: string = 'journal'): Promise<void> {
      if (!browser) return;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/games/${gameId}/folders?type=${folderType}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch folders: ${response.statusText}`);
        }

        const data = await response.json();
        const folders = new Map<string, Folder>();

        if (data.folders && Array.isArray(data.folders)) {
          data.folders.forEach((folder: Folder) => {
            folders.set(folder.id, folder);
          });
        }

        update(state => ({
          ...state,
          folders,
        }));
      } catch (error) {
        console.error('Error loading folders:', error);
      }
    },

    /**
     * Load pages for a specific journal
     */
    async loadPages(journalId: string): Promise<void> {
      if (!browser) return;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/journals/${journalId}/pages`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch pages: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.journalPages && Array.isArray(data.journalPages)) {
          update(state => {
            const newPages = new Map(state.pages);
            data.journalPages.forEach((page: JournalPage) => {
              newPages.set(page.id, page);
            });
            return {
              ...state,
              pages: newPages,
            };
          });
        }
      } catch (error) {
        console.error('Error loading pages:', error);
      }
    },

    /**
     * Add a journal to the store
     */
    addJournal(journal: Journal): void {
      update(state => {
        const newJournals = new Map(state.journals);
        newJournals.set(journal.id, journal);
        return {
          ...state,
          journals: newJournals,
        };
      });
    },

    /**
     * Update a journal with partial data
     */
    updateJournal(journalId: string, updates: Partial<Journal>): void {
      update(state => {
        const journal = state.journals.get(journalId);
        if (!journal) return state;

        const updatedJournal = { ...journal, ...updates };
        const newJournals = new Map(state.journals);
        newJournals.set(journalId, updatedJournal);

        return {
          ...state,
          journals: newJournals,
        };
      });
    },

    /**
     * Remove a journal from the store
     */
    removeJournal(journalId: string): void {
      update(state => {
        const newJournals = new Map(state.journals);
        newJournals.delete(journalId);

        // Also remove associated pages
        const newPages = new Map(state.pages);
        Array.from(newPages.values())
          .filter(page => page.journalId === journalId)
          .forEach(page => newPages.delete(page.id));

        return {
          ...state,
          journals: newJournals,
          pages: newPages,
          selectedJournalId: state.selectedJournalId === journalId ? null : state.selectedJournalId,
        };
      });
    },

    /**
     * Add a page to the store
     */
    addPage(page: JournalPage): void {
      update(state => {
        const newPages = new Map(state.pages);
        newPages.set(page.id, page);
        return {
          ...state,
          pages: newPages,
        };
      });
    },

    /**
     * Update a page with partial data
     */
    updatePage(pageId: string, updates: Partial<JournalPage>): void {
      update(state => {
        const page = state.pages.get(pageId);
        if (!page) return state;

        const updatedPage = { ...page, ...updates };
        const newPages = new Map(state.pages);
        newPages.set(pageId, updatedPage);

        return {
          ...state,
          pages: newPages,
        };
      });
    },

    /**
     * Remove a page from the store
     */
    removePage(pageId: string): void {
      update(state => {
        const newPages = new Map(state.pages);
        newPages.delete(pageId);

        return {
          ...state,
          pages: newPages,
          selectedPageId: state.selectedPageId === pageId ? null : state.selectedPageId,
        };
      });
    },

    /**
     * Add a folder to the store
     */
    addFolder(folder: Folder): void {
      update(state => {
        const newFolders = new Map(state.folders);
        newFolders.set(folder.id, folder);
        return {
          ...state,
          folders: newFolders,
        };
      });
    },

    /**
     * Update a folder with partial data
     */
    updateFolder(folderId: string, updates: Partial<Folder>): void {
      update(state => {
        const folder = state.folders.get(folderId);
        if (!folder) return state;

        const updatedFolder = { ...folder, ...updates };
        const newFolders = new Map(state.folders);
        newFolders.set(folderId, updatedFolder);

        return {
          ...state,
          folders: newFolders,
        };
      });
    },

    /**
     * Remove a folder from the store
     */
    removeFolder(folderId: string): void {
      update(state => {
        const newFolders = new Map(state.folders);
        newFolders.delete(folderId);

        return {
          ...state,
          folders: newFolders,
        };
      });
    },

    /**
     * Select a journal
     */
    selectJournal(journalId: string | null): void {
      update(state => ({
        ...state,
        selectedJournalId: journalId,
        selectedPageId: null,
      }));
    },

    /**
     * Select a page
     */
    selectPage(pageId: string | null): void {
      update(state => ({
        ...state,
        selectedPageId: pageId,
      }));
    },

    /**
     * Get pages for a specific journal
     */
    getPagesForJournal(journalId: string, currentState: JournalsState): JournalPage[] {
      return Array.from(currentState.pages.values())
        .filter(page => page.journalId === journalId)
        .sort((a, b) => a.sort - b.sort);
    },

    /**
     * Get journals in a specific folder
     */
    getJournalsInFolder(folderId: string | null, currentState: JournalsState): Journal[] {
      return Array.from(currentState.journals.values())
        .filter(journal => journal.folderId === folderId)
        .sort((a, b) => a.sort - b.sort);
    },

    /**
     * Get subfolders of a folder
     */
    getSubfolders(parentId: string | null, currentState: JournalsState): Folder[] {
      return Array.from(currentState.folders.values())
        .filter(folder => folder.parentId === parentId)
        .sort((a, b) => a.sort - b.sort);
    },

    /**
     * Clear all data (useful when leaving a game)
     */
    clear(): void {
      set({
        journals: new Map(),
        pages: new Map(),
        folders: new Map(),
        selectedJournalId: null,
        selectedPageId: null,
        loading: false,
        error: null,
      });
    },
  };
}

export const journalsStore = createJournalsStore();
