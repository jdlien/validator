# Validator

## Introduction

Validator is a utility class that you can use to add validation to your application that works much like native HTML5 form validation provided by browsers, but it is much more powerful, flexible, and customizable.

It is meant to sanitize and validate user input in forms, resulting in clean, consistent output that
is done in a very use-friendly way without unnecessarily constraining the user from entering data
in a way that is convenient for them.

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

## Installation

```bash
npm install @jdlien/validator

# or

yarn add @jdlien/validator
```

## Basic Usage

Create a form as you normally would, speciyfing parameters for each input to control how Validator will check the input. You can use the data-type attribute instead of type if you do not want users to be limited by the browser's built-in input fields.

Then create a new Validator instance and pass it the form element as the first argument. An optional second argument allows you to pass in options.

```html
<form id="myForm">
  <input
    type="text"
    name="name"
    required
    data-min-length="2"
    data-max-length="20"
    data-error-default="Please enter a name."
  />
  <div id="name-error"></div>

  <input type="text" data-type="email" name="email" required />
  <div id="email-error"></div>

  <input type="text" data-type="tel" name="phone" />
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

For a working demo, see the [demo page](./demo.html).

## Structuring A Form for Validator

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

A validation function will be called with the input value as the argument. The function may either return a boolean (true/false) or an object with a `valid` property that is a boolean. If the function returns an object, the `message` property will be used as the error message for the input. A `messages` array may also be specified which will be used to display multiple error messages for the input.

A promise that resolves to such an object can also be used for asynchronous validation.

An example of such a function is:

```javascript
function customValidation(value) {
  if (value === 'foo') {
    return {
      valid: false,
      message: 'The value cannot be foo.',
    }
  }

  return true
}
```

## Displaying Error Messages

Validator will display error messages in the divs with the name of the input + `-error`. For example, if the input name is `name`, the error message will be displayed in the div with the id `name-error`. You will need to create these divs in your HTML. They should initially be hidden with a class that sets `display: none;`, `visibility: hidden;`, or `opacity: 0;`.

You can customize the class(es) that Validator uses to hide the error messages by passing in a `hideErrorClass` option to the Validator constructor. The default is `hidden opacity-0`.

## Color Picker Support

If you need to allow a user to pick a color, you can use data-type="color" and the input will be required to be any valid CSS color supported by the browser. This type can also work in conjunction with a native color input. If you do this, you will need to add an input with the name of the data-color input + `-color`, and this should be inside a linked label which will become the color preview swatch. Such a label should have a label of the color input's name + `-color-label`.

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

## Contributing

Install dev dependencies:

```bash
npm install
```

You may get an error like

```
Module did not self-register: '...\node_modules\canvas\build\Release\canvas.node'
```

If that happens, you
need to install the canvas module manually: `bash npm rebuild canvas --update-binary `
