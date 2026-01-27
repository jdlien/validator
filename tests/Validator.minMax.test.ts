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

  describe('validate Min/Max Value', () => {
    it('returns true if value is within min/max range', () => {
      formControl.type = 'number'
      formControl.value = '50'
      formControl.setAttribute('data-min', '10')
      formControl.setAttribute('data-max', '100')

      const result = (validator as any).validateValue(formControl)
      expect(result).toBeTruthy()
      expect(validator.inputErrors[formControl.name]).toEqual([])
    })

    it('returns true if value equals min', () => {
      formControl.type = 'number'
      formControl.value = '10'
      formControl.setAttribute('data-min', '10')

      const result = (validator as any).validateValue(formControl)
      expect(result).toBeTruthy()
      expect(validator.inputErrors[formControl.name]).toEqual([])
    })

    it('returns true if value equals max', () => {
      formControl.type = 'number'
      formControl.value = '100'
      formControl.setAttribute('data-max', '100')

      const result = (validator as any).validateValue(formControl)
      expect(result).toBeTruthy()
      expect(validator.inputErrors[formControl.name]).toEqual([])
    })

    it('returns false if value is below min', () => {
      formControl.type = 'number'
      formControl.value = '5'
      formControl.setAttribute('data-min', '10')

      const result = (validator as any).validateValue(formControl)
      expect(result).toBeFalsy()
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_MIN_VALUE.replace('${val}', '10')
      )
    })

    it('returns false if value is above max', () => {
      formControl.type = 'number'
      formControl.value = '150'
      formControl.setAttribute('data-max', '100')

      const result = (validator as any).validateValue(formControl)
      expect(result).toBeFalsy()
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_MAX_VALUE.replace('${val}', '100')
      )
    })

    it('works with native min/max attributes', () => {
      formControl.type = 'number'
      formControl.value = '5'
      formControl.min = '10'
      formControl.max = '100'

      const result = (validator as any).validateValue(formControl)
      expect(result).toBeFalsy()
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_MIN_VALUE.replace('${val}', '10')
      )
    })

    it('data-min/max takes precedence over native attributes', () => {
      formControl.type = 'number'
      formControl.value = '5'
      formControl.min = '1' // native
      formControl.setAttribute('data-min', '10') // data attribute takes precedence

      const result = (validator as any).validateValue(formControl)
      expect(result).toBeFalsy()
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_MIN_VALUE.replace('${val}', '10')
      )
    })

    it('validates data-type="integer" inputs', () => {
      formControl.setAttribute('data-type', 'integer')
      formControl.value = '5'
      formControl.setAttribute('data-min', '10')

      const result = (validator as any).validateValue(formControl)
      expect(result).toBeFalsy()
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_MIN_VALUE.replace('${val}', '10')
      )
    })

    it('validates data-type="float" inputs', () => {
      formControl.setAttribute('data-type', 'float')
      formControl.value = '5.5'
      formControl.setAttribute('data-min', '10.5')

      const result = (validator as any).validateValue(formControl)
      expect(result).toBeFalsy()
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_MIN_VALUE.replace('${val}', '10.5')
      )
    })

    it('validates data-type="decimal" inputs', () => {
      formControl.setAttribute('data-type', 'decimal')
      formControl.value = '99.99'
      formControl.setAttribute('data-max', '50')

      const result = (validator as any).validateValue(formControl)
      expect(result).toBeFalsy()
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_MAX_VALUE.replace('${val}', '50')
      )
    })

    it('skips validation for non-numeric types', () => {
      formControl.type = 'text'
      formControl.value = '5'
      formControl.setAttribute('data-min', '10')

      const result = (validator as any).validateValue(formControl)
      expect(result).toBeTruthy()
      expect(validator.inputErrors[formControl.name]).toEqual([])
    })

    it('skips validation for empty values', () => {
      formControl.type = 'number'
      formControl.value = ''
      formControl.setAttribute('data-min', '10')

      const result = (validator as any).validateValue(formControl)
      expect(result).toBeTruthy()
      expect(validator.inputErrors[formControl.name]).toEqual([])
    })

    it('skips validation for disabled inputs', () => {
      formControl.type = 'number'
      formControl.value = '5'
      formControl.setAttribute('data-min', '10')
      formControl.disabled = true

      const result = (validator as any).validateValue(formControl)
      expect(result).toBeTruthy()
      expect(validator.inputErrors[formControl.name]).toEqual([])
    })

    it('supports negative min/max values', () => {
      formControl.type = 'number'
      formControl.value = '-15'
      formControl.setAttribute('data-min', '-10')
      formControl.setAttribute('data-max', '10')

      const result = (validator as any).validateValue(formControl)
      expect(result).toBeFalsy()
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_MIN_VALUE.replace('${val}', '-10')
      )
    })

    it('can report both min and max errors', () => {
      formControl.type = 'number'
      formControl.value = '0'
      formControl.setAttribute('data-min', '10')
      formControl.setAttribute('data-max', '-10') // Invalid range but should still report

      const result = (validator as any).validateValue(formControl)
      expect(result).toBeFalsy()
      // Value 0 is below min 10, so min error is shown
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_MIN_VALUE.replace('${val}', '10')
      )
    })

    it('integrates with form validation', async () => {
      formControl.type = 'number'
      formControl.value = '5'
      formControl.setAttribute('data-min', '10')
      formControl.required = true
      validator.init()

      const result = await validator.validate()
      expect(result).toBeFalsy()
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_MIN_VALUE.replace('${val}', '10')
      )
    })

    it('returns true and skips validation when value is non-numeric', () => {
      // Type validation should handle non-numeric values, not min/max validation
      formControl.type = 'text'
      formControl.setAttribute('data-type', 'number')
      formControl.value = 'abc'
      formControl.setAttribute('data-min', '10')
      formControl.setAttribute('data-max', '100')

      const result = (validator as any).validateValue(formControl)
      expect(result).toBeTruthy()
      // No min/max errors should be added since value isn't a valid number
      expect(validator.inputErrors[formControl.name]).toEqual([])
    })
  }) // end validate Min/Max Value
}) // end describe('Validator')
