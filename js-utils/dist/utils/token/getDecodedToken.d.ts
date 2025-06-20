import { JWTDecoded as JWTBase } from '@kinde/jwt-decoder';
import { Role } from './getRoles';
/**
 *
 * @param tokenType Type of token to decode
 * @returns { Promise<JWTDecoded | null> }
 */
type JWTExtra = {
    "x-hasura-permissions": never;
    "x-hasura-org-code": never;
    "x-hasura-org-codes": never;
    "x-hasura-roles": never;
    "x-hasura-feature-flags": never;
    feature_flags: Record<string, {
        t: "b" | "i" | "s";
        v: string | boolean | number | object;
    }>;
    permissions: string[];
    org_code: string;
    org_codes: string[];
    roles: Role[];
};
type JWTExtraHasura = {
    "x-hasura-permissions": string[];
    "x-hasura-org-code": string;
    "x-hasura-org-codes": string[];
    "x-hasura-roles": Role[];
    "x-hasura-feature-flags": Record<string, {
        t: "b" | "i" | "s";
        v: string | boolean | number | object;
    }>;
    feature_flags: never;
    permissions: never;
    org_codes: never;
    org_code: never;
    roles: never;
};
type JWTDecoded = JWTBase & (JWTExtra | JWTExtraHasura);
export declare const getDecodedToken: <T = JWTDecoded>(tokenType?: "accessToken" | "idToken") => Promise<(T & JWTDecoded) | null>;
export {};
