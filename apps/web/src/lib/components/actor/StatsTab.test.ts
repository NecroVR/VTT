import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import StatsTab from './StatsTab.svelte';
import type { Actor } from '@vtt/shared';

describe('StatsTab', () => {
  const mockActor: Actor = {
    id: 'actor-1',
    gameId: 'game-1',
    name: 'Test Character',
    actorType: 'pc',
    img: null,
    ownerId: 'user-1',
    attributes: {
      hp: { value: 25, max: 30 },
      ac: 15,
      level: 5,
      speed: 30,
    },
    abilities: {
      str: 16,
      dex: 14,
      con: 13,
      int: 10,
      wis: 12,
      cha: 8,
    },
    sort: 0,
    data: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should render core attributes', () => {
    render(StatsTab, {
      props: {
        actor: mockActor,
        onUpdate: vi.fn(),
      },
    });

    expect(screen.getByText('Hit Points')).toBeInTheDocument();
    expect(screen.getByText('Armor Class')).toBeInTheDocument();
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.getByText('Speed (ft)')).toBeInTheDocument();
  });

  it('should display HP values correctly', () => {
    render(StatsTab, {
      props: {
        actor: mockActor,
        onUpdate: vi.fn(),
      },
    });

    const inputs = screen.getAllByRole('spinbutton');
    const hpCurrentInput = inputs.find(
      (input) => (input as HTMLInputElement).value === '25'
    ) as HTMLInputElement;
    const hpMaxInput = inputs.find(
      (input) => (input as HTMLInputElement).value === '30'
    ) as HTMLInputElement;

    expect(hpCurrentInput).toBeInTheDocument();
    expect(hpMaxInput).toBeInTheDocument();
  });

  it('should display ability scores with modifiers', () => {
    render(StatsTab, {
      props: {
        actor: mockActor,
        onUpdate: vi.fn(),
      },
    });

    expect(screen.getByText('STR')).toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument(); // STR 16 = +3
    expect(screen.getByText('DEX')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument(); // DEX 14 = +2
    expect(screen.getByText('CON')).toBeInTheDocument();
    expect(screen.getAllByText('+1').length).toBeGreaterThan(0); // CON 13 = +1, WIS 12 = +1
    expect(screen.getByText('INT')).toBeInTheDocument();
    expect(screen.getByText('+0')).toBeInTheDocument(); // INT 10 = +0
    expect(screen.getByText('WIS')).toBeInTheDocument();
    // +1 appears multiple times (CON and WIS)
    expect(screen.getByText('CHA')).toBeInTheDocument();
    expect(screen.getByText('-1')).toBeInTheDocument(); // CHA 8 = -1
  });

  it('should handle missing attributes with defaults', () => {
    const actorWithoutAttributes: Actor = {
      ...mockActor,
      attributes: {},
      abilities: {},
    };

    render(StatsTab, {
      props: {
        actor: actorWithoutAttributes,
        onUpdate: vi.fn(),
      },
    });

    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('should call onUpdate when HP is changed', async () => {
    const onUpdate = vi.fn();

    render(StatsTab, {
      props: {
        actor: mockActor,
        onUpdate,
      },
    });

    const inputs = screen.getAllByRole('spinbutton');
    const hpCurrentInput = inputs.find(
      (input) => (input as HTMLInputElement).value === '25'
    ) as HTMLInputElement;

    await fireEvent.input(hpCurrentInput, { target: { value: '20' } });
    await fireEvent.change(hpCurrentInput);

    expect(onUpdate).toHaveBeenCalledWith({
      attributes: expect.objectContaining({
        hp: { value: 20, max: 30 },
      }),
    });
  });

  it('should call onUpdate when AC is changed', async () => {
    const onUpdate = vi.fn();

    render(StatsTab, {
      props: {
        actor: mockActor,
        onUpdate,
      },
    });

    const inputs = screen.getAllByRole('spinbutton');
    const acInput = inputs.find(
      (input) => (input as HTMLInputElement).value === '15'
    ) as HTMLInputElement;

    await fireEvent.input(acInput, { target: { value: '18' } });
    await fireEvent.change(acInput);

    expect(onUpdate).toHaveBeenCalledWith({
      attributes: expect.objectContaining({
        ac: 18,
      }),
    });
  });

  it('should call onUpdate when ability scores are changed', async () => {
    const onUpdate = vi.fn();

    render(StatsTab, {
      props: {
        actor: mockActor,
        onUpdate,
      },
    });

    const inputs = screen.getAllByRole('spinbutton');
    const strInput = inputs.find(
      (input) => (input as HTMLInputElement).value === '16'
    ) as HTMLInputElement;

    await fireEvent.input(strInput, { target: { value: '18' } });
    await fireEvent.change(strInput);

    expect(onUpdate).toHaveBeenCalledWith({
      abilities: expect.objectContaining({
        str: 18,
      }),
    });
  });

  it('should calculate negative modifiers correctly', () => {
    const actorWithLowStats: Actor = {
      ...mockActor,
      abilities: {
        str: 8,
        dex: 6,
        con: 4,
        int: 3,
        wis: 10,
        cha: 10,
      },
    };

    render(StatsTab, {
      props: {
        actor: actorWithLowStats,
        onUpdate: vi.fn(),
      },
    });

    expect(screen.getByText('-1')).toBeInTheDocument(); // STR 8 = -1
    expect(screen.getByText('-2')).toBeInTheDocument(); // DEX 6 = -2
    expect(screen.getByText('-3')).toBeInTheDocument(); // CON 4 = -3
    expect(screen.getByText('-4')).toBeInTheDocument(); // INT 3 = -4
  });

  it('should respect min/max constraints on HP', () => {
    render(StatsTab, {
      props: {
        actor: mockActor,
        onUpdate: vi.fn(),
      },
    });

    const inputs = screen.getAllByRole('spinbutton');
    const hpCurrentInput = inputs.find(
      (input) => (input as HTMLInputElement).value === '25'
    ) as HTMLInputElement;

    expect(hpCurrentInput).toHaveAttribute('min', '0');
    expect(hpCurrentInput).toHaveAttribute('max', '30');
  });

  it('should respect min/max constraints on ability scores', () => {
    render(StatsTab, {
      props: {
        actor: mockActor,
        onUpdate: vi.fn(),
      },
    });

    const inputs = screen.getAllByRole('spinbutton');
    const strInput = inputs.find(
      (input) => (input as HTMLInputElement).value === '16'
    ) as HTMLInputElement;

    expect(strInput).toHaveAttribute('min', '1');
    expect(strInput).toHaveAttribute('max', '30');
  });
});
