import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ChatMessage from './ChatMessage.svelte';

describe('ChatMessage', () => {
  it('should render username, content, and timestamp', () => {
    const timestamp = new Date('2024-01-15T14:30:00').getTime();

    render(ChatMessage, {
      props: {
        username: 'TestUser',
        content: 'Hello, world!',
        timestamp,
      },
    });

    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    expect(screen.getByText('14:30')).toBeInTheDocument();
  });

  it('should format timestamp with leading zeros', () => {
    const timestamp = new Date('2024-01-15T09:05:00').getTime();

    render(ChatMessage, {
      props: {
        username: 'User',
        content: 'Test message',
        timestamp,
      },
    });

    expect(screen.getByText('09:05')).toBeInTheDocument();
  });

  it('should display long messages correctly', () => {
    const longMessage = 'This is a very long message that should wrap correctly in the chat panel without breaking the layout or causing any issues with the display.';

    render(ChatMessage, {
      props: {
        username: 'Verbose',
        content: longMessage,
        timestamp: Date.now(),
      },
    });

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('should display messages with special characters', () => {
    const specialContent = 'Test with <special> & "characters" and emoji 🎲';

    render(ChatMessage, {
      props: {
        username: 'Special',
        content: specialContent,
        timestamp: Date.now(),
      },
    });

    expect(screen.getByText(/Test with/i)).toBeInTheDocument();
  });
});
