// src/routes/api/debug/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createKindeStorage } from '$lib/kindeCloudflareStorage';

export async function GET(event: RequestEvent) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG) {
    return json({ error: 'Debug endpoint not available in production' }, { status: 403 });
  }
  
  const storage = createKindeStorage(event);
  
  if (!storage) {
    return json({ error: 'Storage not available' }, { status: 500 });
  }
  
  try {
    // Get stored debug info
    const tokens = await storage.getState('tokens');
    const lastError = await storage.getState('last_error');
    const tokenError = await storage.getState('token_error');
    
    return json({
      hasTokens: !!tokens,
      tokenInfo: tokens ? {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        hasIdToken: !!tokens.id_token,
        expiresIn: tokens.expires_in,
        timestamp: tokens.timestamp
      } : null,
      lastError,
      tokenError
    });
  } catch (error) {
    return json({ 
      error: 'Failed to fetch debug info',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}