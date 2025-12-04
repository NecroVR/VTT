<script lang="ts">
  import type { DiceResultPayload } from '@vtt/shared';

  export let username: string;
  export let result: DiceResultPayload | undefined;
  export let timestamp: number;

  function formatTime(ts: number): string {
    const date = new Date(ts);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function isDiceKept(groupIndex: number, diceIndex: number): boolean {
    if (!result || !result.rolls[groupIndex]) return true;
    const group = result.rolls[groupIndex];
    if (!group.kept || group.kept.length === 0) return true;
    return group.kept.includes(diceIndex);
  }

  $: hasLabel = result?.label && result.label.length > 0;
</script>

{#if result}
  <div class="dice-roll-result">
    <div class="message-header">
      <span class="username">{username}</span>
      <span class="timestamp">{formatTime(timestamp)}</span>
    </div>

    {#if hasLabel}
      <div class="roll-label">{result.label}</div>
    {/if}

    <div class="roll-notation">
      <span class="notation-text">{result.notation}</span>
    </div>

    <div class="dice-groups">
      {#each result.rolls as group, groupIndex}
        <div class="dice-group">
          <div class="group-label">{group.dice}</div>
          <div class="dice-results">
            {#each group.results as die, diceIndex}
              <span
                class="die"
                class:kept={isDiceKept(groupIndex, diceIndex)}
                class:dropped={!isDiceKept(groupIndex, diceIndex)}
              >
                {die}
              </span>
            {/each}
          </div>
          <div class="group-subtotal">
            = {group.subtotal}
          </div>
        </div>
      {/each}
    </div>

    {#if result.modifiers !== 0}
      <div class="modifiers">
        Modifier: {result.modifiers > 0 ? '+' : ''}{result.modifiers}
      </div>
    {/if}

    <div class="total">
      <span class="total-label">Total:</span>
      <span class="total-value">{result.total}</span>
    </div>

    <div class="breakdown">
      {result.breakdown}
    </div>
  </div>
{/if}

<style>
  .dice-roll-result {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    border-radius: 0.5rem;
    padding: 0.75rem;
    border: 2px solid #3b82f6;
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .username {
    font-weight: 600;
    color: #93c5fd;
    font-size: 0.875rem;
  }

  .timestamp {
    font-size: 0.75rem;
    color: #bfdbfe;
  }

  .roll-label {
    color: #fbbf24;
    font-weight: 600;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .roll-notation {
    margin-bottom: 0.75rem;
  }

  .notation-text {
    color: #e0e7ff;
    font-family: 'Courier New', monospace;
    font-size: 1rem;
    font-weight: 500;
  }

  .dice-groups {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .dice-group {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 0.375rem;
    padding: 0.5rem;
  }

  .group-label {
    color: #bfdbfe;
    font-size: 0.75rem;
    font-weight: 500;
    margin-bottom: 0.375rem;
    font-family: 'Courier New', monospace;
  }

  .dice-results {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-bottom: 0.375rem;
  }

  .die {
    background-color: #3b82f6;
    color: #ffffff;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-weight: 600;
    font-size: 0.875rem;
    min-width: 2rem;
    text-align: center;
    border: 2px solid #60a5fa;
  }

  .die.kept {
    background-color: #10b981;
    border-color: #34d399;
  }

  .die.dropped {
    background-color: #6b7280;
    border-color: #9ca3af;
    text-decoration: line-through;
    opacity: 0.6;
  }

  .group-subtotal {
    color: #e0e7ff;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .modifiers {
    color: #fbbf24;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  .total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 0.5rem;
    border-radius: 0.375rem;
    margin-bottom: 0.5rem;
  }

  .total-label {
    color: #e0e7ff;
    font-weight: 600;
    font-size: 1rem;
  }

  .total-value {
    color: #fbbf24;
    font-weight: 700;
    font-size: 1.5rem;
  }

  .breakdown {
    color: #d1d5db;
    font-size: 0.75rem;
    font-family: 'Courier New', monospace;
    background-color: rgba(0, 0, 0, 0.2);
    padding: 0.375rem;
    border-radius: 0.25rem;
    word-break: break-all;
  }
</style>
