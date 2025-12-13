import { writable, derived, type Readable } from 'svelte/store';
import type { FormDefinition, CampaignForm, FormExport, FormImportValidation } from '@vtt/shared';
import * as formsApi from '$lib/api/forms';

// ============================================================================
// Store State Types
// ============================================================================

interface FormsState {
  // Cached form definitions by ID
  forms: Map<string, FormDefinition>;

  // Forms by game system (for listing)
  formsBySystem: Map<string, string[]>;

  // Campaign form assignments
  campaignForms: Map<string, CampaignForm[]>;

  // Active form cache per campaign/entityType
  activeFormCache: Map<string, FormDefinition>;

  // Loading states
  loading: {
    forms: boolean;
    campaignForms: boolean;
    activeForm: boolean;
  };

  // Error state
  error: string | null;
}

const initialState: FormsState = {
  forms: new Map(),
  formsBySystem: new Map(),
  campaignForms: new Map(),
  activeFormCache: new Map(),
  loading: {
    forms: false,
    campaignForms: false,
    activeForm: false
  },
  error: null
};

// ============================================================================
// Create Store
// ============================================================================

function createFormsStore() {
  const { subscribe, update, set } = writable<FormsState>(initialState);

  return {
    subscribe,

    /**
     * Load forms for a game system
     */
    async loadFormsForSystem(systemId: string, entityType?: string): Promise<FormDefinition[]> {
      update(s => ({ ...s, loading: { ...s.loading, forms: true }, error: null }));

      try {
        const forms = await formsApi.listForms(systemId, entityType);

        update(s => {
          const newForms = new Map(s.forms);
          const systemFormIds: string[] = [];

          forms.forEach(form => {
            newForms.set(form.id, form);
            systemFormIds.push(form.id);
          });

          const newFormsBySystem = new Map(s.formsBySystem);
          newFormsBySystem.set(systemId, systemFormIds);

          return {
            ...s,
            forms: newForms,
            formsBySystem: newFormsBySystem,
            loading: { ...s.loading, forms: false }
          };
        });

        return forms;
      } catch (err) {
        update(s => ({
          ...s,
          loading: { ...s.loading, forms: false },
          error: err instanceof Error ? err.message : 'Failed to load forms'
        }));
        throw err;
      }
    },

    /**
     * Get a single form by ID
     */
    async getForm(formId: string): Promise<FormDefinition> {
      // Check cache first
      let cachedForm: FormDefinition | undefined;
      const unsub = subscribe(s => {
        cachedForm = s.forms.get(formId);
      });
      unsub();

      if (cachedForm) return cachedForm;

      // Fetch from API
      update(s => ({ ...s, loading: { ...s.loading, forms: true }, error: null }));

      try {
        const form = await formsApi.getForm(formId);

        update(s => {
          const newForms = new Map(s.forms);
          newForms.set(form.id, form);
          return {
            ...s,
            forms: newForms,
            loading: { ...s.loading, forms: false }
          };
        });

        return form;
      } catch (err) {
        update(s => ({
          ...s,
          loading: { ...s.loading, forms: false },
          error: err instanceof Error ? err.message : 'Failed to load form'
        }));
        throw err;
      }
    },

    /**
     * Create a new form
     */
    async createForm(systemId: string, request: Parameters<typeof formsApi.createForm>[1]): Promise<FormDefinition> {
      update(s => ({ ...s, error: null }));

      try {
        const form = await formsApi.createForm(systemId, request);

        update(s => {
          const newForms = new Map(s.forms);
          newForms.set(form.id, form);

          const newFormsBySystem = new Map(s.formsBySystem);
          const systemForms = newFormsBySystem.get(systemId) || [];
          newFormsBySystem.set(systemId, [...systemForms, form.id]);

          return { ...s, forms: newForms, formsBySystem: newFormsBySystem };
        });

        return form;
      } catch (err) {
        update(s => ({
          ...s,
          error: err instanceof Error ? err.message : 'Failed to create form'
        }));
        throw err;
      }
    },

    /**
     * Update a form
     */
    async updateForm(formId: string, updates: Parameters<typeof formsApi.updateForm>[1]): Promise<FormDefinition> {
      update(s => ({ ...s, error: null }));

      try {
        const form = await formsApi.updateForm(formId, updates);

        update(s => {
          const newForms = new Map(s.forms);
          newForms.set(form.id, form);
          return { ...s, forms: newForms };
        });

        return form;
      } catch (err) {
        update(s => ({
          ...s,
          error: err instanceof Error ? err.message : 'Failed to update form'
        }));
        throw err;
      }
    },

    /**
     * Delete a form
     */
    async deleteForm(formId: string): Promise<void> {
      update(s => ({ ...s, error: null }));

      try {
        await formsApi.deleteForm(formId);

        update(s => {
          const newForms = new Map(s.forms);
          newForms.delete(formId);

          // Remove from system lists
          const newFormsBySystem = new Map(s.formsBySystem);
          for (const [systemId, ids] of newFormsBySystem) {
            newFormsBySystem.set(systemId, ids.filter(id => id !== formId));
          }

          return { ...s, forms: newForms, formsBySystem: newFormsBySystem };
        });
      } catch (err) {
        update(s => ({
          ...s,
          error: err instanceof Error ? err.message : 'Failed to delete form'
        }));
        throw err;
      }
    },

    /**
     * Duplicate a form
     */
    async duplicateForm(formId: string, request: Parameters<typeof formsApi.duplicateForm>[1]): Promise<FormDefinition> {
      update(s => ({ ...s, error: null }));

      try {
        const form = await formsApi.duplicateForm(formId, request);

        update(s => {
          const newForms = new Map(s.forms);
          newForms.set(form.id, form);

          // Add to system list
          const newFormsBySystem = new Map(s.formsBySystem);
          const systemForms = newFormsBySystem.get(form.gameSystemId) || [];
          newFormsBySystem.set(form.gameSystemId, [...systemForms, form.id]);

          return { ...s, forms: newForms, formsBySystem: newFormsBySystem };
        });

        return form;
      } catch (err) {
        update(s => ({
          ...s,
          error: err instanceof Error ? err.message : 'Failed to duplicate form'
        }));
        throw err;
      }
    },

    /**
     * Get the active form for an entity type in a campaign
     */
    async getActiveForm(campaignId: string, entityType: string): Promise<FormDefinition | null> {
      const cacheKey = `${campaignId}:${entityType}`;

      // Check cache first
      let cachedForm: FormDefinition | undefined;
      const unsub = subscribe(s => {
        cachedForm = s.activeFormCache.get(cacheKey);
      });
      unsub();

      if (cachedForm) return cachedForm;

      // Fetch from API
      update(s => ({ ...s, loading: { ...s.loading, activeForm: true }, error: null }));

      try {
        const form = await formsApi.getActiveForm(campaignId, entityType);

        if (form) {
          update(s => {
            const newForms = new Map(s.forms);
            newForms.set(form.id, form);

            const newActiveFormCache = new Map(s.activeFormCache);
            newActiveFormCache.set(cacheKey, form);

            return {
              ...s,
              forms: newForms,
              activeFormCache: newActiveFormCache,
              loading: { ...s.loading, activeForm: false }
            };
          });
        } else {
          update(s => ({ ...s, loading: { ...s.loading, activeForm: false } }));
        }

        return form;
      } catch (err) {
        update(s => ({
          ...s,
          loading: { ...s.loading, activeForm: false },
          error: err instanceof Error ? err.message : 'Failed to load active form'
        }));
        throw err;
      }
    },

    /**
     * Invalidate active form cache
     */
    invalidateActiveFormCache(campaignId?: string, entityType?: string) {
      update(s => {
        const newCache = new Map(s.activeFormCache);

        if (campaignId && entityType) {
          newCache.delete(`${campaignId}:${entityType}`);
        } else if (campaignId) {
          for (const key of newCache.keys()) {
            if (key.startsWith(`${campaignId}:`)) {
              newCache.delete(key);
            }
          }
        } else {
          newCache.clear();
        }

        return { ...s, activeFormCache: newCache };
      });
    },

    /**
     * Export a form
     */
    async exportForm(formId: string): Promise<FormExport> {
      update(s => ({ ...s, error: null }));

      try {
        const exportData = await formsApi.exportForm(formId);
        return exportData;
      } catch (err) {
        update(s => ({
          ...s,
          error: err instanceof Error ? err.message : 'Failed to export form'
        }));
        throw err;
      }
    },

    /**
     * Import a form
     */
    async importForm(
      systemId: string,
      request: Parameters<typeof formsApi.importForm>[1]
    ): Promise<{ form: FormDefinition; validation: FormImportValidation }> {
      update(s => ({ ...s, error: null }));

      try {
        const result = await formsApi.importForm(systemId, request);

        update(s => {
          const newForms = new Map(s.forms);
          newForms.set(result.form.id, result.form);

          const newFormsBySystem = new Map(s.formsBySystem);
          const systemForms = newFormsBySystem.get(systemId) || [];
          newFormsBySystem.set(systemId, [...systemForms, result.form.id]);

          return { ...s, forms: newForms, formsBySystem: newFormsBySystem };
        });

        return result;
      } catch (err) {
        update(s => ({
          ...s,
          error: err instanceof Error ? err.message : 'Failed to import form'
        }));
        throw err;
      }
    },

    /**
     * Clear error
     */
    clearError() {
      update(s => ({ ...s, error: null }));
    },

    /**
     * Reset store to initial state
     */
    reset() {
      set(initialState);
    }
  };
}

// ============================================================================
// Export Store Instance
// ============================================================================

export const formsStore = createFormsStore();

// ============================================================================
// Derived Stores
// ============================================================================

/**
 * Get forms for a specific game system
 */
export function getFormsForSystem(systemId: string): Readable<FormDefinition[]> {
  return derived(formsStore, ($store) => {
    const formIds = $store.formsBySystem.get(systemId) || [];
    return formIds
      .map(id => $store.forms.get(id))
      .filter((f): f is FormDefinition => f !== undefined);
  });
}

/**
 * Is any forms operation loading?
 */
export const isLoading = derived(formsStore, ($store) =>
  $store.loading.forms || $store.loading.campaignForms || $store.loading.activeForm
);

/**
 * Current error
 */
export const formsError = derived(formsStore, ($store) => $store.error);
