/**
 * API Key Manager for rotating between multiple keys when quotas are exceeded
 */

class ApiKeyManager {
  private apiKeys: string[];
  private currentKeyIndex: number = 0;
  private keyQuotaStatus: Map<string, { exhausted: boolean; retryAfter: number }>;

  constructor() {
    // Initialize with your API keys
    this.apiKeys = [
      'AIzaSyCuG_p3v7qp0D5kfa_xNIhBw6T1dCE7q0o', // Original key
      'AIzaSyDBClycr-IQ2v2lLnk0-ZQz2eazqE7RByc', // Second key
    ];
    
    this.keyQuotaStatus = new Map();
    this.apiKeys.forEach(key => {
      this.keyQuotaStatus.set(key, { exhausted: false, retryAfter: 0 });
    });
  }

  /**
   * Get the current active API key
   */
  getCurrentKey(): string {
    // Check if current key's quota has recovered
    const currentKey = this.apiKeys[this.currentKeyIndex];
    const status = this.keyQuotaStatus.get(currentKey);
    
    if (status?.exhausted && Date.now() > status.retryAfter) {
      // Quota should have recovered, mark as available
      status.exhausted = false;
      console.log(`API key ${this.currentKeyIndex + 1} quota recovered`);
    }
    
    return currentKey;
  }

  /**
   * Mark current key as exhausted and switch to next available key
   * @param retryDelay - Delay in seconds before this key can be used again
   */
  markCurrentKeyExhausted(retryDelay: number = 60): string | null {
    const currentKey = this.apiKeys[this.currentKeyIndex];
    const status = this.keyQuotaStatus.get(currentKey);
    
    if (status) {
      status.exhausted = true;
      status.retryAfter = Date.now() + (retryDelay * 1000);
      console.log(`API key ${this.currentKeyIndex + 1} exhausted, retry after ${retryDelay}s`);
    }
    
    // Try to find an available key
    for (let i = 0; i < this.apiKeys.length; i++) {
      const nextIndex = (this.currentKeyIndex + 1 + i) % this.apiKeys.length;
      const nextKey = this.apiKeys[nextIndex];
      const nextStatus = this.keyQuotaStatus.get(nextKey);
      
      if (!nextStatus?.exhausted || Date.now() > nextStatus.retryAfter) {
        this.currentKeyIndex = nextIndex;
        console.log(`Switched to API key ${this.currentKeyIndex + 1}`);
        
        // Mark as not exhausted if quota recovered
        if (nextStatus && Date.now() > nextStatus.retryAfter) {
          nextStatus.exhausted = false;
        }
        
        return nextKey;
      }
    }
    
    // All keys exhausted
    console.error('All API keys exhausted');
    return null;
  }

  /**
   * Parse retry delay from error response
   */
  parseRetryDelay(error: any): number {
    // Look for retryDelay in error details
    if (error?.details) {
      for (const detail of error.details) {
        if (detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo' && detail.retryDelay) {
          // Parse delay like "33s" to number
          const match = detail.retryDelay.match(/(\d+)s?/);
          if (match) {
            return parseInt(match[1], 10);
          }
        }
      }
    }
    
    // Default to 60 seconds if not found
    return 60;
  }

  /**
   * Handle API error and switch keys if needed
   * @returns true if a new key is available, false if all keys exhausted
   */
  handleQuotaError(error: any): boolean {
    if (error?.code === 429 || error?.status === 'RESOURCE_EXHAUSTED') {
      const retryDelay = this.parseRetryDelay(error);
      const newKey = this.markCurrentKeyExhausted(retryDelay);
      return newKey !== null;
    }
    return false;
  }

  /**
   * Get status of all API keys
   */
  getStatus() {
    return this.apiKeys.map((key, index) => {
      const status = this.keyQuotaStatus.get(key);
      const isActive = index === this.currentKeyIndex;
      const timeUntilRecovery = status?.exhausted 
        ? Math.max(0, Math.ceil((status.retryAfter - Date.now()) / 1000))
        : 0;
      
      return {
        index: index + 1,
        active: isActive,
        exhausted: status?.exhausted || false,
        recoversIn: timeUntilRecovery,
      };
    });
  }
}

// Export singleton instance
export const apiKeyManager = new ApiKeyManager();