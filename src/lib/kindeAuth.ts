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
   * Initialize Kinde authentication with KV storage for the current request
   * This sets up the global active storage that all js-utils token helpers will use
   */
  export function initializeKindeAuth(event: RequestEvent): boolean {
    const platform = event.platform as any;
    const env = platform?.env;
    const AUTH_STORAGE = env?.AUTH_STORAGE;
    
    console.log('=== INIT DEBUG ===');
    console.log('Platform:', !!platform);
    console.log('Env:', !!env);
    console.log('AUTH_STORAGE:', !!AUTH_STORAGE);
    console.log('AUTH_STORAGE type:', typeof AUTH_STORAGE);
    
    // Debug the KV namespace object
    if (AUTH_STORAGE) {
      console.log('KV methods available:', Object.getOwnPropertyNames(AUTH_STORAGE));
      console.log('KV prototype:', Object.getPrototypeOf(AUTH_STORAGE));
    }
    
    if (!AUTH_STORAGE) {
      console.error('KV storage not available for Kinde authentication');
      return false;
    }
    
    try {
      // Test basic KV operations directly first
      testKvDirectly(AUTH_STORAGE);
      
      // Use our debug storage class
      const storage = new DebugKvStorage(AUTH_STORAGE, { defaultTtl: 3600 });
      console.log('DebugKvStorage created successfully');
      
      setActiveStorage(storage);
      setInsecureStorage(storage);
      
      console.log('Storage set successfully');
      console.log('getActiveStorage():', !!getActiveStorage());
      console.log('getInsecureStorage():', !!getInsecureStorage());
      
      return true;
    } catch (error) {
      console.error('Error initializing KV storage:', error);
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