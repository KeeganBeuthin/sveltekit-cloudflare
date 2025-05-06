import { sessionHooks, type Handler } from '@kinde-oss/kinde-auth-sveltekit';
import { createKindeStorage } from '$lib/kindeCloudflareStorage';

export const handle: Handler = async ({ event, resolve }) => {
  const storage = createKindeStorage(event);
  
  // Log information for debugging
  console.log('Kinde hooks:', {
    hasStorage: !!storage,
    url: event.url.pathname
  });
  
  // Initialize Kinde session hooks
  sessionHooks({ 
    event,
    // Pass custom storage if we have it
    ...(storage ? { storage } : {})
  });
  
  const response = await resolve(event);
  return response;
};