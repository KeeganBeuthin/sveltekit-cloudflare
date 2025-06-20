import { json, redirect } from '@sveltejs/kit';
import type { RequestEvent } from "@sveltejs/kit";
import { 
  generateRandomString,
  generateAuthUrl,
  exchangeAuthCode,
  frameworkSettings,
  getActiveStorage,
  IssuerRouteTypes,
  Scopes,
  type LoginOptions
} from '@kinde/js-utils';
import { initializeKindeAuth } from '$lib/kindeAuth';
import { StorageKeys } from '@kinde/js-utils';
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
  // Initialize Kinde auth with KV storage - this sets up the global active storage
  if (!initializeKindeAuth(event)) {
    return json({ error: 'KV storage not available' }, { status: 500 });
  }
  
  const config = getConfig(event);
  
  // Validate required config
  if (!config.issuerUrl || !config.clientId || !config.clientSecret || !config.redirectURL) {
    return json({ error: 'Missing required Kinde configuration' }, { status: 500 });
  }
  
  const url = new URL(event.request.url);
  const path = url.pathname.split('/').pop() || '';
  
  if (config.debug) {
    console.log(`Auth request: ${path}`);
  }
  
  try {
    switch (path) {
      case 'login':
        return handleLogin(event, config, { isRegister: false });
      case 'register':
        return handleLogin(event, config, { isRegister: true });
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

async function handleLogin(
  event: RequestEvent, 
  config: ReturnType<typeof getConfig>,
  options: { isRegister: boolean }
) {
  // Storage is already initialized in the main GET handler
  const url = new URL(event.request.url);
  const orgCode = url.searchParams.get('org_code');
  
  // Build login options for js-utils generateAuthUrl - let js-utils manage everything
  const loginOptions: LoginOptions = {
    clientId: config.clientId,
    redirectURL: config.redirectURL,
    scope: [Scopes.openid, Scopes.profile, Scopes.email, Scopes.offline_access],
    // Let js-utils generate and manage state, nonce, and PKCE automatically
    ...(orgCode && { orgCode })
  };
  
  // Generate auth URL using js-utils - this handles everything automatically
  const authResult = await generateAuthUrl(
    config.issuerUrl,
    options.isRegister ? IssuerRouteTypes.register : IssuerRouteTypes.login,
    loginOptions
  );
  
  if (config.debug) {
    console.log('Generated auth URL via js-utils, state:', authResult.state);
    
    // Debug: Verify state was stored
    const storage = getActiveStorage();
    if (storage) {
      const storedState = await storage.getSessionItem(StorageKeys.state);
      console.log('State stored in KV:', storedState);
    }
  }
  
  return redirect(302, authResult.url.toString());
}

async function handleCallback(event: RequestEvent, config: ReturnType<typeof getConfig>) {
  // Storage is already initialized in the main GET handler
  const url = new URL(event.request.url);
  const error = url.searchParams.get('error');
  
  if (error) {
    return json({ error: `OAuth error: ${error}` }, { status: 400 });
  }
  
  const incomingState = url.searchParams.get('state');
  
  if (config.debug) {
    console.log('Processing callback with state:', incomingState);
    
    // Debug: Check what's in storage before exchangeAuthCode
    const storage = getActiveStorage();
    if (storage) {
      const storedState = await storage.getSessionItem(StorageKeys.state);
      const storedCodeVerifier = await storage.getSessionItem(StorageKeys.codeVerifier);
      const storedNonce = await storage.getSessionItem(StorageKeys.nonce);
      console.log('=== CALLBACK DEBUG ===');
      console.log('Incoming state:', incomingState);
      console.log('Stored state:', storedState);
      console.log('Stored code verifier:', storedCodeVerifier);
      console.log('Stored nonce:', storedNonce);
      console.log('State match:', incomingState === storedState);
      console.log('=== END DEBUG ===');
    } else {
      console.log('ERROR: No storage found in callback - this is the problem!');
    }
  }
  
  // Use js-utils exchangeAuthCode - it handles everything automatically
  const tokenResult = await exchangeAuthCode({
    urlParams: url.searchParams,
    domain: config.issuerUrl,
    clientId: config.clientId,
    redirectURL: config.redirectURL
  });
  
  if (!tokenResult.success) {
    if (config.debug) {
      console.error('Token exchange failed:', tokenResult.error);
    }
    return json({ error: tokenResult.error }, { status: 500 });
  }
  
  // Generate session cookie
  const sessionId = generateRandomString(32);
  
  if (config.debug) {
    console.log('Authentication successful, tokens stored via js-utils');
  }
  
  // Always redirect to the configured post-login URL
  return new Response(null, {
    status: 302,
    headers: {
      'Location': config.postLoginRedirectURL || '/dashboard',
      'Cache-Control': 'no-store',
      'Set-Cookie': `kinde_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
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