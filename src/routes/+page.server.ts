import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const isAuthenticated = await locals.isAuthenticated();
	
	if (isAuthenticated) {
		const user = await locals.getUser();
		return { user };
	}
	
	return { user: null };
}; 