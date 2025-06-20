import { IssuerRouteTypes, LoginOptions } from '../types';
interface generateAuthUrlConfig {
    disableUrlSanitization: boolean;
}
/**
 *
 * @param options
 * @param type
 * @returns URL to redirect to
 */
export declare const generateAuthUrl: (domain: string, type: IssuerRouteTypes | undefined, loginOptions: LoginOptions, config?: generateAuthUrlConfig) => Promise<{
    url: URL;
    state: string;
    nonce: string;
    codeChallenge: string;
    codeVerifier: string;
}>;
export declare function generatePKCEPair(): Promise<{
    codeVerifier: string;
    codeChallenge: string;
}>;
export {};
