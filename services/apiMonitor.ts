/**
 * API Monitor Service - Tracks status of all available API keys
 */

export interface ApiKeyStatus {
  keyName: string;
  keyPreview: string; // First 8 chars for identification
  isActive: boolean;
  textModelStatus: 'available' | 'exhausted' | 'error' | 'unknown';
  imageModelStatus: 'available' | 'exhausted' | 'error' | 'unknown';
  lastChecked: Date | null;
  lastError: string | null;
  quotaResetTime: Date | null;
}

export interface ApiMonitorState {
  keys: ApiKeyStatus[];
  isMonitoring: boolean;
  lastUpdate: Date;
}

class ApiMonitorService {
  private keys: { [keyName: string]: string } = {
    'Key 1 (Original)': 'AIzaSyCuG_p3v7qp0D5kfa_xNIhBw6T1dCE7q0o',
    'Key 2 (PAID)': 'AIzaSyDBClycr-IQ2v2lLnk0-ZQz2eazqE7RByc',
    'Key 3 (Free)': 'AIzaSyDIfEqAuhBySmuegzCKfOyqppivoBRCHFM',
  };

  private state: ApiMonitorState;
  private listeners: Array<(state: ApiMonitorState) => void> = [];
  private monitorInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.state = {
      keys: Object.entries(this.keys).map(([keyName, key]) => ({
        keyName,
        keyPreview: key.substring(0, 8) + '...',
        isActive: false,
        textModelStatus: 'unknown',
        imageModelStatus: 'unknown',
        lastChecked: null,
        lastError: null,
        quotaResetTime: null,
      })),
      isMonitoring: false,
      lastUpdate: new Date(),
    };
  }

  /**
   * Get current monitor state
   */
  getState(): ApiMonitorState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (state: ApiMonitorState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners() {
    this.state.lastUpdate = new Date();
    this.listeners.forEach(callback => callback(this.getState()));
  }

  /**
   * Set which API key is currently active
   */
  setActiveKey(keyName: string) {
    this.state.keys.forEach(key => {
      key.isActive = key.keyName === keyName;
    });
    this.notifyListeners();
  }

  /**
   * Test a specific API key with minimal token usage
   */
  async testApiKey(keyName: string, model: 'text' | 'image'): Promise<{
    status: 'available' | 'exhausted' | 'error';
    error?: string;
    retryAfter?: number;
  }> {
    const apiKey = this.keys[keyName];
    if (!apiKey) {
      return { status: 'error', error: 'API key not found' };
    }

    console.log(`🧪 Testing ${keyName} - ${model} model...`);

    try {
      const { GoogleGenAI, Modality } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      if (model === 'text') {
        // Test text model with minimal tokens
        console.log(`Testing text model for ${keyName}...`);
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [{ text: 'Hi' }] },
        });
        console.log(`✅ ${keyName} text model: SUCCESS`);
        return { status: 'available' };
      } else {
        // Test image model - we need to create a tiny test image
        console.log(`Testing image model for ${keyName}...`);
        const testImageBase64 = await this.createTinyTestImage();
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image-preview',
          contents: { 
            parts: [
              {
                inlineData: {
                  data: testImageBase64,
                  mimeType: 'image/png'
                }
              },
              { text: 'What is this?' }
            ]
          },
          config: {
            responseModalities: [Modality.TEXT],
          },
        });
        console.log(`✅ ${keyName} image model: SUCCESS`);
        return { status: 'available' };
      }
    } catch (error: any) {
      console.error(`❌ ${keyName} ${model} model FAILED:`, error);
      
      if (error?.error?.code === 429 || error?.error?.status === 'RESOURCE_EXHAUSTED') {
        console.log(`${keyName} ${model} model: QUOTA EXHAUSTED`);
        // Parse retry delay
        let retryAfter = 60;
        if (error.error?.details) {
          for (const detail of error.error.details) {
            if (detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo' && detail.retryDelay) {
              const match = detail.retryDelay.match(/(\d+)s?/);
              if (match) {
                retryAfter = parseInt(match[1], 10);
              }
            }
          }
        }
        
        return { 
          status: 'exhausted', 
          error: 'Quota exhausted - ' + (error?.error?.message || 'Rate limited'),
          retryAfter 
        };
      }
      
      if (error?.error?.code === 400 && error?.error?.message?.includes('API key not valid')) {
        console.log(`${keyName}: INVALID API KEY`);
        return { 
          status: 'error', 
          error: 'Invalid API key'
        };
      }
      
      console.log(`${keyName} ${model} model: OTHER ERROR -`, error?.error?.message || error?.message);
      return { 
        status: 'error', 
        error: error?.error?.message || error?.message || 'Unknown error' 
      };
    }
  }

  /**
   * Create a tiny test image (1x1 pixel) for testing image API
   */
  private async createTinyTestImage(): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1, 1);
    return canvas.toDataURL('image/png').split(',')[1];
  }

  /**
   * Update status for a specific key
   */
  private updateKeyStatus(
    keyName: string, 
    model: 'text' | 'image',
    status: 'available' | 'exhausted' | 'error',
    error?: string,
    retryAfter?: number
  ) {
    const key = this.state.keys.find(k => k.keyName === keyName);
    if (!key) return;

    if (model === 'text') {
      key.textModelStatus = status;
    } else {
      key.imageModelStatus = status;
    }
    
    key.lastChecked = new Date();
    key.lastError = error || null;
    
    if (retryAfter && status === 'exhausted') {
      key.quotaResetTime = new Date(Date.now() + retryAfter * 1000);
    }

    this.notifyListeners();
  }

  /**
   * Test all API keys for both models
   */
  async checkAllKeys(): Promise<void> {
    const keyNames = Object.keys(this.keys);
    
    for (const keyName of keyNames) {
      // Test text model
      try {
        const textResult = await this.testApiKey(keyName, 'text');
        this.updateKeyStatus(keyName, 'text', textResult.status, textResult.error, textResult.retryAfter);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        this.updateKeyStatus(keyName, 'text', 'error', 'Test failed');
      }

      // Test image model
      try {
        const imageResult = await this.testApiKey(keyName, 'image');
        this.updateKeyStatus(keyName, 'image', imageResult.status, imageResult.error, imageResult.retryAfter);
        
        // Small delay between tests  
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        this.updateKeyStatus(keyName, 'image', 'error', 'Test failed');
      }
    }
  }

  /**
   * Start automatic monitoring
   */
  startMonitoring(intervalMinutes: number = 5) {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    
    this.state.isMonitoring = true;
    this.notifyListeners();
    
    // Initial check
    this.checkAllKeys();
    
    // Set up periodic checks
    this.monitorInterval = setInterval(() => {
      this.checkAllKeys();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop automatic monitoring
   */
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.state.isMonitoring = false;
    this.notifyListeners();
  }

  /**
   * Record an API error that occurred during actual usage
   */
  recordApiError(keyName: string, model: 'text' | 'image', error: any) {
    if (error?.error?.code === 429 || error?.error?.status === 'RESOURCE_EXHAUSTED') {
      let retryAfter = 60;
      if (error.error?.details) {
        for (const detail of error.error.details) {
          if (detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo' && detail.retryDelay) {
            const match = detail.retryDelay.match(/(\d+)s?/);
            if (match) {
              retryAfter = parseInt(match[1], 10);
            }
          }
        }
      }
      this.updateKeyStatus(keyName, model, 'exhausted', 'Quota exhausted', retryAfter);
    } else {
      this.updateKeyStatus(keyName, model, 'error', error?.error?.message || 'Unknown error');
    }
  }

  /**
   * Get the best available API key
   */
  getBestAvailableKey(): string | null {
    const availableKeys = this.state.keys.filter(key => 
      key.textModelStatus === 'available' && key.imageModelStatus === 'available'
    );
    
    if (availableKeys.length > 0) {
      return availableKeys[0].keyName;
    }
    
    // If no fully available keys, return one with at least text available
    const textAvailable = this.state.keys.filter(key => key.textModelStatus === 'available');
    return textAvailable.length > 0 ? textAvailable[0].keyName : null;
  }
}

// Export singleton instance
export const apiMonitor = new ApiMonitorService();