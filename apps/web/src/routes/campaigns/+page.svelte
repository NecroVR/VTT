<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { campaignsStore } from '$lib/stores/campaigns';
  import { authStore } from '$lib/stores/auth';
  import { API_BASE_URL } from '$lib/config/api';
  import GMManagement from '$lib/components/campaign/GMManagement.svelte';
  import type { Campaign } from '@vtt/shared';

  interface GameSystem {
    systemId: string;
    name: string;
    version: string;
    publisher: string;
    description: string;
    type: string;
  }

  let campaigns: Campaign[] = [];
  let loading = false;
  let error: string | null = null;
  let user: any = null;
  let gmManagementOpen = false;
  let selectedCampaign: Campaign | null = null;
  let token = '';
  let gameSystems: Map<string, GameSystem> = new Map();

  const unsubscribeCampaigns = campaignsStore.subscribe(state => {
    campaigns = state.campaigns;
    loading = state.loading;
    error = state.error;
  });

  const unsubscribeAuth = authStore.subscribe(state => {
    user = state.user;
  });

  onMount(async () => {
    // Check if user is authenticated
    if (!user) {
      const isAuthenticated = await authStore.checkSession();
      if (!isAuthenticated) {
        goto('/login');
        return;
      }
    }

    // Get session token for GM management
    token = localStorage.getItem('vtt_session_id') || '';

    // Fetch campaigns and game systems
    await Promise.all([
      campaignsStore.fetchCampaigns(),
      fetchGameSystems()
    ]);
  });

  async function fetchGameSystems() {
    try {
      const sessionId = localStorage.getItem('vtt_session_id');
      if (!sessionId) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/game-systems`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const systems: GameSystem[] = data.gameSystems || [];
        gameSystems = new Map(systems.map(s => [s.systemId, s]));
      }
    } catch (err) {
      console.error('Failed to fetch game systems:', err);
    }
  }

  function getGameSystemName(gameSystemId?: string | null): string {
    if (!gameSystemId) return 'Not specified';
    const system = gameSystems.get(gameSystemId);
    return system ? system.name : 'Unknown System';
  }

  function createNewCampaign() {
    goto('/campaigns/new');
  }

  function openCampaign(campaignId: string) {
    goto(`/campaign/${campaignId}`);
  }

  async function deleteCampaign(campaignId: string, campaignName: string) {
    if (confirm(`Are you sure you want to delete "${campaignName}"?`)) {
      const success = await campaignsStore.deleteCampaign(campaignId);
      if (success) {
        // Campaign deleted, list will update automatically
      }
    }
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function openGMManagement(campaign: Campaign) {
    selectedCampaign = campaign;
    gmManagementOpen = true;
  }

  function closeGMManagement() {
    gmManagementOpen = false;
    selectedCampaign = null;
  }

  async function handleGMUpdated() {
    // Refresh the campaigns list to get updated GM info
    await campaignsStore.fetchCampaigns();
  }
</script>

<svelte:head>
  <title>My Campaigns - VTT</title>
</svelte:head>

<main class="container">
  <div class="header">
    <div class="header-left">
      <h1>My Campaigns</h1>
      <a href="/docs" class="docs-link" title="View Documentation">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          <line x1="12" y1="6" x2="12" y2="10"/>
          <line x1="12" y1="14" x2="12.01" y2="14"/>
        </svg>
        Documentation
      </a>
    </div>
    <button class="btn btn-primary" on:click={createNewCampaign}>
      Create New Campaign
    </button>
  </div>

  {#if error}
    <div class="error-message">
      <p>{error}</p>
      <button class="btn-text" on:click={() => campaignsStore.clearError()}>Dismiss</button>
    </div>
  {/if}

  {#if loading}
    <div class="loading">
      <p>Loading campaigns...</p>
    </div>
  {:else if campaigns.length === 0}
    <div class="empty-state">
      <h2>No campaigns yet</h2>
      <p>Create your first campaign to get started!</p>
      <button class="btn btn-primary" on:click={createNewCampaign}>
        Create Campaign
      </button>
    </div>
  {:else}
    <div class="campaigns-grid">
      {#each campaigns as campaign (campaign.id)}
        <div class="campaign-card">
          <div class="campaign-card-header">
            <h2>{campaign.name}</h2>
            <div class="campaign-card-actions">
              <button
                class="btn-icon"
                on:click={() => openGMManagement(campaign)}
                title="Manage GMs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </button>
              <button
                class="btn-icon"
                on:click={() => openCampaign(campaign.id)}
                title="Open campaign"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </button>
              <button
                class="btn-icon btn-danger"
                on:click={() => deleteCampaign(campaign.id, campaign.name)}
                title="Delete campaign"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="campaign-card-body">
            <div class="campaign-info">
              <span class="label">Game System:</span>
              <span class="value">{getGameSystemName(campaign.gameSystemId)}</span>
            </div>
            <div class="campaign-info">
              <span class="label">Grid:</span>
              <span class="value">{campaign.settings.gridType}</span>
            </div>
            <div class="campaign-info">
              <span class="label">Grid Size:</span>
              <span class="value">{campaign.settings.gridSize}px</span>
            </div>
            <div class="campaign-info">
              <span class="label">Snap to Grid:</span>
              <span class="value">{campaign.settings.snapToGrid ? 'Yes' : 'No'}</span>
            </div>
            <div class="campaign-info">
              <span class="label">Created:</span>
              <span class="value">{formatDate(campaign.createdAt)}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</main>

<!-- GM Management Modal -->
{#if selectedCampaign && user}
  <GMManagement
    isOpen={gmManagementOpen}
    campaign={selectedCampaign}
    currentUserId={user.id}
    {token}
    on:close={closeGMManagement}
    on:updated={handleGMUpdated}
  />
{/if}

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-xl) var(--spacing-lg);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xl);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
  }

  .header h1 {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    margin: 0;
  }

  .docs-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: var(--font-size-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius-sm);
    transition: background-color 0.2s, color 0.2s;
  }

  .docs-link:hover {
    background-color: var(--color-bg-secondary);
    color: var(--color-primary);
  }

  .docs-link svg {
    flex-shrink: 0;
  }

  .error-message {
    background-color: rgba(248, 113, 113, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.3);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .error-message p {
    color: #f87171;
    margin: 0;
  }

  .loading {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--color-text-secondary);
  }

  .empty-state {
    text-align: center;
    padding: var(--spacing-xl) var(--spacing-lg);
    background-color: var(--color-bg-secondary);
    border-radius: var(--border-radius-lg);
    margin-top: var(--spacing-xl);
  }

  .empty-state h2 {
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-sm);
  }

  .empty-state p {
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-lg);
  }

  .campaigns-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--spacing-lg);
  }

  .campaign-card {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-lg);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .campaign-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .campaign-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-md);
  }

  .campaign-card-header h2 {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin: 0;
    flex: 1;
  }

  .campaign-card-actions {
    display: flex;
    gap: var(--spacing-xs);
  }

  .btn-icon {
    background: none;
    border: none;
    padding: var(--spacing-xs);
    cursor: pointer;
    color: var(--color-text-secondary);
    border-radius: var(--border-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s, color 0.2s;
  }

  .btn-icon:hover {
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .btn-icon.btn-danger:hover {
    background-color: rgba(248, 113, 113, 0.1);
    color: #f87171;
  }

  .campaign-card-body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .campaign-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .campaign-info .label {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .campaign-info .value {
    font-size: var(--font-size-sm);
    font-weight: 500;
  }

  .btn-text {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: var(--font-size-sm);
    text-decoration: underline;
  }

  .btn-text:hover {
    color: var(--color-text-primary);
  }
</style>
