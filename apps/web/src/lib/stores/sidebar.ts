import { writable, get } from 'svelte/store';

const STORAGE_KEY = 'vtt-sidebar-state';
const INITIAL_Z_INDEX = 1000;

/**
 * Main sidebar state interface
 */
interface SidebarState {
  docked: boolean;
  collapsed: boolean;
  dockedWidth: number;
  floatingPosition: { x: number; y: number };
  floatingSize: { width: number; height: number };
  activeTabId: string;
  poppedOutTabs: Set<string>;
  highestZIndex: number;
}

/**
 * Floating window state interface
 */
export interface FloatingWindowState {
  id: string;
  tabId: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  minimized: boolean;
}

/**
 * Initial sidebar state
 */
const initialState: SidebarState = {
  docked: true,
  collapsed: false,
  dockedWidth: 350,
  floatingPosition: { x: 20, y: 20 },
  floatingSize: { width: 350, height: 600 },
  activeTabId: 'chat',
  poppedOutTabs: new Set<string>(),
  highestZIndex: INITIAL_Z_INDEX,
};

/**
 * Load state from localStorage
 */
function loadState(): SidebarState {
  if (typeof window === 'undefined') {
    return initialState;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return initialState;
    }

    const parsed = JSON.parse(stored);

    // Convert poppedOutTabs array back to Set
    return {
      ...initialState,
      ...parsed,
      poppedOutTabs: new Set(parsed.poppedOutTabs || []),
    };
  } catch (error) {
    console.error('Failed to load sidebar state:', error);
    return initialState;
  }
}

/**
 * Save state to localStorage
 */
function saveState(state: SidebarState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Convert Set to array for JSON serialization
    const toSave = {
      ...state,
      poppedOutTabs: Array.from(state.poppedOutTabs),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('Failed to save sidebar state:', error);
  }
}

/**
 * Create the sidebar store
 */
function createSidebarStore() {
  const { subscribe, set, update } = writable<SidebarState>(loadState());

  // Helper to update and persist state
  const updateAndSave = (updater: (state: SidebarState) => SidebarState) => {
    update(state => {
      const newState = updater(state);
      saveState(newState);
      return newState;
    });
  };

  return {
    subscribe,

    /**
     * Toggle between docked and floating modes
     */
    toggleDock(): void {
      updateAndSave(state => ({
        ...state,
        docked: !state.docked,
      }));
    },

    /**
     * Toggle sidebar collapsed state (only works when docked)
     */
    toggleCollapse(): void {
      updateAndSave(state => ({
        ...state,
        collapsed: !state.collapsed,
      }));
    },

    /**
     * Set the active tab
     */
    setActiveTab(tabId: string): void {
      updateAndSave(state => ({
        ...state,
        activeTabId: tabId,
      }));
    },

    /**
     * Pop out a tab into a floating window
     */
    popOutTab(tabId: string): void {
      updateAndSave(state => {
        const newPoppedOutTabs = new Set(state.poppedOutTabs);
        newPoppedOutTabs.add(tabId);

        return {
          ...state,
          poppedOutTabs: newPoppedOutTabs,
          highestZIndex: state.highestZIndex + 1,
        };
      });
    },

    /**
     * Dock a popped-out window back into the sidebar
     */
    dockPopOutWindow(tabId: string): void {
      updateAndSave(state => {
        const newPoppedOutTabs = new Set(state.poppedOutTabs);
        newPoppedOutTabs.delete(tabId);

        return {
          ...state,
          poppedOutTabs: newPoppedOutTabs,
        };
      });
    },

    /**
     * Bring a window to front by incrementing z-index
     */
    bringToFront(windowId: string): void {
      updateAndSave(state => ({
        ...state,
        highestZIndex: state.highestZIndex + 1,
      }));

      // Update the specific floating window's z-index
      floatingWindows.update(windows => {
        const window = windows.get(windowId);
        if (window) {
          window.zIndex = get(sidebarStore).highestZIndex;
          windows.set(windowId, window);
        }
        return new Map(windows);
      });
    },

    /**
     * Update floating sidebar position
     */
    updateFloatingPosition(x: number, y: number): void {
      updateAndSave(state => ({
        ...state,
        floatingPosition: { x, y },
      }));
    },

    /**
     * Update floating sidebar size
     */
    updateFloatingSize(width: number, height: number): void {
      updateAndSave(state => ({
        ...state,
        floatingSize: { width, height },
      }));
    },

    /**
     * Update docked sidebar width
     */
    updateDockedWidth(width: number): void {
      updateAndSave(state => ({
        ...state,
        dockedWidth: width,
      }));
    },

    /**
     * Reset to initial state
     */
    reset(): void {
      set(initialState);
      saveState(initialState);
    },

    /**
     * Get current state (useful for non-reactive contexts)
     */
    getState(): SidebarState {
      return get(sidebarStore);
    },
  };
}

/**
 * Create the floating windows store
 */
function createFloatingWindowsStore() {
  const { subscribe, set, update } = writable<Map<string, FloatingWindowState>>(new Map());

  return {
    subscribe,

    /**
     * Add or update a floating window
     */
    addWindow(window: FloatingWindowState): void {
      update(windows => {
        windows.set(window.id, window);
        return new Map(windows);
      });
    },

    /**
     * Remove a floating window
     */
    removeWindow(windowId: string): void {
      update(windows => {
        windows.delete(windowId);
        return new Map(windows);
      });
    },

    /**
     * Update window position
     */
    updatePosition(windowId: string, x: number, y: number): void {
      update(windows => {
        const window = windows.get(windowId);
        if (window) {
          window.position = { x, y };
          windows.set(windowId, window);
        }
        return new Map(windows);
      });
    },

    /**
     * Update window size
     */
    updateSize(windowId: string, width: number, height: number): void {
      update(windows => {
        const window = windows.get(windowId);
        if (window) {
          window.size = { width, height };
          windows.set(windowId, window);
        }
        return new Map(windows);
      });
    },

    /**
     * Update window z-index
     */
    updateZIndex(windowId: string, zIndex: number): void {
      update(windows => {
        const window = windows.get(windowId);
        if (window) {
          window.zIndex = zIndex;
          windows.set(windowId, window);
        }
        return new Map(windows);
      });
    },

    /**
     * Toggle window minimized state
     */
    toggleMinimized(windowId: string): void {
      update(windows => {
        const window = windows.get(windowId);
        if (window) {
          window.minimized = !window.minimized;
          windows.set(windowId, window);
        }
        return new Map(windows);
      });
    },

    /**
     * Clear all floating windows
     */
    clear(): void {
      set(new Map());
    },

    /**
     * Get a specific window (useful for non-reactive contexts)
     */
    getWindow(windowId: string): FloatingWindowState | undefined {
      return get(floatingWindows).get(windowId);
    },
  };
}

// Export store instances
export const sidebarStore = createSidebarStore();
export const floatingWindows = createFloatingWindowsStore();

// Export types
export type { SidebarState };

// Export individual action functions for convenience
export const {
  toggleDock,
  toggleCollapse,
  setActiveTab,
  popOutTab,
  dockPopOutWindow,
  bringToFront,
  updateFloatingPosition,
  updateFloatingSize,
  updateDockedWidth,
} = sidebarStore;
