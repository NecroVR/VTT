import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ToolButton from './ToolButton.svelte';

describe('ToolButton', () => {
  it('should render button with label and icon', () => {
    const onClick = vi.fn();
    render(ToolButton, {
      props: {
        tool: 'select',
        label: 'Select',
        icon: '⬆',
        onClick,
      },
    });

    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.getByText('⬆')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();
    render(ToolButton, {
      props: {
        tool: 'select',
        label: 'Select',
        icon: '⬆',
        onClick,
      },
    });

    const button = screen.getByRole('button');
    await fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should apply active class when active prop is true', () => {
    const onClick = vi.fn();
    render(ToolButton, {
      props: {
        tool: 'select',
        label: 'Select',
        icon: '⬆',
        active: true,
        onClick,
      },
    });

    const button = screen.getByRole('button');
    expect(button).toHaveClass('active');
  });

  it('should not apply active class when active prop is false', () => {
    const onClick = vi.fn();
    render(ToolButton, {
      props: {
        tool: 'select',
        label: 'Select',
        icon: '⬆',
        active: false,
        onClick,
      },
    });

    const button = screen.getByRole('button');
    expect(button).not.toHaveClass('active');
  });

  it('should not render when visible prop is false', () => {
    const onClick = vi.fn();
    render(ToolButton, {
      props: {
        tool: 'select',
        label: 'Select',
        icon: '⬆',
        visible: false,
        onClick,
      },
    });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should render when visible prop is true', () => {
    const onClick = vi.fn();
    render(ToolButton, {
      props: {
        tool: 'select',
        label: 'Select',
        icon: '⬆',
        visible: true,
        onClick,
      },
    });

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should disable button when disabled prop is true', () => {
    const onClick = vi.fn();
    render(ToolButton, {
      props: {
        tool: 'select',
        label: 'Select',
        icon: '⬆',
        disabled: true,
        onClick,
      },
    });

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled');
  });

  it('should set aria-label and title attributes', () => {
    const onClick = vi.fn();
    render(ToolButton, {
      props: {
        tool: 'select',
        label: 'Select Tool',
        icon: '⬆',
        onClick,
      },
    });

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Select Tool');
    expect(button).toHaveAttribute('title', 'Select Tool');
  });

  it('should set data-tool attribute', () => {
    const onClick = vi.fn();
    render(ToolButton, {
      props: {
        tool: 'select',
        label: 'Select',
        icon: '⬆',
        onClick,
      },
    });

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-tool', 'select');
  });
});
