import { handleAuth } from '@kinde-oss/kinde-auth-sveltekit/server';
import { sequence } from '@sveltejs/kit/hooks';
import { env } from '$env/dynamic/private';

// Configure with your Kinde application details
export const handle = sequence(
	handleAuth({
		clientId: env.KINDE_CLIENT_ID,
		clientSecret: env.KINDE_CLIENT_SECRET,
		issuerBaseURL: env.KINDE_ISSUER_URL,
		domain: env.KINDE_DOMAIN,
		redirectURL: env.KINDE_REDIRECT_URL,
		logoutRedirectURL: env.KINDE_LOGOUT_REDIRECT_URL
	})
); 