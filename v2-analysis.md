# Validator v2.0.0 Analysis

Analysis of the validator project for antipatterns, size reduction opportunities, and missing features.

**Date:** 2026-01-23
**Current Version:** 1.5.0
**Dependency:** @jdlien/validator-utils (currently ^1.2.8, v2.0.0 available)

---

## 1. Antipatterns / Bad Ideas

### High Priority

| Issue | Location | Problem |
|-------|----------|---------|
| **Expensive MutationObserver** | `Validator.ts:175-178` | Watching `document.body` with `subtree: true` fires on EVERY DOM change anywhere in the document just to check if the form was removed. This is O(n) for all DOM mutations across the entire page. |
| **Repeated string splitting** | Multiple locations | `hiddenClasses.split(' ')`, `errorInputClasses.split(' ')`, and `errorMainClasses.split(' ')` are called every time errors are shown/cleared instead of being pre-split once in the constructor. |
| **Outdated dependency** | `package.json:60` | Using `^1.2.8` of validator-utils but v2.0.0 is available with new date format features and smaller bundle size. |
| **Type duplication** | `types.d.ts` | Duplicates types already exported from `Validator.ts` and is missing `showMainError`. Should either be removed or auto-generated from the source. |

### Medium Priority

| Issue | Location | Problem |
|-------|----------|---------|
| FIXME comment | Line 145 | Known issue: "This doesn't seem to work well if I add a lot of things at once. Needs more testing." |
| Empty callback defaults | Lines 137-138 | Creating new empty arrow functions `(() => {})` each time instead of null-checking before invocation. |
| Copyright year | Line 1 | Still says "©2023 JD Lien" - should be updated. |
| Loose typing | `ValidatorOptions.messages` | Uses generic `object` type instead of `Record<string, string>` for proper type safety. |

---

## 2. Size Reduction Opportunities

**Estimated savings: ~50-80 lines, cleaner architecture**

### 2.1 Remove `types.d.ts`

Everything is already exported from `Validator.ts`. The separate types file:
- Duplicates definitions
- Can get out of sync (already missing `showMainError`)
- Adds maintenance burden

### 2.2 Pre-split class strings

Instead of splitting strings every time they're used:

```typescript
// Current (repeated throughout code):
this.hiddenClasses.split(' ').forEach((className) => { ... })

// Better (split once in constructor):
private hiddenClassList: string[]
private errorMainClassList: string[]
private errorInputClassList: string[]

// In constructor:
this.hiddenClassList = (options.hiddenClasses || 'hidden opacity-0').split(' ')
```

### 2.3 Consolidate custom event classes

`ValidationSuccessEvent` and `ValidationErrorEvent` (lines 29-43) are identical except for the event name:

```typescript
// Current: Two separate classes (14 lines)
export class ValidationSuccessEvent extends Event { ... }
export class ValidationErrorEvent extends Event { ... }

// Better: Single generic class (7 lines)
export class ValidationEvent extends Event {
  constructor(type: 'validationSuccess' | 'validationError', public submitEvent: Event) {
    super(type, { cancelable: true })
  }
}
```

### 2.4 Simplify entry point

`index.ts` currently just re-exports:
```typescript
export default Validator from './src/Validator'
```

Could point vite directly at `Validator.ts` and eliminate this file.

### 2.5 More efficient auto-destroy observer

Instead of watching the entire document with `subtree: true`:

**Option A:** Use `requestIdleCallback` for periodic cleanup checks
```typescript
private scheduleCleanupCheck(): void {
  requestIdleCallback(() => {
    if (!document.contains(this.form)) this.destroy()
    else this.scheduleCleanupCheck()
  })
}
```

**Option B:** Only observe the form's parent, not entire document
```typescript
this.autoDestroyObserver.observe(this.form.parentElement!, {
  childList: true,
})
```

---

## 3. Missing Features

### Expected in a Form Validator

| Feature | Impact | Complexity | Notes |
|---------|--------|------------|-------|
| **Scroll to first error** | High | Low | TODO already noted at line 342 |
| **Min/max value validation** | High | Low | Validate numeric ranges, not just format |
| **Blur event validation** | Medium | Low | Many forms validate on blur, not just change |
| **Programmatic single-input validation** | Medium | Low | `validateSingle(input)` method |
| **Time range validation** | Low | Low | Message exists (`ERROR_TIME_RANGE`) but no implementation |

### Nice to Have

| Feature | Notes |
|---------|-------|
| File input validation | Validate file size, MIME type, extension |
| Credit card / CVV validation | Common in e-commerce forms |
| Accessible live region announcements | Better screen reader support |
| Built-in async validator debouncing | For expensive validation operations |
| Conditional validation | Skip validation based on other field values |
| Form reset handler | Low value - users rarely use reset buttons (bad UX), and programmatic resets can call `init()` manually |

---

## 4. Recommended Actions for v2.0.0

### Must Do

1. **Update validator-utils dependency** to `^2.0.0`
2. **Fix the expensive MutationObserver** - biggest performance issue
3. **Pre-split class strings** - easy win for cleaner code
4. **Remove or regenerate types.d.ts** - reduce duplication
5. **Update copyright year** to 2026

### Should Do

6. **Add scroll-to-first-error option** - already noted as TODO
7. **Add min/max value validation** for number inputs
8. **Consolidate event classes** - cleaner code

### Consider

9. Add blur event validation (opt-in)
10. Add programmatic single-input validation API
11. Implement time range validation (message already exists)

---

## 5. Code Locations Reference

| File | Lines | Purpose |
|------|-------|---------|
| `src/Validator.ts` | 809 | Main validator class |
| `src/types.d.ts` | 24 | Type definitions (duplicate) |
| `index.ts` | 1 | Entry point re-export |
| `package.json` | 62 | Package configuration |
| `vite.config.js` | - | Build configuration |

### Key Methods in Validator.ts

| Method | Line | Purpose |
|--------|------|---------|
| `constructor` | 111 | Initialize validator |
| `setupAutoDestroy` | 166 | MutationObserver setup (needs optimization) |
| `init` | 202 | Register inputs and listeners |
| `validate` | 645 | Main validation orchestrator |
| `validateRequired` | 411 | Required field validation |
| `validateLength` | 452 | Min/max length validation |
| `validateInputType` | 544 | Type-specific validation |
| `validateDateRange` | 565 | Date range validation |
| `showFormErrors` | 343 | Display all errors |
| `destroy` | 777 | Cleanup method |

---

## 6. Breaking Changes to Consider

If releasing as v2.0.0, consider these potentially breaking changes:

1. **Remove `types.d.ts`** - consumers importing from it would need to update
2. **Rename event classes** - if consolidating to single `ValidationEvent`
3. **Change callback signature** - if making callbacks nullable instead of empty functions
4. **Add blur validation by default** - might change existing behavior (make opt-in instead)

---

## 7. Bundle Size Comparison

Current validator-utils dependency:
- v1.2.8: ~8KB minified
- v2.0.0: ~6KB minified (25% smaller)

Potential savings in validator itself:
- Remove types.d.ts: ~0.5KB
- Consolidate events: ~0.3KB
- Pre-split strings: Code quality improvement, minimal size change
- Total estimated savings: ~1KB + cleaner architecture
