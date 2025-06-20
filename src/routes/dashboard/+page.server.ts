import type { PageServerLoad } from './$types';
import { isAuthenticated, getUserProfile } from '@kinde/js-utils';
import { initializeKindeAuth } from '$lib/kindeAuth';

export const load: PageServerLoad = async (event) => {
  // Initialize Kinde auth with KV storage - sets up active storage for js-utils
  if (!initializeKindeAuth(event)) {
    return {
      authenticated: false,
      error: 'KV storage not available'
    };
  }
  
  try {
    // Use js-utils token helpers - they automatically use the active storage!
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      return { 
        authenticated: false,
        error: 'Not authenticated'
      };
    }
    
    // Get user profile using js-utils
    const user = await getUserProfile();
    
    if (!user) {
      return {
        authenticated: true,
        error: 'Could not retrieve user profile'
      };
    }
    
    return {
      authenticated: true,
      user
    };
    
  } catch (error) {
    console.error('Dashboard authentication error:', error);
    return {
      authenticated: false,
      error: 'Error checking authentication'
    };
  }
}; 