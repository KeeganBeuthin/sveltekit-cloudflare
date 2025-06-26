import { 
  KvStorage, 
  CookieStorage,
  createGenericCookieAdapter,
  setActiveStorage,
  setInsecureStorage,
  type CookieAdapter
} from '@kinde/js-utils';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Creates a SvelteKit-compatible cookie adapter
 */
function createSvelteKitCookieAdapter(event: RequestEvent): CookieAdapter {
  return createGenericCookieAdapter(
    (name) => event.cookies.get(name),
    (name, value, options = {}) => {
      event.cookies.set(name, value, { path: '/', ...options });
    },
    (name, options = {}) => {
      event.cookies.delete(name, { path: '/', ...options });
    }
  );
}

/**
 * Initialize hybrid storage strategy using js-utils stores
 */
export function initializeKindeAuth(event: RequestEvent): boolean {
  try {
    const platform = event.platform as any;
    const AUTH_STORAGE = platform?.env?.AUTH_STORAGE;
    
    if (!AUTH_STORAGE) {
      console.error('KV storage not available for token storage');
      return false;
    }
    
    // KV Storage: Long-term tokens (eventual consistency acceptable)
    const tokenStorage = new KvStorage(AUTH_STORAGE, { defaultTtl: 3600 });
    
    // Cookie Storage: Temporary OAuth data (immediate consistency required)
    const cookieAdapter = createSvelteKitCookieAdapter(event);
    const tempStorage = new CookieStorage(cookieAdapter);
    
    setActiveStorage(tokenStorage);     // Long-term tokens
    setInsecureStorage(tempStorage);    // Temporary OAuth data
    
    return true;
  } catch (error) {
    console.error('Error initializing hybrid storage:', error);
    return false;
  }
}

// Re-export commonly used js-utils functions for convenience
export { 
  StorageKeys,
  getUserProfile,
  getPermissions,
  isAuthenticated,
  generateAuthUrl,
  exchangeAuthCode,
  frameworkSettings
} from '@kinde/js-utils';