import { writable } from 'svelte/store';
import type { Asset, AssetType } from '@vtt/shared';
import { API_BASE_URL } from '$lib/config/api';


interface AssetsState {
  assets: Map<string, Asset>;
  loading: boolean;
  error: string | null;
}

interface UploadOptions {
  assetType?: AssetType;
  campaignId?: string;
  name?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface LoadAssetsFilters {
  assetType?: AssetType;
  campaignId?: string;
  search?: string;
}

function createAssetsStore() {
  const { subscribe, set, update } = writable<AssetsState>({
    assets: new Map(),
    loading: false,
    error: null,
  });

  /**
   * Get auth token from localStorage
   */
  function getAuthToken(): string | null {
    return localStorage.getItem('vtt_session_id');
  }

  return {
    subscribe,

    /**
     * Load assets with optional filters
     */
    async loadAssets(filters?: LoadAssetsFilters): Promise<void> {
      update(state => ({ ...state, loading: true, error: null }));

      const token = getAuthToken();
      if (!token) {
        update(state => ({
          ...state,
          loading: false,
          error: 'Not authenticated',
        }));
        return;
      }

      try {
        // Build query string
        const params = new URLSearchParams();
        if (filters?.assetType) {
          params.append('assetType', filters.assetType);
        }
        if (filters?.campaignId) {
          params.append('campaignId', filters.campaignId);
        }
        if (filters?.search) {
          params.append('search', filters.search);
        }

        const queryString = params.toString();
        const url = `${API_BASE_URL}/api/v1/assets${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch assets: ${response.statusText}`);
        }

        const data = await response.json();
        const assets = new Map<string, Asset>();

        data.assets.forEach((asset: Asset) => {
          assets.set(asset.id, asset);
        });

        update(state => ({
          ...state,
          assets,
          loading: false,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          loading: false,
          error: message,
        }));
        console.error('Failed to load assets:', error);
      }
    },

    /**
     * Upload a new asset
     */
    async uploadAsset(file: File, options?: UploadOptions): Promise<Asset | null> {
      const token = getAuthToken();
      if (!token) {
        update(state => ({ ...state, error: 'Not authenticated' }));
        return null;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        if (options?.assetType) {
          formData.append('assetType', options.assetType);
        }
        if (options?.campaignId) {
          formData.append('campaignId', options.campaignId);
        }
        if (options?.name) {
          formData.append('name', options.name);
        }
        if (options?.description) {
          formData.append('description', options.description);
        }
        if (options?.tags) {
          formData.append('tags', JSON.stringify(options.tags));
        }
        if (options?.metadata) {
          formData.append('metadata', JSON.stringify(options.metadata));
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/assets/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload asset: ${response.statusText}`);
        }

        const data = await response.json();
        const asset = data.asset;

        // Add to store
        update(state => {
          const newAssets = new Map(state.assets);
          newAssets.set(asset.id, asset);
          return {
            ...state,
            assets: newAssets,
          };
        });

        return asset;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        update(state => ({ ...state, error: message }));
        console.error('Failed to upload asset:', error);
        return null;
      }
    },

    /**
     * Delete an asset
     */
    async deleteAsset(assetId: string): Promise<boolean> {
      const token = getAuthToken();
      if (!token) {
        update(state => ({ ...state, error: 'Not authenticated' }));
        return false;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/assets/${assetId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete asset: ${response.statusText}`);
        }

        // Remove from store
        update(state => {
          const newAssets = new Map(state.assets);
          newAssets.delete(assetId);
          return {
            ...state,
            assets: newAssets,
          };
        });

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Delete failed';
        update(state => ({ ...state, error: message }));
        console.error('Failed to delete asset:', error);
        return false;
      }
    },

    /**
     * Update asset metadata
     */
    async updateAsset(assetId: string, updates: Partial<Asset>): Promise<Asset | null> {
      const token = getAuthToken();
      if (!token) {
        update(state => ({ ...state, error: 'Not authenticated' }));
        return null;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/assets/${assetId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update asset: ${response.statusText}`);
        }

        const data = await response.json();
        const asset = data.asset;

        // Update in store
        update(state => {
          const newAssets = new Map(state.assets);
          newAssets.set(asset.id, asset);
          return {
            ...state,
            assets: newAssets,
          };
        });

        return asset;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Update failed';
        update(state => ({ ...state, error: message }));
        console.error('Failed to update asset:', error);
        return null;
      }
    },

    /**
     * Get full URL for an asset
     */
    getAssetUrl(asset: Asset): string {
      return `${API_BASE_URL}${asset.path}`;
    },

    /**
     * Get thumbnail URL for an asset
     */
    getThumbnailUrl(asset: Asset): string {
      if (asset.thumbnailPath) {
        return `${API_BASE_URL}${asset.thumbnailPath}`;
      }
      return `${API_BASE_URL}${asset.path}`;
    },

    /**
     * Clear all assets
     */
    clear(): void {
      set({
        assets: new Map(),
        loading: false,
        error: null,
      });
    },

    /**
     * Clear error message
     */
    clearError(): void {
      update(state => ({ ...state, error: null }));
    },
  };
}

export const assetsStore = createAssetsStore();
