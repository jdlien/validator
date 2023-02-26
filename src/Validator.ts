/**
 * Form Validator used by EPL apps and www2.
 * © 2023 JD Lien
 *
 * @format
 */

// Import the validator utility functions
import * as utils from '@jdlien/validator-utils'

import { FormControl, ValidatorOptions, InputHandlers } from './types'

export class ValidationSuccessEvent extends Event {
  submitEvent: Event
  constructor(submitEvent: Event) {
    super('validationSuccess', { cancelable: true })
    this.submitEvent = submitEvent
  }
}

export class ValidationErrorEvent extends Event {
  submitEvent: Event
  constructor(submitEvent: Event) {
    super('validationError', { cancelable: true })
    this.submitEvent = submitEvent
  }
}

export default class Validator {
  form: HTMLFormElement
  inputs: FormControl[] = []
  // Keeps track of error messages accumulated for each input
  inputErrors: { [key: string]: string[] } = {}

  // Default error messages.
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
  // Show debug messages in the console
  debug: boolean
  // Whether validation should be performed immediately on instantiation
  autoInit: boolean
  // Whether to prevent the form from submitting if validation is successful
  preventSubmit: boolean = false
  // Class toggled hide an element (eg display:none)
  hiddenClasses: string

  // Classes to apply to the main error message (space-separated)
  errorMainClasses: string
  // Classes added to an invalid input (space-separated)
  errorInputClasses: string
  // Timeout for dispatching events on input (used by syncColorInput)
  private dispatchTimeout: number = 0

  // Whether the original form has a novalidate attribute
  private originalNoValidate: boolean = false

  private validationSuccessCallback: (event: Event) => void
  private validationErrorCallback: (event: Event) => void

  // Sets defaults and adds event listeners
  constructor(form: HTMLFormElement, options: ValidatorOptions = {}) {
    if (!form) throw new Error('Validator requires a form to be passed as the first argument.')
    if (!(form instanceof HTMLFormElement)) {
      throw new Error('form argument must be an instance of HTMLFormElement')
    }

    this.form = form

    // If the form has a data-prevent-submit attribute, set preventSubmit to true
    // Can be overridden with the preventSubmit option
    if (form.dataset.preventSubmit === '' || form.dataset.preventSubmit) this.preventSubmit = true

    // Merge options with defaults
    Object.assign(this.messages, options.messages || {})
    this.debug = options.debug || false
    this.autoInit = options.autoInit === false ? false : true
    this.preventSubmit = options.preventSubmit === false ? false : this.preventSubmit
    this.hiddenClasses = options.hiddenClasses || 'hidden opacity-0'
    this.errorMainClasses =
      options.errorMainClasses ||
      'm-2 border border-red-500 bg-red-100 p-3 dark:bg-red-900/80 text-center'

    this.errorInputClasses = options.errorInputClasses || 'border-red-600 dark:border-red-500'
    this.validationSuccessCallback = options.validationSuccessCallback || (() => {})
    this.validationErrorCallback = options.validationErrorCallback || (() => {})

    if (this.autoInit) this.init()

    // Re-initialize the form if it altered in the DOM
    new MutationObserver(() => this.autoInit && this.init()).observe(form, { childList: true })
  }

  // Event handler references
  private submitHandlerRef = this.submitHandler.bind(this)
  private inputInputHandlerRef = this.inputInputHandler.bind(this)
  private inputChangeHandlerRef = this.inputChangeHandler.bind(this)
  private inputKeydownHandlerRef = this.inputKeydownHandler.bind(this)

  public addEventListeners(): void {
    this.form.addEventListener('submit', this.submitHandlerRef)
    this.form.addEventListener('input', this.inputInputHandlerRef)
    this.form.addEventListener('change', this.inputChangeHandlerRef)
    this.form.addEventListener('keydown', this.inputKeydownHandlerRef)
    // This doesn't seem to be very useful
    this.form.addEventListener('remove', this.destroy, { once: true })
  }

  public removeEventListeners(): void {
    this.form.removeEventListener('submit', this.submitHandlerRef)
    this.form.removeEventListener('input', this.inputInputHandlerRef)
    this.form.removeEventListener('change', this.inputChangeHandlerRef)
    this.form.removeEventListener('keydown', this.inputKeydownHandlerRef)
    this.form.removeEventListener('remove', this.destroy)
  }

  // Adds event listeners to all formFields in a specified form
  init(): void {
    this.inputs = Array.from(this.form.elements) as FormControl[]
    // Ensure each input has a unique ID and an empty array in inputErrors
    this.inputs.forEach((input) => {
      if (!input.name && !input.id) input.id = `vl-input-${Math.random().toString(36).slice(2)}`
      this.inputErrors[input.name || input.id] = []
    })

    // Check that the original form has a novalidate attribute
    this.originalNoValidate = this.form.hasAttribute('novalidate')

    // Disable the browser's built-in validation
    this.form.setAttribute('novalidate', 'novalidate')

    this.removeEventListeners()
    this.addEventListeners()
  } // end init()

  private getErrorEl(input: FormControl): HTMLElement | null {
    const errorEl = document.getElementById(input.name + '-error')
    if (errorEl) return errorEl

    return document.getElementById(input.id + '-error') || null
  }

  private addErrorMain(message?: string): void {
    const errorEl = document.createElement('div')
    errorEl.id = 'form-error-main'
    this.errorMainClasses.split(' ').forEach((className) => {
      errorEl.classList.add(className)
    })

    if (message) errorEl.innerHTML = message
    else errorEl.innerHTML = this.messages.ERROR_MAIN
    // Add the error message to the bottom of the form
    this.form.appendChild(errorEl)
  }

  // Adds an error to the array of strings to be displayed by an input that failed
  private addInputError(
    el: FormControl,
    message = el.dataset.errorDefault || this.messages.ERROR_GENERIC
  ): void {
    const name = el.name || el.id

    if (this.debug) console.log('Invalid value for ' + name + ': ' + message)

    // init already does this, but ensure the input has an array
    if (!(name in this.inputErrors)) this.inputErrors[name] = []
    // Add the message if it isn't already in the array
    if (!this.inputErrors[name].includes(message)) this.inputErrors[name].push(message)
  }

  // Shows an error message in a container with the input's id suffixed with -error.
  // A future version of this could inject an error element into the DOM if it doesn't exist
  private showInputErrors(el: FormControl): void {
    if (!el || (!el.name && !el.id)) return

    // Check if the input has any error messages
    const name = el.name || el.id
    const errors = name in this.inputErrors ? this.inputErrors[name] : []
    // If there are no errors, don't do anything
    if (!errors.length) return

    el.setAttribute('aria-invalid', 'true')

    // Apply input classes to indicate an error on the input itself
    this.errorInputClasses.split(' ').forEach((className) => {
      el.classList.add(className)
    })

    // Add the error messages to the error element and show it
    let errorEl = this.getErrorEl(el)
    if (!errorEl) return

    errorEl.innerHTML = errors.join('<br>')

    this.hiddenClasses.split(' ').forEach((className) => {
      if (errorEl) errorEl.classList.remove(className)
    })
  }

  // Shows all the error messages for all the inputs of the form, and a main error message
  // TODO: Consider (optionally) scrolling to the first error message
  private showFormErrors(): void {
    // Show any errors from validation
    this.inputs.forEach((el) => this.showInputErrors(el))

    // If if any of the inputs have error messages, show the main error message
    // One could show all the errors in the main message, but it might get long
    // Should this be in the same branch of code that does the dispatch and callback?
    if (Object.values(this.inputErrors).some((el) => Array.isArray(el) && el.length)) {
      const mainErrorEl = this.form.querySelectorAll('#form-error-main')
      if (mainErrorEl.length) {
        mainErrorEl.forEach((el) => {
          // If there are no contents, add the default message
          if (!el.innerHTML) el.innerHTML = this.messages.ERROR_MAIN
          this.hiddenClasses.split(' ').forEach((className) => {
            el.classList.remove(className)
          })
        })
      } else this.addErrorMain()
    }
  }

  // Clears error messages from an input and removes its errors from the inputErrors array
  private clearInputErrors(el: FormControl): void {
    this.inputErrors[el.name || el.id] = []

    // Remove the aria-invalid attribute from the input
    el.removeAttribute('aria-invalid')

    let errorEl = this.getErrorEl(el)
    if (!errorEl) return

    // Remove the error style
    this.errorInputClasses.split(' ').forEach((className) => {
      el.classList.remove(className)
    })

    // Hide the error element
    this.hiddenClasses.split(' ').forEach((className) => {
      if (errorEl) errorEl.classList.add(className)
    })

    // Clear the error message
    // TODO: This needs to happen on transitionend if we want to animate the error message out
    errorEl.textContent = ''
  }

  private clearFormErrors(): void {
    // If there's a big error message, hide it
    this.form.querySelectorAll('#form-error-main').forEach((el) => {
      this.hiddenClasses.split(' ').forEach((className) => {
        el.classList.add(className)
      })
    })

    // Clear any previous errors
    this.inputs.forEach((el) => this.clearInputErrors(el))
  }

  // Validates a required input and returns true if it's valid.
  // Shows an error if the input is required and empty.
  private validateRequired(el: FormControl): boolean {
    let valid = true
    if (
      el.required &&
      (el.value === '' ||
        (el instanceof HTMLInputElement && ['checkbox', 'radio'].includes(el.type) && !el.checked))
    ) {
      // Handle checkboxes and radio buttons. Check that at least one of any name group is checked
      // Check that any checkbox of a group of checkboxes is checked
      // This assumes the checkbox or radio button is in a group... if it's not,
      // we can specify a default error message with error=
      if (el instanceof HTMLInputElement && ['checkbox', 'radio'].includes(el.type)) {
        let groupChecked = false
        let groupName = el.name
        const groupInputs = this.form.querySelectorAll(`input[name="${groupName}"]`)
        groupInputs.forEach((input) => {
          if (input instanceof HTMLInputElement && input.checked === true) {
            groupChecked = true
            return
          }
        })

        if (groupChecked === false) {
          valid = false

          let message =
            groupInputs.length > 1 ? this.messages.OPTION_REQUIRED : this.messages.CHECKED_REQUIRED

          // If there's a data-error-default attribute, use that as the error message
          if (el.dataset.errorDefault) message = el.dataset.errorDefault
          this.addInputError(el, message)
        }
      } else if (utils.isFormControl(el)) {
        valid = false
        this.addInputError(el, el.dataset.errorDefault || this.messages.ERROR_REQUIRED)
      }
    }
    return valid
  } // end validateRequired

  // Validates a min and max length
  private validateLength(el: FormControl): boolean {
    let valid = true

    if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && el.value.length) {
      // prettier-ignore
      let minLength = el.minLength > 0 ? el.minLength
          : el.dataset.minLength ? parseInt(el.dataset.minLength as string) : 0

      // prettier-ignore
      let maxLength = el.maxLength > 0 && el.maxLength < 500_000 ? el.maxLength
          : el.dataset.maxLength ? parseInt(el.dataset.maxLength as string) : Infinity

      if (minLength > 0 && el.value.length < minLength) {
        valid = false
        this.addInputError(
          el,
          this.messages.ERROR_MINLENGTH.replace('${val}', minLength.toString())
        )
      }

      if (el.value.length > maxLength) {
        valid = false
        this.addInputError(
          el,
          this.messages.ERROR_MAXLENGTH.replace('${val}', maxLength.toString())
        )
      }
    }

    return valid
  }

  // A map of input handlers that can be used for each type of input.
  private inputHandlers: InputHandlers = {
    number: {
      parse: utils.parseNumber,
      isValid: utils.isNumber,
      error: this.messages.ERROR_NUMBER,
    },
    integer: {
      parse: utils.parseInteger,
      isValid: utils.isInteger,
      error: this.messages.ERROR_INTEGER,
    },
    tel: {
      parse: utils.parseNANPTel,
      isValid: utils.isNANPTel,
      error: this.messages.ERROR_TEL,
    },
    email: {
      parse: (value: string) => value.trim(),
      isValid: utils.isEmail,
      error: this.messages.ERROR_EMAIL,
    },
    zip: {
      parse: utils.parseZip,
      isValid: utils.isZip,
      error: this.messages.ERROR_ZIP,
    },
    postal: {
      parse: utils.parsePostalCA,
      isValid: utils.isPostalCA,
      error: this.messages.ERROR_POSTAL,
    },
    url: {
      parse: utils.parseUrl,
      isValid: utils.isUrl,
      error: this.messages.ERROR_URL,
    },
    date: {
      parse: utils.parseDateToString,
      isValid: utils.isDate,
      error: this.messages.ERROR_DATE,
    },
    time: {
      parse: utils.parseTimeToString,
      isValid: utils.isTime,
      error: this.messages.ERROR_TIME,
    },
    color: {
      parse: (value: string) => value.trim().toLowerCase(),
      isValid: utils.isColor,
      error: this.messages.ERROR_COLOR,
    },
  }

  private validateInputType(el: FormControl): boolean {
    const dataType = el.dataset.type || el.type
    const inputHandler = this.inputHandlers[el.type] || this.inputHandlers[dataType]

    if (inputHandler) {
      const dateFormat = el.dataset.dateFormat || el.dataset.timeFormat
      const parsedValue = inputHandler.parse(el.value, dateFormat)

      // Do not update the value if the input is one of these input types
      const nonUpdateableTypes = ['date', 'time', 'datetime-local', 'month', 'week']
      if (parsedValue.length && !nonUpdateableTypes.includes(el.type)) el.value = parsedValue

      if (!inputHandler.isValid(el.value)) {
        this.addInputError(el, inputHandler.error)
        return false
      }
    }

    return true
  }

  private validateDateRange(el: FormControl): boolean {
    if (el.dataset.dateRange) {
      const range = el.dataset.dateRange
      const date = utils.parseDate(el.value)
      // only validate the date range if it's a valid date
      if (!isNaN(date.getTime()) && !utils.isDateInRange(date, range)) {
        let msg = el.dataset.errorDefault || this.messages.ERROR_DATE_RANGE
        if (range === 'past') msg = this.messages.ERROR_DATE_PAST
        else if (range === 'future') msg = this.messages.ERROR_DATE_FUTURE
        this.addInputError(el, msg)
        return false
      }
    }

    return true
  }

  // Validates a pattern from data-pattern or pattern; data-pattern takes precedence
  private validatePattern(el: FormControl): boolean {
    const pattern = el.dataset.pattern || (el instanceof HTMLInputElement && el.pattern) || null
    if (pattern && !new RegExp(pattern).test(el.value)) {
      this.addInputError(el) // Use the default error message
      return false
    }

    return true
  }

  /**
   * Specify a custom function in data-validation and it gets called to validate the input
   * The custom function can return
   * - a boolean
   * - a Promise that resolves to a boolean
   * - an object with a valid property that is a boolean
   * - a Promise that resolves to an object with a valid property that is a boolean
   * - and optionally a messages property that is a string or array of strings
   * - OR optionally, a message property that is a string
   * - optionaly, a boolean error property that is true if something went wrong
   */
  private async validateCustom(el: FormControl): Promise<boolean> {
    const validation = el.dataset.validation
    if (!validation || typeof validation !== 'string') return true
    const validationFn: Function = window[validation as keyof Window] as Function
    if (!validationFn || typeof validationFn !== 'function') return true

    let result: any
    try {
      result = await Promise.resolve(validationFn(el.value))
      result = utils.normalizeValidationResult(result)
    } catch (err) {
      this.addInputError(el, this.messages.ERROR_CUSTOM_VALIDATION)
      return false
    }

    const message = result.messages.join('<br>') || this.messages.ERROR_CUSTOM_VALIDATION
    if (!result.valid) this.addInputError(el, message)

    return result.valid
  }

  // Validates an input with a value and returns true if it's valid
  // Checks inputs defined in the inputHandlers map, pattern, and date range,
  private async validateInput(el: FormControl): Promise<boolean> {
    if (!(el instanceof HTMLInputElement) || !el.value.length) return true

    let valid = true
    valid = this.validateInputType(el) && valid
    valid = this.validateDateRange(el) && valid
    valid = this.validatePattern(el) && valid
    valid = (await this.validateCustom(el)) && valid

    return valid
  }

  // Validates all the fields in the form. It will show an error message
  // in all invalid fields and return false if any are invalid.
  async validate(_e?: Event): Promise<boolean> {
    let valid = true

    for (const el of this.inputs) {
      valid = this.validateRequired(el) && valid
      valid = this.validateLength(el) && valid
      valid = (await this.validateInput(el)) && valid
    }

    return valid
  } //end validate()

  private isSubmitting = false
  private async submitHandler(e: Event): Promise<void> {
    if (this.isSubmitting) return
    e.preventDefault()

    // Clear any error messages
    this.clearFormErrors()
    let valid = await this.validate(e)
    // Show messages for any invalid inputs and show a large error message
    this.showFormErrors()

    // External functions can prevent the form from submitting
    // by calling e.preventDefault() in the validationSuccess event
    const validationSuccessEvent = new ValidationSuccessEvent(e)
    const validationErrorEvent = new ValidationErrorEvent(e)

    if (valid) {
      this.form.dispatchEvent(validationSuccessEvent)
      if (this.validationSuccessCallback) this.validationSuccessCallback(e)
    } else {
      this.form.dispatchEvent(validationErrorEvent)
      if (this.validationErrorCallback) this.validationErrorCallback(e)
    }

    if (valid && !this.preventSubmit) {
      this.isSubmitting = true
      if (!validationSuccessEvent.defaultPrevented) this.form.submit()
      this.isSubmitting = false
    }
  }

  private async inputChangeHandler(e: Event): Promise<void> {
    if (!(e.target instanceof HTMLInputElement)) return

    // Clear and reset error messages for the input
    this.clearInputErrors(e.target)
    await this.validateInput(e.target)
    // Show any error messages for the input after validation
    this.showInputErrors(e.target)
  }

  private inputInputHandler(e: Event) {
    const input = e.target as HTMLInputElement

    // Ensure that a user cannot type non-numerics into an integer input
    if (utils.isType(input, 'integer')) input.value = utils.parseInteger(input.value)

    // We don't filter native number inputs because it causes issues in Chrome
    if (input.type !== 'number' && utils.isType(input, ['number', 'float', 'decimal'])) {
      input.value = utils.parseNumber(input.value)
    }

    if (utils.isType(input, 'color')) this.syncColorInput(e)
  }

  // Sync color inputs (data-type="color") with an associated native color input type
  private syncColorInput(e: Event): void {
    let input = e.target as HTMLInputElement
    let colorInput = input

    if (input.type === 'color')
      colorInput = this.form.querySelector(`#${input.id.replace(/-color/, '')}`) as HTMLInputElement

    let colorLabel = this.form.querySelector(`#${colorInput.id}-color-label`) as HTMLInputElement

    // Update the HTML color picker input and its label background when color input changes
    if ((input.dataset.type || '') === 'color') {
      let colorPicker = this.form.querySelector(`input#${input.id}-color`) as HTMLInputElement

      if (!colorPicker || !utils.isColor(input.value)) return
      colorPicker.value = utils.parseColor(input.value)
    }

    // Update the color input and label background when the HTML color picker is changed
    if (input.type === 'color') colorInput.value = input.value

    if (colorLabel) colorLabel.style.backgroundColor = input.value

    // Dispatch a change event so the color picker's error message updates
    // Debounce so it doesn't get called rapidly when selecting a color
    clearTimeout(this.dispatchTimeout)
    this.dispatchTimeout = window.setTimeout(() => {
      colorInput.dispatchEvent(new Event('change', { bubbles: true }))
    }, 200)
  }

  // Support using arrow keys to cycle through numbers.
  // Other handling for keyboard events can be done here
  private inputKeydownHandler(e: KeyboardEvent) {
    if (!(e.target instanceof HTMLInputElement)) return

    if (utils.isType(e.target, 'integer')) {
      if (e.key === 'ArrowUp') {
        // Prevent the cursor from moving to the beginning of the input
        e.preventDefault()
        if (e.target.value === '') e.target.value = '0'
        e.target.value = (parseInt(e.target.value) + 1).toString()
      } else if (e.key === 'ArrowDown') {
        if (parseInt(e.target.value) > 0) e.target.value = (parseInt(e.target.value) - 1).toString()
        else e.target.value = '0'
      }
    }
  }

  public destroy() {
    this.removeEventListeners()

    // Perform other cleanup actions here
    if (!this.originalNoValidate) this.form.removeAttribute('novalidate')
  }
}
