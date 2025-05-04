import Validator, { ValidationErrorEvent, ValidationSuccessEvent } from '../src/Validator'
import { parseColor } from '@jdlien/validator-utils'
import MainValidator from '..'
import { ValidatorOptions } from '../src/Validator'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Validator', () => {
  let form: HTMLFormElement
  let formControl: HTMLInputElement
  let errorEl: HTMLDivElement
  let options: ValidatorOptions
  let validator: Validator
  let valid: boolean

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

    it('overrides the preventSubmit property if set to false in the options argument', () => {
      form.dataset.preventSubmit = ''
      options.preventSubmit = false
      const validator = new Validator(form, options)
      expect(validator.preventSubmit).toBeFalsy()
    })

    it('overrides the preventSubmit property if set to true in the options argument', () => {
      form.dataset.preventSubmit = ''
      options.preventSubmit = true
      const validator = new Validator(form, options)
      expect(validator.preventSubmit).toBeTruthy()
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

    it('sets the showMainError property to the value in the options argument', () => {
      options.showMainError = false
      const validator = new Validator(form, options)
      expect(validator.showMainError).toBe(false)
    })

    it('defaults showMainError to true when not specified in options', () => {
      delete options.showMainError
      const validator = new Validator(form, options)
      expect(validator.showMainError).toBe(true)
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
      await new Promise((resolve) => setTimeout(resolve, 50))

      if (!form.lastChild) throw new Error('lastChild is null')

      expect(validator.inputs.length).toEqual(inputCount + 1)
      form.removeChild(form.lastChild)
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
  }) // Validator observer

  // describe('init') moved to Validator.init.test.ts

  // Error handling moved to Validator.error.test.ts

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

      // We show the required error message if one isn't provided
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_REQUIRED)
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

    it('uses the errorDefault attribute as the error message for required group error if set', () => {
      radio1.required = true
      radio2.required = true
      const errorMessage = 'This is a custom error message'
      radio1.setAttribute('data-error-default', errorMessage)
      radio2.setAttribute('data-error-default', errorMessage)

      const result = (validator as any).validateRequired(radio1)
      const result2 = (validator as any).validateRequired(radio2)
      expect(result).toBeFalsy()
      expect(result2).toBeFalsy()

      expect(validator.inputErrors[radio1.name]).toContain(errorMessage)
      // Check that the message was not duplicated
      expect(validator.inputErrors[radio1.name].length).toBe(1)
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

    it('validates min/max length for a textarea', () => {
      const textarea = document.createElement('textarea')
      textarea.name = 'textarea'
      textarea.value = 'this is ok'
      textarea.setAttribute('data-min-length', '3')
      textarea.setAttribute('data-max-length', '10')
      form.appendChild(textarea)
      validator.init()

      const result = (validator as any).validateLength(textarea)
      expect(result).toBeTruthy()
      expect(validator.inputErrors[textarea.name]).toEqual([])

      textarea.value = 'as'
      const result2 = (validator as any).validateLength(textarea)
      expect(result2).toBeFalsy()
      expect(validator.inputErrors[textarea.name]).toContain(
        validator.messages.ERROR_MINLENGTH.replace('${val}', '3')
      )

      textarea.value = 'this is too long of a string'
      const result3 = (validator as any).validateLength(textarea)
      expect(result3).toBeFalsy()
      expect(validator.inputErrors[textarea.name]).toContain(
        validator.messages.ERROR_MAXLENGTH.replace('${val}', '10')
      )
    })

    it('does not validate min/max length for a disabled input', () => {
      formControl.value = 'test'
      formControl.setAttribute('data-min-length', '3')
      formControl.setAttribute('data-max-length', '3')
      formControl.disabled = true

      const result = (validator as any).validateLength(formControl)
      expect(result).toBeTruthy()
      expect(validator.inputErrors[formControl.name]).toEqual([])
    })
  }) // end validate Min/Max Length

  // validateInputType base and validateInputType moved to Validator.validateInputType.test.ts

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

    it('adds an error message if error is caught', async () => {
      function validationFnReject(arg: any) {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('error message'))
          })
        })
      }

      window['validationFnReject'] = validationFnReject
      formControl.dataset.validation = 'validationFnReject'
      formControl.value = 'test'

      const result = await (validator as any).validateCustom(formControl)
      expect(result).toBe(false)
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_CUSTOM_VALIDATION
      )
    })

    it('returns true if input is disabled', async () => {
      formControl.disabled = true
      window['validationFnFalse'] = validationFnFalse
      formControl.dataset.validation = 'validationFnFalse'
      const result = await (validator as any).validateCustom(formControl)
      expect(result).toBe(true)
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

    it('returns true if input is disabled', async () => {
      formControl.disabled = true
      formControl.value = 'test'

      const spy1 = vi.spyOn(validator as any, 'validateInputType').mockImplementation(() => false)
      const spy2 = vi.spyOn(validator as any, 'validateDateRange').mockImplementation(() => false)
      const spy3 = vi.spyOn(validator as any, 'validatePattern').mockImplementation(() => false)
      const spy4 = vi
        .spyOn(validator as any, 'validateCustom')
        .mockImplementation(() => Promise.resolve(false))

      expect(await (validator as any).validateInput(formControl)).toBe(true)
    })
  }) // end validateInput

  describe('validate', () => {
    it('returns true if input is disabled, even if validation would otherwise fail', async () => {
      formControl.required = true
      formControl.value = ''
      formControl.disabled = true
      expect(await validator.validate(new Event(''))).toBe(true)
    })

    it('validation fails for same field when required and empty but not disabled', async () => {
      formControl.required = true
      formControl.value = ''
      formControl.disabled = false
      expect(await validator.validate(new Event(''))).toBe(false)
    })

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

    it('returns false with custom validation even if input is empty and not required', async () => {
      window['validationFnFalse'] = vi.fn(() => false)
      formControl.value = ''
      formControl.dataset.validation = 'validationFnFalse'
      const result = await (validator as any).validate(formControl)
      expect(result).toBe(false)
    })
  }) // end validate

  describe('submitHandler', () => {
    it('returns if isSubmitting is true', () => {
      ;(validator as any).isSubmitting = true
      vi.spyOn(form, 'submit').mockImplementation(() => {})
      ;(validator as any).submitHandler(new Event('submit'))
      expect(form.submit).not.toHaveBeenCalled()
    })

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
  }) // end submitHandler

  describe('inputChangeHandler', () => {
    it('returns if event target is not an input element', () => {
      const event = new Event('change', { bubbles: true })
      Object.defineProperty(event, 'target', { value: form })
      vi.spyOn(validator as any, 'validateInput').mockImplementation(() => Promise.resolve())
      ;(validator as any).inputChangeHandler(event)
      expect((validator as any).validateInput).not.toHaveBeenCalled()
    })

    it('validates the input element when it changes', async () => {
      vi.spyOn(validator as any, 'validateInput').mockImplementation(() => Promise.resolve())
      const event = new Event('change', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })
      formControl.dispatchEvent(event)

      expect((validator as any).validateInput).toHaveBeenCalledWith(formControl)
    })

    it('does not validate the input element when it changes if data-novalidate is set', async () => {
      vi.spyOn(validator as any, 'validateInput').mockImplementation(() => Promise.resolve())
      formControl.dataset.novalidate = 'true'
      const event = new Event('change', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })
      formControl.dispatchEvent(event)

      expect((validator as any).validateInput).not.toHaveBeenCalledWith(formControl)

      formControl.dataset.novalidate = ''
      formControl.dispatchEvent(event)
      expect((validator as any).validateInput).not.toHaveBeenCalledWith(formControl)
    })

    // rewrite the above test but for the input event
    it('does not validate the input element on input if data-novalidate is set', async () => {
      vi.spyOn(validator as any, 'validateInput').mockImplementation(() => Promise.resolve())
      formControl.dataset.novalidate = 'true'
      const event = new Event('input', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })
      formControl.dispatchEvent(event)

      expect((validator as any).validateInput).not.toHaveBeenCalledWith(formControl)

      formControl.dataset.novalidate = ''
      formControl.dispatchEvent(event)
      expect((validator as any).validateInput).not.toHaveBeenCalledWith(formControl)
    })

    it('clears the error messages for the input element', async () => {
      vi.spyOn(validator as any, 'clearInputErrors')
      const event = new Event('change', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })
      await formControl.dispatchEvent(event)
      expect((validator as any).clearInputErrors).toHaveBeenCalledWith(formControl)
    })

    it('shows the error messages for the input element', async () => {
      vi.spyOn(validator as any, 'showInputErrors')
      const event = new Event('change', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })
      await formControl.dispatchEvent(event)
      expect((validator as any).showInputErrors).toHaveBeenCalledWith(formControl)
    })

    it('validates min and max length on input elements', async () => {
      formControl.dataset.minLength = '2'
      formControl.dataset.maxLength = '4'
      formControl.value = '123'

      vi.spyOn(validator as any, 'validateLength')
      const event = new Event('change', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })
      await formControl.dispatchEvent(event)
      expect((validator as any).validateLength).toHaveBeenCalledWith(formControl)
    })
  }) // end inputChangeHandler

  describe('inputInputHandler', () => {
    it('should parse integer input values', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'integer'
      formControl.value = '123.45'

      const event = new Event('input', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })

      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('12345')

      formControl.value = '123,45'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('12345')

      formControl.value = '-12345'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('12345')
    })

    it('should parse non-native number input values', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'number'

      const event = new Event('input', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })

      formControl.value = '123.45'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('123.45')

      formControl.value = '123,45'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('12345')

      formControl.value = '-12345'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('-12345')

      formControl.value = '-12345a'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('-12345')
    })

    it('should not parse native number input values', () => {
      formControl.type = 'number'

      const event = new Event('input', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })

      formControl.value = '123.45'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('123.45')

      // This value won't be allowed and will be blanked out
      formControl.value = '123,45'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('')

      formControl.value = '-123.4'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('-123.4')
    })

    it('should call syncColorInput for color inputs', () => {
      const syncColorInputSpy = vi.spyOn(validator as any, 'syncColorInput')
      formControl.type = 'color'
      const event = new Event('input', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })

      formControl.dispatchEvent(event)
      expect(syncColorInputSpy).toHaveBeenCalledWith(expect.any(Event))

      formControl.type = 'text'
      formControl.dataset.type = 'color'
      formControl.dispatchEvent(event)
      expect(syncColorInputSpy).toHaveBeenCalledWith(expect.any(Event))
    })
  }) // end inputInputHandler

  describe('syncColorInput', () => {
    let colorInput: HTMLInputElement
    let colorPicker: HTMLInputElement
    let colorLabel: HTMLLabelElement

    beforeEach(() => {
      colorInput = document.createElement('input')
      colorInput.type = 'text'
      colorInput.id = 'test-color'
      colorInput.value = '#ff0000'
      colorInput.dataset.type = 'color'
      form.appendChild(colorInput)

      colorPicker = document.createElement('input')
      colorPicker.type = 'color'
      colorPicker.id = 'test-color-color'
      colorPicker.value = '#ff0000'
      form.appendChild(colorPicker)

      colorLabel = document.createElement('label')
      colorLabel.htmlFor = 'test-color-color'
      colorLabel.id = 'test-color-color-label'
      form.appendChild(colorLabel)

      validator.init()
    })

    it('should update the HTML color picker input and its label background when color input changes', () => {
      const event = new Event('input', { bubbles: true })
      Object.defineProperty(event, 'target', { value: colorInput })
      const colorLbl = form.querySelector(`#${colorInput.id}-color-label`)

      colorInput.value = '#00ff00'
      colorInput.dispatchEvent(event)
      // validator.syncColorInput(event)

      expect(colorPicker.value).toEqual('#00ff00')

      const color = parseColor(window.getComputedStyle(colorLabel).backgroundColor)

      expect(color).toEqual('#00ff00')
    })

    it('should update the color input and label background when the HTML color picker is changed', () => {
      const event = new Event('input', { bubbles: true })
      Object.defineProperty(event, 'target', { value: colorPicker })

      colorPicker.value = '#0000ff'
      ;(validator as any).syncColorInput(event)

      expect(colorInput.value).toEqual('#0000ff')
      expect(parseColor(colorLabel.style.backgroundColor)).toEqual('#0000ff')
    })

    it('should not update the HTML color picker if the color input value is not a valid color', () => {
      const event = new Event('input', { bubbles: true })
      Object.defineProperty(event, 'target', { value: colorInput })

      colorInput.value = 'not-a-color'
      ;(validator as any).syncColorInput(event)

      expect(colorPicker.value).toEqual('#ff0000')
    })

    it('should debounce change events by clearing and setting a timeout', () => {
      // Mock timers to test debouncing
      vi.useFakeTimers()

      // Setup spies
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
      const setTimeoutSpy = vi.spyOn(window, 'setTimeout')
      const dispatchEventSpy = vi.spyOn(colorInput, 'dispatchEvent')

      // First input event
      const event1 = new Event('input', { bubbles: true })
      Object.defineProperty(event1, 'target', { value: colorInput })
      colorInput.value = '#ff00ff'
      ;(validator as any).syncColorInput(event1)

      // Verify first call
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1)
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(1)

      // Second input event shortly after
      const event2 = new Event('input', { bubbles: true })
      Object.defineProperty(event2, 'target', { value: colorInput })
      colorInput.value = '#00ffff'
      ;(validator as any).syncColorInput(event2)

      // Should clear the previous timeout and set a new one
      expect(setTimeoutSpy).toHaveBeenCalledTimes(2)
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2)
      expect(dispatchEventSpy).not.toHaveBeenCalled()

      // Fast-forward time to trigger the timeout
      vi.runAllTimers()

      // Now the change event should have been dispatched once
      expect(dispatchEventSpy).toHaveBeenCalledTimes(1)
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'change',
          bubbles: true,
        })
      )

      // Restore timers
      vi.useRealTimers()
    })
  }) // end syncColorInput

  describe('inputKeydownHandler', () => {
    let event: Event

    beforeEach(() => {
      formControl.type = 'text'
      formControl.dataset.type = 'integer'

      event = new Event('keydown', { bubbles: true })
    })

    it('should return if the event target is not an input element', () => {
      Object.defineProperty(event, 'target', { value: form })
      ;(validator as any).inputKeydownHandler(event)
      expect(formControl.value).toEqual('')
    })

    it('should increment integer input value when ArrowUp key is pressed', () => {
      Object.defineProperty(event, 'target', { value: formControl })
      Object.defineProperty(event, 'key', { value: 'ArrowUp' })

      formControl.value = '5'
      ;(validator as any).inputKeydownHandler(event)
      expect(formControl.value).toEqual('6')

      Object.defineProperty(event, 'target', { value: formControl })
      Object.defineProperty(event, 'key', { value: 'ArrowUp' })

      formControl.value = ''
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('1')
    })

    it('should decrement integer input value when ArrowDown key is pressed', () => {
      Object.defineProperty(event, 'target', { value: formControl })
      Object.defineProperty(event, 'key', { value: 'ArrowDown' })

      formControl.value = '5'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('4')

      // Test that it doesn't go below 0
      formControl.value = '0'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('0')

      formControl.value = ''
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('0')
    })

    it('should not increment or decrement non-integer inputs on ArrowUp', () => {
      Object.defineProperty(event, 'target', { value: formControl })
      Object.defineProperty(event, 'key', { value: 'ArrowUp' })
      formControl.dataset.type = 'text'
      formControl.value = '1'

      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('1')
    })

    it('should not increment or decrement non-integer inputs on ArrowDown', () => {
      Object.defineProperty(event, 'target', { value: formControl })
      Object.defineProperty(event, 'key', { value: 'ArrowDown' })
      formControl.dataset.type = 'text'
      formControl.value = '1'

      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('1')
    })
  }) // end inputKeydownHandler

  describe('ValidationSuccessEvent', () => {
    let submitEvent: Event
    let validationSuccessEvent: ValidationSuccessEvent

    beforeEach(() => {
      submitEvent = new Event('submit')
      validationSuccessEvent = new ValidationSuccessEvent(submitEvent)
    })

    it('should create a new ValidationSuccessEvent', () => {
      expect(validationSuccessEvent instanceof ValidationSuccessEvent).toBe(true)
    })

    it('should set the event type to validationSuccess', () => {
      expect(validationSuccessEvent.type).toEqual('validationSuccess')
    })

    it('should set the submitEvent property to the provided submit event', () => {
      expect(validationSuccessEvent.submitEvent).toEqual(submitEvent)
    })
  }) // end ValidationSuccessEvent

  describe('ValidationEvents', () => {
    let submitEvent: Event
    let validationErrorEvent: ValidationErrorEvent

    beforeEach(() => {
      submitEvent = new Event('submit')
      validationErrorEvent = new ValidationErrorEvent(submitEvent)
    })

    it('should create a new ValidationErrorEvent', () => {
      expect(validationErrorEvent instanceof ValidationErrorEvent).toBe(true)
    })

    it('should set the event type to validationError', () => {
      expect(validationErrorEvent.type).toEqual('validationError')
    })

    it('should set the submitEvent property to the provided submit event', () => {
      expect(validationErrorEvent.submitEvent).toEqual(submitEvent)
    })
  }) // end ValidationEvents

  // describe('destroy') moved to Validator.destroy.test.ts

  describe('index.ts', () => {
    it('should export Validator class as default export', () => {
      expect(MainValidator).toBeDefined()
      expect(MainValidator).toBe(Validator)
    })

    it('should be a constructor function', () => {
      expect(typeof MainValidator).toBe('function')
      expect(new MainValidator(document.createElement('form'))).toBeInstanceOf(Validator)
    })
  })
})
