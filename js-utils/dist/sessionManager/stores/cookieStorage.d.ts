import { SessionBase, StorageKeys, SessionManager } from '../types.js';
/**
 * Cookie adapter interface for framework-agnostic cookie operations
 */
export interface CookieAdapter {
    set(name: string, value: string, options?: CookieOptions): void;
    get(name: string): string | undefined | null;
    delete(name: string, options?: CookieOptions): void;
}
/**
 * Cookie options interface matching common cookie attributes
 */
export interface CookieOptions {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
    expires?: Date;
    path?: string;
    domain?: string;
}
/**
 * Provides a cookie-based session manager implementation for server-side environments.
 * Designed for temporary data that requires immediate consistency (OAuth state, nonce, etc.)
 *
 * @class CookieStorage
 */
export declare class CookieStorage<V extends string = StorageKeys> extends SessionBase<V> implements SessionManager<V> {
    private cookieAdapter;
    private defaultOptions;
    private maxChunkSize;
    constructor(cookieAdapter: CookieAdapter, options?: {
        defaultOptions?: Partial<CookieOptions>;
        maxChunkSize?: number;
    });
    /**
     * Clears all items from cookie storage.
     * Note: This removes all cookies with the configured key prefix
     * @returns {Promise<void>}
     */
    destroySession(): Promise<void>;
    /**
     * Sets the provided key-value pair to cookie storage.
     * Large values are automatically chunked across multiple cookies.
     * @param {V | StorageKeys} itemKey
     * @param {unknown} itemValue
     * @returns {Promise<void>}
     */
    setSessionItem(itemKey: V | StorageKeys, itemValue: unknown): Promise<void>;
    /**
     * Gets the item for the provided key from cookie storage.
     * Automatically reconstructs chunked values.
     * @param {V | StorageKeys} itemKey
     * @returns {Promise<unknown | null>}
     */
    getSessionItem(itemKey: V | StorageKeys): Promise<unknown | null>;
    /**
     * Removes the item for the provided key from cookie storage.
     * Removes all chunks associated with the key.
     * @param {V | StorageKeys} itemKey
     * @returns {Promise<void>}
     */
    removeSessionItem(itemKey: V | StorageKeys): Promise<void>;
    /**
     * Updates the default cookie options for future operations
     * @param options - Partial cookie options to merge with current defaults
     */
    setDefaultOptions(options: Partial<CookieOptions>): void;
    /**
     * Gets the current default cookie options
     */
    getDefaultOptions(): CookieOptions;
    /**
     * Gets the maximum chunk size used for splitting large values
     */
    getMaxChunkSize(): number;
}
/**
 * Helper function to create a generic cookie adapter from common cookie interfaces
 */
export declare function createGenericCookieAdapter(getCookie: (name: string) => string | undefined | null, setCookie: (name: string, value: string, options?: CookieOptions) => void, deleteCookie: (name: string, options?: CookieOptions) => void): CookieAdapter;
