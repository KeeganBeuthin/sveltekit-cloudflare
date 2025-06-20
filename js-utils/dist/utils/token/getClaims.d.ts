import { JWTDecoded } from '@kinde/jwt-decoder';
/**
 * get all claims from the token
 * @param {("accessToken"|"idToken")} [tokenType="accessToken"] - Type of token to get claims from
 * @returns { Promise<T | null> }
 */
export declare const getClaims: <T = JWTDecoded>(tokenType?: "accessToken" | "idToken") => Promise<T | null>;
