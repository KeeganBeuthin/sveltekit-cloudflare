import type { PageServerLoad } from './$types';
import { isAuthenticated, getUserProfile, getActiveStorage, StorageKeys } from '@kinde/js-utils';
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
    console.log('=== DASHBOARD AUTHENTICATION CHECK ===');
    
    // Add debugging to see what's in storage
    const storage = getActiveStorage();
    if (storage) {
      const accessToken = await storage.getSessionItem(StorageKeys.accessToken);
      const idToken = await storage.getSessionItem(StorageKeys.idToken);
      const refreshToken = await storage.getSessionItem(StorageKeys.refreshToken);
      
      console.log('Tokens in storage:');
      console.log('- Access Token:', accessToken ? 'present' : 'missing');
      console.log('- ID Token:', idToken ? 'present' : 'missing');
      console.log('- Refresh Token:', refreshToken ? 'present' : 'missing');
      
      // If tokens are missing, it's likely KV eventual consistency
      if (!accessToken && !idToken) {
        console.log('Tokens missing - likely KV eventual consistency issue');
        return {
          authenticated: false,
          error: 'Authentication tokens not yet available (KV eventual consistency)',
          retry: true  // Add a flag to indicate this should be retried
        };
      }
    }
    
    // Use js-utils token helpers - they automatically use the active storage!
    const authenticated = await isAuthenticated();
    console.log('js-utils isAuthenticated result:', authenticated);
    
    if (!authenticated) {
      return { 
        authenticated: false,
        error: 'Not authenticated'
      };
    }
    
    // Get user profile using js-utils
    const user = await getUserProfile();
    console.log('js-utils getUserProfile result:', user ? 'success' : 'failed');
    
    if (!user) {
      return {
        authenticated: true,
        error: 'Could not retrieve user profile'
      };
    }
    
    console.log('=== DASHBOARD AUTH SUCCESS ===');
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