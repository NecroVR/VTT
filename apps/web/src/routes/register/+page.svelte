<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  let email = $state('');
  let username = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let validationError = $state('');

  $effect(() => {
    // Redirect if already logged in
    if ($authStore.user) {
      goto('/');
    }
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();
    validationError = '';

    // Validate passwords match
    if (password !== confirmPassword) {
      validationError = 'Passwords do not match';
      return;
    }

    // Validate password length
    if (password.length < 8) {
      validationError = 'Password must be at least 8 characters long';
      return;
    }

    const success = await authStore.register({ email, username, password });

    if (success) {
      goto('/');
    }
  }
</script>

<div class="register-container">
  <div class="register-card">
    <h1>Register</h1>

    <form onsubmit={handleSubmit}>
      <div class="form-group">
        <label for="email">Email</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          required
          placeholder="Enter your email"
        />
      </div>

      <div class="form-group">
        <label for="username">Username</label>
        <input
          type="text"
          id="username"
          bind:value={username}
          required
          placeholder="Choose a username"
        />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          required
          placeholder="Enter a password (min 8 characters)"
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          bind:value={confirmPassword}
          required
          placeholder="Confirm your password"
        />
      </div>

      {#if validationError}
        <div class="error-message">
          {validationError}
        </div>
      {/if}

      {#if $authStore.error}
        <div class="error-message">
          {$authStore.error}
        </div>
      {/if}

      <button type="submit" disabled={$authStore.loading}>
        {$authStore.loading ? 'Registering...' : 'Register'}
      </button>
    </form>

    <div class="login-link">
      Already have an account? <a href="/login">Login here</a>
    </div>
  </div>
</div>

<style>
  .register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .register-card {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
  }

  h1 {
    margin: 0 0 1.5rem 0;
    font-size: 1.75rem;
    text-align: center;
    color: #333;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #555;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: #667eea;
  }

  button {
    width: 100%;
    padding: 0.75rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  button:hover:not(:disabled) {
    background: #5568d3;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .error-message {
    padding: 0.75rem;
    margin-bottom: 1rem;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #c33;
    font-size: 0.875rem;
  }

  .login-link {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.875rem;
    color: #666;
  }

  .login-link a {
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
  }

  .login-link a:hover {
    text-decoration: underline;
  }
</style>
