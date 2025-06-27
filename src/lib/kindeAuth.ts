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
    
    // Store all items individually with proper error handling
    const promises = Object.entries(items).map(async ([key, value]) => {
      try {
        await this.setSessionItem(key, value);
        return { key, success: true };
      } catch (error) {
        console.error(`❌ Failed to store ${key}:`, error);
        return { key, success: false, error };
      }
    });

    try {
      // Wait for all storage operations to complete
      const results = await Promise.allSettled(promises);
      
      const successes = results
        .filter((r): r is PromiseFulfilledResult<{key: string, success: boolean}> => 
          r.status === 'fulfilled' && r.value.success
        )
        .map(r => r.value.key);
        
      const failures = results
        .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
        .map(r => r.status === 'fulfilled' ? r.value.key : 'unknown');

      console.log('✅ KvStorage.setItems completed:', {
        successful: successes,
        failed: failures,
        total: Object.keys(items).length
      });

      if (failures.length > 0) {
        console.warn('⚠️ Some items failed to store:', failures);
      }
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
    const AUTH_STORAGE = platform?.env?.AUTH_STORAGE;
    
    if (!AUTH_STORAGE) {
      console.error('❌ KV storage not available');
      return false;
    }
    
    // KvStorage now handles eventual consistency automatically
    const tokenStorage = new KvStorage(AUTH_STORAGE, { 
      defaultTtl: 3600,
      enableConsistencyChecks: true,  // Enable for reliable auth flows
      consistencyRetries: 3,
      consistencyDelayMs: 250
    });
    
    const cookieAdapter = createSvelteKitCookieAdapter(event);
    const tempStorage = new CookieStorage(cookieAdapter);
    
    setActiveStorage(tokenStorage);
    setInsecureStorage(tempStorage);
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing auth:', error);
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