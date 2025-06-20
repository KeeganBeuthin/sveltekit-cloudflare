import { JWTDecoded } from '@kinde/jwt-decoder';
/**
 *
 * @param keyName key to get from the token
 * @param {("accessToken"|"idToken")} [tokenType="accessToken"] - Type of token to get claims from
 * @returns { Promise<string | number | string[] | null> }
 */
export declare const getClaim: <T = JWTDecoded, V = string | number | string[]>(keyName: keyof T, tokenType?: "accessToken" | "idToken") => Promise<{
    name: keyof T;
    value: V;
} | null>;
