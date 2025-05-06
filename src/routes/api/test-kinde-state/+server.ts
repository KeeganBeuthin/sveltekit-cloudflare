// src/routes/api/test-kinde-state/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createKindeStorage } from '$lib/kindeCloudflareStorage';

export async function GET(event: RequestEvent) {
  const storage = createKindeStorage(event);
  
  if (!storage) {
    return json({
      success: false,
      message: 'Kinde storage adapter not available'
    }, { status: 500 });
  }
  
  // Generate a random state for testing
  const testState = 'test-state-' + Math.random().toString(36).substring(2);
  const testData = {
    codeVerifier: 'test-code-verifier',
    timestamp: Date.now()
  };
  
  try {
    // Write state
    const saveResult = await storage.setState(testState, testData);
    
    // Read state
    const retrievedState = await storage.getState(testState);
    
    // Clean up
    const deleteResult = await storage.deleteState(testState);
    
    return json({
      success: true,
      message: 'Kinde state storage test successful',
      saveResult,
      retrievedState,
      deleteResult,
      dataMatches: JSON.stringify(retrievedState) === JSON.stringify(testData)
    });
  } catch (error) {
    return json({
      success: false,
      message: 'Kinde state storage test failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}