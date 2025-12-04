import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ActorHeader from './ActorHeader.svelte';
import type { Actor } from '@vtt/shared';

describe('ActorHeader', () => {
  const mockActor: Actor = {
    id: 'actor-1',
    gameId: 'game-1',
    name: 'Gandalf',
    actorType: 'pc',
    img: 'https://example.com/gandalf.jpg',
    ownerId: 'user-1',
    attributes: {},
    abilities: {},
    sort: 0,
    data: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should render actor name and type', () => {
    render(ActorHeader, {
      props: {
        actor: mockActor,
        onUpdate: vi.fn(),
      },
    });

    expect(screen.getByText('Gandalf')).toBeInTheDocument();
    expect(screen.getByText('PC')).toBeInTheDocument();
  });

  it('should display actor portrait when image is provided', () => {
    render(ActorHeader, {
      props: {
        actor: mockActor,
        onUpdate: vi.fn(),
      },
    });

    const img = screen.getByAltText('Gandalf');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/gandalf.jpg');
  });

  it('should display placeholder when no image provided', () => {
    const actorWithoutImg = { ...mockActor, img: null };

    render(ActorHeader, {
      props: {
        actor: actorWithoutImg,
        onUpdate: vi.fn(),
      },
    });

    expect(screen.getByText('G')).toBeInTheDocument();
  });

  it('should display NPC badge for NPC actors', () => {
    const npcActor = { ...mockActor, actorType: 'npc' };

    render(ActorHeader, {
      props: {
        actor: npcActor,
        onUpdate: vi.fn(),
      },
    });

    expect(screen.getByText('NPC')).toBeInTheDocument();
  });

  it('should allow editing actor name on click', async () => {
    const onUpdate = vi.fn();

    render(ActorHeader, {
      props: {
        actor: mockActor,
        onUpdate,
      },
    });

    const nameElement = screen.getByText('Gandalf');
    await fireEvent.click(nameElement);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Gandalf');
  });

  it('should call onUpdate when name is changed', async () => {
    const onUpdate = vi.fn();

    render(ActorHeader, {
      props: {
        actor: mockActor,
        onUpdate,
      },
    });

    const nameElement = screen.getByText('Gandalf');
    await fireEvent.click(nameElement);

    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: 'Gandalf the Grey' } });
    await fireEvent.blur(input);

    expect(onUpdate).toHaveBeenCalledWith({ name: 'Gandalf the Grey' });
  });

  it('should not call onUpdate if name unchanged', async () => {
    const onUpdate = vi.fn();

    render(ActorHeader, {
      props: {
        actor: mockActor,
        onUpdate,
      },
    });

    const nameElement = screen.getByText('Gandalf');
    await fireEvent.click(nameElement);

    const input = screen.getByRole('textbox');
    await fireEvent.blur(input);

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should save on Enter key', async () => {
    const onUpdate = vi.fn();

    render(ActorHeader, {
      props: {
        actor: mockActor,
        onUpdate,
      },
    });

    const nameElement = screen.getByText('Gandalf');
    await fireEvent.click(nameElement);

    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: 'New Name' } });
    await fireEvent.keyDown(input, { key: 'Enter' });

    expect(onUpdate).toHaveBeenCalledWith({ name: 'New Name' });
  });

  it('should cancel on Escape key', async () => {
    const onUpdate = vi.fn();

    render(ActorHeader, {
      props: {
        actor: mockActor,
        onUpdate,
      },
    });

    const nameElement = screen.getByText('Gandalf');
    await fireEvent.click(nameElement);

    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: 'New Name' } });
    await fireEvent.keyDown(input, { key: 'Escape' });

    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByText('Gandalf')).toBeInTheDocument();
  });
});
