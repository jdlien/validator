# Validator - HTML Form Validation Made Easy

## Introduction

Validator is a utility class that adds automatic validation to your HTML forms that works much like
the HTML5 form validation provided by browsers, but it is much more powerful, flexible, and
customizable.

It can sanitize and check user input in forms, resulting in clean, consistent submissions that
are very user-friendly without unnecessarily constraining the user from entering data in ways that
are convenient for them.

Validator includes the following built-in validation types:

- Required
- Minimum or maximum length
- Pattern (regular expression)
- Numbers (with decimals and negative values)
- Integers (positive whole numbers)
- North American Phone Numbers
- US Zip Codes
- Email Addresses
- Canadian Postal Codes
- Colors (CSS colors, with color picker support)
- Dates (optionally constrained to past or future dates)
- Date and time
- Time of day
- URLs
- Files (type, size, count)

You can also add custom validation and customize error messages per field or for the whole form.

Validator is compatible with all modern browsers. It has no dependencies (other than its validator-utils package). It is written in TypeScript with 100% test coverage.

## Installation

```bash
npm install @jdlien/validator

# or

pnpm add @jdlien/validator
```

## Basic Usage

Create a form as you normally would, adding attributes for inputs to control how Validator will
check the input, such as `required`, `type`, or `data-type`. Native HTML5 attributes are supported,
although often, the browser's built-in validation is problematic or inflexible. In those cases, you
can use a `data-` variant of these attributes to avoid the browser's built-in validation.

Any input that you want to validate should have a unique name attribute. If you want to display error messages for the input, you must also have a div with an id that is the name of the input + `-error`.

If you're using a bundler:

```javascript
import Validator from '@jdlien/validator'
```

If you're using CommonJS:

```javascript
const Validator = require('@jdlien/validator')
```

Then, create a new Validator instance and pass it the form element as the first argument. An optional second argument allows you to pass in options. Here is a simplified example:

```html
<form id="myForm">
  <label for="name">Name</label>
  <input
    type="text"
    name="name"
    id="name"
    required
    data-min-length="2"
    data-max-length="20"
    data-error-default="Enter between 2 and 20 characters."
    aria-describedby="name-error"
  />
  <div id="name-error"></div>

  <label for="email">Email</label>
  <input type="email" name="email" id="email" required />
  <div id="email-error"></div>

  <input type="text" data-type="tel" name="phone" id="phone" />
  <div id="phone-error"></div>

  <input type="submit" value="Submit" />
</form>

<!-- Choose one of the following script tags if you are not using a bundler -->
<!-- ESM - recommended for modern browsers -->
<script type="module">
  import Validator from 'https://unpkg.com/@jdlien/validator/dist/validator.mjs'
  const form = document.getElementById('myForm')
  const validator = new Validator(form)
</script>

<!-- UMD - for legacy browser support (exposes global Validator) -->
<script src="https://unpkg.com/@jdlien/validator/dist/validator.js"></script>
<script>
  const form = document.getElementById('myForm')
  const validator = new Validator(form)
</script>
```

When initialized, Validator disables browser validation and displays error messages in an associated page element. It identifies the appropriate element by searching for an ID in the following order:

1. The value in the input's `aria-describedby` attribute, if it exists
2. The ID of the input + `-error`
3. The name of the input + `-error`

Using the aria-describedby attribute to link an error message with an input is the most robust and effective method. Also, this enhances accessibility by enabling screen readers to announce the error when the input is focused.

If you wish to customize the default error message, you can also set one for a field using `data-error-default`.

## Demo

[Working demo on jdlien.com](https://jdlien.com/validator/demo/).

## Supported Input Types and Attributes

Validator works by checking for certain attributes on the form inputs and applying validation based on those.
In many cases, you can use the native HTML5 attributes, but you can also use the `data-` attributes if you do not want the behavior to be affected by built-in browser validation behavior (e.g., for min-length, max-length, and input types such as date and time).

There are a few attributes that Validator looks for on the form element:

- `data-prevent-submit` - If this attribute is present, the form will never be submitted, even if it is valid. This is useful if you want to handle the submission yourself. (By default, the form will be submitted if it is valid and not if it is invalid.)

- `novalidate` - This is a native HTML5 attribute that disables browser validation on the form. Validator adds this by default and removes it if `destroy()` is called. If you add it yourself, it will not be added back by Validator.

On input (and sometimes select and textarea) elements, the following attributes are supported:

- `required` - The input must have a value.
- `minlength`/`data-min-length` - The input must be at least the specified number of characters.
- `maxlength`/`data-max-length` - The input must be no more than the specified number of characters.
- `pattern`/`data-pattern` - The input must match the specified regular expression.
- `type`/`data-type` - The input must match the specified type. The following types are supported:

  - `number` (also `float`/`decimal`) - The input must be a number (use `data-type` to avoid quirky browser behavior)
  - `integer` - The input must be a positive whole number.
  - `tel` - The input must be a valid North American phone number.
  - `email` - The input must be a valid email address.
  - `zip` - The input must be a valid US zip code.
  - `postal` - The input must be a valid Canadian postal code.
  - `date` - The input must be a valid date.
  - `datetime` - The input must be a valid date and time.
  - `time` - The input must be a valid time.
  - `url` - The input must be a valid URL.
  - `color` - The input must be a valid CSS color. (This can be used in conjunction with a native color input - see Color Picker Support for details.)

- `data-date-format`/`data-time-format` - Applies formatting to date, time, or datetime inputs (these are interchangeable). The format must be a valid moment.js format string. See [moment.js docs](https://momentjs.com/docs/#/displaying/format/) for more information.
- `data-date-range` - Applies to date input types. Supported values are `past`, `future`, and `today`.
- `data-min`/`data-max` - Applies to numeric input types (`number`, `integer`, `float`, `decimal`). Validates that the numeric value is within the specified range. Also respects the native `min`/`max` attributes, but `data-` attributes take precedence.
- `data-arrow-step` - Applies to numeric input types (`number`, `integer`, `float`, `decimal`). Sets the arrow key step size (defaults to `1`). Set `data-arrow-step=""` to disable arrow key handling for the field.
- `data-error-default` - A custom error message to display if the input is invalid. This will be used for required, pattern, and date-range validation failures.
- `data-validation` - The name of a custom validation function.
- `data-novalidate` - If this attribute is present, the input will not be validated when `input` or `change` events are triggered on it.
- `data-max-files` - Applies to file inputs. Limits the number of files a user can upload.
- `data-min-file-size`/`data-max-file-size` - Applies to file inputs. Enforces min/max size per file. Accepts human-readable sizes like `200kb` (base 10), `2mib` (base 2), `1.5gb`.
- `accept`/`data-accept` - Applies to file inputs. Restricts allowed file types using MIME types and/or extensions. `data-accept` takes precedence over `accept`.

A validation function will be called with the input value as the argument. The function may either return a boolean (true/false) or an object with a `valid` property that is a boolean. If the function returns a string or an object with a `message` property, that will be used as the error message for the input. A `messages` array may also be specified which will be used to display multiple error messages for the input.

You may also use a promise that resolves to such an object for asynchronous validation.

### Registering Custom Validators

There are three ways to register custom validators, listed in order of lookup priority:

#### 1. Instance Registry (Recommended)

Pass validators directly to the Validator constructor. This is the recommended approach as it provides the best type safety and keeps validators scoped to specific forms.

```javascript
const validator = new Validator(form, {
  validators: {
    validateUsername: (value) => {
      if (value.length < 3) return 'Username must be at least 3 characters'
      return true
    },
    validateEmail: async (value) => {
      const res = await fetch(`/api/check-email?email=${encodeURIComponent(value)}`)
      return res.ok ? true : 'Email already taken'
    },
  },
})
```

#### 2. Static Registry (For Shared Validators)

Use `Validator.registerValidator()` to make validators available to all Validator instances. Useful for reusable validators across your application.

```javascript
// Register globally (available to all forms)
Validator.registerValidator('validatePhone', (value) => {
  return /^\d{10}$/.test(value) ? true : 'Enter a 10-digit phone number'
})

// Later, in any form...
const validator = new Validator(form)
// Input with data-validation="validatePhone" will use the registered validator

// Other static methods:
Validator.unregisterValidator('validatePhone') // Remove a validator
Validator.getValidators() // Get all registered validators (returns a copy)
Validator.clearValidators() // Remove all registered validators
```

#### 3. Window Object (Legacy)

For backward compatibility, validators can be defined on the window object. This is not recommended for new code.

```javascript
window.validateCustom = (value) => {
  return value === 'valid' ? true : 'Invalid value'
}
```

### Lookup Priority

When resolving a validator by name, Validator checks in this order:

1. **Instance registry** (validators passed to constructor)
2. **Static registry** (Validator.registerValidator)
3. **Window object** (legacy fallback)

This allows you to override global validators for specific forms when needed.

### Validator Function Examples

A simple synchronous validator:

```javascript
function customValidation(value) {
  if (value === 'foo') return 'The value cannot be foo.'

  return true
}
```

An async validator using fetch:

```javascript
async function customValidationPromise(value) {
  const response = await fetch(`https://api.example.com/validate-username?username=${value}`)
  const result = await response.json()
  return result.valid ? true : 'Email is invalid'
}
```

## Displaying Error Messages

If any form validation fails on submission, Validator displays a main error message near the top of the form. By default, it looks for an element with the ID `form-error-main`. However, if the form itself has an `id` attribute (e.g., `<form id="contact-form">`), Validator will first look for a main error element with the ID `{form.id}-error-main` (e.g., `contact-form-error-main`). If that form-specific element is not found, it falls back to looking for `form-error-main`.

This allows for more targeted styling and placement of the main error message per form. You can disable the display of this main error message entirely by setting the `showMainError` option to `false`.

For individual input errors, it is recommended to create an error message element (likely a div) with a unique id and then use its id in an `aria-describedby` attribute in each associated input. This will ensure that Validator knows exactly what error element is associated with each input, and this works seamlessly for groups of inputs, like radio buttons. This will also confer improved accessibility and allow screen readers to announce the error message when the input is focused.

If you do not use `aria-describedby`, Validator will fall back to displaying error messages in the first element having the id or name of the input + `-error`. For example, if the input id is `inputid`, the error message will be displayed in the div with the id `inputid-error`.

It is recommended to initially hide error elements with a class that sets properties such as `display: none;`, `visibility: hidden;`, or `opacity: 0;`.

You can customize the class(es) that Validator uses to hide the error messages by passing in a `hiddenClasses` option to the Validator constructor. The default is `hidden opacity-0`.

## Color Picker Support

If you need to allow a user to pick a color, you can use data-type="color" and the input will be required to be any valid CSS color supported by the browser. This type can also work in conjunction with a native color input. If you do this, you will need to add an input with `type="color"` and the name of the data-color input + `-color`. This should be inside a linked label, which will become the color preview swatch. Such a label should have an ID of the color input's name + `-color-label` so that Validator can change the background to the specified color.

A basic example that would work:

```html
<input type="text" id="yourColor" data-type="color" name="yourColor" data-error-default="" />

<!-- A sample of the color in "yourColor" will be displayed as the background of this label -->
<label for="yourColor-color" id="yourColor-color-label" style="width: 40px; height: 40px">
  <!-- Clicking this invokes the browser's native color picker -->
  <input type="color" id="yourColor-color" name="yourColor-color" style="visibility: hidden" />
</label>

<div class="error hidden" id="yourColor-error"></div>
```

## Options

The second parameter to the Validator constructor is an options object. The following options are available:

- `messages` - An object containing custom error messages. The default messages can be overridden by passing in a custom message object. These are all the default messages:

```javascript
messages = {
  ERROR_MAIN: 'There is a problem with your submission.',
  ERROR_GENERIC: 'Enter a valid value.',
  ERROR_REQUIRED: 'This field is required.',
  OPTION_REQUIRED: 'An option must be selected.',
  CHECKED_REQUIRED: 'This must be checked.',
  ERROR_MAXLENGTH: 'This must be ${val} characters or fewer.',
  ERROR_MINLENGTH: 'This must be at least ${val} characters.',
  ERROR_MIN_VALUE: 'The value must be at least ${val}.',
  ERROR_MAX_VALUE: 'The value must be at most ${val}.',
  ERROR_NUMBER: 'This must be a number.',
  ERROR_INTEGER: 'This must be a whole number.',
  ERROR_TEL: 'This is not a valid telephone number.',
  ERROR_EMAIL: 'This is not a valid email address.',
  ERROR_ZIP: 'This is not a valid zip code.',
  ERROR_POSTAL: 'This is not a valid postal code.',
  ERROR_DATE: 'This is not a valid date.',
  ERROR_DATE_PAST: 'The date must be in the past.',
  ERROR_DATE_FUTURE: 'The date must be in the future.',
  ERROR_DATE_RANGE: 'The date is outside the allowed range.',
  ERROR_DATETIME: 'This is not a valid date and time.',
  ERROR_TIME: 'This is not a valid time.',
  ERROR_URL: 'This is not a valid URL.',
  ERROR_COLOR: 'This is not a valid CSS colour.',
  ERROR_FILE_TYPE: 'This file type is not allowed.',
  ERROR_FILE_MAX_FILES: 'You can upload up to ${val} file(s).',
  ERROR_FILE_MAX_SIZE: 'Each file must be ${val} or smaller.',
  ERROR_FILE_MIN_SIZE: 'Each file must be at least ${val}.',
  ERROR_CUSTOM_VALIDATION: 'There was a problem validating this field.',
}
```

- `debug` - A boolean indicating whether or not to show debug messages in the console. Defaults to false.
- `autoInit` - A boolean indicating whether or not to automatically initialize the Validator instance on page load. Defaults to true.
- `preventSubmit` - A boolean indicating whether or not to prevent form submission if validation is successful. Defaults to false.
- `hiddenClasses` - A string containing one or more space-separated classes to toggle the hidden mode (e.g., `display: none` CSS property) on hidden elements. Defaults to `hidden opacity-0`.
- `errorMainClasses` - A string containing one or more space-separated classes to apply to the main error message.
- `errorInputClasses` - A string containing one or more space-separated classes to apply to invalid inputs.
- `showMainError` - A boolean indicating whether or not to show the main error message. Defaults to `true`.
- `scrollToError` - A boolean indicating whether to scroll to and focus the first invalid input when validation fails. Defaults to `false`.
- `scrollToErrorDelay` - A number (ms) to delay scroll-to-error behavior. Defaults to `0`.
- `validateOnBlur` - A boolean indicating whether to validate fields when they lose focus, even if the value hasn't changed. Useful for showing errors on touched-but-empty required fields. Defaults to `false`.
- `validationSuccessCallback` - A function to be called when validation is successful.
- `validationErrorCallback` - A function to be called when validation fails.
- `validators` - An object mapping validator names to functions. These validators have the highest lookup priority (see Registering Custom Validators).

### Example:

```javascript
import Validator from '@jdlien/validator'

const myForm = document.querySelector('form')
const myValidator = new Validator(myForm, {
  messages: {
    ERROR_REQUIRED: 'This is required.',
    ERROR_EMAIL: 'Invalid email address.',
  },
  debug: true,
  preventSubmit: true,
  hiddenClasses: 'hidden',
  errorMainClasses: 'error-main',
  errorInputClasses: 'error-input',
  validationSuccessCallback: () => console.log('Validation successful!'),
  validationErrorCallback: () => console.log('Validation failed.'),
})
```

## Methods

### Instance Methods

#### `validateSingle(input): Promise<boolean>`

Validates a single input that belongs to the form and displays any error messages. Returns `true` if the input is valid, `false` otherwise.

This is useful for:

- **Multi-step forms/wizards** - Validate each step before allowing progression
- **Dependent field validation** - Validate field A when field B changes
- **Custom validation triggers** - Validate on demand rather than relying on events
- **Dynamic form updates** - Validate after programmatically updating a field's value

```javascript
const validator = new Validator(form)
const emailInput = document.getElementById('email')

// Validate a single input on demand
const isValid = await validator.validateSingle(emailInput)

if (isValid) {
  // Proceed to next step
} else {
  // Error messages are automatically displayed
}
```

Notes:

- Only validates inputs that belong to the validator's form
- Returns `true` for inputs not in the form or disabled inputs (use `Validator.validateSingle()` for standalone inputs)
- Clears previous errors before validating
- Displays error messages in the associated error element
- Works with all form control types (input, select, textarea)

#### `clearInputErrors(input): void`

Clears validation errors from a specific input element.

```javascript
validator.clearInputErrors(emailInput)
```

#### `clearAllErrors(): void`

Clears all validation errors from the form, including the main error message and all input errors.

```javascript
validator.clearAllErrors()
```

#### `init(): void`

Re-initializes the validator, refreshing the list of form inputs. Call this after dynamically adding or removing inputs.

#### `destroy(): void`

Removes all event listeners and restores the form's original `novalidate` state. Call this before removing the form from the DOM.

### Static Methods

These methods allow validation without creating a Validator instance, useful for standalone inputs outside of forms.

#### `Validator.validateSingle(input, options?): Promise<boolean>`

Validates any input element without needing a Validator instance. Useful for standalone fields outside of forms.

```javascript
// Validate a standalone input (not in a form)
const standaloneInput = document.getElementById('standalone-email')
const isValid = await Validator.validateSingle(standaloneInput)

// With custom options
const isValid = await Validator.validateSingle(standaloneInput, {
  validators: {
    customCheck: (value) => value.length > 5 || 'Too short',
  },
})
```

#### `Validator.clearInputErrors(input, options?): void`

Clears validation errors from any input element without needing a Validator instance.

```javascript
Validator.clearInputErrors(standaloneInput)
```

## Events

Validator dispatches two custom events on the form during submission validation:

- `validationSuccess` - Fired when the form is valid.
- `validationError` - Fired when the form is invalid.

Both events are instances of `ValidationEvent` and include the original submit event as `submitEvent`.

## Dynamic Forms and Cleanup

Validator does not watch the DOM for changes. If you add or remove inputs after initialization
(for example, injecting fields with JavaScript or swapping Blade partials), call `init()` again
to refresh the list of inputs and their error state.

If you remove the form from the page (such as when closing a modal or navigating in an SPA),
call `destroy()` first to remove event listeners and restore the form's original `novalidate` state.

```javascript
const validator = new Validator(form)

// After dynamically adding/removing inputs:
validator.init()

// Before removing the form from the DOM:
validator.destroy()
form.remove()
```

## Utility Functions

Validator uses its own `@jdlien/validator-utils` for several utility functions that may be useful in your own code. You may use this package directly if you need any of these functions without using the Validator class.

If you wish to use these, you may import the functions directly from the module as an object that contains all the functions:

```javascript
// Import all the functions into a validatorUtils object
import * as validatorUtils from '@jdlien/validator-utils'
// Or just import the functions you need
import { parseDate, formatDateTime } from '@jdlien/validator-utils'
```

Here is a list of the utility functions:

- **isFormControl**: Determines if an element is an HTML input, select, or textarea element.
- **isType**: Checks if an element has a type or data-type attribute matching one of the passed values.
- **momentToFPFormat**: Converts a moment.js-style format string to the flatpickr format.
- **monthToNumber**: Converts month string or number to a zero-based month number (January == 0).
- **yearToFull**: Converts a year string or number to a 4-digit year.
- **parseDate**: Parses a date string or Date object into a Date object.
- **parseTime**: Parses a time string into an object with hour, minute, and second properties.
- **parseTimeToString**: Parses a time string into a formatted string.
- **formatDateTime**: Formats a date string or Date object into a string with a specified format.
- **parseDateToString**: Parses a date string or Date object into a formatted string with the specified moment.js-style date format.
- **isDate**: Determines if a value is a valid date.
- **isDateInRange**: Determines if a date falls within a specified range (either past or future).
- **isTime**: Determines if a value is a valid time.
- **isEmail**: Determines if a value is a valid email address.
- **parseNANPTel**: Parses a North American phone number string into a standardized format.
- **isNANPTel**: Determines if a value is a valid North American phone number.
- **parseInteger**: Parses an integer string into a standardized format.
- **isNumber**: Determines if a value is a valid number.
- **parseNumber**: Parses a number string into a standardized format.
- **isInteger**: Determines if a value is a valid integer.
- **parseUrl**: Parses a URL string into a standardized format.
- **isUrl**: Determines if a value is a valid URL.
- **parseZip**: Parses a zip code string into a standardized format.
- **isZip**: Determines if a value is a valid zip code.
- **parsePostalCA**: Parses a Canadian postal code string into a standardized format.
- **isPostalCA**: Determines if a value is a valid Canadian postal code.
- **isColor**: Determines if a value is a valid color.
- **parseColor**: Parses a color string into a standardized format.
- **normalizeValidationResult**: Normalizes a validation result (like a boolean or string) into an object with a valid property and a messages array of strings.

## Breaking Changes in v2.0.0

### Event Classes Consolidated

The separate `ValidationSuccessEvent` and `ValidationErrorEvent` classes have been replaced with a unified `ValidationEvent` class:

```javascript
// Before (v1.x)
import type { ValidationSuccessEvent, ValidationErrorEvent } from '@jdlien/validator'
form.addEventListener('validationSuccess', (e: ValidationSuccessEvent) => { ... })

// After (v2.0)
import type { ValidationEvent } from '@jdlien/validator'
form.addEventListener('validationSuccess', (e: ValidationEvent) => { ... })
form.addEventListener('validationError', (e: ValidationEvent) => { ... })
```

The `ValidationEvent` class has a `type` property that is either `'validationSuccess'` or `'validationError'`, and a `submitEvent` property containing the original form submission event.

### Types File Removed

The separate `types.d.ts` file has been removed. All types are now exported directly from the main module.

## Contributing

Install dev dependencies:

```bash
pnpm install
```

When running Vite, you may get an error like

```
Module did not self-register: '...\node_modules\canvas\build\Release\canvas.node'
```

If that happens, you
need to install the canvas module manually: `pnpm rebuild canvas --update-binary`
