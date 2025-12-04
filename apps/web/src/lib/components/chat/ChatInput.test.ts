import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ChatInput from './ChatInput.svelte';

describe('ChatInput', () => {
  it('should render input field and send button', () => {
    const onSend = vi.fn();

    render(ChatInput, {
      props: { onSend },
    });

    expect(screen.getByPlaceholderText(/Type a message/i)).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  it('should call onSend when send button is clicked', async () => {
    const onSend = vi.fn();

    render(ChatInput, {
      props: { onSend },
    });

    const input = screen.getByPlaceholderText(/Type a message/i);
    const sendButton = screen.getByText('Send');

    await fireEvent.input(input, { target: { value: 'Test message' } });
    await fireEvent.click(sendButton);

    expect(onSend).toHaveBeenCalledWith('Test message');
  });

  it('should call onSend when Enter key is pressed', async () => {
    const onSend = vi.fn();

    render(ChatInput, {
      props: { onSend },
    });

    const input = screen.getByPlaceholderText(/Type a message/i);

    await fireEvent.input(input, { target: { value: 'Test message' } });
    await fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('Test message');
  });

  it('should not call onSend when Shift+Enter is pressed', async () => {
    const onSend = vi.fn();

    render(ChatInput, {
      props: { onSend },
    });

    const input = screen.getByPlaceholderText(/Type a message/i);

    await fireEvent.input(input, { target: { value: 'Test message' } });
    await fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('should clear input after sending', async () => {
    const onSend = vi.fn();

    render(ChatInput, {
      props: { onSend },
    });

    const input = screen.getByPlaceholderText(/Type a message/i) as HTMLInputElement;
    const sendButton = screen.getByText('Send');

    await fireEvent.input(input, { target: { value: 'Test message' } });
    await fireEvent.click(sendButton);

    expect(input.value).toBe('');
  });

  it('should not send empty messages', async () => {
    const onSend = vi.fn();

    render(ChatInput, {
      props: { onSend },
    });

    const input = screen.getByPlaceholderText(/Type a message/i);
    const sendButton = screen.getByText('Send');

    await fireEvent.input(input, { target: { value: '' } });
    await fireEvent.click(sendButton);

    expect(onSend).not.toHaveBeenCalled();
  });

  it('should not send messages with only whitespace', async () => {
    const onSend = vi.fn();

    render(ChatInput, {
      props: { onSend },
    });

    const input = screen.getByPlaceholderText(/Type a message/i);
    const sendButton = screen.getByText('Send');

    await fireEvent.input(input, { target: { value: '   ' } });
    await fireEvent.click(sendButton);

    expect(onSend).not.toHaveBeenCalled();
  });

  it('should trim whitespace from messages', async () => {
    const onSend = vi.fn();

    render(ChatInput, {
      props: { onSend },
    });

    const input = screen.getByPlaceholderText(/Type a message/i);
    const sendButton = screen.getByText('Send');

    await fireEvent.input(input, { target: { value: '  Test message  ' } });
    await fireEvent.click(sendButton);

    expect(onSend).toHaveBeenCalledWith('Test message');
  });

  it('should disable send button when input is empty', async () => {
    const onSend = vi.fn();

    render(ChatInput, {
      props: { onSend },
    });

    const sendButton = screen.getByText('Send');

    expect(sendButton).toBeDisabled();

    const input = screen.getByPlaceholderText(/Type a message/i);
    await fireEvent.input(input, { target: { value: 'Test' } });

    expect(sendButton).not.toBeDisabled();

    await fireEvent.input(input, { target: { value: '' } });

    expect(sendButton).toBeDisabled();
  });

  it('should handle multiple messages in sequence', async () => {
    const onSend = vi.fn();

    render(ChatInput, {
      props: { onSend },
    });

    const input = screen.getByPlaceholderText(/Type a message/i);
    const sendButton = screen.getByText('Send');

    // First message
    await fireEvent.input(input, { target: { value: 'First message' } });
    await fireEvent.click(sendButton);

    expect(onSend).toHaveBeenCalledWith('First message');
    expect(onSend).toHaveBeenCalledTimes(1);

    // Second message
    await fireEvent.input(input, { target: { value: 'Second message' } });
    await fireEvent.click(sendButton);

    expect(onSend).toHaveBeenCalledWith('Second message');
    expect(onSend).toHaveBeenCalledTimes(2);
  });

  it('should handle dice roll commands', async () => {
    const onSend = vi.fn();

    render(ChatInput, {
      props: { onSend },
    });

    const input = screen.getByPlaceholderText(/Type a message/i);
    const sendButton = screen.getByText('Send');

    await fireEvent.input(input, { target: { value: '/roll 2d6+3' } });
    await fireEvent.click(sendButton);

    expect(onSend).toHaveBeenCalledWith('/roll 2d6+3');
  });

  it('should handle special characters in messages', async () => {
    const onSend = vi.fn();

    render(ChatInput, {
      props: { onSend },
    });

    const input = screen.getByPlaceholderText(/Type a message/i);
    const sendButton = screen.getByText('Send');

    const specialMessage = 'Test <special> & "characters" 🎲';
    await fireEvent.input(input, { target: { value: specialMessage } });
    await fireEvent.click(sendButton);

    expect(onSend).toHaveBeenCalledWith(specialMessage);
  });
});
