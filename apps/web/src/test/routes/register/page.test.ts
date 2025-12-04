import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import Page from '../../../routes/register/+page.svelte';

// Create mock stores before mocking the modules
const mockAuthStore = writable({ user: null, sessionId: null, loading: false, error: null });
const mockRegister = vi.fn().mockResolvedValue(true);

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

vi.mock('$lib/stores/auth', () => ({
  authStore: {
    subscribe: (...args: any[]) => mockAuthStore.subscribe(...args),
    register: (...args: any[]) => mockRegister(...args),
  },
}));

describe('Register page (register/+page.svelte)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: null });
    mockRegister.mockResolvedValue(true);
  });

  it('should render the register form', () => {
    render(Page);
    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/)).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('should render all input fields', () => {
    render(Page);

    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Username')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText(/^Password$/)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Confirm Password')).toHaveAttribute('type', 'password');
  });

  it('should render submit button', () => {
    render(Page);
    const submitButton = screen.getByRole('button', { name: /^register$/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should render login link', () => {
    render(Page);
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    const loginLink = screen.getByRole('link', { name: /login here/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('should update input values on change', async () => {
    render(Page);

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const usernameInput = screen.getByLabelText('Username') as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/^Password$/) as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText('Confirm Password') as HTMLInputElement;

    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.input(usernameInput, { target: { value: 'testuser' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.input(confirmPasswordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('password123');
    expect(confirmPasswordInput.value).toBe('password123');
  });

  it('should call authStore.register when form is submitted with valid data', async () => {
    render(Page);

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    await fireEvent.input(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    await fireEvent.input(screen.getByLabelText(/^Password$/), { target: { value: 'password123' } });
    await fireEvent.input(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });

    await fireEvent.click(screen.getByRole('button', { name: /^register$/i }));

    expect(mockRegister).toHaveBeenCalledWith({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    });
  });

  it('should navigate to home page on successful registration', async () => {
    const { goto } = await import('$app/navigation');
    mockRegister.mockResolvedValue(true);
    render(Page);

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    await fireEvent.input(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    await fireEvent.input(screen.getByLabelText(/^Password$/), { target: { value: 'password123' } });
    await fireEvent.input(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });

    await fireEvent.click(screen.getByRole('button', { name: /^register$/i }));

    await waitFor(() => {
      expect(goto).toHaveBeenCalledWith('/');
    });
  });

  it('should show error when passwords do not match', async () => {
    render(Page);

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    await fireEvent.input(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    await fireEvent.input(screen.getByLabelText(/^Password$/), { target: { value: 'password123' } });
    await fireEvent.input(screen.getByLabelText('Confirm Password'), { target: { value: 'different' } });

    await fireEvent.click(screen.getByRole('button', { name: /^register$/i }));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('should show error when password is too short', async () => {
    render(Page);

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    await fireEvent.input(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    await fireEvent.input(screen.getByLabelText(/^Password$/), { target: { value: 'short' } });
    await fireEvent.input(screen.getByLabelText('Confirm Password'), { target: { value: 'short' } });

    await fireEvent.click(screen.getByRole('button', { name: /^register$/i }));

    expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
  });

  it('should not call register when validation fails', async () => {
    render(Page);

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    await fireEvent.input(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    await fireEvent.input(screen.getByLabelText(/^Password$/), { target: { value: 'password123' } });
    await fireEvent.input(screen.getByLabelText('Confirm Password'), { target: { value: 'different' } });

    await fireEvent.click(screen.getByRole('button', { name: /^register$/i }));

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should display auth store error message', async () => {
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: 'Email already exists' });
    render(Page);

    expect(screen.getByText('Email already exists')).toBeInTheDocument();
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

    expect(screen.getByText('Registering...')).toBeInTheDocument();
  });

  it('should show normal text when not loading', () => {
    mockAuthStore.set({ user: null, sessionId: null, loading: false, error: null });
    render(Page);

    expect(screen.getByRole('button', { name: /^register$/i })).toBeInTheDocument();
    expect(screen.queryByText('Registering...')).not.toBeInTheDocument();
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

    await waitFor(() => {
      expect(goto).toHaveBeenCalledWith('/');
    });
  });

  it('should have proper input placeholders', () => {
    render(Page);

    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Choose a username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter a password (min 8 characters)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
  });

  it('should clear validation error on new submission', async () => {
    render(Page);

    // First submission with mismatched passwords
    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    await fireEvent.input(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    await fireEvent.input(screen.getByLabelText(/^Password$/), { target: { value: 'password123' } });
    await fireEvent.input(screen.getByLabelText('Confirm Password'), { target: { value: 'different' } });
    await fireEvent.click(screen.getByRole('button', { name: /^register$/i }));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();

    // Second submission with matching passwords
    await fireEvent.input(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    await fireEvent.click(screen.getByRole('button', { name: /^register$/i }));

    // Validation error should be cleared (or replaced with different error)
    await waitFor(() => {
      expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
    });
  });

  it('should prevent default form submission', async () => {
    const { container } = render(Page);

    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');

    form?.dispatchEvent(submitEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should have correct input IDs matching labels', () => {
    render(Page);

    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'email');
    expect(screen.getByLabelText('Username')).toHaveAttribute('id', 'username');
    expect(screen.getByLabelText(/^Password$/)).toHaveAttribute('id', 'password');
    expect(screen.getByLabelText('Confirm Password')).toHaveAttribute('id', 'confirmPassword');
  });

  it('should accept password of exactly 8 characters', async () => {
    mockRegister.mockResolvedValue(true);
    render(Page);

    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    await fireEvent.input(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    await fireEvent.input(screen.getByLabelText(/^Password$/), { target: { value: '12345678' } });
    await fireEvent.input(screen.getByLabelText('Confirm Password'), { target: { value: '12345678' } });

    await fireEvent.click(screen.getByRole('button', { name: /^register$/i }));

    expect(mockRegister).toHaveBeenCalled();
    expect(screen.queryByText('Password must be at least 8 characters long')).not.toBeInTheDocument();
  });
});
