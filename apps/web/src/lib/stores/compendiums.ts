import { writable } from 'svelte/store';
import type {
  Compendium,
  CompendiumEntry,
  CreateCompendiumRequest,
  UpdateCompendiumRequest,
  CreateCompendiumEntryRequest,
  UpdateCompendiumEntryRequest,
  CompendiumImportData,
  CompendiumInstantiateRequest,
} from '@vtt/shared';
import { browser } from '$app/environment';
import { API_BASE_URL } from '$lib/config/api';

interface CompendiumsState {
  compendiums: Map<string, Compendium>;
  entries: Map<string, CompendiumEntry>;
  selectedCompendiumId: string | null;
  loading: boolean;
  error: string | null;
}

function createCompendiumsStore() {
  const { subscribe, set, update } = writable<CompendiumsState>({
    compendiums: new Map(),
    entries: new Map(),
    selectedCompendiumId: null,
    loading: false,
    error: null,
  });

  // Helper to get auth token
  function getAuthToken(): string | null {
    if (!browser) return null;
    return localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');
  }

  // Helper for fetch with auth
  async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  return {
    subscribe,

    /**
     * Load all accessible compendiums
     */
    async loadCompendiums(): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await authFetch(`${API_BASE_URL}/api/v1/compendiums`);

        if (!response.ok) {
          throw new Error(`Failed to fetch compendiums: ${response.statusText}`);
        }

        const data = await response.json();
        const compendiums = new Map<string, Compendium>();

        if (data.compendiums && Array.isArray(data.compendiums)) {
          data.compendiums.forEach((compendium: Compendium) => {
            compendiums.set(compendium.id, compendium);
          });
        }

        update(state => ({
          ...state,
          compendiums,
          loading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load compendiums';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error loading compendiums:', error);
      }
    },

    /**
     * Load compendiums for a specific campaign
     */
    async loadCampaignCompendiums(campaignId: string): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await authFetch(`${API_BASE_URL}/api/v1/campaigns/${campaignId}/compendiums`);

        if (!response.ok) {
          throw new Error(`Failed to fetch campaign compendiums: ${response.statusText}`);
        }

        const data = await response.json();
        const compendiums = new Map<string, Compendium>();

        if (data.compendiums && Array.isArray(data.compendiums)) {
          data.compendiums.forEach((compendium: Compendium) => {
            compendiums.set(compendium.id, compendium);
          });
        }

        update(state => ({
          ...state,
          compendiums,
          loading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load campaign compendiums';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error loading campaign compendiums:', error);
      }
    },

    /**
     * Create a new compendium
     */
    async createCompendium(campaignId: string, data: CreateCompendiumRequest): Promise<Compendium | null> {
      if (!browser) return null;

      try {
        const response = await authFetch(
          `${API_BASE_URL}/api/v1/campaigns/${campaignId}/compendiums`,
          {
            method: 'POST',
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to create compendium: ${response.statusText}`);
        }

        const result = await response.json();
        const compendium = result.compendium;

        update(state => {
          const newCompendiums = new Map(state.compendiums);
          newCompendiums.set(compendium.id, compendium);
          return {
            ...state,
            compendiums: newCompendiums,
          };
        });

        return compendium;
      } catch (error) {
        console.error('Error creating compendium:', error);
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to create compendium',
        }));
        return null;
      }
    },

    /**
     * Update a compendium
     */
    async updateCompendium(compendiumId: string, updates: UpdateCompendiumRequest): Promise<boolean> {
      if (!browser) return false;

      try {
        const response = await authFetch(
          `${API_BASE_URL}/api/v1/compendiums/${compendiumId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(updates),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update compendium: ${response.statusText}`);
        }

        const result = await response.json();
        const compendium = result.compendium;

        update(state => {
          const newCompendiums = new Map(state.compendiums);
          newCompendiums.set(compendium.id, compendium);
          return {
            ...state,
            compendiums: newCompendiums,
          };
        });

        return true;
      } catch (error) {
        console.error('Error updating compendium:', error);
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to update compendium',
        }));
        return false;
      }
    },

    /**
     * Delete a compendium
     */
    async deleteCompendium(compendiumId: string): Promise<boolean> {
      if (!browser) return false;

      try {
        const response = await authFetch(
          `${API_BASE_URL}/api/v1/compendiums/${compendiumId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to delete compendium: ${response.statusText}`);
        }

        update(state => {
          const newCompendiums = new Map(state.compendiums);
          newCompendiums.delete(compendiumId);

          // Clear selected if deleted
          const selectedCompendiumId = state.selectedCompendiumId === compendiumId
            ? null
            : state.selectedCompendiumId;

          return {
            ...state,
            compendiums: newCompendiums,
            selectedCompendiumId,
          };
        });

        return true;
      } catch (error) {
        console.error('Error deleting compendium:', error);
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to delete compendium',
        }));
        return false;
      }
    },

    /**
     * Load entries for a compendium
     */
    async loadEntries(compendiumId: string, page: number = 1, pageSize: number = 50): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await authFetch(
          `${API_BASE_URL}/api/v1/compendiums/${compendiumId}/entries?page=${page}&pageSize=${pageSize}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch entries: ${response.statusText}`);
        }

        const data = await response.json();
        const entries = new Map<string, CompendiumEntry>();

        if (data.entries && Array.isArray(data.entries)) {
          data.entries.forEach((entry: CompendiumEntry) => {
            entries.set(entry.id, entry);
          });
        }

        update(state => ({
          ...state,
          entries,
          selectedCompendiumId: compendiumId,
          loading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load entries';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error loading entries:', error);
      }
    },

    /**
     * Search entries in a compendium
     */
    async searchEntries(compendiumId: string, query: string, tags?: string[]): Promise<CompendiumEntry[]> {
      if (!browser) return [];

      try {
        const tagParam = tags && tags.length > 0 ? `&tags=${tags.join(',')}` : '';
        const response = await authFetch(
          `${API_BASE_URL}/api/v1/compendiums/${compendiumId}/entries/search?query=${encodeURIComponent(query)}${tagParam}`
        );

        if (!response.ok) {
          throw new Error(`Failed to search entries: ${response.statusText}`);
        }

        const data = await response.json();
        return data.entries || [];
      } catch (error) {
        console.error('Error searching entries:', error);
        return [];
      }
    },

    /**
     * Create a new entry
     */
    async createEntry(compendiumId: string, data: CreateCompendiumEntryRequest): Promise<CompendiumEntry | null> {
      if (!browser) return null;

      try {
        const response = await authFetch(
          `${API_BASE_URL}/api/v1/compendiums/${compendiumId}/entries`,
          {
            method: 'POST',
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to create entry: ${response.statusText}`);
        }

        const result = await response.json();
        const entry = result.entry;

        update(state => {
          const newEntries = new Map(state.entries);
          newEntries.set(entry.id, entry);
          return {
            ...state,
            entries: newEntries,
          };
        });

        return entry;
      } catch (error) {
        console.error('Error creating entry:', error);
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to create entry',
        }));
        return null;
      }
    },

    /**
     * Update an entry
     */
    async updateEntry(entryId: string, updates: UpdateCompendiumEntryRequest): Promise<boolean> {
      if (!browser) return false;

      try {
        const response = await authFetch(
          `${API_BASE_URL}/api/v1/compendium-entries/${entryId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(updates),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update entry: ${response.statusText}`);
        }

        const result = await response.json();
        const entry = result.entry;

        update(state => {
          const newEntries = new Map(state.entries);
          newEntries.set(entry.id, entry);
          return {
            ...state,
            entries: newEntries,
          };
        });

        return true;
      } catch (error) {
        console.error('Error updating entry:', error);
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to update entry',
        }));
        return false;
      }
    },

    /**
     * Delete an entry
     */
    async deleteEntry(entryId: string): Promise<boolean> {
      if (!browser) return false;

      try {
        const response = await authFetch(
          `${API_BASE_URL}/api/v1/compendium-entries/${entryId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to delete entry: ${response.statusText}`);
        }

        update(state => {
          const newEntries = new Map(state.entries);
          newEntries.delete(entryId);
          return {
            ...state,
            entries: newEntries,
          };
        });

        return true;
      } catch (error) {
        console.error('Error deleting entry:', error);
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to delete entry',
        }));
        return false;
      }
    },

    /**
     * Import entries from JSON
     */
    async importEntries(compendiumId: string, importData: CompendiumImportData): Promise<boolean> {
      if (!browser) return false;

      try {
        const response = await authFetch(
          `${API_BASE_URL}/api/v1/compendiums/${compendiumId}/import`,
          {
            method: 'POST',
            body: JSON.stringify(importData),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to import entries: ${response.statusText}`);
        }

        const result = await response.json();

        // Add imported entries to store
        if (result.entries && Array.isArray(result.entries)) {
          update(state => {
            const newEntries = new Map(state.entries);
            result.entries.forEach((entry: CompendiumEntry) => {
              newEntries.set(entry.id, entry);
            });
            return {
              ...state,
              entries: newEntries,
            };
          });
        }

        return true;
      } catch (error) {
        console.error('Error importing entries:', error);
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to import entries',
        }));
        return false;
      }
    },

    /**
     * Export compendium as JSON
     */
    async exportCompendium(compendiumId: string): Promise<CompendiumImportData | null> {
      if (!browser) return null;

      try {
        const response = await authFetch(
          `${API_BASE_URL}/api/v1/compendiums/${compendiumId}/export`
        );

        if (!response.ok) {
          throw new Error(`Failed to export compendium: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error exporting compendium:', error);
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to export compendium',
        }));
        return null;
      }
    },

    /**
     * Instantiate an entry as a campaign entity
     */
    async instantiateEntry(entryId: string, request: CompendiumInstantiateRequest): Promise<string | null> {
      if (!browser) return null;

      try {
        const response = await authFetch(
          `${API_BASE_URL}/api/v1/compendium-entries/${entryId}/instantiate`,
          {
            method: 'POST',
            body: JSON.stringify(request),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to instantiate entry: ${response.statusText}`);
        }

        const result = await response.json();
        return result.entityId;
      } catch (error) {
        console.error('Error instantiating entry:', error);
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to instantiate entry',
        }));
        return null;
      }
    },

    /**
     * Add a compendium to the store (from WebSocket event)
     */
    addCompendium(compendium: Compendium): void {
      update(state => {
        const newCompendiums = new Map(state.compendiums);
        newCompendiums.set(compendium.id, compendium);
        return {
          ...state,
          compendiums: newCompendiums,
        };
      });
    },

    /**
     * Update a compendium in the store (from WebSocket event)
     */
    updateCompendiumLocal(compendiumId: string, updates: Partial<Compendium>): void {
      update(state => {
        const compendium = state.compendiums.get(compendiumId);
        if (!compendium) return state;

        const updatedCompendium = { ...compendium, ...updates };
        const newCompendiums = new Map(state.compendiums);
        newCompendiums.set(compendiumId, updatedCompendium);

        return {
          ...state,
          compendiums: newCompendiums,
        };
      });
    },

    /**
     * Remove a compendium from the store (from WebSocket event)
     */
    removeCompendium(compendiumId: string): void {
      update(state => {
        const newCompendiums = new Map(state.compendiums);
        newCompendiums.delete(compendiumId);

        const selectedCompendiumId = state.selectedCompendiumId === compendiumId
          ? null
          : state.selectedCompendiumId;

        return {
          ...state,
          compendiums: newCompendiums,
          selectedCompendiumId,
        };
      });
    },

    /**
     * Add an entry to the store (from WebSocket event)
     */
    addEntry(entry: CompendiumEntry): void {
      update(state => {
        const newEntries = new Map(state.entries);
        newEntries.set(entry.id, entry);
        return {
          ...state,
          entries: newEntries,
        };
      });
    },

    /**
     * Update an entry in the store (from WebSocket event)
     */
    updateEntryLocal(entryId: string, updates: Partial<CompendiumEntry>): void {
      update(state => {
        const entry = state.entries.get(entryId);
        if (!entry) return state;

        const updatedEntry = { ...entry, ...updates };
        const newEntries = new Map(state.entries);
        newEntries.set(entryId, updatedEntry);

        return {
          ...state,
          entries: newEntries,
        };
      });
    },

    /**
     * Remove an entry from the store (from WebSocket event)
     */
    removeEntry(entryId: string): void {
      update(state => {
        const newEntries = new Map(state.entries);
        newEntries.delete(entryId);

        return {
          ...state,
          entries: newEntries,
        };
      });
    },

    /**
     * Select a compendium
     */
    selectCompendium(compendiumId: string | null): void {
      update(state => ({
        ...state,
        selectedCompendiumId: compendiumId,
      }));
    },

    /**
     * Clear all data (useful when leaving a campaign)
     */
    clear(): void {
      set({
        compendiums: new Map(),
        entries: new Map(),
        selectedCompendiumId: null,
        loading: false,
        error: null,
      });
    },
  };
}

export const compendiumsStore = createCompendiumsStore();
