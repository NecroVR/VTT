<script lang="ts">
  import { regionsStore } from '$lib/stores/regions';
  import type { Region, RegionShape, RegionPoint } from '@vtt/shared';

  // Props
  export let isOpen: boolean = false;
  export let regionId: string = '';
  export let sceneId: string = '';
  export let onClose: () => void = () => {};

  // Local state
  let region: Region | null = null;
  let name: string = '';
  let shape: RegionShape = 'rectangle';
  let x: number = 0;
  let y: number = 0;
  let width: number | null = 5;
  let height: number | null = 5;
  let radius: number | null = null;
  let points: RegionPoint[] | null = null;
  let color: string = '#3b82f6';
  let alpha: number = 0.3;
  let hidden: boolean = false;
  let locked: boolean = false;
  let triggerType: string = '';
  let hasTrigger: boolean = false;
  let triggerAction: string = '';
  let triggerData: Record<string, unknown> = {};

  // Subscribe to store and load region when regionId changes
  $: if (isOpen && regionId) {
    loadRegion();
  }

  function loadRegion() {
    regionsStore.subscribe(state => {
      const r = state.regions.get(regionId);
      if (r) {
        region = r;
        name = r.name;
        shape = r.shape;
        x = r.x;
        y = r.y;
        width = r.width;
        height = r.height;
        radius = r.radius;
        points = r.points;
        color = r.color;
        alpha = r.alpha;
        hidden = r.hidden;
        locked = r.locked;
        triggerType = r.triggerType || '';
        hasTrigger = !!r.triggerType;
        triggerAction = r.triggerAction || '';
        triggerData = r.triggerData || {};
      }
    })();
  }

  async function handleSave() {
    if (!region) return;

    const updates: Partial<Region> = {
      name,
      shape,
      x,
      y,
      width: shape === 'rectangle' || shape === 'ellipse' ? width : null,
      height: shape === 'rectangle' || shape === 'ellipse' ? height : null,
      radius: shape === 'circle' ? radius : null,
      points: shape === 'polygon' ? points : null,
      color,
      alpha,
      hidden,
      locked,
      triggerType: hasTrigger ? triggerType : null,
      triggerAction: hasTrigger ? triggerAction : null,
      triggerData: hasTrigger ? triggerData : null,
    };

    // Update via store (which calls API)
    await regionsStore.updateRegion(regionId, updates);
    onClose();
  }

  async function handleDelete() {
    if (!region) return;

    if (!confirm('Are you sure you want to delete this region?')) {
      return;
    }

    // Delete via store (which calls API)
    await regionsStore.deleteRegion(regionId);
    onClose();
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }
</script>

{#if isOpen && region}
  <div class="modal-overlay" on:click={handleOverlayClick} role="presentation">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Edit Region</h2>
        <button class="close-button" on:click={onClose} aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        <!-- Basic Settings -->
        <div class="form-section">
          <h3 class="section-title">Basic Settings</h3>

          <div class="form-group">
            <label for="region-name">Name</label>
            <input
              id="region-name"
              type="text"
              bind:value={name}
              class="text-input"
              placeholder="Region name"
            />
          </div>

          <div class="form-group">
            <label for="region-shape">Shape</label>
            <select id="region-shape" bind:value={shape} class="select">
              <option value="rectangle">Rectangle</option>
              <option value="circle">Circle</option>
              <option value="ellipse">Ellipse</option>
              <option value="polygon">Polygon</option>
            </select>
          </div>
        </div>

        <!-- Position & Size -->
        <div class="form-section">
          <h3 class="section-title">Position & Size</h3>

          <div class="form-row">
            <div class="form-group">
              <label for="region-x">X Position</label>
              <input
                id="region-x"
                type="number"
                bind:value={x}
                step="0.1"
                class="number-input"
              />
            </div>

            <div class="form-group">
              <label for="region-y">Y Position</label>
              <input
                id="region-y"
                type="number"
                bind:value={y}
                step="0.1"
                class="number-input"
              />
            </div>
          </div>

          {#if shape === 'rectangle' || shape === 'ellipse'}
            <div class="form-row">
              <div class="form-group">
                <label for="region-width">Width (grid units)</label>
                <input
                  id="region-width"
                  type="number"
                  bind:value={width}
                  min="0.1"
                  step="0.1"
                  class="number-input"
                />
              </div>

              <div class="form-group">
                <label for="region-height">Height (grid units)</label>
                <input
                  id="region-height"
                  type="number"
                  bind:value={height}
                  min="0.1"
                  step="0.1"
                  class="number-input"
                />
              </div>
            </div>
          {/if}

          {#if shape === 'circle'}
            <div class="form-group">
              <label for="region-radius">Radius (grid units)</label>
              <input
                id="region-radius"
                type="number"
                bind:value={radius}
                min="0.1"
                step="0.1"
                class="number-input"
              />
            </div>
          {/if}

          {#if shape === 'polygon'}
            <div class="form-group">
              <p class="help-text">Polygon points are managed by drawing on the canvas</p>
            </div>
          {/if}
        </div>

        <!-- Visual Properties -->
        <div class="form-section">
          <h3 class="section-title">Visual Properties</h3>

          <div class="form-group">
            <label for="region-color">Color</label>
            <input
              id="region-color"
              type="color"
              bind:value={color}
              class="color-input"
            />
          </div>

          <div class="form-group">
            <label for="region-alpha">Opacity: {Math.round(alpha * 100)}%</label>
            <input
              id="region-alpha"
              type="range"
              min="0"
              max="1"
              step="0.05"
              bind:value={alpha}
              class="slider"
            />
          </div>
        </div>

        <!-- Trigger Settings -->
        <div class="form-section">
          <h3 class="section-title">Trigger Settings</h3>

          <div class="form-group">
            <label>
              <input type="checkbox" bind:checked={hasTrigger} />
              Enable Trigger
            </label>
          </div>

          {#if hasTrigger}
            <div class="form-group">
              <label for="trigger-type">Trigger Type</label>
              <select id="trigger-type" bind:value={triggerType} class="select">
                <option value="">-- Select Type --</option>
                <option value="enter">On Enter</option>
                <option value="exit">On Exit</option>
                <option value="click">On Click</option>
              </select>
            </div>

            <div class="form-group">
              <label for="trigger-action">Trigger Action</label>
              <select id="trigger-action" bind:value={triggerAction} class="select">
                <option value="">-- Select Action --</option>
                <option value="show_journal">Show Journal</option>
                <option value="play_sound">Play Sound</option>
                <option value="custom">Custom Script</option>
              </select>
            </div>

            {#if triggerAction === 'show_journal'}
              <div class="form-group">
                <label for="trigger-journal">Journal ID</label>
                <input
                  id="trigger-journal"
                  type="text"
                  bind:value={triggerData.journalId}
                  class="text-input"
                  placeholder="Journal ID"
                />
              </div>
            {:else if triggerAction === 'play_sound'}
              <div class="form-group">
                <label for="trigger-sound">Sound URL</label>
                <input
                  id="trigger-sound"
                  type="text"
                  bind:value={triggerData.soundUrl}
                  class="text-input"
                  placeholder="https://example.com/sound.mp3"
                />
              </div>
            {:else if triggerAction === 'custom'}
              <div class="form-group">
                <label for="trigger-script">Custom Script</label>
                <textarea
                  id="trigger-script"
                  bind:value={triggerData.script}
                  class="text-input"
                  rows="4"
                  placeholder="// JavaScript code here"
                />
              </div>
            {/if}
          {/if}
        </div>

        <!-- Other Settings -->
        <div class="form-section">
          <h3 class="section-title">Options</h3>

          <div class="form-group">
            <label>
              <input type="checkbox" bind:checked={hidden} />
              Hidden (GM-only by default)
            </label>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" bind:checked={locked} />
              Locked
            </label>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="button button-danger" on:click={handleDelete}>
          Delete
        </button>
        <div class="button-group">
          <button class="button button-secondary" on:click={onClose}>
            Cancel
          </button>
          <button class="button button-primary" on:click={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background-color: #1f2937;
    border: 1px solid #374151;
    border-radius: 0.5rem;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #374151;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #f9fafb;
    margin: 0;
  }

  .close-button {
    background: none;
    border: none;
    color: #9ca3af;
    font-size: 2rem;
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    transition: all 0.2s;
  }

  .close-button:hover {
    color: #f9fafb;
    background-color: #374151;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .form-section {
    margin-bottom: 1.5rem;
  }

  .form-section:last-child {
    margin-bottom: 0;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #f9fafb;
    margin: 0 0 1rem 0;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group:last-child {
    margin-bottom: 0;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #d1d5db;
    margin-bottom: 0.5rem;
  }

  .text-input,
  .number-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    background-color: #111827;
    color: #f9fafb;
    font-size: 0.875rem;
    font-family: inherit;
  }

  textarea.text-input {
    resize: vertical;
  }

  .select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    background-color: #111827;
    color: #f9fafb;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .color-input {
    width: 100%;
    height: 3rem;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    cursor: pointer;
    background-color: #111827;
  }

  .slider {
    width: 100%;
    height: 0.5rem;
    border-radius: 0.25rem;
    background: #374151;
    outline: none;
    cursor: pointer;
  }

  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
  }

  .slider::-moz-range-thumb {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
  }

  .help-text {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 0.25rem;
    margin-bottom: 0;
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-top: 1px solid #374151;
  }

  .button-group {
    display: flex;
    gap: 0.5rem;
  }

  .button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button-primary {
    background-color: #3b82f6;
    color: #ffffff;
  }

  .button-primary:hover {
    background-color: #2563eb;
  }

  .button-secondary {
    background-color: #374151;
    color: #d1d5db;
  }

  .button-secondary:hover {
    background-color: #4b5563;
  }

  .button-danger {
    background-color: #dc2626;
    color: #ffffff;
  }

  .button-danger:hover {
    background-color: #b91c1c;
  }

  input[type="checkbox"] {
    margin-right: 0.5rem;
    cursor: pointer;
  }
</style>
