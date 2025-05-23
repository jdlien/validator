/** Form Validator used by EPL apps and www2. ©2023 JD Lien */

// Import the validator utility functions
import * as utils from '@jdlien/validator-utils'

export type FormControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

export interface ValidatorOptions {
  messages?: object
  debug?: boolean
  autoInit?: boolean
  preventSubmit?: boolean
  hiddenClasses?: string
  errorMainClasses?: string
  errorInputClasses?: string
  showMainError?: boolean
  validationSuccessCallback?: (event: Event) => void
  validationErrorCallback?: (event: Event) => void
}

export interface InputHandlers {
  [key: string]: {
    parse: (value: string, dateFormat?: string) => string
    isValid: (value: string) => boolean
    error: string
  }
}

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
    ERROR_DATETIME: 'This is not a valid date and time.',
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
  // Whether to show the main error message
  showMainError: boolean = true

  // Classes to apply to the main error message (space-separated)
  errorMainClasses: string
  // Classes added to an invalid input (space-separated)
  errorInputClasses: string
  // Timeout for dispatching events on input (used by syncColorInput)
  private dispatchTimeout: number = 0

  // Timeout ID for debounced functions
  private timeoutId: number = 0
  // Instance of the MutationObserver used to re-initialize on DOM changes
  private formMutationObserver: MutationObserver | null = null
  // Debounced version of the init function
  private debouncedInit: () => void

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
    this.preventSubmit =
      options.preventSubmit !== undefined ? options.preventSubmit : this.preventSubmit

    this.hiddenClasses = options.hiddenClasses || 'hidden opacity-0'
    this.errorMainClasses =
      options.errorMainClasses ||
      'm-2 border border-red-500 bg-red-100 p-3 dark:bg-red-900/80 text-center'

    this.errorInputClasses = options.errorInputClasses || 'border-red-600 dark:border-red-500'
    this.showMainError = options.showMainError !== undefined ? options.showMainError : true
    this.validationSuccessCallback = options.validationSuccessCallback || (() => {})
    this.validationErrorCallback = options.validationErrorCallback || (() => {})

    this.debouncedInit = this.debounce(this.init.bind(this), 45)
    if (this.autoInit) this.init()

    // Re-initialize the form if it altered in the DOM
    // Store the observer instance so it can be disconnected later.
    // FIXME: This doesn't seem to work well if I add a lot of things at once. Needs more testing.
    this.formMutationObserver = new MutationObserver(() => this.autoInit && this.debouncedInit())
    this.formMutationObserver.observe(form, {
      childList: true,
    })
  }

  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...funcArgs: Parameters<T>) => void {
    return (...args: Parameters<T>): void => {
      clearTimeout(this.timeoutId as number)
      this.timeoutId = window.setTimeout(() => func(...args), wait)
    }
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
    // Get all the inputs in the form but ensure we don't include button, fieldset, or output elements
    this.inputs = Array.from(this.form.elements).filter(
      (element) =>
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
    ) as FormControl[]

    // Ensure each input has a unique ID and an empty array in inputErrors
    this.inputs.forEach((input) => {
      if (!input.name && !input.id) input.id = `vl-input-${Math.random().toString(36).slice(2)}`
      this.inputErrors[input.name || input.id] = []
    })

    // Check if the form *originally* had a novalidate attribute *before* we potentially add it.
    this.originalNoValidate = this.form.hasAttribute('novalidate')

    // Disable the browser's built-in validation by adding the novalidate attribute.
    // This should happen *after* checking the original state.
    this.form.setAttribute('novalidate', 'novalidate')

    this.removeEventListeners()
    this.addEventListeners()
  } // end init()

  private getErrorEl(input: FormControl): HTMLElement | null {
    // Scope search to current form. I originally used getElementById to search the
    // entire document, but that caused issues when there were multiple forms on a page.
    const getElById = (id: string): HTMLElement | null => {
      const escapedId = id.replace(/([.#{}()\\?*[\]-])/g, '\\$1')
      return this.form.querySelector(`#${escapedId}`) || document.getElementById(id) || null
    }

    // Support for Flux-style error messages. Must come before the aria-describedby check,
    // since the aria-describedby attribute is used for detail descriptions in Flux, not errors.
    const fluxField = input.closest('[data-flux-field]')
    if (fluxField) {
      const fluxError = fluxField.querySelector('[data-flux-error]')
      if (fluxError) return fluxError as HTMLElement
    }

    // JD's AppInput component uses the aria-describedby attribute to display error messages.
    // This could be problematic if a form uses the aria-describedby attribute for other purposes.
    const describedById = input.getAttribute('aria-describedby')
    if (describedById) {
      const errorElByDescribedBy = getElById(describedById)
      if (errorElByDescribedBy) return errorElByDescribedBy
    }

    // Next, check for an element with the id of the input's id suffixed with -error.
    const errorElById = getElById(input.id + '-error')
    if (errorElById) return errorElById

    const errorElByName = getElById(input.name + '-error')
    return errorElByName || null
  }

  private addErrorMain(message?: string): void {
    let errorEl = this._getMainErrorElement()

    // If no main error element exists (neither form-specific nor generic), create the generic one.
    if (!errorEl) {
      errorEl = document.createElement('div')
      errorEl.id = 'form-error-main' // Always create the generic ID for fallback
      this.form.appendChild(errorEl)
    }

    // Apply classes and message
    this.errorMainClasses.split(' ').forEach((className) => {
      errorEl.classList.add(className)
    })

    errorEl.innerHTML = message || this.messages.ERROR_MAIN

    // Ensure it's visible (might have been hidden previously)
    this.hiddenClasses.split(' ').forEach((className) => {
      errorEl.classList.remove(className)
    })
  }

  // Helper method to find the main error element
  private _getMainErrorElement(): HTMLElement | null {
    if (this.form.id) {
      const formSpecificErrorId = `${this.form.id}-error-main`
      const formSpecificError = document.getElementById(formSpecificErrorId)
      if (formSpecificError) {
        return formSpecificError as HTMLElement
      }
    }

    // Fallback to the generic error element
    return this.form.querySelector('#form-error-main') as HTMLElement | null
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

    // If there are any input errors and we should show the main error
    if (
      this.showMainError &&
      Object.values(this.inputErrors).some((el) => Array.isArray(el) && el.length)
    ) {
      let mainErrorElement = this._getMainErrorElement()

      if (mainErrorElement) {
        // If the element exists, ensure it has content and is visible
        if (!mainErrorElement.innerHTML) {
          mainErrorElement.innerHTML = this.messages.ERROR_MAIN
        }
        this.hiddenClasses.split(' ').forEach((className) => {
          mainErrorElement.classList.remove(className)
        })
      } else {
        // If no main error element exists, add it (which also makes it visible)
        this.addErrorMain()
      }
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
    // Find the main error element (form-specific or generic) and hide it
    const mainErrorElement = this._getMainErrorElement()
    if (mainErrorElement) {
      this.hiddenClasses.split(' ').forEach((className) => {
        mainErrorElement.classList.add(className)
      })
      // Optionally clear the content after hiding
      // mainErrorElement.innerHTML = ''
    }

    // Clear any previous input errors
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
    if (el.disabled) return valid

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
    datetime: {
      parse: utils.parseDateTimeToString,
      isValid: utils.isDateTime,
      error: this.messages.ERROR_DATETIME,
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
    if (el.disabled) return true
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

    // Skip disabled inputs
    if (el.disabled) return valid
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
      // Skip disabled inputs
      if (el.disabled) continue
      valid = this.validateRequired(el) && valid
      valid = this.validateLength(el) && valid
      valid = (await this.validateInput(el)) && valid
      // Validate custom functions here if value is empty, as they won't be
      // evaluated by validateInput, which only checks inputs with a value.
      if (!el.value.length) valid = (await this.validateCustom(el)) && valid
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

  // Skip inputs that have a data-novalidate attribute
  // Useful when you don't want to return a validationSuccess event when a specific input is changed
  private shouldSkipValidation(target: HTMLElement): boolean {
    if (typeof target.dataset.novalidate === 'undefined') return false
    if (target.dataset.novalidate === '') return true
    return target.dataset.novalidate === 'true'
  }

  private async inputChangeHandler(e: Event): Promise<void> {
    if (!(e.target instanceof HTMLInputElement) || this.shouldSkipValidation(e.target)) return

    // Clear and reset error messages for the input
    this.clearInputErrors(e.target)
    this.validateLength(e.target)
    await this.validateInput(e.target)
    // Show any error messages for the input after validation
    this.showInputErrors(e.target)
  }

  private inputInputHandler(e: Event) {
    const input = e.target as HTMLInputElement

    if (this.shouldSkipValidation(input)) return

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
    // Disconnect the MutationObserver to prevent memory leaks and stop watching for form changes.
    // This is crucial if the form element itself is removed or replaced.
    if (this.formMutationObserver) {
      this.formMutationObserver.disconnect()
      this.formMutationObserver = null // Explicitly nullify to aid garbage collection
    }

    // Clear any pending debounced function calls.
    // Ensures that scheduled tasks (like debounced init or color sync) don't run after destruction.
    clearTimeout(this.timeoutId)
    clearTimeout(this.dispatchTimeout)

    // Remove all event listeners added by this validator instance.
    // Prevents duplicate listeners if the validator is reinitialized on the same form.
    this.removeEventListeners()

    // Restore the form's 'novalidate' attribute to its original state.
    if (!this.originalNoValidate) this.form.removeAttribute('novalidate')

    // TODO: Consider explicitly removing dynamically added elements if any were created,
    //       like a fallback main error container, though clearFormErrors() handles hiding it.
    // TODO: Consider resetting inline styles applied (e.g., color label backgrounds),
    //       though this might require storing original values and adds complexity.
  }
}
