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
 * Debug wrapper around KvStorage to trace operations
 */
class DebugKvStorage extends KvStorage {
  constructor(kvNamespace: any, options?: { defaultTtl?: number }) {
    super(kvNamespace, options);
    console.log('🔧 DebugKvStorage instance created');
  }

  async setSessionItem(itemKey: any, itemValue: unknown): Promise<void> {
    console.log(`🔧 KvStorage.setSessionItem called: ${itemKey}`, typeof itemValue);
    try {
      const result = await super.setSessionItem(itemKey, itemValue);
      console.log(`✅ KvStorage.setSessionItem completed: ${itemKey}`);
      return result;
    } catch (error) {
      console.error(`❌ KvStorage.setSessionItem failed: ${itemKey}`, error);
      throw error;
    }
  }

  async getSessionItem(itemKey: any): Promise<unknown | null> {
    console.log(`🔧 KvStorage.getSessionItem called: ${itemKey}`);
    try {
      const result = await super.getSessionItem(itemKey);
      console.log(`🔧 KvStorage.getSessionItem result: ${itemKey} =`, result ? 'found' : 'null');
      return result;
    } catch (error) {
      console.error(`❌ KvStorage.getSessionItem failed: ${itemKey}`, error);
      throw error;
    }
  }

  async setItems(items: Record<string, unknown>): Promise<void> {
    console.log('🔧 KvStorage.setItems called with:', Object.keys(items));
    try {
      // Force sequential completion to ensure all items are stored
      for (const [key, value] of Object.entries(items)) {
        await this.setSessionItem(key, value);
      }
      console.log('✅ KvStorage.setItems completed successfully');
    } catch (error) {
      console.error('❌ KvStorage.setItems failed:', error);
      throw error;
    }
  }
}

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
    
    console.log('🔍 Platform debug:', {
      platformExists: !!platform,
      envExists: !!platform?.env,
      envKeys: platform?.env ? Object.keys(platform.env) : 'no env',
      authStorageType: platform?.env?.AUTH_STORAGE ? typeof platform.env.AUTH_STORAGE : 'missing'
    });
    
    const AUTH_STORAGE = platform?.env?.AUTH_STORAGE;
    
    if (!AUTH_STORAGE) {
      console.error('❌ KV storage not available for token storage');
      console.error('Available env vars:', platform?.env ? Object.keys(platform.env) : 'no platform.env');
      return false;
    }
    
    console.log('✅ AUTH_STORAGE found:', typeof AUTH_STORAGE);
    
    // Use debug wrapper to trace KV operations
    const tokenStorage = new DebugKvStorage(AUTH_STORAGE, { defaultTtl: 3600 });
    
    // Cookie Storage: Temporary OAuth data (immediate consistency required)
    const cookieAdapter = createSvelteKitCookieAdapter(event);
    const tempStorage = new CookieStorage(cookieAdapter);
    
    setActiveStorage(tokenStorage);     // Long-term tokens
    setInsecureStorage(tempStorage);    // Temporary OAuth data
    
    console.log('✅ Hybrid storage initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing hybrid storage:', error);
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