import { writable } from 'svelte/store';
import type { Window } from '@vtt/shared';

interface WindowsState {
  windows: Map<string, Window>;
  selectedWindowIds: Set<string>;
  loading: boolean;
  error: string | null;
}

function createWindowsStore() {
  const { subscribe, set, update } = writable<WindowsState>({
    windows: new Map(),
    selectedWindowIds: new Set<string>(),
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load windows for a scene from the API
     */
    async loadWindows(sceneId: string, token: string): Promise<void> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`/api/v1/scenes/${sceneId}/windows`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch windows: ${response.statusText}`);
        }

        const data = await response.json();
        const windows = new Map<string, Window>();

        if (data.windows && Array.isArray(data.windows)) {
          data.windows.forEach((window: Window) => {
            windows.set(window.id, window);
          });
        }

        update(state => ({
          ...state,
          windows,
          loading: false,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          loading: false,
          error: message,
        }));
        console.error('Failed to load windows:', error);
      }
    },

    /**
     * Create a new window via API
     */
    async createWindow(sceneId: string, token: string, windowData: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      wallShape?: 'straight' | 'curved';
      controlPoints?: Array<{ x: number; y: number }>;
      opacity?: number;
      tint?: string;
      tintIntensity?: number;
      snapToGrid?: boolean;
      data?: Record<string, unknown>;
    }): Promise<Window | null> {
      try {
        const response = await fetch(`/api/v1/scenes/${sceneId}/windows`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sceneId,
            ...windowData,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create window: ${response.statusText}`);
        }

        const data = await response.json();
        const newWindow = data.window;

        // Add to store
        this.addWindow(newWindow);

        return newWindow;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          error: message,
        }));
        console.error('Failed to create window:', error);
        return null;
      }
    },

    /**
     * Update a window via API
     */
    async updateWindow(windowId: string, token: string, updates: {
      x1?: number;
      y1?: number;
      x2?: number;
      y2?: number;
      wallShape?: 'straight' | 'curved';
      controlPoints?: Array<{ x: number; y: number }>;
      opacity?: number;
      tint?: string;
      tintIntensity?: number;
      snapToGrid?: boolean;
      data?: Record<string, unknown>;
    }): Promise<Window | null> {
      try {
        const response = await fetch(`/api/v1/windows/${windowId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update window: ${response.statusText}`);
        }

        const data = await response.json();
        const updatedWindow = data.window;

        // Update in store
        this.updateWindowLocal(windowId, updatedWindow);

        return updatedWindow;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          error: message,
        }));
        console.error('Failed to update window:', error);
        return null;
      }
    },

    /**
     * Delete a window via API
     */
    async deleteWindow(windowId: string, token: string): Promise<boolean> {
      try {
        const response = await fetch(`/api/v1/windows/${windowId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete window: ${response.statusText}`);
        }

        // Remove from store
        this.removeWindow(windowId);

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          error: message,
        }));
        console.error('Failed to delete window:', error);
        return false;
      }
    },

    /**
     * Add a window to the store (from WebSocket updates)
     */
    addWindow(window: Window): void {
      update(state => {
        const newWindows = new Map(state.windows);
        newWindows.set(window.id, window);
        return {
          ...state,
          windows: newWindows,
        };
      });
    },

    /**
     * Update a window with partial data (from WebSocket updates)
     */
    updateWindowLocal(windowId: string, updates: Partial<Window>): void {
      update(state => {
        const window = state.windows.get(windowId);
        if (!window) return state;

        const updatedWindow = { ...window, ...updates };
        const newWindows = new Map(state.windows);
        newWindows.set(windowId, updatedWindow);

        return {
          ...state,
          windows: newWindows,
        };
      });
    },

    /**
     * Remove a window from the store (from WebSocket updates)
     */
    removeWindow(windowId: string): void {
      update(state => {
        const newWindows = new Map(state.windows);
        newWindows.delete(windowId);

        const newSelectedWindowIds = new Set(state.selectedWindowIds);
        newSelectedWindowIds.delete(windowId);

        return {
          ...state,
          windows: newWindows,
          selectedWindowIds: newSelectedWindowIds,
        };
      });
    },

    /**
     * Select a single window (clears all other selections)
     */
    selectWindow(windowId: string | null): void {
      update(state => ({
        ...state,
        selectedWindowIds: windowId ? new Set([windowId]) : new Set<string>(),
      }));
    },

    /**
     * Toggle a window's selection state
     */
    toggleWindowSelection(windowId: string): void {
      update(state => {
        const newSelectedWindowIds = new Set(state.selectedWindowIds);
        if (newSelectedWindowIds.has(windowId)) {
          newSelectedWindowIds.delete(windowId);
        } else {
          newSelectedWindowIds.add(windowId);
        }
        return {
          ...state,
          selectedWindowIds: newSelectedWindowIds,
        };
      });
    },

    /**
     * Add a window to the current selection
     */
    addToWindowSelection(windowId: string): void {
      update(state => {
        const newSelectedWindowIds = new Set(state.selectedWindowIds);
        newSelectedWindowIds.add(windowId);
        return {
          ...state,
          selectedWindowIds: newSelectedWindowIds,
        };
      });
    },

    /**
     * Remove a window from the current selection
     */
    removeFromWindowSelection(windowId: string): void {
      update(state => {
        const newSelectedWindowIds = new Set(state.selectedWindowIds);
        newSelectedWindowIds.delete(windowId);
        return {
          ...state,
          selectedWindowIds: newSelectedWindowIds,
        };
      });
    },

    /**
     * Clear all selected windows
     */
    clearWindowSelection(): void {
      update(state => ({
        ...state,
        selectedWindowIds: new Set<string>(),
      }));
    },

    /**
     * Check if a window is currently selected
     */
    isWindowSelected(windowId: string, currentState: WindowsState): boolean {
      return currentState.selectedWindowIds.has(windowId);
    },

    /**
     * Get windows for a specific scene
     */
    getWindowsForScene(sceneId: string, currentState: WindowsState): Window[] {
      return Array.from(currentState.windows.values()).filter(window => window.sceneId === sceneId);
    },

    /**
     * Clear all windows (useful when switching scenes or leaving a game)
     */
    clear(): void {
      set({
        windows: new Map(),
        selectedWindowIds: new Set<string>(),
        loading: false,
        error: null,
      });
    },
  };
}

export const windowsStore = createWindowsStore();
