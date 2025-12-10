import { writable } from 'svelte/store';
import type { Wall } from '@vtt/shared';

interface WallsState {
  walls: Map<string, Wall>;
  selectedWallIds: Set<string>;
  loading: boolean;
  error: string | null;
}

function createWallsStore() {
  const { subscribe, set, update } = writable<WallsState>({
    walls: new Map(),
    selectedWallIds: new Set<string>(),
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load walls for a scene from the API
     */
    async loadWalls(sceneId: string, token: string): Promise<void> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`/api/v1/scenes/${sceneId}/walls`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch walls: ${response.statusText}`);
        }

        const data = await response.json();
        const walls = new Map<string, Wall>();

        if (data.walls && Array.isArray(data.walls)) {
          data.walls.forEach((wall: Wall) => {
            walls.set(wall.id, wall);
          });
        }

        update(state => ({
          ...state,
          walls,
          loading: false,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          loading: false,
          error: message,
        }));
        console.error('Failed to load walls:', error);
      }
    },

    /**
     * Add a wall to the store
     */
    addWall(wall: Wall): void {
      update(state => {
        const newWalls = new Map(state.walls);
        newWalls.set(wall.id, wall);
        return {
          ...state,
          walls: newWalls,
        };
      });
    },

    /**
     * Update a wall with partial data
     */
    updateWall(wallId: string, updates: Partial<Wall>): void {
      update(state => {
        const wall = state.walls.get(wallId);
        if (!wall) return state;

        const updatedWall = { ...wall, ...updates };
        const newWalls = new Map(state.walls);
        newWalls.set(wallId, updatedWall);

        return {
          ...state,
          walls: newWalls,
        };
      });
    },

    /**
     * Remove a wall from the store
     */
    removeWall(wallId: string): void {
      update(state => {
        const newWalls = new Map(state.walls);
        newWalls.delete(wallId);

        const newSelectedWallIds = new Set(state.selectedWallIds);
        newSelectedWallIds.delete(wallId);

        return {
          ...state,
          walls: newWalls,
          selectedWallIds: newSelectedWallIds,
        };
      });
    },

    /**
     * Select a single wall (clears all other selections)
     */
    selectWall(wallId: string | null): void {
      update(state => ({
        ...state,
        selectedWallIds: wallId ? new Set([wallId]) : new Set<string>(),
      }));
    },

    /**
     * Toggle a wall's selection state
     */
    toggleWallSelection(wallId: string): void {
      update(state => {
        const newSelectedWallIds = new Set(state.selectedWallIds);
        if (newSelectedWallIds.has(wallId)) {
          newSelectedWallIds.delete(wallId);
        } else {
          newSelectedWallIds.add(wallId);
        }
        return {
          ...state,
          selectedWallIds: newSelectedWallIds,
        };
      });
    },

    /**
     * Add a wall to the current selection
     */
    addToWallSelection(wallId: string): void {
      update(state => {
        const newSelectedWallIds = new Set(state.selectedWallIds);
        newSelectedWallIds.add(wallId);
        return {
          ...state,
          selectedWallIds: newSelectedWallIds,
        };
      });
    },

    /**
     * Remove a wall from the current selection
     */
    removeFromWallSelection(wallId: string): void {
      update(state => {
        const newSelectedWallIds = new Set(state.selectedWallIds);
        newSelectedWallIds.delete(wallId);
        return {
          ...state,
          selectedWallIds: newSelectedWallIds,
        };
      });
    },

    /**
     * Clear all selected walls
     */
    clearWallSelection(): void {
      update(state => ({
        ...state,
        selectedWallIds: new Set<string>(),
      }));
    },

    /**
     * Check if a wall is currently selected
     */
    isWallSelected(wallId: string, currentState: WallsState): boolean {
      return currentState.selectedWallIds.has(wallId);
    },

    /**
     * Get walls for a specific scene
     */
    getWallsForScene(sceneId: string, currentState: WallsState): Wall[] {
      return Array.from(currentState.walls.values()).filter(wall => wall.sceneId === sceneId);
    },

    /**
     * Clear all walls (useful when switching scenes or leaving a game)
     */
    clear(): void {
      set({
        walls: new Map(),
        selectedWallIds: new Set<string>(),
        loading: false,
        error: null,
      });
    },
  };
}

export const wallsStore = createWallsStore();
