// src/routes/api/test-kv/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET(event: RequestEvent) {
  const testKey = 'test-key';
  const testValue = 'test-value';
  
  try {
    // Check if platform and AUTH_STORAGE exist
    if (!event.platform) {
      return json({
        success: false,
        message: 'KV test failed',
        error: 'Platform is undefined'
      }, { status: 500 });
    }
    
    // Type assertion for Cloudflare environment
    const env = event.platform.env as any;
    
    if (!env || !env.AUTH_STORAGE) {
      return json({
        success: false,
        message: 'KV test failed',
        error: 'AUTH_STORAGE is undefined'
      }, { status: 500 });
    }
    
    // Write to KV
    await env.AUTH_STORAGE.put(testKey, testValue);
    
    // Read from KV
    const readValue = await env.AUTH_STORAGE.get(testKey);
    
    return json({
      success: true,
      message: 'KV test successful',
      value: readValue,
      matches: readValue === testValue
    });
  } catch (error) {
    return json({
      success: false,
      message: 'KV test failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}