import type { PageServerLoad } from './$types';
import { createKindeStorage } from '$lib/kindeCloudflareStorage';
import { KINDE_DEBUG } from '$env/static/private';

export const load: PageServerLoad = async (event) => {
  const storage = createKindeStorage(event);
  
  if (!storage) {
    return {
      authenticated: false,
      error: 'Storage not available'
    };
  }
  
  try {
    // Get session ID from cookie
    const cookies = event.request.headers.get('cookie') || '';
    const sessionMatch = cookies.match(/kinde_session=([^;]+)/);
    const sessionId = sessionMatch ? sessionMatch[1] : null;
    
    if (!sessionId) {
      if (KINDE_DEBUG === 'true') {
        console.log('Dashboard: No session cookie found');
      }
      return { 
        authenticated: false,
        error: 'No session found'
      };
    }
    
    // Check if we have tokens for this session
    const tokens = await storage.getState(`session:${sessionId}:tokens`);
    
    if (!tokens?.access_token) {
      if (KINDE_DEBUG === 'true') {
        console.log(`Dashboard: No valid tokens found for session ${sessionId}`);
      }
      return { 
        authenticated: false,
        error: 'No valid tokens found'
      };
    }
    
    // Check token expiration
    const now = Date.now();
    const tokenAge = now - (tokens.timestamp || 0);
    const expiresIn = tokens.expires_in || 3600;
    const tokenExpiresInMs = expiresIn * 1000;
    
    // If token is expired
    if (tokenAge >= tokenExpiresInMs) {
      if (KINDE_DEBUG === 'true') {
        console.log(`Dashboard: Token expired for session ${sessionId}`);
      }
      return { 
        authenticated: false,
        error: 'Token expired'
      };
    }
    
    // Token is valid
    return {
      authenticated: true,
      sessionId: sessionId,
      // Pass access token to the client for API calls
      accessToken: tokens.access_token
    };
  } catch (error) {
    console.error('Error checking authentication:', error);
    return {
      authenticated: false,
      error: 'Error checking authentication'
    };
  }
}; 