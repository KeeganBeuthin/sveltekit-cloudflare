import { 
    KvStorage, 
    setActiveStorage,
    setInsecureStorage,
    getActiveStorage,
    type SessionManager
  } from '@kinde/js-utils';
  import type { RequestEvent } from '@sveltejs/kit';
  
  /**
   * Initialize Kinde authentication with KV storage for the current request
   * This sets up the global active storage that all js-utils token helpers will use
   */
  export function initializeKindeAuth(event: RequestEvent): boolean {
    const platform = event.platform as any;
    const env = platform?.env;
    const AUTH_STORAGE = env?.AUTH_STORAGE;
    
    if (!AUTH_STORAGE) {
      console.error('KV storage not available for Kinde authentication');
      return false;
    }
    
    // Create KvStorage and set it as both secure and insecure storage for js-utils
    const storage = new KvStorage(AUTH_STORAGE, { defaultTtl: 3600 });
    setActiveStorage(storage);      // For tokens (secure)
    setInsecureStorage(storage);    // For state, nonce, code verifier (insecure/temporary)
    
    return true;
  }
  
  /**
   * Get the current active storage (if initialized)
   * This is useful for direct storage operations if needed
   */
  export function getKindeStorage(): SessionManager | null {
    return getActiveStorage();
  }
  
  // Re-export commonly used js-utils functions for convenience
  export { 
    StorageKeys,
    getUserProfile,
    getPermissions,
    isAuthenticated,
    setActiveStorage,
    getActiveStorage,
    generateRandomString,
    generateAuthUrl,
    exchangeAuthCode,
    frameworkSettings
  } from '@kinde/js-utils';