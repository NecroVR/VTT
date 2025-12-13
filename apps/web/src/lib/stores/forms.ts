import { writable, derived, type Readable } from 'svelte/store';
import type { FormDefinition, CampaignForm, FormExport, FormImportValidation } from '@vtt/shared';
import * as formsApi from '$lib/api/forms';
import { LRUCache } from '$lib/utils/lruCache';

// ============================================================================
// Store State Types
// ============================================================================

interface CachedForm {
  data: FormDefinition;
  timestamp: number;
}

// Cache TTL: 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000;

// LRU Cache for form definitions (max 100 forms, 5 min TTL)
const formDefCache = new LRUCache<string, FormDefinition>(100, CACHE_TTL_MS);
const activeFormCache = new LRUCache<string, FormDefinition>(50, CACHE_TTL_MS);

interface FormsState {
  // Cached form definitions by ID with TTL
  forms: Map<string, CachedForm>;

  // Forms by game system (for listing)
  formsBySystem: Map<string, string[]>;

  // Campaign form assignments
  campaignForms: Map<string, CampaignForm[]>;

  // Active form cache per campaign/entityType with TTL
  activeFormCache: Map<string, CachedForm>;

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
// Helper Functions
// ============================================================================

/**
 * Check if a cached form is still valid (not expired)
 */
function isCacheValid(cached: CachedForm | undefined): boolean {
  if (!cached) return false;
  const age = Date.now() - cached.timestamp;
  return age < CACHE_TTL_MS;
}

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
          const now = Date.now();

          forms.forEach(form => {
            newForms.set(form.id, { data: form, timestamp: now });
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
      // Check LRU cache first
      const cachedForm = formDefCache.get(formId);
      if (cachedForm) {
        return cachedForm;
      }

      // Check store cache as fallback
      let cached: CachedForm | undefined;
      const unsub = subscribe(s => {
        cached = s.forms.get(formId);
      });
      unsub();

      // Return cached if valid
      if (isCacheValid(cached)) {
        // Update LRU cache
        formDefCache.set(formId, cached!.data);
        return cached!.data;
      }

      // Fetch from API
      update(s => ({ ...s, loading: { ...s.loading, forms: true }, error: null }));

      try {
        const form = await formsApi.getForm(formId);

        // Update both caches
        formDefCache.set(form.id, form);

        update(s => {
          const newForms = new Map(s.forms);
          newForms.set(form.id, { data: form, timestamp: Date.now() });
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
          newForms.set(form.id, { data: form, timestamp: Date.now() });

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
          newForms.set(form.id, { data: form, timestamp: Date.now() });
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
          newForms.set(form.id, { data: form, timestamp: Date.now() });

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

      // Check LRU cache first
      const cachedActiveForm = activeFormCache.get(cacheKey);
      if (cachedActiveForm) {
        return cachedActiveForm;
      }

      // Check store cache as fallback
      let cached: CachedForm | undefined;
      const unsub = subscribe(s => {
        cached = s.activeFormCache.get(cacheKey);
      });
      unsub();

      // Return cached if valid
      if (isCacheValid(cached)) {
        // Update LRU cache
        activeFormCache.set(cacheKey, cached!.data);
        return cached!.data;
      }

      // Fetch from API
      update(s => ({ ...s, loading: { ...s.loading, activeForm: true }, error: null }));

      try {
        const form = await formsApi.getActiveForm(campaignId, entityType);

        if (form) {
          const now = Date.now();

          // Update LRU caches
          activeFormCache.set(cacheKey, form);
          formDefCache.set(form.id, form);

          update(s => {
            const newForms = new Map(s.forms);
            newForms.set(form.id, { data: form, timestamp: now });

            const newActiveFormCache = new Map(s.activeFormCache);
            newActiveFormCache.set(cacheKey, { data: form, timestamp: now });

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
      // Invalidate LRU cache
      if (campaignId && entityType) {
        activeFormCache.delete(`${campaignId}:${entityType}`);
      } else if (campaignId) {
        // Clear all entries for this campaign from LRU cache
        const keys = activeFormCache.keys();
        for (const key of keys) {
          if (key.startsWith(`${campaignId}:`)) {
            activeFormCache.delete(key);
          }
        }
      } else {
        activeFormCache.clear();
      }

      // Invalidate store cache
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
          newForms.set(result.form.id, { data: result.form, timestamp: Date.now() });

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
     * Save a form as a template
     */
    async saveAsTemplate(
      formId: string,
      templateName: string,
      description?: string
    ): Promise<FormDefinition> {
      update(s => ({ ...s, error: null }));

      try {
        // Get the source form
        const sourceForm = await this.getForm(formId);

        // Create a new form as a template (duplicate with template metadata)
        const templateForm = await formsApi.duplicateForm(formId, {
          name: `[Template] ${templateName}`,
          description: description || `Template: ${templateName}`
        });

        update(s => {
          const newForms = new Map(s.forms);
          newForms.set(templateForm.id, { data: templateForm, timestamp: Date.now() });

          const newFormsBySystem = new Map(s.formsBySystem);
          const systemForms = newFormsBySystem.get(templateForm.gameSystemId) || [];
          newFormsBySystem.set(templateForm.gameSystemId, [...systemForms, templateForm.id]);

          return { ...s, forms: newForms, formsBySystem: newFormsBySystem };
        });

        return templateForm;
      } catch (err) {
        update(s => ({
          ...s,
          error: err instanceof Error ? err.message : 'Failed to save template'
        }));
        throw err;
      }
    },

    /**
     * Create a new form from a template
     */
    async createFromTemplate(
      templateId: string,
      newName: string,
      systemId?: string
    ): Promise<FormDefinition> {
      update(s => ({ ...s, error: null }));

      try {
        // Duplicate the template
        const newForm = await formsApi.duplicateForm(templateId, {
          name: newName,
          description: undefined // Clear template description
        });

        update(s => {
          const newForms = new Map(s.forms);
          newForms.set(newForm.id, { data: newForm, timestamp: Date.now() });

          const newFormsBySystem = new Map(s.formsBySystem);
          const systemForms = newFormsBySystem.get(newForm.gameSystemId) || [];
          newFormsBySystem.set(newForm.gameSystemId, [...systemForms, newForm.id]);

          return { ...s, forms: newForms, formsBySystem: newFormsBySystem };
        });

        return newForm;
      } catch (err) {
        update(s => ({
          ...s,
          error: err instanceof Error ? err.message : 'Failed to create from template'
        }));
        throw err;
      }
    },

    /**
     * List all templates for a game system
     * Includes both built-in templates (from JSON files) and user-created templates
     */
    async listTemplates(systemId?: string, entityType?: string): Promise<FormDefinition[]> {
      update(s => ({ ...s, loading: { ...s.loading, forms: true }, error: null }));

      try {
        // Load built-in templates from JSON files
        const builtInTemplates: FormDefinition[] = [];

        // Import built-in templates
        try {
          const basicCharacter = await import('$lib/templates/basic-character.template.json');
          const itemCard = await import('$lib/templates/item-card.template.json');
          const statBlock = await import('$lib/templates/stat-block.template.json');

          const templateExports = [basicCharacter.default, itemCard.default, statBlock.default];

          // Convert template exports to FormDefinition
          templateExports.forEach((exportData: any, index: number) => {
            if (exportData && exportData.form) {
              const form: FormDefinition = {
                id: `builtin-template-${index}`,
                name: exportData.form.name,
                description: exportData.form.description,
                gameSystemId: systemId || 'generic',
                entityType: exportData.form.entityType,
                version: exportData.form.version,
                isDefault: false,
                isLocked: true, // Built-in templates are locked
                visibility: 'public',
                ownerId: 'system',
                layout: exportData.form.layout,
                fragments: exportData.form.fragments || [],
                styles: exportData.form.styles,
                computedFields: exportData.form.computedFields || [],
                scripts: exportData.form.scripts,
                createdAt: new Date(exportData.exportedAt),
                updatedAt: new Date(exportData.exportedAt)
              };

              // Filter by entity type if specified
              if (!entityType || form.entityType === entityType) {
                builtInTemplates.push(form);
              }
            }
          });
        } catch (importErr) {
          console.warn('Failed to load built-in templates:', importErr);
        }

        // Load user-created templates from API
        const userTemplates: FormDefinition[] = [];
        if (systemId) {
          const allForms = await formsApi.listForms(systemId, entityType);
          // Filter forms that are templates (name starts with [Template])
          const templates = allForms.filter(f => f.name.startsWith('[Template]'));
          userTemplates.push(...templates);
        }

        // Combine built-in and user templates
        const allTemplates = [...builtInTemplates, ...userTemplates];

        update(s => {
          const newForms = new Map(s.forms);
          allTemplates.forEach(template => {
            newForms.set(template.id, { data: template, timestamp: Date.now() });
          });

          return {
            ...s,
            forms: newForms,
            loading: { ...s.loading, forms: false }
          };
        });

        return allTemplates;
      } catch (err) {
        update(s => ({
          ...s,
          loading: { ...s.loading, forms: false },
          error: err instanceof Error ? err.message : 'Failed to load templates'
        }));
        throw err;
      }
    },

    /**
     * Delete a user-created template (cannot delete built-in templates)
     */
    async deleteTemplate(templateId: string): Promise<void> {
      // Check if it's a built-in template
      if (templateId.startsWith('builtin-template-')) {
        throw new Error('Cannot delete built-in templates');
      }

      // Use the regular delete form method
      return this.deleteForm(templateId);
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
      .filter((cached): cached is CachedForm => cached !== undefined && isCacheValid(cached))
      .map(cached => cached.data);
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
