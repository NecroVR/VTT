import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ItemSheet from './ItemSheet.svelte';
import type { Item } from '@vtt/shared';

// Mock fetch
global.fetch = vi.fn();

const mockItem: Item = {
  id: 'item-123',
  gameId: 'game-123',
  actorId: 'actor-123',
  name: 'Longsword',
  itemType: 'weapon',
  img: 'https://example.com/sword.png',
  description: 'A versatile weapon',
  quantity: 1,
  weight: 3,
  price: 15,
  equipped: true,
  data: {
    damage: '1d8',
    damageType: 'slashing',
    range: 5,
    properties: 'versatile'
  },
  sort: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

describe('ItemSheet component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  describe('Modal behavior', () => {
    it('should render modal when isOpen is true', () => {
      render(ItemSheet, {
        props: {
          isOpen: true,
          item: null,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      expect(screen.getByText('Create Item')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(ItemSheet, {
        props: {
          isOpen: false,
          item: null,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      expect(screen.queryByText('Create Item')).not.toBeInTheDocument();
    });

    it('should display "Edit Item" title when editing existing item', () => {
      render(ItemSheet, {
        props: {
          isOpen: true,
          item: mockItem,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      expect(screen.getByText('Edit Item')).toBeInTheDocument();
    });

    it('should emit close event when cancel button is clicked', async () => {
      const { component } = render(ItemSheet, {
        props: {
          isOpen: true,
          item: null,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      const closeHandler = vi.fn();
      component.$on('close', closeHandler);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await fireEvent.click(cancelButton);

      expect(closeHandler).toHaveBeenCalled();
    });

    it('should emit close event when close button (X) is clicked', async () => {
      const { component } = render(ItemSheet, {
        props: {
          isOpen: true,
          item: null,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      const closeHandler = vi.fn();
      component.$on('close', closeHandler);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await fireEvent.click(closeButton);

      expect(closeHandler).toHaveBeenCalled();
    });
  });

  describe('Form fields', () => {
    it('should populate form fields when editing existing item', () => {
      render(ItemSheet, {
        props: {
          isOpen: true,
          item: mockItem,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Longsword');

      const typeSelect = screen.getByLabelText(/^type$/i) as HTMLSelectElement;
      expect(typeSelect.value).toBe('weapon');

      const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      expect(descriptionInput.value).toBe('A versatile weapon');
    });

    it('should have empty form fields when creating new item', () => {
      render(ItemSheet, {
        props: {
          isOpen: true,
          item: null,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('');
    });

    it('should display image preview when image URL is provided', () => {
      render(ItemSheet, {
        props: {
          isOpen: true,
          item: mockItem,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      const imgElement = screen.getByAltText('Item preview') as HTMLImageElement;
      expect(imgElement.src).toBe('https://example.com/sword.png');
    });
  });

  describe('Type-specific fields', () => {
    it('should show weapon fields when itemType is weapon', () => {
      render(ItemSheet, {
        props: {
          isOpen: true,
          item: mockItem,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      expect(screen.getByText('Weapon Properties')).toBeInTheDocument();
      expect(screen.getByLabelText(/damage$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/damage type/i)).toBeInTheDocument();
    });

    it('should show armor fields when itemType is armor', async () => {
      const armorItem = { ...mockItem, itemType: 'armor', data: {} };

      render(ItemSheet, {
        props: {
          isOpen: true,
          item: armorItem,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      expect(screen.getByText('Armor Properties')).toBeInTheDocument();
      expect(screen.getByLabelText(/armor class/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max dex bonus/i)).toBeInTheDocument();
    });

    it('should show consumable fields when itemType is consumable', () => {
      const consumableItem = { ...mockItem, itemType: 'consumable', data: {} };

      render(ItemSheet, {
        props: {
          isOpen: true,
          item: consumableItem,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      expect(screen.getByText('Consumable Properties')).toBeInTheDocument();
      expect(screen.getByLabelText(/current uses/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max uses/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/charge reset/i)).toBeInTheDocument();
    });

    it('should show spell fields when itemType is spell', () => {
      const spellItem = { ...mockItem, itemType: 'spell', data: {} };

      render(ItemSheet, {
        props: {
          isOpen: true,
          item: spellItem,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      expect(screen.getByText('Spell Properties')).toBeInTheDocument();
      expect(screen.getByLabelText(/^level$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/school/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/casting time/i)).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('should show error when trying to save without a name', async () => {
      render(ItemSheet, {
        props: {
          isOpen: true,
          item: null,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      const saveButton = screen.getByRole('button', { name: /^save$/i });
      await fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/item name is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Save functionality', () => {
    it('should POST to create new item', async () => {
      const mockResponse = {
        item: {
          ...mockItem,
          id: 'new-item-123'
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const { component } = render(ItemSheet, {
        props: {
          isOpen: true,
          item: null,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      const saveHandler = vi.fn();
      component.$on('save', saveHandler);

      // Fill in the form
      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      await fireEvent.input(nameInput, { target: { value: 'New Sword' } });

      const saveButton = screen.getByRole('button', { name: /^save$/i });
      await fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/actors/actor-123/items',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
        );
      });
    });

    it('should PATCH to update existing item', async () => {
      const mockResponse = {
        item: {
          ...mockItem,
          name: 'Updated Sword'
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const { component } = render(ItemSheet, {
        props: {
          isOpen: true,
          item: mockItem,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      const saveHandler = vi.fn();
      component.$on('save', saveHandler);

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      await fireEvent.input(nameInput, { target: { value: 'Updated Sword' } });

      const saveButton = screen.getByRole('button', { name: /^save$/i });
      await fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/items/item-123',
          expect.objectContaining({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
          })
        );
      });
    });

    it('should emit save event with item data on successful save', async () => {
      const mockResponse = {
        item: mockItem
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const { component } = render(ItemSheet, {
        props: {
          isOpen: true,
          item: mockItem,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      const saveHandler = vi.fn();
      component.$on('save', saveHandler);

      const saveButton = screen.getByRole('button', { name: /^save$/i });
      await fireEvent.click(saveButton);

      await waitFor(() => {
        expect(saveHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: mockItem
          })
        );
      });
    });
  });

  describe('Delete functionality', () => {
    it('should show delete button only when editing existing item', () => {
      const { rerender } = render(ItemSheet, {
        props: {
          isOpen: true,
          item: null,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();

      rerender({
        isOpen: true,
        item: mockItem,
        actorId: 'actor-123',
        gameId: 'game-123'
      });

      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('should emit delete event when delete is confirmed', async () => {
      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = vi.fn(() => true);

      const mockResponse = { ok: true };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const { component } = render(ItemSheet, {
        props: {
          isOpen: true,
          item: mockItem,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      const deleteHandler = vi.fn();
      component.$on('delete', deleteHandler);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/items/item-123',
          expect.objectContaining({
            method: 'DELETE'
          })
        );
        expect(deleteHandler).toHaveBeenCalled();
      });

      // Restore original confirm
      window.confirm = originalConfirm;
    });

    it('should not delete when user cancels confirmation', async () => {
      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = vi.fn(() => false);

      const { component } = render(ItemSheet, {
        props: {
          isOpen: true,
          item: mockItem,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      const deleteHandler = vi.fn();
      component.$on('delete', deleteHandler);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await fireEvent.click(deleteButton);

      expect(global.fetch).not.toHaveBeenCalled();
      expect(deleteHandler).not.toHaveBeenCalled();

      // Restore original confirm
      window.confirm = originalConfirm;
    });
  });

  describe('Error handling', () => {
    it('should display error message when save fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to save item' })
      });

      render(ItemSheet, {
        props: {
          isOpen: true,
          item: mockItem,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      const saveButton = screen.getByRole('button', { name: /^save$/i });
      await fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to save item/i)).toBeInTheDocument();
      });
    });

    it('should display error message when delete fails', async () => {
      const originalConfirm = window.confirm;
      window.confirm = vi.fn(() => true);

      (global.fetch as any).mockResolvedValueOnce({
        ok: false
      });

      render(ItemSheet, {
        props: {
          isOpen: true,
          item: mockItem,
          actorId: 'actor-123',
          gameId: 'game-123'
        }
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to delete item/i)).toBeInTheDocument();
      });

      window.confirm = originalConfirm;
    });
  });
});
