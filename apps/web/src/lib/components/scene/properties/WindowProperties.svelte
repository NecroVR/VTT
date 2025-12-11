<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Window } from '@vtt/shared';

  export let windows: Window[] = [];
  export let sceneId: string;
  export let campaignId: string;
  export let isGM: boolean = false;

  const dispatch = createEventDispatcher<{
    change: { objectId: string; property: string; value: any };
    delete: string;
  }>();

  $: window = windows.length === 1 ? windows[0] : null;
  $: isMultiple = windows.length > 1;

  // Windows don't have opacity in the type definition, but we can add it to data
  $: opacity = window ? (window.data.opacity as number) || 0.5 : 0.5;

  function handleChange(property: string, value: any) {
    if (window) {
      if (property === 'opacity') {
        // Store opacity in data object
        dispatch('change', {
          objectId: window.id,
          property: 'data',
          value: { ...window.data, opacity: value },
        });
      } else {
        dispatch('change', { objectId: window.id, property, value });
      }
    }
  }

  function handleDelete() {
    if (window && confirm('Delete this window?')) {
      dispatch('delete', window.id);
    }
  }
</script>

{#if isMultiple}
  <div class="property-panel">
    <div class="section-header">Multiple Windows Selected</div>
    <div class="info-text">{windows.length} windows selected</div>
    <div class="section">
      <button class="button-full" on:click={() => dispatch('delete', windows[0].id)}>
        Delete Selected
      </button>
    </div>
  </div>
{:else if window}
  <div class="property-panel">
    <div class="section-header">Window Properties</div>

    <!-- Position Display -->
    <div class="section">
      <div class="section-title">Position</div>
      <div class="info-text">
        From ({window.x1.toFixed(0)}, {window.y1.toFixed(0)}) to ({window.x2.toFixed(0)}, {window.y2.toFixed(0)})
      </div>
    </div>

    <!-- Opacity -->
    <div class="section">
      <label for="window-opacity">
        Opacity: {Math.round(opacity * 100)}%
        <input
          id="window-opacity"
          type="range"
          value={opacity}
          min="0"
          max="1"
          step="0.05"
          on:input={(e) => handleChange('opacity', parseFloat(e.currentTarget.value))}
        />
      </label>
    </div>

    <!-- Actions -->
    <div class="section">
      {#if isGM}
        <button class="button-full button-danger" on:click={handleDelete}>
          Delete Window
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .property-panel {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
    background-color: #1e1e1e;
    color: #e0e0e0;
    font-size: 0.875rem;
  }

  .section-header {
    font-size: 1rem;
    font-weight: 600;
    color: #ffffff;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #333;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-title {
    font-size: 0.8rem;
    font-weight: 500;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #aaa;
  }

  input[type="range"] {
    width: 100%;
    height: 4px;
    background: #404040;
    border-radius: 2px;
    outline: none;
    -webkit-appearance: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    background: #4a9eff;
    border-radius: 50%;
    cursor: pointer;
  }

  input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: #4a9eff;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }

  .button-full {
    width: 100%;
    padding: 0.5rem;
    background-color: #333;
    color: #e0e0e0;
    border: 1px solid #404040;
    border-radius: 3px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .button-full:hover {
    background-color: #404040;
  }

  .button-danger {
    background-color: #ef4444;
    border-color: #ef4444;
    color: #ffffff;
  }

  .button-danger:hover {
    background-color: #dc2626;
  }

  .info-text {
    font-size: 0.75rem;
    color: #aaa;
    font-style: italic;
  }
</style>
