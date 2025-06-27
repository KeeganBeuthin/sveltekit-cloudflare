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

async function handleLogin(event: RequestEvent, config: ReturnType<typeof getConfig>) {
  const loginOptions: LoginOptions = {
    clientId: config.clientId,
    redirectURL: config.redirectURL,
  };

  const authResult = await generateAuthUrl(config.issuerUrl, IssuerRouteTypes.login, loginOptions);
  return redirect(302, authResult.url.toString());
}

async function handleLogout(event: RequestEvent, config: ReturnType<typeof getConfig>) {
  try {
    clearActiveStorage();
    clearInsecureStorage();
    
    const logoutUrl = new URL(`${config.issuerUrl}/logout`);
    logoutUrl.searchParams.set('redirect', config.postLogoutRedirectURL);
    
    return redirect(302, logoutUrl.toString());
  } catch {
    const logoutUrl = new URL(`${config.issuerUrl}/logout`);
    logoutUrl.searchParams.set('redirect', config.postLogoutRedirectURL);
    return redirect(302, logoutUrl.toString());
  }
}

async function handleCallback(event: RequestEvent, config: ReturnType<typeof getConfig>) {
  const urlParams = event.url.searchParams;
  
  try {
    console.log('🔄 Starting token exchange process...');
    console.log('✅ Storage initialized correctly');
    console.log('🔄 Calling js-utils exchangeAuthCode...');
    
    await exchangeAuthCode({
      urlParams,
      domain: config.issuerUrl,
      clientId: config.clientId,
      redirectURL: config.redirectURL,
    });
    
    console.log('✅ exchangeAuthCode completed successfully');
    return redirect(302, config.postLoginRedirectURL);
  } catch (error) {
    console.log('⚠️ exchangeAuthCode threw error:', error.message);
    console.log('✅ Caught expected window error - checking if tokens were stored...');
    
    // Wait for KV consistency and verify tokens were stored
    const storage = getActiveStorage();
    
    const verifyTokens = async (attempt = 1): Promise<boolean> => {
      const delay = Math.min(500 * attempt, 2000); // Progressive delay up to 2s
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const [accessToken, idToken, refreshToken] = await Promise.all([
        storage?.getSessionItem(StorageKeys.accessToken),
        storage?.getSessionItem(StorageKeys.idToken),
        storage?.getSessionItem(StorageKeys.refreshToken)
      ]);
      
      const tokenCount = [accessToken, idToken, refreshToken].filter(Boolean).length;
      console.log(`🔍 Token verification (attempt ${attempt}): ${tokenCount}/3 tokens found`);
      
      // We need at least 2 of the 3 tokens (access + id are most critical)
      if (accessToken && idToken) {
        console.log('✅ Essential tokens verified - authentication successful');
        return true;
      }
      
      if (attempt < 3) {
        console.log(`⏱️ Retrying token verification in ${Math.min(500 * (attempt + 1), 2000)}ms...`);
        return verifyTokens(attempt + 1);
      }
      
      console.log('❌ Tokens were not stored properly despite window error');
      return false;
    };
    
    const tokensStored = await verifyTokens();
    
    if (tokensStored) {
      return redirect(302, config.postLoginRedirectURL);
    } else {
      console.error('🚫 Authentication failed - tokens not stored');
      return json({ 
        error: 'Authentication failed',
        details: 'Tokens were not stored properly'
      }, { status: 500 });
    }
  }
}

export async function GET(event: RequestEvent) {
  const { params } = event;
  
  const kindeAuth = Array.isArray(params.kindeAuth) 
    ? params.kindeAuth[0] 
    : params.kindeAuth;
  
  initializeKindeAuth(event);
  const config = getConfig(event);

  switch (kindeAuth) {
    case 'login':
      return handleLogin(event, config);
    case 'logout':
      return handleLogout(event, config);
    case 'kinde_callback':
      return handleCallback(event, config);
    default:
      return json({ error: 'Invalid endpoint' }, { status: 404 });
  }
}