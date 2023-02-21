import Validator, { ValidationErrorEvent, ValidationSuccessEvent } from '../src/Validator'
import * as utils from '../src/validator-utils'
import { ValidatorOptions } from '../src/types'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Validator', () => {
  let form: HTMLFormElement
  let formControl: HTMLInputElement
  let errorEl: HTMLDivElement
  let options: ValidatorOptions
  let validator: Validator
  let valid: boolean
  let today: Date
  let yesterday: Date
  let tomorrow: Date

  beforeEach(() => {
    form = document.createElement('form')
    form.id = 'test-form'
    document.body.appendChild(form)

    formControl = document.createElement('input')
    formControl.type = 'text'
    formControl.name = 'test-input'
    formControl.id = 'test-input'
    form.appendChild(formControl)

    errorEl = document.createElement('div')
    errorEl.id = 'test-input-error'
    errorEl.classList.add('hidden')
    form.appendChild(errorEl)

    options = {}
    validator = new Validator(form)

    today = new Date()
    yesterday = new Date()
    tomorrow = new Date()

    today.setHours(0)
    today.setMinutes(0)
    today.setSeconds(0)
    today.setMilliseconds(0)

    yesterday.setHours(0)
    yesterday.setMinutes(0)
    yesterday.setSeconds(0)
    yesterday.setMilliseconds(0)
    yesterday.setDate(today.getDate() - 1)

    tomorrow.setHours(0)
    tomorrow.setMinutes(0)
    tomorrow.setSeconds(0)
    tomorrow.setMilliseconds(0)
    tomorrow.setDate(today.getDate() + 1)
  })

  afterEach(() => {
    document.body.removeChild(form)
  })

  describe('constructor', () => {
    it('throws an error if no form is passed', () => {
      expect(() => {
        // @ts-ignore
        new Validator()
      }).toThrowError('Validator requires a form to be passed as the first argument.')
    })

    it('should create a new Validator object', () => {
      expect(validator).toBeTruthy()
    })

    it('should have a form property', () => {
      expect(validator.form).toBeTruthy()
    })

    it('throws an error if the form argument is not an instance of HTMLFormElement', () => {
      // @ts-ignore
      expect(() => new Validator(document.createElement('div'))).toThrowError(
        'form argument must be an instance of HTMLFormElement'
      )
    })

    it('sets the preventSubmit property to true if the form has data-prevent-submit attribute', () => {
      form.dataset.preventSubmit = ''
      const validator = new Validator(form)
      expect(validator.preventSubmit).toBeTruthy()
    })

    it('overrides the preventSubmit property if set in the options argument', () => {
      form.dataset.preventSubmit = ''
      options.preventSubmit = false
      const validator = new Validator(form, options)
      expect(validator.preventSubmit).toBeFalsy()
    })

    it('merges the messages option with the default messages', () => {
      options.messages = { ERROR_MAIN: 'Custom error message' }
      const validator = new Validator(form, options)
      expect(validator.messages.ERROR_MAIN).toBe('Custom error message')
      expect(validator.messages.ERROR_REQUIRED).toBe('This field is required.')
    })

    it('sets the debug property to the value in the options argument', () => {
      options.debug = true
      const validator = new Validator(form, options)
      expect(validator.debug).toBeTruthy()
    })

    it('sets the autoInit property to the value in the options argument', () => {
      options.autoInit = false
      const validator = new Validator(form, options)
      expect(validator.autoInit).toBeFalsy()
    })

    it('sets the hiddenClasses property to the value in the options argument', () => {
      options.hiddenClasses = 'custom-hidden-class'
      const validator = new Validator(form, options)
      expect(validator.hiddenClasses).toBe('custom-hidden-class')
    })

    it('sets the errorMainClasses property to the value in the options argument', () => {
      options.errorMainClasses = 'custom-error-main-class'
      const validator = new Validator(form, options)
      expect(validator.errorMainClasses).toBe('custom-error-main-class')
    })

    it('sets the errorInputClasses property to the value in the options argument', () => {
      options.errorInputClasses = 'custom-error-input-class'
      const validator = new Validator(form, options)
      expect(validator.errorInputClasses).toBe('custom-error-input-class')
    })
  }) // constructor

  describe('Validator observer', () => {
    it('observer should update inputs on input addition', async () => {
      let inputCount = validator.inputs.length
      // Add a new input to the form
      let input = document.createElement('input')
      input.type = 'text'
      input.name = 'testInput'
      input.value = 'test value'
      form.appendChild(input)

      // The observer should have been triggered, adding a new input to the inputs array
      await new Promise((resolve) => setTimeout(resolve, 0))

      if (!form.lastChild) throw new Error('lastChild is null')

      expect(validator.inputs.length).toEqual(inputCount + 1)
      form.removeChild(form.lastChild)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
  }) // Validator observer

  describe('init', () => {
    it('should set the inputs property to an array of form controls', () => {
      let input2 = document.createElement('input')
      input2.type = 'email'
      form.appendChild(input2)

      validator.init()
      expect(validator.inputs).toEqual([formControl, input2])
    })

    it('should set the novalidate attribute on the form', () => {
      validator.init()
      expect(form.getAttribute('novalidate')).toEqual('novalidate')
    })

    it('should add and remove event listeners with the correct arguments', () => {
      const form = document.createElement('form')
      const validator = new Validator(form)

      const addEventListenerSpy = vi.spyOn(form, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(form, 'removeEventListener')

      validator.addEventListeners()
      validator.removeEventListeners()

      expect(addEventListenerSpy).toHaveBeenCalledTimes(5)
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'submit',
        (validator as any).submitHandlerRef
      )

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'input',
        (validator as any).inputInputHandlerRef
      )

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'change',
        (validator as any).inputChangeHandlerRef
      )

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        (validator as any).inputKeydownHandlerRef
      )

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(5)
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'submit',
        (validator as any).submitHandlerRef
      )

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'input',
        (validator as any).inputInputHandlerRef
      )

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'change',
        (validator as any).inputChangeHandlerRef
      )

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        (validator as any).inputKeydownHandlerRef
      )

      expect(removeEventListenerSpy).toHaveBeenCalledWith('remove', validator.destroy)
    })
  }) // init

  describe('addErrorMain', () => {
    type MessageDictionary = { [key: string]: string }
    let messages: MessageDictionary
    let errorMainClasses: string

    beforeEach(() => {
      messages = { ERROR_MAIN: 'Error: main' }
      errorMainClasses = 'error-main'
      validator = new Validator(form, { messages, errorMainClasses })
    })

    it('creates an element with id "form-error-main"', () => {
      ;(validator as any).addErrorMain()
      const errorEl = form.querySelector('#form-error-main')
      expect(errorEl).toBeTruthy()
      const classes = errorMainClasses.split(' ')
      if (errorEl) expect(errorEl.classList.contains.apply(errorEl.classList, classes)).toBeTruthy()
    })

    it('sets the innerHTML of the element to message if message is provided', () => {
      const message = 'Hello, world!'
      ;(validator as any).addErrorMain(message)
      const errorEl = document.querySelector('#form-error-main')
      if (errorEl) expect(errorEl.innerHTML).toBe(message)
    })

    it('sets the innerHTML of the element to messages.ERROR_MAIN if message is not provided', () => {
      ;(validator as any).addErrorMain()
      const errorEl = document.querySelector('#form-error-main')
      if (errorEl) expect(errorEl.innerHTML).toBe(messages.ERROR_MAIN)
    })

    it('adds the element to the form', () => {
      ;(validator as any).addErrorMain()
      const errorEl = document.querySelector('#form-error-main')
      if (errorEl) expect(errorEl.parentNode).toBe(form)
    })
  }) // addErrorMain

  describe('addInputError', () => {
    it('adds an error to the inputErrors array for the given form control', () => {
      ;(validator as any).addInputError(formControl, 'invalid username')
      expect(validator.inputErrors[formControl.name]).toContain('invalid username')
    })

    it('uses the id of the form control if no name is provided', () => {
      formControl.name = ''
      ;(validator as any).addInputError(formControl, 'invalid username')
      expect(validator.inputErrors[formControl.id]).toContain('invalid username')
    })

    it('adds the error message if one is provided', () => {
      ;(validator as any).addInputError(formControl, 'test message')
      expect(validator.inputErrors[formControl.name]).toContain('test message')
    })

    it('adds the errorDefault message if no message is provided', () => {
      formControl.dataset.errorDefault = 'default error message'
      ;(validator as any).addInputError(formControl)
      expect(validator.inputErrors[formControl.name]).toContain('default error message')
    })

    it('adds the generic error message if no message or errorDefault is provided', () => {
      validator.messages.ERROR_GENERIC = 'generic error message'
      ;(validator as any).addInputError(formControl)
      expect(validator.inputErrors[formControl.name]).toContain('generic error message')
    })

    it('logs a debugging message if debug is enabled', () => {
      validator.debug = true
      vi.spyOn(console, 'log')
      ;(validator as any).addInputError(formControl, 'invalid username')
      expect(console.log).toHaveBeenCalledWith('Invalid value for test-input: invalid username')
    })
  }) // addInputError

  describe('showInputErrors', () => {
    it('shows an error message', () => {
      // First add an error
      ;(validator as any).addInputError(formControl)
      ;(validator as any).showInputErrors(formControl)

      expect(errorEl.innerHTML).toBe(validator.messages.ERROR_GENERIC)
      expect(errorEl.classList.contains('hidden')).toBeFalsy()

      validator.errorInputClasses.split(' ').forEach((errorClass) => {
        expect(formControl.classList.contains(errorClass)).toBeTruthy()
      })

      // Clean up
      formControl.remove()
      errorEl.remove()
    })
  }) // showInputErrors

  describe('clearInputErrors', () => {
    it('clears an error message', () => {
      errorEl.textContent = 'An error message!'
      ;(validator as any).clearInputErrors(formControl)
      expect(validator.inputErrors[formControl.name]).toEqual([])
      expect(errorEl.innerHTML).toBe('')
      expect(errorEl.classList.contains('hidden')).toBeTruthy()

      validator.errorInputClasses.split(' ').forEach((errorClass) => {
        expect(formControl.classList.contains(errorClass)).toBeFalsy()
      })
    })
  }) // clearInputErrors

  describe('clearFormErrors', () => {
    it('clears all error messages', () => {
      form.id = 'clear-all-errors-form'
      const formControl1 = document.createElement('input')
      formControl1.type = 'text'
      formControl1.id = 'test-input-1'
      formControl1.name = 'test-input-1'
      form.appendChild(formControl1)

      const errorEl1 = document.createElement('div')
      errorEl1.id = 'test-input-1-error'
      errorEl1.textContent = 'An error message!'
      form.appendChild(errorEl1)

      const formControl2 = document.createElement('input')
      formControl2.type = 'text'
      formControl2.id = 'test-input-2'
      formControl2.name = 'test-input-2'
      form.appendChild(formControl2)

      const errorEl2 = document.createElement('div')
      errorEl2.id = 'test-input-2-error'
      errorEl2.textContent = 'Another error message!'
      form.appendChild(errorEl2)

      validator.init()
      ;(validator as any).addInputError(formControl1)
      ;(validator as any).addInputError(formControl2)

      expect(validator.inputErrors[formControl1.name]).toContain(validator.messages.ERROR_GENERIC)
      expect(validator.inputErrors[formControl2.name]).toContain(validator.messages.ERROR_GENERIC)
      ;(validator as any).clearFormErrors()

      // validator.inputErrors should be empty
      expect(Object.values(validator.inputErrors).every((i) => i.length == 0)).toBeTruthy()

      // aria-invalid should not be set
      expect(formControl1.getAttribute('aria-invalid')).toBeNull()
      expect(formControl2.getAttribute('aria-invalid')).toBeNull()

      expect(errorEl1.innerHTML).toBe('')
      expect(errorEl1.classList.contains('hidden')).toBeTruthy()

      expect(errorEl2.innerHTML).toBe('')
      expect(errorEl2.classList.contains('hidden')).toBeTruthy()

      validator.errorInputClasses.split(' ').forEach((errorClass) => {
        expect(formControl1.classList.contains(errorClass)).toBeFalsy()
        expect(formControl2.classList.contains(errorClass)).toBeFalsy()
      })
    })
  }) // end clearFormErrors

  describe('validateRequired', () => {
    let radio1: HTMLInputElement
    let radio2: HTMLInputElement
    let radioError: HTMLDivElement

    beforeEach(() => {
      // Create a group of radio buttons
      radio1 = document.createElement('input')
      radio1.id = 'radio1'
      radio1.type = 'radio'
      radio1.name = 'test-radio'
      form.appendChild(radio1)

      radio2 = document.createElement('input')
      radio2.id = 'radio2'
      radio2.type = 'radio'
      radio2.name = 'test-radio'
      form.appendChild(radio2)

      radioError = document.createElement('div')
      radioError.id = 'test-radio-error'
      radioError.classList.add('hidden')
      form.appendChild(radioError)

      validator.init()
    })

    it('returns true and shows no error if the input is not required', () => {
      const result = (validator as any).validateRequired(formControl)
      expect(result).toBeTruthy()
      expect(errorEl.classList.contains('hidden')).toBeTruthy()
      expect(errorEl.textContent).toBe('')
    })

    it('returns false and shows an error if the input is required and empty', () => {
      formControl.required = true

      const result = (validator as any).validateRequired(formControl)
      expect(result).toBeFalsy()

      // We show the generic error message if one isn't provided
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_GENERIC)
    })

    it('returns false and shows the specified error if the input is required and empty', () => {
      formControl.required = true
      let errorMessage = 'This is a custom error message'
      formControl.setAttribute('data-error-default', errorMessage)

      const result = (validator as any).validateRequired(formControl)
      expect(result).toBeFalsy()

      // We show the generic error message if one isn't provided
      expect(validator.inputErrors[formControl.name]).toContain(errorMessage)
    })

    it('returns false and shows an error if the input is a single checkbox and not checked', () => {
      formControl.type = 'checkbox'
      formControl.required = true

      const result = (validator as any).validateRequired(formControl)
      expect(result).toBeFalsy()

      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.CHECKED_REQUIRED)
    })

    it('returns false and shows an error if the input is a radio button and not checked', () => {
      formControl = document.createElement('input')
      formControl.type = 'radio'
      formControl.id = 'test-input'
      formControl.name = 'test-input'
      formControl.required = true
      form.appendChild(formControl)

      const result = (validator as any).validateRequired(formControl)
      expect(result).toBeFalsy()

      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.OPTION_REQUIRED)
    })

    it('returns false and shows an error if the input is a radio group and one input not checked', () => {
      radio1.required = true
      radio2.required = true
      const result = (validator as any).validateRequired(radio1)
      expect(result).toBeFalsy()

      expect(validator.inputErrors[radio1.name]).toContain(validator.messages.OPTION_REQUIRED)
    })

    it('returns true and shows no error for any input in group if input is radio group and an input is checked', () => {
      radio1.required = true
      radio1.checked = true
      radio2.required = true

      // Even though radio 1 is checked, validator will determine that both are valid
      const result = (validator as any).validateRequired(radio1)
      expect(result).toBeTruthy()

      const radioError = document.querySelector(`#${radio1.name}-error`)
      if (radioError) expect(radioError.classList.contains('hidden')).toBeTruthy()
      if (radioError) expect(radioError.textContent).toBe('')

      const result2 = (validator as any).validateRequired(radio2)
      expect(result2).toBeTruthy()
      if (radioError) expect(radioError.classList.contains('hidden')).toBeTruthy()
      if (radioError) expect(radioError.textContent).toBe('')
    })
  }) // end validateRequired

  describe('validate Min/Max Length', () => {
    it('returns true and shows no error if the input is empty', () => {
      const result = (validator as any).validateLength(formControl)
      expect(result).toBeTruthy()
      expect(errorEl.classList.contains('hidden')).toBeTruthy()
      expect(errorEl.textContent).toBe('')

      const result2 = (validator as any).validateLength(formControl)
      expect(result2).toBeTruthy()
      expect(validator.inputErrors[formControl.name]).toEqual([])
    })

    it('returns true and shows no error if the input is not empty and is within the min/max length', () => {
      formControl.value = 'te'
      formControl.setAttribute('data-min-length', '2')
      formControl.setAttribute('data-max-length', '4')

      const result = (validator as any).validateLength(formControl)
      expect(result).toBeTruthy()
      expect(errorEl.classList.contains('hidden')).toBeTruthy()
      expect(errorEl.textContent).toBe('')

      formControl.value = 'test'
      const result2 = (validator as any).validateLength(formControl)
      expect(result2).toBeTruthy()
      expect(validator.inputErrors[formControl.name]).toEqual([])
    })

    it('returns false and shows an error if the input is not empty and is less than the min length', () => {
      formControl.value = 'te'
      formControl.setAttribute('data-min-length', '3')

      const result = (validator as any).validateLength(formControl)
      expect(result).toBeFalsy()
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_MINLENGTH.replace('${val}', '3')
      )
    })

    it('with minlength attribute returns false and shows an error if the input is not empty and is less than the min length', () => {
      formControl.value = 'te'
      formControl.minLength = 3

      const result = (validator as any).validateLength(formControl)
      expect(result).toBeFalsy()
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_MINLENGTH.replace('${val}', '3')
      )
    })

    it('returns false and shows an error if the input is not empty and is greater than the max length', () => {
      formControl.value = 'test'
      formControl.setAttribute('data-max-length', '3')

      const result = (validator as any).validateLength(formControl)
      expect(result).toBeFalsy()
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_MAXLENGTH.replace('${val}', '3')
      )
    })

    it('with minlength attribute returns false and shows an error if the input is not empty and is less than the min length', () => {
      formControl.value = 'test'
      formControl.maxLength = 3

      const result = (validator as any).validateLength(formControl)
      expect(result).toBeFalsy()
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_MAXLENGTH.replace('${val}', '3')
      )
    })
  }) // end validate Min/Max Length

  // This version only tests the base functionality of the validateInputType method
  // It doesn't test the parsing of dates, times, or colors, those will be tested in their own tests
  describe('validateInputType base', () => {
    it('calls the correct parse and valid methods for number', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'number'
      formControl.value = '10'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.number, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.number, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.dateFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('calls the correct parse and valid methods for integer', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'integer'
      formControl.value = '10'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.integer, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.integer, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.dateFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('calls the correct parse and valid methods for tel', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'tel'
      formControl.value = '780-700-0000'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.tel, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.tel, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.dateFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('calls the correct parse and valid methods for email', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'email'
      formControl.value = 'email@example.com'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.email, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.email, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.dateFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('calls the correct parse and valid methods for postal', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'postal'
      formControl.value = 'T5A 0A1'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.postal, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.postal, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.dateFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('calls the correct parse and valid methods for url', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'url'
      formControl.value = 'https://example.com'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.url, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.url, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.dateFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('calls the correct parse and valid methods for date with default format', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'date'
      formControl.value = '2020-Jan-01'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.date, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.date, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.dateFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('calls the correct parse and valid methods for date with different date format', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'date'
      formControl.value = '2020-01-01'
      formControl.dataset.dateFormat = 'YYYY-MM-DD'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.date, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.date, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.dateFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('calls the correct parse and valid methods for time', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'time'
      formControl.value = '20:01'
      formControl.dataset.timeFormat = 'HH:mm'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.time, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.time, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.timeFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('returns true if there is no matching inputHandler', () => {
      formControl.type = 'text'
      formControl.value = 'test'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
    })

    it('returns false if the inputHandler returns false', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'number'
      formControl.value = 'test'

      const isValidSpy = vi.spyOn((validator as any).inputHandlers.number, 'isValid')

      isValidSpy.mockImplementation(() => false)

      valid = (validator as any).validateInputType(formControl)

      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)
      expect(valid).toBeFalsy()
    })

    it('does not update the value if the input is a native date input', () => {
      formControl.type = 'date'
      formControl.value = '2020-01-01'
      formControl.dataset.dateFormat = 'YYYY-MMM-DD'

      // Note that the value doesn't match the date format, so normally parse would update the value

      valid = (validator as any).validateInputType(formControl)

      expect(formControl.value).toBe('2020-01-01')

      expect(valid).toBeTruthy()
    })

    it('does update the value if the input is a data-date input', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'date'
      formControl.value = '2020-01-01'
      formControl.dataset.dateFormat = 'YYYY-MMM-DD'

      // Note that the value doesn't match the date format, so normally parse would update the value

      valid = (validator as any).validateInputType(formControl)

      expect(formControl.value).toBe('2020-Jan-01')

      expect(valid).toBeTruthy()
    })
  }) // end validateInputType base

  // This version tests the functionality of each input handler type with some examples.
  describe('validateInputType', () => {
    let formControlColor: HTMLInputElement

    // I'll not support unicode addresses for now.
    const emailAddresses = [
      'email@example.com',
      'email+tag@example.com',
      'email.dot@example.com',
      'email@sub.example.com',
      '"email"@example.com',
      '"email@example.com"@example.com',
      'correo@ejemplo.es',
      'user@xn--ls8h.com',
      // '邮箱@例子.中国',
      // 'почта@пример.рф',
      // '電子郵件@範例.香港',
      // '이메일@예시.한국',
      // '電子メール@サンプル.日本',
      'a.valid.email.that.is.very.very.long.and.should.validate.because.it.is.under.two.hundred.and.fifty.five.characters.with.lots.of.subdomains.in.it.that.is.quite.ridiculous@a.very.long.top.level.domain.that.is.also.very.long.and.has.lots.of.letters.in.it.com',
    ]

    const invalidEmailAddresses = [
      'john.doe@',
      'john.doe@.com',
      'john.doe@com.',
      'john.doe@-example.com',
      'john.doe@example-.com',
      'john.doe@example.com-',
      'john.doe@example.com/',
      'john.doe@example..com',
      'john.doe@ex@mple.com',
      'john.doe@example.com?',
      'user@invalid.c',
      'an.email.that.is.a.little.too.long.and.should.not.validate.because.it.is.over.two.hundred.and.fifty.five.characters.with.lots.of.subdomains.in.it.that.is.quite.ridiculous@a.very.long.top.level.domain.that.is.also.very.long.and.has.lots.of.letters.in.it.com',
    ]

    const times = [
      ['12:00', '12:00 PM'],
      ['12:00:00', '12:00 PM'],
      ['1p', '1:00 PM'],
      ['1 pm', '1:00 PM'],
      ['132', '1:32 AM'],
      ['132pm', '1:32 PM'],
    ]

    const invalidTimes = ['asdf']

    const colors = [
      { name: 'red', value: '#ff0000', rgb: 'rgb(255, 0, 0)', hsl: 'hsl(0, 100%, 50%)' },
      { name: 'green', value: '#008000', rgb: 'rgb(0, 128, 0)', hsl: 'hsl(120, 100%, 25%)' },
      { name: 'blue', value: '#0000ff', rgb: 'rgb(0, 0, 255)', hsl: 'hsl(240, 100%, 50%)' },
      { name: 'yellow', value: '#ffff00', rgb: 'rgb(255, 255, 0)', hsl: 'hsl(60, 100%, 50%)' },
      { name: 'cyan', value: '#00ffff', rgb: 'rgb(0, 255, 255)', hsl: 'hsl(180, 100%, 50%)' },
      { name: 'magenta', value: '#ff00ff', rgb: 'rgb(255, 0, 255)', hsl: 'hsl(300, 100%, 50%)' },
      { name: 'black', value: '#000000', rgb: 'rgba(0, 0, 0)', hsl: 'hsl(0 0% 0%)' },
      { name: 'white', value: '#ffffff', rgb: 'rgb(255, 255, 255)', hsl: 'hsl(0 0% 100%)' },
    ]

    const invalidColors = ['asdf', '#ff000', '#ff00000', '#ff0000f', 'rgb()', 'rgb(0, 0, )']

    beforeEach(() => {
      formControlColor = document.createElement('input')
      formControlColor.type = 'color'
      formControlColor.id = 'test-input-color'
      formControlColor.name = 'test-input-color'
      form.appendChild(formControlColor)
      validator.init()
    })

    it('returns true if the input type was not matched to anything', () => {
      formControl.type = 'nothing'
      formControl.dataset.type = 'nothing'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeTruthy()
      expect(validator.inputErrors[formControl.name]).toEqual([])
    })

    it('should not replace the value for native date type', () => {
      formControl.type = 'date'
      formControl.value = '2019-01-01'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('2019-01-01')
      expect(validator.inputErrors[formControl.name]).toEqual([])
    })

    it('should replace the value for data-type=date', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'date'
      formControl.value = '2032-01-01'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('2032-Jan-01')
      expect(validator.inputErrors[formControl.name]).toEqual([])

      // test with a different date format
      formControl.dataset.dateFormat = 'MMMM D, YY'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('January 1, 32')
      expect(validator.inputErrors[formControl.name]).toEqual([])
    })

    it('should parse and validate number type correctly', () => {
      formControl.setAttribute('data-type', 'number')
      formControl.value = '12.5'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('12.5')
      expect(validator.inputErrors[formControl.name]).toEqual([])

      formControl.value = '-1asdf5'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('-15')
      expect(validator.inputErrors[formControl.name]).toEqual([])
    })

    it('should parse and validate integer type correctly', () => {
      formControl.type = 'text'
      formControl.setAttribute('data-type', 'integer')
      formControl.value = '1230098'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('1230098')
      expect(validator.inputErrors[formControl.name]).toEqual([])

      formControl.value = '123.098'
      valid = (validator as any).validateInputType(formControl)
      // Remove non-numeric characters
      expect(formControl.value).toBe('123098')
      expect(valid).toBeTruthy()

      // If the value contains no number it will not be parsed
      formControl.value = 'asdf'
      valid = (validator as any).validateInputType(formControl)
      // Remove non-numeric characters
      expect(formControl.value).toBe('asdf')
      expect(valid).toBeFalsy()
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_INTEGER)
    })

    it('should parse and validate tel type correctly', () => {
      formControl.type = 'tel'
      formControl.value = '923-456-7890'

      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('923-456-7890')
      expect(validator.inputErrors[formControl.name]).toEqual([])

      // Leading 1 should be removed
      formControl.value = '12345678900'

      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('234-567-8900')
      expect(validator.inputErrors[formControl.name]).toEqual([])

      // If a number isn't a phone number, it won't be parsed (other than removing a leading 1)
      formControl.value = '123456789'

      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeFalsy()
      expect(formControl.value).toBe('23456789')
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_TEL)
    })

    it('should parse and validate email type correctly', () => {
      formControl.type = 'email'
      formControl.dataset.type = 'email'
      formControl.value = 'email@example.com'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('email@example.com')

      formControl.value = 'email@example'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeFalsy()
      expect(formControl.value).toBe('email@example')
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_EMAIL)
    })

    // Test a bunch of valid but odd-looking email addresses
    emailAddresses.forEach((email) => {
      it(`should parse and validate the email "${email}" correctly`, () => {
        formControl.type = 'email'
        formControl.dataset.type = 'email'
        formControl.value = email

        valid = (validator as any).validateInputType(formControl)

        expect(valid).toBeTruthy()
        expect(formControl.value).toBe(email)
      })
    })

    invalidEmailAddresses.forEach((email) => {
      it(`should fail the string "${email}" as an invalid email address`, () => {
        formControl.type = 'email'
        formControl.dataset.type = 'email'
        formControl.value = email

        valid = (validator as any).validateInputType(formControl)

        expect(valid).toBeFalsy()
        expect(formControl.value).toBe(email)
        expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_EMAIL)
      })
    })

    it('should parse and validate postal type correctly', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'postal'
      formControl.value = 'T5Y3J5'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('T5Y 3J5')

      formControl.value = '1234'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeFalsy()
      expect(formControl.value).toBe('123 4')
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_POSTAL)
    })

    it('should parse and validate url type correctly, adding https:// if no protocol specified', () => {
      formControl.type = 'url'
      formControl.dataset.type = 'url'
      formControl.value = 'www.example.com/'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('https://www.example.com/')

      formControl.value = 'http://123example.com'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('http://123example.com')
    })

    it('should parse and validate dates', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'date'
      formControl.value = '2019-01-01'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('2019-Jan-01')

      formControl.value = '2019-01-32'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeFalsy()
      expect(formControl.value).toBe('2019-01-32')
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_DATE)
    })

    it('should parse and validate dates with a custom format', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'date'
      formControl.dataset.dateFormat = 'YYYY/MM/DD'
      formControl.value = '2019-Jan/13'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('2019/01/13')

      formControl.value = '2019/Jan/32'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeFalsy()
      expect(formControl.value).toBe('2019/Jan/32')
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_DATE)
    })

    it('should parse and validate times', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'time'
      formControl.value = '13:00'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('1:00 PM')

      formControl.value = 'now'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeTruthy()
      // Get the current time in the format I want to test against
      let now = new Date()
      let hours = now.getHours()
      let minutes = now.getMinutes()
      let ampm = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12
      hours = hours ? hours : 12 // the hour '0' should be '12'
      let strTime = hours + ':' + (minutes < 10 ? '0' + minutes : minutes) + ' ' + ampm

      expect(formControl.value).toBe(strTime)

      formControl.value = '25:00'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeFalsy()
      expect(formControl.value).toBe('25:00')
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_TIME)
    })

    // Test a bunch of valid times
    times.forEach((time) => {
      it(`should parse and validate the time "${time[0]}" correctly`, () => {
        formControl.type = 'text'
        formControl.dataset.type = 'time'
        formControl.value = time[0]

        valid = (validator as any).validateInputType(formControl)

        expect(valid).toBeTruthy()
        // I need a new array of the times in the format I want to test against
        expect(formControl.value).toBe(time[1])
      })
    })

    invalidTimes.forEach((time) => {
      it(`should fail the string "${time}" as an invalid time`, () => {
        formControl.type = 'text'
        formControl.dataset.type = 'time'
        formControl.value = time

        valid = (validator as any).validateInputType(formControl)

        expect(valid).toBeFalsy()
        expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_TIME)
      })
    })

    it('should parse and validate colors', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'color'
      formControl.value = '#123456'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('#123456')

      formControl.value = '#1234567'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeFalsy()
      expect(formControl.value).toBe('#1234567')
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_COLOR)

      formControl.value = 'transparent'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeTruthy()
    })

    // Test a bunch of valid but odd-looking colors
    colors.forEach((color) => {
      it(`should parse and validate the color "${color.name}" correctly`, () => {
        formControl.type = 'text'
        formControl.dataset.type = 'color'

        // We ignore black because we use a transparent color that isn't technically 'black'
        formControl.value = color.name
        valid = (validator as any).validateInputType(formControl)
        expect(valid).toBeTruthy()
        expect(formControl.value).toBe(color.name)

        // Trigger an input event and check the value of the associated color input
        formControl.dispatchEvent(new Event('input', { bubbles: true }))
        expect(formControlColor.value).toBe(color.value)

        formControl.value = color.rgb
        valid = (validator as any).validateInputType(formControl)
        expect(valid).toBeTruthy()
        expect(formControl.value).toBe(color.rgb)

        formControl.dispatchEvent(new Event('input', { bubbles: true }))
        expect(formControlColor.value).toBe(color.value)

        formControl.value = color.hsl
        valid = (validator as any).validateInputType(formControl)
        expect(valid).toBeTruthy()
        expect(formControl.value).toBe(color.hsl)

        formControl.dispatchEvent(new Event('input', { bubbles: true }))
        expect(formControlColor.value).toBe(color.value)

        formControl.value = color.value
        valid = (validator as any).validateInputType(formControl)
        expect(valid).toBeTruthy()
        expect(formControl.value).toBe(color.value)

        formControl.dispatchEvent(new Event('input', { bubbles: true }))
        expect(formControlColor.value).toBe(color.value)
      })
    })

    invalidColors.forEach((color) => {
      it(`should fail the string "${color}" as an invalid color`, () => {
        formControl.type = 'text'
        formControl.dataset.type = 'color'
        formControl.value = color

        valid = (validator as any).validateInputType(formControl)

        expect(valid).toBeFalsy()
        expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_COLOR)
      })
    })
  }) // end validateInputType

  describe('validateDateRange', () => {
    beforeEach(() => {
      formControl.type = 'text'
      formControl.name = 'test-date'
      formControl.id = 'test-date'
      formControl.dataset.type = 'date'
    })

    it('should return true if no date range specified', () => {
      formControl.value = '2022-01-01'
      expect((validator as any).validateDateRange(formControl)).toBe(true)
    })

    it('should add an error message and return false if the date is not in the past', () => {
      formControl.dataset.dateRange = 'past'
      formControl.value = '2093-01-01'
      expect((validator as any).validateDateRange(formControl)).toBe(false)
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_DATE_PAST)
    })

    it('should add an error message and return false if the date is not in the future', () => {
      formControl.dataset.dateRange = 'future'
      formControl.value = '2003-01-01'
      expect((validator as any).validateDateRange(formControl)).toBe(false)
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_DATE_FUTURE
      )
    })

    it('should return true if the date is in the past', () => {
      formControl.dataset.dateRange = 'past'
      formControl.value = '2003-01-01'
      expect((validator as any).validateDateRange(formControl)).toBe(true)
    })

    it('should return true if the date is in the future', () => {
      formControl.dataset.dateRange = 'future'
      formControl.value = '2093-01-01'
      expect((validator as any).validateDateRange(formControl)).toBe(true)
    })
  }) // end validateDateRange

  describe('validatePattern', () => {
    it('should return true if no pattern specified', () => {
      formControl.value = 'test'
      expect((validator as any).validatePattern(formControl)).toBe(true)
    })

    it('should return true if the pattern matches', () => {
      formControl.dataset.pattern = '^[a-z]+$'
      formControl.value = 'test'
      expect((validator as any).validatePattern(formControl)).toBe(true)
    })

    it('should add an error message and return false if the pattern does not match', () => {
      formControl.dataset.pattern = '^[a-z]+$'
      formControl.value = 'test123'
      expect((validator as any).validatePattern(formControl)).toBe(false)
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_GENERIC)
    })
  }) // end validatePattern

  describe('normalizeValidationResult', () => {
    it('should return valid=true and messages=[] when input is true', () => {
      const result = utils.normalizeValidationResult(true)
      expect(result.valid).toBe(true)
      expect(result.error).toBe(false)
      expect(result.messages).toEqual([])
    })

    it('should return valid=false and messages=[input message] when input is an object with message', () => {
      const input = { valid: false, message: 'error' }
      const result = utils.normalizeValidationResult(input)
      expect(result.valid).toBe(false)
      expect(result.error).toBe(false)
      expect(result.messages).toEqual(['error'])
    })

    it('should return valid=false and messages=[input messages] when input is an object with messages', () => {
      const input = { valid: false, messages: ['error 1', 'error 2'] }
      const result = utils.normalizeValidationResult(input)
      expect(result.valid).toBe(false)
      expect(result.error).toBe(false)
      expect(result.messages).toEqual(['error 1', 'error 2'])
    })

    it('should return valid=false and messages=[] when input is an object with messages as a string', () => {
      const input = { valid: false, messages: 'error' }
      const result = utils.normalizeValidationResult(input)
      expect(result.valid).toBe(false)
      expect(result.error).toBe(false)
      expect(result.messages).toEqual(['error'])
    })

    it('should return valid=false and error=true when input is an object with error=true', () => {
      const input = { valid: false, error: true }
      const result = utils.normalizeValidationResult(input)
      expect(result.valid).toBe(false)
      expect(result.error).toBe(true)
      expect(result.messages).toEqual([])
    })
  }) // end normalizeValidationResult

  // Next we test validateCustom. This will be a bit more involved as we need to test a variety of
  // different functions including some that return promises and others that do not.
  // We will also test the case where the function returns a validation result object and the case
  // where it returns a boolean.
  describe('validateCustom', () => {
    let validationFnTrue = vi.fn(() => true)
    let validationFnFalse = vi.fn(() => false)
    let validationFn = vi.fn(() => true)
    window['validationFnTrue'] = validationFnTrue
    window['validationFnFalse'] = validationFnFalse
    window['validation'] = validationFn

    it('returns true if no validation is specified', async () => {
      const result = await (validator as any).validateCustom(formControl)
      expect(result).toBe(true)
    })

    it('returns true if validation is true boolean', async () => {
      formControl.dataset.validation = 'validationFnTrue'
      const result = await (validator as any).validateCustom(formControl)
      expect(result).toBe(true)
    })

    it('returns true if validation function is not found', async () => {
      formControl.dataset.validation = 'invalid'
      const result = await (validator as any).validateCustom(formControl)
      expect(result).toBe(true)
    })

    it('returns false if validation function returns false', async () => {
      window['validationFnFalse'] = validationFnFalse
      formControl.dataset.validation = 'validationFnFalse'
      const result = await (validator as any).validateCustom(formControl)
      expect(result).toBe(false)
    })

    it('returns true if promise resolves to object with valid:true', async () => {
      function validationPromiseFn() {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve({ valid: true, messages: ['success'], error: false })
          }, 100)
        })
      }

      window['validationPromiseFn'] = validationPromiseFn
      formControl.dataset.validation = 'validationPromiseFn'
      formControl.value = 'test'

      const result = await (validator as any).validateCustom(formControl)
      expect(result).toBe(true)
    })

    it('returns false if promise resolves to object with valid:false', async () => {
      function validationPromiseFn(arg: any) {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve({ valid: false, messages: ['error message'] })
          }, 100)
        })
      }

      window['validationPromiseFn'] = validationPromiseFn
      formControl.dataset.validation = 'validationPromiseFn'
      formControl.value = 'test'
      const result = await (validator as any).validateCustom(formControl)
      expect(result).toBe(false)
      expect(validator.inputErrors[formControl.name]).toContain('error message')
    })
  }) // end validateCustom

  describe('validateInput', () => {
    it('returns true for empty input elements', async () => {
      expect(await (validator as any).validateInput(formControl)).toBe(true)
    })

    it('returns true if there is a length and all validation functions return true', async () => {
      formControl.value = 'test'
      const spy1 = vi.spyOn(validator as any, 'validateInputType').mockImplementation(() => true)
      const spy2 = vi.spyOn(validator as any, 'validateDateRange').mockImplementation(() => true)
      const spy3 = vi.spyOn(validator as any, 'validatePattern').mockImplementation(() => true)
      const spy4 = vi
        .spyOn(validator as any, 'validateCustom')
        .mockImplementation(() => Promise.resolve(true))

      expect(await (validator as any).validateInput(formControl)).toBe(true)
    })

    it('returns false if there is a length and any validation function returns false', async () => {
      formControl.value = 'test'
      const spy1 = vi.spyOn(validator as any, 'validateInputType').mockImplementation(() => false)
      const spy2 = vi.spyOn(validator as any, 'validateDateRange').mockImplementation(() => true)
      const spy3 = vi.spyOn(validator as any, 'validatePattern').mockImplementation(() => true)
      const spy4 = vi
        .spyOn(validator as any, 'validateCustom')
        .mockImplementation(() => Promise.resolve(true))

      expect(await (validator as any).validateInput(formControl)).toBe(false)
    })

    it('returns false if there is a length and all validation functions return false', async () => {
      formControl.value = 'test'
      const spy1 = vi.spyOn(validator as any, 'validateInputType').mockImplementation(() => false)
      const spy2 = vi.spyOn(validator as any, 'validateDateRange').mockImplementation(() => false)
      const spy3 = vi.spyOn(validator as any, 'validatePattern').mockImplementation(() => false)
      const spy4 = vi
        .spyOn(validator as any, 'validateCustom')
        .mockImplementation(() => Promise.resolve(false))

      expect(await (validator as any).validateInput(formControl)).toBe(false)
    })
  }) // end validateInput

  describe('validate', () => {
    it('returns false if validateRequired returns false', async () => {
      vi.spyOn(validator as any, 'validateRequired').mockImplementation(() => false)
      vi.spyOn(validator as any, 'validateLength').mockImplementation(() => true)
      vi.spyOn(validator as any, 'validateInput').mockImplementation(() => Promise.resolve(true))

      expect(await validator.validate(new Event(''))).toBe(false)
    })

    it('returns false if validateLength returns false', async () => {
      vi.spyOn(validator as any, 'validateRequired').mockImplementation(() => true)
      vi.spyOn(validator as any, 'validateLength').mockImplementation(() => false)
      vi.spyOn(validator as any, 'validateInput').mockImplementation(() => Promise.resolve(true))

      expect(await validator.validate(new Event(''))).toBe(false)
    })

    it('returns false if validateInput returns false', async () => {
      vi.spyOn(validator as any, 'validateRequired').mockImplementation(() => true)
      vi.spyOn(validator as any, 'validateLength').mockImplementation(() => true)
      vi.spyOn(validator as any, 'validateInput').mockImplementation(() => Promise.resolve(false))

      expect(await validator.validate(new Event(''))).toBe(false)
    })

    it('returns true if all validation functions return true', async () => {
      vi.spyOn(validator as any, 'validateRequired').mockImplementation(() => true)
      vi.spyOn(validator as any, 'validateLength').mockImplementation(() => true)
      vi.spyOn(validator as any, 'validateInput').mockImplementation(() => Promise.resolve(true))

      expect(await validator.validate(new Event(''))).toBe(true)
    })
  }) // end validate

  describe('submitHandler', () => {
    it('prevents form submission if the form is already submitting', () => {
      ;(validator as any).isSubmitting = true
      vi.spyOn(form, 'submit').mockImplementation(() => {})
      ;(validator as any).isSubmitting = false
      ;(validator as any).submitHandler(new Event('submit'))
      expect(form.submit).not.toHaveBeenCalled()
    })

    it('calls clearFormErrors method before validation', () => {
      vi.spyOn(validator as any, 'clearFormErrors')
      vi.spyOn(form, 'submit').mockImplementation(() => {})
      ;(validator as any).submitHandler(new Event('submit'))
      expect((validator as any).clearFormErrors).toHaveBeenCalled()
    })

    it('calls showFormErrors method after validation', async () => {
      vi.spyOn(validator as any, 'showFormErrors')
      vi.spyOn(validator, 'validate').mockImplementation(() => Promise.resolve(false))
      await (validator as any).submitHandler(new Event('submit'))
      expect((validator as any).showFormErrors).toHaveBeenCalled()
    })

    it('dispatches ValidationSuccessEvent if form is valid', async () => {
      vi.spyOn(form, 'dispatchEvent')
      vi.spyOn(form, 'submit').mockImplementation(() => {})
      vi.spyOn(validator, 'validate').mockImplementation(() => Promise.resolve(true))
      await (validator as any).submitHandler(new Event('submit'))
      expect(form.dispatchEvent).toHaveBeenCalledWith(expect.any(ValidationSuccessEvent))
    })

    it('dispatches ValidationErrorEvent if form is invalid', async () => {
      vi.spyOn(form, 'dispatchEvent')
      vi.spyOn(validator, 'validate').mockImplementation(() => Promise.resolve(false))
      await (validator as any).submitHandler(new Event('submit'))
      expect(form.dispatchEvent).toHaveBeenCalledWith(expect.any(ValidationErrorEvent))
    })

    it('calls validationSuccessCallback if form is valid and no default is prevented', async () => {
      const validationSuccessCallback = vi.fn()
      vi.spyOn(form, 'submit').mockImplementation(() => {})
      ;(validator as any).validationSuccessCallback = validationSuccessCallback
      vi.spyOn(validator, 'validate').mockImplementation(() => Promise.resolve(true))
      await (validator as any).submitHandler(new Event('submit'))
      expect(validationSuccessCallback).toHaveBeenCalled()
    })

    it('calls validationErrorCallback if form is invalid and no default is prevented', async () => {
      const validationErrorCallback = vi.fn()
      ;(validator as any).validationErrorCallback = validationErrorCallback
      vi.spyOn(validator, 'validate').mockImplementation(() => Promise.resolve(false))
      await (validator as any).submitHandler(new Event('submit'))
      expect(validationErrorCallback).toHaveBeenCalled()
    })

    // If this.preventSubmit is true, the form will not be submitted
    it('does not submit the form if preventSubmit is true even when validation is successful', () => {
      validator.preventSubmit = true
      vi.spyOn(validator, 'validate').mockImplementation(() => Promise.resolve(true))
      vi.spyOn(form, 'submit').mockImplementation(() => {})
      ;(validator as any).submitHandler(new Event('submit'))
      expect(form.submit).not.toHaveBeenCalled()
    })
  })
})
