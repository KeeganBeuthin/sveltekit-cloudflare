<script>
	import { kindeClient } from '@kinde-oss/kinde-auth-sveltekit/client';
</script>

<div class="login-page">
	<h1>Login to your account</h1>
	<button on:click={() => kindeClient.login()}>Sign in</button>
	<button on:click={() => kindeClient.register()}>Sign up</button>
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
	
	button {
		padding: 0.5rem 1rem;
		background-color: #4f46e5;
		color: white;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 1rem;
	}
	
	button:hover {
		background-color: #4338ca;
	}
</style> 