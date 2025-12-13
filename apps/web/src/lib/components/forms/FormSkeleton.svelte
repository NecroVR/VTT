<script lang="ts">
  import SkeletonLoader from '$lib/components/common/SkeletonLoader.svelte';

  /**
   * Form Skeleton Loader
   *
   * Displays a loading skeleton that mimics the structure of a form
   * to improve perceived performance while the actual form loads.
   */

  interface Props {
    /** Number of field groups to show */
    groups?: number;
    /** Number of fields per group */
    fieldsPerGroup?: number;
    /** Show tabs skeleton */
    showTabs?: boolean;
  }

  let {
    groups = 2,
    fieldsPerGroup = 3,
    showTabs = false
  }: Props = $props();
</script>

<div class="form-skeleton" role="status" aria-label="Loading form">
  {#if showTabs}
    <!-- Tabs skeleton -->
    <div class="tabs-skeleton">
      <div class="tab-buttons">
        <SkeletonLoader width="100px" height="32px" />
        <SkeletonLoader width="100px" height="32px" />
        <SkeletonLoader width="100px" height="32px" />
      </div>
      <div class="tab-divider">
        <SkeletonLoader width="100%" height="1px" />
      </div>
    </div>
  {/if}

  <!-- Form groups -->
  {#each Array(groups) as _, groupIndex}
    <div class="group-skeleton">
      <!-- Group header -->
      <div class="group-header">
        <SkeletonLoader width="150px" height="20px" />
      </div>

      <!-- Fields -->
      <div class="fields-container">
        {#each Array(fieldsPerGroup) as _, fieldIndex}
          <div class="field-skeleton">
            <!-- Label -->
            <SkeletonLoader width="120px" height="16px" />
            <!-- Input -->
            <SkeletonLoader width="100%" height="36px" borderRadius="4px" />
          </div>
        {/each}
      </div>
    </div>
  {/each}

  <span class="sr-only">Loading form content...</span>
</div>

<style>
  .form-skeleton {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .tabs-skeleton {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .tab-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .tab-divider {
    margin-top: -0.25rem;
  }

  .group-skeleton {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    padding: 1rem;
  }

  .group-header {
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
  }

  .fields-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .field-skeleton {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
