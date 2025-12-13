<script lang="ts">
  /**
   * EntityImage Component
   *
   * A robust image component that handles:
   * - Loading states
   * - Failed image loads (404s, network errors)
   * - SVG icons with proper styling
   * - Fallback to entity type icons
   */

  export let src: string | null | undefined = null;
  export let alt: string = '';
  export let entityType: string = 'item';
  export let size: 'small' | 'medium' | 'large' = 'medium';

  let imageLoaded = false;
  let imageError = false;

  // Reset state when src changes
  $: if (src) {
    imageLoaded = false;
    imageError = false;
  }

  function handleLoad() {
    imageLoaded = true;
    imageError = false;
  }

  function handleError() {
    imageLoaded = false;
    imageError = true;
  }

  function getEntityTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      item: '\u{1F5E1}',        // Sword
      weapon: '\u{1F5E1}',      // Sword
      armor: '\u{1F6E1}',       // Shield
      spell: '\u2728',          // Sparkles
      monster: '\u{1F47E}',     // Alien Monster
      race: '\u{1F9D1}',        // Person
      class: '\u{1F6E1}',       // Shield
      background: '\u{1F4DC}',  // Scroll
      feature: '\u2B50',        // Star
      feat: '\u{1F4AA}',        // Muscle
      condition: '\u{1F915}',   // Face with thermometer
      skill: '\u{1F4DA}',       // Books
      vehicle: '\u{1F6E0}',     // Hammer and wrench
      hazard: '\u26A0',         // Warning
      actor: '\u{1F464}',       // Person silhouette
      npc: '\u{1F464}',         // Person silhouette
      character: '\u{1F9D9}',   // Mage
      journal: '\u{1F4D6}',     // Book
      scene: '\u{1F5FA}',       // Map
      consumable: '\u{1F9EA}',  // Test tube
      tool: '\u{1F527}',        // Wrench
      loot: '\u{1F48E}',        // Gem
      custom: '\u{1F4C4}',      // Page
    };
    return icons[type.toLowerCase()] || '\u{1F4C4}';
  }

  // Check if the image is an SVG
  $: isSvg = src?.endsWith('.svg');

  // Should show fallback icon
  $: showFallback = !src || imageError;
</script>

<div class="entity-image size-{size}" class:svg={isSvg && !showFallback}>
  {#if showFallback}
    <div class="fallback-icon">
      {getEntityTypeIcon(entityType)}
    </div>
  {:else}
    {#if !imageLoaded}
      <div class="loading-placeholder">
        <div class="shimmer"></div>
      </div>
    {/if}
    <img
      {src}
      {alt}
      class:loaded={imageLoaded}
      on:load={handleLoad}
      on:error={handleError}
    />
  {/if}
</div>

<style>
  .entity-image {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background-color: var(--color-bg-primary, #121212);
    border-radius: 4px;
  }

  /* Size variants */
  .size-small {
    width: 32px;
    height: 32px;
  }

  .size-medium {
    width: 48px;
    height: 48px;
  }

  .size-large {
    width: 100%;
    aspect-ratio: 1;
  }

  /* Image styling */
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }

  img.loaded {
    opacity: 1;
  }

  /* SVG icons need special handling - invert for dark mode */
  .entity-image.svg img {
    object-fit: contain;
    padding: 15%;
    /* Invert black SVGs to white for dark theme */
    filter: invert(1);
  }

  /* Fallback icon */
  .fallback-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 1.5em;
    color: var(--color-text-secondary, #888);
  }

  .size-small .fallback-icon {
    font-size: 1rem;
  }

  .size-medium .fallback-icon {
    font-size: 1.5rem;
  }

  .size-large .fallback-icon {
    font-size: 3rem;
  }

  /* Loading placeholder */
  .loading-placeholder {
    position: absolute;
    inset: 0;
    background-color: var(--color-bg-secondary, #1e1e1e);
    overflow: hidden;
  }

  .shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.05) 50%,
      transparent 100%
    );
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
</style>
