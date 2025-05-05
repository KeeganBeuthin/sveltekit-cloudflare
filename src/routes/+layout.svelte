<script>
  import { page } from '$app/stores';
</script>

<nav>
  <div class="nav-container">
    <a href="/" class="home-link">Home</a>
    <div class="auth-links">
      {#if $page.data.isAuthenticated}
        <span>Welcome, {$page.data.user?.given_name || $page.data.user?.email || 'User'}</span>
        <a href="/dashboard">Dashboard</a>
        <a href="/api/auth/logout">Sign out</a>
      {:else}
        <a href="/api/auth/login">Sign in</a>
        <a href="/api/auth/register">Sign up</a>
      {/if}
    </div>
  </div>
</nav>

<main>
  <slot />
</main>

<style>
  nav {
    background-color: #f9fafb;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .nav-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .home-link {
    font-weight: bold;
    text-decoration: none;
    color: #111827;
  }
  
  .auth-links {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  a {
    text-decoration: none;
    color: #4f46e5;
  }
  
  a:hover {
    text-decoration: underline;
  }
  
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
</style> 