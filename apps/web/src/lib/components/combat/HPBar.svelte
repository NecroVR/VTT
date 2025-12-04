<script lang="ts">
  // Props
  export let current: number;
  export let max: number;
  export let size: 'small' | 'medium' | 'large' = 'medium';

  // Calculate percentage
  $: percentage = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;

  // Determine color based on percentage
  $: barColor = percentage > 50 ? '#10b981' : percentage > 25 ? '#f59e0b' : '#ef4444';

  // Size classes
  const sizeClasses = {
    small: 'h-1',
    medium: 'h-2',
    large: 'h-3'
  };
</script>

<div class="hp-bar" class:small={size === 'small'} class:large={size === 'large'}>
  <div class="hp-bar-background">
    <div
      class="hp-bar-fill"
      style="width: {percentage}%; background-color: {barColor};"
    />
  </div>
  <div class="hp-text">
    <span>{current} / {max}</span>
  </div>
</div>

<style>
  .hp-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .hp-bar-background {
    flex: 1;
    height: 0.5rem;
    background-color: #374151;
    border-radius: 0.25rem;
    overflow: hidden;
    position: relative;
  }

  .hp-bar.large .hp-bar-background {
    height: 0.75rem;
  }

  .hp-bar.small .hp-bar-background {
    height: 0.375rem;
  }

  .hp-bar-fill {
    height: 100%;
    transition: width 0.3s ease, background-color 0.3s ease;
    border-radius: 0.25rem;
  }

  .hp-text {
    font-size: 0.75rem;
    color: #d1d5db;
    min-width: 4rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .hp-bar.small .hp-text {
    font-size: 0.625rem;
    min-width: 3rem;
  }

  .hp-bar.large .hp-text {
    font-size: 0.875rem;
    min-width: 5rem;
  }
</style>
