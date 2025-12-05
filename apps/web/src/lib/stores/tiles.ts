import { writable } from 'svelte/store';
import type { Tile } from '@vtt/shared';
import { browser } from '$app/environment';
import { API_BASE_URL } from '$lib/config/api';

interface TilesState {
  tiles: Map<string, Tile>;
  selectedTileId: string | null;
  loading: boolean;
  error: string | null;
}

function createTilesStore() {
  const { subscribe, set, update } = writable<TilesState>({
    tiles: new Map(),
    selectedTileId: null,
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load tiles for a scene from the API
     */
    async loadTiles(sceneId: string): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/tiles`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch tiles: ${response.statusText}`);
        }

        const data = await response.json();
        const tiles = new Map<string, Tile>();

        if (data.tiles && Array.isArray(data.tiles)) {
          data.tiles.forEach((tile: Tile) => {
            tiles.set(tile.id, tile);
          });
        }

        update(state => ({
          ...state,
          tiles,
          loading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load tiles';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error loading tiles:', error);
      }
    },

    /**
     * Create a new tile via API
     */
    async createTile(sceneId: string, tileData: Partial<Tile>): Promise<Tile | null> {
      if (!browser) return null;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/tiles`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tileData),
        });

        if (!response.ok) {
          throw new Error(`Failed to create tile: ${response.statusText}`);
        }

        const data = await response.json();
        const tile = data.tile;

        // Add to store
        update(state => {
          const newTiles = new Map(state.tiles);
          newTiles.set(tile.id, tile);
          return {
            ...state,
            tiles: newTiles,
          };
        });

        return tile;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create tile';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
        console.error('Error creating tile:', error);
        return null;
      }
    },

    /**
     * Update a tile via API
     */
    async updateTile(tileId: string, updates: Partial<Tile>): Promise<void> {
      if (!browser) return;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/tiles/${tileId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update tile: ${response.statusText}`);
        }

        const data = await response.json();
        const updatedTile = data.tile;

        // Update in store
        update(state => {
          const newTiles = new Map(state.tiles);
          newTiles.set(tileId, updatedTile);
          return {
            ...state,
            tiles: newTiles,
          };
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update tile';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
        console.error('Error updating tile:', error);
      }
    },

    /**
     * Delete a tile via API
     */
    async deleteTile(tileId: string): Promise<void> {
      if (!browser) return;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/tiles/${tileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete tile: ${response.statusText}`);
        }

        // Remove from store
        update(state => {
          const newTiles = new Map(state.tiles);
          newTiles.delete(tileId);
          return {
            ...state,
            tiles: newTiles,
            selectedTileId: state.selectedTileId === tileId ? null : state.selectedTileId,
          };
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete tile';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
        console.error('Error deleting tile:', error);
      }
    },

    /**
     * Add a tile to the store (for WebSocket updates)
     */
    addTile(tile: Tile): void {
      update(state => {
        const newTiles = new Map(state.tiles);
        newTiles.set(tile.id, tile);
        return {
          ...state,
          tiles: newTiles,
        };
      });
    },

    /**
     * Update a tile in the store (for WebSocket updates)
     */
    updateTileLocal(tileId: string, updates: Partial<Tile>): void {
      update(state => {
        const tile = state.tiles.get(tileId);
        if (!tile) return state;

        const updatedTile = { ...tile, ...updates };
        const newTiles = new Map(state.tiles);
        newTiles.set(tileId, updatedTile);

        return {
          ...state,
          tiles: newTiles,
        };
      });
    },

    /**
     * Remove a tile from the store (for WebSocket updates)
     */
    removeTile(tileId: string): void {
      update(state => {
        const newTiles = new Map(state.tiles);
        newTiles.delete(tileId);

        return {
          ...state,
          tiles: newTiles,
          selectedTileId: state.selectedTileId === tileId ? null : state.selectedTileId,
        };
      });
    },

    /**
     * Select a tile
     */
    selectTile(tileId: string | null): void {
      update(state => ({
        ...state,
        selectedTileId: tileId,
      }));
    },

    /**
     * Get tiles for a specific scene
     */
    getTilesForScene(sceneId: string, currentState: TilesState): Tile[] {
      return Array.from(currentState.tiles.values())
        .filter(tile => tile.sceneId === sceneId)
        .sort((a, b) => a.z - b.z); // Sort by z-index
    },

    /**
     * Clear all tiles (useful when switching scenes or leaving a game)
     */
    clear(): void {
      set({
        tiles: new Map(),
        selectedTileId: null,
        loading: false,
        error: null,
      });
    },
  };
}

export const tilesStore = createTilesStore();
