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
 * Initialize hybrid storage strategy for Kinde authentication
 * - KV Storage: Long-term tokens (eventual consistency acceptable)
 * - Cookie Storage: Temporary OAuth data (immediate consistency required)
 */
export function initializeKindeAuth(event: RequestEvent): boolean {
  try {
    const platform = event.platform as any;
    const AUTH_STORAGE = platform?.env?.AUTH_STORAGE;
    
    if (!AUTH_STORAGE) {
      return false;
    }
    
    // KV Storage for tokens with enhanced consistency handling
    const tokenStorage = new KvStorage(AUTH_STORAGE, { defaultTtl: 3600 });
    
    // Cookie Storage for temporary OAuth data
    const cookieAdapter = createSvelteKitCookieAdapter(event);
    const tempStorage = new CookieStorage(cookieAdapter);
    
    setActiveStorage(tokenStorage);
    setInsecureStorage(tempStorage);
    
    return true;
  } catch {
    return false;
  }
}

// Re-export js-utils functionality for convenience
export { 
  StorageKeys,
  getUserProfile,
  getPermissions,
  isAuthenticated,
  generateAuthUrl,
  exchangeAuthCode,
  frameworkSettings
} from '@kinde/js-utils';