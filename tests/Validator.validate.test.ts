import Validator from '../src/Validator'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setupTestForm } from './utils/setup'

describe('Validator', () => {
  let form: HTMLFormElement
  let formControl: HTMLInputElement
  let validator: Validator

  beforeEach(() => {
    ;({ form, formControl, validator } = setupTestForm())
  })

  afterEach(() => {
    validator.destroy()
    document.body.removeChild(form)
  })

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
})
