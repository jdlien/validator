# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-01-26

Major new release with many different features and fixes. Now depends on v2.1 of `@jdlien/validator-utils`. The bundle size has increased slightly (~1.5KB zipped), but there are lots of new features to make the size well worth it!

### Bundle Size

|        | v1.5.0    | v2.0.0    | Change  |
| ------ | --------- | --------- | ------- |
| Raw    | 21.60 KiB | 27.24 KiB | +26.1%  |
| Gzip   | 7.40 KiB  | 8.85 KiB  | +19.6%  |
| Brotli | 6.59 KiB  | 7.90 KiB  | +19.9%  |

### Added
- **Hybrid Validator Registry System**: Three-tier validator lookup (instance → static → window)
  - `validators` option in constructor for instance-scoped validators (highest priority)
  - `Validator.registerValidator(name, fn)` for global validators shared across instances
  - `Validator.unregisterValidator(name)` to remove a global validator
  - `Validator.getValidators()` returns a copy of all global validators
  - `Validator.clearValidators()` removes all global validators
- `validateSingle(input)` instance method for programmatic single-input validation on demand
- **Static methods for standalone validation** (inputs outside forms):
  - `Validator.validateSingle(input, options?)` - validates any input without needing an instance
  - `Validator.clearInputErrors(input, options?)` - clears errors from any input without an instance
- `clearInputErrors(input)` instance method to clear errors from a specific input
- `clearAllErrors()` instance method to clear all form errors
- `scrollToError` option to scroll to first invalid input on validation failure
- `scrollToErrorDelay` option to delay scroll-to-error behavior (useful for animations)
- Min/max value validation via `data-min`/`data-max` attributes (also respects native `min`/`max`)
- `ERROR_MIN_VALUE` and `ERROR_MAX_VALUE` error messages
- `ValidationEvent` unified event class with `ValidationEventType` type
- Arrow key increment/decrement for `number`, `float`, and `decimal` fields (previously only `integer`)
- `data-arrow-step` attribute to customize arrow key step size (e.g., `data-arrow-step="0.5"`)
- Set `data-arrow-step=""` (empty string) to disable arrow key behavior on numeric fields
- Arrow keys respect `data-min`/`data-max` bounds, clamping values appropriately
- `validateOnBlur` option to validate fields when they lose focus (even if unchanged)
- New type exports: `ValidatorFunction`, `ValidationResult`, `ValidatorRegistry`

### Changed

- `messages` option now typed as `Record<string, string>` (was `object`)
- Integer fields now respect `data-min` for negative values (previously hardcoded to min 0)
- `validateSingle(input)` instance method now only validates inputs belonging to its form (use static `Validator.validateSingle()` for standalone inputs)
- Package exports now include explicit ESM/CJS entry points (UMD still available at `dist/validator.js`)
- Custom validation now uses three-tier lookup: instance registry → static registry → window object
- Demo page updated to use instance registry instead of window functions

### Removed

- `types.d.ts` file (duplicated Validator.ts exports)
- `ValidationSuccessEvent` class (use `ValidationEvent` with type `'validationSuccess'`)
- `ValidationErrorEvent` class (use `ValidationEvent` with type `'validationError'`)
- Automatic MutationObserver-based re-init and auto-destroy (see Breaking Changes)

### Fixed

- Color sync no longer throws when a `type="color"` input has no paired text input
- Custom error messages now apply to type validators (number, email, tel, etc.)
- Error classes on inputs are now removed even when no error element exists
- Stale `inputErrors` entries are cleared when `init()` is called after removing inputs
- Pattern validation no longer throws for invalid regex patterns (treats as pass-through)
- Pattern validation now anchors patterns for full-match behavior (matches HTML5 `pattern` attribute)
- Error border colors on required multi-check/radio inputs are now cleared when any related input is checked

### Breaking Changes

- **Manual reinitialized required after DOM changes:** Previously, Validator would attempt to reinitialize itself if form elements were added or changed in the DOM using a mutationObserver, but this was inefficient and unreliable and was mostly handling niche cases. If you add/remove inputs dynamically, call `validator.init()` after DOM updates.
- **Manual cleanup now required when removing forms:** Previously, Validator would attempt to detect if the form were removed and clean itself up. This could be useful in an SPA or a modal dialog that loads different forms to keep accumulating Validator instances. This is considered an edge-case so Validator no longer handles this itself. Now, if you remove a form from the DOM, call `validator.destroy()` before removing it.
- **Event classes consolidated:** Replace `ValidationSuccessEvent` and `ValidationErrorEvent` with unified `ValidationEvent` class

  ```typescript
  // Before
  form.addEventListener('validationSuccess', (e: ValidationSuccessEvent) => { ... })

  // After
  form.addEventListener('validationSuccess', (e: ValidationEvent) => { ... })
  ```

- **`messages` typing:** Now `Record<string, string>` instead of `object`
- **`types.d.ts` removed:** Import types from `Validator.ts` instead


### Migration Guide

No breaking changes. Existing code using window functions continues to work. To migrate:

```javascript
// Before (still works)
window.myValidator = (value) => value.length > 3

// After (recommended)
const validator = new Validator(form, {
  validators: {
    myValidator: (value) => value.length > 3,
  },
})
```

## [1.5.0] - 2025-01-08

### Added

- **BREAKING CHANGE**: Automatic validator cleanup using MutationObserver - Validator instances now automatically destroy themselves when the form is removed from the DOM
- Comprehensive auto-destroy functionality that handles direct form removal, parent container removal, and innerHTML replacement scenarios
- New `autoDestroyObserver` MutationObserver that monitors the entire document tree for form removal
- Complete test coverage for auto-destroy scenarios in new `Validator.autoDestroy.test.ts` file

### Changed

- **BREAKING CHANGE**: Removed ineffective 'remove' event listener and replaced with robust MutationObserver-based cleanup
- Enhanced `destroy()` method to properly clean up both `formMutationObserver` and `autoDestroyObserver`
- Simplified test files by removing manual `validator.destroy()` calls from all `afterEach` blocks - auto-destroy now handles cleanup
- Updated event listener tests to reflect removal of 'remove' event listener (4 listeners instead of 5)
- Improved TypeScript null assertion handling with proper `!` operators

### Fixed

- Fixed unhandled timeout errors in tests caused by MutationObserver callbacks firing after test teardown
- Resolved memory leaks from dangling MutationObserver instances when forms were removed without calling destroy()
- Fixed test cleanup race conditions by ensuring proper order of operations

### Removed

- Removed unused `cleanupTestForm` utility function and imports
- Removed ineffective 'remove' event listener from `addEventListeners()` and `removeEventListeners()`
- Cleaned up unused npm scripts (`dev:demo` and `build:demo`) keeping only essential `build:css`
- Removed legacy code and comments related to manual cleanup approaches

### Developer Experience

- **Major Improvement**: Developers no longer need to manually call `validator.destroy()` - cleanup is automatic
- Backward compatible: Manual `destroy()` calls still work for edge cases requiring explicit control
- Significantly reduced boilerplate code in applications using the validator
- Enhanced memory safety with automatic cleanup preventing common memory leak scenarios

## [1.4.11] - 2025-05-04

### Changed

- Stopped resetting errors on destroy, we want to leave them in place.

### Known Issues

- Modifying a numeric/integer input and entering non-integer values will cause the cursor to move to the end of the input.

## [1.4.10] - 2025-05-04

### Changed

- More robust destroy method.
- Refactored tests into multiple files with setup utility functions.

## [1.4.9] - 2025-05-01

### Added

- Added `showMainError` option to `ValidatorOptions` to allow disabling the main form error message display.
- Main error message display logic now prioritizes an element with ID `{form.id}-error-main` if the form has an ID, falling back to `form-error-main` if the form-specific element is not found or the form has no ID.

## [1.4.8] - 2025-05-01

Rebuild for npm

## [1.4.7] - 2025-05-01

### Added

- Support for Flux error elements

## [1.4.6] - 2025-04-28

### Changed

- Fixed vitest deprecation warning
- Updated README.md for grammar

## [1.4.5] - 2025-04-16

### Changed

- Updated dependencies
- Fixed broken canvas-related tests

## [1.4.4] - 2025-04-16

### Changed

- Updated dependencies
- Tailwind using v4.1 with css-only configuration

### Fixed

- Color validation tests now work with the updated dependencies. Color picker synchronization is now properly tested.

## [1.3.0] - 2023-05-16

### Changed

- Custom validation functions (passed in via a data-validation attribute) will now always be run in the `validateInput` method. Before, custom validation was not checked unless an input had a value, but this precluded many types of custom validation.

This could be a breaking change if you used a custom validation function (ie via a `data-validation` attribute) for a field that was not required. If you relied on the previous behavior, you must ensure they handle allowing inputs to be empty when not required.

## [1.2.0] - 2023-04-24

### Added

- If an input is disabled, it will be ignored by validation methods. This means that if you have a form with a disabled input, it will not be validated when the form is submitted.

## [1.1.9] - 2023-04-04

### Fixed

- Fixed bug where assigning preventSubmit in the options object would not work as intended.
