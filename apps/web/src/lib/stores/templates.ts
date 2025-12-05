import { writable } from 'svelte/store';
import type { MeasurementTemplate, RulerMeasurement, CreateTemplateRequest, UpdateTemplateRequest } from '@vtt/shared';
import { browser } from '$app/environment';
import { API_BASE_URL } from '$lib/config/api';

interface TemplatesState {
  templates: Map<string, MeasurementTemplate>;
  activeRuler: RulerMeasurement | null;
  selectedTemplateId: string | null;
  loading: boolean;
  error: string | null;
}

function createTemplatesStore() {
  const { subscribe, set, update } = writable<TemplatesState>({
    templates: new Map(),
    activeRuler: null,
    selectedTemplateId: null,
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load templates for a scene from the API
     */
    async loadTemplates(sceneId: string): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/templates`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch templates: ${response.statusText}`);
        }

        const data = await response.json();
        const templates = new Map<string, MeasurementTemplate>();

        if (data.templates && Array.isArray(data.templates)) {
          data.templates.forEach((template: MeasurementTemplate) => {
            // Convert date strings to Date objects
            template.createdAt = new Date(template.createdAt);
            templates.set(template.id, template);
          });
        }

        update(state => ({
          ...state,
          templates,
          loading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load templates';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error loading templates:', error);
      }
    },

    /**
     * Create a new template via API
     */
    async createTemplate(request: CreateTemplateRequest): Promise<MeasurementTemplate | null> {
      if (!browser) return null;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${request.sceneId}/templates`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`Failed to create template: ${response.statusText}`);
        }

        const data = await response.json();
        const template = data.template as MeasurementTemplate;
        template.createdAt = new Date(template.createdAt);

        // Add to store
        update(state => {
          const newTemplates = new Map(state.templates);
          newTemplates.set(template.id, template);
          return {
            ...state,
            templates: newTemplates,
          };
        });

        return template;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create template';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
        console.error('Error creating template:', error);
        return null;
      }
    },

    /**
     * Update a template via API
     */
    async updateTemplate(sceneId: string, templateId: string, updates: UpdateTemplateRequest): Promise<void> {
      if (!browser) return;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/templates/${templateId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update template: ${response.statusText}`);
        }

        const data = await response.json();
        const template = data.template as MeasurementTemplate;
        template.createdAt = new Date(template.createdAt);

        // Update in store
        update(state => {
          const newTemplates = new Map(state.templates);
          newTemplates.set(template.id, template);
          return {
            ...state,
            templates: newTemplates,
          };
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update template';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
        console.error('Error updating template:', error);
      }
    },

    /**
     * Delete a template via API
     */
    async deleteTemplate(sceneId: string, templateId: string): Promise<void> {
      if (!browser) return;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/templates/${templateId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete template: ${response.statusText}`);
        }

        // Remove from store
        update(state => {
          const newTemplates = new Map(state.templates);
          newTemplates.delete(templateId);
          return {
            ...state,
            templates: newTemplates,
            selectedTemplateId: state.selectedTemplateId === templateId ? null : state.selectedTemplateId,
          };
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete template';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
        console.error('Error deleting template:', error);
      }
    },

    /**
     * Add a template to the store (from WebSocket event)
     */
    addTemplate(template: MeasurementTemplate): void {
      update(state => {
        const newTemplates = new Map(state.templates);
        newTemplates.set(template.id, template);
        return {
          ...state,
          templates: newTemplates,
        };
      });
    },

    /**
     * Update a template in the store (from WebSocket event)
     */
    updateTemplateLocal(templateId: string, updates: Partial<MeasurementTemplate>): void {
      update(state => {
        const template = state.templates.get(templateId);
        if (!template) return state;

        const updatedTemplate = { ...template, ...updates };
        const newTemplates = new Map(state.templates);
        newTemplates.set(templateId, updatedTemplate);

        return {
          ...state,
          templates: newTemplates,
        };
      });
    },

    /**
     * Remove a template from the store (from WebSocket event)
     */
    removeTemplate(templateId: string): void {
      update(state => {
        const newTemplates = new Map(state.templates);
        newTemplates.delete(templateId);

        return {
          ...state,
          templates: newTemplates,
          selectedTemplateId: state.selectedTemplateId === templateId ? null : state.selectedTemplateId,
        };
      });
    },

    /**
     * Select a template
     */
    selectTemplate(templateId: string | null): void {
      update(state => ({
        ...state,
        selectedTemplateId: templateId,
      }));
    },

    /**
     * Set active ruler measurement (client-side only)
     */
    setActiveRuler(ruler: RulerMeasurement | null): void {
      update(state => ({
        ...state,
        activeRuler: ruler,
      }));
    },

    /**
     * Add waypoint to active ruler
     */
    addRulerWaypoint(x: number, y: number): void {
      update(state => {
        if (!state.activeRuler) return state;

        const newWaypoints = [...state.activeRuler.waypoints, { x, y }];
        return {
          ...state,
          activeRuler: {
            ...state.activeRuler,
            waypoints: newWaypoints,
          },
        };
      });
    },

    /**
     * Update last waypoint of active ruler
     */
    updateLastRulerWaypoint(x: number, y: number): void {
      update(state => {
        if (!state.activeRuler || state.activeRuler.waypoints.length === 0) return state;

        const newWaypoints = [...state.activeRuler.waypoints];
        newWaypoints[newWaypoints.length - 1] = { x, y };
        return {
          ...state,
          activeRuler: {
            ...state.activeRuler,
            waypoints: newWaypoints,
          },
        };
      });
    },

    /**
     * Get templates for a specific scene
     */
    getTemplatesForScene(sceneId: string, currentState: TemplatesState): MeasurementTemplate[] {
      return Array.from(currentState.templates.values()).filter(template => template.sceneId === sceneId);
    },

    /**
     * Clear all templates and rulers (useful when switching scenes or leaving a game)
     */
    clear(): void {
      set({
        templates: new Map(),
        activeRuler: null,
        selectedTemplateId: null,
        loading: false,
        error: null,
      });
    },
  };
}

export const templatesStore = createTemplatesStore();
