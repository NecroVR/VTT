<script lang="ts">
  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  // Close on Escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) {
      onClose();
    }
  }

  // Close on backdrop click
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="modal-backdrop" onclick={handleBackdropClick} onkeydown={(e) => e.key === 'Escape' && onClose()} role="dialog" aria-modal="true" aria-labelledby="shortcuts-title" tabindex="-1">
    <div class="shortcuts-modal">
      <div class="modal-header">
        <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
        <button
          type="button"
          class="close-button"
          onclick={onClose}
          aria-label="Close shortcuts help"
        >
          ✕
        </button>
      </div>

      <div class="modal-content">
        <section class="shortcuts-section">
          <h3>Tree Navigation</h3>
          <p class="section-description">Navigate through your form structure when the tree view is focused</p>
          <div class="shortcuts-grid">
            <div class="shortcut-row">
              <kbd>↓</kbd>
              <span>Select next node</span>
            </div>
            <div class="shortcut-row">
              <kbd>↑</kbd>
              <span>Select previous node</span>
            </div>
            <div class="shortcut-row">
              <kbd>→</kbd>
              <span>Expand node or select first child</span>
            </div>
            <div class="shortcut-row">
              <kbd>←</kbd>
              <span>Collapse node or select parent</span>
            </div>
            <div class="shortcut-row">
              <kbd>Home</kbd>
              <span>Jump to first node</span>
            </div>
            <div class="shortcut-row">
              <kbd>End</kbd>
              <span>Jump to last visible node</span>
            </div>
          </div>
        </section>

        <section class="shortcuts-section">
          <h3>Node Operations</h3>
          <p class="section-description">Work with selected nodes in design mode</p>
          <div class="shortcuts-grid">
            <div class="shortcut-row">
              <kbd>Enter</kbd>
              <span>Edit selected node properties</span>
            </div>
            <div class="shortcut-row">
              <div class="key-combo">
                <kbd>Delete</kbd>
                <span class="or">or</span>
                <kbd>Backspace</kbd>
              </div>
              <span>Delete selected node</span>
            </div>
            <div class="shortcut-row">
              <kbd>Escape</kbd>
              <span>Deselect current node</span>
            </div>
          </div>
        </section>

        <section class="shortcuts-section">
          <h3>Undo/Redo</h3>
          <p class="section-description">Manage your editing history</p>
          <div class="shortcuts-grid">
            <div class="shortcut-row">
              <div class="key-combo">
                <kbd>Ctrl</kbd>
                <span>+</span>
                <kbd>Z</kbd>
              </div>
              <span>Undo last change</span>
            </div>
            <div class="shortcut-row">
              <div class="key-combo">
                <kbd>Ctrl</kbd>
                <span>+</span>
                <kbd>Y</kbd>
              </div>
              <span>Redo last undone change</span>
            </div>
            <div class="shortcut-row">
              <div class="key-combo">
                <kbd>Ctrl</kbd>
                <span>+</span>
                <kbd>Shift</kbd>
                <span>+</span>
                <kbd>Z</kbd>
              </div>
              <span>Redo (alternative)</span>
            </div>
          </div>
        </section>

        <section class="shortcuts-section">
          <h3>Form Field Navigation</h3>
          <p class="section-description">Navigate through form fields in preview mode</p>
          <div class="shortcuts-grid">
            <div class="shortcut-row">
              <kbd>Tab</kbd>
              <span>Move to next field</span>
            </div>
            <div class="shortcut-row">
              <div class="key-combo">
                <kbd>Shift</kbd>
                <span>+</span>
                <kbd>Tab</kbd>
              </div>
              <span>Move to previous field</span>
            </div>
          </div>
        </section>

        <section class="shortcuts-section">
          <h3>Help</h3>
          <div class="shortcuts-grid">
            <div class="shortcut-row">
              <div class="key-combo">
                <kbd>?</kbd>
                <span class="or">or</span>
                <kbd>F1</kbd>
              </div>
              <span>Show this help dialog</span>
            </div>
          </div>
        </section>

        <div class="tips-section">
          <h4>Tips</h4>
          <ul>
            <li>Most shortcuts only work when you're not typing in a text input</li>
            <li>Deleting nodes with children will prompt for confirmation</li>
            <li>Use <kbd>Cmd</kbd> instead of <kbd>Ctrl</kbd> on Mac</li>
            <li>Tree navigation requires the tree view to be focused</li>
          </ul>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-primary" onclick={onClose}>
          Got it!
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
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
    padding: 2rem;
  }

  .shortcuts-modal {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border-color, #ddd);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color, #333);
  }

  .close-button {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    color: var(--text-muted, #6c757d);
    line-height: 1;
    transition: color 0.2s;
  }

  .close-button:hover {
    color: var(--text-color, #333);
  }

  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
  }

  .shortcuts-section {
    margin-bottom: 2rem;
  }

  .shortcuts-section:last-of-type {
    margin-bottom: 1rem;
  }

  .shortcuts-section h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-color, #333);
  }

  .section-description {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    color: var(--text-muted, #6c757d);
  }

  .shortcuts-grid {
    display: grid;
    gap: 0.75rem;
  }

  .shortcut-row {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1rem;
    align-items: center;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .shortcut-row:hover {
    background: var(--hover-bg, #f8f9fa);
  }

  .key-combo {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .key-combo .or {
    padding: 0 0.25rem;
    font-size: 0.75rem;
    color: var(--text-muted, #6c757d);
  }

  kbd {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    font-family: monospace;
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1;
    color: var(--text-color, #333);
    background: var(--kbd-bg, #f8f9fa);
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    min-width: 2rem;
    text-align: center;
  }

  .tips-section {
    margin-top: 2rem;
    padding: 1rem;
    background: var(--info-bg, #e7f3ff);
    border-radius: 4px;
  }

  .tips-section h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color, #333);
    text-transform: uppercase;
  }

  .tips-section ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .tips-section li {
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-color, #333);
  }

  .tips-section li:last-child {
    margin-bottom: 0;
  }

  .modal-footer {
    padding: 1rem 2rem;
    border-top: 1px solid var(--border-color, #ddd);
    display: flex;
    justify-content: flex-end;
  }

  .btn {
    padding: 0.5rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .btn-primary {
    background: var(--primary-color, #007bff);
    color: white;
  }

  .btn-primary:hover {
    background: var(--primary-color-hover, #0056b3);
  }

  /* Focus styles for accessibility */
  .close-button:focus-visible,
  .btn:focus-visible {
    outline: 2px solid var(--primary-color, #007bff);
    outline-offset: 2px;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .modal-backdrop {
      padding: 1rem;
    }

    .shortcuts-modal {
      max-width: 100%;
    }

    .modal-header,
    .modal-content,
    .modal-footer {
      padding: 1rem;
    }

    .shortcut-row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
  }

  /* Dark mode support (if implemented) */
  @media (prefers-color-scheme: dark) {
    .shortcuts-modal {
      background: var(--bg-dark, #2d2d2d);
    }

    .modal-header h2,
    .shortcuts-section h3,
    .tips-section h4 {
      color: var(--text-light, #f8f9fa);
    }

    kbd {
      background: var(--kbd-bg-dark, #3d3d3d);
      color: var(--text-light, #f8f9fa);
      border-color: var(--border-dark, #555);
    }

    .shortcut-row:hover {
      background: var(--hover-bg-dark, #3d3d3d);
    }

    .tips-section {
      background: var(--info-bg-dark, #1a3a52);
    }
  }
</style>
