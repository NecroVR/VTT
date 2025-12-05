<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { websocket } from '$lib/stores/websocket';
  import type {
    Combat,
    Combatant,
    CombatStartedPayload,
    CombatEndedPayload,
    CombatUpdatedPayload,
    CombatTurnChangedPayload,
    CombatantAddedPayload,
    CombatantUpdatedPayload,
    CombatantRemovedPayload
  } from '@vtt/shared';
  import CombatantRow from './CombatantRow.svelte';
  import TurnControls from './TurnControls.svelte';

  // Props
  export let gameId: string;
  export let isGM: boolean = false;

  // Combat state
  let combat: Combat | null = null;
  let combatants: Combatant[] = [];
  let sortedCombatants: Combatant[] = [];
  let currentCombatantId: string | null = null;

  // Add combatant form
  let showAddForm = false;
  let newCombatantName = '';
  let newCombatantInitiative = 10;
  let newCombatantHP = 20;
  let newCombatantMaxHP = 20;

  // WebSocket subscriptions
  let unsubscribers: (() => void)[] = [];

  // Sort combatants by initiative (descending)
  $: sortedCombatants = [...combatants].sort((a, b) => {
    const aInit = a.initiative ?? -Infinity;
    const bInit = b.initiative ?? -Infinity;
    return bInit - aInit;
  });

  // Determine current combatant
  $: if (combat && sortedCombatants.length > 0) {
    const turnIndex = Math.min(combat.turn, sortedCombatants.length - 1);
    currentCombatantId = sortedCombatants[turnIndex]?.id || null;
  }

  onMount(async () => {
    // Fetch initial combat state
    await loadCombat();

    // Subscribe to combat events
    unsubscribers.push(
      websocket.onCombatStarted(handleCombatStarted),
      websocket.onCombatEnded(handleCombatEnded),
      websocket.onCombatUpdated(handleCombatUpdated),
      websocket.onCombatTurnChanged(handleCombatTurnChanged),
      websocket.onCombatantAdded(handleCombatantAdded),
      websocket.onCombatantUpdated(handleCombatantUpdated),
      websocket.onCombatantRemoved(handleCombatantRemoved)
    );
  });

  onDestroy(() => {
    unsubscribers.forEach(unsub => unsub());
  });

  async function loadCombat() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      // Fetch active combat for this game
      const response = await fetch(`/api/v1/games/${gameId}/combats?active=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.combats && data.combats.length > 0) {
          combat = data.combats[0];
          await loadCombatants(combat.id);
        }
      } else if (response.status === 401) {
        console.error('Unauthorized: Invalid or expired token');
      } else {
        console.error('Failed to load combat:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load combat:', error);
    }
  }

  async function loadCombatants(combatId: string) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(`/api/v1/combats/${combatId}/combatants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        combatants = data.combatants || [];
      } else if (response.status === 401) {
        console.error('Unauthorized: Invalid or expired token');
      } else {
        console.error('Failed to load combatants:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load combatants:', error);
    }
  }

  function handleCombatStarted(payload: CombatStartedPayload) {
    if (payload.combat.gameId === gameId) {
      combat = payload.combat;
      combatants = payload.combatants;
    }
  }

  function handleCombatEnded(payload: CombatEndedPayload) {
    if (combat?.id === payload.combatId) {
      combat = null;
      combatants = [];
      currentCombatantId = null;
    }
  }

  function handleCombatUpdated(payload: CombatUpdatedPayload) {
    if (combat?.id === payload.combat.id) {
      combat = payload.combat;
    }
  }

  function handleCombatTurnChanged(payload: CombatTurnChangedPayload) {
    if (combat?.id === payload.combat.id) {
      combat = payload.combat;
      currentCombatantId = payload.currentCombatantId || null;
    }
  }

  function handleCombatantAdded(payload: CombatantAddedPayload) {
    if (combat?.id === payload.combatant.combatId) {
      combatants = [...combatants, payload.combatant];
    }
  }

  function handleCombatantUpdated(payload: CombatantUpdatedPayload) {
    combatants = combatants.map(c =>
      c.id === payload.combatant.id ? payload.combatant : c
    );
  }

  function handleCombatantRemoved(payload: CombatantRemovedPayload) {
    combatants = combatants.filter(c => c.id !== payload.combatantId);
  }

  function startCombat() {
    if (!isGM) return;
    websocket.sendCombatStart({
      gameId,
      sceneId: null,
      combatants: []
    });
  }

  function endCombat() {
    if (!isGM || !combat) return;
    websocket.sendCombatEnd({ combatId: combat.id });
  }

  function nextTurn() {
    if (!isGM || !combat) return;
    websocket.sendCombatNextTurn({ combatId: combat.id });
  }

  function addCombatant() {
    if (!isGM || !combat) return;

    const combatantData = {
      name: newCombatantName,
      hp: {
        value: newCombatantHP,
        max: newCombatantMaxHP
      }
    };

    websocket.sendCombatantAdd({
      combatId: combat.id,
      initiative: newCombatantInitiative,
      initiativeModifier: 0,
      data: combatantData
    });

    // Reset form
    newCombatantName = '';
    newCombatantInitiative = 10;
    newCombatantHP = 20;
    newCombatantMaxHP = 20;
    showAddForm = false;
  }

  function updateCombatantHP(combatantId: string, newHP: number) {
    if (!isGM) return;

    const combatant = combatants.find(c => c.id === combatantId);
    if (!combatant) return;

    const hp = (combatant.data?.hp as { value: number; max: number }) || { value: 0, max: 0 };
    const updatedData = {
      ...combatant.data,
      hp: {
        value: newHP,
        max: hp.max
      }
    };

    websocket.sendCombatantUpdate({
      combatantId,
      updates: { data: updatedData }
    });
  }

  function updateCombatantInitiative(combatantId: string, newInitiative: number) {
    if (!isGM) return;

    websocket.sendCombatantUpdate({
      combatantId,
      updates: { initiative: newInitiative }
    });
  }

  function removeCombatant(combatantId: string) {
    if (!isGM) return;
    websocket.sendCombatantRemove({ combatantId });
  }

  function rollInitiative() {
    if (!isGM || !combat) return;

    // Roll initiative for all combatants
    combatants.forEach(combatant => {
      const roll = Math.floor(Math.random() * 20) + 1 + combatant.initiativeModifier;
      websocket.sendCombatantUpdate({
        combatantId: combatant.id,
        updates: { initiative: roll }
      });
    });
  }
</script>

<div class="combat-tracker">
  <div class="combat-header">
    <h3>Combat Tracker</h3>
    {#if isGM}
      {#if combat}
        <button class="end-combat-btn" on:click={endCombat}>
          End Combat
        </button>
      {:else}
        <button class="start-combat-btn" on:click={startCombat}>
          Start Combat
        </button>
      {/if}
    {/if}
  </div>

  {#if combat}
    <div class="combat-active">
      {#if isGM}
        <TurnControls
          round={combat.round}
          onNextTurn={nextTurn}
        />
      {:else}
        <div class="round-display-player">
          <span class="round-label">Round</span>
          <span class="round-number">{combat.round}</span>
        </div>
      {/if}

      <div class="combatants-container">
        {#if sortedCombatants.length === 0}
          <div class="no-combatants">
            <p>No combatants in combat.</p>
            {#if isGM}
              <p class="hint">Click "Add Combatant" to add participants.</p>
            {/if}
          </div>
        {:else}
          {#each sortedCombatants as combatant (combatant.id)}
            <CombatantRow
              {combatant}
              isCurrentTurn={combatant.id === currentCombatantId}
              {isGM}
              onUpdateHP={updateCombatantHP}
              onRemove={removeCombatant}
              onUpdateInitiative={updateCombatantInitiative}
            />
          {/each}
        {/if}
      </div>

      {#if isGM}
        <div class="combat-actions">
          {#if !showAddForm}
            <button class="add-combatant-btn" on:click={() => showAddForm = true}>
              Add Combatant
            </button>
            <button class="roll-initiative-btn" on:click={rollInitiative}>
              Roll Initiative
            </button>
          {/if}
        </div>

        {#if showAddForm}
          <div class="add-combatant-form">
            <h4>Add Combatant</h4>
            <div class="form-row">
              <label>
                Name:
                <input type="text" bind:value={newCombatantName} placeholder="Combatant name" />
              </label>
            </div>
            <div class="form-row">
              <label>
                Initiative:
                <input type="number" bind:value={newCombatantInitiative} />
              </label>
              <label>
                HP:
                <input type="number" bind:value={newCombatantHP} />
              </label>
              <label>
                Max HP:
                <input type="number" bind:value={newCombatantMaxHP} />
              </label>
            </div>
            <div class="form-actions">
              <button class="save-btn" on:click={addCombatant}>Add</button>
              <button class="cancel-btn" on:click={() => showAddForm = false}>Cancel</button>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  {:else}
    <div class="no-combat">
      <p>No active combat.</p>
      {#if isGM}
        <p class="hint">Click "Start Combat" to begin an encounter.</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .combat-tracker {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #1f2937;
    border-left: 1px solid #374151;
  }

  .combat-header {
    padding: 1rem;
    border-bottom: 1px solid #374151;
    background-color: #111827;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .combat-header h3 {
    margin: 0;
    color: #f9fafb;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .start-combat-btn,
  .end-combat-btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: none;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .start-combat-btn {
    background-color: #10b981;
    color: #ffffff;
  }

  .start-combat-btn:hover {
    background-color: #059669;
  }

  .end-combat-btn {
    background-color: #ef4444;
    color: #ffffff;
  }

  .end-combat-btn:hover {
    background-color: #dc2626;
  }

  .combat-active {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .round-display-player {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    background-color: #111827;
    border-radius: 0.5rem;
  }

  .round-label {
    font-size: 0.75rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }

  .round-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: #3b82f6;
    font-variant-numeric: tabular-nums;
  }

  .combatants-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .no-combatants,
  .no-combat {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: #9ca3af;
    text-align: center;
  }

  .no-combatants p,
  .no-combat p {
    margin: 0.5rem 0;
  }

  .hint {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .combat-actions {
    display: flex;
    gap: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid #374151;
  }

  .add-combatant-btn,
  .roll-initiative-btn {
    flex: 1;
    padding: 0.75rem;
    background-color: #3b82f6;
    color: #ffffff;
    border: none;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .add-combatant-btn:hover,
  .roll-initiative-btn:hover {
    background-color: #2563eb;
  }

  .add-combatant-form {
    background-color: #111827;
    padding: 1rem;
    border-radius: 0.5rem;
  }

  .add-combatant-form h4 {
    margin: 0 0 1rem 0;
    color: #f9fafb;
    font-size: 1rem;
  }

  .form-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .form-row label {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    color: #d1d5db;
    font-size: 0.875rem;
  }

  .form-row input {
    padding: 0.5rem;
    background-color: #374151;
    border: 1px solid #4b5563;
    border-radius: 0.375rem;
    color: #f9fafb;
  }

  .form-row input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .form-actions {
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

  .combat-active::-webkit-scrollbar {
    width: 8px;
  }

  .combat-active::-webkit-scrollbar-track {
    background: #1f2937;
  }

  .combat-active::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
  }

  .combat-active::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
</style>
