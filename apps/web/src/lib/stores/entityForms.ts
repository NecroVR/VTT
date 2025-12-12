import { writable, derived, get } from 'svelte/store';
import type { ModuleEntity } from '@vtt/shared';

/**
 * Generate a unique ID using browser's crypto API
 * Falls back to timestamp + random for SSR
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for SSR/older browsers
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

const INITIAL_Z_INDEX = 2000;
const CASCADE_OFFSET = 20;

/**
 * Entity form state interface
 */
export interface EntityFormState {
  id: string;                    // Unique form instance ID (uuid)
  entityId: string;              // The module entity's UUID
  moduleId: string;              // The module containing the entity
  entityType: string;            // 'item', 'spell', 'monster', etc.
  title: string;                 // Window title (entity name)
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  minimized: boolean;
  isDerived: boolean;            // Is this a derived/campaign copy being created?
  entity: ModuleEntity;          // The full entity object for rendering forms
}

/**
 * Entity forms store state
 */
interface EntityFormsStoreState {
  forms: Map<string, EntityFormState>;
  highestZIndex: number;
}

/**
 * Get default size for entity type
 */
function getDefaultSize(entityType: string): { width: number; height: number } {
  const sizes: Record<string, { width: number; height: number }> = {
    item: { width: 450, height: 600 },
    spell: { width: 500, height: 700 },
    monster: { width: 600, height: 800 },
  };

  return sizes[entityType] || { width: 500, height: 600 };
}

/**
 * Calculate initial position for a new window
 * Centers in viewport with cascade offset
 */
function calculateInitialPosition(
  size: { width: number; height: number },
  existingFormsCount: number
): { x: number; y: number } {
  if (typeof window === 'undefined') {
    return { x: 100, y: 100 };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Center position
  const centerX = (viewportWidth - size.width) / 2;
  const centerY = (viewportHeight - size.height) / 2;

  // Apply cascade offset based on number of existing forms
  const offset = existingFormsCount * CASCADE_OFFSET;

  return {
    x: Math.max(0, centerX + offset),
    y: Math.max(0, centerY + offset),
  };
}

/**
 * Create the entity forms store
 */
function createEntityFormsStore() {
  const { subscribe, set, update } = writable<EntityFormsStoreState>({
    forms: new Map(),
    highestZIndex: INITIAL_Z_INDEX,
  });

  return {
    subscribe,

    /**
     * Open a new form for an entity
     * If already open, brings to front instead
     */
    openForm(
      entity: ModuleEntity,
      moduleId: string,
      isDerived: boolean = false
    ): string {
      let formId: string;

      update(state => {
        // Check if form already exists for this entity
        const existingForm = Array.from(state.forms.values()).find(
          f => f.entityId === entity.id && f.moduleId === moduleId && f.isDerived === isDerived
        );

        if (existingForm) {
          // Form already open - bring to front and restore if minimized
          formId = existingForm.id;
          const updatedForm = {
            ...existingForm,
            minimized: false,
            zIndex: state.highestZIndex + 1,
          };

          const newForms = new Map(state.forms);
          newForms.set(formId, updatedForm);

          return {
            ...state,
            forms: newForms,
            highestZIndex: state.highestZIndex + 1,
          };
        }

        // Create new form
        formId = generateId();
        const size = getDefaultSize(entity.entityType);
        const position = calculateInitialPosition(size, state.forms.size);

        const newForm: EntityFormState = {
          id: formId,
          entityId: entity.id,
          moduleId,
          entityType: entity.entityType,
          title: entity.name || 'Unnamed Entity',
          position,
          size,
          zIndex: state.highestZIndex + 1,
          minimized: false,
          isDerived,
          entity,
        };

        const newForms = new Map(state.forms);
        newForms.set(formId, newForm);

        return {
          ...state,
          forms: newForms,
          highestZIndex: state.highestZIndex + 1,
        };
      });

      return formId!;
    },

    /**
     * Close a form
     */
    closeForm(formId: string): void {
      update(state => {
        const newForms = new Map(state.forms);
        newForms.delete(formId);

        return {
          ...state,
          forms: newForms,
        };
      });
    },

    /**
     * Minimize a form
     */
    minimizeForm(formId: string): void {
      update(state => {
        const form = state.forms.get(formId);
        if (!form) return state;

        const updatedForm = { ...form, minimized: true };
        const newForms = new Map(state.forms);
        newForms.set(formId, updatedForm);

        return {
          ...state,
          forms: newForms,
        };
      });
    },

    /**
     * Restore a minimized form and bring to front
     */
    restoreForm(formId: string): void {
      update(state => {
        const form = state.forms.get(formId);
        if (!form) return state;

        const updatedForm = {
          ...form,
          minimized: false,
          zIndex: state.highestZIndex + 1,
        };
        const newForms = new Map(state.forms);
        newForms.set(formId, updatedForm);

        return {
          ...state,
          forms: newForms,
          highestZIndex: state.highestZIndex + 1,
        };
      });
    },

    /**
     * Bring a form to front
     */
    bringToFront(formId: string): void {
      update(state => {
        const form = state.forms.get(formId);
        if (!form) return state;

        const updatedForm = {
          ...form,
          zIndex: state.highestZIndex + 1,
        };
        const newForms = new Map(state.forms);
        newForms.set(formId, updatedForm);

        return {
          ...state,
          forms: newForms,
          highestZIndex: state.highestZIndex + 1,
        };
      });
    },

    /**
     * Update form position
     */
    updatePosition(formId: string, position: { x: number; y: number }): void {
      update(state => {
        const form = state.forms.get(formId);
        if (!form) return state;

        const updatedForm = { ...form, position };
        const newForms = new Map(state.forms);
        newForms.set(formId, updatedForm);

        return {
          ...state,
          forms: newForms,
        };
      });
    },

    /**
     * Update form size
     */
    updateSize(formId: string, size: { width: number; height: number }): void {
      update(state => {
        const form = state.forms.get(formId);
        if (!form) return state;

        const updatedForm = { ...form, size };
        const newForms = new Map(state.forms);
        newForms.set(formId, updatedForm);

        return {
          ...state,
          forms: newForms,
        };
      });
    },

    /**
     * Get all open (non-minimized) forms
     */
    getOpenForms(): EntityFormState[] {
      const state = get({ subscribe });
      return Array.from(state.forms.values()).filter(form => !form.minimized);
    },

    /**
     * Get all minimized forms
     */
    getMinimizedForms(): EntityFormState[] {
      const state = get({ subscribe });
      return Array.from(state.forms.values()).filter(form => form.minimized);
    },

    /**
     * Get a specific form
     */
    getForm(formId: string): EntityFormState | undefined {
      const state = get({ subscribe });
      return state.forms.get(formId);
    },

    /**
     * Clear all forms
     */
    clear(): void {
      set({
        forms: new Map(),
        highestZIndex: INITIAL_Z_INDEX,
      });
    },
  };
}

// Export store instance
export const entityFormsStore = createEntityFormsStore();

// Export derived store for minimized forms count (for badge display)
export const minimizedFormsCount = derived(
  entityFormsStore,
  $store => Array.from($store.forms.values()).filter(form => form.minimized).length
);

// Export derived store for all minimized forms
export const minimizedForms = derived(
  entityFormsStore,
  $store => Array.from($store.forms.values()).filter(form => form.minimized)
);

// Export derived store for all open forms
export const openForms = derived(
  entityFormsStore,
  $store => Array.from($store.forms.values()).filter(form => !form.minimized)
);

// Export individual action functions for convenience
export const {
  openForm,
  closeForm,
  minimizeForm,
  restoreForm,
  bringToFront,
  updatePosition,
  updateSize,
  getOpenForms,
  getMinimizedForms,
  getForm,
  clear,
} = entityFormsStore;
