import { RefreshTokenResult, StorageKeys } from '../main';
export declare const frameworkSettings: {
    framework: string;
    frameworkVersion: string;
    sdkVersion: string;
};
interface ExchangeAuthCodeParams {
    urlParams: URLSearchParams;
    domain: string;
    clientId: string;
    redirectURL: string;
    autoRefresh?: boolean;
    onRefresh?: (data: RefreshTokenResult) => void;
}
type ExchangeAuthCodeResultSuccess = {
    success: true;
    error?: never;
    [StorageKeys.accessToken]?: string;
    [StorageKeys.idToken]?: string;
    [StorageKeys.refreshToken]?: string;
};
type ExchangeAuthCodeResultError = {
    success: false;
    error: string;
    [StorageKeys.accessToken]?: never;
    [StorageKeys.idToken]?: never;
    [StorageKeys.refreshToken]?: never;
};
type ExchangeAuthCodeResult = ExchangeAuthCodeResultSuccess | ExchangeAuthCodeResultError;
export declare const exchangeAuthCode: ({ urlParams, domain, clientId, redirectURL, autoRefresh, onRefresh, }: ExchangeAuthCodeParams) => Promise<ExchangeAuthCodeResult>;
export {};
