import { json, redirect } from '@sveltejs/kit';
import type { RequestEvent } from "@sveltejs/kit";
import { 
  generateRandomString,
  generateAuthUrl,
  exchangeAuthCode,
  frameworkSettings,
  getActiveStorage,
  getInsecureStorage,
  StorageKeys,
  IssuerRouteTypes,
  Scopes,
  type LoginOptions
} from '@kinde/js-utils';
import { initializeKindeAuth } from '$lib/kindeAuth';
import { KINDE_ISSUER_URL, KINDE_CLIENT_ID, KINDE_CLIENT_SECRET, KINDE_REDIRECT_URL, KINDE_POST_LOGIN_REDIRECT_URL, KINDE_POST_LOGOUT_REDIRECT_URL, KINDE_AUTH_WITH_PKCE, KINDE_DEBUG } from '$env/static/private';
// Get environment variables
const SECRET = KINDE_CLIENT_SECRET;
const ISSUER_URL = KINDE_ISSUER_URL;
const CLIENT_ID = KINDE_CLIENT_ID;
const REDIRECT_URL = KINDE_REDIRECT_URL;
const POST_LOGIN_REDIRECT_URL = KINDE_POST_LOGIN_REDIRECT_URL;
const POST_LOGOUT_REDIRECT_URL = KINDE_POST_LOGOUT_REDIRECT_URL;
const SCOPE = 'openid profile email offline'
const USE_PKCE = KINDE_AUTH_WITH_PKCE === 'true';

// Configure js-utils framework settings
frameworkSettings.framework = 'sveltekit';
frameworkSettings.frameworkVersion = '2.16.0';
frameworkSettings.sdkVersion = '1.0.0';

function getConfig(event: RequestEvent) {
  const platform = event.platform as any;
  const env = platform?.env;
  
  return {
    issuerUrl: env?.KINDE_ISSUER_URL,
    clientId: env?.KINDE_CLIENT_ID,
    clientSecret: env?.KINDE_CLIENT_SECRET,
    redirectURL: env?.KINDE_REDIRECT_URL,
    postLoginRedirectURL: env?.KINDE_POST_LOGIN_REDIRECT_URL,
    postLogoutRedirectURL: env?.KINDE_POST_LOGOUT_REDIRECT_URL,
    scope: 'openid profile email offline',
    usePkce: env?.KINDE_AUTH_WITH_PKCE === 'true',
    debug: env?.KINDE_DEBUG === 'true'
  };
}

export async function GET(event: RequestEvent) {
  // CRITICAL: Initialize storage for EVERY request (login AND callback)
  if (!initializeKindeAuth(event)) {
    return json({ error: 'Storage initialization failed' }, { status: 500 });
  }
  
  const config = getConfig(event);
  
  if (!config.issuerUrl || !config.clientId || !config.clientSecret || !config.redirectURL) {
    return json({ error: 'Missing required Kinde configuration' }, { status: 500 });
  }
  
  const url = new URL(event.request.url);
  const path = url.pathname.split('/').pop() || '';
  
  if (config.debug) {
    console.log(`=== ${path.toUpperCase()} REQUEST ===`);
    console.log('URL:', url.toString());
    
    // Debug cookies for every request
    const cookies = event.request.headers.get('cookie');
    console.log('Request cookies:', cookies ? 'present' : 'none');
  }
  
  try {
    switch (path) {
      case 'login':
        return handleAuth(event, config, false);
      case 'register':
        return handleAuth(event, config, true);
      case 'kinde_callback':
        return handleCallback(event, config);
      case 'logout':
        return handleLogout(event, config);
      default:
        return json({ error: 'Unknown auth endpoint' }, { status: 404 });
    }
  } catch (error) {
    console.error('Auth handler error:', error);
    return json({ error: 'Authentication error' }, { status: 500 });
  }
}

async function handleAuth(
  event: RequestEvent, 
  config: ReturnType<typeof getConfig>,
  isRegister: boolean
) {
  const url = new URL(event.request.url);
  const orgCode = url.searchParams.get('org_code');
  
  const loginOptions: LoginOptions = {
    clientId: config.clientId,
    redirectURL: config.redirectURL,
    scope: [Scopes.openid, Scopes.profile, Scopes.email, Scopes.offline_access],
    ...(orgCode && { orgCode })
  };
  
  const authResult = await generateAuthUrl(
    config.issuerUrl,
    isRegister ? IssuerRouteTypes.register : IssuerRouteTypes.login,
    loginOptions
  );
  
  if (config.debug) {
    console.log('Generated auth URL via js-utils, state:', authResult.state);
    
    // CHECK COOKIE STORAGE (insecure storage), NOT KV STORAGE!
    const tempStorage = getInsecureStorage(); // This is now cookies
    if (tempStorage) {
      const storedState = await tempStorage.getSessionItem(StorageKeys.state);
      const storedNonce = await tempStorage.getSessionItem(StorageKeys.nonce);
      const storedCodeVerifier = await tempStorage.getSessionItem(StorageKeys.codeVerifier);
      console.log('=== LOGIN DEBUG ===');
      console.log('Expected state:', authResult.state);
      console.log('Stored state (cookies):', storedState);
      console.log('Stored nonce (cookies):', storedNonce);
      console.log('Stored code verifier (cookies):', storedCodeVerifier);
      console.log('=== END LOGIN DEBUG ===');
    }
  }
  
  return redirect(302, authResult.url.toString());
}

async function handleCallback(event: RequestEvent, config: ReturnType<typeof getConfig>) {
  const url = new URL(event.request.url);
  const error = url.searchParams.get('error');
  
  if (error) {
    return json({ error: `OAuth error: ${error}` }, { status: 400 });
  }
  
  const incomingState = url.searchParams.get('state');
  const incomingCode = url.searchParams.get('code');
  
  // CRITICAL DEBUG: Check what cookies are actually received
  console.log('=== CALLBACK COOKIE DEBUG ===');
  console.log('Incoming state from URL:', incomingState);
  console.log('Incoming code:', incomingCode ? 'present' : 'missing');
  
  // Check raw cookie header
  const rawCookies = event.request.headers.get('cookie');
  console.log('Raw cookie header:', rawCookies);
  
  // Check individual cookies through SvelteKit
  const kindeCookies = {
    state: event.cookies.get('kinde_state'),
    nonce: event.cookies.get('kinde_nonce'), 
    codeVerifier: event.cookies.get('kinde_codeVerifier')
  };
  console.log('SvelteKit parsed cookies:', kindeCookies);
  
  // Check if storage is working
  const tempStorage = getInsecureStorage();
  if (tempStorage) {
    const storedState = await tempStorage.getSessionItem(StorageKeys.state);
    const storedNonce = await tempStorage.getSessionItem(StorageKeys.nonce);
    const storedCodeVerifier = await tempStorage.getSessionItem(StorageKeys.codeVerifier);
    
    console.log('Storage retrieved values:');
    console.log('- State:', storedState);
    console.log('- Nonce:', storedNonce); 
    console.log('- Code Verifier:', storedCodeVerifier);
    
    console.log('State comparison:');
    console.log('- Incoming:', incomingState);
    console.log('- Stored:', storedState);
    console.log('- Match:', incomingState === storedState);
  } else {
    console.log('ERROR: No temp storage available in callback!');
  }
  console.log('=== END CALLBACK DEBUG ===');
  
  // Let js-utils handle the exchange (this is where the error occurs)
  const tokenResult = await exchangeAuthCode({
    urlParams: url.searchParams,
    domain: config.issuerUrl,
    clientId: config.clientId,
    redirectURL: config.redirectURL
  });
  
  if (!tokenResult.success) {
    console.error('js-utils exchangeAuthCode failed:', tokenResult.error);
    return json({ 
      error: tokenResult.error,
      debug: {
        incomingState,
        rawCookies,
        kindeCookies
      }
    }, { status: 500 });
  }
  
  return new Response(null, {
    status: 302,
    headers: {
      'Location': config.postLoginRedirectURL || '/dashboard',
      'Cache-Control': 'no-store'
    }
  });
}

async function handleLogout(event: RequestEvent, config: ReturnType<typeof getConfig>) {
  // Get the active storage that was set up in the main handler
  const storage = getActiveStorage();
  if (!storage) {
    throw new Error('Storage not initialized');
  }
  
  // Clear all tokens using js-utils destroySession
  await storage.destroySession();
  
  if (config.debug) {
    console.log('Session destroyed via js-utils');
  }
  
  // Build logout URL
  const logoutUrl = new URL('/logout', config.issuerUrl);
  logoutUrl.searchParams.append('redirect', config.postLogoutRedirectURL || '/');
  
  return new Response(null, {
    status: 302,
    headers: {
      'Location': logoutUrl.toString(),
      'Set-Cookie': 'kinde_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
    }
  });
}