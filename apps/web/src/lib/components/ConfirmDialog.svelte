<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  // Props
  export let title: string;
  export let message: string;
  export let confirmText: string = 'Delete';
  export let cancelText: string = 'Cancel';
  export let danger: boolean = true;

  const dispatch = createEventDispatcher<{
    confirm: void;
    cancel: void;
  }>();

  let dialogElement: HTMLDivElement;
  let confirmButton: HTMLButtonElement;
  let cancelButton: HTMLButtonElement;

  // Focus trap elements
  let focusableElements: HTMLElement[] = [];
  let firstFocusableElement: HTMLElement;
  let lastFocusableElement: HTMLElement;

  onMount(() => {
    // Set up focus trap
    focusableElements = Array.from(
      dialogElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
    firstFocusableElement = focusableElements[0];
    lastFocusableElement = focusableElements[focusableElements.length - 1];

    // Focus the cancel button by default (safer for destructive actions)
    cancelButton?.focus();
  });

  function handleConfirm() {
    dispatch('confirm');
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
      return;
    }

    // Focus trap: Tab and Shift+Tab handling
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift+Tab: going backwards
        if (document.activeElement === firstFocusableElement) {
          event.preventDefault();
          lastFocusableElement.focus();
        }
      } else {
        // Tab: going forwards
        if (document.activeElement === lastFocusableElement) {
          event.preventDefault();
          firstFocusableElement.focus();
        }
      }
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-backdrop" on:click={handleBackdropClick}>
  <div
    class="modal-content"
    bind:this={dialogElement}
    on:click|stopPropagation
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-message"
  >
    <header class="modal-header">
      <h2 id="dialog-title">{title}</h2>
    </header>

    <div class="modal-body">
      <p id="dialog-message">{message}</p>
    </div>

    <footer class="modal-footer">
      <button
        class="button-secondary"
        bind:this={cancelButton}
        on:click={handleCancel}
        type="button"
      >
        {cancelText}
      </button>
      <button
        class={danger ? 'button-danger' : 'button-primary'}
        bind:this={confirmButton}
        on:click={handleConfirm}
        type="button"
      >
        {confirmText}
      </button>
    </footer>
  </div>
</div>

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
    max-width: 450px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border, #333);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .modal-body {
    padding: 1.5rem;
    flex: 1;
  }

  .modal-body p {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--color-text-secondary, #aaa);
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: flex-end;
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
    min-width: 80px;
  }

  button:active {
    transform: scale(0.98);
  }

  button:focus {
    outline: 2px solid #4a90e2;
    outline-offset: 2px;
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
      padding: 1rem;
    }

    .modal-content {
      max-width: 100%;
    }

    button {
      flex: 1;
    }
  }
</style>
