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
- North-American Phone Numbers
- US Zip Codes
- Email Addresses
- Canadian Postal Codes
- Colors (CSS colors, with color picker support)
- Dates (optionally constrained to past or future dates)
- Time of day
- URLs

You can also add custom validation, and can customize error messages per field or for the whole form.

Validator is compatible with all modern browsers. It has no dependencies (other than its validator-utils package). It is written in TypeScript with 100% test coverage.

## Installation

```bash
npm install @jdlien/validator

# or

yarn add @jdlien/validator
```

## Basic Usage

Create a form as you normally would, adding attributes for inputs to control how Validator will
check the input, such as `required`, `type`, or `data-type`. Native HTML5 attributes are supported,
although often the browser's built-in validation is problematic or inflexible. In those cases, you
can use a `data-` variant of these attributes to avoid the browser's built-in validation.

Any input that you want to validate should have a unique name attribute. If you want to display error messages for the input, you must also have a div with an id that is the name of the input + `-error`.

Then create a new Validator instance and pass it the form element as the first argument. An optional second argument allows you to pass in options. Here is a simplified example:

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
  />
  <div id="name-error"></div>

  <label for="email">Email</label>
  <input type="email" name="email" id="email" required />
  <div id="email-error"></div>

  <input type="text" data-type="tel" name="phone" id="phone" />
  <div id="phone-error"></div>

  <input type="submit" value="Submit" />
</form>

<!-- Include the validator.js file if you are not using a module bundler -->
<script src="./dist/validator.js"></script>
<script>
  const form = document.getElementById('myForm')
  const validator = new Validator(form)
</script>
```

When Validator is initialized, it will disable the built-in browser validation and show error messages from Validator in the divs with the id of the input name + `-error`.

You can also pass in a custom default error message for a field using `data-error-default`.

## Demo

[Working demo](https://jdlien.com/validator/demo.html) [source on GitHub](./demo.html).

## Supported Input Types and Atributes

Validator works by checking for certain attributes on the form inputs and applying validation based on those.
In many cases you can use the native HTML5 attributes, but you can also use the `data-` attributes if you do not want the behavior to be affected by built-in browser validation behavior (eg for min-length, max-length, and input types such as date and time).

There are a few attributes that Validator looks for on the form element:

- `data-prevent-submit` - If this attribute is present, the form will never be submitted, even is valid. This is useful if you want to handle the submission yourself. (By default the form will be submitted if it is valid and not if it is invalid.)

- `novalidate` - This is a native HTML5 attribute that will disable browser validation on the form. If this attribute is present. Validator adds this by default and remove it if `destroy()` is called. If you add it yourself, it will not be added back by Validator.

On input (and sometimes select and textarea) elements the following attributes are supported:

- `required` - The input must have a value.
- `minlength`/`data-min-length` - The input must be at least the specified number of characters.
- `maxlength`/`data-max-length` - The input must be no more than the specified number of characters.
- `pattern`/`data-pattern` - The input must match the specified regular expression.
- `type`/`data-type` - The input must match the specified type. The following types are supported:

  - `number` - The input must be a number (use `data-type` to avoid quirky browser behavior)
  - `integer` - The input must be a positive whole number.
  - `tel` - The input must be a valid North-American phone number.
  - `email` - The input must be a valid email address.
  - `zip` - The input must be a valid US zip code.
  - `postal` - The input must be a valid Canadian postal code.
  - `color` - The input must be a valid CSS color.
  - `date` - The input must be a valid date.
  - `time` - The input must be a valid time.
  - `url` - The input must be a valid URL.
  - `color` - The input must be a valid CSS color. (This can be used in conjunction with a native color input - see Color Picker Support for details.)

- `data-date-format`/`data-time-format` - Applies formatting to time input types (these are interchangeable). The format must be a valid moment.js format string. See [moment.js docs](https://momentjs.com/docs/#/displaying/format/) for more information.
- `date-range` - Applies to date input types. Supported values are `past` and `future`.
- `data-error-default` - A custom error message to display if the input is invalid. This will be used for required, pattern, and date-range validation failures.
- `data-validation` - The name of a custom validation function.

A validation function will be called with the input value as the argument. The function may either return a boolean (true/false) or an object with a `valid` property that is a boolean. If the function returns string, an object with a `message` property, that will be used as the error message for the input. A `messages` array may also be specified which will be used to display multiple error messages for the input.

You may also use a promise that resolves to such an object for asynchronous validation.

An example of such a function is:

```javascript
function customValidation(value) {
  if (value === 'foo') return 'The value cannot be foo.'

  return true
}
```

Here is an example of a custom validation function that uses a promise:

```javascript
function customValidationPromise(value) {
  return fetch(`https://api.example.com/validate-username?username=${value}`)
    .then((response) => response.json())
    .then((result) => {
      if (result.valid) return true
      else return 'Email is invalid'
    })
}
```

## Displaying Error Messages

Validator will display error messages in the divs with the name of the input + `-error`. For example, if the input name is `name`, the error message will be displayed in the div with the id `name-error`. You will need to create these divs in your HTML. They should initially be hidden with a class that sets properties such as `display: none;`, `visibility: hidden;`, or `opacity: 0;`.

You can customize the class(es) that Validator uses to hide the error messages by passing in a `hideErrorClass` option to the Validator constructor. The default is `hidden opacity-0`.

## Color Picker Support

If you need to allow a user to pick a color, you can use data-type="color" and the input will be required to be any valid CSS color supported by the browser. This type can also work in conjunction with a native color input. If you do this, you will need to add an input with `type="color"` and the name of the data-color input + `-color`. This should be inside a linked label which will become the color preview swatch. Such a label should have an ID of the color input's name + `-color-label` so that Validator can change the background to the specified color.

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

- `messages - An object containing custom error messages. The default messages can be overridden by `passing in a custom message object. These are all the default messages:

```javascript
messages = {
  ERROR_MAIN: 'There is a problem with your submission.',
  ERROR_GENERIC: 'Enter a valid value.',
  ERROR_REQUIRED: 'This field is required.',
  OPTION_REQUIRED: 'An option must be selected.',
  CHECKED_REQUIRED: 'This must be checked.',
  ERROR_MAXLENGTH: 'This must be ${val} characters or fewer.',
  ERROR_MINLENGTH: 'This must be at least ${val} characters.',
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
  ERROR_TIME: 'This is not a valid time.',
  ERROR_TIME_RANGE: 'The time is outside the allowed range.',
  ERROR_URL: 'This is not a valid URL.',
  ERROR_COLOR: 'This is not a valid CSS colour.',
  ERROR_CUSTOM_VALIDATION: 'There was a problem validating this field.',
}
```

- `debug` - A boolean indicating whether or not to show debug messages in the console. Defaults to false.
- `autoInit` - A boolean indicating whether or not to automatically initialize the Validator instance on page load. Defaults to true.
- `preventSubmit` - A boolean indicating whether or not to prevent form submission if validation is successful. Defaults to false.
- `hiddenClasses` - A string containing one or more space-separated classes to toggle the hidden mode (eg `display: none` CSS property) on hidden elements. Defaults to `hidden opacity-0`.
- `errorMainClasses` - A string containing one or more space-separated classes to apply to the main error message.
- `errorInputClasses` - A string containing one or more space-separated classes to apply to invalid `inputs.
- `validationSuccessCallback` - A function to be called when validation is successful.
- `validationErrorCallback` - A function to be called when validation fails.

### Example:

```javascript
import Validator from 'validator'

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

## Utility Functions

Validator uses its own `@jdlien/validator-utils` for several utility functions that may be useful in your own code. You may use this package directly if you need any of these functions without using the Validator class.

If you wish to use these, you may import the functions directly from the module as an object that contains all the functions:

```javascript
// Import all the functions into a validatorUtils object
import * as validatorUtils from '@jdlien/validator-utils'
// Or just import the functions you need
import { dateFormat, formatDateTime } from '@jdlien/validator-utils'
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

## Contributing

Install dev dependencies:

```bash
npm install
```

When running Vite, you may get an error like

```
Module did not self-register: '...\node_modules\canvas\build\Release\canvas.node'
```

If that happens, you
need to install the canvas module manually: `npm rebuild canvas --update-binary`
