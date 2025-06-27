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
  clearInsecureStorage,
  sanitizeUrl
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

function createAuthOptions(event: RequestEvent, config: ReturnType<typeof getConfig>): LoginOptions & { clientId: string; redirectURL: string } {
  const url = new URL(event.request.url);
  
  return {
    clientId: config.clientId,
    redirectURL: config.redirectURL,
    ...(url.searchParams.get('org_code') && { orgCode: url.searchParams.get('org_code')! })
  };
}

async function handleLogin(event: RequestEvent, config: ReturnType<typeof getConfig>) {
  const loginOptions: LoginOptions = {
    clientId: config.clientId!,
    redirectURL: config.redirectURL!,
  };

  const authResult = await generateAuthUrl(config.issuerUrl, IssuerRouteTypes.login, loginOptions);
  return redirect(302, authResult.url.toString());
}

async function handleRegister(event: RequestEvent, config: ReturnType<typeof getConfig>) {
  const authOptions = createAuthOptions(event, config);
  const authResult = await generateAuthUrl(config.issuerUrl, IssuerRouteTypes.register, authOptions);
  return redirect(302, authResult.url.toString());
}

async function handleLogout(event: RequestEvent, config: ReturnType<typeof getConfig>) {
  clearActiveStorage();
  clearInsecureStorage();
  
  const logoutUrl = new URL(`${sanitizeUrl(config.issuerUrl)}/logout`);
  logoutUrl.searchParams.set('redirect', config.postLogoutRedirectURL);
  
  return redirect(302, logoutUrl.toString());
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
    // Expected window error - tokens should be stored despite this
    return redirect(302, config.postLoginRedirectURL);
  }
}

export async function GET(event: RequestEvent) {
  const { params } = event;
  
  // Fix: Handle both string and array cases properly
  const kindeAuth = Array.isArray(params.kindeAuth) 
    ? params.kindeAuth[0] 
    : params.kindeAuth;
  
  initializeKindeAuth(event);
  const config = getConfig(event);

  switch (kindeAuth) {
    case 'login': {
      const loginOptions: LoginOptions = {
        clientId: config.clientId!,
        redirectURL: config.redirectURL!,
      };

      const authResult = await generateAuthUrl(config.issuerUrl, IssuerRouteTypes.login, loginOptions);
      return redirect(302, authResult.url.toString());
    }
    
    case 'logout': {
      clearActiveStorage();
      clearInsecureStorage();
      
      const logoutUrl = new URL(`${sanitizeUrl(config.issuerUrl)}/logout`);
      logoutUrl.searchParams.set('redirect', config.postLogoutRedirectURL);
      
      return redirect(302, logoutUrl.toString());
    }
    
    case 'kinde_callback': {
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
        // Expected window error - tokens should be stored despite this
        return redirect(302, config.postLoginRedirectURL);
      }
    }
    
    default:
      return json({ error: 'Invalid endpoint' }, { status: 404 });
  }
}