<script lang="ts">
  import HPBar from './HPBar.svelte';
  import type { Combatant } from '@vtt/shared';

  // Props
  export let combatant: Combatant;
  export let isCurrentTurn: boolean = false;
  export let isGM: boolean = false;
  export let onUpdateHP: (combatantId: string, newHP: number) => void = () => {};
  export let onRemove: (combatantId: string) => void = () => {};
  export let onUpdateInitiative: (combatantId: string, newInitiative: number) => void = () => {};

  // Extract HP from data
  $: hp = (combatant.data?.hp as { value: number; max: number }) || { value: 0, max: 0 };
  $: name = (combatant.data?.name as string) || `Combatant ${combatant.id.slice(0, 8)}`;

  // Edit state
  let editingHP = false;
  let editingInitiative = false;
  let hpInput = hp.value;
  let initiativeInput = combatant.initiative || 0;

  function startEditHP() {
    if (!isGM) return;
    editingHP = true;
    hpInput = hp.value;
  }

  function startEditInitiative() {
    if (!isGM) return;
    editingInitiative = true;
    initiativeInput = combatant.initiative || 0;
  }

  function saveHP() {
    onUpdateHP(combatant.id, hpInput);
    editingHP = false;
  }

  function saveInitiative() {
    onUpdateInitiative(combatant.id, initiativeInput);
    editingInitiative = false;
  }

  function handleKeydown(event: KeyboardEvent, type: 'hp' | 'initiative') {
    if (event.key === 'Enter') {
      if (type === 'hp') saveHP();
      else saveInitiative();
    } else if (event.key === 'Escape') {
      if (type === 'hp') editingHP = false;
      else editingInitiative = false;
    }
  }
</script>

<div class="combatant-row" class:current-turn={isCurrentTurn} class:defeated={combatant.defeated}>
  <div class="initiative-column">
    {#if editingInitiative}
      <input
        type="number"
        bind:value={initiativeInput}
        on:blur={saveInitiative}
        on:keydown={(e) => handleKeydown(e, 'initiative')}
        class="initiative-input"
        autofocus
      />
    {:else}
      <button
        class="initiative-value"
        on:click={startEditInitiative}
        disabled={!isGM}
        title={isGM ? 'Click to edit initiative' : ''}
      >
        {combatant.initiative !== null ? combatant.initiative : '--'}
      </button>
    {/if}
  </div>

  <div class="info-column">
    <div class="name">{name}</div>
    {#if hp.max > 0}
      <div class="hp-container">
        <HPBar current={hp.value} max={hp.max} size="small" />
        {#if isGM}
          <button class="hp-edit-btn" on:click={startEditHP} title="Edit HP">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        {/if}
      </div>
    {/if}
  </div>

  {#if isGM}
    <div class="actions-column">
      <button class="remove-btn" on:click={() => onRemove(combatant.id)} title="Remove combatant">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  {/if}
</div>

{#if editingHP}
  <div class="hp-edit-modal">
    <div class="modal-content">
      <h4>Edit HP for {name}</h4>
      <div class="hp-edit-controls">
        <label>
          Current HP:
          <input
            type="number"
            bind:value={hpInput}
            min="0"
            max={hp.max}
            on:keydown={(e) => handleKeydown(e, 'hp')}
            autofocus
          />
        </label>
        <div class="quick-adjust">
          <button on:click={() => hpInput = Math.max(0, hpInput - 5)}>-5</button>
          <button on:click={() => hpInput = Math.max(0, hpInput - 1)}>-1</button>
          <button on:click={() => hpInput = Math.min(hp.max, hpInput + 1)}>+1</button>
          <button on:click={() => hpInput = Math.min(hp.max, hpInput + 5)}>+5</button>
        </div>
      </div>
      <div class="modal-actions">
        <button class="save-btn" on:click={saveHP}>Save</button>
        <button class="cancel-btn" on:click={() => editingHP = false}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .combatant-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background-color: #1f2937;
    border-radius: 0.375rem;
    border: 2px solid transparent;
    transition: all 0.2s ease;
  }

  .combatant-row:hover {
    background-color: #374151;
  }

  .combatant-row.current-turn {
    border-color: #3b82f6;
    background-color: #1e3a5f;
  }

  .combatant-row.defeated {
    opacity: 0.5;
  }

  .initiative-column {
    min-width: 3rem;
  }

  .initiative-value {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background-color: #4b5563;
    color: #f9fafb;
    font-size: 1.125rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .initiative-value:hover:not(:disabled) {
    background-color: #6b7280;
  }

  .initiative-value:disabled {
    cursor: default;
  }

  .current-turn .initiative-value {
    background-color: #3b82f6;
  }

  .initiative-input {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    text-align: center;
    background-color: #374151;
    color: #f9fafb;
    border: 2px solid #3b82f6;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .initiative-input:focus {
    outline: none;
    border-color: #60a5fa;
  }

  .info-column {
    flex: 1;
    min-width: 0;
  }

  .name {
    font-weight: 500;
    color: #f9fafb;
    margin-bottom: 0.375rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hp-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .hp-edit-btn {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;
  }

  .hp-edit-btn:hover {
    color: #3b82f6;
  }

  .actions-column {
    display: flex;
    gap: 0.5rem;
  }

  .remove-btn {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;
  }

  .remove-btn:hover {
    color: #ef4444;
  }

  .hp-edit-modal {
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
  }

  .modal-content {
    background-color: #1f2937;
    border-radius: 0.5rem;
    padding: 1.5rem;
    min-width: 20rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  }

  .modal-content h4 {
    margin: 0 0 1rem 0;
    color: #f9fafb;
    font-size: 1.125rem;
  }

  .hp-edit-controls label {
    display: block;
    color: #d1d5db;
    margin-bottom: 0.5rem;
  }

  .hp-edit-controls input {
    width: 100%;
    padding: 0.5rem;
    background-color: #374151;
    border: 1px solid #4b5563;
    border-radius: 0.375rem;
    color: #f9fafb;
    font-size: 1rem;
    margin-top: 0.25rem;
  }

  .hp-edit-controls input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .quick-adjust {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .quick-adjust button {
    flex: 1;
    padding: 0.5rem;
    background-color: #374151;
    border: 1px solid #4b5563;
    border-radius: 0.375rem;
    color: #f9fafb;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .quick-adjust button:hover {
    background-color: #4b5563;
  }

  .modal-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .save-btn,
  .cancel-btn {
    flex: 1;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s ease;
  }

  .save-btn {
    background-color: #3b82f6;
    color: #ffffff;
  }

  .save-btn:hover {
    background-color: #2563eb;
  }

  .cancel-btn {
    background-color: #374151;
    color: #d1d5db;
  }

  .cancel-btn:hover {
    background-color: #4b5563;
  }
</style>
