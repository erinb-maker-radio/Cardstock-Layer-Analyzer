/**
 * 🚨 READ FIRST: /DEVELOPMENT_GUIDE.md
 * 
 * CRITICAL: This file contains core AI logic for layer analysis.
 * Changes to prompts, parameters, or logic MUST maintain >90% visual success rate.
 * Review development guide before making ANY changes.
 * 
 * Key responsibilities:
 * - Layer 1 identification with strict consistency rules
 * - Single-fill layer isolation (no multi-color mixing)
 * - Transparent background generation
 * - Temperature-controlled AI parameters for deterministic output
 */
import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const analysisModel = 'gemini-2.5-flash';
const imageEditingModel = 'gemini-2.5-flash-image-preview';

const analysisSystemInstruction = `
You are an expert in analyzing layered vector art and papercraft. 
Your task is to identify "Layer 1" from an image provided by the user.
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

4.  **Layer Identification:** Layer 1 is the most foreground conceptual component.
  
You MUST respond in JSON format.
`;

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    layer_1_description: {
      type: Type.STRING,
      description: 'A detailed visual description of only the identified Layer 1. Be specific about its shape, color, and position.'
    },
    reasoning: {
      type: Type.STRING,
      description: 'A brief explanation of why this was identified as Layer 1, referencing the provided rules.'
    }
  },
  propertyOrdering: ["layer_1_description", "reasoning"],
};


export async function analyzeImageLayer(base64ImageData: string, mimeType: string) {
  const imagePart = {
    inlineData: {
      data: base64ImageData,
      mimeType: mimeType,
    },
  };

  const textPart = {
      text: "Based on the rules, analyze the provided image and identify Layer 1."
  };

  try {
    const response = await ai.models.generateContent({
      model: analysisModel,
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: analysisSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
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

export async function generateIsolationDescription(base64ImageData: string, mimeType: string, layerAnalysis: string): Promise<string> {
  const imagePart = {
    inlineData: {
      data: base64ImageData,
      mimeType: mimeType,
    },
  };

  const textPart = {
      text: `Based on this layer analysis: "${layerAnalysis}"

Create a detailed description of what the ISOLATED layer should look like when extracted with transparency.

Your description should specify:
1. What parts will be visible (the actual layer elements)
2. What parts will be transparent (background and other layer colors)
3. The single unified color/fill that should be applied to all visible elements
4. The overall appearance on a transparent background

Focus on describing the visual result after isolation, not the analysis process.

Example format: "The isolated layer shows [specific elements] rendered in [single color] on a completely transparent background, with all [other colors/elements] areas made transparent."`
  };

  try {
    const response = await ai.models.generateContent({
      model: analysisModel,
      contents: { parts: [imagePart, textPart] },
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

export async function isolateLayer(base64ImageData: string, mimeType: string, layerDescription: string): Promise<{ base64: string, mimeType: string }> {
    const imagePart = {
        inlineData: {
          data: base64ImageData,
          mimeType: mimeType,
        },
      };

    const textPart = {
        text: `Your task is to perform a precise image masking operation. Your output MUST be a PNG image with a transparent alpha channel.

The new image will contain ONLY the specific layer described here: "${layerDescription}".

Follow these rules with absolute precision. These are commands, not suggestions.

1.  **ABSOLUTE PRIORITY: TRANSPARENT BACKGROUND.** The output format MUST be a PNG with a fully transparent background. Everything that is NOT part of the described layer must have an alpha value of 0. DO NOT output a solid background.

2.  **ABSOLUTE PRIORITY: SINGLE FILL UNIFICATION.** The final isolated layer shape you create MUST be unified into a single solid color. Identify the most dominant color of the described area in the original image and use that color for the entire shape. DO NOT include multiple colors, shades, or gradients. The result must be a single, clean shape with one solid fill color.

3.  **EXECUTION:** Use the description to perfectly identify the correct conceptual component in the original image. Create a mask from this component. Produce a new PNG image containing only this masked component, filled with the unified color, on a transparent background.`
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

    } catch (error) {
        console.error("Error calling Gemini API for layer isolation:", error);
        throw new Error("Failed to isolate the layer from the AI model.");
    }
}