import { writable, get } from 'svelte/store';

const STORAGE_KEY = 'vtt-toolbar-state';

/**
 * Editor mode - Edit is for GM scene setup, Play is for active gameplay
 */
export type EditorMode = 'edit' | 'play';

/**
 * Toolbar state interface
 */
interface ToolbarState {
  collapsed: boolean;
  width: number;
  editorMode: EditorMode;
}

/**
 * Initial toolbar state
 */
const initialState: ToolbarState = {
  collapsed: false,
  width: 140,
  editorMode: 'edit',
};

/**
 * Load state from localStorage
 */
function loadState(): ToolbarState {
  if (typeof window === 'undefined') {
    return initialState;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return initialState;
    }

    const parsed = JSON.parse(stored);
    return {
      ...initialState,
      ...parsed,
    };
  } catch (error) {
    console.error('Failed to load toolbar state:', error);
    return initialState;
  }
}

/**
 * Save state to localStorage
 */
function saveState(state: ToolbarState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save toolbar state:', error);
  }
}

/**
 * Create the toolbar store
 */
function createToolbarStore() {
  const { subscribe, set, update } = writable<ToolbarState>(loadState());

  // Helper to update and persist state
  const updateAndSave = (updater: (state: ToolbarState) => ToolbarState) => {
    update(state => {
      const newState = updater(state);
      saveState(newState);
      return newState;
    });
  };

  return {
    subscribe,

    /**
     * Toggle toolbar collapsed state
     */
    toggleCollapse(): void {
      updateAndSave(state => ({
        ...state,
        collapsed: !state.collapsed,
      }));
    },

    /**
     * Set collapsed state explicitly
     */
    setCollapsed(collapsed: boolean): void {
      updateAndSave(state => ({
        ...state,
        collapsed,
      }));
    },

    /**
     * Set editor mode (edit or play)
     */
    setEditorMode(mode: EditorMode): void {
      updateAndSave(state => ({
        ...state,
        editorMode: mode,
      }));
    },

    /**
     * Toggle between edit and play modes
     */
    toggleEditorMode(): void {
      updateAndSave(state => ({
        ...state,
        editorMode: state.editorMode === 'edit' ? 'play' : 'edit',
      }));
    },

    /**
     * Update toolbar width
     */
    updateWidth(width: number): void {
      updateAndSave(state => ({
        ...state,
        width,
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
    getState(): ToolbarState {
      return get(toolbarStore);
    },
  };
}

// Export store instance
export const toolbarStore = createToolbarStore();

// Export types
export type { ToolbarState };
