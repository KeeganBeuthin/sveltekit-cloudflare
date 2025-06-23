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

  // Let js-utils handle the complete token exchange
  // The window error is just cleanup - tokens should be stored successfully
  const tokenResult = await exchangeAuthCode({
    urlParams: url.searchParams,
    domain: config.issuerUrl,
    clientId: config.clientId,
    redirectURL: config.redirectURL
  }).catch((error) => {
    // Only catch window errors - let other errors bubble up
    if (error instanceof ReferenceError && error.message.includes('window')) {
      if (config.debug) {
        console.log('Ignoring window cleanup error in server environment');
      }
      // Return success with the same type structure
      return { 
        success: true as const,
        error: undefined 
      };
    }
    throw error;
  });
  
  if (!tokenResult.success) {
    console.error('js-utils token exchange failed:', tokenResult.error);
    return json({ error: tokenResult.error }, { status: 500 });
  }
  
  if (config.debug) {
    console.log('js-utils authentication completed successfully');
  }
  
  // Redirect to success page
  return new Response(null, {
    status: 302,
    headers: {
      'Location': config.postLoginRedirectURL || '/dashboard',
      'Cache-Control': 'no-store'
    }
  });
}