<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let settings: {
    doorType: 'normal' | 'secret' | 'locked';
    initialState: 'open' | 'closed';
    gridSnap: boolean;
  };

  const dispatch = createEventDispatcher<{
    change: typeof settings;
  }>();

  function handleChange() {
    dispatch('change', settings);
  }
</script>

<div class="tool-settings">
  <h3 class="settings-title">Door Settings</h3>

  <div class="setting-row">
    <label for="door-type">Type</label>
    <select
      id="door-type"
      bind:value={settings.doorType}
      on:change={handleChange}
    >
      <option value="normal">Normal</option>
      <option value="secret">Secret</option>
      <option value="locked">Locked</option>
    </select>
  </div>

  <div class="setting-row">
    <label for="door-state">Initial State</label>
    <select
      id="door-state"
      bind:value={settings.initialState}
      on:change={handleChange}
    >
      <option value="closed">Closed</option>
      <option value="open">Open</option>
    </select>
  </div>

  <div class="setting-row checkbox-row">
    <label>
      <input
        type="checkbox"
        bind:checked={settings.gridSnap}
        on:change={handleChange}
      />
      Grid Snap
    </label>
  </div>
</div>

<style>
  .tool-settings {
    padding: 0.75rem;
    background-color: #1e1e1e;
    border-radius: 4px;
  }

  .settings-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #e0e0e0;
    margin: 0 0 0.75rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #333;
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .setting-row:last-child {
    margin-bottom: 0;
  }

  .checkbox-row {
    justify-content: flex-start;
  }

  label {
    font-size: 0.75rem;
    color: #b0b0b0;
    white-space: nowrap;
  }

  .checkbox-row label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    cursor: pointer;
  }

  select {
    padding: 0.25rem 0.375rem;
    border: 1px solid #333;
    border-radius: 3px;
    background-color: #2a2a2a;
    color: #e0e0e0;
    font-size: 0.75rem;
    min-width: 0;
    flex: 1;
    max-width: 120px;
  }

  select:focus {
    outline: none;
    border-color: #4a9eff;
  }

  input[type="checkbox"] {
    width: 14px;
    height: 14px;
    cursor: pointer;
    margin: 0;
  }
</style>
