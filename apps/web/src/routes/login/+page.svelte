<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let email = $state('');
  let password = $state('');

  $effect(() => {
    // Redirect if already logged in
    if ($authStore.user) {
      goto('/');
    }
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();

    const success = await authStore.login({ email, password });

    if (success) {
      goto('/');
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <h1>Login</h1>

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
        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          required
          placeholder="Enter your password"
        />
      </div>

      {#if $authStore.error}
        <div class="error-message">
          {$authStore.error}
        </div>
      {/if}

      <button type="submit" disabled={$authStore.loading}>
        {$authStore.loading ? 'Logging in...' : 'Login'}
      </button>
    </form>

    <div class="register-link">
      Don't have an account? <a href="/register">Register here</a>
    </div>
  </div>
</div>

<style>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .login-card {
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

  .register-link {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.875rem;
    color: #666;
  }

  .register-link a {
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
  }

  .register-link a:hover {
    text-decoration: underline;
  }
</style>
