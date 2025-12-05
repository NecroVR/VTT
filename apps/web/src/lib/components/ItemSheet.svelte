<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Item } from '@vtt/shared';

  // Props
  export let isOpen: boolean;
  export let item: Item | null = null;
  export let actorId: string;
  export let gameId: string;

  const dispatch = createEventDispatcher<{
    close: void;
    save: Item;
    delete: string;
  }>();

  // Form state
  let formData = {
    name: '',
    itemType: 'equipment',
    img: '',
    description: '',
    quantity: 1,
    weight: 0,
    price: 0,
    equipped: false,
    // Type-specific data
    data: {} as Record<string, unknown>
  };

  // Initialize form data when item changes
  $: if (item) {
    formData = {
      name: item.name,
      itemType: item.itemType,
      img: item.img || '',
      description: item.description || '',
      quantity: item.quantity,
      weight: item.weight,
      price: item.price,
      equipped: item.equipped,
      data: { ...item.data }
    };
  } else {
    formData = {
      name: '',
      itemType: 'equipment',
      img: '',
      description: '',
      quantity: 1,
      weight: 0,
      price: 0,
      equipped: false,
      data: {}
    };
  }

  // Error state
  let error: string | null = null;
  let saving = false;

  async function handleSave() {
    // Validate
    if (!formData.name.trim()) {
      error = 'Item name is required';
      return;
    }

    saving = true;
    error = null;

    try {
      let response: Response;

      if (item && item.id) {
        // Update existing item
        response = await fetch(`/api/v1/items/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            itemType: formData.itemType,
            img: formData.img || null,
            description: formData.description.trim() || null,
            quantity: formData.quantity,
            weight: formData.weight,
            price: formData.price,
            equipped: formData.equipped,
            data: formData.data
          })
        });
      } else {
        // Create new item
        response = await fetch(`/api/v1/actors/${actorId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId,
            actorId,
            name: formData.name.trim(),
            itemType: formData.itemType,
            img: formData.img || null,
            description: formData.description.trim() || null,
            quantity: formData.quantity,
            weight: formData.weight,
            price: formData.price,
            equipped: formData.equipped,
            data: formData.data
          })
        });
      }

      if (response.ok) {
        const data = await response.json();
        dispatch('save', data.item);
        dispatch('close');
      } else {
        const errorData = await response.json().catch(() => ({}));
        error = errorData.error || 'Failed to save item';
      }
    } catch (err) {
      console.error('Error saving item:', err);
      error = 'Failed to save item';
    } finally {
      saving = false;
    }
  }

  async function handleDelete() {
    if (!item || !item.id) return;

    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    saving = true;
    error = null;

    try {
      const response = await fetch(`/api/v1/items/${item.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        dispatch('delete', item.id);
        dispatch('close');
      } else {
        error = 'Failed to delete item';
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      error = 'Failed to delete item';
    } finally {
      saving = false;
    }
  }

  function handleCancel() {
    dispatch('close');
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

  // Update data field when type-specific fields change
  function updateData(key: string, value: unknown) {
    formData.data = { ...formData.data, [key]: value };
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
        <h2>{item ? 'Edit Item' : 'Create Item'}</h2>
        <button class="close-button" on:click={handleCancel} aria-label="Close">
          &times;
        </button>
      </header>

      <div class="modal-body">
        {#if error}
          <div class="error-message">{error}</div>
        {/if}

        <form on:submit|preventDefault={handleSave}>
          <!-- Basic Properties -->
          <section class="form-section">
            <h3>Basic Properties</h3>

            <div class="form-row">
              <label for="item-name">
                Name *
                <input
                  id="item-name"
                  type="text"
                  bind:value={formData.name}
                  required
                  placeholder="Item name"
                />
              </label>
            </div>

            <div class="form-row-split">
              <label for="item-type">
                Type
                <select id="item-type" bind:value={formData.itemType}>
                  <option value="weapon">Weapon</option>
                  <option value="armor">Armor</option>
                  <option value="consumable">Consumable</option>
                  <option value="spell">Spell</option>
                  <option value="equipment">Equipment</option>
                  <option value="loot">Loot</option>
                  <option value="container">Container</option>
                  <option value="tool">Tool</option>
                </select>
              </label>

              <label for="item-equipped">
                <span class="checkbox-label">
                  <input
                    id="item-equipped"
                    type="checkbox"
                    bind:checked={formData.equipped}
                  />
                  Equipped
                </span>
              </label>
            </div>

            <div class="form-row">
              <label for="item-image">
                Image URL
                <input
                  id="item-image"
                  type="text"
                  bind:value={formData.img}
                  placeholder="https://example.com/item.png"
                />
              </label>
            </div>

            {#if formData.img}
              <div class="image-preview">
                <img src={formData.img} alt="Item preview" />
              </div>
            {/if}

            <div class="form-row">
              <label for="item-description">
                Description
                <textarea
                  id="item-description"
                  bind:value={formData.description}
                  placeholder="Item description"
                  rows="3"
                ></textarea>
              </label>
            </div>
          </section>

          <!-- Quantity and Value -->
          <section class="form-section">
            <h3>Quantity and Value</h3>

            <div class="form-row-split">
              <label for="item-quantity">
                Quantity
                <input
                  id="item-quantity"
                  type="number"
                  bind:value={formData.quantity}
                  min="1"
                  step="1"
                />
              </label>

              <label for="item-weight">
                Weight (lbs)
                <input
                  id="item-weight"
                  type="number"
                  bind:value={formData.weight}
                  min="0"
                  step="0.1"
                />
              </label>
            </div>

            <div class="form-row">
              <label for="item-price">
                Price (gp)
                <input
                  id="item-price"
                  type="number"
                  bind:value={formData.price}
                  min="0"
                  step="0.01"
                />
              </label>
            </div>
          </section>

          <!-- Type-Specific Fields -->
          {#if formData.itemType === 'weapon'}
            <section class="form-section">
              <h3>Weapon Properties</h3>

              <div class="form-row-split">
                <label for="weapon-damage">
                  Damage
                  <input
                    id="weapon-damage"
                    type="text"
                    value={formData.data.damage || ''}
                    on:input={(e) => updateData('damage', e.currentTarget.value)}
                    placeholder="1d8"
                  />
                </label>

                <label for="weapon-damage-type">
                  Damage Type
                  <select
                    id="weapon-damage-type"
                    value={formData.data.damageType || 'slashing'}
                    on:change={(e) => updateData('damageType', e.currentTarget.value)}
                  >
                    <option value="slashing">Slashing</option>
                    <option value="piercing">Piercing</option>
                    <option value="bludgeoning">Bludgeoning</option>
                    <option value="fire">Fire</option>
                    <option value="cold">Cold</option>
                    <option value="lightning">Lightning</option>
                    <option value="thunder">Thunder</option>
                    <option value="poison">Poison</option>
                    <option value="acid">Acid</option>
                    <option value="psychic">Psychic</option>
                    <option value="necrotic">Necrotic</option>
                    <option value="radiant">Radiant</option>
                    <option value="force">Force</option>
                  </select>
                </label>
              </div>

              <div class="form-row-split">
                <label for="weapon-range">
                  Range (ft)
                  <input
                    id="weapon-range"
                    type="number"
                    value={formData.data.range || ''}
                    on:input={(e) => updateData('range', parseInt(e.currentTarget.value) || 0)}
                    min="0"
                    placeholder="5"
                  />
                </label>

                <label for="weapon-properties">
                  Properties
                  <input
                    id="weapon-properties"
                    type="text"
                    value={formData.data.properties || ''}
                    on:input={(e) => updateData('properties', e.currentTarget.value)}
                    placeholder="finesse, versatile"
                  />
                </label>
              </div>
            </section>
          {/if}

          {#if formData.itemType === 'armor'}
            <section class="form-section">
              <h3>Armor Properties</h3>

              <div class="form-row-split">
                <label for="armor-ac">
                  Armor Class
                  <input
                    id="armor-ac"
                    type="number"
                    value={formData.data.armorClass || ''}
                    on:input={(e) => updateData('armorClass', parseInt(e.currentTarget.value) || 0)}
                    min="0"
                    placeholder="14"
                  />
                </label>

                <label for="armor-dex-bonus">
                  Max Dex Bonus
                  <input
                    id="armor-dex-bonus"
                    type="number"
                    value={formData.data.dexBonus || ''}
                    on:input={(e) => updateData('dexBonus', parseInt(e.currentTarget.value) || 0)}
                    min="0"
                    placeholder="2"
                  />
                </label>
              </div>

              <div class="form-row-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.data.stealthDisadvantage || false}
                    on:change={(e) => updateData('stealthDisadvantage', e.currentTarget.checked)}
                  />
                  Stealth Disadvantage
                </label>
              </div>
            </section>
          {/if}

          {#if formData.itemType === 'consumable'}
            <section class="form-section">
              <h3>Consumable Properties</h3>

              <div class="form-row-split">
                <label for="consumable-uses">
                  Current Uses
                  <input
                    id="consumable-uses"
                    type="number"
                    value={formData.data.uses || ''}
                    on:input={(e) => updateData('uses', parseInt(e.currentTarget.value) || 0)}
                    min="0"
                  />
                </label>

                <label for="consumable-max-uses">
                  Max Uses
                  <input
                    id="consumable-max-uses"
                    type="number"
                    value={formData.data.maxUses || ''}
                    on:input={(e) => updateData('maxUses', parseInt(e.currentTarget.value) || 0)}
                    min="0"
                  />
                </label>
              </div>

              <div class="form-row">
                <label for="consumable-reset">
                  Charge Reset
                  <select
                    id="consumable-reset"
                    value={formData.data.chargeReset || 'none'}
                    on:change={(e) => updateData('chargeReset', e.currentTarget.value)}
                  >
                    <option value="none">None</option>
                    <option value="short-rest">Short Rest</option>
                    <option value="long-rest">Long Rest</option>
                    <option value="dawn">Dawn</option>
                  </select>
                </label>
              </div>
            </section>
          {/if}

          {#if formData.itemType === 'spell'}
            <section class="form-section">
              <h3>Spell Properties</h3>

              <div class="form-row-split">
                <label for="spell-level">
                  Level
                  <input
                    id="spell-level"
                    type="number"
                    value={formData.data.level || ''}
                    on:input={(e) => updateData('level', parseInt(e.currentTarget.value) || 0)}
                    min="0"
                    max="9"
                  />
                </label>

                <label for="spell-school">
                  School
                  <select
                    id="spell-school"
                    value={formData.data.school || 'evocation'}
                    on:change={(e) => updateData('school', e.currentTarget.value)}
                  >
                    <option value="abjuration">Abjuration</option>
                    <option value="conjuration">Conjuration</option>
                    <option value="divination">Divination</option>
                    <option value="enchantment">Enchantment</option>
                    <option value="evocation">Evocation</option>
                    <option value="illusion">Illusion</option>
                    <option value="necromancy">Necromancy</option>
                    <option value="transmutation">Transmutation</option>
                  </select>
                </label>
              </div>

              <div class="form-row-split">
                <label for="spell-casting-time">
                  Casting Time
                  <input
                    id="spell-casting-time"
                    type="text"
                    value={formData.data.castingTime || ''}
                    on:input={(e) => updateData('castingTime', e.currentTarget.value)}
                    placeholder="1 action"
                  />
                </label>

                <label for="spell-range">
                  Range
                  <input
                    id="spell-range"
                    type="text"
                    value={formData.data.spellRange || ''}
                    on:input={(e) => updateData('spellRange', e.currentTarget.value)}
                    placeholder="60 feet"
                  />
                </label>
              </div>

              <div class="form-row-split">
                <label for="spell-components">
                  Components
                  <input
                    id="spell-components"
                    type="text"
                    value={formData.data.components || ''}
                    on:input={(e) => updateData('components', e.currentTarget.value)}
                    placeholder="V, S, M"
                  />
                </label>

                <label for="spell-duration">
                  Duration
                  <input
                    id="spell-duration"
                    type="text"
                    value={formData.data.duration || ''}
                    on:input={(e) => updateData('duration', e.currentTarget.value)}
                    placeholder="Instantaneous"
                  />
                </label>
              </div>
            </section>
          {/if}
        </form>
      </div>

      <footer class="modal-footer">
        <div class="footer-left">
          {#if item && item.id}
            <button class="button-danger" on:click={handleDelete} disabled={saving}>
              Delete
            </button>
          {/if}
        </div>
        <div class="footer-right">
          <button class="button-secondary" on:click={handleCancel} disabled={saving}>
            Cancel
          </button>
          <button class="button-primary" on:click={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
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

  .error-message {
    padding: 1rem;
    background-color: #7f1d1d;
    color: #fca5a5;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
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

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    margin-top: 1.5rem;
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

  .image-preview {
    margin-top: 0.5rem;
    display: flex;
    justify-content: center;
  }

  .image-preview img {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
    border: 2px solid var(--color-border, #333);
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

  button:active:not(:disabled) {
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

  .button-danger {
    background-color: #ef4444;
    color: white;
  }

  .button-danger:hover:not(:disabled) {
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
  }
</style>
