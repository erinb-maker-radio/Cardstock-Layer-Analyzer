/**
 * Client-side layer welding utilities
 * Eliminates API calls for layer welding by doing composition client-side
 */

interface WeldingResult {
  base64: string;
  mimeType: string;
  dominantColor: string;
}

/**
 * Extract the dominant color from a base64 image
 */
export async function extractDominantColor(base64Image: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      const colorCounts = new Map<string, number>();
      
      // Count all non-transparent colors
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 0) {
          const color = `${data[i]},${data[i + 1]},${data[i + 2]}`;
          colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
        }
      }
      
      if (colorCounts.size === 0) {
        resolve('0,0,0'); // Default to black
        return;
      }
      
      // Find most common color
      const dominantColor = Array.from(colorCounts.entries())
        .sort((a, b) => b[1] - a[1])[0][0];
      
      resolve(dominantColor);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for color extraction'));
    };
    
    img.src = `data:image/png;base64,${base64Image}`;
  });
}

/**
 * Weld current layer with all previous layers using client-side canvas operations
 */
export async function weldLayersClientSide(
  currentLayerBase64: string,
  previousLayersBase64: string[],
  targetLayerColor?: string
): Promise<WeldingResult> {
  return new Promise(async (resolve, reject) => {
    try {
      // Extract dominant color from current layer if not provided
      const dominantColor = targetLayerColor || await extractDominantColor(currentLayerBase64);
      const [r, g, b] = dominantColor.split(',').map(Number);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Load current layer to get dimensions
      const currentImg = new Image();
      currentImg.onload = async () => {
        canvas.width = currentImg.width;
        canvas.height = currentImg.height;
        
        // Create a composite mask by drawing all layers
        const compositeMask = document.createElement('canvas');
        const maskCtx = compositeMask.getContext('2d')!;
        compositeMask.width = canvas.width;
        compositeMask.height = canvas.height;
        
        // Draw current layer
        maskCtx.drawImage(currentImg, 0, 0);
        
        // Draw all previous layers on top to create combined mask
        for (const prevLayerBase64 of previousLayersBase64) {
          const prevImg = new Image();
          await new Promise((resolveImg) => {
            prevImg.onload = () => {
              maskCtx.drawImage(prevImg, 0, 0);
              resolveImg(null);
            };
            prevImg.src = `data:image/png;base64,${prevLayerBase64}`;
          });
        }
        
        // Get the composite mask data
        const maskData = maskCtx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Create final image with uniform color
        const finalData = ctx.createImageData(canvas.width, canvas.height);
        
        for (let i = 0; i < maskData.data.length; i += 4) {
          const alpha = maskData.data[i + 3];
          
          if (alpha > 0) {
            // Apply uniform target color to all visible pixels
            finalData.data[i] = r;
            finalData.data[i + 1] = g; 
            finalData.data[i + 2] = b;
            finalData.data[i + 3] = 255; // Full opacity
          } else {
            // Keep transparent
            finalData.data[i] = 0;
            finalData.data[i + 1] = 0;
            finalData.data[i + 2] = 0;
            finalData.data[i + 3] = 0;
          }
        }
        
        // Put the final image data on canvas
        ctx.putImageData(finalData, 0, 0);
        
        // Convert to base64
        const weldedBase64 = canvas.toDataURL('image/png', 1.0).split(',')[1];
        
        console.log(`Client-side welding completed: ${previousLayersBase64.length + 1} layers welded with color rgb(${r},${g},${b})`);
        
        resolve({
          base64: weldedBase64,
          mimeType: 'image/png',
          dominantColor
        });
      };
      
      currentImg.onerror = () => {
        reject(new Error('Failed to load current layer image'));
      };
      
      currentImg.src = `data:image/png;base64,${currentLayerBase64}`;
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a description of what the welded layer contains (for UI display)
 */
export function generateWeldingDescriptionClientSide(
  currentLayerDescription: string,
  layerNumber: number,
  previousLayers: string[],
  dominantColor: string
): string {
  const [r, g, b] = dominantColor.split(',').map(Number);
  const colorName = getColorName(r, g, b);
  
  const previousLayersList = previousLayers
    .map((desc, idx) => `Layer ${idx + 1}`)
    .join(layerNumber > 2 ? ', ' : ' and ');
  
  return `The welded Layer ${layerNumber} combines the current layer (${currentLayerDescription}) with all previous layers (${previousLayersList}) into a single unified piece. All areas are rendered in ${colorName} (rgb(${r},${g},${b})) on a transparent background, representing the complete cardstock piece that would be cut for Layer ${layerNumber}.`;
}

/**
 * Simple color name detection for better user feedback
 */
function getColorName(r: number, g: number, b: number): string {
  // Simple color detection
  if (r < 50 && g < 50 && b < 50) return 'black';
  if (r > 200 && g > 200 && b > 200) return 'white';
  if (r > 200 && g < 100 && b < 100) return 'red';
  if (r < 100 && g > 200 && b < 100) return 'green';
  if (r < 100 && g < 100 && b > 200) return 'blue';
  if (r > 200 && g > 150 && b < 100) return 'orange';
  if (r > 200 && g > 200 && b < 100) return 'yellow';
  if (r > 150 && g < 100 && b > 150) return 'purple';
  
  return `rgb(${r},${g},${b})`;
}