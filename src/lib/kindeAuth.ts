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
      
      // KV Storage: Perfect for tokens (eventual consistency is fine)
      const tokenStorage = new KvStorage(AUTH_STORAGE, { defaultTtl: 3600 });
      
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

// Custom debug KV storage class with timeout handling
class DebugKvStorage extends KvStorage {
  constructor(kvNamespace: any, options?: { defaultTtl?: number }) {
    super(kvNamespace, options);
  }

  // Helper function to add timeout to KV operations
  private async withTimeout<T>(operation: Promise<T>, timeoutMs: number = 5000, operationName: string): Promise<T> {
    return Promise.race([
      operation,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  async setSessionItem(itemKey: any, itemValue: any): Promise<void> {
    console.log(`=== SETTING ITEM: ${itemKey} ===`);
    console.log('Value:', itemValue);
    console.log('Value type:', typeof itemValue);
    
    try {
      if (typeof itemValue === "string") {
        console.log('Storing as string...');
        const key = `${storageSettings.keyPrefix}${String(itemKey)}0`;
        console.log('Storage key:', key);
        console.log('TTL:', this.getDefaultTtl());
        console.log('About to call kvNamespace.put...');
        
        // Add timeout to the put operation
        await this.withTimeout(
          (this as any).kvNamespace.put(
            key,
            itemValue,
            { expirationTtl: this.getDefaultTtl() }
          ),
          5000,
          `PUT ${key}`
        );
        
        console.log('Put operation completed successfully!');
      } else {
        console.log('Storing as non-string...');
        const value = typeof itemValue === 'object' 
          ? JSON.stringify(itemValue) 
          : String(itemValue);
        const key = `${storageSettings.keyPrefix}${String(itemKey)}0`;
        console.log('Storage key:', key);
        console.log('Converted value:', value);
        
        await this.withTimeout(
          (this as any).kvNamespace.put(
            key,
            value,
            { expirationTtl: this.getDefaultTtl() }
          ),
          5000,
          `PUT ${key}`
        );
        
        console.log('Put operation completed successfully!');
      }
      
      console.log(`=== ITEM SET SUCCESSFULLY: ${itemKey} ===`);
      
      // Wait a bit and then test retrieval
      console.log('Waiting 100ms before retrieval test...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const retrieved = await this.getSessionItem(itemKey);
      console.log(`=== IMMEDIATE RETRIEVAL TEST: ${itemKey} ===`);
      console.log('Retrieved value:', retrieved);
      console.log('Values match:', retrieved === itemValue);
      
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      console.error(`=== ERROR SETTING ITEM ${itemKey}:`, error);
      console.error('Error name:', errorInfo.name);
      console.error('Error message:', errorInfo.message);
      throw error;
    }
  }

  async getSessionItem(itemKey: any): Promise<unknown | null> {
    console.log(`=== GETTING ITEM: ${itemKey} ===`);
    
    try {
      const key = `${storageSettings.keyPrefix}${String(itemKey)}0`;
      console.log('Lookup key:', key);
      console.log('About to call kvNamespace.get...');
      
      const value = await this.withTimeout(
        (this as any).kvNamespace.get(key),
        5000,
        `GET ${key}`
      );
      
      console.log('Get operation completed successfully!');
      console.log('Raw retrieved value:', value);
      console.log('Value type:', typeof value);
      
      return value;
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      console.error(`=== ERROR GETTING ITEM ${itemKey}:`, error);
      console.error('Error name:', errorInfo.name);
      console.error('Error message:', errorInfo.message);
      return null;
    }
  }
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