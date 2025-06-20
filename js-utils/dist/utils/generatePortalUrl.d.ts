import { GeneratePortalUrlParams, ProfilePage } from '../types';
/**
 * @deprecated This function is deprecated and will be removed in a future version.
 * Please use `generatePortalUrl` instead.
 */
export declare const generateProfileUrl: (params: {
    domain: string;
    returnUrl: string;
    subNav?: ProfilePage;
}) => Promise<{
    url: URL;
}>;
export declare function isAllowedReturnUrl(value: string, disallowedProtocols?: string[]): boolean;
/**
 * Generates a URL to the user profile portal
 *
 * @param {Object} options - Configuration options
 * @param {string} options.domain - The domain of the Kinde instance
 * @param {string} options.returnUrl - URL to redirect to after completing the profile flow
 * @param {PortalPage} options.subNav - Sub-navigation section to display
 * @returns {Promise<{url: URL}>} Object containing the URL to redirect to
 */
export declare const generatePortalUrl: ({ domain, returnUrl, subNav, }: GeneratePortalUrlParams) => Promise<{
    url: URL;
}>;
