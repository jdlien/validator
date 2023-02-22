# Validator

// TODO: Fix the links below
[![Build Status](https://travis-ci.org/validatorjs/validator.js.svg?branch=master)](https://travis-ci.org/validatorjs/validator.js)
[![Coverage Status](https://coveralls.io/repos/github/validatorjs/validator.js/badge.svg?branch=master)](https://coveralls.io/github/validatorjs/validator.js?branch=master)
[![npm version](https://badge.fury.io/js/validator.svg)](https://badge.fury.io/js/validator)
[![npm](https://img.shields.io/npm/dm/validator.svg)](https://www.npmjs.com/package/validator)
[![npm](https://img.shields.io/npm/dt/validator.svg)](https://www.npmjs.com/package/validator)
[![Known Vulnerabilities](https://snyk.io/test/github/validatorjs/validator.js/badge.svg)](https://snyk.io/test/github/validatorjs/validator.js)
[![Greenkeeper badge](https://badges.greenkeeper.io/validatorjs/validator.js.svg)](https://greenkeeper.io/)
[![dependencies Status](https://david-dm.org/validatorjs/validator.js/status.svg)](https://david-dm.org/validatorjs/validator.js)
[![devDependencies Status](https://david-dm.org/validatorjs/validator.js/dev-status.svg)](https://david-dm.org/validatorjs/validator.js?type=dev)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fvalidatorjs%2Fvalidator.js.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fvalidatorjs%2Fvalidator.js?ref=badge_shield)

## Introduction

Validator is a utility class that you can use to add validation to your application that works much like native HTML5 form validation provided by browsers, but it is much more powerful, flexible, and customizable.

It is meant to validate user input in forms, and it includes the following built-in validators:

- `required`
- `minlength`
- `maxlength`
- `pattern`
- `number`
- `integer`
- `tel` (North-American Phone Numbers)
- `email`
- `postal` (Canadian Postal Codes)
- `color`
- `date`
- `date-range`
- `time`
- `url`

It is easy to add your own custom validators, and you can easily add your own custom error messages for each field or any given validation for the whole class.

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
