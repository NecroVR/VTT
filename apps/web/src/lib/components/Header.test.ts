import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import Header from './Header.svelte';

// Create mock stores before mocking the modules
const mockAuthStore = writable({ user: null, sessionId: null, loading: false, error: null });
const mockLogout = vi.fn().mockResolvedValue(undefined);

// Mock navigation and stores
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

vi.mock('$lib/stores/auth', () => ({
  authStore: {
    subscribe: (...args: any[]) => mockAuthStore.subscribe(...args),
    logout: (...args: any[]) => mockLogout(...args),
  },
}));

vi.mock('$app/stores', () => ({
  page: writable({ url: new URL('http://localhost:5173/'), params: {}, route: { id: null }, status: 200, error: null, data: {}, form: undefined, state: {} }),
  navigating: writable(null),
  updated: {
    subscribe: writable(false).subscribe,
    check: async () => false,
  },
}));

describe('Header component', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: null });
  });

  it('should render the header element', () => {
    render(Header);
    const header = document.querySelector('header');
    expect(header).toBeInTheDocument();
  });

  it('should render VTT logo', () => {
    render(Header);
    expect(screen.getByText('VTT')).toBeInTheDocument();
  });

  it('should show login and register buttons when not authenticated', () => {
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: null });
    render(Header);

    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('should show username and logout button when authenticated', () => {
    mockAuthStore.set({
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      sessionId: 'session123',
      loading: false,
      error: null,
    });
    render(Header);

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('should navigate to home when logo is clicked', async () => {
    const { goto } = await import('$app/navigation');
    render(Header);

    const logoButton = screen.getByRole('button', { name: /vtt/i });
    await fireEvent.click(logoButton);

    expect(goto).toHaveBeenCalledWith('/');
  });

  it('should navigate to login page when login button is clicked', async () => {
    const { goto } = await import('$app/navigation');
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: null });
    render(Header);

    const loginButton = screen.getByRole('button', { name: /login/i });
    await fireEvent.click(loginButton);

    expect(goto).toHaveBeenCalledWith('/login');
  });

  it('should navigate to register page when register button is clicked', async () => {
    const { goto } = await import('$app/navigation');
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: null });
    render(Header);

    const registerButton = screen.getByRole('button', { name: /register/i });
    await fireEvent.click(registerButton);

    expect(goto).toHaveBeenCalledWith('/register');
  });

  it('should call logout and navigate home when logout button is clicked', async () => {
    const { goto } = await import('$app/navigation');
    mockAuthStore.set({
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      sessionId: 'session123',
      loading: false,
      error: null,
    });
    render(Header);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    await waitFor(() => {
      expect(goto).toHaveBeenCalledWith('/');
    });
  });

  it('should render without errors when not on auth page', () => {
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: null });
    render(Header);
    expect(screen.getByText('VTT')).toBeInTheDocument();
  });

  it('should render navigation', () => {
    render(Header);
    const nav = document.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });
});
