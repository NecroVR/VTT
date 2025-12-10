<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { campaignsStore } from '$lib/stores/campaigns';

  async function handleLogout() {
    await authStore.logout();
    goto('/');
  }

  function handleLogin() {
    goto('/login');
  }

  function handleRegister() {
    goto('/register');
  }

  function goHome() {
    goto('/');
  }

  $: isAuthPage = $page.url.pathname === '/login' || $page.url.pathname === '/register';

  // Check if we're on a campaign page and extract campaign ID
  $: campaignMatch = $page.url.pathname.match(/^\/campaign\/([^/]+)/);
  $: campaignId = campaignMatch ? campaignMatch[1] : null;
  $: currentCampaign = $campaignsStore.currentCampaign;
</script>

<header class="header">
  <div class="header-content">
    <button class="logo" on:click={goHome}>
      <span class="logo-text">VTT</span>
    </button>

    {#if campaignId}
      <div class="campaign-info">
        <span class="campaign-label">Campaign Session</span>
        <span class="campaign-id">ID: {campaignId}</span>
      </div>
    {/if}

    <nav class="nav">
      {#if $authStore.user}
        <div class="user-info">
          <span class="username">{$authStore.user.username}</span>
          <button class="btn btn-logout" on:click={handleLogout}>Logout</button>
        </div>
      {:else if !isAuthPage}
        <div class="auth-links">
          <button class="btn btn-text" on:click={handleLogin}>Login</button>
          <button class="btn btn-primary" on:click={handleRegister}>Register</button>
        </div>
      {/if}
    </nav>
  </div>
</header>

<style>
  .header {
    background-color: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-md) 0;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--spacing-lg);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .logo-text {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--color-accent);
    text-decoration: none;
  }

  .logo:hover .logo-text {
    opacity: 0.8;
  }

  .campaign-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .campaign-label {
    font-size: var(--font-size-md);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .campaign-id {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    font-family: monospace;
  }

  .nav {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .username {
    color: var(--color-text-primary);
    font-weight: 500;
    font-size: var(--font-size-md);
  }

  .auth-links {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .btn {
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .btn-primary {
    background-color: var(--color-accent);
    color: white;
  }

  .btn-primary:hover {
    opacity: 0.9;
  }

  .btn-logout {
    background-color: transparent;
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }

  .btn-logout:hover {
    background-color: var(--color-bg-primary);
  }

  .btn-text {
    background: none;
    color: var(--color-text-primary);
    padding: var(--spacing-sm);
  }

  .btn-text:hover {
    color: var(--color-accent);
  }
</style>
