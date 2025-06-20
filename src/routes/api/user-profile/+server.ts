// src/routes/api/user-profile/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getUserProfile, isAuthenticated } from '@kinde/js-utils';
import { initializeKindeAuth } from '$lib/kindeAuth';

export async function GET(event: RequestEvent) {
  // Initialize Kinde auth with KV storage - sets up active storage for js-utils
  if (!initializeKindeAuth(event)) {
    return json({ error: 'KV storage not available' }, { status: 500 });
  }
  
  try {
    // Now all js-utils token helpers work automatically with the active storage!
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      return json({ authenticated: false, error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get user profile using js-utils - it automatically uses the active storage
    const userProfile = await getUserProfile();
    
    if (!userProfile) {
      return json({ authenticated: true, error: 'Could not retrieve user profile' }, { status: 500 });
    }
    
    return json({
      authenticated: true,
      user: userProfile
    });
    
  } catch (error) {
    console.error('User profile error:', error);
    return json({ 
      authenticated: false, 
      error: 'Failed to get user profile' 
    }, { status: 500 });
  }
}