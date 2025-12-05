import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import GMManagement from '../GMManagement.svelte';
import type { Campaign } from '@vtt/shared';

// Mock fetch
global.fetch = vi.fn();

describe('GMManagement', () => {
  const mockCampaign: Campaign = {
    id: 'campaign-1',
    name: 'Test Campaign',
    ownerId: 'owner-1',
    gmUserIds: ['gm-1', 'gm-2'],
    settings: {
      gridType: 'square',
      gridSize: 50,
      snapToGrid: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsers = [
    { id: 'owner-1', username: 'owner', email: 'owner@test.com' },
    { id: 'gm-1', username: 'gm1', email: 'gm1@test.com' },
    { id: 'gm-2', username: 'gm2', email: 'gm2@test.com' },
    { id: 'user-1', username: 'newuser', email: 'newuser@test.com' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    (global.fetch as any).mockImplementation((url: string) => {
      // Mock user details fetch
      if (url.includes('/api/v1/users/')) {
        const userId = url.split('/').pop();
        const user = mockUsers.find(u => u.id === userId);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user }),
        });
      }

      // Mock all users fetch
      if (url === '/api/v1/users') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('renders modal when isOpen is true', () => {
    const { container } = render(GMManagement, {
      props: {
        isOpen: true,
        campaign: mockCampaign,
        currentUserId: 'owner-1',
        token: 'test-token',
      },
    });

    expect(container.querySelector('.modal-backdrop')).toBeTruthy();
    expect(container.textContent).toContain('Game Masters');
  });

  it('does not render modal when isOpen is false', () => {
    const { container } = render(GMManagement, {
      props: {
        isOpen: false,
        campaign: mockCampaign,
        currentUserId: 'owner-1',
        token: 'test-token',
      },
    });

    expect(container.querySelector('.modal-backdrop')).toBeFalsy();
  });

  it('loads and displays GM list when modal opens', async () => {
    const { container } = render(GMManagement, {
      props: {
        isOpen: true,
        campaign: mockCampaign,
        currentUserId: 'owner-1',
        token: 'test-token',
      },
    });

    // Wait for GMs to load
    await waitFor(() => {
      expect(container.textContent).toContain('owner');
      expect(container.textContent).toContain('gm1');
      expect(container.textContent).toContain('gm2');
    });

    // Owner should have the owner badge
    expect(container.textContent).toContain('Owner');
  });

  it('shows owner badge for campaign owner', async () => {
    const { container } = render(GMManagement, {
      props: {
        isOpen: true,
        campaign: mockCampaign,
        currentUserId: 'owner-1',
        token: 'test-token',
      },
    });

    await waitFor(() => {
      const ownerBadge = container.querySelector('.owner-badge');
      expect(ownerBadge).toBeTruthy();
      expect(ownerBadge?.textContent).toBe('Owner');
    });
  });

  it('shows remove button for non-owner GMs when current user is owner', async () => {
    const { container } = render(GMManagement, {
      props: {
        isOpen: true,
        campaign: mockCampaign,
        currentUserId: 'owner-1',
        token: 'test-token',
      },
    });

    await waitFor(() => {
      const removeButtons = container.querySelectorAll('.button-remove');
      // Should have remove buttons for gm-1 and gm-2, but not for owner
      expect(removeButtons.length).toBeGreaterThan(0);
    });
  });

  it('does not show remove button for non-owner users', async () => {
    const { container } = render(GMManagement, {
      props: {
        isOpen: true,
        campaign: mockCampaign,
        currentUserId: 'gm-1',
        token: 'test-token',
      },
    });

    await waitFor(() => {
      const removeButtons = container.querySelectorAll('.button-remove');
      expect(removeButtons.length).toBe(0);
    });
  });

  it('shows add GM section only for campaign owner', async () => {
    const { container } = render(GMManagement, {
      props: {
        isOpen: true,
        campaign: mockCampaign,
        currentUserId: 'owner-1',
        token: 'test-token',
      },
    });

    await waitFor(() => {
      expect(container.querySelector('.add-gm-section')).toBeTruthy();
      expect(container.textContent).toContain('Add Game Master');
    });
  });

  it('does not show add GM section for non-owner GMs', async () => {
    const { container } = render(GMManagement, {
      props: {
        isOpen: true,
        campaign: mockCampaign,
        currentUserId: 'gm-1',
        token: 'test-token',
      },
    });

    await waitFor(() => {
      expect(container.querySelector('.add-gm-section')).toBeFalsy();
    });
  });

  it('shows error message for non-GM users', () => {
    const { container } = render(GMManagement, {
      props: {
        isOpen: true,
        campaign: mockCampaign,
        currentUserId: 'random-user',
        token: 'test-token',
      },
    });

    expect(container.textContent).toContain('You must be a Game Master to manage GMs');
  });

  it('allows adding a GM by username', async () => {
    (global.fetch as any).mockImplementation((url: string, options?: any) => {
      if (url === '/api/v1/users') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers }),
        });
      }

      if (url === '/api/v1/campaigns/campaign-1/gms' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ gmUserIds: ['gm-1', 'gm-2', 'user-1'] }),
        });
      }

      if (url.includes('/api/v1/users/')) {
        const userId = url.split('/').pop();
        const user = mockUsers.find(u => u.id === userId);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    const { container, getByPlaceholderText, getByText } = render(GMManagement, {
      props: {
        isOpen: true,
        campaign: mockCampaign,
        currentUserId: 'owner-1',
        token: 'test-token',
      },
    });

    await waitFor(() => {
      expect(container.textContent).toContain('Add Game Master');
    });

    const input = getByPlaceholderText('Enter username or email') as HTMLInputElement;
    const addButton = getByText('Add GM');

    await fireEvent.input(input, { target: { value: 'newuser' } });
    await fireEvent.click(addButton);

    // Verify the API was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/campaigns/campaign-1/gms',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ userId: 'user-1' }),
        })
      );
    });
  });

  it('shows error when trying to add non-existent user', async () => {
    const { container, getByPlaceholderText, getByText } = render(GMManagement, {
      props: {
        isOpen: true,
        campaign: mockCampaign,
        currentUserId: 'owner-1',
        token: 'test-token',
      },
    });

    await waitFor(() => {
      expect(container.textContent).toContain('Add Game Master');
    });

    const input = getByPlaceholderText('Enter username or email') as HTMLInputElement;
    const addButton = getByText('Add GM');

    await fireEvent.input(input, { target: { value: 'nonexistent' } });
    await fireEvent.click(addButton);

    await waitFor(() => {
      expect(container.textContent).toContain('User not found');
    });
  });

  it('dispatches close event when cancel is clicked', async () => {
    const { component, getByText } = render(GMManagement, {
      props: {
        isOpen: true,
        campaign: mockCampaign,
        currentUserId: 'owner-1',
        token: 'test-token',
      },
    });

    let closeDispatched = false;
    component.$on('close', () => {
      closeDispatched = true;
    });

    const closeButton = getByText('Close');
    await fireEvent.click(closeButton);

    expect(closeDispatched).toBe(true);
  });

  it('closes modal on backdrop click', async () => {
    const { component, container } = render(GMManagement, {
      props: {
        isOpen: true,
        campaign: mockCampaign,
        currentUserId: 'owner-1',
        token: 'test-token',
      },
    });

    let closeDispatched = false;
    component.$on('close', () => {
      closeDispatched = true;
    });

    const backdrop = container.querySelector('.modal-backdrop') as HTMLElement;
    await fireEvent.click(backdrop);

    expect(closeDispatched).toBe(true);
  });

  it('disables add button when input is empty', async () => {
    const { container, getByText } = render(GMManagement, {
      props: {
        isOpen: true,
        campaign: mockCampaign,
        currentUserId: 'owner-1',
        token: 'test-token',
      },
    });

    await waitFor(() => {
      expect(container.textContent).toContain('Add Game Master');
    });

    const addButton = getByText('Add GM') as HTMLButtonElement;
    expect(addButton.disabled).toBe(true);
  });

  it('shows loading state while fetching GMs', () => {
    const { container } = render(GMManagement, {
      props: {
        isOpen: true,
        campaign: mockCampaign,
        currentUserId: 'owner-1',
        token: 'test-token',
      },
    });

    // Initially should show loading
    expect(container.textContent).toContain('Loading GMs');
  });

  it('handles API error when fetching GMs', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { container } = render(GMManagement, {
      props: {
        isOpen: true,
        campaign: mockCampaign,
        currentUserId: 'owner-1',
        token: 'test-token',
      },
    });

    await waitFor(() => {
      expect(container.textContent).toContain('Failed to load GM users');
    });
  });
});
