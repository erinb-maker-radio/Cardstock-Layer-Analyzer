/**
 * 🚨 READ FIRST: /DEVELOPMENT_GUIDE.md
 * 
 * Multiple approaches for layer isolation testing.
 * Compares AI-only vs hybrid vs programmatic approaches for single-fill enforcement.
 */

import { createLayerMask, isolateLayer } from './geminiService';

// Approach 1: Original AI + Post-Processing (use working AI isolation)
export async function hybridAIPostProcess(base64ImageData: string, mimeType: string, layerDescription: string): Promise<{ base64: string, mimeType: string, approach: string }> {
  try {
    // Step 1: Use original AI isolation (that was working for shapes)
    const aiResult = await isolateLayer(base64ImageData, mimeType, layerDescription);
    
    // Step 2: Post-process to enforce single fill
    const processedImage = await enforceUniformFill(aiResult.base64, base64ImageData);
    
    return {
      base64: processedImage.base64,
      mimeType: processedImage.mimeType,
      approach: "Original AI + Post-Processing"
    };
  } catch (error) {
    throw new Error(`Hybrid approach failed: ${error.message}`);
  }
}

// Approach 2: Original AI + Canvas Processing
export async function canvasImageDataProcess(base64ImageData: string, mimeType: string, layerDescription: string): Promise<{ base64: string, mimeType: string, approach: string }> {
  try {
    // Step 1: Use original AI isolation
    const aiResult = await isolateLayer(base64ImageData, mimeType, layerDescription);
    
    // Step 2: Canvas-based single fill enforcement
    const processedImage = await canvasUniformFill(aiResult.base64, base64ImageData);
    
    return {
      base64: processedImage.base64,
      mimeType: processedImage.mimeType,
      approach: "Original AI + Canvas Processing"
    };
  } catch (error) {
    throw new Error(`Canvas approach failed: ${error.message}`);
  }
}

// Approach 3: OpenCV.js Integration (placeholder - requires OpenCV.js)
export async function opencvIntegration(base64ImageData: string, mimeType: string, layerDescription: string): Promise<{ base64: string, mimeType: string, approach: string }> {
  try {
    // For now, use canvas approach as OpenCV.js substitute
    // TODO: Implement actual OpenCV.js integration
    const result = await canvasImageDataProcess(base64ImageData, mimeType, layerDescription);
    
    return {
      ...result,
      approach: "OpenCV.js Integration (Simulated)"
    };
  } catch (error) {
    throw new Error(`OpenCV approach failed: ${error.message}`);
  }
}

// Approach 4: SVG-Based Approach
export async function svgBasedApproach(base64ImageData: string, mimeType: string, layerDescription: string): Promise<{ base64: string, mimeType: string, approach: string }> {
  try {
    // Step 1: AI creates mask
    const mask = await createLayerMask(base64ImageData, mimeType, layerDescription);
    
    // Step 2: Convert to SVG and apply single fill
    const svgResult = await convertToSVGWithSingleFill(mask.base64, base64ImageData);
    
    return {
      base64: svgResult.base64,
      mimeType: "image/png",
      approach: "SVG-Based"
    };
  } catch (error) {
    throw new Error(`SVG approach failed: ${error.message}`);
  }
}

// Approach 5: Original AI + Pure Black Enforcement
export async function colorQuantizationProcess(base64ImageData: string, mimeType: string, layerDescription: string): Promise<{ base64: string, mimeType: string, approach: string }> {
  try {
    // Step 1: Use original AI isolation
    const aiResult = await isolateLayer(base64ImageData, mimeType, layerDescription);
    
    // Step 2: Force all non-transparent pixels to pure black
    const blackEnforced = await enforceBlackOnly(aiResult.base64);
    
    return {
      base64: blackEnforced.base64,
      mimeType: blackEnforced.mimeType,
      approach: "Original AI + Pure Black Enforcement"
    };
  } catch (error) {
    throw new Error(`Black enforcement failed: ${error.message}`);
  }
}

// Helper function: Enforce uniform fill using canvas
async function enforceUniformFill(maskBase64: string, originalBase64: string): Promise<{ base64: string, mimeType: string }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const maskImg = new Image();
    const originalImg = new Image();
    
    maskImg.onload = () => {
      canvas.width = maskImg.width;
      canvas.height = maskImg.height;
      
      // Draw mask to get shape data
      ctx.drawImage(maskImg, 0, 0);
      const maskData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      originalImg.onload = () => {
        // Sample dominant color from original
        const dominantColor = sampleDominantColor(originalImg, maskData);
        
        // Apply single fill to mask
        const result = applySingleFill(maskData, dominantColor);
        
        ctx.putImageData(result, 0, 0);
        const resultBase64 = canvas.toDataURL('image/png').split(',')[1];
        
        resolve({
          base64: resultBase64,
          mimeType: 'image/png'
        });
      };
      
      originalImg.src = `data:image/jpeg;base64,${originalBase64}`;
    };
    
    maskImg.src = `data:image/png;base64,${maskBase64}`;
  });
}

// Helper function: Canvas-based uniform fill
async function canvasUniformFill(maskBase64: string, originalBase64: string): Promise<{ base64: string, mimeType: string }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const maskImg = new Image();
    maskImg.onload = () => {
      canvas.width = maskImg.width;
      canvas.height = maskImg.height;
      
      ctx.drawImage(maskImg, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Force all non-transparent pixels to pure black
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) { // If not transparent
          data[i] = 0;     // Red
          data[i + 1] = 0; // Green  
          data[i + 2] = 0; // Blue
          data[i + 3] = 255; // Alpha (fully opaque)
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      const resultBase64 = canvas.toDataURL('image/png').split(',')[1];
      
      resolve({
        base64: resultBase64,
        mimeType: 'image/png'
      });
    };
    
    maskImg.src = `data:image/png;base64,${maskBase64}`;
  });
}

// Helper function: Convert to SVG with single fill
async function convertToSVGWithSingleFill(maskBase64: string, originalBase64: string): Promise<{ base64: string, mimeType: string }> {
  // Simplified SVG approach - converts mask to solid black shapes
  return canvasUniformFill(maskBase64, originalBase64);
}

// Helper function: Color quantization to single color
async function quantizeToSingleColor(maskBase64: string, originalBase64: string): Promise<{ base64: string, mimeType: string }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const maskImg = new Image();
    maskImg.onload = () => {
      canvas.width = maskImg.width;
      canvas.height = maskImg.height;
      
      ctx.drawImage(maskImg, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Find most common non-transparent color
      const colorCounts = new Map();
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) { // If not transparent
          const color = `${data[i]},${data[i + 1]},${data[i + 2]}`;
          colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
        }
      }
      
      // Get dominant color (default to black if none found)
      let dominantColor = [0, 0, 0];
      if (colorCounts.size > 0) {
        const sortedColors = Array.from(colorCounts.entries()).sort((a, b) => b[1] - a[1]);
        dominantColor = sortedColors[0][0].split(',').map(Number);
      }
      
      // Apply single color to all non-transparent pixels
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) { // If not transparent
          data[i] = dominantColor[0];     // Red
          data[i + 1] = dominantColor[1]; // Green
          data[i + 2] = dominantColor[2]; // Blue
          data[i + 3] = 255; // Alpha (fully opaque)
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      const resultBase64 = canvas.toDataURL('image/png').split(',')[1];
      
      resolve({
        base64: resultBase64,
        mimeType: 'image/png'
      });
    };
    
    maskImg.src = `data:image/png;base64,${maskBase64}`;
  });
}

// Helper function: Sample dominant color from original image
function sampleDominantColor(originalImg: HTMLImageElement, maskData: ImageData): [number, number, number] {
  // Simplified: return black for now
  // TODO: Implement actual color sampling from original image areas covered by mask
  return [0, 0, 0]; // Pure black
}

// Helper function: Apply single fill to image data
function applySingleFill(imageData: ImageData, color: [number, number, number]): ImageData {
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) { // If not transparent
      data[i] = color[0];     // Red
      data[i + 1] = color[1]; // Green
      data[i + 2] = color[2]; // Blue
      data[i + 3] = 255;      // Alpha (fully opaque)
    }
  }
  
  return imageData;
}

// Helper function: Force all non-transparent pixels to pure black
async function enforceBlackOnly(base64Image: string): Promise<{ base64: string, mimeType: string }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Force all non-transparent pixels to pure black
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) { // If not transparent
          data[i] = 0;     // Red = 0
          data[i + 1] = 0; // Green = 0
          data[i + 2] = 0; // Blue = 0
          data[i + 3] = 255; // Alpha = fully opaque
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      const resultBase64 = canvas.toDataURL('image/png').split(',')[1];
      
      resolve({
        base64: resultBase64,
        mimeType: 'image/png'
      });
    };
    
    img.onerror = () => reject(new Error('Failed to load image for black enforcement'));
    img.src = `data:image/png;base64,${base64Image}`;
  });
}