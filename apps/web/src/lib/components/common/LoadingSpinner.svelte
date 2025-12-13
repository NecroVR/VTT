<script lang="ts">
  /**
   * Loading Spinner Component
   *
   * Displays an animated loading indicator.
   */

  interface Props {
    /** Size of the spinner (CSS value) */
    size?: string;
    /** Color of the spinner */
    color?: string;
    /** Whether to show with overlay (centers on screen) */
    overlay?: boolean;
    /** Loading message */
    message?: string;
    /** Custom CSS class */
    class?: string;
  }

  let {
    size = '2rem',
    color = 'var(--primary-color, #007bff)',
    overlay = false,
    message = '',
    class: className = ''
  }: Props = $props();
</script>

{#if overlay}
  <div class="loading-overlay" role="status" aria-live="polite">
    <div class="spinner-container">
      <div
        class="spinner {className}"
        style:width={size}
        style:height={size}
        style:border-color="{color}20"
        style:border-top-color={color}
        aria-label="Loading"
      ></div>
      {#if message}
        <p class="loading-message">{message}</p>
      {/if}
    </div>
  </div>
{:else}
  <div class="spinner-inline" role="status" aria-live="polite">
    <div
      class="spinner {className}"
      style:width={size}
      style:height={size}
      style:border-color="{color}20"
      style:border-top-color={color}
      aria-label="Loading"
    ></div>
    {#if message}
      <span class="loading-message">{message}</span>
    {/if}
  </div>
{/if}

<style>
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }

  .spinner-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    background: var(--bg-primary, white);
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .spinner-inline {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .spinner {
    border: 3px solid;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .loading-message {
    color: var(--text-primary, #333);
    font-size: 0.875rem;
    margin: 0;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .spinner-container {
      background: var(--bg-primary, #2a2a2a);
    }

    .loading-message {
      color: var(--text-primary, #e0e0e0);
    }
  }
</style>
