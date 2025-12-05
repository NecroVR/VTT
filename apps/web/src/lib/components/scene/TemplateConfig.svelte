<script lang="ts">
  import type { TemplateType, CreateTemplateRequest } from '@vtt/shared';
  import { templatesStore } from '$lib/stores/templates';

  // Props
  export let isOpen: boolean = false;
  export let sceneId: string;
  export let x: number = 0;
  export let y: number = 0;
  export let onClose: () => void;

  // Form state
  let templateType: TemplateType = 'circle';
  let distance: number = 5;
  let direction: number = 0;
  let angle: number = 53;
  let width: number = 1;
  let color: string = '#ff0000';
  let fillAlpha: number = 0.3;
  let borderColor: string = '#ff0000';
  let hidden: boolean = false;

  async function handleSubmit() {
    const request: CreateTemplateRequest = {
      sceneId,
      templateType,
      x,
      y,
      distance,
      direction: templateType === 'cone' || templateType === 'ray' ? direction : null,
      angle: templateType === 'cone' ? angle : null,
      width: templateType === 'ray' || templateType === 'rectangle' ? width : null,
      color,
      fillAlpha,
      borderColor,
      hidden,
    };

    await templatesStore.createTemplate(request);
    onClose();
  }

  function handleCancel() {
    onClose();
  }

  // Reset form when modal opens
  $: if (isOpen) {
    templateType = 'circle';
    distance = 5;
    direction = 0;
    angle = 53;
    width = 1;
    color = '#ff0000';
    fillAlpha = 0.3;
    borderColor = '#ff0000';
    hidden = false;
  }
</script>

{#if isOpen}
  <div class="modal-overlay" on:click={handleCancel}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Place Template</h2>
        <button class="close-button" on:click={handleCancel}>&times;</button>
      </div>

      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
          <label for="templateType">Template Type</label>
          <select id="templateType" bind:value={templateType}>
            <option value="circle">Circle (Area)</option>
            <option value="cone">Cone</option>
            <option value="ray">Ray/Line</option>
            <option value="rectangle">Rectangle</option>
          </select>
        </div>

        <div class="form-group">
          <label for="distance">
            {#if templateType === 'circle'}
              Radius (grid units)
            {:else if templateType === 'rectangle'}
              Height (grid units)
            {:else}
              Length (grid units)
            {/if}
          </label>
          <input
            type="number"
            id="distance"
            bind:value={distance}
            min="1"
            max="100"
            step="0.5"
          />
        </div>

        {#if templateType === 'cone' || templateType === 'ray'}
          <div class="form-group">
            <label for="direction">Direction (degrees)</label>
            <input
              type="number"
              id="direction"
              bind:value={direction}
              min="0"
              max="359"
              step="1"
            />
            <small>0° = East, 90° = South, 180° = West, 270° = North</small>
          </div>
        {/if}

        {#if templateType === 'cone'}
          <div class="form-group">
            <label for="angle">Cone Angle (degrees)</label>
            <input
              type="number"
              id="angle"
              bind:value={angle}
              min="1"
              max="180"
              step="1"
            />
            <small>Default: 53° (D&D 5e standard)</small>
          </div>
        {/if}

        {#if templateType === 'ray' || templateType === 'rectangle'}
          <div class="form-group">
            <label for="width">Width (grid units)</label>
            <input
              type="number"
              id="width"
              bind:value={width}
              min="0.5"
              max="50"
              step="0.5"
            />
          </div>
        {/if}

        <div class="form-group">
          <label for="color">Color</label>
          <div class="color-input-group">
            <input type="color" id="color" bind:value={color} />
            <input type="text" bind:value={color} placeholder="#ff0000" />
          </div>
        </div>

        <div class="form-group">
          <label for="fillAlpha">Opacity</label>
          <input
            type="range"
            id="fillAlpha"
            bind:value={fillAlpha}
            min="0"
            max="1"
            step="0.05"
          />
          <span class="range-value">{(fillAlpha * 100).toFixed(0)}%</span>
        </div>

        <div class="form-group">
          <label for="borderColor">Border Color</label>
          <div class="color-input-group">
            <input type="color" id="borderColor" bind:value={borderColor} />
            <input type="text" bind:value={borderColor} placeholder="#ff0000" />
          </div>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" bind:checked={hidden} />
            Hidden from players
          </label>
        </div>

        <div class="form-actions">
          <button type="button" class="button-secondary" on:click={handleCancel}>
            Cancel
          </button>
          <button type="submit" class="button-primary">
            Place Template
          </button>
        </div>
      </form>
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
    padding: 1.5rem;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .modal-header h2 {
    margin: 0;
    color: #f9fafb;
    font-size: 1.5rem;
    font-weight: 600;
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
    background-color: #374151;
    color: #f9fafb;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-group label {
    display: block;
    color: #d1d5db;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .form-group input[type="text"],
  .form-group input[type="number"],
  .form-group select {
    width: 100%;
    background-color: #111827;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    padding: 0.5rem 0.75rem;
    color: #f9fafb;
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .form-group input[type="text"]:focus,
  .form-group input[type="number"]:focus,
  .form-group select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-group input[type="range"] {
    width: calc(100% - 60px);
    margin-right: 0.5rem;
  }

  .range-value {
    color: #d1d5db;
    font-size: 0.875rem;
    font-weight: 500;
    min-width: 50px;
    display: inline-block;
  }

  .color-input-group {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .color-input-group input[type="color"] {
    width: 60px;
    height: 40px;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    background: none;
    cursor: pointer;
  }

  .color-input-group input[type="text"] {
    flex: 1;
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: #d1d5db;
  }

  .checkbox-group input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }

  small {
    display: block;
    color: #9ca3af;
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #374151;
  }

  .button-primary,
  .button-secondary {
    padding: 0.625rem 1.25rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
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
    color: #f9fafb;
  }
</style>
