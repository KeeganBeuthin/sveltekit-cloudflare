import { kindeAuthClient, type SessionManager } from '@kinde-oss/kinde-auth-sveltekit';
import type { LayoutServerLoad } from './$types';
import { createKindeStorage } from '$lib/kindeCloudflareStorage';
import { KINDE_ISSUER_URL, KINDE_CLIENT_ID, KINDE_CLIENT_SECRET, KINDE_REDIRECT_URL } from '$env/static/private';

export const load: LayoutServerLoad = async (event) => {
  const storage = createKindeStorage(event);
  
  if (!storage) {
    return {
      authenticated: false
    };
  }
  
  try {
    // Check if we have tokens
    const tokens = await storage.getState('tokens');
    
    // If no tokens exist, user is not authenticated
    if (!tokens?.access_token) {
      return { authenticated: false };
    }
    
    // Check token expiration
    const now = Date.now();
    const tokenAge = now - (tokens.timestamp || 0);
    const expiresIn = tokens.expires_in || 3600; // Default to 1 hour if not specified
    const tokenExpiresInMs = expiresIn * 1000;
    
    // If token is still valid (with 60-second buffer)
    if (tokenAge < tokenExpiresInMs - 60000) {
      return { authenticated: true };
    }
    
    // If token is expired but we have a refresh token, try to refresh
    if (tokens.refresh_token) {
      try {
        const refreshedTokens = await refreshTokens(tokens.refresh_token);
        
        // Store refreshed tokens
        await storage.setState('tokens', {
          access_token: refreshedTokens.access_token,
          refresh_token: refreshedTokens.refresh_token || tokens.refresh_token,
          id_token: refreshedTokens.id_token || tokens.id_token,
          expires_in: refreshedTokens.expires_in || 3600,
          timestamp: Date.now()
        });
        
        return { authenticated: true };
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        // Token refresh failed, user needs to re-authenticate
        return { authenticated: false };
      }
    }
    
    // Token is expired and no refresh token is available
    return { authenticated: false };
  } catch (error) {
    console.error('Error checking authentication:', error);
    return {
      authenticated: false
    };
  }
};

// Function to refresh tokens
async function refreshTokens(refreshToken: string) {
  const tokenUrl = new URL('/oauth2/token', KINDE_ISSUER_URL);
  const params = new URLSearchParams();
  
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  params.append('client_id', KINDE_CLIENT_ID);
  params.append('client_secret', KINDE_CLIENT_SECRET);
  
  const response = await fetch(tokenUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: params
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Token refresh failed: ${error.error || response.status}`);
  }
  
  return await response.json();
} 