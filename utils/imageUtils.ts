/**
 * Image utilities for resizing and optimization
 */

import { IMAGE_CONFIG } from '../config/imageConfig';

/**
 * Resize an image file to a maximum dimension while maintaining aspect ratio
 * @param file - The image file to resize
 * @param maxDimension - Maximum width or height (default from config)
 * @returns Promise<File> - The resized image file
 */
export async function resizeImage(file: File, maxDimension: number = IMAGE_CONFIG.MAX_DIMENSION): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      // Only resize if image is larger than max dimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: 'image/png',
              lastModified: Date.now(),
            });
            console.log(`Image resized from ${img.width}x${img.height} to ${width}x${height}`);
            resolve(resizedFile);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/png',
        0.95 // Quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Create object URL for the image
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
  });
}

/**
 * Convert file to base64 with optional resizing
 * @param file - The file to convert
 * @param resize - Whether to resize the image
 * @param maxDimension - Maximum dimension if resizing
 * @returns Promise<{data: string, mimeType: string}> - Base64 data and mime type
 */
export async function fileToGenerativePart(
  file: File, 
  resize: boolean = true,
  maxDimension: number = IMAGE_CONFIG.MAX_DIMENSION
): Promise<{ inlineData: { data: string; mimeType: string } }> {
  // Resize if requested and file is an image
  let processedFile = file;
  if (resize && file.type.startsWith('image/')) {
    try {
      processedFile = await resizeImage(file, maxDimension);
    } catch (error) {
      console.warn('Failed to resize image, using original:', error);
    }
  }
  
  // Convert to base64
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(processedFile);
  });
  
  return {
    inlineData: { 
      data: await base64EncodedDataPromise, 
      mimeType: processedFile.type 
    },
  };
}

/**
 * Upscale a base64 image to a higher resolution for final output
 * @param base64Image - The base64 encoded image to upscale
 * @param targetDimension - Target dimension for upscaling (default 2048)
 * @returns Promise<string> - The upscaled base64 image
 */
export async function upscaleBase64Image(
  base64Image: string, 
  targetDimension: number = IMAGE_CONFIG.OUTPUT_DIMENSION
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      const aspectRatio = width / height;
      
      // Scale up to target dimension
      if (width > height) {
        width = targetDimension;
        height = targetDimension / aspectRatio;
      } else {
        height = targetDimension;
        width = targetDimension * aspectRatio;
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Enable image smoothing for better quality upscaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw upscaled image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64
      const upscaledBase64 = canvas.toDataURL('image/png', 1.0).split(',')[1];
      console.log(`Image upscaled from ${img.width}x${img.height} to ${width}x${height}`);
      resolve(upscaledBase64);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for upscaling'));
    };
    
    img.src = `data:image/png;base64,${base64Image}`;
  });
}