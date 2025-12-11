<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Token } from '@vtt/shared';

  export let tokens: Token[] = [];
  export let sceneId: string;
  export let campaignId: string;
  export let isGM: boolean = false;

  const dispatch = createEventDispatcher<{
    change: { objectId: string; property: string; value: any };
    delete: string;
    openFullEditor: Token;
  }>();

  $: token = tokens.length === 1 ? tokens[0] : null;
  $: isMultiple = tokens.length > 1;

  function handleChange(property: string, value: any) {
    if (token) {
      dispatch('change', { objectId: token.id, property, value });
    }
  }

  function handleDelete() {
    if (token && confirm(`Delete token "${token.name}"?`)) {
      dispatch('delete', token.id);
    }
  }

  function handleOpenFullEditor() {
    if (token) {
      dispatch('openFullEditor', token);
    }
  }
</script>

{#if isMultiple}
  <div class="property-panel">
    <div class="section-header">Multiple Tokens Selected</div>
    <div class="info-text">{tokens.length} tokens selected</div>
    <div class="section">
      <button class="button-full" on:click={() => dispatch('delete', tokens[0].id)}>
        Delete Selected
      </button>
    </div>
  </div>
{:else if token}
  <div class="property-panel">
    <div class="section-header">Token Properties</div>

    <!-- Name -->
    <div class="section">
      <label for="token-name">Name</label>
      <input
        id="token-name"
        type="text"
        value={token.name}
        on:input={(e) => handleChange('name', e.currentTarget.value)}
      />
    </div>

    <!-- Position -->
    <div class="section">
      <div class="section-title">Position</div>
      <div class="input-row">
        <label for="token-x">
          X
          <input
            id="token-x"
            type="number"
            value={token.x}
            step="1"
            on:input={(e) => handleChange('x', parseFloat(e.currentTarget.value))}
          />
        </label>
        <label for="token-y">
          Y
          <input
            id="token-y"
            type="number"
            value={token.y}
            step="1"
            on:input={(e) => handleChange('y', parseFloat(e.currentTarget.value))}
          />
        </label>
      </div>
    </div>

    <!-- Size -->
    <div class="section">
      <div class="section-title">Size</div>
      <div class="input-row">
        <label for="token-width">
          W
          <input
            id="token-width"
            type="number"
            value={token.width}
            min="1"
            step="1"
            on:input={(e) => handleChange('width', parseFloat(e.currentTarget.value))}
          />
        </label>
        <label for="token-height">
          H
          <input
            id="token-height"
            type="number"
            value={token.height}
            min="1"
            step="1"
            on:input={(e) => handleChange('height', parseFloat(e.currentTarget.value))}
          />
        </label>
      </div>
    </div>

    <!-- Rotation & Elevation -->
    <div class="section">
      <label for="token-rotation">
        Rotation: {token.rotation}°
        <input
          id="token-rotation"
          type="range"
          value={token.rotation}
          min="0"
          max="360"
          step="15"
          on:input={(e) => handleChange('rotation', parseFloat(e.currentTarget.value))}
        />
      </label>
    </div>

    <div class="section">
      <label for="token-elevation">
        Elevation
        <input
          id="token-elevation"
          type="number"
          value={token.elevation}
          step="1"
          on:input={(e) => handleChange('elevation', parseFloat(e.currentTarget.value))}
        />
      </label>
    </div>

    {#if isGM}
      <!-- Visibility -->
      <div class="section">
        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={token.visible}
            on:change={(e) => handleChange('visible', e.currentTarget.checked)}
          />
          Visible to players
        </label>
      </div>
    {/if}

    <!-- Vision -->
    <div class="section">
      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={token.vision}
          on:change={(e) => handleChange('vision', e.currentTarget.checked)}
        />
        Has vision
      </label>
      {#if token.vision}
        <label for="token-vision-range">
          Range
          <input
            id="token-vision-range"
            type="number"
            value={token.visionRange}
            min="0"
            step="10"
            on:input={(e) => handleChange('visionRange', parseFloat(e.currentTarget.value))}
          />
        </label>
      {/if}
    </div>

    <!-- Grid Snapping -->
    <div class="section">
      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={token.snapToGrid}
          on:change={(e) => handleChange('snapToGrid', e.currentTarget.checked)}
        />
        Snap to grid
      </label>
    </div>

    <!-- Light Emission -->
    <div class="section">
      <div class="section-title">Light Emission</div>
      <div class="input-row">
        <label for="token-light-bright">
          Bright
          <input
            id="token-light-bright"
            type="number"
            value={token.lightBright}
            min="0"
            step="5"
            on:input={(e) => handleChange('lightBright', parseFloat(e.currentTarget.value))}
          />
        </label>
        <label for="token-light-dim">
          Dim
          <input
            id="token-light-dim"
            type="number"
            value={token.lightDim}
            min="0"
            step="5"
            on:input={(e) => handleChange('lightDim', parseFloat(e.currentTarget.value))}
          />
        </label>
      </div>
    </div>

    <!-- Actions -->
    <div class="section">
      <button class="button-full button-primary" on:click={handleOpenFullEditor}>
        Open Full Editor
      </button>
      {#if isGM}
        <button class="button-full button-danger" on:click={handleDelete}>
          Delete Token
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

  .checkbox-label {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }

  input[type="text"],
  input[type="number"] {
    width: 100%;
    padding: 0.375rem;
    background-color: #2a2a2a;
    border: 1px solid #404040;
    border-radius: 3px;
    color: #e0e0e0;
    font-size: 0.75rem;
  }

  input[type="text"]:focus,
  input[type="number"]:focus {
    outline: none;
    border-color: #4a9eff;
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

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
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
