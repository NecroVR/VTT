<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Module } from '@vtt/shared';

  export let module: Module;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  function handleClose() {
    dispatch('close');
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  function getValidationStatusColor(status: string): string {
    switch (status) {
      case 'valid':
        return '#10b981';
      case 'invalid':
        return '#ef4444';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  }

  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  }

  $: hasErrors = module.validationErrors && module.validationErrors.length > 0;
  $: errorCount = module.validationErrors?.filter(e => e.severity === 'error').length || 0;
  $: warningCount = module.validationErrors?.filter(e => e.severity === 'warning').length || 0;
  $: infoCount = module.validationErrors?.filter(e => e.severity === 'info').length || 0;
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-backdrop" on:click={handleBackdropClick}>
  <div class="modal-container" on:click|stopPropagation>
    <header class="modal-header">
      <div class="header-content">
        <h1>Validation Status</h1>
        <span class="module-name">{module.name}</span>
      </div>
      <button class="close-button" on:click={handleClose} aria-label="Close">
        &times;
      </button>
    </header>

    <div class="modal-body">
      <!-- Overall Status -->
      <section class="status-section">
        <div class="status-header">
          <h2>Overall Status</h2>
          <div
            class="status-badge"
            style="background-color: {getValidationStatusColor(module.validationStatus)}"
          >
            {module.validationStatus}
          </div>
        </div>

        <div class="status-summary">
          <div class="summary-item">
            <div class="summary-label">Total Issues</div>
            <div class="summary-value">{module.validationErrors?.length || 0}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Errors</div>
            <div class="summary-value error">{errorCount}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Warnings</div>
            <div class="summary-value warning">{warningCount}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Info</div>
            <div class="summary-value info">{infoCount}</div>
          </div>
        </div>

        {#if module.validatedAt}
          <div class="validated-at">
            Last validated: {new Date(module.validatedAt).toLocaleString()}
          </div>
        {/if}
      </section>

      <!-- Validation Issues -->
      {#if hasErrors}
        <section class="issues-section">
          <h2>Validation Issues</h2>
          <div class="issues-list">
            {#each module.validationErrors as error}
              <div
                class="issue-item"
                style="border-left-color: {getSeverityColor(error.severity)}"
              >
                <div class="issue-header">
                  <span class="issue-type">{error.errorType}</span>
                  <span
                    class="issue-severity"
                    style="background-color: {getSeverityColor(error.severity)}"
                  >
                    {error.severity}
                  </span>
                </div>

                <div class="issue-message">{error.message}</div>

                <div class="issue-meta">
                  {#if error.entityId}
                    <span class="meta-item">Entity: {error.entityId}</span>
                  {/if}
                  {#if error.propertyKey}
                    <span class="meta-item">Property: {error.propertyKey}</span>
                  {/if}
                </div>

                {#if error.details && Object.keys(error.details).length > 0}
                  <details class="issue-details">
                    <summary>Details</summary>
                    <pre>{JSON.stringify(error.details, null, 2)}</pre>
                  </details>
                {/if}
              </div>
            {/each}
          </div>
        </section>
      {:else}
        <section class="success-section">
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
          </div>
          <p class="success-message">No validation issues found</p>
        </section>
      {/if}

      <!-- Module Info -->
      <section class="info-section">
        <h2>Module Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>Module ID</label>
            <div class="value">{module.moduleId}</div>
          </div>
          <div class="info-item">
            <label>Version</label>
            <div class="value">{module.version}</div>
          </div>
          <div class="info-item">
            <label>Game System</label>
            <div class="value">{module.gameSystemId}</div>
          </div>
          <div class="info-item">
            <label>Type</label>
            <div class="value">{module.moduleType}</div>
          </div>
          {#if module.sourcePath}
            <div class="info-item full-width">
              <label>Source Path</label>
              <div class="value mono">{module.sourcePath}</div>
            </div>
          {/if}
          {#if module.dependencies && module.dependencies.length > 0}
            <div class="info-item full-width">
              <label>Dependencies</label>
              <div class="value">
                {module.dependencies.join(', ')}
              </div>
            </div>
          {/if}
        </div>
      </section>
    </div>

    <footer class="modal-footer">
      <button class="button secondary" on:click={handleClose}>Close</button>
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

  .modal-container {
    background-color: var(--color-bg-primary, #1a1a1a);
    border-radius: 8px;
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }

  .modal-header h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .module-name {
    color: var(--color-text-secondary, #aaa);
    font-size: 1rem;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    color: var(--color-text-secondary, #aaa);
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s, color 0.2s;
  }

  .close-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary, #ffffff);
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  section {
    background-color: var(--color-bg-secondary, #1e1e1e);
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    padding: 1.5rem;
  }

  section h2 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .status-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .status-header h2 {
    margin: 0;
  }

  .status-badge {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .summary-item {
    background-color: var(--color-bg-primary, #121212);
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
  }

  .summary-label {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #aaa);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .summary-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text-primary, #ffffff);
  }

  .summary-value.error {
    color: #ef4444;
  }

  .summary-value.warning {
    color: #f59e0b;
  }

  .summary-value.info {
    color: #3b82f6;
  }

  .validated-at {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #888);
    text-align: center;
  }

  .issues-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .issue-item {
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-left: 3px solid;
    border-radius: 4px;
    padding: 1rem;
  }

  .issue-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .issue-type {
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
  }

  .issue-severity {
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    color: white;
    font-size: 0.75rem;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .issue-message {
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    line-height: 1.5;
    margin-bottom: 0.75rem;
  }

  .issue-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }

  .meta-item {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #888);
    font-family: 'Courier New', monospace;
  }

  .issue-details {
    margin-top: 0.75rem;
  }

  .issue-details summary {
    cursor: pointer;
    font-size: 0.875rem;
    color: #4a90e2;
    font-weight: 500;
  }

  .issue-details pre {
    margin: 0.5rem 0 0 0;
    padding: 0.75rem;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    overflow-x: auto;
  }

  .success-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
  }

  .success-icon {
    color: #10b981;
  }

  .success-icon svg {
    width: 64px;
    height: 64px;
  }

  .success-message {
    font-size: 1.125rem;
    color: var(--color-text-primary, #ffffff);
    margin: 0;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .info-item.full-width {
    grid-column: 1 / -1;
  }

  .info-item label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary, #aaa);
  }

  .info-item .value {
    font-size: 0.875rem;
    color: var(--color-text-primary, #ffffff);
  }

  .value.mono {
    font-family: 'Courier New', monospace;
    background-color: var(--color-bg-primary, #121212);
    padding: 0.5rem;
    border-radius: 4px;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #333);
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button.secondary {
    background-color: var(--color-bg-secondary, #2d2d2d);
    color: var(--color-text-primary, #ffffff);
    border: 1px solid var(--color-border, #333);
  }

  .button.secondary:hover {
    background-color: var(--color-bg-primary, #1a1a1a);
  }

  @media (max-width: 768px) {
    .modal-backdrop {
      padding: 0;
    }

    .modal-container {
      max-width: 100%;
      max-height: 100vh;
      border-radius: 0;
    }

    .status-summary {
      grid-template-columns: repeat(2, 1fr);
    }

    .info-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
