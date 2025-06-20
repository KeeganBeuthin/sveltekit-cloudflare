import { json, redirect } from '@sveltejs/kit';
import type { RequestEvent } from "@sveltejs/kit";
import { 
  generateRandomString,
  generateAuthUrl,
  exchangeAuthCode,
  frameworkSettings,
  StorageKeys,
  getActiveStorage,
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

const config = {
  issuerUrl: KINDE_ISSUER_URL,
  clientId: KINDE_CLIENT_ID,
  clientSecret: KINDE_CLIENT_SECRET,
  redirectURL: KINDE_REDIRECT_URL,
  postLoginRedirectURL: KINDE_POST_LOGIN_REDIRECT_URL,
  postLogoutRedirectURL: KINDE_POST_LOGOUT_REDIRECT_URL,
  scope: 'openid profile email offline',
  usePkce: KINDE_AUTH_WITH_PKCE === 'true',
  debug: KINDE_DEBUG === 'true'
};

export async function GET(event: RequestEvent) {
  // Initialize Kinde auth with KV storage - this sets up the global active storage
  if (!initializeKindeAuth(event)) {
    return json({ error: 'KV storage not available' }, { status: 500 });
  }
  
  const url = new URL(event.request.url);
  const path = url.pathname.split('/').pop() || '';
  
  if (config.debug) {
    console.log(`Auth request: ${path}`);
  }
  
  try {
    switch (path) {
      case 'login':
        return handleLogin(event, { isRegister: false });
      case 'register':
        return handleLogin(event, { isRegister: true });
      case 'kinde_callback':
        return handleCallback(event);
      case 'logout':
        return handleLogout(event);
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
  options: { isRegister: boolean }
) {
  const url = new URL(event.request.url);
  const orgCode = url.searchParams.get('org_code');
  const postLoginRedirect = url.searchParams.get('post_login_redirect_url') || config.postLoginRedirectURL;
  
  // Store the post-login redirect in the URL state parameter, which js-utils will preserve through the OAuth flow
  const customState = btoa(JSON.stringify({ 
    postLoginRedirect,
    timestamp: Date.now() 
  }));
  
  // Build login options for js-utils generateAuthUrl
  const loginOptions: LoginOptions = {
    clientId: config.clientId,
    redirectURL: config.redirectURL,
    scope: [Scopes.openid, Scopes.profile, Scopes.email, Scopes.offline_access],
    state: customState,
    ...(orgCode && { orgCode })
  };
  
  // Generate auth URL using js-utils - this handles nonce and PKCE automatically
  const authResult = await generateAuthUrl(
    config.issuerUrl,
    options.isRegister ? IssuerRouteTypes.register : IssuerRouteTypes.login,
    loginOptions
  );
  
  return redirect(302, authResult.url.toString());
}

async function handleCallback(event: RequestEvent) {
  const url = new URL(event.request.url);
  const error = url.searchParams.get('error');
  
  if (error) {
    return json({ error: `OAuth error: ${error}` }, { status: 400 });
  }
  
  // Extract our custom state to get the post-login redirect
  let postLoginRedirect = config.postLoginRedirectURL;
  try {
    const state = url.searchParams.get('state');
    if (state) {
      const stateData = JSON.parse(atob(state));
      if (stateData.postLoginRedirect) {
        postLoginRedirect = stateData.postLoginRedirect;
      }
    }
  } catch (e) {
    // If state parsing fails, use default redirect
    console.warn('Failed to parse custom state, using default redirect');
  }
  
  // Use js-utils exchangeAuthCode - it handles state verification, token exchange, and storage automatically
  const tokenResult = await exchangeAuthCode({
    urlParams: url.searchParams,
    domain: config.issuerUrl,
    clientId: config.clientId,
    redirectURL: config.redirectURL
  });
  
  if (!tokenResult.success) {
    return json({ error: tokenResult.error }, { status: 500 });
  }
  
  // Generate session cookie
  const sessionId = generateRandomString(32);
  
  if (config.debug) {
    console.log('Authentication successful, tokens stored in active storage via js-utils');
  }
  
  return new Response(null, {
    status: 302,
    headers: {
      'Location': postLoginRedirect,
      'Cache-Control': 'no-store',
      'Set-Cookie': `kinde_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
    }
  });
}

async function handleLogout(event: RequestEvent) {
  // Get the active storage that was set up in the main handler
  const storage = getActiveStorage();
  if (!storage) {
    throw new Error('Storage not initialized');
  }
  
  // Clear all tokens using js-utils destroySession
  await storage.destroySession();
  
  if (config.debug) {
    console.log('Session destroyed via js-utils active storage');
  }
  
  // Build logout URL
  const logoutUrl = new URL('/logout', config.issuerUrl);
  logoutUrl.searchParams.append('redirect', config.postLogoutRedirectURL);
  
  return new Response(null, {
    status: 302,
    headers: {
      'Location': logoutUrl.toString(),
      'Set-Cookie': 'kinde_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
    }
  });
}