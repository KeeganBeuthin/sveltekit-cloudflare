<script>
  import { page } from '$app/stores';
</script>

<div class="dashboard">
  <h1>Dashboard</h1>
  
  {#if $page.data.user}
    <div class="user-info">
      <h2>User Information</h2>
      <p>ID: {$page.data.user.id}</p>
      <p>Email: {$page.data.user.email}</p>
      <p>Name: {$page.data.user.given_name} {$page.data.user.family_name}</p>
    </div>
  {:else}
    <p>Loading user information...</p>
  {/if}

  <a href="/api/auth/login">Login</a>
<a href="/api/auth/register">Register</a>
<a href="/api/auth/logout">Logout</a>

  
  <div class="logout">
    <a href="/api/auth/logout">Sign out</a>
  </div>
</div>

<style>
  .dashboard {
    padding: 1rem;
  }
  
  .user-info {
    background-color: #f3f4f6;
    padding: 1rem;
    border-radius: 0.5rem;
    margin: 1rem 0;
  }
  
  .logout a {
    padding: 0.5rem 1rem;
    background-color: #ef4444;
    color: white;
    text-decoration: none;
    border-radius: 0.25rem;
    display: inline-block;
  }
  
  .logout a:hover {
    background-color: #dc2626;
  }
</style> 