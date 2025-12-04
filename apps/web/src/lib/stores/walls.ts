import { writable } from 'svelte/store';
import type { Wall } from '@vtt/shared';

interface WallsState {
  walls: Map<string, Wall>;
  selectedWallId: string | null;
  loading: boolean;
  error: string | null;
}

function createWallsStore() {
  const { subscribe, set, update } = writable<WallsState>({
    walls: new Map(),
    selectedWallId: null,
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load walls for a scene
     * Note: For MVP, walls are managed locally and synced via WebSocket
     * In the future, this could fetch from an API endpoint
     */
    loadWalls(sceneId: string, wallsArray: Wall[]): void {
      const walls = new Map<string, Wall>();
      wallsArray
        .filter(wall => wall.sceneId === sceneId)
        .forEach(wall => {
          walls.set(wall.id, wall);
        });

      update(state => ({
        ...state,
        walls,
        loading: false,
      }));
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

        return {
          ...state,
          walls: newWalls,
          selectedWallId: state.selectedWallId === wallId ? null : state.selectedWallId,
        };
      });
    },

    /**
     * Select a wall
     */
    selectWall(wallId: string | null): void {
      update(state => ({
        ...state,
        selectedWallId: wallId,
      }));
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
        selectedWallId: null,
        loading: false,
        error: null,
      });
    },
  };
}

export const wallsStore = createWallsStore();
