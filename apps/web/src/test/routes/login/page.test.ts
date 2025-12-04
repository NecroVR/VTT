import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import Page from '../../../routes/login/+page.svelte';

// Create mock stores before mocking the modules
const mockAuthStore = writable({ user: null, sessionId: null, loading: false, error: null });
const mockLogin = vi.fn().mockResolvedValue(true);

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

vi.mock('$lib/stores/auth', () => ({
  authStore: {
    subscribe: (...args: any[]) => mockAuthStore.subscribe(...args),
    login: (...args: any[]) => mockLogin(...args),
  },
}));

describe('Login page (login/+page.svelte)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: null });
    mockLogin.mockResolvedValue(true);
  });

  it('should render the login form', () => {
    render(Page);
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('should render email input field', () => {
    render(Page);
    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');
  });

  it('should render password input field', () => {
    render(Page);
    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('required');
  });

  it('should render submit button', () => {
    render(Page);
    const submitButton = screen.getByRole('button', { name: /^login$/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should render register link', () => {
    render(Page);
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    const registerLink = screen.getByRole('link', { name: /register here/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('should update email input value on change', async () => {
    render(Page);
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });

    expect(emailInput.value).toBe('test@example.com');
  });

  it('should update password input value on change', async () => {
    render(Page);
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

    await fireEvent.input(passwordInput, { target: { value: 'password123' } });

    expect(passwordInput.value).toBe('password123');
  });

  it('should call authStore.login when form is submitted', async () => {
    render(Page);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /^login$/i });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.click(submitButton);

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should navigate to home page on successful login', async () => {
    const { goto } = await import('$app/navigation');
    mockLogin.mockResolvedValue(true);
    render(Page);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /^login$/i });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(goto).toHaveBeenCalledWith('/');
    });
  });

  it('should not navigate on failed login', async () => {
    const { goto } = await import('$app/navigation');
    mockLogin.mockResolvedValue(false);
    render(Page);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /^login$/i });

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'wrongpassword' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });

    expect(goto).not.toHaveBeenCalledWith('/');
  });

  it('should display error message when login fails', async () => {
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: 'Invalid credentials' });
    render(Page);

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('should not display error message when no error', () => {
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: null });
    render(Page);

    expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
  });

  it('should disable submit button when loading', () => {
    mockAuthStore.set({ user: null, sessionId: null, loading: true, error: null });
    render(Page);

    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
  });

  it('should show loading text when loading', () => {
    mockAuthStore.set({ user: null, sessionId: null, loading: true, error: null });
    render(Page);

    expect(screen.getByText('Logging in...')).toBeInTheDocument();
  });

  it('should show normal text when not loading', () => {
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: null });
    render(Page);

    expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument();
    expect(screen.queryByText('Logging in...')).not.toBeInTheDocument();
  });

  it('should redirect to home if already logged in', async () => {
    const { goto } = await import('$app/navigation');
    mockAuthStore.set({
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
      sessionId: 'session123',
      loading: false,
      error: null,
    });

    render(Page);

    // The $effect should trigger goto
    await waitFor(() => {
      expect(goto).toHaveBeenCalledWith('/');
    });
  });

  it('should prevent default form submission', async () => {
    mockLogin.mockResolvedValue(true);
    const { container } = render(Page);

    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');

    form?.dispatchEvent(submitEvent);

    // Form submission should be prevented to handle it with JavaScript
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should have proper input placeholders', () => {
    render(Page);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  it('should have correct input IDs matching labels', () => {
    render(Page);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');

    expect(emailInput).toHaveAttribute('id', 'email');
    expect(passwordInput).toHaveAttribute('id', 'password');
  });
});
