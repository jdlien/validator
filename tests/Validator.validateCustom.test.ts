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
    document.body.removeChild(form)
    // Clean up static registry between tests
    Validator.clearValidators()
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

  describe('Instance validator registry', () => {
    it('uses validator from instance options', async () => {
      const instanceValidator = vi.fn(() => true)
      document.body.removeChild(form)
      ;({ form, formControl, validator } = setupTestForm({
        validators: { myInstanceValidator: instanceValidator },
      }))
      formControl.dataset.validation = 'myInstanceValidator'
      formControl.value = 'test'

      const result = await (validator as any).validateCustom(formControl)
      expect(result).toBe(true)
      expect(instanceValidator).toHaveBeenCalledWith('test')
    })

    it('returns custom error message from instance validator', async () => {
      const instanceValidator = vi.fn(() => ({ valid: false, message: 'Instance error' }))
      document.body.removeChild(form)
      ;({ form, formControl, validator } = setupTestForm({
        validators: { myValidator: instanceValidator },
      }))
      formControl.dataset.validation = 'myValidator'
      formControl.value = 'test'

      const result = await (validator as any).validateCustom(formControl)
      expect(result).toBe(false)
      expect(validator.inputErrors[formControl.name]).toContain('Instance error')
    })

    it('supports async validators in instance registry', async () => {
      const asyncValidator = vi.fn(
        () => new Promise((resolve) => setTimeout(() => resolve({ valid: true }), 10))
      )
      document.body.removeChild(form)
      ;({ form, formControl, validator } = setupTestForm({
        validators: { asyncValidator },
      }))
      formControl.dataset.validation = 'asyncValidator'
      formControl.value = 'test'

      const result = await (validator as any).validateCustom(formControl)
      expect(result).toBe(true)
      expect(asyncValidator).toHaveBeenCalled()
    })

    it('isolates validators between instances', async () => {
      const validator1Fn = vi.fn(() => ({ valid: false, message: 'Validator 1' }))
      const validator2Fn = vi.fn(() => ({ valid: false, message: 'Validator 2' }))

      // Create two separate forms with different validators
      const form1 = document.createElement('form')
      document.body.appendChild(form1)
      const input1 = document.createElement('input')
      input1.name = 'input1'
      input1.dataset.validation = 'sharedName'
      input1.value = 'test'
      form1.appendChild(input1)
      const error1 = document.createElement('div')
      error1.id = 'input1-error'
      form1.appendChild(error1)

      const form2 = document.createElement('form')
      document.body.appendChild(form2)
      const input2 = document.createElement('input')
      input2.name = 'input2'
      input2.dataset.validation = 'sharedName'
      input2.value = 'test'
      form2.appendChild(input2)
      const error2 = document.createElement('div')
      error2.id = 'input2-error'
      form2.appendChild(error2)

      const v1 = new Validator(form1, { validators: { sharedName: validator1Fn } })
      const v2 = new Validator(form2, { validators: { sharedName: validator2Fn } })

      await (v1 as any).validateCustom(input1)
      await (v2 as any).validateCustom(input2)

      expect(v1.inputErrors['input1']).toContain('Validator 1')
      expect(v2.inputErrors['input2']).toContain('Validator 2')

      document.body.removeChild(form1)
      document.body.removeChild(form2)
    })
  })

  describe('Static validator registry', () => {
    it('registerValidator makes validator available', async () => {
      const staticValidator = vi.fn(() => true)
      Validator.registerValidator('staticValidator', staticValidator)

      formControl.dataset.validation = 'staticValidator'
      formControl.value = 'test'

      const result = await (validator as any).validateCustom(formControl)
      expect(result).toBe(true)
      expect(staticValidator).toHaveBeenCalledWith('test')
    })

    it('unregisterValidator removes validator', async () => {
      const staticValidator = vi.fn(() => false)
      Validator.registerValidator('toRemove', staticValidator)
      Validator.unregisterValidator('toRemove')

      formControl.dataset.validation = 'toRemove'
      formControl.value = 'test'

      // Should return true because validator not found
      const result = await (validator as any).validateCustom(formControl)
      expect(result).toBe(true)
      expect(staticValidator).not.toHaveBeenCalled()
    })

    it('getValidators returns copy of all validators', () => {
      const fn1 = vi.fn(() => true)
      const fn2 = vi.fn(() => false)
      Validator.registerValidator('fn1', fn1)
      Validator.registerValidator('fn2', fn2)

      const validators = Validator.getValidators()
      expect(validators.fn1).toBe(fn1)
      expect(validators.fn2).toBe(fn2)

      // Verify it's a copy (can't modify original)
      ;(validators as any).fn3 = vi.fn()
      expect(Validator.getValidators().fn3).toBeUndefined()
    })

    it('clearValidators removes all validators', async () => {
      const fn = vi.fn(() => false)
      Validator.registerValidator('toClear', fn)
      Validator.clearValidators()

      formControl.dataset.validation = 'toClear'
      formControl.value = 'test'

      const result = await (validator as any).validateCustom(formControl)
      expect(result).toBe(true)
      expect(fn).not.toHaveBeenCalled()
    })
  })

  describe('Lookup priority', () => {
    it('instance takes priority over static', async () => {
      const instanceFn = vi.fn(() => ({ valid: false, message: 'Instance wins' }))
      const staticFn = vi.fn(() => ({ valid: false, message: 'Static loses' }))

      Validator.registerValidator('priorityTest', staticFn)
      document.body.removeChild(form)
      ;({ form, formControl, validator } = setupTestForm({
        validators: { priorityTest: instanceFn },
      }))
      formControl.dataset.validation = 'priorityTest'
      formControl.value = 'test'

      await (validator as any).validateCustom(formControl)
      expect(instanceFn).toHaveBeenCalled()
      expect(staticFn).not.toHaveBeenCalled()
      expect(validator.inputErrors[formControl.name]).toContain('Instance wins')
    })

    it('static takes priority over window', async () => {
      const staticFn = vi.fn(() => ({ valid: false, message: 'Static wins' }))
      const windowFn = vi.fn(() => ({ valid: false, message: 'Window loses' }))
      window['windowPriorityTest'] = windowFn

      Validator.registerValidator('windowPriorityTest', staticFn)
      formControl.dataset.validation = 'windowPriorityTest'
      formControl.value = 'test'

      await (validator as any).validateCustom(formControl)
      expect(staticFn).toHaveBeenCalled()
      expect(windowFn).not.toHaveBeenCalled()
      expect(validator.inputErrors[formControl.name]).toContain('Static wins')

      delete (window as any)['windowPriorityTest']
    })

    it('falls back to window when not found elsewhere', async () => {
      const windowFn = vi.fn(() => ({ valid: false, message: 'Window fallback' }))
      window['windowFallback'] = windowFn

      formControl.dataset.validation = 'windowFallback'
      formControl.value = 'test'

      await (validator as any).validateCustom(formControl)
      expect(windowFn).toHaveBeenCalled()
      expect(validator.inputErrors[formControl.name]).toContain('Window fallback')

      delete (window as any)['windowFallback']
    })
  })

  describe('Edge cases', () => {
    it('handles throwing validators gracefully', async () => {
      const throwingValidator = vi.fn(() => {
        throw new Error('Validator exploded')
      })
      Validator.registerValidator('throwingValidator', throwingValidator)

      formControl.dataset.validation = 'throwingValidator'
      formControl.value = 'test'

      const result = await (validator as any).validateCustom(formControl)
      expect(result).toBe(false)
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_CUSTOM_VALIDATION
      )
    })

    it('handles rejecting async validators gracefully', async () => {
      const rejectingValidator = vi.fn(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Async fail')), 10))
      )
      Validator.registerValidator('rejectingValidator', rejectingValidator)

      formControl.dataset.validation = 'rejectingValidator'
      formControl.value = 'test'

      const result = await (validator as any).validateCustom(formControl)
      expect(result).toBe(false)
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_CUSTOM_VALIDATION
      )
    })
  })
}) // end describe('Validator')
