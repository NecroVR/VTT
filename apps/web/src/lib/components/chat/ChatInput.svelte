<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let onSend: (text: string) => void;

  let inputValue = '';
  let inputElement: HTMLInputElement;

  function handleSubmit() {
    const text = inputValue.trim();
    if (text.length === 0) return;

    onSend(text);
    inputValue = '';

    // Refocus input after sending
    if (inputElement) {
      inputElement.focus();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }
</script>

<div class="chat-input">
  <input
    bind:this={inputElement}
    bind:value={inputValue}
    on:keydown={handleKeydown}
    type="text"
    placeholder="Type a message or /roll 2d6..."
    class="input-field"
  />
  <button
    on:click={handleSubmit}
    disabled={inputValue.trim().length === 0}
    class="send-button"
  >
    Send
  </button>
</div>

<style>
  .chat-input {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    background-color: #111827;
    border-top: 1px solid #374151;
  }

  .input-field {
    flex: 1;
    background-color: #374151;
    border: 1px solid #4b5563;
    border-radius: 0.375rem;
    padding: 0.625rem 0.875rem;
    color: #f9fafb;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.2s, background-color 0.2s;
  }

  .input-field:focus {
    border-color: #60a5fa;
    background-color: #1f2937;
  }

  .input-field::placeholder {
    color: #6b7280;
  }

  .send-button {
    background-color: #3b82f6;
    color: #ffffff;
    border: none;
    border-radius: 0.375rem;
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .send-button:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .send-button:active:not(:disabled) {
    background-color: #1d4ed8;
  }

  .send-button:disabled {
    background-color: #4b5563;
    cursor: not-allowed;
    opacity: 0.5;
  }
</style>
