/**
 * Image processing configuration
 */

export const IMAGE_CONFIG = {
  // Maximum dimension for images sent to API (reduces token usage)
  MAX_DIMENSION: 512,  // Reduced from 1024 to save ~75% tokens
  
  // Whether to resize images before sending to API
  RESIZE_FOR_API: true,
  
  // Quality for resized images (0-1)
  RESIZE_QUALITY: 0.9,  // Slightly reduced quality for smaller files
  
  // Log resizing operations
  LOG_RESIZE: true,
  
  // Output dimension for final images (upscale after processing)
  OUTPUT_DIMENSION: 2048,  // High quality output
};

// Token usage estimates
export const TOKEN_ESTIMATES = {
  // Approximate tokens per image at different resolutions
  IMAGE_256: 25000,     // ~25K tokens
  IMAGE_512: 100000,    // ~100K tokens (NEW DEFAULT)
  IMAGE_1024: 400000,   // ~400K tokens (OLD DEFAULT)
  IMAGE_2048: 1600000,  // ~1.6M tokens
  
  // Text tokens
  PROMPT_AVERAGE: 500,
  RESPONSE_AVERAGE: 300,
};