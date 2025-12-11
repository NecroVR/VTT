<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let objects: any[] = [];
  export let objectType: string = '';
  export let sceneId: string;
  export let campaignId: string;
  export let isGM: boolean = false;

  const dispatch = createEventDispatcher<{
    changeAll: { property: string; value: any };
    deleteAll: void;
    moveAll: { offsetX: number; offsetY: number };
  }>();

  let offsetX: number = 0;
  let offsetY: number = 0;

  function handleMoveAll() {
    if (offsetX !== 0 || offsetY !== 0) {
      dispatch('moveAll', { offsetX, offsetY });
      offsetX = 0;
      offsetY = 0;
    }
  }

  function handleDeleteAll() {
    if (confirm(`Delete all ${objects.length} selected ${objectType}s?`)) {
      dispatch('deleteAll');
    }
  }

  function getTypeName(type: string): string {
    const typeNames: Record<string, string> = {
      token: 'Token',
      light: 'Light',
      wall: 'Wall',
      door: 'Door',
      window: 'Window',
      drawing: 'Drawing',
      tile: 'Tile',
      region: 'Region',
    };
    return typeNames[type] || 'Object';
  }

  $: typeName = getTypeName(objectType);
</script>

<div class="property-panel">
  <div class="section-header">Multiple {typeName}s Selected</div>

  <div class="section">
    <div class="count-badge">{objects.length} selected</div>
  </div>

  <!-- Position Offset -->
  <div class="section">
    <div class="section-title">Move All</div>
    <div class="input-row">
      <label for="multi-offset-x">
        Offset X
        <input
          id="multi-offset-x"
          type="number"
          bind:value={offsetX}
          step="1"
          placeholder="0"
        />
      </label>
      <label for="multi-offset-y">
        Offset Y
        <input
          id="multi-offset-y"
          type="number"
          bind:value={offsetY}
          step="1"
          placeholder="0"
        />
      </label>
    </div>
    <button class="button-full" on:click={handleMoveAll}>
      Apply Movement
    </button>
  </div>

  <!-- Common Actions -->
  <div class="section">
    <div class="section-title">Batch Actions</div>
    {#if isGM}
      <button class="button-full button-danger" on:click={handleDeleteAll}>
        Delete All Selected
      </button>
    {/if}
  </div>

  <!-- Info -->
  <div class="section">
    <div class="info-text">
      Select a single object to edit individual properties
    </div>
  </div>
</div>

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

  .count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    background-color: #4a9eff;
    color: #ffffff;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.875rem;
    align-self: flex-start;
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

  input[type="number"] {
    width: 100%;
    padding: 0.375rem;
    background-color: #2a2a2a;
    border: 1px solid #404040;
    border-radius: 3px;
    color: #e0e0e0;
    font-size: 0.75rem;
  }

  input[type="number"]:focus {
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
    text-align: center;
    padding: 0.5rem;
  }
</style>
