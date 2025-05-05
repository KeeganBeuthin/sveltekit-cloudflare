<script>
	// Remove the client import - we don't need it for links
</script>

<div class="login-page">
	<h1>Login to your account</h1>
	<a href="/api/auth/login" class="button">Sign in</a>
	<a href="/api/auth/register" class="button">Sign up</a>
</div>

<style>
	.login-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 50vh;
		gap: 1rem;
	}
	
	.button {
		padding: 0.5rem 1rem;
		background-color: #4f46e5;
		color: white;
		text-decoration: none;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 1rem;
		display: inline-block;
	}
	
	.button:hover {
		background-color: #4338ca;
	}
</style> 