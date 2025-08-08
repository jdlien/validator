import Validator from '../src/Validator'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setupTestForm } from './utils/setup'

describe('Validator', () => {
  let form: HTMLFormElement
  let formControl: HTMLInputElement
  let errorEl: HTMLDivElement
  let validator: Validator

  beforeEach(() => {
    ;({ form, formControl, errorEl, validator } = setupTestForm())
  })

  afterEach(() => {
    validator.destroy()
    document.body.removeChild(form)
  })

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
}) // end describe('Validator')
