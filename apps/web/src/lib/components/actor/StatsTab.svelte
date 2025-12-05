<script lang="ts">
  import type { Actor } from '@vtt/shared';

  // Props
  let { actor, onUpdate }: { actor: Actor; onUpdate: (updates: Partial<Actor>) => void } = $props();

  // Extract stats from attributes or set defaults
  let hp = $derived((actor.attributes?.hp as { value: number; max: number }) || { value: 10, max: 10 });
  let ac = $derived((actor.attributes?.ac as number) || 10);
  let level = $derived((actor.attributes?.level as number) || 1);
  let speed = $derived((actor.attributes?.speed as number) || 30);
  let tokenSize = $derived(actor.tokenSize ?? 1);
  let str = $derived((actor.abilities?.str as number) || 10);
  let dex = $derived((actor.abilities?.dex as number) || 10);
  let con = $derived((actor.abilities?.con as number) || 10);
  let int = $derived((actor.abilities?.int as number) || 10);
  let wis = $derived((actor.abilities?.wis as number) || 10);
  let cha = $derived((actor.abilities?.cha as number) || 10);

  // Local editing state
  let editedHP = $state({ value: 10, max: 10 });
  let editedAC = $state(10);
  let editedLevel = $state(1);
  let editedSpeed = $state(30);
  let editedTokenSize = $state(1);
  let editedStr = $state(10);
  let editedDex = $state(10);
  let editedCon = $state(10);
  let editedInt = $state(10);
  let editedWis = $state(10);
  let editedCha = $state(10);

  // Update local state when actor changes
  $effect(() => {
    editedHP = { value: hp?.value ?? 10, max: hp?.max ?? 10 };
    editedAC = ac ?? 10;
    editedLevel = level ?? 1;
    editedSpeed = speed ?? 30;
    editedTokenSize = tokenSize ?? 1;
    editedStr = str ?? 10;
    editedDex = dex ?? 10;
    editedCon = con ?? 10;
    editedInt = int ?? 10;
    editedWis = wis ?? 10;
    editedCha = cha ?? 10;
  });

  function handleHPChange() {
    onUpdate({
      attributes: {
        ...actor.attributes,
        hp: editedHP
      }
    });
  }

  function handleAttributeChange() {
    onUpdate({
      attributes: {
        ...actor.attributes,
        ac: editedAC,
        level: editedLevel,
        speed: editedSpeed
      }
    });
  }

  function handleTokenSizeChange() {
    onUpdate({
      tokenSize: editedTokenSize
    });
  }

  function handleAbilityChange() {
    onUpdate({
      abilities: {
        ...actor.abilities,
        str: editedStr,
        dex: editedDex,
        con: editedCon,
        int: editedInt,
        wis: editedWis,
        cha: editedCha
      }
    });
  }

  function calculateModifier(score: number): string {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }
</script>

<div class="stats-tab">
  <section class="stats-section">
    <h3 class="section-title">Core Attributes</h3>

    <div class="stats-grid">
      <div class="stat-block hp-block">
        <label class="stat-label">Hit Points</label>
        <div class="hp-inputs">
          <div class="hp-input-group">
            <label class="sub-label">Current</label>
            <input
              type="number"
              bind:value={editedHP.value}
              on:change={handleHPChange}
              class="stat-input hp-current"
              min="0"
              max={editedHP.max}
            />
          </div>
          <span class="hp-separator">/</span>
          <div class="hp-input-group">
            <label class="sub-label">Max</label>
            <input
              type="number"
              bind:value={editedHP.max}
              on:change={handleHPChange}
              class="stat-input hp-max"
              min="1"
            />
          </div>
        </div>
      </div>

      <div class="stat-block">
        <label class="stat-label">Armor Class</label>
        <input
          type="number"
          bind:value={editedAC}
          on:change={handleAttributeChange}
          class="stat-input"
          min="0"
        />
      </div>

      <div class="stat-block">
        <label class="stat-label">Level</label>
        <input
          type="number"
          bind:value={editedLevel}
          on:change={handleAttributeChange}
          class="stat-input"
          min="1"
          max="20"
        />
      </div>

      <div class="stat-block">
        <label class="stat-label">Speed (ft)</label>
        <input
          type="number"
          bind:value={editedSpeed}
          on:change={handleAttributeChange}
          class="stat-input"
          min="0"
        />
      </div>

      <div class="stat-block">
        <label class="stat-label">Token Size</label>
        <input
          type="number"
          bind:value={editedTokenSize}
          on:change={handleTokenSizeChange}
          class="stat-input"
          min="1"
          max="10"
        />
      </div>
    </div>
  </section>

  <section class="stats-section">
    <h3 class="section-title">Ability Scores</h3>

    <div class="abilities-grid">
      <div class="ability-block">
        <label class="ability-label">STR</label>
        <input
          type="number"
          bind:value={editedStr}
          on:change={handleAbilityChange}
          class="ability-input"
          min="1"
          max="30"
        />
        <span class="ability-modifier">{calculateModifier(editedStr)}</span>
      </div>

      <div class="ability-block">
        <label class="ability-label">DEX</label>
        <input
          type="number"
          bind:value={editedDex}
          on:change={handleAbilityChange}
          class="ability-input"
          min="1"
          max="30"
        />
        <span class="ability-modifier">{calculateModifier(editedDex)}</span>
      </div>

      <div class="ability-block">
        <label class="ability-label">CON</label>
        <input
          type="number"
          bind:value={editedCon}
          on:change={handleAbilityChange}
          class="ability-input"
          min="1"
          max="30"
        />
        <span class="ability-modifier">{calculateModifier(editedCon)}</span>
      </div>

      <div class="ability-block">
        <label class="ability-label">INT</label>
        <input
          type="number"
          bind:value={editedInt}
          on:change={handleAbilityChange}
          class="ability-input"
          min="1"
          max="30"
        />
        <span class="ability-modifier">{calculateModifier(editedInt)}</span>
      </div>

      <div class="ability-block">
        <label class="ability-label">WIS</label>
        <input
          type="number"
          bind:value={editedWis}
          on:change={handleAbilityChange}
          class="ability-input"
          min="1"
          max="30"
        />
        <span class="ability-modifier">{calculateModifier(editedWis)}</span>
      </div>

      <div class="ability-block">
        <label class="ability-label">CHA</label>
        <input
          type="number"
          bind:value={editedCha}
          on:change={handleAbilityChange}
          class="ability-input"
          min="1"
          max="30"
        />
        <span class="ability-modifier">{calculateModifier(editedCha)}</span>
      </div>
    </div>
  </section>
</div>

<style>
  .stats-tab {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .stats-section {
    background-color: #111827;
    padding: 1.5rem;
    border-radius: 0.5rem;
    border: 1px solid #374151;
  }

  .section-title {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #f9fafb;
    border-bottom: 1px solid #374151;
    padding-bottom: 0.5rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .stat-block {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .hp-block {
    grid-column: span 2;
  }

  .stat-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #d1d5db;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .sub-label {
    font-size: 0.75rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .hp-inputs {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
  }

  .hp-input-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .hp-separator {
    font-size: 1.5rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
  }

  .stat-input {
    padding: 0.75rem;
    background-color: #374151;
    border: 1px solid #4b5563;
    border-radius: 0.375rem;
    color: #f9fafb;
    font-size: 1.125rem;
    font-weight: 600;
    text-align: center;
  }

  .stat-input:focus {
    outline: none;
    border-color: #3b82f6;
    background-color: #4b5563;
  }

  .hp-current,
  .hp-max {
    width: 100px;
  }

  .abilities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 1rem;
  }

  .ability-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    background-color: #1f2937;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #374151;
  }

  .ability-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .ability-input {
    width: 60px;
    padding: 0.5rem;
    background-color: #374151;
    border: 1px solid #4b5563;
    border-radius: 0.375rem;
    color: #f9fafb;
    font-size: 1.25rem;
    font-weight: 700;
    text-align: center;
  }

  .ability-input:focus {
    outline: none;
    border-color: #3b82f6;
    background-color: #4b5563;
  }

  .ability-modifier {
    font-size: 1rem;
    font-weight: 600;
    color: #3b82f6;
  }
</style>
