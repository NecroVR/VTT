import { writable } from 'svelte/store';
import type { Campaign, CreateCampaignRequest, UpdateCampaignRequest, CampaignsListResponse, CampaignResponse } from '@vtt/shared';
import { API_BASE_URL } from '$lib/config/api';

const SESSION_STORAGE_KEY = 'vtt_session_id';

interface CampaignsState {
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  loading: boolean;
  error: string | null;
}

const initialState: CampaignsState = {
  campaigns: [],
  currentCampaign: null,
  loading: false,
  error: null,
};

function createCampaignsStore() {
  const { subscribe, set, update } = writable<CampaignsState>(initialState);

  /**
   * Get authorization header with session token
   * @param includeContentType - Whether to include Content-Type header (default: true)
   */
  function getAuthHeader(includeContentType: boolean = true): Record<string, string> {
    const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      throw new Error('Not authenticated');
    }
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${sessionId}`,
    };
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  return {
    subscribe,

    /**
     * Fetch all campaigns for the current user
     */
    async fetchCampaigns(): Promise<boolean> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/campaigns`, {
          method: 'GET',
          headers: getAuthHeader(false),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch campaigns');
        }

        const data: CampaignsListResponse = await response.json();

        update(state => ({
          ...state,
          campaigns: data.campaigns,
          loading: false,
          error: null,
        }));

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch campaigns';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        return false;
      }
    },

    /**
     * Fetch a single campaign by ID
     */
    async fetchCampaign(id: string): Promise<boolean> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${id}`, {
          method: 'GET',
          headers: getAuthHeader(false),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch campaign');
        }

        const data: CampaignResponse = await response.json();

        update(state => ({
          ...state,
          currentCampaign: data.campaign,
          loading: false,
          error: null,
        }));

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch campaign';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        return false;
      }
    },

    /**
     * Create a new campaign
     */
    async createCampaign(data: CreateCampaignRequest): Promise<Campaign | null> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/campaigns`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create campaign');
        }

        const responseData: CampaignResponse = await response.json();

        update(state => ({
          ...state,
          campaigns: [...state.campaigns, responseData.campaign],
          loading: false,
          error: null,
        }));

        return responseData.campaign;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create campaign';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        return null;
      }
    },

    /**
     * Update an existing campaign
     */
    async updateCampaign(id: string, data: UpdateCampaignRequest): Promise<boolean> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${id}`, {
          method: 'PATCH',
          headers: getAuthHeader(),
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update campaign');
        }

        const responseData: CampaignResponse = await response.json();

        update(state => ({
          ...state,
          campaigns: state.campaigns.map(campaign =>
            campaign.id === id ? responseData.campaign : campaign
          ),
          currentCampaign: state.currentCampaign?.id === id ? responseData.campaign : state.currentCampaign,
          loading: false,
          error: null,
        }));

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update campaign';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        return false;
      }
    },

    /**
     * Delete a campaign
     */
    async deleteCampaign(id: string): Promise<boolean> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${id}`, {
          method: 'DELETE',
          headers: getAuthHeader(false),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete campaign');
        }

        update(state => ({
          ...state,
          campaigns: state.campaigns.filter(campaign => campaign.id !== id),
          currentCampaign: state.currentCampaign?.id === id ? null : state.currentCampaign,
          loading: false,
          error: null,
        }));

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete campaign';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        return false;
      }
    },

    /**
     * Clear error message
     */
    clearError(): void {
      update(state => ({ ...state, error: null }));
    },

    /**
     * Clear current campaign
     */
    clearCurrentCampaign(): void {
      update(state => ({ ...state, currentCampaign: null }));
    },

    /**
     * Reset store to initial state
     */
    reset(): void {
      set(initialState);
    },
  };
}

export const campaignsStore = createCampaignsStore();
