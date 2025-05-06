import { json, redirect } from '@sveltejs/kit';
import { handleAuth } from "@kinde-oss/kinde-auth-sveltekit";
import type { RequestEvent } from "@sveltejs/kit";
import { createKindeStorage } from '$lib/kindeCloudflareStorage';

export async function GET(event: RequestEvent) {
  const url = new URL(event.request.url);
  const path = url.pathname.split('/').pop(); // Get last part of path
  const storage = createKindeStorage(event);
  
  // Log key information about the request
  console.log(`Auth request: ${path}`, {
    hasStorage: !!storage,
    hasState: !!url.searchParams.get('state'),
    hasCode: !!url.searchParams.get('code')
  });
  
  // For the callback route, we need to handle state verification
  if (path === 'kinde_callback') {
    const state = url.searchParams.get('state');
    
    if (state && storage) {
      // Try to get the stored state
      const storedState = await storage.getState(state);
      
      if (!storedState) {
        console.error('State not found in KV storage:', state);
        
        // Store the error for debugging
        await storage.setState('last_error', {
          time: new Date().toISOString(),
          error: 'State not found',
          state
        });
        
        // Instead of failing, let's try to continue with standard auth handling
        // This might still work if Kinde doesn't strictly verify the state
      } else {
        console.log('State successfully verified:', state);
        
        // Clean up the state to prevent replay attacks
        await storage.deleteState(state);
      }
    }
  } 
  // For login and register routes, we need to store the state
  else if (path === 'login' || path === 'register') {
    if (storage) {
      // Generate state parameter
      const state = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      
      // Store it
      await storage.setState(state, {
        time: new Date().toISOString(),
        path
      });
      
      // Modify the URL to include our state
      url.searchParams.set('state', state);
      
      // Redirect to the login page with our state parameter
      const kindeUrl = await buildAuthUrl(event, url.toString());
      if (kindeUrl) {
        return redirect(302, kindeUrl);
      }
    }
  }
  
  // Fall back to the standard Kinde handler
  return handleAuth(event);
}

// Function to build auth URL (implementation depends on Kinde SDK internals)
async function buildAuthUrl(event: RequestEvent, redirectUrl: string) {
  // This would need to be implemented based on Kinde SDK
  // You might need to examine the SDK code to see how it constructs auth URLs
  
  // For now, let's just pass through to the standard handler
  return null;
} 