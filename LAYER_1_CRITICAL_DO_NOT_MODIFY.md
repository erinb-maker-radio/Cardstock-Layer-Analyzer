# 🚨 CRITICAL: LAYER 1 IMPLEMENTATION - DO NOT MODIFY 🚨

## ⚠️ WARNING: LAYER 1 WORKING AT 86% SUCCESS RATE - ANY CHANGES RISK BREAKING IT

This document contains the EXACT working implementation for Layer 1 isolation that achieves single-color outputs with 86% success rate. 

**DO NOT MODIFY THESE FUNCTIONS FOR LAYER 1 UNDER ANY CIRCUMSTANCES**

---

## Critical Layer 1 Functions - FROZEN IMPLEMENTATION

### 1. generateIsolationDescription for Layer 1
**File:** `services/geminiService.ts`
**Status:** ✅ WORKING - DO NOT CHANGE

```javascript
// For Layer 1, the description MUST use this EXACT prompt:
const textPart = {
    text: `Based on this layer analysis: "${layerAnalysis}"

Create a detailed description of what the ISOLATED Layer ${layerNumber} should look like when extracted with transparency.

Your description should specify:
1. What parts will be visible (the actual Layer ${layerNumber} elements)
2. What parts will be transparent (background and other layer colors)
3. The single unified color/fill that should be applied to all visible elements
4. The overall appearance on a transparent background


Focus on describing the visual result after isolation, not the analysis process.

Example format: "The isolated layer shows [specific elements] rendered in [single color] on a completely transparent background, with all [other colors/elements] areas made transparent." `
};
```

**CRITICAL RULES:**
- NO conditional logic for Layer 1
- NO reconstruction language
- NO welding concepts
- NO shadow handling instructions
- Keep it SIMPLE and CLEAN

---

### 2. isolateLayer for Layer 1
**File:** `services/geminiService.ts`  
**Status:** ✅ WORKING - DO NOT CHANGE

```javascript
// Layer 1 MUST use this EXACT isolation prompt:
const textPart = {
    text: `Your task is to perform a precise image masking operation for Layer ${layerNumber}. Your output MUST be a PNG image with a transparent alpha channel.

The new image will contain ONLY the specific layer described here: "${layerDescription}".

Follow these rules with absolute precision. These are commands, not suggestions.

1.  **ABSOLUTE PRIORITY: TRANSPARENT BACKGROUND.** The output format MUST be a PNG with a fully transparent background. Everything that is NOT part of the described layer must have an alpha value of 0. DO NOT output a solid background.

2.  **ABSOLUTE PRIORITY: SINGLE FILL UNIFICATION.** The final isolated layer shape you create MUST be unified into a single solid color. Identify the most dominant color of the described area in the original image and use that color for the entire shape. DO NOT include multiple colors, shades, or gradients. The result must be a single, clean shape with one solid fill color.


3.  **EXECUTION:** Use the description to perfectly identify the correct conceptual component in the original image. Create a mask from this component. Produce a new PNG image containing only this masked component, filled with the unified color, on a transparent background.`
};
```

**CRITICAL RULES:**
- NO stacking rules for Layer 1
- NO reconstruction instructions
- NO welding language
- EXACTLY 3 rules, not 4
- Simple execution instruction

---

### 3. App.tsx Layer 1 Handler
**File:** `App.tsx`
**Status:** ✅ WORKING - DO NOT CHANGE

```javascript
// In handleIsolateLayer function:
const result = currentLayerNum === 1 
  ? await isolateLayer(imagePart.inlineData.data, imagePart.inlineData.mimeType, description, currentLayerNum)
  : await isolateCurrentLayer(imagePart.inlineData.data, imagePart.inlineData.mimeType, description, currentLayerNum);
```

**CRITICAL:** Layer 1 MUST use `isolateLayer` function, NOT `isolateCurrentLayer`

---

## What Breaks Layer 1 - NEVER DO THESE

### ❌ NEVER Add These to Layer 1:
1. **Reconstruction logic** - "complete shapes", "extend under", etc.
2. **Welding concepts** - "weld together", "combine with", etc.  
3. **Stacking rules** - Any mention of other layers being included
4. **Shadow handling** - Any shadow-related instructions
5. **Conditional complexity** - Complex if/else logic in prompts
6. **Layer 2+ concepts** - Anything about previous layers

### ❌ NEVER Change These Words:
- "Your task is to perform a precise image masking operation"
- "Follow these rules with absolute precision. These are commands, not suggestions."
- "ABSOLUTE PRIORITY"
- "Create a mask from this component"

### ❌ NEVER Add Extra Rules:
- Keep exactly 3 rules for Layer 1, not 4
- No "CRITICAL LAYER STACKING RULE"
- No "RECONSTRUCTION REQUIRED"

---

## Testing Layer 1

Before ANY commit involving layer isolation:

1. **Test Layer 1 isolation at least 10 times**
2. **Verify single-color output** (not 2-color)
3. **Check that only Layer 1 elements are isolated** (no Layer 2 inclusion)
4. **Ensure transparent background**

Success criteria: At least 8/10 successful single-color outputs

---

## Why This Works

Layer 1 works because:
1. **Simple, direct instructions** - No complex logic
2. **Clear masking language** - "Create a mask from this component"  
3. **No reconstruction** - Just isolate what's visible
4. **Proven prompts** - These exact words achieve 86% success

---

## If You Need to Modify Layer Processing

### ✅ Safe to modify:
- Layer 2+ processing (use different functions)
- Welding logic (separate from isolation)
- UI/workflow changes that don't affect core isolation

### ❌ NEVER modify for Layer 1:
- The exact prompt text
- The function structure
- The number of rules
- Any wording in the instructions

---

## Emergency Recovery

If Layer 1 breaks after changes:

1. Check git commit `cf5cb54` for last working version
2. Restore these exact functions:
   - `generateIsolationDescription` (simple version)
   - `isolateLayer` (with 3 rules only)
3. Ensure App.tsx uses `isolateLayer` for Layer 1
4. Remove ALL conditional logic affecting Layer 1

---

## Final Warning

**🚨 THE LAYER 1 IMPLEMENTATION IS FRAGILE 🚨**

Even small wording changes can break the 86% success rate. The AI models are sensitive to:
- Exact phrasing
- Number of rules
- Order of instructions
- Presence of certain keywords

**When in doubt, DO NOT TOUCH Layer 1 code!**