<script lang="ts">
  // Props
  export let round: number;
  export let onNextTurn: () => void;
  export let onPreviousTurn: () => void | undefined = undefined;
  export let disabled: boolean = false;

  const hasPrevious = onPreviousTurn !== undefined;
</script>

<div class="turn-controls">
  <div class="round-display">
    <span class="round-label">Round</span>
    <span class="round-number">{round}</span>
  </div>

  <div class="turn-buttons">
    {#if hasPrevious}
      <button
        class="turn-btn prev-btn"
        on:click={onPreviousTurn}
        {disabled}
        title="Previous turn"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Previous
      </button>
    {/if}

    <button
      class="turn-btn next-btn"
      on:click={onNextTurn}
      {disabled}
      title="Next turn"
    >
      Next
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  </div>
</div>

<style>
  .turn-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background-color: #111827;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }

  .round-display {
    display: flex;
    flex-direction: column;
    align-items: center;
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

  .turn-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .turn-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background-color: #3b82f6;
    color: #ffffff;
    border: none;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .turn-btn:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .turn-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .prev-btn {
    background-color: #6b7280;
  }

  .prev-btn:hover:not(:disabled) {
    background-color: #4b5563;
  }

  .turn-btn svg {
    flex-shrink: 0;
  }
</style>
