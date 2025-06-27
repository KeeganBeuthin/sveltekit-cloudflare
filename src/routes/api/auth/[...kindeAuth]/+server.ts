import { json, redirect } from '@sveltejs/kit';
import type { RequestEvent } from "@sveltejs/kit";
import { 
  generateAuthUrl,
  exchangeAuthCode,
  frameworkSettings,
  IssuerRouteTypes,
  type LoginOptions,
  getActiveStorage,
  getInsecureStorage,
  StorageKeys,
  clearActiveStorage,
  clearInsecureStorage
} from '@kinde/js-utils';
import { initializeKindeAuth } from '$lib/kindeAuth';

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
    redirectURL: env?.KINDE_REDIRECT_URL,
    postLoginRedirectURL: env?.KINDE_POST_LOGIN_REDIRECT_URL,
    postLogoutRedirectURL: env?.KINDE_POST_LOGOUT_REDIRECT_URL,
  };
}

function getLogoutUrl(config: ReturnType<typeof getConfig>): string {
  const logoutUrl = new URL(`${config.issuerUrl}/logout`);
  logoutUrl.searchParams.set('redirect', config.postLogoutRedirectURL);
  return logoutUrl.toString();
}

async function handleLogout(event: RequestEvent, config: ReturnType<typeof getConfig>) {
  console.log('🔄 Starting logout process...');
  
  try {
    // Clear all storage
    clearActiveStorage();
    clearInsecureStorage();
    console.log('✅ Storage cleared successfully');
    
    // Generate logout URL
    const logoutUrl = getLogoutUrl(config);
    console.log('🔄 Redirecting to Kinde logout:', logoutUrl);
    
    return redirect(302, logoutUrl);
  } catch (error) {
    console.error('❌ Logout error:', error);
    // Even if there's an error, redirect to logout
    const logoutUrl = getLogoutUrl(config);
    return redirect(302, logoutUrl);
  }
}

export async function GET(event: RequestEvent) {
  const { params } = event;
  const action = params.kindeAuth;
  
  if (!initializeKindeAuth(event)) {
    return json({ error: 'Failed to initialize authentication' }, { status: 500 });
  }
  
  const config = getConfig(event);
  
  switch (action) {
    case 'login':
      return handleLogin(event, config);
    case 'register':
      return handleRegister(event, config);
    case 'logout':
      return handleLogout(event, config);
    case 'kinde_callback':
      return handleCallback(event, config);
    default:
      return json({ error: 'Invalid action' }, { status: 400 });
  }
}

async function handleLogin(event: RequestEvent, config: ReturnType<typeof getConfig>) {
  const url = new URL(event.request.url);
  const orgCode = url.searchParams.get('org_code');
  
  const loginOptions: LoginOptions = {
    clientId: config.clientId,
    redirectURL: config.redirectURL,
    ...(orgCode && { orgCode })
  };
  
  const authResult = await generateAuthUrl(
    config.issuerUrl,
    IssuerRouteTypes.login,
    loginOptions
  );
  
  return redirect(302, authResult.url.toString());
}

async function handleRegister(event: RequestEvent, config: ReturnType<typeof getConfig>) {
  const url = new URL(event.request.url);
  const orgCode = url.searchParams.get('org_code');
  
  const loginOptions: LoginOptions = {
    clientId: config.clientId,
    redirectURL: config.redirectURL,
    ...(orgCode && { orgCode })
  };
  
  const authResult = await generateAuthUrl(
    config.issuerUrl,
    IssuerRouteTypes.register,
    loginOptions
  );
  
  return redirect(302, authResult.url.toString());
}

async function handleCallback(event: RequestEvent, config: ReturnType<typeof getConfig>) {
  console.log('🔄 Starting token exchange process...');
  
  if (!initializeKindeAuth(event)) {
    console.log('❌ Storage initialization failed');
    return json({ error: 'Storage initialization failed' }, { status: 500 });
  }
  console.log('✅ Storage initialized correctly');

  try {
    console.log('🔄 Calling js-utils exchangeAuthCode...');
    await exchangeAuthCode({
      urlParams: new URLSearchParams(new URL(event.request.url).search),
      domain: config.issuerUrl,
      clientId: config.clientId,
      redirectURL: config.redirectURL
    });
  } catch (error: any) {
    console.log('⚠️ exchangeAuthCode threw error:', error.message);
    console.log('✅ Caught expected window error - waiting for KV consistency...');
    
    // Wait for KV operations to complete (eventual consistency)
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  // Verify tokens were stored
  const activeStorage = getActiveStorage();
  const [accessToken, idToken, refreshToken] = await Promise.all([
    activeStorage?.getSessionItem(StorageKeys.accessToken),
    activeStorage?.getSessionItem(StorageKeys.idToken), 
    activeStorage?.getSessionItem(StorageKeys.refreshToken)
  ]);

  console.log('🔍 Token verification (after delay):');
  console.log('- Access Token:', accessToken ? 'present' : 'MISSING');
  console.log('- ID Token:', idToken ? 'present' : 'MISSING'); 
  console.log('- Refresh Token:', refreshToken ? 'present' : 'MISSING');

  if (accessToken && idToken) {
    console.log('✅ Essential tokens verified - cleaning up OAuth temp data');
    
    // Clean up temporary OAuth data
    const insecureStorage = getInsecureStorage();
    await insecureStorage?.removeItems(
      StorageKeys.state,
      StorageKeys.nonce, 
      StorageKeys.codeVerifier
    );
    
    console.log('✅ OAuth cleanup complete - redirecting to dashboard');
    return redirect(302, config.postLoginRedirectURL);
  }

  console.log('❌ Essential tokens missing after delay - token exchange failed');
  return json({ error: 'Authentication failed' }, { status: 500 });
}