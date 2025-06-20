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
/**
 * Provides a Cloudflare KV based session manager implementation for server-side environments.
 * @class KvStorage
 */
export declare class KvStorage<V extends string = StorageKeys> extends SessionBase<V> implements SessionManager<V> {
    private kvNamespace;
    private defaultTtl;
    constructor(kvNamespace: CloudflareKV, options?: {
        defaultTtl?: number;
    });
    /**
     * Clears all items from session store.
     * @returns {void}
     */
    destroySession(): Promise<void>;
    /**
     * Sets the provided key-value store to the KV storage.
     * @param {string} itemKey
     * @param {unknown} itemValue
     * @returns {void}
     */
    setSessionItem(itemKey: V | StorageKeys, itemValue: unknown): Promise<void>;
    /**
     * Gets the item for the provided key from the KV storage.
     * @param {string} itemKey
     * @returns {unknown | null}
     */
    getSessionItem(itemKey: V | StorageKeys): Promise<unknown | null>;
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
}
export {};
