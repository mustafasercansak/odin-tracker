/**
 * Retries a function with exponential backoff.
 * Useful for handling 429 (Rate Limit) errors from AI APIs.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // If it's a 429 error, wait and retry
      const isRateLimit = 
        error.message?.includes('429') || 
        error.message?.includes('quota') ||
        error.status === 429;
        
      if (isRateLimit && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`AI Rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If not a rate limit error or we're out of retries, throw
      throw error;
    }
  }
  
  throw lastError;
}
