import Validator from '../src/Validator'
import { ValidatorOptions } from '../src/Validator'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setupTestForm } from './utils/setup'

describe('Validator', () => {
  let form: HTMLFormElement
  let formControl: HTMLInputElement
  let errorEl: HTMLDivElement
  let options: ValidatorOptions
  let validator: Validator

  beforeEach(() => {
    ;({ form, formControl, errorEl, options, validator } = setupTestForm())
  })

  afterEach(() => {
    validator.destroy()
    document.body.removeChild(form)
  })

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
}) // end describe('Validator')
