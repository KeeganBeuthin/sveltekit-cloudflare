import { StorageKeys } from './sessionManager';
export * from './types';
export { base64UrlEncode, generateRandomString, extractAuthResults, sanitizeUrl, generateAuthUrl, mapLoginMethodParamsForUrl, exchangeAuthCode, checkAuth, isCustomDomain, setRefreshTimer, clearRefreshTimer, frameworkSettings, splitString, generateProfileUrl, generatePortalUrl, } from './utils';
export { getClaim, getClaims, getCurrentOrganization, getRawToken, getDecodedToken, getFlag, getUserProfile, getPermission, getPermissions, getUserOrganizations, getRoles, isAuthenticated, refreshToken, setActiveStorage, getActiveStorage, hasActiveStorage, clearActiveStorage, setInsecureStorage, getInsecureStorage, hasInsecureStorage, clearInsecureStorage, } from './utils/token';
export type { UserProfile, Permissions, Role, PermissionAccess, } from './utils/token';
export { storageSettings, MemoryStorage, KvStorage, ChromeStore, LocalStorage, StorageKeys, } from './sessionManager';
export declare const ExpoSecureStore: {
    __esModule: true;
    default: <V extends string = StorageKeys>() => Promise<typeof import('./sessionManager/stores/expoSecureStore.js').ExpoSecureStore<V>>;
};
export type { SessionManager } from './sessionManager';
