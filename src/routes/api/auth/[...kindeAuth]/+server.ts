import { json, redirect } from '@sveltejs/kit';
import type { RequestEvent } from "@sveltejs/kit";
import { 
  generateAuthUrl,
  exchangeAuthCode,
  frameworkSettings,
  IssuerRouteTypes,
  type LoginOptions,
  getActiveStorage,
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
    await exchangeAuthCode({
      urlParams,
      domain: config.issuerUrl,
      clientId: config.clientId,
      redirectURL: config.redirectURL,
    });
    
    return redirect(302, config.postLoginRedirectURL);
  } catch (error) {
    // Expected window error - verify tokens were stored despite this
    const storage = getActiveStorage();
    
    const verifyTokens = async (attempt = 1): Promise<boolean> => {
      const delay = Math.min(500 * attempt, 2000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const [accessToken, idToken] = await Promise.all([
        storage?.getSessionItem(StorageKeys.accessToken),
        storage?.getSessionItem(StorageKeys.idToken)
      ]);
      
      if (accessToken && idToken) {
        return true;
      }
      
      if (attempt < 3) {
        return verifyTokens(attempt + 1);
      }
      
      return false;
    };
    
    const tokensStored = await verifyTokens();
    
    if (tokensStored) {
      return redirect(302, config.postLoginRedirectURL);
    } else {
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