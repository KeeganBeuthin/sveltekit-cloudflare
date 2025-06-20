import { RefreshTokenResult, RefreshType } from '../../main';
/**
 * refreshes the token
 * @returns { Promise<boolean> }
 */
export declare const refreshToken: ({ domain, clientId, refreshType, onRefresh, }: {
    domain: string;
    clientId: string;
    refreshType?: RefreshType;
    onRefresh?: (data: RefreshTokenResult) => void;
}) => Promise<RefreshTokenResult>;
