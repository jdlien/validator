# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
