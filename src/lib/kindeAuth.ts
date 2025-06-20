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
    
    if (!AUTH_STORAGE) {
      console.error('KV storage not available for Kinde authentication');
      return false;
    }
    
    try {
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

// Custom debug KV storage class
class DebugKvStorage extends KvStorage {
  constructor(kvNamespace: any, options?: { defaultTtl?: number }) {
    super(kvNamespace, options);
  }

  async setSessionItem(itemKey: any, itemValue: any): Promise<void> {
    console.log(`=== SETTING ITEM: ${itemKey} ===`);
    console.log('Value:', itemValue);
    console.log('Value type:', typeof itemValue);
    
    try {
      // Skip the removeSessionItem call for debugging
      // Let's directly store the value to see if that works
      
      if (typeof itemValue === "string") {
        console.log('Storing as string...');
        const key = `${storageSettings.keyPrefix}${String(itemKey)}0`;
        console.log('Storage key:', key);
        console.log('TTL:', this.getDefaultTtl());
        
        await (this as any).kvNamespace.put(
          key,
          itemValue,
          { expirationTtl: this.getDefaultTtl() }
        );
        console.log('Put operation completed');
      } else {
        console.log('Storing as non-string...');
        const value = typeof itemValue === 'object' 
          ? JSON.stringify(itemValue) 
          : String(itemValue);
        const key = `${storageSettings.keyPrefix}${String(itemKey)}0`;
        console.log('Storage key:', key);
        console.log('Converted value:', value);
        
        await (this as any).kvNamespace.put(
          key,
          value,
          { expirationTtl: this.getDefaultTtl() }
        );
        console.log('Put operation completed');
      }
      
      console.log(`=== ITEM SET SUCCESSFULLY: ${itemKey} ===`);
      
      // Immediately test retrieval
      const retrieved = await this.getSessionItem(itemKey);
      console.log(`=== IMMEDIATE RETRIEVAL TEST: ${itemKey} ===`);
      console.log('Retrieved value:', retrieved);
      console.log('Values match:', retrieved === itemValue);
      
    } catch (error) {
      console.error(`=== ERROR SETTING ITEM ${itemKey}:`, error);
      throw error;
    }
  }

  async getSessionItem(itemKey: any): Promise<unknown | null> {
    console.log(`=== GETTING ITEM: ${itemKey} ===`);
    
    try {
      const key = `${storageSettings.keyPrefix}${String(itemKey)}0`;
      console.log('Lookup key:', key);
      
      const value = await (this as any).kvNamespace.get(key);
      console.log('Raw retrieved value:', value);
      console.log('Value type:', typeof value);
      
      return value;
    } catch (error) {
      console.error(`=== ERROR GETTING ITEM ${itemKey}:`, error);
      return null;
    }
  }
}