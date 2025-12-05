<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Campaign } from '@vtt/shared';

  // Props
  export let isOpen: boolean = false;
  export let campaign: Campaign;
  export let currentUserId: string;
  export let token: string = '';

  const dispatch = createEventDispatcher<{
    close: void;
    updated: void;
  }>();

  // Component state
  let gmUsers: Array<{ id: string; username: string; email: string; isOwner: boolean }> = [];
  let loading = false;
  let error: string | null = null;
  let addGmInput = '';
  let addGmLoading = false;
  let addGmError: string | null = null;

  // Check if current user is GM or owner
  $: isCurrentUserGM = campaign.ownerId === currentUserId || campaign.gmUserIds.includes(currentUserId);

  // Load GM details when modal opens
  $: if (isOpen && campaign) {
    loadGMUsers();
  }

  async function loadGMUsers() {
    loading = true;
    error = null;

    try {
      // Get all user IDs (owner + GM list)
      const allGmUserIds = [campaign.ownerId, ...campaign.gmUserIds];
      const uniqueGmUserIds = [...new Set(allGmUserIds)];

      // Fetch user details for each GM
      const userPromises = uniqueGmUserIds.map(async (userId) => {
        const response = await fetch(`/api/v1/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user ${userId}`);
        }

        const data = await response.json();
        return {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          isOwner: userId === campaign.ownerId,
        };
      });

      gmUsers = await Promise.all(userPromises);

      // Sort: owner first, then alphabetically
      gmUsers.sort((a, b) => {
        if (a.isOwner) return -1;
        if (b.isOwner) return 1;
        return a.username.localeCompare(b.username);
      });
    } catch (err) {
      console.error('Failed to load GM users:', err);
      error = 'Failed to load GM users. Please try again.';
    } finally {
      loading = false;
    }
  }

  async function handleAddGM() {
    const input = addGmInput.trim();
    if (!input) {
      addGmError = 'Please enter a username or email';
      return;
    }

    addGmLoading = true;
    addGmError = null;

    try {
      // First, find the user by username or email
      const allUsersResponse = await fetch('/api/v1/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!allUsersResponse.ok) {
        throw new Error('Failed to search for user');
      }

      const usersData = await allUsersResponse.json();
      const targetUser = usersData.users.find(
        (u: any) => u.username === input || u.email === input
      );

      if (!targetUser) {
        addGmError = 'User not found';
        return;
      }

      // Check if user is already a GM
      if (targetUser.id === campaign.ownerId) {
        addGmError = 'User is already the campaign owner';
        return;
      }

      if (campaign.gmUserIds.includes(targetUser.id)) {
        addGmError = 'User is already a GM';
        return;
      }

      // Add the user as GM
      const response = await fetch(`/api/v1/campaigns/${campaign.id}/gms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: targetUser.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add GM');
      }

      // Reload the GM list
      await loadGMUsers();
      addGmInput = '';
      dispatch('updated');
    } catch (err) {
      console.error('Failed to add GM:', err);
      addGmError = err instanceof Error ? err.message : 'Failed to add GM';
    } finally {
      addGmLoading = false;
    }
  }

  async function handleRemoveGM(userId: string, username: string) {
    if (!confirm(`Remove ${username} as a Game Master?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/campaigns/${campaign.id}/gms/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove GM');
      }

      // Reload the GM list
      await loadGMUsers();
      dispatch('updated');
    } catch (err) {
      console.error('Failed to remove GM:', err);
      alert(`Failed to remove GM: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  function handleCancel() {
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (isOpen) {
      handleKeydown(event);
    }
  }

  function handleInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddGM();
    }
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

{#if isOpen}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal-content" on:click|stopPropagation>
      <header class="modal-header">
        <h2>Game Masters</h2>
        <button class="close-button" on:click={handleCancel} aria-label="Close">
          &times;
        </button>
      </header>

      <div class="modal-body">
        {#if !isCurrentUserGM}
          <div class="error-message">
            You must be a Game Master to manage GMs.
          </div>
        {:else if loading}
          <div class="loading">Loading GMs...</div>
        {:else if error}
          <div class="error-message">{error}</div>
        {:else}
          <!-- Current GMs List -->
          <section class="gm-list-section">
            <h3>Current Game Masters</h3>

            <div class="gm-list">
              {#each gmUsers as gmUser}
                <div class="gm-item">
                  <div class="gm-info">
                    <div class="gm-name">
                      {gmUser.username}
                      {#if gmUser.isOwner}
                        <span class="owner-badge">Owner</span>
                      {/if}
                    </div>
                    <div class="gm-email">{gmUser.email}</div>
                  </div>

                  {#if !gmUser.isOwner && campaign.ownerId === currentUserId}
                    <button
                      class="button-remove"
                      on:click={() => handleRemoveGM(gmUser.id, gmUser.username)}
                      aria-label="Remove GM"
                    >
                      Remove
                    </button>
                  {/if}
                </div>
              {/each}
            </div>
          </section>

          <!-- Add GM Section (only for owner) -->
          {#if campaign.ownerId === currentUserId}
            <section class="add-gm-section">
              <h3>Add Game Master</h3>

              <div class="add-gm-form">
                <input
                  type="text"
                  bind:value={addGmInput}
                  on:keydown={handleInputKeydown}
                  placeholder="Enter username or email"
                  disabled={addGmLoading}
                />
                <button
                  class="button-primary"
                  on:click={handleAddGM}
                  disabled={addGmLoading || !addGmInput.trim()}
                >
                  {addGmLoading ? 'Adding...' : 'Add GM'}
                </button>
              </div>

              {#if addGmError}
                <div class="error-message-small">{addGmError}</div>
              {/if}

              <p class="help-text">
                Add a user as a Game Master by entering their username or email address.
              </p>
            </section>
          {/if}
        {/if}
      </div>

      <footer class="modal-footer">
        <button class="button-secondary" on:click={handleCancel}>
          Close
        </button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
  }

  .modal-content {
    background-color: var(--color-bg-secondary, #1e1e1e);
    border-radius: 8px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .close-button {
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    color: var(--color-text-secondary, #aaa);
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s, color 0.2s;
  }

  .close-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary, #ffffff);
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-secondary, #aaa);
  }

  .error-message {
    padding: 1rem;
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    border-radius: 4px;
    color: #ef4444;
    margin-bottom: 1rem;
  }

  .error-message-small {
    margin-top: 0.5rem;
    color: #ef4444;
    font-size: 0.875rem;
  }

  .gm-list-section {
    margin-bottom: 2rem;
  }

  .gm-list-section h3,
  .add-gm-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
    border-bottom: 1px solid var(--color-border, #333);
    padding-bottom: 0.5rem;
  }

  .gm-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .gm-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
  }

  .gm-info {
    flex: 1;
  }

  .gm-name {
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-text-primary, #ffffff);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .owner-badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    background-color: #4a90e2;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 4px;
    text-transform: uppercase;
  }

  .gm-email {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #aaa);
  }

  .button-remove {
    padding: 0.5rem 1rem;
    background-color: transparent;
    color: #ef4444;
    border: 1px solid #ef4444;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }

  .button-remove:hover {
    background-color: #ef4444;
    color: white;
  }

  .button-remove:active {
    transform: scale(0.98);
  }

  .add-gm-section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-border, #333);
  }

  .add-gm-form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .add-gm-form input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    background-color: var(--color-bg-primary, #121212);
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .add-gm-form input:focus {
    outline: none;
    border-color: #4a90e2;
  }

  .add-gm-form input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .help-text {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #888);
    margin-top: 0.5rem;
    margin-bottom: 0;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
  }

  button:active {
    transform: scale(0.98);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .button-primary {
    background-color: #4a90e2;
    color: white;
  }

  .button-primary:hover:not(:disabled) {
    background-color: #357abd;
  }

  .button-secondary {
    background-color: transparent;
    color: var(--color-text-secondary, #aaa);
    border: 1px solid var(--color-border, #333);
  }

  .button-secondary:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }

  @media (max-width: 640px) {
    .modal-backdrop {
      padding: 0;
    }

    .modal-content {
      max-height: 100vh;
      border-radius: 0;
    }

    .gm-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .button-remove {
      width: 100%;
    }

    .add-gm-form {
      flex-direction: column;
    }
  }
</style>
