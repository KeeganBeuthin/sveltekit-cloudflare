import { kindeAuthClient, type SessionManager } from '@kinde-oss/kinde-auth-sveltekit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ request }) => {
  const isAuthenticated = await kindeAuthClient.isAuthenticated(
    request as unknown as SessionManager
  );
  
  let user = null;
  if (isAuthenticated) {
    user = await kindeAuthClient.getUser(request as unknown as SessionManager);
  }
  
  return {
    isAuthenticated,
    user
  };
}; 