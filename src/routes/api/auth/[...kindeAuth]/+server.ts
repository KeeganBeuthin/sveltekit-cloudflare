import { json, redirect } from '@sveltejs/kit';
import type { RequestEvent } from "@sveltejs/kit";
import { 
  generateAuthUrl,
  exchangeAuthCode,
  frameworkSettings,
  IssuerRouteTypes,
  type LoginOptions,
  getInsecureStorage,
  StorageKeys
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
  };
}

export async function GET(event: RequestEvent) {
  if (!initializeKindeAuth(event)) {
    return json({ error: 'Storage initialization failed' }, { status: 500 });
  }
  
  const config = getConfig(event);
  
  if (!config.issuerUrl || !config.clientId || !config.redirectURL) {
    return json({ error: 'Missing required Kinde configuration' }, { status: 500 });
  }
  
  const url = new URL(event.request.url);
  const path = url.pathname.split('/').pop() || '';
  
  try {
    switch (path) {
      case 'login':
        return handleLogin(event, config);
      case 'register':
        return handleRegister(event, config);
      case 'kinde_callback':
        return handleCallback(event, config);
      default:
        return json({ error: 'Unknown auth endpoint' }, { status: 404 });
    }
  } catch (error) {
    console.error('Auth handler error:', error);
    return json({ error: 'Authentication error' }, { status: 500 });
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
  const url = new URL(event.request.url);
  const error = url.searchParams.get('error');
  
  if (error) {
    return json({ error: `OAuth error: ${error}` }, { status: 400 });
  }

  // Use js-utils exchangeAuthCode - tokens are stored before window error occurs
  try {
    await exchangeAuthCode({
      urlParams: url.searchParams,
      domain: config.issuerUrl,
      clientId: config.clientId,
      redirectURL: config.redirectURL
    });
  } catch (error) {
    // Expected window error in server environment - tokens are already stored
    if (error instanceof ReferenceError && error.message.includes('window')) {
      // Clean up OAuth temp data
      const insecureStorage = getInsecureStorage();
      if (insecureStorage) {
        await insecureStorage.removeItems(
          StorageKeys.state, 
          StorageKeys.nonce, 
          StorageKeys.codeVerifier
        );
      }
      
      return redirect(302, config.postLoginRedirectURL || '/dashboard');
    }
    
    console.error('Unexpected callback error:', error);
    return json({ error: 'Authentication failed' }, { status: 500 });
  }
  
  // This should never happen in server environment
  return redirect(302, config.postLoginRedirectURL || '/dashboard');
}