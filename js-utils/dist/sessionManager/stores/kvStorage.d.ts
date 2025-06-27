import { SessionBase, StorageKeys, SessionManager } from '../types.js';
interface CloudflareKV {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, options?: {
        expirationTtl?: number;
    }): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: {
        prefix?: string;
    }): Promise<{
        keys: Array<{
            name: string;
        }>;
    }>;
}
interface KvStorageOptions {
    defaultTtl?: number;
    enableConsistencyChecks?: boolean;
    consistencyRetries?: number;
    consistencyDelayMs?: number;
}
/**
 * Provides a Cloudflare KV based session manager implementation for server-side environments.
 * Includes built-in eventual consistency handling for reliable operations.
 * @class KvStorage
 */
export declare class KvStorage<V extends string = StorageKeys> extends SessionBase<V> implements SessionManager<V> {
    private kvNamespace;
    private defaultTtl;
    private enableConsistencyChecks;
    private consistencyRetries;
    private consistencyDelayMs;
    constructor(kvNamespace: CloudflareKV, options?: KvStorageOptions);
    /**
     * Clears all items from session store.
     * @returns {void}
     */
    destroySession(): Promise<void>;
    /**
     * Sets the provided key-value store to the KV storage with optional consistency verification.
     */
    setSessionItem(itemKey: V | StorageKeys, itemValue: unknown): Promise<void>;
    /**
     * Gets the item for the provided key from the KV storage with retry logic for eventual consistency.
     */
    getSessionItem(itemKey: V | StorageKeys): Promise<unknown | null>;
    /**
     * Internal method to get session item without retries
     */
    private _getSessionItemOnce;
    /**
     * Waits for write consistency by verifying the written value can be read back
     */
    private waitForConsistency;
    /**
     * Utility method for delays
     */
    private delay;
    /**
     * Sets multiple items with consistency verification
     */
    setItems(items: Record<string, unknown>): Promise<void>;
    /**
     * Removes the item for the provided key from the KV storage.
     * @param {string} itemKey
     * @returns {void}
     */
    removeSessionItem(itemKey: V | StorageKeys): Promise<void>;
    /**
     * Updates the TTL for stored items (KV-specific method)
     * @param ttl - Time to live in seconds
     */
    setDefaultTtl(ttl: number): void;
    /**
     * Gets the current default TTL
     */
    getDefaultTtl(): number;
    /**
     * Configure consistency behavior
     */
    setConsistencyOptions(options: {
        enabled?: boolean;
        retries?: number;
        delayMs?: number;
    }): void;
    /**
     * Get current consistency settings
     */
    getConsistencyOptions(): {
        enabled: boolean;
        retries: number;
        delayMs: number;
    };
}
export {};
