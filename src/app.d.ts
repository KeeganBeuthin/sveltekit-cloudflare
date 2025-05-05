// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			getUser: () => Promise<User | null>;
			isAuthenticated: () => Promise<boolean>;
			getBooleanFlag: (flagName: string, defaultValue?: boolean) => Promise<boolean>;
			getNumberFlag: (flagName: string, defaultValue?: number) => Promise<number>;
			getStringFlag: (flagName: string, defaultValue?: string) => Promise<string>;
			getOrganization: () => Promise<Organization | null>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
