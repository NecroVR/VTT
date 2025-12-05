<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Compendium, CompendiumEntityType } from '@vtt/shared';
  import { compendiumsStore } from '$lib/stores/compendiums';

  export let compendium: Compendium | null = null;
  export let gameId: string;

  const dispatch = createEventDispatcher<{
    close: void;
    created: Compendium;
    updated: Compendium;
  }>();

  const isEditing = compendium !== null;
  let isSaving = false;

  // Form state
  let formData = {
    name: compendium?.name || '',
    label: compendium?.label || '',
    entityType: (compendium?.entityType || 'Actor') as CompendiumEntityType,
    system: compendium?.system || null,
    private: compendium?.private || false,
    locked: compendium?.locked || false,
  };

  const entityTypes: { value: CompendiumEntityType; label: string; description: string }[] = [
    { value: 'Actor', label: 'Actor', description: 'Characters, NPCs, and creatures' },
    { value: 'Item', label: 'Item', description: 'Equipment, weapons, and consumables' },
    { value: 'JournalEntry', label: 'Journal Entry', description: 'Lore, notes, and documents' },
    { value: 'Scene', label: 'Scene', description: 'Maps and battle scenes' },
  ];

  function handleClose() {
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  async function handleSave() {
    if (!formData.name || !formData.label) {
      alert('Please fill in all required fields');
      return;
    }

    isSaving = true;

    if (isEditing && compendium) {
      // Update existing compendium
      const success = await compendiumsStore.updateCompendium(compendium.id, {
        name: formData.name,
        label: formData.label,
        private: formData.private,
        locked: formData.locked,
      });

      isSaving = false;

      if (success) {
        // Get updated compendium from store
        const updated = $compendiumsStore.compendiums.get(compendium.id);
        if (updated) {
          dispatch('updated', updated);
        }
        handleClose();
      } else {
        alert('Failed to update compendium');
      }
    } else {
      // Create new compendium
      const newCompendium = await compendiumsStore.createCompendium(gameId, {
        name: formData.name,
        label: formData.label,
        entityType: formData.entityType,
        system: formData.system,
        private: formData.private,
        locked: formData.locked,
      });

      isSaving = false;

      if (newCompendium) {
        dispatch('created', newCompendium);
        handleClose();
      } else {
        alert('Failed to create compendium');
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-backdrop" on:click={handleBackdropClick}>
  <div class="modal-content" on:click|stopPropagation>
    <header class="modal-header">
      <h2>{isEditing ? 'Edit Compendium' : 'Create Compendium'}</h2>
      <button class="close-button" on:click={handleClose} aria-label="Close">
        &times;
      </button>
    </header>

    <div class="modal-body">
      <form on:submit|preventDefault={handleSave}>
        <!-- Basic Info -->
        <section class="form-section">
          <h3>Basic Information</h3>

          <div class="form-row">
            <label for="compendium-name">
              Name (Internal)
              <input
                id="compendium-name"
                type="text"
                bind:value={formData.name}
                placeholder="monsters"
                required
                disabled={isEditing}
              />
            </label>
            <p class="field-hint">Lowercase, no spaces. Used for internal reference.</p>
          </div>

          <div class="form-row">
            <label for="compendium-label">
              Label (Display)
              <input
                id="compendium-label"
                type="text"
                bind:value={formData.label}
                placeholder="Monster Manual"
                required
              />
            </label>
            <p class="field-hint">Display name shown to users.</p>
          </div>
        </section>

        <!-- Entity Type -->
        {#if !isEditing}
          <section class="form-section">
            <h3>Content Type</h3>

            <div class="entity-type-selector">
              {#each entityTypes as type}
                <label class="entity-type-option">
                  <input
                    type="radio"
                    name="entityType"
                    value={type.value}
                    bind:group={formData.entityType}
                  />
                  <div class="option-content">
                    <div class="option-label">{type.label}</div>
                    <div class="option-description">{type.description}</div>
                  </div>
                </label>
              {/each}
            </div>
          </section>

          <!-- System -->
          <section class="form-section">
            <h3>Game System (Optional)</h3>

            <div class="form-row">
              <label for="compendium-system">
                System
                <input
                  id="compendium-system"
                  type="text"
                  bind:value={formData.system}
                  placeholder="dnd5e, pf2e, etc."
                />
              </label>
              <p class="field-hint">Leave blank for system-agnostic content.</p>
            </div>
          </section>
        {/if}

        <!-- Settings -->
        <section class="form-section">
          <h3>Settings</h3>

          <div class="form-row-checkbox">
            <label>
              <input type="checkbox" bind:checked={formData.private} />
              <div class="checkbox-content">
                <div class="checkbox-label">Private</div>
                <div class="checkbox-description">Only visible to game members</div>
              </div>
            </label>
          </div>

          <div class="form-row-checkbox">
            <label>
              <input type="checkbox" bind:checked={formData.locked} />
              <div class="checkbox-content">
                <div class="checkbox-label">Locked</div>
                <div class="checkbox-description">Prevent editing of entries</div>
              </div>
            </label>
          </div>
        </section>

        {#if $compendiumsStore.error}
          <div class="error-message">
            {$compendiumsStore.error}
          </div>
        {/if}
      </form>
    </div>

    <footer class="modal-footer">
      <div class="footer-left"></div>
      <div class="footer-right">
        <button class="button-secondary" on:click={handleClose} disabled={isSaving}>
          Cancel
        </button>
        <button class="button-primary" on:click={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Compendium'}
        </button>
      </div>
    </footer>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
  }

  .modal-content {
    background-color: var(--color-bg-secondary, #1e1e1e);
    border-radius: 8px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .close-button {
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    color: var(--color-text-secondary, #aaa);
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s, color 0.2s;
  }

  .close-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary, #ffffff);
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .form-section {
    margin-bottom: 1.5rem;
  }

  .form-section:last-child {
    margin-bottom: 0;
  }

  .form-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
    border-bottom: 1px solid var(--color-border, #333);
    padding-bottom: 0.5rem;
  }

  .form-row {
    margin-bottom: 1rem;
  }

  .field-hint {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: var(--color-text-secondary, #666);
  }

  .form-row-checkbox {
    margin-bottom: 0.75rem;
  }

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary, #aaa);
    margin-bottom: 0.25rem;
  }

  .form-row-checkbox label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
  }

  input[type="text"] {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    background-color: var(--color-bg-primary, #121212);
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  input[type="text"]:focus {
    outline: none;
    border-color: #4a90e2;
  }

  input[type="text"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
    margin-top: 0.125rem;
    flex-shrink: 0;
  }

  .checkbox-content {
    flex: 1;
  }

  .checkbox-label {
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .checkbox-description {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #666);
    margin-top: 0.125rem;
  }

  .entity-type-selector {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .entity-type-option {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .entity-type-option:hover {
    border-color: #4a90e2;
    background-color: rgba(74, 144, 226, 0.05);
  }

  .entity-type-option:has(input:checked) {
    border-color: #4a90e2;
    background-color: rgba(74, 144, 226, 0.1);
  }

  .entity-type-option input[type="radio"] {
    margin-top: 0.125rem;
    cursor: pointer;
  }

  .option-content {
    flex: 1;
  }

  .option-label {
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .option-description {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #666);
    margin-top: 0.125rem;
  }

  .error-message {
    margin-top: 1rem;
    padding: 0.75rem;
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    border-radius: 4px;
    color: #ef4444;
    font-size: 0.875rem;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .footer-left,
  .footer-right {
    display: flex;
    gap: 0.75rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
  }

  button:active {
    transform: scale(0.98);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-primary {
    background-color: #4a90e2;
    color: white;
  }

  .button-primary:hover:not(:disabled) {
    background-color: #357abd;
  }

  .button-secondary {
    background-color: transparent;
    color: var(--color-text-secondary, #aaa);
    border: 1px solid var(--color-border, #333);
  }

  .button-secondary:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }

  @media (max-width: 640px) {
    .modal-backdrop {
      padding: 0;
    }

    .modal-content {
      max-height: 100vh;
      border-radius: 0;
    }
  }
</style>
