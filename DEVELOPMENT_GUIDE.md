<!--
🔒 PROTECTED DOCUMENT 🔒
Changes require authorization from: erinb-maker-radio
Unauthorized modifications will be reverted
Last authorized change: 2025-09-07 by erinb-maker-radio (initial creation)
-->

# Cardstock Layer Analyzer - Development Guide

## 🚨 CRITICAL: READ THIS FIRST BEFORE ANY CHANGES

This document contains the foundational rules, concepts, and architectural decisions for the Cardstock Layer Analyzer project. **ALL developers and AI assistants MUST read and understand this guide before making any code changes.**

---

## Core Project Concept

The Cardstock Layer Analyzer identifies and isolates layers from vector art and papercraft designs. Each layer represents a single conceptual component that would be cut from one sheet of cardstock.

---

## 🎯 Layer Analysis Rules (IMMUTABLE)

### Rule 1: The Conceptual Component Rule
- A layer is a **single conceptual component** of artwork
- Components are sets of shapes cut from **the same single sheet of cardstock**
- Example: All black butterfly outlines + circular frame = one black cardstock layer

### Rule 2: Single Fill Principle
**CRITICAL**: Each layer must have ONE unified fill:
- ✅ **Allowed**: Single solid color (e.g., pure black #000000)
- ✅ **Allowed**: Single gradient (one color transitioning to another)
- ❌ **FORBIDDEN**: Multiple unrelated colors in the same layer
- ❌ **FORBIDDEN**: Patchwork of different colors

### Rule 3: Layer Hierarchy
- **Layer 1**: Most foreground conceptual component
- For black/white images: typically ALL BLACK elements = Layer 1
- Background elements are lower numbered layers

### Rule 4: Exclusions
**Never include** as part of a layer:
- Shadows cast by other objects
- Thin outlines bordering different colored shapes
- Stylistic additions that aren't physical cardstock pieces

---

## 🤖 AI Prompt Engineering Guidelines

### Temperature & Randomness Control
```typescript
// For Analysis (text generation)
temperature: 0.1   // Low for consistency
topP: 0.8         // Reduced randomness  
topK: 10          // Limit token selection

// For Image Generation (isolation)
temperature: 0.01  // Extremely low for strict consistency
topP: 0.5         // Very reduced randomness
topK: 5           // Severely limit token choices
```

### Prompt Structure Requirements

#### Analysis Prompts Must Include:
1. **Consistency emphasis**: "Be extremely consistent and deterministic"
2. **Core rules reference**: All 4 layer analysis rules
3. **JSON schema enforcement**: Structured output only
4. **Specific guidance**: For black/white images, focus on black elements

#### Isolation Prompts Must Include:
1. **Background rule**: "100% transparent (alpha=0)"
2. **Single fill rule**: Clear explanation with examples
3. **Color preservation**: "Preserve original dominant color"
4. **Output format**: PNG with transparency

---

## 📁 File Architecture

### Core Services
- `services/geminiService.ts`: AI model interactions
  - `analyzeImageLayer()`: Identifies Layer 1
  - `isolateLayer()`: Generates isolated layer image

### UI Components
- `components/TestingSuite.tsx`: Automated testing interface
- `components/ImageViewer.tsx`: Image display
- `components/AnalysisResult.tsx`: Results display

### Testing System
- Testing suite runs 10 iterations to measure consistency
- Success metrics: Visual accuracy + description consistency
- Critical: Must maintain >90% success rate for visual output

---

## ⚠️ Development Constraints

### What You CAN Change
- UI styling and layout
- Component organization
- Performance optimizations
- Additional features that don't affect core analysis

### What You CANNOT Change Without Documentation Update
- Layer analysis rules (Rules 1-4)
- Single fill principle
- AI model parameters (temperature, topP, topK)
- Core prompt structure
- Success rate thresholds

---

## 🧪 Testing Requirements

### Before Any Changes
1. Run 10-test suite on butterfly image
2. Measure success rate (target: >90% visual accuracy)
3. Verify single-fill compliance
4. Check description consistency

### After Changes
1. Re-run testing suite
2. Compare before/after metrics
3. Document any regressions
4. Update this guide if rules change

---

## 🔧 Making Changes Safely

### Step 1: Understand Impact
- Will this change affect layer analysis logic?
- Will this change AI prompts or parameters?
- Will this change core UI functionality?

### Step 2: Test Current State
- Run testing suite to establish baseline
- Document current success rates

### Step 3: Implement & Verify
- Make minimal changes
- Test immediately
- Rollback if success rate drops

### Step 4: Update Documentation
- Update this guide if rules changed
- Update inline comments
- Update header references

---

## 📝 Code Standards

### File Headers
Every file must include reference to this guide:
```typescript
/**
 * 🚨 READ FIRST: /DEVELOPMENT_GUIDE.md
 * 
 * This file is part of Cardstock Layer Analyzer.
 * Review the development guide before making changes.
 */
```

### Inline Documentation
- Document any deviations from standard patterns
- Explain AI prompt engineering decisions
- Note performance-critical sections

---

## 🎨 UI/UX Principles

### Testing Mode
- Must be easily accessible (toggle button)
- Visual results displayed in grid format
- Success rate clearly indicated
- Detailed descriptions expandable

### Error Handling
- Clear error messages for API failures
- Graceful degradation for network issues
- User-friendly retry mechanisms

---

## 🔄 Version Control

### Commit Messages
- Reference this guide for significant changes
- Include test results for prompt/parameter changes
- Document success rate impacts

### Branch Strategy
- Test all changes in development environment
- Require testing suite validation before merge
- Maintain stable main branch

---

## 📊 Success Metrics

### Current Benchmarks (as of implementation)
- Visual accuracy: Target >90%
- Description consistency: Varies (acceptable due to model limitations)
- Single-fill compliance: Must be 100%
- Background transparency: Must be 100%

### Regression Indicators
- Success rate drops below 80%
- Multi-color layers appearing
- Gray backgrounds instead of transparent
- Complete analysis failures

---

## 🚀 Future Development

### Planned Features
- Parameter controls for different image types
- Batch processing capabilities
- Export functionality for isolated layers
- Custom prompt templates

### Architecture Considerations
- Maintain modular service architecture
- Keep AI logic separated from UI logic
- Preserve testing infrastructure
- Document any new analysis rules

---

## 📞 Support & Questions

When encountering issues:
1. Review this guide first
2. Check current success rates
3. Verify against established rules
4. Test changes incrementally
5. Update documentation as needed

---

**Last Updated**: [Auto-generated on each change]
**Current Success Rate**: [Run testing suite to update]
**Version**: 1.0