import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    throw new Error("Failed to get analysis from the AI model.");
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