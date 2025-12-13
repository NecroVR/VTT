<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { onMount } from 'svelte';

  let campaignId = '';

  onMount(() => {
    // Check if user has an active session
    authStore.checkSession();
  });

  function createCampaign() {
    if (!$authStore.user) {
      goto('/login');
      return;
    }
    // Generate a random campaign ID
    const id = Math.random().toString(36).substring(2, 10);
    goto(`/campaign/${id}`);
  }

  function joinCampaign() {
    if (!$authStore.user) {
      goto('/login');
      return;
    }
    if (campaignId.trim()) {
      goto(`/campaign/${campaignId}`);
    }
  }

  function viewMyCampaigns() {
    if (!$authStore.user) {
      goto('/login');
      return;
    }
    goto('/campaigns');
  }

  function viewForms() {
    if (!$authStore.user) {
      goto('/login');
      return;
    }
    goto('/forms');
  }

  function handleLogin() {
    goto('/login');
  }

  function handleRegister() {
    goto('/register');
  }
</script>

<svelte:head>
  <title>VTT - Virtual Tabletop</title>
</svelte:head>

<main class="container">
  <div class="hero">
    <h1>VTT</h1>
    <p class="subtitle">Virtual Tabletop for RPG Sessions</p>

    {#if !$authStore.user}
      <div class="auth-prompt">
        <p class="auth-message">Sign in to create and manage your campaign sessions</p>
        <div class="auth-buttons">
          <button class="btn btn-primary" on:click={handleLogin}>Login</button>
          <button class="btn btn-secondary" on:click={handleRegister}>Register</button>
        </div>
      </div>
    {:else}
      <div class="user-welcome">
        <p>Welcome back, <strong>{$authStore.user.username}</strong>!</p>
      </div>
    {/if}

    <div class="actions">
      <div class="card">
        <h2>My Campaigns</h2>
        <p>View and manage your campaign sessions</p>
        <button class="btn" on:click={viewMyCampaigns}>View My Campaigns</button>
      </div>

      <div class="card">
        <h2>Create New Campaign</h2>
        <p>Start a new campaign session and invite your players</p>
        <button class="btn" on:click={createCampaign}>Create Campaign</button>
      </div>

      <div class="card">
        <h2>Join Campaign</h2>
        <p>Enter a campaign ID to join an existing session</p>
        <input
          type="text"
          bind:value={campaignId}
          placeholder="Enter campaign ID"
          on:keydown={(e) => e.key === 'Enter' && joinCampaign()}
        />
        <button class="btn" on:click={joinCampaign} disabled={!campaignId.trim()}>Join Campaign</button>
      </div>

      <div class="card">
        <h2>Manage Forms</h2>
        <p>Create and manage character sheets and entity forms</p>
        <button class="btn" on:click={viewForms}>View Forms</button>
      </div>
    </div>
  </div>
</main>

<style>
  main {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hero {
    text-align: center;
    width: 100%;
    max-width: 800px;
  }

  h1 {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    margin-bottom: var(--spacing-sm);
    color: var(--color-accent);
  }

  .subtitle {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-xl);
  }

  .auth-prompt {
    margin: var(--spacing-xl) 0;
    padding: var(--spacing-xl);
    background: var(--color-bg-secondary);
    border-radius: var(--border-radius-md);
    border: 2px solid var(--color-accent);
  }

  .auth-message {
    font-size: var(--font-size-lg);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-md);
  }

  .auth-buttons {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
  }

  .btn-primary {
    background-color: var(--color-accent);
    color: white;
  }

  .btn-primary:hover {
    opacity: 0.9;
  }

  .btn-secondary {
    background-color: transparent;
    color: var(--color-accent);
    border: 2px solid var(--color-accent);
  }

  .btn-secondary:hover {
    background-color: var(--color-accent);
    color: white;
  }

  .user-welcome {
    margin: var(--spacing-lg) 0;
    padding: var(--spacing-md);
    background: var(--color-bg-secondary);
    border-radius: var(--border-radius-sm);
  }

  .user-welcome p {
    font-size: var(--font-size-md);
    color: var(--color-text-primary);
  }

  .user-welcome strong {
    color: var(--color-accent);
  }

  .actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-lg);
    margin-top: var(--spacing-xl);
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .card h2 {
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-xs);
  }

  .card p {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  input {
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
  }

  input:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
