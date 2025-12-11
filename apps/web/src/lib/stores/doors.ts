import { writable } from 'svelte/store';
import type { Door } from '@vtt/shared';

interface DoorsState {
  doors: Map<string, Door>;
  selectedDoorIds: Set<string>;
  loading: boolean;
  error: string | null;
}

function createDoorsStore() {
  const { subscribe, set, update } = writable<DoorsState>({
    doors: new Map(),
    selectedDoorIds: new Set<string>(),
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load doors for a scene from the API
     */
    async loadDoors(sceneId: string, token: string): Promise<void> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`/api/v1/scenes/${sceneId}/doors`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch doors: ${response.statusText}`);
        }

        const data = await response.json();
        const doors = new Map<string, Door>();

        if (data.doors && Array.isArray(data.doors)) {
          data.doors.forEach((door: Door) => {
            doors.set(door.id, door);
          });
        }

        update(state => ({
          ...state,
          doors,
          loading: false,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          loading: false,
          error: message,
        }));
        console.error('Failed to load doors:', error);
      }
    },

    /**
     * Create a new door via API
     */
    async createDoor(sceneId: string, token: string, doorData: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      wallShape?: 'straight' | 'curved';
      controlPoints?: Array<{ x: number; y: number }>;
      status?: 'open' | 'closed' | 'broken';
      isLocked?: boolean;
      snapToGrid?: boolean;
      data?: Record<string, unknown>;
    }): Promise<Door | null> {
      try {
        const response = await fetch(`/api/v1/scenes/${sceneId}/doors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sceneId,
            ...doorData,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create door: ${response.statusText}`);
        }

        const data = await response.json();
        const newDoor = data.door;

        // Add to store
        this.addDoor(newDoor);

        return newDoor;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          error: message,
        }));
        console.error('Failed to create door:', error);
        return null;
      }
    },

    /**
     * Update a door via API
     */
    async updateDoor(doorId: string, token: string, updates: {
      x1?: number;
      y1?: number;
      x2?: number;
      y2?: number;
      wallShape?: 'straight' | 'curved';
      controlPoints?: Array<{ x: number; y: number }>;
      status?: 'open' | 'closed' | 'broken';
      isLocked?: boolean;
      snapToGrid?: boolean;
      data?: Record<string, unknown>;
    }): Promise<Door | null> {
      try {
        const response = await fetch(`/api/v1/doors/${doorId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update door: ${response.statusText}`);
        }

        const data = await response.json();
        const updatedDoor = data.door;

        // Update in store
        this.updateDoorLocal(doorId, updatedDoor);

        return updatedDoor;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          error: message,
        }));
        console.error('Failed to update door:', error);
        return null;
      }
    },

    /**
     * Delete a door via API
     */
    async deleteDoor(doorId: string, token: string): Promise<boolean> {
      try {
        const response = await fetch(`/api/v1/doors/${doorId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete door: ${response.statusText}`);
        }

        // Remove from store
        this.removeDoor(doorId);

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          error: message,
        }));
        console.error('Failed to delete door:', error);
        return false;
      }
    },

    /**
     * Add a door to the store (from WebSocket updates)
     */
    addDoor(door: Door): void {
      update(state => {
        const newDoors = new Map(state.doors);
        newDoors.set(door.id, door);
        return {
          ...state,
          doors: newDoors,
        };
      });
    },

    /**
     * Update a door with partial data (from WebSocket updates)
     */
    updateDoorLocal(doorId: string, updates: Partial<Door>): void {
      update(state => {
        const door = state.doors.get(doorId);
        if (!door) return state;

        const updatedDoor = { ...door, ...updates };
        const newDoors = new Map(state.doors);
        newDoors.set(doorId, updatedDoor);

        return {
          ...state,
          doors: newDoors,
        };
      });
    },

    /**
     * Remove a door from the store (from WebSocket updates)
     */
    removeDoor(doorId: string): void {
      update(state => {
        const newDoors = new Map(state.doors);
        newDoors.delete(doorId);

        const newSelectedDoorIds = new Set(state.selectedDoorIds);
        newSelectedDoorIds.delete(doorId);

        return {
          ...state,
          doors: newDoors,
          selectedDoorIds: newSelectedDoorIds,
        };
      });
    },

    /**
     * Select a single door (clears all other selections)
     */
    selectDoor(doorId: string | null): void {
      update(state => ({
        ...state,
        selectedDoorIds: doorId ? new Set([doorId]) : new Set<string>(),
      }));
    },

    /**
     * Toggle a door's selection state
     */
    toggleDoorSelection(doorId: string): void {
      update(state => {
        const newSelectedDoorIds = new Set(state.selectedDoorIds);
        if (newSelectedDoorIds.has(doorId)) {
          newSelectedDoorIds.delete(doorId);
        } else {
          newSelectedDoorIds.add(doorId);
        }
        return {
          ...state,
          selectedDoorIds: newSelectedDoorIds,
        };
      });
    },

    /**
     * Add a door to the current selection
     */
    addToDoorSelection(doorId: string): void {
      update(state => {
        const newSelectedDoorIds = new Set(state.selectedDoorIds);
        newSelectedDoorIds.add(doorId);
        return {
          ...state,
          selectedDoorIds: newSelectedDoorIds,
        };
      });
    },

    /**
     * Remove a door from the current selection
     */
    removeFromDoorSelection(doorId: string): void {
      update(state => {
        const newSelectedDoorIds = new Set(state.selectedDoorIds);
        newSelectedDoorIds.delete(doorId);
        return {
          ...state,
          selectedDoorIds: newSelectedDoorIds,
        };
      });
    },

    /**
     * Clear all selected doors
     */
    clearDoorSelection(): void {
      update(state => ({
        ...state,
        selectedDoorIds: new Set<string>(),
      }));
    },

    /**
     * Check if a door is currently selected
     */
    isDoorSelected(doorId: string, currentState: DoorsState): boolean {
      return currentState.selectedDoorIds.has(doorId);
    },

    /**
     * Get doors for a specific scene
     */
    getDoorsForScene(sceneId: string, currentState: DoorsState): Door[] {
      return Array.from(currentState.doors.values()).filter(door => door.sceneId === sceneId);
    },

    /**
     * Clear all doors (useful when switching scenes or leaving a game)
     */
    clear(): void {
      set({
        doors: new Map(),
        selectedDoorIds: new Set<string>(),
        loading: false,
        error: null,
      });
    },
  };
}

export const doorsStore = createDoorsStore();
