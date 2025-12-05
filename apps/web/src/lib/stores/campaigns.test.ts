import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { campaignsStore } from './campaigns';
import type { Campaign, CreateCampaignRequest, UpdateCampaignRequest, CampaignsListResponse, CampaignResponse } from '@vtt/shared';

describe('campaigns store', () => {
  const mockCampaign1: Campaign = {
    id: 'campaign-1',
    name: 'Test Campaign 1',
    description: 'A test campaign',
    ownerId: 'user-123',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockCampaign2: Campaign = {
    id: 'campaign-2',
    name: 'Test Campaign 2',
    description: 'Another test campaign',
    ownerId: 'user-123',
    isActive: false,
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    // Reset store to initial state
    campaignsStore.reset();
    // Setup default localStorage mock
    global.localStorage.getItem = vi.fn().mockReturnValue('session-abc-123');
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = get(campaignsStore);
      expect(state.campaigns).toEqual([]);
      expect(state.currentCampaign).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchCampaigns', () => {
    it('should fetch all campaigns successfully', async () => {
      const mockResponse: CampaignsListResponse = {
        campaigns: [mockCampaign1, mockCampaign2],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await campaignsStore.fetchCampaigns();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/campaigns',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer session-abc-123',
          }),
        })
      );

      const state = get(campaignsStore);
      expect(state.campaigns).toEqual([mockCampaign1, mockCampaign2]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle fetch campaigns error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to fetch campaigns' }),
      } as Response);

      const result = await campaignsStore.fetchCampaigns();

      expect(result).toBe(false);
      const state = get(campaignsStore);
      expect(state.campaigns).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch campaigns');
    });

    it('should handle network error', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const result = await campaignsStore.fetchCampaigns();

      expect(result).toBe(false);
      const state = get(campaignsStore);
      expect(state.error).toBe('Network error');
      expect(state.loading).toBe(false);
    });
  });

  describe('fetchCampaign', () => {
    it('should fetch single campaign by ID successfully', async () => {
      const mockResponse: CampaignResponse = {
        campaign: mockCampaign1,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await campaignsStore.fetchCampaign('campaign-1');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/campaigns/campaign-1',
        expect.objectContaining({
          method: 'GET',
        })
      );

      const state = get(campaignsStore);
      expect(state.currentCampaign).toEqual(mockCampaign1);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle campaign not found error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Campaign not found' }),
      } as Response);

      const result = await campaignsStore.fetchCampaign('nonexistent');

      expect(result).toBe(false);
      const state = get(campaignsStore);
      expect(state.currentCampaign).toBeNull();
      expect(state.error).toBe('Campaign not found');
    });
  });

  describe('createCampaign', () => {
    it('should create new campaign successfully', async () => {
      const createData: CreateCampaignRequest = {
        name: 'New Campaign',
        description: 'A new campaign',
      };

      const mockResponse: CampaignResponse = {
        campaign: mockCampaign1,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await campaignsStore.createCampaign(createData);

      expect(result).toEqual(mockCampaign1);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/campaigns',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(createData),
        })
      );

      const state = get(campaignsStore);
      expect(state.campaigns).toContainEqual(mockCampaign1);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should add created campaign to campaigns array', async () => {
      // Setup initial state with one campaign
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaigns: [mockCampaign1] }),
      } as Response);
      await campaignsStore.fetchCampaigns();

      // Create new campaign
      const createData: CreateCampaignRequest = {
        name: 'New Campaign 2',
        description: 'Another new campaign',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaign: mockCampaign2 }),
      } as Response);

      await campaignsStore.createCampaign(createData);

      const state = get(campaignsStore);
      expect(state.campaigns).toHaveLength(2);
      expect(state.campaigns).toContainEqual(mockCampaign1);
      expect(state.campaigns).toContainEqual(mockCampaign2);
    });

    it('should handle create campaign error', async () => {
      const createData: CreateCampaignRequest = {
        name: 'New Campaign',
        description: 'A new campaign',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to create campaign' }),
      } as Response);

      const result = await campaignsStore.createCampaign(createData);

      expect(result).toBeNull();
      const state = get(campaignsStore);
      expect(state.error).toBe('Failed to create campaign');
      expect(state.loading).toBe(false);
    });
  });

  describe('updateCampaign', () => {
    it('should update campaign successfully', async () => {
      // Setup initial state with campaigns
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaigns: [mockCampaign1, mockCampaign2] }),
      } as Response);
      await campaignsStore.fetchCampaigns();

      const updateData: UpdateCampaignRequest = {
        name: 'Updated Campaign Name',
      };

      const updatedCampaign = { ...mockCampaign1, name: 'Updated Campaign Name' };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaign: updatedCampaign }),
      } as Response);

      const result = await campaignsStore.updateCampaign('campaign-1', updateData);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/campaigns/campaign-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateData),
        })
      );

      const state = get(campaignsStore);
      const campaign = state.campaigns.find((c) => c.id === 'campaign-1');
      expect(campaign?.name).toBe('Updated Campaign Name');
    });

    it('should update campaign in campaigns array', async () => {
      // Setup initial state
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaigns: [mockCampaign1, mockCampaign2] }),
      } as Response);
      await campaignsStore.fetchCampaigns();

      const updatedCampaign = { ...mockCampaign1, name: 'New Name' };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaign: updatedCampaign }),
      } as Response);

      await campaignsStore.updateCampaign('campaign-1', { name: 'New Name' });

      const state = get(campaignsStore);
      expect(state.campaigns[0].name).toBe('New Name');
      expect(state.campaigns[1]).toEqual(mockCampaign2); // Other campaigns unchanged
    });

    it('should update currentCampaign if it matches updated campaign', async () => {
      // Set currentCampaign
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaign: mockCampaign1 }),
      } as Response);
      await campaignsStore.fetchCampaign('campaign-1');

      // Setup campaigns array
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaigns: [mockCampaign1] }),
      } as Response);
      await campaignsStore.fetchCampaigns();

      // Update the current campaign
      const updatedCampaign = { ...mockCampaign1, name: 'Updated Name' };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaign: updatedCampaign }),
      } as Response);

      await campaignsStore.updateCampaign('campaign-1', { name: 'Updated Name' });

      const state = get(campaignsStore);
      expect(state.currentCampaign?.name).toBe('Updated Name');
    });

    it('should handle update campaign error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Update failed' }),
      } as Response);

      const result = await campaignsStore.updateCampaign('campaign-1', { name: 'New Name' });

      expect(result).toBe(false);
      const state = get(campaignsStore);
      expect(state.error).toBe('Update failed');
    });
  });

  describe('deleteCampaign', () => {
    it('should delete campaign successfully', async () => {
      // Setup initial state
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaigns: [mockCampaign1, mockCampaign2] }),
      } as Response);
      await campaignsStore.fetchCampaigns();

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
      } as Response);

      const result = await campaignsStore.deleteCampaign('campaign-1');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/campaigns/campaign-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );

      const state = get(campaignsStore);
      expect(state.campaigns).toHaveLength(1);
      expect(state.campaigns[0]).toEqual(mockCampaign2);
    });

    it('should remove campaign from campaigns array', async () => {
      // Setup initial state
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaigns: [mockCampaign1, mockCampaign2] }),
      } as Response);
      await campaignsStore.fetchCampaigns();

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
      } as Response);

      await campaignsStore.deleteCampaign('campaign-1');

      const state = get(campaignsStore);
      expect(state.campaigns.find((c) => c.id === 'campaign-1')).toBeUndefined();
      expect(state.campaigns).toContainEqual(mockCampaign2);
    });

    it('should clear currentCampaign if deleted campaign is current', async () => {
      // Set currentCampaign
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaign: mockCampaign1 }),
      } as Response);
      await campaignsStore.fetchCampaign('campaign-1');

      // Delete current campaign
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
      } as Response);

      await campaignsStore.deleteCampaign('campaign-1');

      const state = get(campaignsStore);
      expect(state.currentCampaign).toBeNull();
    });

    it('should not clear currentCampaign if different campaign is deleted', async () => {
      // Set currentCampaign
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaign: mockCampaign1 }),
      } as Response);
      await campaignsStore.fetchCampaign('campaign-1');

      // Delete different campaign
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
      } as Response);

      await campaignsStore.deleteCampaign('campaign-2');

      const state = get(campaignsStore);
      expect(state.currentCampaign).toEqual(mockCampaign1);
    });

    it('should handle delete campaign error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Delete failed' }),
      } as Response);

      const result = await campaignsStore.deleteCampaign('campaign-1');

      expect(result).toBe(false);
      const state = get(campaignsStore);
      expect(state.error).toBe('Delete failed');
    });
  });

  describe('clearError', () => {
    it('should clear error message', async () => {
      // Create error state
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Some error' }),
      } as Response);
      await campaignsStore.fetchCampaigns();

      let state = get(campaignsStore);
      expect(state.error).toBe('Some error');

      // Clear error
      campaignsStore.clearError();

      state = get(campaignsStore);
      expect(state.error).toBeNull();
    });
  });

  describe('clearCurrentCampaign', () => {
    it('should clear current campaign', async () => {
      // Set currentCampaign
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaign: mockCampaign1 }),
      } as Response);
      await campaignsStore.fetchCampaign('campaign-1');

      let state = get(campaignsStore);
      expect(state.currentCampaign).toEqual(mockCampaign1);

      // Clear current campaign
      campaignsStore.clearCurrentCampaign();

      state = get(campaignsStore);
      expect(state.currentCampaign).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', async () => {
      // Setup state with campaigns
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaigns: [mockCampaign1, mockCampaign2] }),
      } as Response);
      await campaignsStore.fetchCampaigns();

      // Reset
      campaignsStore.reset();

      const state = get(campaignsStore);
      expect(state.campaigns).toEqual([]);
      expect(state.currentCampaign).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
