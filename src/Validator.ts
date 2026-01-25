/** Form Validator ©2026 JD Lien */

// Import the validator utility functions
import * as utils from '@jdlien/validator-utils'

// CSS.escape polyfill for environments that don't support it (e.g., jsdom)
const cssEscape =
  typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? (s: string) => CSS.escape(s)
    : (s: string) => s.replace(/([.#{}()\\?*[\]-])/g, '\\$1')

export type FormControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

export interface ValidatorOptions {
  messages?: Record<string, string>
  debug?: boolean
  autoInit?: boolean
  preventSubmit?: boolean
  hiddenClasses?: string
  errorMainClasses?: string
  errorInputClasses?: string
  showMainError?: boolean
  scrollToError?: boolean
  scrollToErrorDelay?: number
  validateOnBlur?: boolean
  validationSuccessCallback?: (event: Event) => void
  validationErrorCallback?: (event: Event) => void
}

export interface InputHandler {
  parse: (value: string, dateFormat?: string) => string
  isValid: (value: string) => boolean
  errorKey: string
}

export interface InputHandlers {
  [key: string]: InputHandler
}

export type ValidationEventType = 'validationSuccess' | 'validationError'

export class ValidationEvent extends Event {
  constructor(
    type: ValidationEventType,
    public submitEvent: Event
  ) {
    super(type, { cancelable: true })
  }
}

export default class Validator {
  form: HTMLFormElement
  inputs: FormControl[] = []
  // Keeps track of error messages accumulated for each input
  inputErrors: { [key: string]: string[] } = {}

  // Default error messages.
  messages: Record<string, string> = {
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
  // Whether to scroll to the first error on validation failure
  scrollToError: boolean = false
  // Delay in ms before scrolling to the first error (allows animations to complete)
  scrollToErrorDelay: number = 0
  // Whether to validate inputs when they lose focus (even if unchanged)
  validateOnBlur: boolean = false

  // Classes to apply to the main error message (space-separated)
  errorMainClasses: string
  // Classes added to an invalid input (space-separated)
  errorInputClasses: string
  // Timeout for dispatching events on input (used by syncColorInput)
  private dispatchTimeout: number = 0

  // Pre-split class arrays for performance (avoid repeated .split(' ') calls)
  private hiddenClassesArray: string[] = []
  private errorMainClassesArray: string[] = []
  private errorInputClassesArray: string[] = []

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
    this.scrollToError = options.scrollToError || false
    this.scrollToErrorDelay = options.scrollToErrorDelay || 0
    this.validateOnBlur = options.validateOnBlur || false

    // Pre-split class strings for performance
    this.hiddenClassesArray = this.hiddenClasses.split(' ').filter(Boolean)
    this.errorMainClassesArray = this.errorMainClasses.split(' ').filter(Boolean)
    this.errorInputClassesArray = this.errorInputClasses.split(' ').filter(Boolean)

    this.validationSuccessCallback = options.validationSuccessCallback || (() => {})
    this.validationErrorCallback = options.validationErrorCallback || (() => {})

    if (this.autoInit) this.init()
  }

  // Event handler references
  private submitHandlerRef = this.submitHandler.bind(this)
  private inputInputHandlerRef = this.inputInputHandler.bind(this)
  private inputChangeHandlerRef = this.inputChangeHandler.bind(this)
  private inputBlurHandlerRef = this.inputBlurHandler.bind(this)
  private inputKeydownHandlerRef = this.inputKeydownHandler.bind(this)

  public addEventListeners(): void {
    this.form.addEventListener('submit', this.submitHandlerRef)
    this.form.addEventListener('input', this.inputInputHandlerRef)
    this.form.addEventListener('change', this.inputChangeHandlerRef)
    this.form.addEventListener('keydown', this.inputKeydownHandlerRef)
    if (this.validateOnBlur) {
      this.form.addEventListener('blur', this.inputBlurHandlerRef, true)
    }
  }

  public removeEventListeners(): void {
    this.form.removeEventListener('submit', this.submitHandlerRef)
    this.form.removeEventListener('input', this.inputInputHandlerRef)
    this.form.removeEventListener('change', this.inputChangeHandlerRef)
    this.form.removeEventListener('keydown', this.inputKeydownHandlerRef)
    this.form.removeEventListener('blur', this.inputBlurHandlerRef, true)
  }

  // Adds event listeners to all formFields in a specified form
  init(): void {
    // Reset inputErrors to clear any stale entries from removed inputs
    this.inputErrors = {}

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
      return this.form.querySelector(`#${cssEscape(id)}`) || document.getElementById(id) || null
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
    errorEl!.classList.add(...this.errorMainClassesArray)
    errorEl!.innerHTML = message || this.messages.ERROR_MAIN

    // Ensure it's visible (might have been hidden previously)
    errorEl!.classList.remove(...this.hiddenClassesArray)
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
    el.classList.add(...this.errorInputClassesArray)

    // Add the error messages to the error element and show it
    let errorEl = this.getErrorEl(el)
    if (!errorEl) return

    errorEl.innerHTML = errors.join('<br>')
    errorEl.classList.remove(...this.hiddenClassesArray)
  }

  // Shows all the error messages for all the inputs of the form, and a main error message
  private showFormErrors(): void {
    // Show any errors from validation
    this.inputs.forEach((el) => this.showInputErrors(el))

    // Find the first input with errors for potential scroll
    const firstErrorInput = this.inputs.find((el) => this.inputErrors[el.name || el.id]?.length > 0)

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
        mainErrorElement.classList.remove(...this.hiddenClassesArray)
      } else {
        // If no main error element exists, add it (which also makes it visible)
        this.addErrorMain()
      }
    }

    // Scroll to first error and focus if enabled
    if (this.scrollToError && firstErrorInput) {
      const scrollAndFocus = () => {
        firstErrorInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Use preventScroll to avoid focus() overriding the smooth scroll
        firstErrorInput.focus({ preventScroll: true })
      }
      if (this.scrollToErrorDelay > 0) {
        setTimeout(scrollAndFocus, this.scrollToErrorDelay)
      } else {
        scrollAndFocus()
      }
    }
  }

  // Clears error messages from an input and removes its errors from the inputErrors array
  private clearInputErrors(el: FormControl): void {
    this.inputErrors[el.name || el.id] = []

    // Remove the aria-invalid attribute from the input
    el.removeAttribute('aria-invalid')

    // Remove the error style from the input itself (must happen even without errorEl)
    el.classList.remove(...this.errorInputClassesArray)

    let errorEl = this.getErrorEl(el)
    if (!errorEl) return

    // Hide the error element
    errorEl.classList.add(...this.hiddenClassesArray)

    // Clear the error message
    // TODO: This needs to happen on transitionend if we want to animate the error message out
    errorEl.textContent = ''
  }

  private clearFormErrors(): void {
    // Find the main error element (form-specific or generic) and hide it
    const mainErrorElement = this._getMainErrorElement()
    if (mainErrorElement) {
      mainErrorElement.classList.add(...this.hiddenClassesArray)
      // Optionally clear the content after hiding
      // mainErrorElement.innerHTML = ''
    }

    // Clear any previous input errors
    this.inputs.forEach((el) => this.clearInputErrors(el))
  }

  private hasInputValue(el: FormControl): boolean {
    if (el instanceof HTMLInputElement && el.type === 'file') {
      return !!el.files && el.files.length > 0
    }
    return el.value.length > 0
  }

  // Validates a required input and returns true if it's valid.
  // Shows an error if the input is required and empty.
  private validateRequired(el: FormControl): boolean {
    let valid = true
    const isCheckable =
      el instanceof HTMLInputElement && ['checkbox', 'radio'].includes(el.type)
    const isFileInput = el instanceof HTMLInputElement && el.type === 'file'
    const isEmpty = isFileInput
      ? !this.hasInputValue(el)
      : el.value === '' || (isCheckable && !el.checked)
    if (
      el.required &&
      isEmpty
    ) {
      // Handle checkboxes and radio buttons. Check that at least one of any name group is checked
      // Check that any checkbox of a group of checkboxes is checked
      // This assumes the checkbox or radio button is in a group... if it's not,
      // we can specify a default error message with error=
      if (isCheckable) {
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

    if (el instanceof HTMLInputElement && el.type === 'file') return valid

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

  // Validates min/max numeric value constraints
  private validateValue(el: FormControl): boolean {
    let valid = true
    if (el.disabled) return valid
    if (!(el instanceof HTMLInputElement) || !el.value.length) return valid

    // Only apply to numeric types
    const numericTypes = ['number', 'integer', 'float', 'decimal']
    const dataType = el.dataset.type || el.type
    if (!numericTypes.includes(dataType) && !numericTypes.includes(el.type)) return valid

    const numValue = parseFloat(el.value)
    if (isNaN(numValue)) return valid // Let type validation handle invalid numbers

    // Get min from data-min, then native min attribute
    const minAttr = el.dataset.min ?? el.min
    const maxAttr = el.dataset.max ?? el.max

    if (minAttr !== undefined && minAttr !== '') {
      const minValue = parseFloat(minAttr)
      if (!isNaN(minValue) && numValue < minValue) {
        valid = false
        this.addInputError(el, this.messages.ERROR_MIN_VALUE.replace('${val}', minAttr))
      }
    }

    if (maxAttr !== undefined && maxAttr !== '') {
      const maxValue = parseFloat(maxAttr)
      if (!isNaN(maxValue) && numValue > maxValue) {
        valid = false
        this.addInputError(el, this.messages.ERROR_MAX_VALUE.replace('${val}', maxAttr))
      }
    }

    return valid
  }

  // A map of input handlers that can be used for each type of input.
  // errorKey references this.messages at validation time to support custom messages
  private inputHandlers: InputHandlers = {
    number: {
      parse: utils.parseNumber,
      isValid: utils.isNumber,
      errorKey: 'ERROR_NUMBER',
    },
    integer: {
      parse: utils.parseInteger,
      isValid: utils.isInteger,
      errorKey: 'ERROR_INTEGER',
    },
    tel: {
      parse: utils.parseNANPTel,
      isValid: utils.isNANPTel,
      errorKey: 'ERROR_TEL',
    },
    email: {
      parse: (value: string) => value.trim(),
      isValid: utils.isEmail,
      errorKey: 'ERROR_EMAIL',
    },
    zip: {
      parse: utils.parseZip,
      isValid: utils.isZip,
      errorKey: 'ERROR_ZIP',
    },
    postal: {
      parse: utils.parsePostalCA,
      isValid: utils.isPostalCA,
      errorKey: 'ERROR_POSTAL',
    },
    url: {
      parse: utils.parseUrl,
      isValid: utils.isUrl,
      errorKey: 'ERROR_URL',
    },
    date: {
      parse: utils.parseDateToString,
      isValid: utils.isDate,
      errorKey: 'ERROR_DATE',
    },
    datetime: {
      parse: utils.parseDateTimeToString,
      isValid: utils.isDateTime,
      errorKey: 'ERROR_DATETIME',
    },
    time: {
      parse: utils.parseTimeToString,
      isValid: utils.isTime,
      errorKey: 'ERROR_TIME',
    },
    color: {
      parse: (value: string) => value.trim().toLowerCase(),
      isValid: utils.isColor,
      errorKey: 'ERROR_COLOR',
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
        // Look up error message at validation time to support custom messages
        this.addInputError(el, this.messages[inputHandler.errorKey])
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
        if (range === 'past') {
          msg = this.messages.ERROR_DATE_PAST
        }
        if (range === 'future') {
          msg = this.messages.ERROR_DATE_FUTURE
        }
        this.addInputError(el, msg)
        return false
      }
    }

    return true
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  private parseAcceptList(accept: string): { mimeTypes: string[]; extensions: string[] } {
    const mimeTypes: string[] = []
    const extensions: string[] = []

    for (const raw of accept.split(',')) {
      const token = raw.trim().toLowerCase()
      if (!token) continue
      if (token.startsWith('.')) extensions.push(token)
      else if (token.includes('/')) mimeTypes.push(token)
    }

    return { mimeTypes, extensions }
  }

  private validateFileInput(el: HTMLInputElement): boolean {
    if (el.type !== 'file') return true
    const files = Array.from(el.files || [])
    if (!files.length) return true

    let valid = true

    const maxFiles = Number.parseInt(el.dataset.maxFiles || '', 10)
    if (Number.isFinite(maxFiles) && maxFiles >= 0 && files.length > maxFiles) {
      this.addInputError(
        el,
        this.messages.ERROR_FILE_MAX_FILES.replace('${val}', maxFiles.toString())
      )
      valid = false
    }

    const minSize = Number.parseFloat(el.dataset.minFileSize || '')
    if (Number.isFinite(minSize) && minSize >= 0) {
      const tooSmall = files.some((file) => file.size < minSize)
      if (tooSmall) {
        this.addInputError(
          el,
          this.messages.ERROR_FILE_MIN_SIZE.replace('${val}', this.formatBytes(minSize))
        )
        valid = false
      }
    }

    const maxSize = Number.parseFloat(el.dataset.maxFileSize || '')
    if (Number.isFinite(maxSize) && maxSize >= 0) {
      const tooLarge = files.some((file) => file.size > maxSize)
      if (tooLarge) {
        this.addInputError(
          el,
          this.messages.ERROR_FILE_MAX_SIZE.replace('${val}', this.formatBytes(maxSize))
        )
        valid = false
      }
    }

    const accept = (el.dataset.accept ?? el.accept ?? '').trim()
    if (accept) {
      const { mimeTypes, extensions } = this.parseAcceptList(accept)
      if (mimeTypes.length || extensions.length) {
        const matchesMime = (type: string) =>
          mimeTypes.some((entry) => {
            if (entry === '*/*') return true
            if (entry.endsWith('/*')) return type.startsWith(entry.slice(0, -1))
            return entry === type
          })

        const isAllowed = (file: File) => {
          const type = file.type.toLowerCase()
          const name = file.name.toLowerCase()
          const allowedByMime = type && mimeTypes.length ? matchesMime(type) : false
          const allowedByExt = extensions.length ? extensions.some((ext) => name.endsWith(ext)) : false
          return allowedByMime || allowedByExt
        }

        if (files.some((file) => !isAllowed(file))) {
          this.addInputError(el, this.messages.ERROR_FILE_TYPE)
          valid = false
        }
      }
    }

    return valid
  }

  // Validates a pattern from data-pattern or pattern; data-pattern takes precedence
  // Anchors pattern to match HTML5 pattern attribute behavior (full value must match)
  private validatePattern(el: FormControl): boolean {
    if (el instanceof HTMLInputElement && el.type === 'file') return true
    const pattern = el.dataset.pattern || (el instanceof HTMLInputElement && el.pattern) || null
    if (!pattern) return true

    let regex: RegExp
    try {
      // Anchor pattern to require full match (HTML5 pattern behavior)
      regex = new RegExp(`^(?:${pattern})$`)
    } catch {
      // Invalid regex pattern - treat as pass-through
      return true
    }

    if (!regex.test(el.value)) {
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
    if (!(el instanceof HTMLInputElement) || !this.hasInputValue(el)) return true

    let valid = true
    const isFileInput = el.type === 'file'

    // Skip disabled inputs
    if (el.disabled) return valid
    if (isFileInput) {
      valid = this.validateFileInput(el) && valid
    } else {
      valid = this.validateInputType(el) && valid
      valid = this.validateDateRange(el) && valid
      valid = this.validatePattern(el) && valid
    }
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
      valid = this.validateValue(el) && valid
      valid = (await this.validateInput(el)) && valid
      // Validate custom functions here if value is empty, as they won't be
      // evaluated by validateInput, which only checks inputs with a value.
      if (!this.hasInputValue(el)) valid = (await this.validateCustom(el)) && valid
    }

    return valid
  } //end validate()

  /**
   * Validates a single input programmatically and displays any error messages.
   * Useful for validating inputs on demand (e.g., in multi-step forms or custom UI flows).
   * @param input The input element to validate
   * @returns A promise that resolves to true if the input is valid, false otherwise
   */
  public async validateSingle(input: FormControl): Promise<boolean> {
    // If the input isn't part of this form's inputs, consider it valid
    if (!this.inputs.includes(input)) return true

    // Skip disabled inputs
    if (input.disabled) return true

    this.clearInputErrors(input)

    let valid = true
    valid = this.validateRequired(input) && valid
    valid = this.validateLength(input) && valid
    valid = this.validateValue(input) && valid
    valid = (await this.validateInput(input)) && valid
    // Validate custom functions if value is empty, as validateInput
    // only checks inputs with a value.
    if (!this.hasInputValue(input)) valid = (await this.validateCustom(input)) && valid

    this.showInputErrors(input)
    return valid
  }

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
    const validationEvent = new ValidationEvent(valid ? 'validationSuccess' : 'validationError', e)

    this.form.dispatchEvent(validationEvent)

    if (valid) {
      if (this.validationSuccessCallback) this.validationSuccessCallback(e)
    } else {
      if (this.validationErrorCallback) this.validationErrorCallback(e)
    }

    if (valid && !this.preventSubmit) {
      this.isSubmitting = true
      if (!validationEvent.defaultPrevented) this.form.submit()
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
    const target = e.target
    // Handle all form control types: input, select, and textarea
    if (
      !(
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement
      ) ||
      this.shouldSkipValidation(target)
    )
      return

    // Clear and reset error messages for the input
    this.clearInputErrors(target)
    this.validateLength(target)
    await this.validateInput(target)
    // Show any error messages for the input after validation
    this.showInputErrors(target)
  }

  // Validates on blur even if value unchanged (catches touched-but-empty required fields)
  private async inputBlurHandler(e: FocusEvent): Promise<void> {
    const target = e.target
    if (
      !(
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement
      ) ||
      this.shouldSkipValidation(target)
    )
      return

    this.clearInputErrors(target)
    this.validateRequired(target)
    this.validateLength(target)
    this.validateValue(target)
    await this.validateInput(target)
    if (!this.hasInputValue(target)) await this.validateCustom(target)
    this.showInputErrors(target)
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
    let colorInput: HTMLInputElement | null = input

    if (input.type === 'color') {
      colorInput = this.form.querySelector(`#${cssEscape(input.id.replace(/-color$/, ''))}`)
      if (!colorInput) return // No paired text input found
    }

    let colorLabel = this.form.querySelector(
      `#${cssEscape(colorInput.id)}-color-label`
    ) as HTMLElement | null

    // Update the HTML color picker input and its label background when color input changes
    if ((input.dataset.type || '') === 'color') {
      let colorPicker = this.form.querySelector(
        `input#${cssEscape(input.id)}-color`
      ) as HTMLInputElement

      if (!colorPicker || !utils.isColor(input.value)) return
      colorPicker.value = utils.parseColor(input.value)
    }

    // Update the color input and label background when the HTML color picker is changed
    if (input.type === 'color' && colorInput) colorInput.value = input.value

    if (colorLabel) colorLabel.style.backgroundColor = input.value

    // Dispatch a change event so the color picker's error message updates
    // Debounce so it doesn't get called rapidly when selecting a color
    clearTimeout(this.dispatchTimeout)
    this.dispatchTimeout = window.setTimeout(() => {
      colorInput.dispatchEvent(new Event('change', { bubbles: true }))
    }, 200)
  }

  // Support using arrow keys to increment/decrement numeric fields.
  // Use data-arrow-step to customize step size, or set to "" to disable.
  private inputKeydownHandler(e: KeyboardEvent) {
    if (!(e.target instanceof HTMLInputElement)) return
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return

    const el = e.target
    const isInteger = utils.isType(el, 'integer')
    const isNumber = utils.isType(el, ['number', 'float', 'decimal'])
    if (!isInteger && !isNumber) return

    // data-arrow-step="" disables the feature
    if (el.dataset.arrowStep === '') return

    e.preventDefault()

    const step = parseFloat(el.dataset.arrowStep ?? '1') || 1
    const current = parseFloat(el.value) || 0
    const delta = e.key === 'ArrowUp' ? step : -step
    let newVal = current + delta

    // Get min/max bounds
    const minAttr = el.dataset.min ?? el.min
    const maxAttr = el.dataset.max ?? el.max
    const min = minAttr !== '' ? parseFloat(minAttr) : isInteger ? 0 : -Infinity
    const max = maxAttr !== '' ? parseFloat(maxAttr) : Infinity

    // Clamp to bounds
    if (!isNaN(min)) newVal = Math.max(min, newVal)
    if (!isNaN(max)) newVal = Math.min(max, newVal)

    // Handle floating point precision - use max decimals from step or current value
    const stepDecimals = (step.toString().split('.')[1] || '').length
    const valueDecimals = (el.value.split('.')[1] || '').length
    const decimals = Math.max(stepDecimals, valueDecimals)
    el.value = isInteger
      ? Math.round(newVal).toString()
      : decimals
        ? newVal.toFixed(decimals)
        : newVal.toString()
  }

  public destroy() {
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
