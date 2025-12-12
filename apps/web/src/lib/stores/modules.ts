import { writable } from 'svelte/store';
import type {
  Module,
  ModuleEntity,
  ModuleEntityWithProperties,
  ModulesListResponse,
  ModuleEntitiesListResponse,
  ModuleEntityFullResponse,
  EntitySearchParams,
  AddModuleToCampaignInput,
  CampaignModule,
} from '@vtt/shared';
import { browser } from '$app/environment';
import { API_BASE_URL } from '$lib/config/api';

interface ModulesState {
  modules: Map<string, Module>;
  entities: Map<string, ModuleEntity>;
  campaignModules: Map<string, CampaignModule[]>; // campaignId -> modules
  selectedModuleId: string | null;
  loading: boolean;
  error: string | null;
}

function createModulesStore() {
  const { subscribe, set, update } = writable<ModulesState>({
    modules: new Map(),
    entities: new Map(),
    campaignModules: new Map(),
    selectedModuleId: null,
    loading: false,
    error: null,
  });

  // Helper to get auth token
  function getAuthToken(): string | null {
    if (!browser) return null;
    return localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');
  }

  // Helper for fetch with auth
  async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  return {
    subscribe,

    /**
     * Load all available modules
     */
    async loadModules(gameSystemId?: string): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const queryParam = gameSystemId ? `?gameSystemId=${encodeURIComponent(gameSystemId)}` : '';
        const response = await authFetch(`${API_BASE_URL}/api/v1/modules${queryParam}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch modules: ${response.statusText}`);
        }

        const data: ModulesListResponse = await response.json();
        const modules = new Map<string, Module>();

        if (data.modules && Array.isArray(data.modules)) {
          data.modules.forEach((module: Module) => {
            modules.set(module.id, module);
          });
        }

        update(state => ({
          ...state,
          modules,
          loading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load modules';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error loading modules:', error);
      }
    },

    /**
     * Load modules for a specific campaign
     */
    async loadCampaignModules(campaignId: string): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await authFetch(`${API_BASE_URL}/api/v1/campaigns/${campaignId}/modules`);

        if (!response.ok) {
          throw new Error(`Failed to fetch campaign modules: ${response.statusText}`);
        }

        const data = await response.json();
        const campaignModules: CampaignModule[] = data.campaignModules || [];

        update(state => {
          const newCampaignModules = new Map(state.campaignModules);
          newCampaignModules.set(campaignId, campaignModules);

          // Also update modules map with loaded modules
          const modules = new Map(state.modules);
          if (data.modules && Array.isArray(data.modules)) {
            data.modules.forEach((module: Module) => {
              modules.set(module.id, module);
            });
          }

          return {
            ...state,
            modules,
            campaignModules: newCampaignModules,
            loading: false,
          };
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load campaign modules';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error loading campaign modules:', error);
      }
    },

    /**
     * Add a module to a campaign
     */
    async addModuleToCampaign(
      campaignId: string,
      input: AddModuleToCampaignInput
    ): Promise<CampaignModule | null> {
      if (!browser) return null;

      try {
        const response = await authFetch(
          `${API_BASE_URL}/api/v1/campaigns/${campaignId}/modules`,
          {
            method: 'POST',
            body: JSON.stringify(input),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to add module to campaign: ${response.statusText}`);
        }

        const result = await response.json();
        const campaignModule: CampaignModule = result.campaignModule;

        update(state => {
          const newCampaignModules = new Map(state.campaignModules);
          const existing = newCampaignModules.get(campaignId) || [];
          newCampaignModules.set(campaignId, [...existing, campaignModule]);

          return {
            ...state,
            campaignModules: newCampaignModules,
          };
        });

        return campaignModule;
      } catch (error) {
        console.error('Error adding module to campaign:', error);
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to add module to campaign',
        }));
        return null;
      }
    },

    /**
     * Remove a module from a campaign
     */
    async removeModuleFromCampaign(
      campaignId: string,
      campaignModuleId: string
    ): Promise<boolean> {
      if (!browser) return false;

      try {
        const response = await authFetch(
          `${API_BASE_URL}/api/v1/campaigns/${campaignId}/modules/${campaignModuleId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to remove module from campaign: ${response.statusText}`);
        }

        update(state => {
          const newCampaignModules = new Map(state.campaignModules);
          const existing = newCampaignModules.get(campaignId) || [];
          newCampaignModules.set(
            campaignId,
            existing.filter(cm => cm.id !== campaignModuleId)
          );

          return {
            ...state,
            campaignModules: newCampaignModules,
          };
        });

        return true;
      } catch (error) {
        console.error('Error removing module from campaign:', error);
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to remove module from campaign',
        }));
        return false;
      }
    },

    /**
     * Load entities for a module
     */
    async loadModuleEntities(
      moduleId: string,
      params?: EntitySearchParams
    ): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        if (params?.entityType) {
          if (Array.isArray(params.entityType)) {
            params.entityType.forEach(type => queryParams.append('entityType', type));
          } else {
            queryParams.append('entityType', params.entityType);
          }
        }
        if (params?.validationStatus) {
          queryParams.append('validationStatus', params.validationStatus);
        }
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const queryString = queryParams.toString();
        const url = `${API_BASE_URL}/api/v1/modules/${moduleId}/entities${queryString ? `?${queryString}` : ''}`;
        const response = await authFetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch module entities: ${response.statusText}`);
        }

        const data: ModuleEntitiesListResponse = await response.json();
        const entities = new Map<string, ModuleEntity>();

        if (data.entities && Array.isArray(data.entities)) {
          data.entities.forEach((entity: ModuleEntity) => {
            entities.set(entity.id, entity);
          });
        }

        update(state => ({
          ...state,
          entities,
          selectedModuleId: moduleId,
          loading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load module entities';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error loading module entities:', error);
      }
    },

    /**
     * Get full entity with properties
     */
    async getEntityWithProperties(
      moduleId: string,
      entityId: string
    ): Promise<ModuleEntityWithProperties | null> {
      if (!browser) return null;

      try {
        const response = await authFetch(
          `${API_BASE_URL}/api/v1/modules/${moduleId}/entities/${entityId}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch entity: ${response.statusText}`);
        }

        const data: ModuleEntityFullResponse = await response.json();
        return data.entity;
      } catch (error) {
        console.error('Error loading entity with properties:', error);
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to load entity',
        }));
        return null;
      }
    },

    /**
     * Search entities in a module
     */
    async searchEntities(
      moduleId: string,
      params: EntitySearchParams
    ): Promise<ModuleEntity[]> {
      if (!browser) return [];

      try {
        const queryParams = new URLSearchParams();
        if (params.query) queryParams.append('query', params.query);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        if (params.entityType) {
          if (Array.isArray(params.entityType)) {
            params.entityType.forEach(type => queryParams.append('entityType', type));
          } else {
            queryParams.append('entityType', params.entityType);
          }
        }
        if (params.tags && params.tags.length > 0) {
          params.tags.forEach(tag => queryParams.append('tags', tag));
        }
        if (params.validationStatus) {
          queryParams.append('validationStatus', params.validationStatus);
        }
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await authFetch(
          `${API_BASE_URL}/api/v1/modules/${moduleId}/entities/search?${queryParams.toString()}`
        );

        if (!response.ok) {
          throw new Error(`Failed to search entities: ${response.statusText}`);
        }

        const data: ModuleEntitiesListResponse = await response.json();
        return data.entities || [];
      } catch (error) {
        console.error('Error searching entities:', error);
        return [];
      }
    },

    /**
     * Select a module
     */
    selectModule(moduleId: string | null): void {
      update(state => ({
        ...state,
        selectedModuleId: moduleId,
      }));
    },

    /**
     * Add a module to the store (from WebSocket event)
     */
    addModule(module: Module): void {
      update(state => {
        const newModules = new Map(state.modules);
        newModules.set(module.id, module);
        return {
          ...state,
          modules: newModules,
        };
      });
    },

    /**
     * Update a module in the store (from WebSocket event)
     */
    updateModuleLocal(moduleId: string, updates: Partial<Module>): void {
      update(state => {
        const module = state.modules.get(moduleId);
        if (!module) return state;

        const updatedModule = { ...module, ...updates };
        const newModules = new Map(state.modules);
        newModules.set(moduleId, updatedModule);

        return {
          ...state,
          modules: newModules,
        };
      });
    },

    /**
     * Remove a module from the store (from WebSocket event)
     */
    removeModule(moduleId: string): void {
      update(state => {
        const newModules = new Map(state.modules);
        newModules.delete(moduleId);

        const selectedModuleId = state.selectedModuleId === moduleId
          ? null
          : state.selectedModuleId;

        return {
          ...state,
          modules: newModules,
          selectedModuleId,
        };
      });
    },

    /**
     * Add an entity to the store (from WebSocket event)
     */
    addEntity(entity: ModuleEntity): void {
      update(state => {
        const newEntities = new Map(state.entities);
        newEntities.set(entity.id, entity);
        return {
          ...state,
          entities: newEntities,
        };
      });
    },

    /**
     * Update an entity in the store (from WebSocket event)
     */
    updateEntityLocal(entityId: string, updates: Partial<ModuleEntity>): void {
      update(state => {
        const entity = state.entities.get(entityId);
        if (!entity) return state;

        const updatedEntity = { ...entity, ...updates };
        const newEntities = new Map(state.entities);
        newEntities.set(entityId, updatedEntity);

        return {
          ...state,
          entities: newEntities,
        };
      });
    },

    /**
     * Remove an entity from the store (from WebSocket event)
     */
    removeEntity(entityId: string): void {
      update(state => {
        const newEntities = new Map(state.entities);
        newEntities.delete(entityId);

        return {
          ...state,
          entities: newEntities,
        };
      });
    },

    /**
     * Clear all data (useful when leaving a campaign)
     */
    clear(): void {
      set({
        modules: new Map(),
        entities: new Map(),
        campaignModules: new Map(),
        selectedModuleId: null,
        loading: false,
        error: null,
      });
    },
  };
}

export const modulesStore = createModulesStore();
