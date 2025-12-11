<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { AmbientLight } from '@vtt/shared';

  export let lights: AmbientLight[] = [];
  export let sceneId: string;
  export let campaignId: string;
  export let isGM: boolean = false;

  const dispatch = createEventDispatcher<{
    change: { objectId: string; property: string; value: any };
    delete: string;
    openFullEditor: AmbientLight;
  }>();

  $: light = lights.length === 1 ? lights[0] : null;
  $: isMultiple = lights.length > 1;

  const animationTypes = [
    { value: null, label: 'None' },
    { value: 'torch', label: 'Torch' },
    { value: 'pulse', label: 'Pulse' },
    { value: 'chroma', label: 'Chroma' },
    { value: 'wave', label: 'Wave' },
    { value: 'sparkle', label: 'Sparkle' },
  ];

  function handleChange(property: string, value: any) {
    if (light) {
      dispatch('change', { objectId: light.id, property, value });
    }
  }

  function handleDelete() {
    if (light && confirm('Delete this light?')) {
      dispatch('delete', light.id);
    }
  }

  function handleOpenFullEditor() {
    if (light) {
      dispatch('openFullEditor', light);
    }
  }
</script>

{#if isMultiple}
  <div class="property-panel">
    <div class="section-header">Multiple Lights Selected</div>
    <div class="info-text">{lights.length} lights selected</div>
    <div class="section">
      <button class="button-full" on:click={() => dispatch('delete', lights[0].id)}>
        Delete Selected
      </button>
    </div>
  </div>
{:else if light}
  <div class="property-panel">
    <div class="section-header">Light Properties</div>

    <!-- Position -->
    <div class="section">
      <div class="section-title">Position</div>
      <div class="input-row">
        <label for="light-x">
          X
          <input
            id="light-x"
            type="number"
            value={light.x}
            step="1"
            on:input={(e) => handleChange('x', parseFloat(e.currentTarget.value))}
          />
        </label>
        <label for="light-y">
          Y
          <input
            id="light-y"
            type="number"
            value={light.y}
            step="1"
            on:input={(e) => handleChange('y', parseFloat(e.currentTarget.value))}
          />
        </label>
      </div>
    </div>

    <!-- Radius -->
    <div class="section">
      <div class="section-title">Radius</div>
      <div class="input-row">
        <label for="light-bright">
          Bright
          <input
            id="light-bright"
            type="number"
            value={light.bright}
            min="0"
            step="5"
            on:input={(e) => handleChange('bright', parseFloat(e.currentTarget.value))}
          />
        </label>
        <label for="light-dim">
          Dim
          <input
            id="light-dim"
            type="number"
            value={light.dim}
            min="0"
            step="5"
            on:input={(e) => handleChange('dim', parseFloat(e.currentTarget.value))}
          />
        </label>
      </div>
    </div>

    <!-- Color -->
    <div class="section">
      <label for="light-color">
        Color
        <div class="color-input-wrapper">
          <input
            id="light-color"
            type="color"
            value={light.color}
            on:input={(e) => handleChange('color', e.currentTarget.value)}
          />
          <input
            type="text"
            value={light.color}
            on:input={(e) => handleChange('color', e.currentTarget.value)}
          />
        </div>
      </label>
    </div>

    <!-- Angle & Rotation -->
    <div class="section">
      <label for="light-angle">
        Angle: {light.angle}°
        <input
          id="light-angle"
          type="range"
          value={light.angle}
          min="0"
          max="360"
          step="15"
          on:input={(e) => handleChange('angle', parseFloat(e.currentTarget.value))}
        />
      </label>
    </div>

    <div class="section">
      <label for="light-rotation">
        Rotation: {light.rotation}°
        <input
          id="light-rotation"
          type="range"
          value={light.rotation}
          min="0"
          max="360"
          step="15"
          on:input={(e) => handleChange('rotation', parseFloat(e.currentTarget.value))}
        />
      </label>
    </div>

    <!-- Animation -->
    <div class="section">
      <label for="light-animation">
        Animation
        <select
          id="light-animation"
          value={light.animationType || ''}
          on:change={(e) => handleChange('animationType', e.currentTarget.value || null)}
        >
          {#each animationTypes as anim}
            <option value={anim.value || ''}>{anim.label}</option>
          {/each}
        </select>
      </label>
    </div>

    <!-- Enabled -->
    <div class="section">
      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={!light.hidden}
          on:change={(e) => handleChange('hidden', !e.currentTarget.checked)}
        />
        Enabled
      </label>
    </div>

    <!-- Actions -->
    <div class="section">
      <button class="button-full button-primary" on:click={handleOpenFullEditor}>
        Open Full Editor
      </button>
      {#if isGM}
        <button class="button-full button-danger" on:click={handleDelete}>
          Delete Light
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
  input[type="number"],
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
  input[type="number"]:focus,
  select:focus {
    outline: none;
    border-color: #4a9eff;
  }

  input[type="color"] {
    width: 40px;
    height: 32px;
    padding: 2px;
    background-color: #2a2a2a;
    border: 1px solid #404040;
    border-radius: 3px;
    cursor: pointer;
  }

  .color-input-wrapper {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .color-input-wrapper input[type="text"] {
    flex: 1;
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
