<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Region } from '@vtt/shared';

  export let regions: Region[] = [];
  export let sceneId: string;
  export let campaignId: string;
  export let isGM: boolean = false;

  const dispatch = createEventDispatcher<{
    change: { objectId: string; property: string; value: any };
    delete: string;
    openFullEditor: Region;
  }>();

  $: region = regions.length === 1 ? regions[0] : null;
  $: isMultiple = regions.length > 1;

  const triggerTypes = [
    { value: '', label: 'None' },
    { value: 'enter', label: 'On Enter' },
    { value: 'exit', label: 'On Exit' },
    { value: 'click', label: 'On Click' },
  ];

  function handleChange(property: string, value: any) {
    if (region) {
      dispatch('change', { objectId: region.id, property, value });
    }
  }

  function handleDelete() {
    if (region && confirm(`Delete region "${region.name}"?`)) {
      dispatch('delete', region.id);
    }
  }

  function handleOpenFullEditor() {
    if (region) {
      dispatch('openFullEditor', region);
    }
  }
</script>

{#if isMultiple}
  <div class="property-panel">
    <div class="section-header">Multiple Regions Selected</div>
    <div class="info-text">{regions.length} regions selected</div>
    <div class="section">
      <button class="button-full" on:click={() => dispatch('delete', regions[0].id)}>
        Delete Selected
      </button>
    </div>
  </div>
{:else if region}
  <div class="property-panel">
    <div class="section-header">Region Properties</div>

    <!-- Name -->
    <div class="section">
      <label for="region-name">
        Name
        <input
          id="region-name"
          type="text"
          value={region.name}
          on:input={(e) => handleChange('name', e.currentTarget.value)}
        />
      </label>
    </div>

    <!-- Position Display -->
    <div class="section">
      <div class="section-title">Position</div>
      <div class="info-text">
        Center: ({region.x.toFixed(0)}, {region.y.toFixed(0)})
      </div>
    </div>

    <!-- Color & Opacity -->
    <div class="section">
      <div class="section-title">Appearance</div>
      <div class="input-row">
        <label for="region-color">
          Color
          <input
            id="region-color"
            type="color"
            value={region.color}
            on:input={(e) => handleChange('color', e.currentTarget.value)}
          />
        </label>
        <label for="region-alpha">
          Opacity: {Math.round(region.alpha * 100)}%
          <input
            id="region-alpha"
            type="range"
            value={region.alpha}
            min="0"
            max="1"
            step="0.05"
            on:input={(e) => handleChange('alpha', parseFloat(e.currentTarget.value))}
          />
        </label>
      </div>
    </div>

    <!-- Trigger Settings -->
    <div class="section">
      <label for="region-trigger">
        Trigger
        <select
          id="region-trigger"
          value={region.triggerType || ''}
          on:change={(e) => handleChange('triggerType', e.currentTarget.value || null)}
        >
          {#each triggerTypes as type}
            <option value={type.value}>{type.label}</option>
          {/each}
        </select>
      </label>
    </div>

    <!-- Actions -->
    <div class="section">
      <button class="button-full button-primary" on:click={handleOpenFullEditor}>
        Open Full Editor
      </button>
      {#if isGM}
        <button class="button-full button-danger" on:click={handleDelete}>
          Delete Region
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

  .input-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #aaa;
  }

  input[type="text"],
  select {
    width: 100%;
    padding: 0.375rem;
    background-color: #2a2a2a;
    border: 1px solid #404040;
    border-radius: 3px;
    color: #e0e0e0;
    font-size: 0.75rem;
  }

  input[type="text"]:focus,
  select:focus {
    outline: none;
    border-color: #4a9eff;
  }

  input[type="color"] {
    width: 100%;
    height: 32px;
    padding: 2px;
    background-color: #2a2a2a;
    border: 1px solid #404040;
    border-radius: 3px;
    cursor: pointer;
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

  .button-primary {
    background-color: #4a9eff;
    border-color: #4a9eff;
    color: #ffffff;
  }

  .button-primary:hover {
    background-color: #3a8eef;
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
