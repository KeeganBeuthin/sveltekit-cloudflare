import { 
    KvStorage, 
    setActiveStorage,
    setInsecureStorage,
    getActiveStorage,
    getInsecureStorage,
    StorageKeys,
    storageSettings,
    type SessionManager
  } from '@kinde/js-utils';
  import type { RequestEvent } from '@sveltejs/kit';
  
  /**
   * Debug wrapper around KvStorage to trace method calls
   */
  class DebugKvStorage extends KvStorage {
    constructor(kvNamespace: any, options?: { defaultTtl?: number }) {
      super(kvNamespace, options);
      console.log('🔧 DebugKvStorage instance created');
    }

    async setSessionItem(itemKey: any, itemValue: unknown): Promise<void> {
      console.log(`🔧 KvStorage.setSessionItem called: ${itemKey}`, typeof itemValue);
      return super.setSessionItem(itemKey, itemValue);
    }

    async getSessionItem(itemKey: any): Promise<unknown | null> {
      console.log(`🔧 KvStorage.getSessionItem called: ${itemKey}`);
      const result = await super.getSessionItem(itemKey);
      console.log(`🔧 KvStorage.getSessionItem result: ${itemKey} =`, result ? 'found' : 'null');
      return result;
    }

    async setItems(items: Record<string, unknown>): Promise<void> {
      console.log('🔧 KvStorage.setItems called with:', Object.keys(items));
      return super.setItems(items);
    }

    async removeItems(...items: StorageKeys[]): Promise<void> {
      console.log('🔧 KvStorage.removeItems called with:', items);
      return super.removeItems(...items);
    }
  }
  
  /**
   * Cookie-based storage for temporary OAuth data that requires immediate consistency
   * Used for: state, nonce, codeVerifier (short-lived, consistency-critical)
   */
  class ImmediateStorage implements SessionManager {
    constructor(private event: RequestEvent) {}
    
    async setSessionItem(key: string, value: unknown): Promise<void> {
      const cookieValue = typeof value === 'string' ? value : JSON.stringify(value);
      this.event.cookies.set(`kinde_${key}`, cookieValue, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 900, // 15 minutes - enough for OAuth flow
        path: '/'
      });
    }
    
    async getSessionItem(key: string): Promise<unknown | null> {
      return this.event.cookies.get(`kinde_${key}`) || null;
    }
    
    async removeSessionItem(key: string): Promise<void> {
      this.event.cookies.delete(`kinde_${key}`, { path: '/' });
    }
    
    async setItems(items: Record<string, unknown>): Promise<void> {
      for (const [key, value] of Object.entries(items)) {
        await this.setSessionItem(key, value);
      }
    }
    
    async removeItems(...keys: string[]): Promise<void> {
      for (const key of keys) {
        await this.removeSessionItem(key);
      }
    }
    
    async destroySession(): Promise<void> {
      // Clean up OAuth temporary data
      await this.removeItems(StorageKeys.state, StorageKeys.nonce, StorageKeys.codeVerifier);
    }
  }
  
  /**
   * Initialize hybrid storage strategy:
   * - KV: Long-term tokens (accessToken, idToken, refreshToken)
   * - Cookies: Temporary OAuth data (state, nonce, codeVerifier)
   */
  export function initializeKindeAuth(event: RequestEvent): boolean {
    try {
      const platform = event.platform as any;
      const AUTH_STORAGE = platform?.env?.AUTH_STORAGE;
      
      if (!AUTH_STORAGE) {
        console.error('KV storage not available for token storage');
        return false;
      }
      
      // Use debug wrapper to trace KV calls
      const tokenStorage = new DebugKvStorage(AUTH_STORAGE, { defaultTtl: 3600 });
      
      // Cookie Storage: Perfect for OAuth temp data (immediate consistency required)
      const tempStorage = new ImmediateStorage(event);
      
      console.log('Hybrid storage initialized: KV for tokens, cookies for OAuth temp data');
      
      setActiveStorage(tokenStorage);     // Long-term tokens
      setInsecureStorage(tempStorage);    // Temporary OAuth data
      
      return true;
    } catch (error) {
      console.error('Error initializing hybrid storage:', error);
      return false;
    }
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

  // Helper function to safely extract error information
  function getErrorInfo(error: unknown): { name: string; message: string } {
    if (error instanceof Error) {
      return { name: error.name, message: error.message };
    }
    return { name: 'Unknown', message: String(error) };
  }

  async function testKvDirectly(kv: any) {
    console.log('=== TESTING KV DIRECTLY ===');
    try {
      console.log('Testing direct KV put...');
      await kv.put('test-direct-key', 'test-direct-value', { expirationTtl: 60 });
      console.log('Direct KV put completed!');
      
      console.log('Testing direct KV get...');
      const value = await kv.get('test-direct-key');
      console.log('Direct KV get result:', value);
      
      console.log('Testing direct KV delete...');
      await kv.delete('test-direct-key');
      console.log('Direct KV delete completed!');
      
    } catch (error) {
      console.error('Direct KV test failed:', error);
    }
    console.log('=== KV DIRECT TEST COMPLETE ===');
  }

class CookieStorage implements SessionManager {
  constructor(private event: RequestEvent) {}
  
  async setSessionItem(key: string, value: unknown): Promise<void> {
    const cookieValue = typeof value === 'string' ? value : JSON.stringify(value);
    const cookieName = `kinde_${key}`;
    
    console.log(`Setting cookie ${cookieName} = ${cookieValue}`);
    
    this.event.cookies.set(cookieName, cookieValue, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 900, // 15 minutes
      path: '/', // Ensure path is correct
      // Don't set domain - let it default to current domain
    });
    
    // Verify cookie was set
    const verified = this.event.cookies.get(cookieName);
    console.log(`Cookie ${cookieName} verification:`, verified);
  }
  
  async getSessionItem(key: string): Promise<unknown | null> {
    const cookieName = `kinde_${key}`;
    const value = this.event.cookies.get(cookieName);
    console.log(`Getting cookie ${cookieName} = ${value}`);
    return value || null;
  }
  
  async removeSessionItem(key: string): Promise<void> {
    this.event.cookies.delete(`kinde_${key}`, { path: '/' });
  }
  
  async setItems(items: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      await this.setSessionItem(key, value);
    }
  }
  
  async removeItems(...keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.removeSessionItem(key);
    }
  }
  
  async destroySession(): Promise<void> {
    // Clean up OAuth temporary data
    await this.removeItems(StorageKeys.state, StorageKeys.nonce, StorageKeys.codeVerifier);
  }
}