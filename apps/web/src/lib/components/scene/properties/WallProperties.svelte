<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Wall } from '@vtt/shared';

  export let walls: Wall[] = [];
  export let sceneId: string;
  export let campaignId: string;
  export let isGM: boolean = false;

  const dispatch = createEventDispatcher<{
    change: { objectId: string; property: string; value: any };
    delete: string;
  }>();

  $: wall = walls.length === 1 ? walls[0] : null;
  $: isMultiple = walls.length > 1;

  const wallTypes = [
    { value: 'normal', label: 'Normal' },
    { value: 'invisible', label: 'Invisible' },
    { value: 'ethereal', label: 'Ethereal' },
    { value: 'terrain', label: 'Terrain' },
  ];

  function handleChange(property: string, value: any) {
    if (wall) {
      dispatch('change', { objectId: wall.id, property, value });
    }
  }

  function handleDelete() {
    if (wall && confirm('Delete this wall?')) {
      dispatch('delete', wall.id);
    }
  }
</script>

{#if isMultiple}
  <div class="property-panel">
    <div class="section-header">Multiple Walls Selected</div>
    <div class="info-text">{walls.length} walls selected</div>
    <div class="section">
      <button class="button-full" on:click={() => dispatch('delete', walls[0].id)}>
        Delete Selected
      </button>
    </div>
  </div>
{:else if wall}
  <div class="property-panel">
    <div class="section-header">Wall Properties</div>

    <!-- Start Point -->
    <div class="section">
      <div class="section-title">Start Point</div>
      <div class="input-row">
        <label for="wall-x1">
          X1
          <input
            id="wall-x1"
            type="number"
            value={wall.x1}
            step="1"
            on:input={(e) => handleChange('x1', parseFloat(e.currentTarget.value))}
          />
        </label>
        <label for="wall-y1">
          Y1
          <input
            id="wall-y1"
            type="number"
            value={wall.y1}
            step="1"
            on:input={(e) => handleChange('y1', parseFloat(e.currentTarget.value))}
          />
        </label>
      </div>
    </div>

    <!-- End Point -->
    <div class="section">
      <div class="section-title">End Point</div>
      <div class="input-row">
        <label for="wall-x2">
          X2
          <input
            id="wall-x2"
            type="number"
            value={wall.x2}
            step="1"
            on:input={(e) => handleChange('x2', parseFloat(e.currentTarget.value))}
          />
        </label>
        <label for="wall-y2">
          Y2
          <input
            id="wall-y2"
            type="number"
            value={wall.y2}
            step="1"
            on:input={(e) => handleChange('y2', parseFloat(e.currentTarget.value))}
          />
        </label>
      </div>
    </div>

    <!-- Wall Type -->
    <div class="section">
      <label for="wall-type">
        Wall Type
        <select
          id="wall-type"
          value={wall.wallType}
          on:change={(e) => handleChange('wallType', e.currentTarget.value)}
        >
          {#each wallTypes as type}
            <option value={type.value}>{type.label}</option>
          {/each}
        </select>
      </label>
    </div>

    <!-- Actions -->
    <div class="section">
      {#if isGM}
        <button class="button-full button-danger" on:click={handleDelete}>
          Delete Wall
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

  input[type="number"]:focus,
  select:focus {
    outline: none;
    border-color: #4a9eff;
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
