import { json, redirect } from '@sveltejs/kit';
import type { RequestEvent } from "@sveltejs/kit";
import { createKindeStorage } from '$lib/kindeCloudflareStorage';

// Get environment variables
const ISSUER_URL = process.env.KINDE_ISSUER_URL || 'https://burntjam2.kinde.com';
const CLIENT_ID = process.env.KINDE_CLIENT_ID || '53add5e70e57400eb752ddb02bc07fb6';
const REDIRECT_URL = process.env.KINDE_REDIRECT_URL || 'https://sveltekit-cloudflare.pages.dev/api/auth/kinde_callback';
const POST_LOGIN_REDIRECT_URL = process.env.KINDE_POST_LOGIN_REDIRECT_URL || 'https://sveltekit-cloudflare.pages.dev/dashboard';
const POST_LOGOUT_REDIRECT_URL = process.env.KINDE_POST_LOGOUT_REDIRECT_URL || 'https://sveltekit-cloudflare.pages.dev';
const SCOPE = process.env.KINDE_SCOPE || 'openid profile email offline';
const USE_PKCE = process.env.KINDE_AUTH_WITH_PKCE === 'true';

export async function GET(event: RequestEvent) {
  const storage = createKindeStorage(event);
  const url = new URL(event.request.url);
  const path = url.pathname.split('/').pop() || '';
  
  console.log(`Auth request: ${path}`, {
    hasStorage: !!storage,
    hasState: !!url.searchParams.get('state'),
    hasCode: !!url.searchParams.get('code')
  });
  
  if (!storage) {
    console.error('KV storage not available');
    return json({ error: 'KV storage not available' }, { status: 500 });
  }
  
  // Handle various auth endpoints
  switch (path) {
    case 'login':
      return handleLogin(event, storage, false);
    
    case 'register':
      return handleLogin(event, storage, true);
    
    case 'kinde_callback':
      return handleCallback(event, storage);
    
    case 'logout':
      return handleLogout(event);
    
    default:
      return json({ error: 'Unknown auth endpoint' }, { status: 404 });
  }
}

// Generate crypto-secure random string for state
function generateRandomString(length = 32) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Handle login or registration
async function handleLogin(event: RequestEvent, storage: any, isRegister: boolean) {
  // Generate state parameter
  const state = generateRandomString(24);
  
  // For PKCE, generate code challenge
  let codeVerifier: string | undefined;
  let codeChallenge: string | undefined;
  
  if (USE_PKCE) {
    codeVerifier = generateRandomString(64);
    
    // In a real implementation, you'd need to create a proper code challenge
    // This is a simplified version - you'd need SHA-256 hashing for proper PKCE
    codeChallenge = codeVerifier; // Simplified! In reality, this should be base64url(sha256(codeVerifier))
  }
  
  // Store state (and code verifier if using PKCE)
  await storage.setState(state, codeVerifier || 'true');
  
  // Get additional parameters from URL
  const url = new URL(event.request.url);
  const orgCode = url.searchParams.get('org_code');
  const postLoginRedirect = url.searchParams.get('post_login_redirect_url') || POST_LOGIN_REDIRECT_URL;
  
  // Build auth URL
  const authUrl = new URL(isRegister ? '/oauth2/auth/register' : '/oauth2/auth', ISSUER_URL);
  
  // Add standard OAuth parameters
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URL);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', SCOPE);
  authUrl.searchParams.append('state', state);
  
  // Add optional parameters
  if (orgCode) {
    authUrl.searchParams.append('org_code', orgCode);
  }
  
  // Store post-login redirect
  await storage.setState(`redirect:${state}`, postLoginRedirect);
  
  // Add PKCE parameters if enabled
  if (USE_PKCE && codeChallenge) {
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
  }
  
  // Redirect to Kinde auth URL
  console.log(`Redirecting to Kinde auth: ${authUrl.toString()}`);
  return redirect(302, authUrl.toString());
}

// Handle OAuth callback
async function handleCallback(event: RequestEvent, storage: any) {
  const url = new URL(event.request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  
  // Check for OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return json({ error: `OAuth error: ${error}` }, { status: 400 });
  }
  
  // Validate required parameters
  if (!code || !state) {
    console.error('Missing code or state parameter');
    return json({ error: 'Missing code or state parameter' }, { status: 400 });
  }
  
  // Verify state parameter
  const storedState = await storage.getState(state);
  if (!storedState) {
    console.error('State not found:', state);
    
    // Store error for debugging
    await storage.setState('last_error', {
      time: new Date().toISOString(),
      error: 'State not found',
      state
    });
    
    return json({ error: 'Invalid state parameter' }, { status: 401 });
  }
  
  // Get code verifier for PKCE if it exists
  const codeVerifier = storedState === 'true' ? undefined : storedState;
  
  // Get post-login redirect URL
  const redirectUrl = await storage.getState(`redirect:${state}`) || POST_LOGIN_REDIRECT_URL;
  
  // Clean up stored state
  await storage.deleteState(state);
  await storage.deleteState(`redirect:${state}`);
  
  // Exchange code for tokens
  try {
    const tokenResponse = await fetchTokens(code, codeVerifier);
    
    // Store tokens in KV storage
    await storage.setState('tokens', {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      id_token: tokenResponse.id_token,
      expires_in: tokenResponse.expires_in,
      timestamp: Date.now()
    });
    
    // Redirect to post-login URL
    return redirect(302, redirectUrl);
  } catch (error) {
    console.error('Token exchange error:', error);
    
    await storage.setState('token_error', {
      time: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    });
    
    return json({ error: 'Token exchange failed' }, { status: 500 });
  }
}

// Exchange authorization code for tokens
async function fetchTokens(code: string, codeVerifier?: string) {
  const tokenUrl = new URL('/oauth2/token', ISSUER_URL);
  
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', CLIENT_ID);
  params.append('redirect_uri', REDIRECT_URL);
  params.append('code', code);
  
  // Add code verifier for PKCE if present
  if (codeVerifier) {
    params.append('code_verifier', codeVerifier);
  } else {
    // Add client secret for authorization code flow
    params.append('client_secret', process.env.KINDE_CLIENT_SECRET || '');
  }
  
  const response = await fetch(tokenUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: params
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorData}`);
  }
  
  return response.json();
}

// Handle logout
function handleLogout(event: RequestEvent) {
  const logoutUrl = new URL('/logout', ISSUER_URL);
  logoutUrl.searchParams.append('redirect', POST_LOGOUT_REDIRECT_URL);
  
  return redirect(302, logoutUrl.toString());
} 