<script lang="ts">
  import type { ImportJob, ImportSource } from '@vtt/shared';
  import { createEventDispatcher } from 'svelte';

  export let jobs: ImportJob[] = [];
  export let sources: ImportSource[] = [];

  const dispatch = createEventDispatcher<{
    viewJob: string;
    deleteSource: string;
  }>();

  let selectedTab: 'jobs' | 'sources' = 'jobs';

  function getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      case 'partial':
        return '#f59e0b';
      case 'processing':
        return '#4a90e2';
      default:
        return '#6b7280';
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
        return 'Partial';
      default:
        return status;
    }
  }

  function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }

  function formatSourceType(type: string): string {
    switch (type) {
      case 'foundryvtt':
        return 'Foundry VTT';
      case 'dndbeyond':
        return 'D&D Beyond';
      case 'manual':
        return 'Manual';
      default:
        return type;
    }
  }
</script>

<div class="import-history">
  <header class="history-header">
    <h3>Import History</h3>
    <div class="tab-selector">
      <button
        class="tab-button"
        class:active={selectedTab === 'jobs'}
        on:click={() => (selectedTab = 'jobs')}
      >
        Jobs ({jobs.length})
      </button>
      <button
        class="tab-button"
        class:active={selectedTab === 'sources'}
        on:click={() => (selectedTab = 'sources')}
      >
        Sources ({sources.length})
      </button>
    </div>
  </header>

  {#if selectedTab === 'jobs'}
    <div class="jobs-list">
      {#if jobs.length === 0}
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
          </svg>
          <p>No import jobs yet</p>
        </div>
      {:else}
        {#each jobs as job}
          <div class="job-card">
            <div class="job-header">
              <div class="job-info">
                <div class="job-type">{formatSourceType(job.sourceType)}</div>
                <div class="job-content-type">{job.contentType}</div>
              </div>
              <div
                class="status-badge"
                style="background-color: {getStatusColor(job.status)}"
              >
                {getStatusLabel(job.status)}
              </div>
            </div>

            <div class="job-stats">
              <div class="stat">
                <span class="stat-label">Total:</span>
                <span class="stat-value">{job.totalItems}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Processed:</span>
                <span class="stat-value">{job.processedItems}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Failed:</span>
                <span class="stat-value failed">{job.failedItems}</span>
              </div>
            </div>

            <div class="job-footer">
              <div class="job-date">
                {formatDate(job.startedAt)}
              </div>
              <button
                class="view-button"
                on:click={() => dispatch('viewJob', job.id)}
              >
                View Details
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {:else}
    <div class="sources-list">
      {#if sources.length === 0}
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p>No import sources yet</p>
        </div>
      {:else}
        {#each sources as source}
          <div class="source-card">
            <div class="source-header">
              <div class="source-info">
                <div class="source-name">{source.sourceName}</div>
                <div class="source-type">{formatSourceType(source.sourceType)}</div>
              </div>
              <button
                class="delete-button"
                on:click={() => dispatch('deleteSource', source.id)}
                aria-label="Delete source"
                title="Delete this import source and all its imported content"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>

            <div class="source-details">
              {#if source.sourceVersion}
                <div class="detail-row">
                  <span class="detail-label">Version:</span>
                  <span class="detail-value">{source.sourceVersion}</span>
                </div>
              {/if}
              <div class="detail-row">
                <span class="detail-label">Items:</span>
                <span class="detail-value">{source.itemCount}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Content Types:</span>
                <span class="detail-value">{source.contentTypes.join(', ')}</span>
              </div>
            </div>

            <div class="source-footer">
              <div class="source-date">
                Imported: {formatDate(source.importedAt)}
              </div>
              {#if source.lastSyncAt}
                <div class="source-sync">
                  Last sync: {formatDate(source.lastSyncAt)}
                </div>
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .import-history {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border, #333);
  }

  .history-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .tab-selector {
    display: flex;
    gap: 0.5rem;
  }

  .tab-button {
    padding: 0.5rem 1rem;
    background-color: transparent;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    color: var(--color-text-secondary, #aaa);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-button:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }

  .tab-button.active {
    background-color: #4a90e2;
    border-color: #4a90e2;
    color: white;
  }

  .jobs-list,
  .sources-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 500px;
    overflow-y: auto;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    text-align: center;
    color: var(--color-text-secondary, #666);
  }

  .empty-state svg {
    width: 64px;
    height: 64px;
    margin-bottom: 1rem;
  }

  .empty-state p {
    margin: 0;
    font-size: 1rem;
  }

  .job-card,
  .source-card {
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    padding: 1rem;
    transition: all 0.2s;
  }

  .job-card:hover,
  .source-card:hover {
    border-color: #4a90e2;
  }

  .job-header,
  .source-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .job-info,
  .source-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .job-type,
  .source-name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .job-content-type,
  .source-type {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #666);
    text-transform: capitalize;
  }

  .status-badge {
    padding: 0.25rem 0.625rem;
    border-radius: 4px;
    color: white;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
  }

  .job-stats {
    display: flex;
    gap: 1.5rem;
    padding: 0.75rem 0;
    border-top: 1px solid var(--color-border, #333);
    border-bottom: 1px solid var(--color-border, #333);
  }

  .stat {
    display: flex;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .stat-label {
    color: var(--color-text-secondary, #666);
  }

  .stat-value {
    color: var(--color-text-primary, #ffffff);
    font-weight: 500;
  }

  .stat-value.failed {
    color: #ef4444;
  }

  .job-footer,
  .source-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 1rem;
    font-size: 0.875rem;
  }

  .job-date,
  .source-date {
    color: var(--color-text-secondary, #666);
  }

  .source-sync {
    color: var(--color-text-secondary, #666);
    font-size: 0.75rem;
  }

  .view-button {
    padding: 0.375rem 0.75rem;
    background-color: transparent;
    border: 1px solid #4a90e2;
    border-radius: 4px;
    color: #4a90e2;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .view-button:hover {
    background-color: #4a90e2;
    color: white;
  }

  .delete-button {
    background: none;
    border: 1px solid var(--color-border, #333);
    color: var(--color-text-secondary, #aaa);
    width: 2rem;
    height: 2rem;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .delete-button svg {
    width: 18px;
    height: 18px;
  }

  .delete-button:hover {
    background-color: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
    color: #ef4444;
  }

  .source-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem 0;
    border-top: 1px solid var(--color-border, #333);
    border-bottom: 1px solid var(--color-border, #333);
  }

  .detail-row {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
  }

  .detail-label {
    color: var(--color-text-secondary, #666);
    min-width: 100px;
  }

  .detail-value {
    color: var(--color-text-primary, #ffffff);
  }
</style>
