import { json, redirect } from '@sveltejs/kit';
import type { RequestEvent } from "@sveltejs/kit";
import { 
  generateAuthUrl,
  exchangeAuthCode,
  frameworkSettings,
  IssuerRouteTypes,
  Scopes,
  type LoginOptions
} from '@kinde/js-utils';
import { initializeKindeAuth } from '$lib/kindeAuth';
import { getActiveStorage, StorageKeys, getInsecureStorage } from '@kinde/js-utils';
import { KINDE_ISSUER_URL, KINDE_CLIENT_ID, KINDE_REDIRECT_URL, KINDE_POST_LOGIN_REDIRECT_URL, KINDE_POST_LOGOUT_REDIRECT_URL, KINDE_DEBUG } from '$env/static/private';

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
    debug: env?.KINDE_DEBUG === 'true'
  };
}

export async function GET(event: RequestEvent) {
  // Initialize hybrid storage for EVERY request
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
    scope: [Scopes.openid, Scopes.profile, Scopes.email, Scopes.offline_access],
    ...(orgCode && { orgCode })
  };
  
  // Let js-utils handle everything - it will use our configured storage
  const authResult = await generateAuthUrl(
    config.issuerUrl,
    IssuerRouteTypes.login,
    loginOptions
  );
  
  if (config.debug) {
    console.log('js-utils generated auth URL, redirecting to Kinde');
  }
  
  return redirect(302, authResult.url.toString());
}

async function handleRegister(event: RequestEvent, config: ReturnType<typeof getConfig>) {
  const url = new URL(event.request.url);
  const orgCode = url.searchParams.get('org_code');
  
  const loginOptions: LoginOptions = {
    clientId: config.clientId,
    redirectURL: config.redirectURL,
    scope: [Scopes.openid, Scopes.profile, Scopes.email, Scopes.offline_access],
    ...(orgCode && { orgCode })
  };
  
  // Let js-utils handle everything - it will use our configured storage
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

  if (config.debug) {
    console.log('Processing callback with js-utils...');
  }

  try {
    // Try the normal flow first
    const tokenResult = await exchangeAuthCode({
      urlParams: url.searchParams,
      domain: config.issuerUrl,
      clientId: config.clientId,
      redirectURL: config.redirectURL
    });
    
    // This shouldn't happen since we expect a window error
    if (!tokenResult.success) {
      console.error('js-utils token exchange failed:', tokenResult.error);
      return json({ error: tokenResult.error }, { status: 500 });
    }
    
    if (config.debug) {
      console.log('js-utils authentication completed successfully via normal flow');
    }
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': config.postLoginRedirectURL || '/dashboard',
        'Cache-Control': 'no-store'
      }
    });
    
  } catch (error) {
    // Handle window error in server environment
    if (error instanceof ReferenceError && error.message.includes('window')) {
      if (config.debug) {
        console.log('Caught window error - tokens were likely stored before this error');
        console.log('Waiting 2 seconds for token storage to complete...');
      }
      
      // Wait for token storage to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if tokens were stored
      const storage = getActiveStorage();
      if (storage) {
        const accessToken = await storage.getSessionItem(StorageKeys.accessToken);
        const idToken = await storage.getSessionItem(StorageKeys.idToken);
        
        if (config.debug) {
          console.log('Post-window-error token check:');
          console.log('- Access Token:', accessToken ? 'present' : 'missing');
          console.log('- ID Token:', idToken ? 'present' : 'missing');
        }
        
        if (accessToken && idToken) {
          if (config.debug) {
            console.log('Tokens successfully stored despite window error');
          }
          
          // Clean up OAuth temp data
          const insecureStorage = getInsecureStorage();
          if (insecureStorage) {
            await insecureStorage.removeItems(
              StorageKeys.state, 
              StorageKeys.nonce, 
              StorageKeys.codeVerifier
            );
          }
          
          return new Response(null, {
            status: 302,
            headers: {
              'Location': config.postLoginRedirectURL || '/dashboard',
              'Cache-Control': 'no-store'
            }
          });
        } else {
          console.error('Tokens were not stored properly');
          return json({ error: 'Token storage failed' }, { status: 500 });
        }
      }
    }
    
    // Re-throw non-window errors
    console.error('Unexpected callback error:', error);
    throw error;
  }
}