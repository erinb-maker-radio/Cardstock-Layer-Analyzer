/**
 * 🚨 READ FIRST: /DEVELOPMENT_GUIDE.md
 * 
 * Validated layer isolation with automatic single-color enforcement.
 * Retries AI generation until single-fill compliance is achieved.
 */

import { isolateLayer } from './geminiService';

interface ValidationResult {
  isValid: boolean;
  colorCount: number;
  dominantColor?: string;
  reason?: string;
}

interface IsolationResult {
  base64: string;
  mimeType: string;
  attempts: number;
  validationInfo: ValidationResult;
}

/**
 * Validates if an image has only one color (single-fill compliance)
 */
export async function validateSingleColor(base64Image: string): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      const colors = new Map<string, number>();
      let transparentPixels = 0;
      
      // Count all unique colors
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        
        if (alpha === 0) {
          transparentPixels++;
          continue; // Skip transparent pixels
        }
        
        const color = `${data[i]},${data[i + 1]},${data[i + 2]}`;
        colors.set(color, (colors.get(color) || 0) + 1);
      }
      
      const uniqueColors = colors.size;
      
      if (uniqueColors === 0) {
        resolve({
          isValid: false,
          colorCount: 0,
          reason: 'Image is completely transparent'
        });
        return;
      }
      
      if (uniqueColors === 1) {
        const dominantColor = Array.from(colors.keys())[0];
        resolve({
          isValid: true,
          colorCount: 1,
          dominantColor,
          reason: 'Single color detected'
        });
        return;
      }
      
      // Multiple colors found
      const sortedColors = Array.from(colors.entries()).sort((a, b) => b[1] - a[1]);
      const dominantColor = sortedColors[0][0];
      
      resolve({
        isValid: false,
        colorCount: uniqueColors,
        dominantColor,
        reason: `Multiple colors detected: ${uniqueColors} unique colors`
      });
    };
    
    img.onerror = () => {
      resolve({
        isValid: false,
        colorCount: 0,
        reason: 'Failed to load image for validation'
      });
    };
    
    img.src = `data:image/png;base64,${base64Image}`;
  });
}

/**
 * Isolates a layer with automatic retry until single-color compliance
 */
export async function isolateLayerWithValidation(
  base64ImageData: string, 
  mimeType: string, 
  layerDescription: string,
  maxRetries: number = 8,
  onProgress?: (attempt: number, validation: ValidationResult) => void
): Promise<IsolationResult> {
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Generate layer using original AI method
      const result = await isolateLayer(base64ImageData, mimeType, layerDescription);
      
      // Validate single-color compliance
      const validation = await validateSingleColor(result.base64);
      
      // Notify progress callback if provided
      if (onProgress) {
        onProgress(attempt, validation);
      }
      
      // Return if validation passes
      if (validation.isValid) {
        return {
          base64: result.base64,
          mimeType: result.mimeType,
          attempts: attempt,
          validationInfo: validation
        };
      }
      
      // Log failure reason for debugging
      console.log(`Attempt ${attempt}/${maxRetries} failed: ${validation.reason}`);
      
      // Add delay between retries to avoid rate limiting
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`Attempt ${attempt} failed with error:`, error);
      
      // Don't count API errors against our retry limit
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  // All retries failed
  throw new Error(`Failed to generate single-color layer after ${maxRetries} attempts. The AI model may be unable to produce single-fill results for this image/description combination.`);
}

/**
 * Enhanced validation that also checks for common issues
 */
export async function validateLayerQuality(base64Image: string): Promise<ValidationResult & { 
  hasTransparency: boolean;
  pixelCount: number;
  isBlank: boolean;
}> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      const colors = new Map<string, number>();
      let transparentPixels = 0;
      let opaquePixels = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        
        if (alpha === 0) {
          transparentPixels++;
          continue;
        }
        
        opaquePixels++;
        const color = `${data[i]},${data[i + 1]},${data[i + 2]}`;
        colors.set(color, (colors.get(color) || 0) + 1);
      }
      
      const uniqueColors = colors.size;
      const totalPixels = data.length / 4;
      const hasTransparency = transparentPixels > 0;
      const isBlank = opaquePixels === 0;
      
      let isValid = uniqueColors === 1 && !isBlank;
      let reason = '';
      
      if (isBlank) {
        reason = 'Image is blank (no visible content)';
        isValid = false;
      } else if (uniqueColors === 0) {
        reason = 'No colors detected';
        isValid = false;
      } else if (uniqueColors > 1) {
        reason = `Multiple colors detected: ${uniqueColors} unique colors`;
        isValid = false;
      } else {
        reason = 'Single color layer validated successfully';
      }
      
      const dominantColor = colors.size > 0 ? Array.from(colors.entries()).sort((a, b) => b[1] - a[1])[0][0] : undefined;
      
      resolve({
        isValid,
        colorCount: uniqueColors,
        dominantColor,
        reason,
        hasTransparency,
        pixelCount: opaquePixels,
        isBlank
      });
    };
    
    img.onerror = () => {
      resolve({
        isValid: false,
        colorCount: 0,
        reason: 'Failed to load image for validation',
        hasTransparency: false,
        pixelCount: 0,
        isBlank: true
      });
    };
    
    img.src = `data:image/png;base64,${base64Image}`;
  });
}