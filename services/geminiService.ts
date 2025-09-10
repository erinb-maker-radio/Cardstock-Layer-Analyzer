/**
 * 🚨 READ FIRST: /DEVELOPMENT_GUIDE.md
 * 🚨 LAYER 1 CRITICAL: /LAYER_1_CRITICAL_DO_NOT_MODIFY.md
 * 
 * CRITICAL: This file contains core AI logic for layer analysis.
 * Changes to prompts, parameters, or logic MUST maintain >90% visual success rate.
 * Review development guide before making ANY changes.
 * 
 * ⚠️ WARNING: Layer 1 functions (generateIsolationDescription, isolateLayer) are FROZEN
 * DO NOT MODIFY Layer 1 implementation - see LAYER_1_CRITICAL_DO_NOT_MODIFY.md
 * 
 * Key responsibilities:
 * - Layer 1 identification with strict consistency rules (DO NOT MODIFY)
 * - Single-fill layer isolation (no multi-color mixing)
 * - Transparent background generation
 * - Temperature-controlled AI parameters for deterministic output
 */
import { GoogleGenAI, Type, Modality } from "@google/genai";

// Use Key 2 - PAID API (much higher limits)
const API_KEY_2_PAID = 'AIzaSyDBClycr-IQ2v2lLnk0-ZQz2eazqE7RByc';
const ai = new GoogleGenAI({ apiKey: API_KEY_2_PAID });

const analysisModel = 'gemini-2.5-flash';
const imageEditingModel = 'gemini-2.5-flash-image-preview';


const getAnalysisSystemInstruction = (layerNumber: number, previousLayers?: string[]) => `
You are an expert in analyzing layered vector art and papercraft. 
Your task is to identify "Layer ${layerNumber}" from an image provided by the user.
Follow these rules strictly:

1.  **The "Conceptual Component" Rule:** A layer is a single conceptual component of the artwork. This component is a set of shapes that would be cut from the same single sheet of cardstock.

2.  **Composition of a Layer:**
    - A component IS DEFINED by its fill (a single solid color or a single continuous gradient).
    - A component CAN consist of several physically separate parts IF they logically belong together (e.g., the two eyes and nose of a face form a single "face details" layer).
    - A component MUST NOT include unrelated elements just because they share the same color.

3.  **Explicit Exclusions - What is NOT a layer:**
    - You MUST exclude elements that are clearly stylistic additions and not physical pieces of cardstock. This includes:
    - Shadows cast by other objects.
    - Thin outlines that border a different colored shape.

4.  **Layer Identification with Depth Understanding:** 
    - Layer 1 is the most foreground conceptual component.
    - Layer 2 is the second most foreground component (behind Layer 1) and may be partially obscured by Layer 1's shadow or overlap.
    - Layer 3 is the third most foreground component (behind Layers 1 and 2) and may have shadows from upper layers.
    - Continue this pattern for subsequent layers.
    - **CRITICAL**: When identifying Layer ${layerNumber}, consider that it may have shadows cast onto it by the layers in front of it.

${previousLayers && previousLayers.length > 0 ? `
5.  **Previous Layers Context and Shadow Analysis:**
    The following layers have already been identified and isolated:
    ${previousLayers.map((desc, idx) => `- Layer ${idx + 1}: ${desc}`).join('\n    ')}
    
    **IMPORTANT FOR LAYER ${layerNumber}:**
    - Layer ${layerNumber} should be DISTINCT from all previously identified layers.
    - Layer ${layerNumber} is positioned BEHIND the layers listed above.
    - Look for areas where Layer ${layerNumber} may be visible around the edges of upper layers.
    - Layer ${layerNumber} may have darker regions that are shadows cast by Layer ${layerNumber - 1} or other upper layers.
    - Do NOT identify the shadows themselves as separate layers - shadows are cast ON Layer ${layerNumber}, not separate from it.
    - Focus on the actual underlying shapes/components that would exist as physical cardstock pieces.
` : ''}

You MUST respond in JSON format.
`;

const getAnalysisSchema = (layerNumber: number) => ({
  type: Type.OBJECT,
  properties: {
    [`layer_${layerNumber}_description`]: {
      type: Type.STRING,
      description: `A detailed visual description of only the identified Layer ${layerNumber}. Be specific about its shape, color, and position.`
    },
    reasoning: {
      type: Type.STRING,
      description: `A brief explanation of why this was identified as Layer ${layerNumber}, referencing the provided rules.`
    }
  },
  propertyOrdering: [`layer_${layerNumber}_description`, "reasoning"],
});


export async function analyzeImageLayer(base64ImageData: string, mimeType: string, layerNumber: number = 1, previousLayers?: string[]) {
  console.log('🔍 analyzeImageLayer called with layerNumber:', layerNumber, 'previousLayers:', previousLayers?.length || 0);
  const imagePart = {
    inlineData: {
      data: base64ImageData,
      mimeType: mimeType,
    },
  };

  const textPart = {
      text: `Based on the rules, analyze the provided image and identify Layer ${layerNumber}.`
  };

  try {
    const schema = getAnalysisSchema(layerNumber);
    const systemInstruction = getAnalysisSystemInstruction(layerNumber, previousLayers);
    
    console.log(`Analyzing Layer ${layerNumber}:`);
    console.log('Schema:', JSON.stringify(schema, null, 2));
    console.log('System instruction preview:', systemInstruction.substring(0, 200) + '...');
    
    const response = await ai.models.generateContent({
      model: analysisModel,
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonString = response.text.trim();
    // Safely parse the JSON response
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON response:", jsonString);
        throw new Error("The model returned an invalid analysis format.");
    }
  } catch (error) {
    console.error("Error calling Gemini API for analysis:", error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    throw new Error(`Failed to get analysis from the AI model: ${errorMessage}`);
  }
}

// Step 1: Create layer mask (shapes only, no color decisions)
export async function createLayerMask(base64ImageData: string, mimeType: string, layerDescription: string): Promise<{ base64: string, mimeType: string }> {
    const imagePart = {
        inlineData: {
          data: base64ImageData,
          mimeType: mimeType,
        },
      };

    const textPart = {
        text: `CRITICAL SHAPE IDENTIFICATION TASK

Task: Create precise black silhouettes of ONLY the shapes described in the layer.

Layer description: "${layerDescription}"

MANDATORY REQUIREMENTS:
1. **IDENTIFY SHAPES**: Look at the provided image and identify the EXACT shapes mentioned in the description
2. **PRECISE MASKING**: Create accurate outlines of butterflies, circles, grass - NOT rectangular blocks
3. **BLACK SILHOUETTES**: Fill identified shapes with pure black (#000000) 
4. **TRANSPARENT BACKGROUND**: Everything else must be 100% transparent
5. **NO RECTANGLES**: Do not create rectangular or square masks - follow the actual shape contours

EXAMPLES:
✅ CORRECT: Black butterfly silhouettes with wing details, circular frame outline, grass shapes
❌ WRONG: Rectangular black blocks, square masks, geometric shapes that don't match the content

For butterfly image specifically:
- Create detailed black silhouettes of butterfly shapes (not rectangles!)
- Include the circular frame outline
- Include grass/foliage shapes at bottom
- Maintain accurate shape boundaries and details

OUTPUT: Precise black shape silhouettes on transparent background.`
    };

    try {
        const response = await ai.models.generateContent({
                model: imageEditingModel,
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                    temperature: 0.01,  // Extremely low temperature for strict consistency
                    topP: 0.5,          // Very reduced randomness
                    topK: 5,            // Severely limit token choices
                },
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return {
                    base64: part.inlineData.data,
                    mimeType: part.inlineData.mimeType,
                };
            }
        }

        throw new Error("The model did not return an image part in its response.");

    } catch (error) {
        console.error("Error calling Gemini API for layer isolation:", error);
        throw new Error("Failed to create layer mask from the AI model.");
    }
}

// Step 2: Apply appropriate fill to mask based on color sampling
export async function applyLayerFill(originalBase64: string, maskBase64: string, originalMimeType: string, layerDescription: string): Promise<{ base64: string, mimeType: string }> {
    const originalImagePart = {
        inlineData: {
          data: originalBase64,
          mimeType: originalMimeType,
        },
    };
    
    const maskPart = {
        inlineData: {
          data: maskBase64,
          mimeType: "image/png",
        },
    };

    const textPart = {
        text: `STEP 2: APPLY SINGLE FILL TO MASK

You have:
1. Original image with full colors
2. Black mask showing layer shapes

Layer description: "${layerDescription}"

TASK: Apply ONE unified fill to the mask shapes.

PROCESS:
1. **SAMPLE COLORS:** Look at the original image areas covered by the mask
2. **DETERMINE FILL:** Choose ONE of these options:
   - Single solid color (most dominant color from sampled area)
   - Single gradient (if colors transition smoothly across the layer)
3. **APPLY FILL:** Fill ALL mask shapes with the same chosen fill
4. **OUTPUT:** Filled shapes on transparent background

RULES:
- ALL shapes must have identical fill (same color OR same gradient)
- Background must remain 100% transparent
- For butterfly image: If layer is predominantly black, use pure black (#000000)

OUTPUT: Single-fill layer on transparent background.`
    };

    try {
        const response = await ai.models.generateContent({
            model: imageEditingModel,
            contents: { parts: [originalImagePart, maskPart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
                temperature: 0.01,
                topP: 0.5,
                topK: 5,
            },
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return {
                    base64: part.inlineData.data,
                    mimeType: part.inlineData.mimeType,
                };
            }
        }

        throw new Error("The model did not return an image part in its response.");

    } catch (error) {
        console.error("Error calling Gemini API for fill application:", error);
        throw new Error("Failed to apply fill to layer mask from the AI model.");
    }
}

// ⚠️ LAYER 1 CRITICAL: DO NOT MODIFY THIS FUNCTION FOR LAYER 1
// See /LAYER_1_CRITICAL_DO_NOT_MODIFY.md for details
export async function generateIsolationDescription(base64ImageData: string, mimeType: string, layerAnalysis: string, layerNumber: number = 1): Promise<string> {
  // Only include image if provided (optimization to reduce tokens)
  const parts = base64ImageData ? [
    {
      inlineData: {
        data: base64ImageData,
        mimeType: mimeType,
      },
    }
  ] : [];

  const textPart = layerNumber === 1 
    ? {
        text: `Based on this layer analysis: "${layerAnalysis}"

Create a detailed description of what the ISOLATED Layer 1 should look like when extracted with transparency.

Your description should specify:
1. What parts will be visible (the actual Layer 1 elements)
2. What parts will be transparent (background and other layer colors)
3. The single unified color/fill that should be applied to all visible elements
4. The overall appearance on a transparent background

Focus on describing the visual result after isolation, not the analysis process.

Example format: "The isolated layer shows [specific elements] rendered in [single color] on a completely transparent background, with all [other colors/elements] areas made transparent." `
    }
    : {
        text: `Based on this layer analysis: "${layerAnalysis}"

Create a simple description for isolating ONLY Layer ${layerNumber} elements without including other layers.

Your description should specify:
1. What Layer ${layerNumber} parts will be visible (only the current layer elements)
2. What will be transparent (everything else, including other layers and background)
3. The single color that Layer ${layerNumber} uses
4. The isolated result on transparent background

Keep it simple - describe only Layer ${layerNumber} isolation, not reconstruction or welding.

Example: "The isolated Layer ${layerNumber} shows only the [color] [elements] from the analysis, rendered in [single color] on transparent background. All other areas become transparent." `
    };

  try {
    const response = await ai.models.generateContent({
        model: analysisModel,
        contents: { parts: [...parts, textPart] },
        config: {
          systemInstruction: "You are an expert at describing isolated layer visualizations for cardstock cutting. Provide clear, specific descriptions of what isolated layers should look like.",
        },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating isolation description:", error);
    throw new Error("Failed to generate isolation description.");
  }
}

// Step 1: Isolate just the current layer (no welding)
export async function isolateCurrentLayer(base64ImageData: string, mimeType: string, layerDescription: string, layerNumber: number = 1): Promise<{ base64: string, mimeType: string }> {
    const imagePart = {
        inlineData: {
          data: base64ImageData,
          mimeType: mimeType,
        },
      };

    const textPart = layerNumber === 1
        ? {
            text: `Your task is to perform a precise image masking operation for Layer 1. Your output MUST be a PNG image with a transparent alpha channel.

The new image will contain ONLY the specific layer described here: "${layerDescription}".

Follow these rules with absolute precision. These are commands, not suggestions.

1.  **ABSOLUTE PRIORITY: TRANSPARENT BACKGROUND.** The output format MUST be a PNG with a fully transparent background. Everything that is NOT part of the described layer must have an alpha value of 0. DO NOT output a solid background.

2.  **ABSOLUTE PRIORITY: SINGLE FILL UNIFICATION.** The final isolated layer shape you create MUST be unified into a single solid color. Identify the most dominant color of the described area in the original image and use that color for the entire shape. DO NOT include multiple colors, shades, or gradients. The result must be a single, clean shape with one solid fill color.

3.  **EXECUTION:** Use the description to perfectly identify the correct conceptual component in the original image. Create a mask from this component. Produce a new PNG image containing only this masked component, filled with the unified color, on a transparent background.`
        }
        : {
            text: `Your task is to isolate ONLY Layer ${layerNumber} without any welding or combination with other layers.

The new image will contain ONLY the specific layer described here: "${layerDescription}".

Follow these rules with absolute precision:

1.  **TRANSPARENT BACKGROUND:** Output must be PNG with fully transparent background.

2.  **SINGLE FILL UNIFICATION:** All Layer ${layerNumber} elements must be unified into a single solid color.

3.  **ISOLATION ONLY:** Extract ONLY the Layer ${layerNumber} elements as they appear, without reconstructing or adding other layer areas.

4.  **EXECUTION:** Create a precise mask of the described Layer ${layerNumber} components. Fill with unified color on transparent background.`
        };

    try {
        const response = await ai.models.generateContent({
                model: imageEditingModel,
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return {
                    base64: part.inlineData.data,
                    mimeType: part.inlineData.mimeType,
                };
            }
        }

        throw new Error("The model did not return an image part in its response.");

    } catch (error: any) {
        console.error("Error calling Gemini API for current layer isolation:", error);
        const errorMessage = error?.message || error?.toString() || "Unknown error";
        throw new Error(`Failed to isolate current layer: ${errorMessage}`);
    }
}

// Step 2: Weld current layer with all previous layers
export async function weldLayerWithPrevious(originalImage: string, currentLayerImage: string, originalMimeType: string, currentLayerDescription: string, layerNumber: number, previousLayers: string[]): Promise<{ base64: string, mimeType: string }> {
    const originalImagePart = {
        inlineData: {
          data: originalImage,
          mimeType: originalMimeType,
        },
    };
    
    const currentLayerPart = {
        inlineData: {
          data: currentLayerImage,
          mimeType: "image/png",
        },
    };

    const textPart = {
        text: `Your task is to create the COMPLETE Layer ${layerNumber} by welding the isolated layer with ALL previous layers.

You have:
1. Original image showing all layers
2. Isolated Layer ${layerNumber} image

Previous layers that must be welded to Layer ${layerNumber}:
${previousLayers.map((desc, idx) => `- Layer ${idx + 1}: ${desc}`).join('\n')}

WELDING RULES:
1. **COMBINE ALL LAYERS:** Layer ${layerNumber} must include ALL areas from Layer ${layerNumber - 1}${layerNumber > 2 ? `, Layer ${layerNumber - 2}, etc.` : ''}
2. **UNIFORM SINGLE COLOR:** ALL areas (current layer + all previous layers) must be rendered in exactly the same uniform color - the dominant color from Layer ${layerNumber}. No variations, gradients, or multiple shades allowed.
3. **TRANSPARENT:** Only background areas that were never part of any layer
4. **COMPLETE PIECE:** Think of this as the complete cardstock piece that includes all upper layers welded to it
5. **COLOR CONSISTENCY:** Every pixel of the visible shape must be the exact same color value - no lighter/darker variations

OUTPUT: Complete unified Layer ${layerNumber} with all previous layers absorbed, rendered in ONE UNIFORM COLOR on transparent background. All visible areas must have identical color values.`
    };

    try {
        const response = await ai.models.generateContent({
            model: imageEditingModel,
            contents: { parts: [originalImagePart, currentLayerPart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return {
                    base64: part.inlineData.data,
                    mimeType: part.inlineData.mimeType,
                };
            }
        }

        throw new Error("The model did not return an image part in its response.");

    } catch (error) {
        console.error("Error calling Gemini API for layer welding:", error);
        throw new Error("Failed to weld layers from the AI model.");
    }
}

// ⚠️ LAYER 1 CRITICAL: DO NOT MODIFY THIS FUNCTION - WORKING AT 86% SUCCESS RATE
// This function is ONLY for Layer 1 and MUST NOT BE CHANGED
// See /LAYER_1_CRITICAL_DO_NOT_MODIFY.md for details
export async function isolateLayer(base64ImageData: string, mimeType: string, layerDescription: string, layerNumber: number = 1): Promise<{ base64: string, mimeType: string }> {
    const imagePart = {
        inlineData: {
          data: base64ImageData,
          mimeType: mimeType,
        },
      };

    const textPart = {
        text: `Your task is to perform a precise image masking operation for Layer ${layerNumber}. Your output MUST be a PNG image with a transparent alpha channel.

The new image will contain ONLY the specific layer described here: "${layerDescription}".

Follow these rules with absolute precision. These are commands, not suggestions.

1.  **ABSOLUTE PRIORITY: TRANSPARENT BACKGROUND.** The output format MUST be a PNG with a fully transparent background. Everything that is NOT part of the described layer must have an alpha value of 0. DO NOT output a solid background.

2.  **ABSOLUTE PRIORITY: SINGLE FILL UNIFICATION.** The final isolated layer shape you create MUST be unified into a single solid color. Identify the most dominant color of the described area in the original image and use that color for the entire shape. DO NOT include multiple colors, shades, or gradients. The result must be a single, clean shape with one solid fill color.

${layerNumber > 1 ? `3.  **CRITICAL LAYER STACKING RULE:** Layer ${layerNumber} must include the COMPLETE area that this layer occupies in the physical cardstock stack. This includes areas where upper layers sit on top of it. All parts of Layer ${layerNumber} must be welded together as ONE PIECE with the same single color fill where they touch.

4.  **EXECUTION:** Use the description to identify the conceptual component in the original image. Reconstruct the COMPLETE shape of this layer, including areas currently covered by upper layers. Weld all parts together as one unified piece. Produce a new PNG image containing this complete unified component, filled with the single unified color, on a transparent background.` : `3.  **EXECUTION:** Use the description to perfectly identify the correct conceptual component in the original image. Create a precise mask from this component as it appears. Produce a new PNG image containing only this masked component, filled with the unified color, on a transparent background.`}`
    };

    try {
        const response = await ai.models.generateContent({
                model: imageEditingModel,
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return {
                    base64: part.inlineData.data,
                    mimeType: part.inlineData.mimeType,
                };
            }
        }

        throw new Error("The model did not return an image part in its response.");

    } catch (error: any) {
        console.error("Error calling Gemini API for layer isolation:", error);
        // Include the actual error message for debugging
        const errorMessage = error?.message || error?.toString() || "Unknown error";
        throw new Error(`Failed to isolate the layer: ${errorMessage}`);
    }
}

// Generate description for welding step
export async function generateWeldingDescription(base64ImageData: string, mimeType: string, currentLayerDescription: string, layerNumber: number, previousLayers: string[]): Promise<string> {
  const imagePart = {
    inlineData: {
      data: base64ImageData,
      mimeType: mimeType,
    },
  };

  const textPart = {
      text: `Based on the current layer analysis: "${currentLayerDescription}"

Create a detailed description of what the WELDED Layer ${layerNumber} should look like when combined with all previous layers.

Previous layers that will be welded to Layer ${layerNumber}:
${previousLayers.map((desc, idx) => `- Layer ${idx + 1}: ${desc}`).join('\n')}

**WELDING CONCEPT:**
- Layer ${layerNumber} will include ALL areas from previous layers
- All areas (current + previous layers) will be rendered in Layer ${layerNumber} color
- Think: Layer ${layerNumber} + Layer ${layerNumber - 1}${layerNumber > 2 ? ` + Layer ${layerNumber - 2}` : ''} = one unified piece

Your description should specify:
1. What the complete welded Layer ${layerNumber} looks like (current + all previous layer areas)
2. What parts will be transparent (only background areas never part of any layer)
3. The single unified color for all welded areas
4. The overall appearance on a transparent background

Focus on describing the complete physical cardstock piece that would be cut.

Example format: "The welded Layer ${layerNumber} shows [current layer areas] combined with [previous layer areas] all rendered in [Layer ${layerNumber} color]. Only the original background areas remain transparent." `
  };

  try {
    const response = await ai.models.generateContent({
      model: analysisModel,
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: "You are an expert at describing welded layer visualizations for cardstock cutting. Provide clear descriptions of complete welded layers.",
      },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating welding description:", error);
    throw new Error("Failed to generate welding description.");
  }
}