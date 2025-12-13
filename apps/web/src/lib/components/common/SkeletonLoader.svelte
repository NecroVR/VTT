<script lang="ts">
  /**
   * Skeleton Loader Component
   *
   * Displays a loading placeholder with a shimmer animation.
   * Used to improve perceived performance while content is loading.
   */

  interface Props {
    /** Width of the skeleton (CSS value) */
    width?: string;
    /** Height of the skeleton (CSS value) */
    height?: string;
    /** Border radius (CSS value) */
    borderRadius?: string;
    /** Variant type */
    variant?: 'text' | 'rectangular' | 'circular';
    /** Number of lines (for text variant) */
    lines?: number;
    /** Custom CSS class */
    class?: string;
  }

  let {
    width = '100%',
    height = '1rem',
    borderRadius = '4px',
    variant = 'rectangular',
    lines = 1,
    class: className = ''
  }: Props = $props();

  // Compute styles based on variant
  let computedHeight = $derived(
    variant === 'text' ? '1rem' :
    variant === 'circular' ? width :
    height
  );

  let computedBorderRadius = $derived(
    variant === 'circular' ? '50%' :
    variant === 'text' ? '4px' :
    borderRadius
  );
</script>

{#if variant === 'text' && lines > 1}
  <div class="skeleton-container {className}">
    {#each Array(lines) as _, i}
      <div
        class="skeleton shimmer"
        style:width={i === lines - 1 ? '80%' : '100%'}
        style:height="1rem"
        style:border-radius="4px"
        role="status"
        aria-label="Loading"
      >
        <span class="sr-only">Loading...</span>
      </div>
    {/each}
  </div>
{:else}
  <div
    class="skeleton shimmer {className}"
    style:width={width}
    style:height={computedHeight}
    style:border-radius={computedBorderRadius}
    role="status"
    aria-label="Loading"
  >
    <span class="sr-only">Loading...</span>
  </div>
{/if}

<style>
  .skeleton-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .skeleton {
    background: linear-gradient(
      90deg,
      var(--skeleton-base, #e0e0e0) 0%,
      var(--skeleton-highlight, #f0f0f0) 50%,
      var(--skeleton-base, #e0e0e0) 100%
    );
    background-size: 200% 100%;
    display: block;
    position: relative;
    overflow: hidden;
  }

  .shimmer {
    animation: shimmer 1.5s ease-in-out infinite;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .skeleton {
      --skeleton-base: #2a2a2a;
      --skeleton-highlight: #3a3a3a;
    }
  }
</style>
