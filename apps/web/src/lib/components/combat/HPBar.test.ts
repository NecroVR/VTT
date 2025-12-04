import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HPBar from './HPBar.svelte';

describe('HPBar', () => {
  it('should render HP bar with current and max values', () => {
    render(HPBar, { props: { current: 15, max: 20 } });

    expect(screen.getByText('15 / 20')).toBeInTheDocument();
  });

  it('should calculate percentage correctly', () => {
    const { container } = render(HPBar, { props: { current: 10, max: 20 } });

    const fill = container.querySelector('.hp-bar-fill') as HTMLElement;
    expect(fill.style.width).toBe('50%');
  });

  it('should show green color when HP is above 50%', () => {
    const { container } = render(HPBar, { props: { current: 15, max: 20 } });

    const fill = container.querySelector('.hp-bar-fill') as HTMLElement;
    expect(fill.style.backgroundColor).toBe('rgb(16, 185, 129)'); // #10b981
  });

  it('should show orange color when HP is between 25% and 50%', () => {
    const { container } = render(HPBar, { props: { current: 8, max: 20 } });

    const fill = container.querySelector('.hp-bar-fill') as HTMLElement;
    expect(fill.style.backgroundColor).toBe('rgb(245, 158, 11)'); // #f59e0b
  });

  it('should show red color when HP is below 25%', () => {
    const { container } = render(HPBar, { props: { current: 3, max: 20 } });

    const fill = container.querySelector('.hp-bar-fill') as HTMLElement;
    expect(fill.style.backgroundColor).toBe('rgb(239, 68, 68)'); // #ef4444
  });

  it('should handle zero max HP', () => {
    const { container } = render(HPBar, { props: { current: 0, max: 0 } });

    const fill = container.querySelector('.hp-bar-fill') as HTMLElement;
    expect(fill.style.width).toBe('0%');
  });

  it('should handle negative current HP as 0%', () => {
    const { container } = render(HPBar, { props: { current: -5, max: 20 } });

    const fill = container.querySelector('.hp-bar-fill') as HTMLElement;
    expect(fill.style.width).toBe('0%');
  });

  it('should handle current HP exceeding max as 100%', () => {
    const { container } = render(HPBar, { props: { current: 30, max: 20 } });

    const fill = container.querySelector('.hp-bar-fill') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('should support small size', () => {
    const { container } = render(HPBar, { props: { current: 10, max: 20, size: 'small' } });

    const hpBar = container.querySelector('.hp-bar');
    expect(hpBar).toHaveClass('small');
  });

  it('should support large size', () => {
    const { container } = render(HPBar, { props: { current: 10, max: 20, size: 'large' } });

    const hpBar = container.querySelector('.hp-bar');
    expect(hpBar).toHaveClass('large');
  });
});
