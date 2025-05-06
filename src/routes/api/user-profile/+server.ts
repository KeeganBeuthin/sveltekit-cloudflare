// src/routes/api/user-profile/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createKindeStorage } from '$lib/kindeCloudflareStorage';

// Use the same ISSUER_URL constant as in the auth endpoint
const ISSUER_URL = process.env.KINDE_ISSUER_URL || 'https://burntjam2.kinde.com';

export async function GET(event: RequestEvent) {
  const storage = createKindeStorage(event);
  
  if (!storage) {
    return json({ error: 'KV storage not available' }, { status: 500 });
  }
  
  try {
    // Get stored tokens
    const tokens = await storage.getState('tokens');
    
    if (!tokens || !tokens.access_token) {
      return json({ authenticated: false }, { status: 401 });
    }
    
    // Get user profile using access token
    const userProfile = await fetchUserProfile(tokens.access_token);
    
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
  const userProfileUrl = `${ISSUER_URL}/oauth2/user_profile`;
  console.log(`Fetching user profile from: ${userProfileUrl}`);
  
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