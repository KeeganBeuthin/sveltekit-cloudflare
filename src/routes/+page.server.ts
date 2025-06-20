import type { PageServerLoad } from './$types';
import { isAuthenticated, getUserProfile } from '@kinde/js-utils';
import { initializeKindeAuth } from '$lib/kindeAuth';

export const load: PageServerLoad = async (event) => {
  // Initialize Kinde auth with KV storage - sets up active storage for js-utils
  if (!initializeKindeAuth(event)) {
    return {
      isAuthenticated: false,
      user: null
    };
  }
  
  try {
    // Use js-utils token helpers - they automatically use the active storage!
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      return {
        isAuthenticated: false,
        user: null
      };
    }
    
    // Get user profile using js-utils
    const user = await getUserProfile();
    
    return {
      isAuthenticated: true,
      user
    };
    
  } catch (error) {
    console.error('Homepage authentication error:', error);
    return {
      isAuthenticated: false,
      user: null
    };
  }
};