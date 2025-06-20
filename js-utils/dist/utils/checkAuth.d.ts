import { RefreshTokenResult } from '../main';
export declare const checkAuth: ({ domain, clientId, }: {
    domain: string;
    clientId: string;
}) => Promise<RefreshTokenResult>;
