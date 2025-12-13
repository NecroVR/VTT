<script lang="ts">
  import type { ImportJob } from '@vtt/shared';

  export let job: ImportJob;

  $: progress = job.totalItems > 0 ? (job.processedItems / job.totalItems) * 100 : 0;
  $: isComplete = job.status === 'completed' || job.status === 'failed' || job.status === 'partial';
  $: successCount = job.processedItems - job.failedItems;

  let showErrors = false;

  function getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#10b981'; // green
      case 'failed':
        return '#ef4444'; // red
      case 'partial':
        return '#f59e0b'; // orange
      case 'processing':
        return '#4a90e2'; // blue
      default:
        return '#6b7280'; // gray
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'partial':
        return 'Partially Complete';
      default:
        return status;
    }
  }
</script>

<div class="import-progress">
  <!-- Status Header -->
  <div class="status-header">
    <h3>Import Progress</h3>
    <div class="status-badge" style="background-color: {getStatusColor(job.status)}">
      {getStatusLabel(job.status)}
    </div>
  </div>

  <!-- Progress Bar -->
  <div class="progress-section">
    <div class="progress-bar-container">
      <div
        class="progress-bar"
        style="width: {progress}%; background-color: {getStatusColor(job.status)}"
      ></div>
    </div>
    <div class="progress-text">
      {job.processedItems} / {job.totalItems} items processed
      ({Math.round(progress)}%)
    </div>
  </div>

  <!-- Stats -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">{job.totalItems}</div>
      <div class="stat-label">Total</div>
    </div>
    <div class="stat-card success">
      <div class="stat-value">{successCount}</div>
      <div class="stat-label">Successful</div>
    </div>
    <div class="stat-card failed">
      <div class="stat-value">{job.failedItems}</div>
      <div class="stat-label">Failed</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{job.totalItems - job.processedItems}</div>
      <div class="stat-label">Remaining</div>
    </div>
  </div>

  <!-- Errors Section -->
  {#if job.errors && job.errors.length > 0}
    <div class="errors-section">
      <div class="errors-header">
        <div class="errors-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {job.errors.length} Error{job.errors.length !== 1 ? 's' : ''}
        </div>
        <button
          class="toggle-button"
          on:click={() => (showErrors = !showErrors)}
        >
          {showErrors ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {#if showErrors}
        <div class="errors-list">
          {#each job.errors as error}
            <div class="error-item">
              <div class="error-name">{error.itemName}</div>
              <div class="error-message">{error.error}</div>
              {#if error.details}
                <details class="error-details">
                  <summary>Technical Details</summary>
                  <pre>{JSON.stringify(error.details, null, 2)}</pre>
                </details>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Completion Message -->
  {#if isComplete}
    <div class="completion-message" class:success={job.status === 'completed'} class:warning={job.status === 'partial'} class:error={job.status === 'failed'}>
      {#if job.status === 'completed'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <p>Import completed successfully! All {job.totalItems} items were imported.</p>
      {:else if job.status === 'partial'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <p>Import partially complete. {successCount} of {job.totalItems} items imported successfully.</p>
      {:else if job.status === 'failed'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <p>Import failed. Please check the errors above and try again.</p>
      {/if}
    </div>
  {/if}

  <!-- Timing Info -->
  {#if job.startedAt}
    <div class="timing-info">
      <div class="timing-row">
        <span class="timing-label">Started:</span>
        <span class="timing-value">{new Date(job.startedAt).toLocaleString()}</span>
      </div>
      {#if job.completedAt}
        <div class="timing-row">
          <span class="timing-label">Completed:</span>
          <span class="timing-value">{new Date(job.completedAt).toLocaleString()}</span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .import-progress {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .status-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .status-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .status-badge {
    padding: 0.375rem 0.75rem;
    border-radius: 4px;
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .progress-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .progress-bar-container {
    width: 100%;
    height: 24px;
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    transition: width 0.3s ease;
    border-radius: 3px;
  }

  .progress-text {
    text-align: center;
    font-size: 0.875rem;
    color: var(--color-text-secondary, #666);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 1rem;
  }

  .stat-card {
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
  }

  .stat-card.success {
    border-color: #10b981;
  }

  .stat-card.failed {
    border-color: #ef4444;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text-primary, #ffffff);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #666);
    margin-top: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .errors-section {
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    border-radius: 8px;
    overflow: hidden;
  }

  .errors-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background-color: rgba(239, 68, 68, 0.1);
  }

  .errors-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: #ef4444;
  }

  .errors-title svg {
    width: 20px;
    height: 20px;
  }

  .toggle-button {
    background: none;
    border: 1px solid #ef4444;
    color: #ef4444;
    padding: 0.375rem 0.75rem;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-button:hover {
    background-color: rgba(239, 68, 68, 0.1);
  }

  .errors-list {
    padding: 0 1rem 1rem;
    max-height: 300px;
    overflow-y: auto;
  }

  .error-item {
    padding: 0.75rem;
    background-color: var(--color-bg-primary, #121212);
    border-radius: 4px;
    margin-top: 0.75rem;
  }

  .error-name {
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
    margin-bottom: 0.25rem;
  }

  .error-message {
    color: #ef4444;
    font-size: 0.875rem;
  }

  .error-details {
    margin-top: 0.5rem;
  }

  .error-details summary {
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-text-secondary, #666);
  }

  .error-details pre {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    font-size: 0.75rem;
    overflow-x: auto;
  }

  .completion-message {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid;
  }

  .completion-message.success {
    background-color: rgba(16, 185, 129, 0.1);
    border-color: #10b981;
    color: #10b981;
  }

  .completion-message.warning {
    background-color: rgba(245, 158, 11, 0.1);
    border-color: #f59e0b;
    color: #f59e0b;
  }

  .completion-message.error {
    background-color: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
    color: #ef4444;
  }

  .completion-message svg {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
  }

  .completion-message p {
    margin: 0;
    flex: 1;
  }

  .timing-info {
    padding: 1rem;
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    font-size: 0.875rem;
  }

  .timing-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.25rem 0;
  }

  .timing-label {
    font-weight: 600;
    color: var(--color-text-secondary, #aaa);
    min-width: 100px;
  }

  .timing-value {
    color: var(--color-text-primary, #ffffff);
  }
</style>
