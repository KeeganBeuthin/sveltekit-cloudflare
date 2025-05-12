// src/routes/api/user-profile/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createKindeStorage } from '$lib/kindeCloudflareStorage';
import { KINDE_ISSUER_URL, KINDE_DEBUG } from '$env/static/private';

export async function GET(event: RequestEvent) {
  const storage = createKindeStorage(event);
  
  if (!storage) {
    return json({ error: 'KV storage not available' }, { status: 500 });
  }
  
  try {
    // Try to get token from Authorization header first (for client-side API calls)
    const authHeader = event.request.headers.get('Authorization');
    let accessToken = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else {
      // Otherwise get session ID from cookie
      const cookies = event.request.headers.get('cookie') || '';
      const sessionMatch = cookies.match(/kinde_session=([^;]+)/);
      const sessionId = sessionMatch ? sessionMatch[1] : null;
      
      if (!sessionId) {
        if (KINDE_DEBUG === 'true') {
          console.log('User profile: No session cookie found');
        }
        return json({ authenticated: false, error: 'No session found' }, { status: 401 });
      }
      
      // Get stored tokens for this session
      const tokens = await storage.getState(`session:${sessionId}:tokens`);
      
      if (!tokens || !tokens.access_token) {
        if (KINDE_DEBUG === 'true') {
          console.log(`User profile: No valid tokens found for session ${sessionId}`);
        }
        return json({ authenticated: false, error: 'No valid tokens found' }, { status: 401 });
      }
      
      // Check token expiration
      const now = Date.now();
      const tokenAge = now - (tokens.timestamp || 0);
      const expiresIn = tokens.expires_in || 3600;
      const tokenExpiresInMs = expiresIn * 1000;
      
      if (tokenAge >= tokenExpiresInMs) {
        if (KINDE_DEBUG === 'true') {
          console.log(`User profile: Token expired for session ${sessionId}`);
        }
        return json({ authenticated: false, error: 'Token expired' }, { status: 401 });
      }
      
      accessToken = tokens.access_token;
    }
    
    // Get user profile using access token
    const userProfile = await fetchUserProfile(accessToken);
    
    return json({
      authenticated: true,
      profile: userProfile
    });
  } catch (error) {
    console.error('User profile error:', error instanceof Error ? error.message : String(error));
    return json({ 
      authenticated: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

async function fetchUserProfile(accessToken: string) {
  const userProfileUrl = `${KINDE_ISSUER_URL}/oauth2/user_profile`;
  
  if (KINDE_DEBUG === 'true') {
    console.log(`Fetching user profile from: ${userProfileUrl}`);
  }
  
  const response = await fetch(userProfileUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to fetch user profile: ${response.status}`, errorText);
    throw new Error(`Failed to fetch user profile: ${response.status}`);
  }
  
  return response.json();
}