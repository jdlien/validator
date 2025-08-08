import Validator from '../src/Validator'
import { ValidatorOptions } from '../src/Validator'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setupTestForm } from './utils/setup'

describe('Validator', () => {
  let form: HTMLFormElement
  let options: ValidatorOptions
  let validator: Validator

  beforeEach(() => {
    ;({ form, options, validator } = setupTestForm())
  })

  afterEach(() => {
    validator.destroy()
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
}) // end describe('Validator')
