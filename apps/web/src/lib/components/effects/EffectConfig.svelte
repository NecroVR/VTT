<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ActiveEffect, EffectChange, EffectType, DurationType, ChangeMode } from '@vtt/shared';

  // Props
  export let isOpen: boolean = false;
  export let effect: ActiveEffect | null = null;
  export let actorId: string;
  export let gameId: string;
  export let token: string = '';

  const dispatch = createEventDispatcher<{
    close: void;
    save: ActiveEffect;
    delete: string;
  }>();

  // Determine if this is a new effect or editing existing
  const isNewEffect = !effect;

  // Form state
  let formData = {
    name: effect?.name ?? '',
    icon: effect?.icon ?? '',
    description: effect?.description ?? '',
    effectType: effect?.effectType ?? 'buff' as EffectType,
    durationType: effect?.durationType ?? 'rounds' as DurationType,
    duration: effect?.duration ?? null,
    enabled: effect?.enabled ?? true,
    hidden: effect?.hidden ?? false,
    priority: effect?.priority ?? 0,
    transfer: effect?.transfer ?? false,
    changes: effect?.changes ?? [] as EffectChange[],
  };

  // Effect type options
  const effectTypes: { value: EffectType; label: string }[] = [
    { value: 'buff', label: 'Buff' },
    { value: 'debuff', label: 'Debuff' },
    { value: 'condition', label: 'Condition' },
    { value: 'aura', label: 'Aura' },
    { value: 'custom', label: 'Custom' },
  ];

  // Duration type options
  const durationTypes: { value: DurationType; label: string }[] = [
    { value: 'rounds', label: 'Rounds' },
    { value: 'turns', label: 'Turns' },
    { value: 'seconds', label: 'Seconds' },
    { value: 'permanent', label: 'Permanent' },
    { value: 'special', label: 'Special' },
  ];

  // Change mode options
  const changeModes: { value: ChangeMode; label: string }[] = [
    { value: 'add', label: 'Add' },
    { value: 'multiply', label: 'Multiply' },
    { value: 'override', label: 'Override' },
    { value: 'upgrade', label: 'Upgrade' },
    { value: 'downgrade', label: 'Downgrade' },
  ];

  // Common stat keys for changes
  const commonStatKeys = [
    'ac',
    'hp',
    'maxHp',
    'speed',
    'initiative',
    'str',
    'dex',
    'con',
    'int',
    'wis',
    'cha',
    'proficiencyBonus',
  ];

  async function handleSave() {
    try {
      const effectData = {
        gameId,
        actorId,
        name: formData.name.trim(),
        icon: formData.icon.trim() || null,
        description: formData.description.trim() || null,
        effectType: formData.effectType,
        durationType: formData.durationType,
        duration: formData.durationType === 'permanent' || formData.durationType === 'special'
          ? null
          : formData.duration,
        enabled: formData.enabled,
        hidden: formData.hidden,
        priority: formData.priority,
        transfer: formData.transfer,
        changes: formData.changes,
      };

      if (isNewEffect) {
        // Create new effect
        const response = await fetch(`/api/v1/actors/${actorId}/effects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(effectData),
        });

        if (!response.ok) {
          throw new Error('Failed to create effect');
        }

        const data = await response.json();
        dispatch('save', data.effect);
      } else {
        // Update existing effect
        const response = await fetch(`/api/v1/effects/${effect!.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(effectData),
        });

        if (!response.ok) {
          throw new Error('Failed to update effect');
        }

        const data = await response.json();
        dispatch('save', data.effect);
      }

      dispatch('close');
    } catch (error) {
      console.error('Failed to save effect:', error);
      alert('Failed to save effect. Please try again.');
    }
  }

  function handleCancel() {
    dispatch('close');
  }

  async function handleDelete() {
    if (!effect) return;

    if (confirm(`Are you sure you want to delete "${effect.name}"?`)) {
      try {
        const response = await fetch(`/api/v1/effects/${effect.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete effect');
        }

        dispatch('delete', effect.id);
        dispatch('close');
      } catch (error) {
        console.error('Failed to delete effect:', error);
        alert('Failed to delete effect. Please try again.');
      }
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }

  function addChange() {
    formData.changes = [
      ...formData.changes,
      {
        key: '',
        mode: 'add' as ChangeMode,
        value: 0,
        priority: 0,
      },
    ];
  }

  function removeChange(index: number) {
    formData.changes = formData.changes.filter((_, i) => i !== index);
  }

  function updateChange(index: number, field: keyof EffectChange, value: unknown) {
    const updated = [...formData.changes];
    updated[index] = { ...updated[index], [field]: value };
    formData.changes = updated;
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (isOpen) {
      handleKeydown(event);
    }
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

{#if isOpen}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal-content" on:click|stopPropagation>
      <header class="modal-header">
        <h2>{isNewEffect ? 'Add Active Effect' : 'Edit Active Effect'}</h2>
        <button class="close-button" on:click={handleCancel} aria-label="Close">
          &times;
        </button>
      </header>

      <div class="modal-body">
        <form on:submit|preventDefault={handleSave}>
          <!-- Basic Properties -->
          <section class="form-section">
            <h3>Basic Properties</h3>

            <div class="form-row">
              <label for="effect-name">
                Name *
                <input
                  id="effect-name"
                  type="text"
                  bind:value={formData.name}
                  required
                  placeholder="Effect name"
                />
              </label>
            </div>

            <div class="form-row">
              <label for="effect-icon">
                Icon URL
                <input
                  id="effect-icon"
                  type="text"
                  bind:value={formData.icon}
                  placeholder="https://example.com/icon.png"
                />
              </label>
            </div>

            {#if formData.icon}
              <div class="icon-preview">
                <img src={formData.icon} alt="Effect icon preview" />
              </div>
            {/if}

            <div class="form-row">
              <label for="effect-description">
                Description
                <textarea
                  id="effect-description"
                  bind:value={formData.description}
                  placeholder="Effect description"
                  rows="3"
                ></textarea>
              </label>
            </div>
          </section>

          <!-- Effect Type and Duration -->
          <section class="form-section">
            <h3>Effect Type and Duration</h3>

            <div class="form-row-split">
              <label for="effect-type">
                Effect Type
                <select id="effect-type" bind:value={formData.effectType}>
                  {#each effectTypes as type}
                    <option value={type.value}>{type.label}</option>
                  {/each}
                </select>
              </label>

              <label for="duration-type">
                Duration Type
                <select id="duration-type" bind:value={formData.durationType}>
                  {#each durationTypes as durType}
                    <option value={durType.value}>{durType.label}</option>
                  {/each}
                </select>
              </label>
            </div>

            {#if formData.durationType !== 'permanent' && formData.durationType !== 'special'}
              <div class="form-row">
                <label for="effect-duration">
                  Duration ({formData.durationType})
                  <input
                    id="effect-duration"
                    type="number"
                    bind:value={formData.duration}
                    min="1"
                    step="1"
                  />
                </label>
              </div>
            {/if}
          </section>

          <!-- Settings -->
          <section class="form-section">
            <h3>Settings</h3>

            <div class="form-row-split">
              <label for="effect-priority">
                Priority
                <input
                  id="effect-priority"
                  type="number"
                  bind:value={formData.priority}
                  step="1"
                />
                <span class="help-text">Higher priority effects apply first</span>
              </label>
            </div>

            <div class="form-row-checkbox">
              <label>
                <input type="checkbox" bind:checked={formData.enabled} />
                Enabled
              </label>
            </div>

            <div class="form-row-checkbox">
              <label>
                <input type="checkbox" bind:checked={formData.hidden} />
                Hidden (only visible to GM)
              </label>
            </div>

            <div class="form-row-checkbox">
              <label>
                <input type="checkbox" bind:checked={formData.transfer} />
                Transfer to token (effect follows token)
              </label>
            </div>
          </section>

          <!-- Changes -->
          <section class="form-section">
            <h3>Stat Modifications</h3>

            {#if formData.changes.length === 0}
              <div class="empty-changes">
                <p>No stat modifications yet</p>
                <button type="button" class="button-secondary" on:click={addChange}>
                  Add Modification
                </button>
              </div>
            {:else}
              <div class="changes-list">
                {#each formData.changes as change, index}
                  <div class="change-row">
                    <div class="change-fields">
                      <label>
                        Stat Key
                        <input
                          type="text"
                          list="stat-keys"
                          value={change.key}
                          on:input={(e) => updateChange(index, 'key', e.currentTarget.value)}
                          placeholder="e.g., ac, hp, str"
                        />
                      </label>

                      <label>
                        Mode
                        <select
                          value={change.mode}
                          on:change={(e) => updateChange(index, 'mode', e.currentTarget.value)}
                        >
                          {#each changeModes as mode}
                            <option value={mode.value}>{mode.label}</option>
                          {/each}
                        </select>
                      </label>

                      <label>
                        Value
                        <input
                          type="text"
                          value={change.value}
                          on:input={(e) => {
                            const val = e.currentTarget.value;
                            const numVal = parseFloat(val);
                            updateChange(index, 'value', isNaN(numVal) ? val : numVal);
                          }}
                          placeholder="Value"
                        />
                      </label>

                      <label>
                        Priority
                        <input
                          type="number"
                          value={change.priority}
                          on:input={(e) => updateChange(index, 'priority', parseInt(e.currentTarget.value) || 0)}
                          step="1"
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      class="remove-change-btn"
                      on:click={() => removeChange(index)}
                      title="Remove modification"
                    >
                      ×
                    </button>
                  </div>
                {/each}
              </div>

              <button type="button" class="button-secondary add-change-btn" on:click={addChange}>
                + Add Modification
              </button>
            {/if}

            <!-- Datalist for common stat keys -->
            <datalist id="stat-keys">
              {#each commonStatKeys as key}
                <option value={key}></option>
              {/each}
            </datalist>
          </section>
        </form>
      </div>

      <footer class="modal-footer">
        <div class="footer-left">
          {#if !isNewEffect}
            <button class="button-danger" on:click={handleDelete}>
              Delete Effect
            </button>
          {/if}
        </div>
        <div class="footer-right">
          <button class="button-secondary" on:click={handleCancel}>
            Cancel
          </button>
          <button class="button-primary" on:click={handleSave}>
            {isNewEffect ? 'Create Effect' : 'Save Changes'}
          </button>
        </div>
      </footer>
    </div>
  </div>
{/if}

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
    max-width: 700px;
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

  .form-row-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
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
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .help-text {
    display: block;
    font-size: 0.75rem;
    color: var(--color-text-secondary, #888);
    margin-top: 0.25rem;
    font-weight: normal;
  }

  input[type="text"],
  input[type="number"],
  select,
  textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    background-color: var(--color-bg-primary, #121212);
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  input[type="text"]:focus,
  input[type="number"]:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: #4a90e2;
  }

  input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }

  textarea {
    resize: vertical;
    font-family: inherit;
  }

  .icon-preview {
    margin-top: 0.5rem;
    display: flex;
    justify-content: center;
  }

  .icon-preview img {
    width: 64px;
    height: 64px;
    object-fit: cover;
    border-radius: 8px;
    border: 2px solid var(--color-border, #333);
  }

  .empty-changes {
    padding: 2rem;
    text-align: center;
    background-color: var(--color-bg-primary, #121212);
    border-radius: 4px;
    border: 2px dashed var(--color-border, #333);
  }

  .empty-changes p {
    margin: 0 0 1rem 0;
    color: var(--color-text-secondary, #aaa);
  }

  .changes-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .change-row {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
  }

  .change-fields {
    flex: 1;
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr 0.75fr;
    gap: 0.75rem;
  }

  .change-fields label {
    margin-bottom: 0;
  }

  .remove-change-btn {
    width: 2rem;
    height: 2rem;
    padding: 0;
    background-color: transparent;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    color: var(--color-text-secondary, #aaa);
    font-size: 1.5rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: flex-start;
    margin-top: 1.5rem;
  }

  .remove-change-btn:hover {
    background-color: #7f1d1d;
    border-color: #ef4444;
    color: #fca5a5;
  }

  .add-change-btn {
    width: 100%;
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

  .button-primary {
    background-color: #4a90e2;
    color: white;
  }

  .button-primary:hover {
    background-color: #357abd;
  }

  .button-secondary {
    background-color: transparent;
    color: var(--color-text-secondary, #aaa);
    border: 1px solid var(--color-border, #333);
  }

  .button-secondary:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }

  .button-danger {
    background-color: #ef4444;
    color: white;
  }

  .button-danger:hover {
    background-color: #dc2626;
  }

  @media (max-width: 640px) {
    .modal-backdrop {
      padding: 0;
    }

    .modal-content {
      max-height: 100vh;
      border-radius: 0;
    }

    .form-row-split {
      grid-template-columns: 1fr;
    }

    .change-fields {
      grid-template-columns: 1fr;
    }

    .remove-change-btn {
      margin-top: 0;
    }

    .change-row {
      flex-direction: column;
    }
  }
</style>
