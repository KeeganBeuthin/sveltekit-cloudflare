/**
 *
 * @param keyName key to get from the token
 * @returns { Promise<string | number | string[] | null> }
 */
export declare const getFlag: <T = string | boolean | number | object>(name: string) => Promise<T | null>;
