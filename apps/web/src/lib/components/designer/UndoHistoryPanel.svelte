<script lang="ts">
  import { formDesignerStore } from '$lib/stores/formDesigner';
  import type { FormDefinition } from '@vtt/shared';

  // Props
  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen = $bindable(false), onClose }: Props = $props();

  // Store subscriptions
  let store = $derived($formDesignerStore);

  // History command interface for display
  interface HistoryCommand {
    form: FormDefinition;
    description: string;
    timestamp: Date;
  }

  // Calculate current position (number of items in undo stack)
  let currentPosition = $derived(store.undoStack.length);

  // Generate a simple description for a form state
  function generateDescription(form: FormDefinition, index: number): string {
    // For now, just use a simple numbered description
    // In the future, this could be enhanced to track actual operations
    return `Change #${index + 1}`;
  }

  // Combine undo and redo stacks into a single history timeline
  let historyTimeline = $derived(() => {
    const timeline: Array<{
      command: HistoryCommand;
      position: number;
      isCurrent: boolean;
      isFuture: boolean;
    }> = [];

    // Add undo stack (past actions)
    store.undoStack.forEach((form, index) => {
      timeline.push({
        command: {
          form,
          description: generateDescription(form, index),
          timestamp: new Date(Date.now() - (store.undoStack.length - index) * 1000) // Approximate timestamp
        },
        position: index,
        isCurrent: false,
        isFuture: false
      });
    });

    // Add current state marker
    if (store.form) {
      timeline.push({
        command: {
          form: store.form,
          description: 'Current state',
          timestamp: new Date()
        },
        position: store.undoStack.length,
        isCurrent: true,
        isFuture: false
      });
    }

    // Add redo stack (future actions, in reverse)
    store.redoStack.slice().reverse().forEach((form, index) => {
      timeline.push({
        command: {
          form,
          description: generateDescription(form, store.undoStack.length + index + 1),
          timestamp: new Date(Date.now() + (index + 1) * 1000) // Future timestamp
        },
        position: store.undoStack.length + index + 1,
        isCurrent: false,
        isFuture: true
      });
    });

    return timeline;
  });

  // Navigate to a specific point in history
  function navigateToPosition(targetPosition: number) {
    const currentPos = store.undoStack.length;

    if (targetPosition < currentPos) {
      // Need to undo
      const steps = currentPos - targetPosition;
      for (let i = 0; i < steps; i++) {
        formDesignerStore.undo();
      }
    } else if (targetPosition > currentPos) {
      // Need to redo
      const steps = targetPosition - currentPos;
      for (let i = 0; i < steps; i++) {
        formDesignerStore.redo();
      }
    }
  }

  // Clear history
  function clearHistory() {
    if (confirm('Are you sure you want to clear the undo/redo history? This cannot be undone.')) {
      // Reset stacks
      formDesignerStore.reset();
      // Reinitialize with current form if available
      if (store.form) {
        formDesignerStore.initializeForm(store.form);
      }
    }
  }

  // Format timestamp
  function formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleTimeString();
  }

  // Handle click outside to close
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  // Handle escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="history-panel-overlay" onclick={handleBackdropClick} role="button" tabindex="-1">
    <div class="history-panel">
      <div class="history-header">
        <h3>Undo/Redo History</h3>
        <button class="close-btn" onclick={onClose} title="Close">
          &times;
        </button>
      </div>

      <div class="history-content">
        {#if historyTimeline().length === 0}
          <div class="empty-state">
            <p>No history available</p>
            <span class="hint">Make changes to see them appear here</span>
          </div>
        {:else}
          <div class="history-list">
            {#each historyTimeline() as item (item.position)}
              <button
                class="history-item"
                class:current={item.isCurrent}
                class:future={item.isFuture}
                class:past={!item.isCurrent && !item.isFuture}
                onclick={() => navigateToPosition(item.position)}
                title={item.isCurrent ? 'Current state' : `Click to ${item.isFuture ? 'redo' : 'undo'} to this point`}
              >
                <div class="history-item-content">
                  <span class="history-description">{item.command.description}</span>
                  <span class="history-time">{formatTime(item.command.timestamp)}</span>
                </div>
                {#if item.isCurrent}
                  <span class="current-indicator">Current</span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="history-footer">
        <div class="history-stats">
          <span>{store.undoStack.length} undo steps</span>
          <span>•</span>
          <span>{store.redoStack.length} redo steps</span>
        </div>
        <button
          class="btn btn-secondary"
          onclick={clearHistory}
          disabled={store.undoStack.length === 0 && store.redoStack.length === 0}
        >
          Clear History
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .history-panel-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .history-panel {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }

  .history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color, #ddd);
  }

  .history-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .close-btn {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .close-btn:hover {
    background: var(--hover-bg, #f0f0f0);
  }

  .history-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
    color: var(--text-muted, #6c757d);
  }

  .empty-state p {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }

  .hint {
    font-size: 0.875rem;
    font-style: italic;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .history-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: white;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
  }

  .history-item:hover {
    background: var(--hover-bg, #f8f9fa);
    border-color: var(--primary-color, #007bff);
  }

  .history-item.current {
    background: var(--primary-color, #007bff);
    color: white;
    border-color: var(--primary-color, #007bff);
    font-weight: 600;
  }

  .history-item.future {
    opacity: 0.6;
  }

  .history-item.past {
    opacity: 1;
  }

  .history-item-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .history-description {
    font-size: 0.9375rem;
  }

  .history-time {
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .history-item.current .history-time {
    opacity: 0.9;
  }

  .current-indicator {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .history-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color, #ddd);
  }

  .history-stats {
    display: flex;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-muted, #6c757d);
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: var(--secondary-bg, #6c757d);
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--secondary-bg-hover, #5a6268);
  }
</style>
