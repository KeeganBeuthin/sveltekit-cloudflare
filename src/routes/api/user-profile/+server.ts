// src/routes/api/user-profile/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createKindeStorage } from '$lib/kindeCloudflareStorage';

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
    return json({ 
      authenticated: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

async function fetchUserProfile(accessToken: string) {
  const response = await fetch(`${process.env.KINDE_ISSUER_URL}/oauth2/user_profile`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.status}`);
  }
  
  return response.json();
}