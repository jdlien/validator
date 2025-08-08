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

  let validationFnTrue = vi.fn(() => true)
  let validationFnFalse = vi.fn(() => false)
  let validationFn = vi.fn(() => true)

  beforeEach(() => {
    window['validationFnTrue'] = validationFnTrue
    window['validationFnFalse'] = validationFnFalse
    window['validation'] = validationFn
  })

  describe('validateCustom', () => {
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
  }) // end describe('validateCustom')
}) // end describe('Validator')
