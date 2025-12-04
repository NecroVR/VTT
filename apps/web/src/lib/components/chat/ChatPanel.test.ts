import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ChatPanel from './ChatPanel.svelte';
import { websocket } from '$lib/stores/websocket';
import type { ChatMessagePayload, DiceResultPayload } from '@vtt/shared';

// Mock the websocket store
vi.mock('$lib/stores/websocket', () => ({
  websocket: {
    onChatMessage: vi.fn(),
    onDiceResult: vi.fn(),
    sendChatMessage: vi.fn(),
    sendDiceRoll: vi.fn(),
  },
}));

describe('ChatPanel', () => {
  let chatMessageHandler: ((payload: ChatMessagePayload) => void) | null = null;
  let diceResultHandler: ((payload: DiceResultPayload) => void) | null = null;

  beforeEach(() => {
    // Setup mock handlers
    vi.mocked(websocket.onChatMessage).mockImplementation((handler) => {
      chatMessageHandler = handler;
      return () => {
        chatMessageHandler = null;
      };
    });

    vi.mocked(websocket.onDiceResult).mockImplementation((handler) => {
      diceResultHandler = handler;
      return () => {
        diceResultHandler = null;
      };
    });

    vi.mocked(websocket.sendChatMessage).mockClear();
    vi.mocked(websocket.sendDiceRoll).mockClear();
  });

  afterEach(() => {
    chatMessageHandler = null;
    diceResultHandler = null;
  });

  it('should render empty state with no messages', () => {
    render(ChatPanel, { props: { gameId: 'test-game' } });

    expect(screen.getByText(/No messages yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Tip: Use/i)).toBeInTheDocument();
  });

  it('should display chat messages when received', async () => {
    render(ChatPanel, { props: { gameId: 'test-game' } });

    // Simulate receiving a chat message
    const chatPayload: ChatMessagePayload = {
      text: 'Hello, world!',
      userId: 'user-1',
      username: 'TestUser',
    };

    if (chatMessageHandler) {
      chatMessageHandler(chatPayload);
    }

    await waitFor(() => {
      expect(screen.getByText('TestUser')).toBeInTheDocument();
      expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    });
  });

  it('should display dice roll results when received', async () => {
    render(ChatPanel, { props: { gameId: 'test-game' } });

    // Simulate receiving a dice roll result
    const dicePayload: DiceResultPayload = {
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
      username: 'DiceRoller',
    };

    if (diceResultHandler) {
      diceResultHandler(dicePayload);
    }

    await waitFor(() => {
      expect(screen.getByText('DiceRoller')).toBeInTheDocument();
      expect(screen.getByText('2d6+3')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });
  });

  it('should send chat message when user types and presses enter', async () => {
    render(ChatPanel, { props: { gameId: 'test-game' } });

    const input = screen.getByPlaceholderText(/Type a message/i);
    await fireEvent.input(input, { target: { value: 'Test message' } });

    const sendButton = screen.getByText('Send');
    await fireEvent.click(sendButton);

    expect(websocket.sendChatMessage).toHaveBeenCalledWith('Test message');
  });

  it('should send dice roll when user types /roll command', async () => {
    render(ChatPanel, { props: { gameId: 'test-game' } });

    const input = screen.getByPlaceholderText(/Type a message/i);
    await fireEvent.input(input, { target: { value: '/roll 2d6+3' } });

    const sendButton = screen.getByText('Send');
    await fireEvent.click(sendButton);

    expect(websocket.sendDiceRoll).toHaveBeenCalledWith({ notation: '2d6+3' });
    expect(websocket.sendChatMessage).not.toHaveBeenCalled();
  });

  it('should clear input after sending message', async () => {
    render(ChatPanel, { props: { gameId: 'test-game' } });

    const input = screen.getByPlaceholderText(/Type a message/i) as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'Test message' } });

    const sendButton = screen.getByText('Send');
    await fireEvent.click(sendButton);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should handle dice roll with label', async () => {
    render(ChatPanel, { props: { gameId: 'test-game' } });

    const dicePayload: DiceResultPayload = {
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

    if (diceResultHandler) {
      diceResultHandler(dicePayload);
    }

    await waitFor(() => {
      expect(screen.getByText('Attack Roll')).toBeInTheDocument();
      expect(screen.getByText('1d20+5')).toBeInTheDocument();
    });
  });

  it('should handle dice roll with keep highest', async () => {
    render(ChatPanel, { props: { gameId: 'test-game' } });

    const dicePayload: DiceResultPayload = {
      notation: '4d6kh3',
      rolls: [
        {
          dice: '4d6kh3',
          results: [3, 5, 2, 6],
          kept: [1, 2, 3], // Keep indices 1, 2, 3 (values 5, 2, 6)
          subtotal: 13,
        },
      ],
      modifiers: 0,
      total: 13,
      breakdown: '4d6kh3 (~~3~~, 5, 2, 6) = 13',
      userId: 'user-1',
      username: 'Player',
    };

    if (diceResultHandler) {
      diceResultHandler(dicePayload);
    }

    await waitFor(() => {
      expect(screen.getAllByText('4d6kh3').length).toBeGreaterThan(0);
      expect(screen.getByText(/Total:/)).toBeInTheDocument();
    });
  });

  it('should display multiple messages in order', async () => {
    render(ChatPanel, { props: { gameId: 'test-game' } });

    // Send first message
    const chatPayload1: ChatMessagePayload = {
      text: 'First message',
      userId: 'user-1',
      username: 'User1',
    };

    if (chatMessageHandler) {
      chatMessageHandler(chatPayload1);
    }

    await waitFor(() => {
      expect(screen.getByText('First message')).toBeInTheDocument();
    });

    // Send second message
    const chatPayload2: ChatMessagePayload = {
      text: 'Second message',
      userId: 'user-2',
      username: 'User2',
    };

    if (chatMessageHandler) {
      chatMessageHandler(chatPayload2);
    }

    await waitFor(() => {
      expect(screen.getByText('Second message')).toBeInTheDocument();
      expect(screen.getByText('User1')).toBeInTheDocument();
      expect(screen.getByText('User2')).toBeInTheDocument();
    });
  });

  it('should not send empty messages', async () => {
    render(ChatPanel, { props: { gameId: 'test-game' } });

    const input = screen.getByPlaceholderText(/Type a message/i);
    await fireEvent.input(input, { target: { value: '   ' } });

    const sendButton = screen.getByText('Send');
    expect(sendButton).toBeDisabled();

    await fireEvent.click(sendButton);

    expect(websocket.sendChatMessage).not.toHaveBeenCalled();
    expect(websocket.sendDiceRoll).not.toHaveBeenCalled();
  });

  it('should unsubscribe from websocket events on destroy', () => {
    const unsubscribeChatMessage = vi.fn();
    const unsubscribeDiceResult = vi.fn();

    vi.mocked(websocket.onChatMessage).mockReturnValue(unsubscribeChatMessage);
    vi.mocked(websocket.onDiceResult).mockReturnValue(unsubscribeDiceResult);

    const { unmount } = render(ChatPanel, { props: { gameId: 'test-game' } });

    expect(websocket.onChatMessage).toHaveBeenCalled();
    expect(websocket.onDiceResult).toHaveBeenCalled();

    unmount();

    expect(unsubscribeChatMessage).toHaveBeenCalled();
    expect(unsubscribeDiceResult).toHaveBeenCalled();
  });
});
