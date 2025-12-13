<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import FileUpload from '$lib/components/import/FileUpload.svelte';
  import ContentPreview from '$lib/components/import/ContentPreview.svelte';
  import ImportProgress from '$lib/components/import/ImportProgress.svelte';
  import ImportHistory from '$lib/components/import/ImportHistory.svelte';
  import { importStore } from '$lib/stores/import';
  import type { FoundryExportData, ContentType, ImportJob } from '@vtt/shared';

  let currentStep = 1;
  let uploadedFile: File | null = null;
  let preview: FoundryExportData | null = null;
  let selectedTypes: Set<ContentType> = new Set();
  let currentJob: ImportJob | null = null;
  let error: string | null = null;
  let loading = false;

  $: jobs = Array.from($importStore.jobs.values());
  $: sources = Array.from($importStore.sources.values());

  onMount(() => {
    // Load import history
    importStore.listJobs('foundryvtt');
    importStore.listSources('foundryvtt');
  });

  onDestroy(() => {
    // Stop any active polling
    importStore.stopPolling();
  });

  async function handleFileSelected(event: CustomEvent<File>) {
    const file = event.detail;
    uploadedFile = file;
    loading = true;
    error = null;

    try {
      const result = await importStore.uploadFile(file);

      if (result) {
        preview = result.preview;
        currentStep = 2;

        // Pre-select all available content types
        if (preview) {
          const types = new Set<ContentType>();
          if (preview.actors?.length) types.add('actor');
          if (preview.items?.length) types.add('item');
          if (preview.scenes?.length) types.add('scene');
          if (preview.journals?.length) types.add('journal');
          if (preview.tables?.length) types.add('rolltable');
          if (preview.playlists?.length) types.add('playlist');
          selectedTypes = types;
        }
      } else {
        error = $importStore.error || 'Failed to upload file';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to upload file';
    } finally {
      loading = false;
    }
  }

  function handleSelectionChange(event: CustomEvent<Set<ContentType>>) {
    selectedTypes = event.detail;
  }

  function handleBackToUpload() {
    currentStep = 1;
    uploadedFile = null;
    preview = null;
    selectedTypes = new Set();
    error = null;
  }

  function handleBackToPreview() {
    currentStep = 2;
    currentJob = null;
    importStore.stopPolling();
  }

  async function handleStartImport() {
    if (!preview || selectedTypes.size === 0) {
      error = 'Please select at least one content type to import';
      return;
    }

    loading = true;
    error = null;

    try {
      // Build import items from preview based on selected types
      const items: any[] = [];

      selectedTypes.forEach(type => {
        let sourceItems: any[] = [];

        switch (type) {
          case 'actor':
            sourceItems = preview.actors || [];
            break;
          case 'item':
            sourceItems = preview.items || [];
            break;
          case 'scene':
            sourceItems = preview.scenes || [];
            break;
          case 'journal':
            sourceItems = preview.journals || [];
            break;
          case 'rolltable':
            sourceItems = preview.tables || [];
            break;
          case 'playlist':
            sourceItems = preview.playlists || [];
            break;
        }

        sourceItems.forEach(item => {
          items.push({
            sourceId: item._id,
            name: item.name,
            type,
            data: item,
            img: item.img,
            folder: item.folder,
          });
        });
      });

      // For now, we'll create one job with all items
      // In the future, we could split by content type
      const firstType = Array.from(selectedTypes)[0];

      const job = await importStore.startImport({
        sourceType: 'foundryvtt',
        contentType: firstType,
        items,
        sourceName: uploadedFile?.name || 'Foundry Export',
        sourceVersion: preview.foundryVersion,
      });

      if (job) {
        currentJob = job;
        currentStep = 3;

        // Start polling for job status
        importStore.startPolling(job.id);
      } else {
        error = $importStore.error || 'Failed to start import';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to start import';
    } finally {
      loading = false;
    }
  }

  function handleImportComplete() {
    currentStep = 4;
    importStore.stopPolling();

    // Reload history
    importStore.listJobs('foundryvtt');
    importStore.listSources('foundryvtt');
  }

  function handleStartNew() {
    currentStep = 1;
    uploadedFile = null;
    preview = null;
    selectedTypes = new Set();
    currentJob = null;
    error = null;
  }

  function handleViewJob(event: CustomEvent<string>) {
    const jobId = event.detail;
    const job = $importStore.jobs.get(jobId);
    if (job) {
      currentJob = job;
      currentStep = 3;
      // Don't poll if job is already complete
      if (job.status === 'processing' || job.status === 'pending') {
        importStore.startPolling(jobId);
      }
    }
  }

  async function handleDeleteSource(event: CustomEvent<string>) {
    const sourceId = event.detail;
    const confirmed = confirm('Are you sure you want to delete this import source? This will remove all imported content from your campaigns.');

    if (confirmed) {
      const success = await importStore.deleteSource(sourceId);
      if (success) {
        // Reload sources
        importStore.listSources('foundryvtt');
      }
    }
  }

  // Watch for job completion
  $: if (currentJob && currentStep === 3) {
    const updatedJob = $importStore.jobs.get(currentJob.id);
    if (updatedJob) {
      currentJob = updatedJob;
      if (updatedJob.status === 'completed' || updatedJob.status === 'failed' || updatedJob.status === 'partial') {
        // Job complete - move to results step after a brief delay
        setTimeout(() => {
          handleImportComplete();
        }, 1000);
      }
    }
  }
</script>

<svelte:head>
  <title>Import from Foundry VTT</title>
</svelte:head>

<div class="import-page">
  <header class="page-header">
    <div class="header-content">
      <h1>Import from Foundry VTT</h1>
      <div class="step-indicator">
        <div class="step" class:active={currentStep >= 1} class:complete={currentStep > 1}>
          <div class="step-number">1</div>
          <div class="step-label">Upload</div>
        </div>
        <div class="step-line" class:complete={currentStep > 1}></div>
        <div class="step" class:active={currentStep >= 2} class:complete={currentStep > 2}>
          <div class="step-number">2</div>
          <div class="step-label">Select</div>
        </div>
        <div class="step-line" class:complete={currentStep > 2}></div>
        <div class="step" class:active={currentStep >= 3} class:complete={currentStep > 3}>
          <div class="step-number">3</div>
          <div class="step-label">Import</div>
        </div>
        <div class="step-line" class:complete={currentStep > 3}></div>
        <div class="step" class:active={currentStep >= 4}>
          <div class="step-number">4</div>
          <div class="step-label">Complete</div>
        </div>
      </div>
    </div>
  </header>

  <main class="page-content">
    {#if currentStep === 1}
      <!-- Step 1: Upload -->
      <div class="step-content">
        <div class="instructions">
          <h2>Upload Foundry VTT Export</h2>
          <p>Export your content from Foundry VTT and upload the JSON file here.</p>
          <div class="instructions-list">
            <h3>How to export from Foundry VTT:</h3>
            <ol>
              <li>In Foundry VTT, open the Compendium or select items in your world</li>
              <li>Right-click and select "Export Data"</li>
              <li>Save the JSON file to your computer</li>
              <li>Upload the file below</li>
            </ol>
          </div>
        </div>

        <FileUpload
          {loading}
          error={error || $importStore.error}
          on:fileSelected={handleFileSelected}
        />

        <!-- Recent Imports -->
        {#if jobs.length > 0 || sources.length > 0}
          <div class="history-section">
            <ImportHistory
              {jobs}
              {sources}
              on:viewJob={handleViewJob}
              on:deleteSource={handleDeleteSource}
            />
          </div>
        {/if}
      </div>
    {:else if currentStep === 2}
      <!-- Step 2: Preview and Select -->
      <div class="step-content">
        <div class="preview-header">
          <h2>Select Content to Import</h2>
          <button class="back-button" on:click={handleBackToUpload}>
            ← Back to Upload
          </button>
        </div>

        {#if preview}
          <ContentPreview
            {preview}
            {selectedTypes}
            on:selectionChange={handleSelectionChange}
          />

          {#if error}
            <div class="error-message">
              {error}
            </div>
          {/if}

          <div class="step-actions">
            <button class="button-secondary" on:click={handleBackToUpload}>
              Cancel
            </button>
            <button
              class="button-primary"
              on:click={handleStartImport}
              disabled={loading || selectedTypes.size === 0}
            >
              {loading ? 'Starting Import...' : `Import Selected (${selectedTypes.size} types)`}
            </button>
          </div>
        {/if}
      </div>
    {:else if currentStep === 3}
      <!-- Step 3: Import Progress -->
      <div class="step-content">
        <div class="progress-header">
          <h2>Importing Content</h2>
          {#if currentJob && (currentJob.status === 'completed' || currentJob.status === 'failed' || currentJob.status === 'partial')}
            <button class="back-button" on:click={handleBackToPreview}>
              ← Back to Selection
            </button>
          {/if}
        </div>

        {#if currentJob}
          <ImportProgress job={currentJob} />
        {/if}
      </div>
    {:else if currentStep === 4}
      <!-- Step 4: Complete -->
      <div class="step-content">
        <div class="completion-screen">
          <div class="completion-icon">
            {#if currentJob?.status === 'completed'}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            {:else if currentJob?.status === 'partial'}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            {:else}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            {/if}
          </div>

          <h2>Import Complete</h2>

          {#if currentJob}
            <div class="completion-summary">
              {#if currentJob.status === 'completed'}
                <p class="success-text">
                  Successfully imported all {currentJob.totalItems} items!
                </p>
              {:else if currentJob.status === 'partial'}
                <p class="warning-text">
                  Imported {currentJob.processedItems - currentJob.failedItems} of {currentJob.totalItems} items.
                  {currentJob.failedItems} items failed.
                </p>
              {:else}
                <p class="error-text">
                  Import failed. Please check the errors and try again.
                </p>
              {/if}
            </div>
          {/if}

          <div class="completion-actions">
            <button class="button-secondary" on:click={handleStartNew}>
              Import More Content
            </button>
            <button class="button-primary" on:click={() => goto('/campaigns')}>
              Go to Campaigns
            </button>
          </div>
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  .import-page {
    min-height: 100vh;
    background-color: var(--color-bg-secondary, #1e1e1e);
  }

  .page-header {
    background-color: var(--color-bg-primary, #121212);
    border-bottom: 1px solid var(--color-border, #333);
    padding: 2rem;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header h1 {
    margin: 0 0 2rem 0;
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text-primary, #ffffff);
  }

  .step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .step-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--color-bg-secondary, #1e1e1e);
    border: 2px solid var(--color-border, #333);
    color: var(--color-text-secondary, #666);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    transition: all 0.3s;
  }

  .step.active .step-number {
    background-color: #4a90e2;
    border-color: #4a90e2;
    color: white;
  }

  .step.complete .step-number {
    background-color: #10b981;
    border-color: #10b981;
    color: white;
  }

  .step-label {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #666);
    font-weight: 500;
  }

  .step.active .step-label {
    color: var(--color-text-primary, #ffffff);
  }

  .step-line {
    width: 80px;
    height: 2px;
    background-color: var(--color-border, #333);
    transition: all 0.3s;
  }

  .step-line.complete {
    background-color: #10b981;
  }

  .page-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .step-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .instructions {
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    padding: 2rem;
  }

  .instructions h2 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .instructions p {
    margin: 0 0 1.5rem 0;
    color: var(--color-text-secondary, #aaa);
    line-height: 1.6;
  }

  .instructions-list {
    background-color: rgba(74, 144, 226, 0.05);
    border: 1px solid #4a90e2;
    border-radius: 4px;
    padding: 1.5rem;
  }

  .instructions-list h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #4a90e2;
  }

  .instructions-list ol {
    margin: 0;
    padding-left: 1.5rem;
    color: var(--color-text-primary, #ffffff);
  }

  .instructions-list li {
    margin-bottom: 0.5rem;
    line-height: 1.6;
  }

  .history-section {
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    padding: 1.5rem;
  }

  .preview-header,
  .progress-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .preview-header h2,
  .progress-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .back-button {
    background: none;
    border: 1px solid var(--color-border, #333);
    color: var(--color-text-secondary, #aaa);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .back-button:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }

  .error-message {
    padding: 0.75rem;
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    border-radius: 4px;
    color: #ef4444;
    font-size: 0.875rem;
  }

  .step-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border, #333);
  }

  button {
    padding: 0.625rem 1.25rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-primary {
    background-color: #4a90e2;
    color: white;
  }

  .button-primary:hover:not(:disabled) {
    background-color: #357abd;
  }

  .button-secondary {
    background-color: transparent;
    color: var(--color-text-secondary, #aaa);
    border: 1px solid var(--color-border, #333);
  }

  .button-secondary:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }

  .completion-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    padding: 3rem 2rem;
    background-color: var(--color-bg-primary, #121212);
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    text-align: center;
  }

  .completion-icon {
    width: 80px;
    height: 80px;
  }

  .completion-icon svg {
    width: 100%;
    height: 100%;
    color: #10b981;
  }

  .completion-screen h2 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text-primary, #ffffff);
  }

  .completion-summary {
    max-width: 600px;
  }

  .success-text {
    margin: 0;
    font-size: 1.125rem;
    color: #10b981;
    line-height: 1.6;
  }

  .warning-text {
    margin: 0;
    font-size: 1.125rem;
    color: #f59e0b;
    line-height: 1.6;
  }

  .error-text {
    margin: 0;
    font-size: 1.125rem;
    color: #ef4444;
    line-height: 1.6;
  }

  .completion-actions {
    display: flex;
    gap: 1rem;
  }

  @media (max-width: 768px) {
    .step-indicator {
      flex-wrap: wrap;
    }

    .step-line {
      width: 40px;
    }

    .step-label {
      font-size: 0.75rem;
    }

    .page-content {
      padding: 1rem;
    }

    .instructions {
      padding: 1.5rem;
    }

    .completion-actions {
      flex-direction: column;
      width: 100%;
    }

    .completion-actions button {
      width: 100%;
    }
  }
</style>
