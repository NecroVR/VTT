import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import Page from '../../routes/+page.svelte';

// Create mock stores before mocking the modules
const mockAuthStore = writable({ user: null, sessionId: null, loading: false, error: null });
const mockCheckSession = vi.fn().mockResolvedValue(false);

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

vi.mock('$lib/stores/auth', () => ({
  authStore: {
    subscribe: (...args: any[]) => mockAuthStore.subscribe(...args),
    checkSession: (...args: any[]) => mockCheckSession(...args),
  },
}));

describe('Home page (+page.svelte)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: null });
  });

  it('should render the page title', () => {
    render(Page);
    expect(screen.getByText('VTT')).toBeInTheDocument();
  });

  it('should render the subtitle', () => {
    render(Page);
    expect(screen.getByText('Virtual Tabletop for RPG Sessions')).toBeInTheDocument();
  });

  it('should show login and register buttons when not authenticated', () => {
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: null });
    render(Page);

    expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^register$/i })).toBeInTheDocument();
  });

  it('should show welcome message when authenticated', () => {
    mockAuthStore.set({
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      sessionId: 'session123',
      loading: false,
      error: null,
    });
    render(Page);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('should render My Games card', () => {
    render(Page);
    expect(screen.getByText('My Games')).toBeInTheDocument();
    expect(screen.getByText('View and manage your game sessions')).toBeInTheDocument();
  });

  it('should render Create New Game card', () => {
    render(Page);
    expect(screen.getByText('Create New Game')).toBeInTheDocument();
    expect(screen.getByText('Start a new game session and invite your players')).toBeInTheDocument();
  });

  it('should render Join Game card', () => {
    render(Page);
    expect(screen.getByRole('heading', { name: 'Join Game' })).toBeInTheDocument();
    expect(screen.getByText('Enter a game ID to join an existing session')).toBeInTheDocument();
  });

  it('should navigate to login when login button clicked', async () => {
    const { goto } = await import('$app/navigation');
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: null });
    render(Page);

    const loginButton = screen.getByRole('button', { name: /^login$/i });
    await fireEvent.click(loginButton);

    expect(goto).toHaveBeenCalledWith('/login');
  });

  it('should navigate to register when register button clicked', async () => {
    const { goto } = await import('$app/navigation');
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: null });
    render(Page);

    const registerButton = screen.getByRole('button', { name: /^register$/i });
    await fireEvent.click(registerButton);

    expect(goto).toHaveBeenCalledWith('/register');
  });

  it('should navigate to games list when View My Games clicked', async () => {
    const { goto } = await import('$app/navigation');
    mockAuthStore.set({
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      sessionId: 'session123',
      loading: false,
      error: null,
    });
    render(Page);

    const viewGamesButton = screen.getByRole('button', { name: /view my games/i });
    await fireEvent.click(viewGamesButton);

    expect(goto).toHaveBeenCalledWith('/games');
  });

  it('should navigate to games list when View My Games clicked without auth', async () => {
    const { goto } = await import('$app/navigation');
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: null });
    render(Page);

    const viewGamesButton = screen.getByRole('button', { name: /view my games/i });
    await fireEvent.click(viewGamesButton);

    expect(goto).toHaveBeenCalledWith('/login');
  });

  it('should create new game when authenticated', async () => {
    const { goto } = await import('$app/navigation');
    mockAuthStore.set({
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      sessionId: 'session123',
      loading: false,
      error: null,
    });
    render(Page);

    const createGameButton = screen.getByRole('button', { name: /create game/i });
    await fireEvent.click(createGameButton);

    expect(goto).toHaveBeenCalledWith(expect.stringMatching(/^\/game\//));
  });

  it('should redirect to login when creating game without auth', async () => {
    const { goto } = await import('$app/navigation');
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: null });
    render(Page);

    const createGameButton = screen.getByRole('button', { name: /create game/i });
    await fireEvent.click(createGameButton);

    expect(goto).toHaveBeenCalledWith('/login');
  });

  it('should enable join game button when game ID is entered', async () => {
    render(Page);

    const input = screen.getByPlaceholderText('Enter game ID');
    const joinButton = screen.getByRole('button', { name: /join game/i });

    expect(joinButton).toBeDisabled();

    await fireEvent.input(input, { target: { value: 'abc123' } });

    expect(joinButton).not.toBeDisabled();
  });

  it('should join game when join button clicked with game ID', async () => {
    const { goto } = await import('$app/navigation');
    mockAuthStore.set({
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      sessionId: 'session123',
      loading: false,
      error: null,
    });
    render(Page);

    const input = screen.getByPlaceholderText('Enter game ID');
    await fireEvent.input(input, { target: { value: 'abc123' } });

    const joinButton = screen.getByRole('button', { name: /join game/i });
    await fireEvent.click(joinButton);

    expect(goto).toHaveBeenCalledWith('/game/abc123');
  });

  it('should redirect to login when joining game without auth', async () => {
    const { goto } = await import('$app/navigation');
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: null });
    render(Page);

    const input = screen.getByPlaceholderText('Enter game ID');
    await fireEvent.input(input, { target: { value: 'abc123' } });

    const joinButton = screen.getByRole('button', { name: /join game/i });
    await fireEvent.click(joinButton);

    expect(goto).toHaveBeenCalledWith('/login');
  });

  it('should join game when pressing Enter in game ID input', async () => {
    const { goto } = await import('$app/navigation');
    mockAuthStore.set({
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      sessionId: 'session123',
      loading: false,
      error: null,
    });
    render(Page);

    const input = screen.getByPlaceholderText('Enter game ID');
    await fireEvent.input(input, { target: { value: 'abc123' } });
    await fireEvent.keyDown(input, { key: 'Enter' });

    expect(goto).toHaveBeenCalledWith('/game/abc123');
  });

  it('should not join game with empty game ID', async () => {
    const { goto } = await import('$app/navigation');
    mockAuthStore.set({
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      sessionId: 'session123',
      loading: false,
      error: null,
    });
    render(Page);

    const input = screen.getByPlaceholderText('Enter game ID');
    await fireEvent.input(input, { target: { value: '   ' } });

    const joinButton = screen.getByRole('button', { name: /join game/i });
    await fireEvent.click(joinButton);

    expect(goto).not.toHaveBeenCalledWith(expect.stringMatching(/^\/game\//));
  });

  it('should call checkSession on mount', () => {
    render(Page);

    expect(mockCheckSession).toHaveBeenCalled();
  });
});
