import { writable } from 'svelte/store';
import type { Region } from '@vtt/shared';
import { browser } from '$app/environment';
import { API_BASE_URL } from '$lib/config/api';

interface RegionsState {
  regions: Map<string, Region>;
  selectedRegionId: string | null;
  loading: boolean;
  error: string | null;
}

function createRegionsStore() {
  const { subscribe, set, update } = writable<RegionsState>({
    regions: new Map(),
    selectedRegionId: null,
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load regions for a scene from the API
     */
    async loadRegions(sceneId: string): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/regions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch regions: ${response.statusText}`);
        }

        const data = await response.json();
        const regions = new Map<string, Region>();

        if (data.regions && Array.isArray(data.regions)) {
          data.regions.forEach((region: Region) => {
            regions.set(region.id, region);
          });
        }

        update(state => ({
          ...state,
          regions,
          loading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load regions';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error loading regions:', error);
      }
    },

    /**
     * Create a new region via API
     */
    async createRegion(sceneId: string, regionData: Partial<Region>): Promise<Region | null> {
      if (!browser) return null;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/regions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(regionData),
        });

        if (!response.ok) {
          throw new Error(`Failed to create region: ${response.statusText}`);
        }

        const data = await response.json();
        const region = data.region;

        // Add to store
        update(state => {
          const newRegions = new Map(state.regions);
          newRegions.set(region.id, region);
          return {
            ...state,
            regions: newRegions,
          };
        });

        return region;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create region';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
        console.error('Error creating region:', error);
        return null;
      }
    },

    /**
     * Update a region via API
     */
    async updateRegion(regionId: string, updates: Partial<Region>): Promise<void> {
      if (!browser) return;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/regions/${regionId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update region: ${response.statusText}`);
        }

        const data = await response.json();
        const updatedRegion = data.region;

        // Update in store
        update(state => {
          const newRegions = new Map(state.regions);
          newRegions.set(regionId, updatedRegion);
          return {
            ...state,
            regions: newRegions,
          };
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update region';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
        console.error('Error updating region:', error);
      }
    },

    /**
     * Delete a region via API
     */
    async deleteRegion(regionId: string): Promise<void> {
      if (!browser) return;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/regions/${regionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete region: ${response.statusText}`);
        }

        // Remove from store
        update(state => {
          const newRegions = new Map(state.regions);
          newRegions.delete(regionId);
          return {
            ...state,
            regions: newRegions,
            selectedRegionId: state.selectedRegionId === regionId ? null : state.selectedRegionId,
          };
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete region';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
        console.error('Error deleting region:', error);
      }
    },

    /**
     * Add a region to the store (for WebSocket updates)
     */
    addRegion(region: Region): void {
      update(state => {
        const newRegions = new Map(state.regions);
        newRegions.set(region.id, region);
        return {
          ...state,
          regions: newRegions,
        };
      });
    },

    /**
     * Update a region in the store (for WebSocket updates)
     */
    updateRegionLocal(regionId: string, updates: Partial<Region>): void {
      update(state => {
        const region = state.regions.get(regionId);
        if (!region) return state;

        const updatedRegion = { ...region, ...updates };
        const newRegions = new Map(state.regions);
        newRegions.set(regionId, updatedRegion);

        return {
          ...state,
          regions: newRegions,
        };
      });
    },

    /**
     * Remove a region from the store (for WebSocket updates)
     */
    removeRegion(regionId: string): void {
      update(state => {
        const newRegions = new Map(state.regions);
        newRegions.delete(regionId);

        return {
          ...state,
          regions: newRegions,
          selectedRegionId: state.selectedRegionId === regionId ? null : state.selectedRegionId,
        };
      });
    },

    /**
     * Select a region
     */
    selectRegion(regionId: string | null): void {
      update(state => ({
        ...state,
        selectedRegionId: regionId,
      }));
    },

    /**
     * Get regions for a specific scene
     */
    getRegionsForScene(sceneId: string, currentState: RegionsState): Region[] {
      return Array.from(currentState.regions.values()).filter(region => region.sceneId === sceneId);
    },

    /**
     * Clear all regions (useful when switching scenes or leaving a game)
     */
    clear(): void {
      set({
        regions: new Map(),
        selectedRegionId: null,
        loading: false,
        error: null,
      });
    },
  };
}

export const regionsStore = createRegionsStore();
