import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import NotesTab from './NotesTab.svelte';
import type { Actor } from '@vtt/shared';

describe('NotesTab', () => {
  const mockActor: Actor = {
    id: 'actor-1',
    gameId: 'game-1',
    name: 'Test Character',
    actorType: 'pc',
    img: null,
    ownerId: 'user-1',
    attributes: {},
    abilities: {},
    sort: 0,
    data: {
      biography: 'A brave adventurer from the north.',
      gmNotes: 'Secret information about the character.',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should render biography section', () => {
    render(NotesTab, {
      props: {
        actor: mockActor,
        isGM: false,
        onUpdate: vi.fn(),
      },
    });

    expect(screen.getByText('Biography')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Enter character biography...')
    ).toBeInTheDocument();
  });

  it('should display existing biography', () => {
    render(NotesTab, {
      props: {
        actor: mockActor,
        isGM: false,
        onUpdate: vi.fn(),
      },
    });

    const textarea = screen.getByPlaceholderText(
      'Enter character biography...'
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe('A brave adventurer from the north.');
  });

  it('should show GM notes section only to GMs', () => {
    const { rerender } = render(NotesTab, {
      props: {
        actor: mockActor,
        isGM: false,
        onUpdate: vi.fn(),
      },
    });

    expect(screen.queryByText('GM Notes')).not.toBeInTheDocument();

    rerender({
      actor: mockActor,
      isGM: true,
      onUpdate: vi.fn(),
    });

    expect(screen.getByText('GM Notes')).toBeInTheDocument();
  });

  it('should display existing GM notes for GMs', () => {
    render(NotesTab, {
      props: {
        actor: mockActor,
        isGM: true,
        onUpdate: vi.fn(),
      },
    });

    const textarea = screen.getByPlaceholderText(
      'Enter GM notes...'
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe('Secret information about the character.');
  });

  it('should show save/discard buttons when changes are made', async () => {
    render(NotesTab, {
      props: {
        actor: mockActor,
        isGM: false,
        onUpdate: vi.fn(),
      },
    });

    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();

    const textarea = screen.getByPlaceholderText('Enter character biography...');
    await fireEvent.input(textarea, {
      target: { value: 'Updated biography text' },
    });

    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Discard Changes')).toBeInTheDocument();
  });

  it('should call onUpdate when save is clicked', async () => {
    const onUpdate = vi.fn();

    render(NotesTab, {
      props: {
        actor: mockActor,
        isGM: false,
        onUpdate,
      },
    });

    const textarea = screen.getByPlaceholderText('Enter character biography...');
    await fireEvent.input(textarea, {
      target: { value: 'Updated biography text' },
    });

    const saveButton = screen.getByText('Save Changes');
    await fireEvent.click(saveButton);

    expect(onUpdate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        biography: 'Updated biography text',
      }),
    });
  });

  it('should discard changes when discard is clicked', async () => {
    render(NotesTab, {
      props: {
        actor: mockActor,
        isGM: false,
        onUpdate: vi.fn(),
      },
    });

    const textarea = screen.getByPlaceholderText(
      'Enter character biography...'
    ) as HTMLTextAreaElement;
    await fireEvent.input(textarea, {
      target: { value: 'Updated biography text' },
    });

    expect(textarea.value).toBe('Updated biography text');

    const discardButton = screen.getByText('Discard Changes');
    await fireEvent.click(discardButton);

    expect(textarea.value).toBe('A brave adventurer from the north.');
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
  });

  it('should handle empty biography', () => {
    const actorWithoutBiography: Actor = {
      ...mockActor,
      data: {},
    };

    render(NotesTab, {
      props: {
        actor: actorWithoutBiography,
        isGM: false,
        onUpdate: vi.fn(),
      },
    });

    const textarea = screen.getByPlaceholderText(
      'Enter character biography...'
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
  });

  it('should save both biography and GM notes for GMs', async () => {
    const onUpdate = vi.fn();

    render(NotesTab, {
      props: {
        actor: mockActor,
        isGM: true,
        onUpdate,
      },
    });

    const bioTextarea = screen.getByPlaceholderText('Enter character biography...');
    const gmNotesTextarea = screen.getByPlaceholderText('Enter GM notes...');

    await fireEvent.input(bioTextarea, {
      target: { value: 'New biography' },
    });
    await fireEvent.input(gmNotesTextarea, {
      target: { value: 'New GM notes' },
    });

    const saveButton = screen.getByText('Save Changes');
    await fireEvent.click(saveButton);

    expect(onUpdate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        biography: 'New biography',
        gmNotes: 'New GM notes',
      }),
    });
  });

  it('should show GM Only badge', () => {
    render(NotesTab, {
      props: {
        actor: mockActor,
        isGM: true,
        onUpdate: vi.fn(),
      },
    });

    expect(screen.getByText('GM Only')).toBeInTheDocument();
  });

  it('should trim whitespace when saving', async () => {
    const onUpdate = vi.fn();

    render(NotesTab, {
      props: {
        actor: mockActor,
        isGM: false,
        onUpdate,
      },
    });

    const textarea = screen.getByPlaceholderText('Enter character biography...');
    await fireEvent.input(textarea, {
      target: { value: '  Text with spaces  ' },
    });

    const saveButton = screen.getByText('Save Changes');
    await fireEvent.click(saveButton);

    expect(onUpdate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        biography: 'Text with spaces',
      }),
    });
  });
});
