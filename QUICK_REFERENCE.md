<!--
🔒 PROTECTED DOCUMENT 🔒  
Changes require authorization from: erinb-maker-radio
Last authorized change: 2025-09-07 by erinb-maker-radio (initial creation)
-->

# Quick Reference - Layer Analysis Rules

## 🔥 Critical Rules (Never Violate)

### Single Fill Principle
- ✅ One solid color per layer
- ✅ One gradient per layer  
- ❌ Multiple unrelated colors in same layer

### Layer 1 Definition
- Most foreground conceptual component
- For black/white images: ALL BLACK elements combined

### AI Parameters (Don't Change)
```typescript
// Analysis
temperature: 0.1, topP: 0.8, topK: 10

// Isolation  
temperature: 0.01, topP: 0.5, topK: 5
```

### Success Targets
- Visual accuracy: >90%
- Transparent backgrounds: 100%
- Single-fill compliance: 100%

## 🧪 Before Making Changes
1. Run testing suite (10 iterations)
2. Document current success rate
3. Make changes
4. Re-test immediately
5. Rollback if success drops

## 🚨 Emergency Rollback
If success rate drops below 80%:
1. Revert last changes immediately
2. Re-run tests to confirm recovery
3. Review DEVELOPMENT_GUIDE.md
4. Plan smaller incremental changes