<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let onSend: (text: string) => void;

  let inputValue = '';
  let textareaElement: HTMLTextAreaElement;

  function handleSubmit() {
    const text = inputValue.trim();
    if (text.length === 0) return;

    onSend(text);
    inputValue = '';

    // Reset textarea height after sending
    if (textareaElement) {
      textareaElement.style.height = 'auto';
      textareaElement.focus();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  function handleInput() {
    // Auto-resize textarea
    if (textareaElement) {
      textareaElement.style.height = 'auto';
      const newHeight = Math.min(textareaElement.scrollHeight, 120); // Max 120px (about 5 lines)
      textareaElement.style.height = newHeight + 'px';
    }
  }
</script>

<div class="chat-input">
  <textarea
    bind:this={textareaElement}
    bind:value={inputValue}
    on:keydown={handleKeydown}
    on:input={handleInput}
    placeholder="Type a message or /roll 2d6..."
    class="input-field"
    rows="1"
  ></textarea>
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
    align-items: flex-end;
    gap: 0.5rem;
    padding: 0.5rem;
    background-color: #111827;
    border-top: 1px solid #374151;
  }

  .input-field {
    flex: 1;
    background-color: #374151;
    border: 1px solid #4b5563;
    border-radius: 0.375rem;
    padding: 0.375rem 0.5rem;
    color: #f9fafb;
    font-size: 0.875rem;
    font-family: inherit;
    line-height: 1.4;
    outline: none;
    resize: none;
    overflow-y: hidden;
    min-height: 1.4em;
    max-height: 120px;
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
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
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
