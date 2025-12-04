<script lang="ts">
  // Props
  export let tool: string;
  export let label: string;
  export let icon: string;
  export let active: boolean = false;
  export let visible: boolean = true;
  export let disabled: boolean = false;
  export let onClick: (() => void) | undefined = undefined;

  function handleClick() {
    if (!disabled) {
      onClick?.();
    }
  }
</script>

{#if visible}
  <button
    class="tool-button"
    class:active
    class:disabled
    on:click={handleClick}
    {disabled}
    title={label}
    aria-label={label}
    data-tool={tool}
  >
    <span class="tool-icon">{icon}</span>
    <span class="tool-label">{label}</span>
  </button>
{/if}

<style>
  .tool-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.625rem 0.5rem;
    background-color: #1f2937;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    color: #d1d5db;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 60px;
  }

  .tool-button:hover:not(:disabled):not(.disabled) {
    background-color: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }

  .tool-button.active {
    background-color: #3b82f6;
    border-color: #2563eb;
    color: #ffffff;
  }

  .tool-button.active:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .tool-button:disabled,
  .tool-button.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tool-icon {
    font-size: 1.25rem;
    line-height: 1;
  }

  .tool-label {
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }
</style>
