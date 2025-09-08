<!--
🔒 PROTECTED DOCUMENT 🔒
Changes require authorization from: erinb-maker-radio  
Last authorized change: 2025-09-07 by erinb-maker-radio (initial creation)
-->

# Developer Onboarding Checklist

## ✅ Before Starting Work

- [ ] Read `/DEVELOPMENT_GUIDE.md` completely
- [ ] Review `/QUICK_REFERENCE.md` for critical rules
- [ ] Understand the Single Fill Principle
- [ ] Know the 4 Layer Analysis Rules
- [ ] Understand current success rate targets (>90% visual accuracy)

## ✅ Before Making Changes

- [ ] Identify impact area (UI, AI logic, testing, etc.)
- [ ] Run current testing suite to establish baseline
- [ ] Document current success rate
- [ ] Plan minimal incremental changes
- [ ] Backup current working state

## ✅ During Development

- [ ] Make one small change at a time
- [ ] Test immediately after each change
- [ ] Monitor success rate continuously
- [ ] Document any regressions immediately
- [ ] Keep changes reversible

## ✅ Before Committing

- [ ] Run full testing suite (10 iterations)
- [ ] Verify success rate ≥90% for visual accuracy
- [ ] Check single-fill compliance (no multi-color layers)
- [ ] Verify transparent backgrounds (no gray backgrounds)
- [ ] Update documentation if rules changed
- [ ] Add meaningful commit message with test results

## ✅ When Things Break

- [ ] Stop making changes immediately
- [ ] Revert to last known working state
- [ ] Re-run tests to confirm recovery
- [ ] Review what went wrong
- [ ] Plan smaller changes
- [ ] Update documentation with lessons learned

## ✅ File Header Requirements

Every file must have:
```typescript
/**
 * 🚨 READ FIRST: /DEVELOPMENT_GUIDE.md
 * 
 * [Brief description of file purpose]
 * [Any critical constraints or requirements]
 */
```

## 🚨 Never Change Without Documentation Update

- Layer analysis rules (1-4)
- Single fill principle definition
- AI temperature/parameter settings
- Success rate thresholds
- Core prompt structures
- Testing methodology

## 📞 When Stuck

1. Re-read development guide
2. Check quick reference
3. Run tests to understand current state
4. Make minimal test changes
5. Document findings