import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import DiceRollResult from './DiceRollResult.svelte';
import type { DiceResultPayload } from '@vtt/shared';

describe('DiceRollResult', () => {
  it('should render basic dice roll result', () => {
    const result: DiceResultPayload = {
      notation: '2d6+3',
      rolls: [
        {
          dice: '2d6',
          results: [4, 5],
          subtotal: 9,
        },
      ],
      modifiers: 3,
      total: 12,
      breakdown: '2d6 (4, 5) + 3 = 12',
      userId: 'user-1',
      username: 'TestUser',
    };

    render(DiceRollResult, {
      props: {
        username: 'TestUser',
        result,
        timestamp: Date.now(),
      },
    });

    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.getByText('2d6+3')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('2d6 (4, 5) + 3 = 12')).toBeInTheDocument();
  });

  it('should render dice roll with label', () => {
    const result: DiceResultPayload = {
      notation: '1d20+5',
      rolls: [
        {
          dice: '1d20',
          results: [15],
          subtotal: 15,
        },
      ],
      modifiers: 5,
      total: 20,
      breakdown: '1d20 (15) + 5 = 20',
      label: 'Attack Roll',
      userId: 'user-1',
      username: 'Fighter',
    };

    render(DiceRollResult, {
      props: {
        username: 'Fighter',
        result,
        timestamp: Date.now(),
      },
    });

    expect(screen.getByText('Attack Roll')).toBeInTheDocument();
    expect(screen.getByText('1d20+5')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('should render dice roll with keep highest', () => {
    const result: DiceResultPayload = {
      notation: '4d6kh3',
      rolls: [
        {
          dice: '4d6kh3',
          results: [3, 5, 2, 6],
          kept: [1, 2, 3], // Keep indices 1, 2, 3
          subtotal: 13,
        },
      ],
      modifiers: 0,
      total: 13,
      breakdown: '4d6kh3 (~~3~~, 5, 2, 6) = 13',
      userId: 'user-1',
      username: 'Player',
    };

    render(DiceRollResult, {
      props: {
        username: 'Player',
        result,
        timestamp: Date.now(),
      },
    });

    expect(screen.getAllByText('4d6kh3').length).toBeGreaterThan(0);
    expect(screen.getByText(/Total:/)).toBeInTheDocument();

    // Check that all dice are displayed
    const diceElements = screen.getAllByText(/^[0-9]+$/);
    expect(diceElements.length).toBeGreaterThanOrEqual(4);
  });

  it('should render multiple dice groups', () => {
    const result: DiceResultPayload = {
      notation: '2d6+1d8+2',
      rolls: [
        {
          dice: '2d6',
          results: [4, 5],
          subtotal: 9,
        },
        {
          dice: '1d8',
          results: [6],
          subtotal: 6,
        },
      ],
      modifiers: 2,
      total: 17,
      breakdown: '2d6 (4, 5) + 1d8 (6) + 2 = 17',
      userId: 'user-1',
      username: 'Wizard',
    };

    render(DiceRollResult, {
      props: {
        username: 'Wizard',
        result,
        timestamp: Date.now(),
      },
    });

    expect(screen.getByText('2d6+1d8+2')).toBeInTheDocument();
    expect(screen.getByText(/Total:/)).toBeInTheDocument();
    expect(screen.getAllByText(/2d6/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1d8/).length).toBeGreaterThan(0);
  });

  it('should render negative modifiers', () => {
    const result: DiceResultPayload = {
      notation: '1d20-2',
      rolls: [
        {
          dice: '1d20',
          results: [10],
          subtotal: 10,
        },
      ],
      modifiers: -2,
      total: 8,
      breakdown: '1d20 (10) - 2 = 8',
      userId: 'user-1',
      username: 'Player',
    };

    render(DiceRollResult, {
      props: {
        username: 'Player',
        result,
        timestamp: Date.now(),
      },
    });

    expect(screen.getByText('1d20-2')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText(/Modifier: -2/)).toBeInTheDocument();
  });

  it('should not render modifier section when modifier is zero', () => {
    const result: DiceResultPayload = {
      notation: '2d6',
      rolls: [
        {
          dice: '2d6',
          results: [4, 5],
          subtotal: 9,
        },
      ],
      modifiers: 0,
      total: 9,
      breakdown: '2d6 (4, 5) = 9',
      userId: 'user-1',
      username: 'Player',
    };

    render(DiceRollResult, {
      props: {
        username: 'Player',
        result,
        timestamp: Date.now(),
      },
    });

    expect(screen.getAllByText('2d6').length).toBeGreaterThan(0);
    expect(screen.getByText(/Total:/)).toBeInTheDocument();
    expect(screen.queryByText(/Modifier:/)).not.toBeInTheDocument();
  });

  it('should format timestamp correctly', () => {
    const timestamp = new Date('2024-01-15T14:30:00').getTime();

    const result: DiceResultPayload = {
      notation: '1d6',
      rolls: [
        {
          dice: '1d6',
          results: [3],
          subtotal: 3,
        },
      ],
      modifiers: 0,
      total: 3,
      breakdown: '1d6 (3) = 3',
      userId: 'user-1',
      username: 'Player',
    };

    render(DiceRollResult, {
      props: {
        username: 'Player',
        result,
        timestamp,
      },
    });

    expect(screen.getByText('14:30')).toBeInTheDocument();
  });

  it('should handle undefined result gracefully', () => {
    const { container } = render(DiceRollResult, {
      props: {
        username: 'Player',
        result: undefined,
        timestamp: Date.now(),
      },
    });

    // Component should render but be empty
    expect(container.querySelector('.dice-roll-result')).not.toBeInTheDocument();
  });

  it('should render dice roll with drop lowest', () => {
    const result: DiceResultPayload = {
      notation: '4d6dl1',
      rolls: [
        {
          dice: '4d6dl1',
          results: [3, 5, 2, 6],
          kept: [0, 1, 3], // Drop the lowest (index 2, value 2)
          subtotal: 14,
        },
      ],
      modifiers: 0,
      total: 14,
      breakdown: '4d6dl1 (3, 5, ~~2~~, 6) = 14',
      userId: 'user-1',
      username: 'Player',
    };

    render(DiceRollResult, {
      props: {
        username: 'Player',
        result,
        timestamp: Date.now(),
      },
    });

    expect(screen.getAllByText('4d6dl1').length).toBeGreaterThan(0);
    expect(screen.getByText(/Total:/)).toBeInTheDocument();
  });

  it('should render very high dice rolls', () => {
    const result: DiceResultPayload = {
      notation: '10d10',
      rolls: [
        {
          dice: '10d10',
          results: [7, 8, 5, 9, 10, 6, 7, 8, 9, 10],
          subtotal: 79,
        },
      ],
      modifiers: 0,
      total: 79,
      breakdown: '10d10 (7, 8, 5, 9, 10, 6, 7, 8, 9, 10) = 79',
      userId: 'user-1',
      username: 'BigRoller',
    };

    render(DiceRollResult, {
      props: {
        username: 'BigRoller',
        result,
        timestamp: Date.now(),
      },
    });

    expect(screen.getAllByText('10d10').length).toBeGreaterThan(0);
    expect(screen.getByText(/Total:/)).toBeInTheDocument();

    // Check that all 10 dice are displayed
    const diceElements = screen.getAllByText(/^[0-9]+$/);
    expect(diceElements.length).toBeGreaterThanOrEqual(10);
  });
});
