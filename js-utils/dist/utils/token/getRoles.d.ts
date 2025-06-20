export type Role = {
    id: string;
    name: string;
    key: string;
};
/**
 * Get all permissions
 * @returns { Promise<Role[]> }
 */
export declare const getRoles: () => Promise<Role[]>;
