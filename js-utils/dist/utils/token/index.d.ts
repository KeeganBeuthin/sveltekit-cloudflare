import { SessionManager } from '../../sessionManager';
export { getClaim } from './getClaim';
export { getClaims } from './getClaims';
export { getCurrentOrganization } from './getCurrentOrganization';
export { getDecodedToken } from './getDecodedToken';
export { getRawToken } from './getRawToken';
export { getFlag } from './getFlag';
export { getUserProfile } from './getUserProfile';
export type { UserProfile } from './getUserProfile';
export { getPermission } from './getPermission';
export type { PermissionAccess } from './getPermission';
export { getPermissions } from './getPermissions';
export type { Permissions } from './getPermissions';
export { getUserOrganizations } from './getUserOrganizations';
export { getRoles } from './getRoles';
export type { Role } from './getRoles';
export { isAuthenticated } from './isAuthenticated';
export { refreshToken } from './refreshToken';
/**
 * Sets the active storage
 * @param store Session manager instance
 */
export declare const setActiveStorage: (store: SessionManager) => void;
/**
 * Gets the current active storage
 * @returns Session manager instance or null
 */
export declare const getActiveStorage: () => SessionManager | null;
/**
 * Checks if there is an active storage
 * @returns boolean
 */
export declare const hasActiveStorage: () => boolean;
/**
 * Clears the active storage
 */
export declare const clearActiveStorage: () => void;
/**
 * Sets the active storage
 * @param store Session manager instance
 */
export declare const setInsecureStorage: (store: SessionManager) => void;
/**
 * Gets the current active storage
 * @returns Session manager instance or null
 */
export declare const getInsecureStorage: () => SessionManager | null;
/**
 * Checks if there is an active storage
 * @returns boolean
 */
export declare const hasInsecureStorage: () => boolean;
/**
 * Clears the active storage
 */
export declare const clearInsecureStorage: () => void;
