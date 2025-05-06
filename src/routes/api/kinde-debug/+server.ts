// src/routes/api/kinde-debug/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET(event: RequestEvent) {
  // Only allow in development for security
  if (import.meta.env.PROD) {
    return json({ error: 'Not available in production' }, { status: 403 });
  }
  
  try {
    const platform = event.platform as any;
    const env = platform?.env;
    const AUTH_STORAGE = env?.AUTH_STORAGE;
    
    if (!AUTH_STORAGE) {
      return json({ error: 'KV storage not available' }, { status: 500 });
    }
    
    // List all keys with the kinde prefix
    const keys = await AUTH_STORAGE.list({ prefix: 'kinde:' });
    
    // Get values for each key
    const values = await Promise.all(
      keys.keys.map(async (k) => {
        const value = await AUTH_STORAGE.get(k.name);
        return { key: k.name, value };
      })
    );
    
    return json({
      success: true,
      keys: keys.keys.map(k => k.name),
      values
    });
  } catch (error) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}