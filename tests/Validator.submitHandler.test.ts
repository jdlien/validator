import Validator, { ValidationEvent } from '../src/Validator'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setupTestForm } from './utils/setup'

describe('Validator', () => {
  let form: HTMLFormElement
  let validator: Validator

  beforeEach(() => {
    ;({ form, validator } = setupTestForm())
  })

  afterEach(() => {
    document.body.removeChild(form)
  })

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

    it('dispatches ValidationEvent with validationSuccess type if form is valid', async () => {
      vi.spyOn(form, 'dispatchEvent')
      vi.spyOn(form, 'submit').mockImplementation(() => {})
      vi.spyOn(validator, 'validate').mockImplementation(() => Promise.resolve(true))
      await (validator as any).submitHandler(new Event('submit'))
      expect(form.dispatchEvent).toHaveBeenCalledWith(expect.any(ValidationEvent))
      const dispatchedEvent = (form.dispatchEvent as any).mock.calls[0][0] as ValidationEvent
      expect(dispatchedEvent.type).toBe('validationSuccess')
    })

    it('dispatches ValidationEvent with validationError type if form is invalid', async () => {
      vi.spyOn(form, 'dispatchEvent')
      vi.spyOn(validator, 'validate').mockImplementation(() => Promise.resolve(false))
      await (validator as any).submitHandler(new Event('submit'))
      expect(form.dispatchEvent).toHaveBeenCalledWith(expect.any(ValidationEvent))
      const dispatchedEvent = (form.dispatchEvent as any).mock.calls[0][0] as ValidationEvent
      expect(dispatchedEvent.type).toBe('validationError')
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

    it('does not submit the form if preventSubmit is true even when validation is successful', () => {
      validator.preventSubmit = true
      vi.spyOn(validator, 'validate').mockImplementation(() => Promise.resolve(true))
      vi.spyOn(form, 'submit').mockImplementation(() => {})
      ;(validator as any).submitHandler(new Event('submit'))
      expect(form.submit).not.toHaveBeenCalled()
    })

    it('does not call validationSuccessCallback if it is not set', async () => {
      // Ensure callback is undefined
      ;(validator as any).validationSuccessCallback = undefined
      vi.spyOn(form, 'submit').mockImplementation(() => {})
      vi.spyOn(validator, 'validate').mockImplementation(() => Promise.resolve(true))

      // Should not throw even without callback
      await expect((validator as any).submitHandler(new Event('submit'))).resolves.not.toThrow()
    })

    it('does not call validationErrorCallback if it is not set', async () => {
      // Ensure callback is undefined
      ;(validator as any).validationErrorCallback = undefined
      vi.spyOn(validator, 'validate').mockImplementation(() => Promise.resolve(false))

      // Should not throw even without callback
      await expect((validator as any).submitHandler(new Event('submit'))).resolves.not.toThrow()
    })

    it('does not submit the form if validationEvent.defaultPrevented is true', async () => {
      vi.spyOn(form, 'submit').mockImplementation(() => {})
      vi.spyOn(validator, 'validate').mockImplementation(() => Promise.resolve(true))

      // Add an event listener that calls preventDefault on the validation event
      form.addEventListener('validationSuccess', (e) => {
        e.preventDefault()
      })

      await (validator as any).submitHandler(new Event('submit'))

      // Form should NOT be submitted because defaultPrevented is true
      expect(form.submit).not.toHaveBeenCalled()
    })
  })

  describe('ValidationEvent', () => {
    let submitEvent: Event

    beforeEach(() => {
      submitEvent = new Event('submit')
    })

    it('should create a validationSuccess event with the correct type and submitEvent', () => {
      const validationEvent = new ValidationEvent('validationSuccess', submitEvent)
      expect(validationEvent instanceof ValidationEvent).toBe(true)
      expect(validationEvent instanceof Event).toBe(true)
      expect(validationEvent.type).toBe('validationSuccess')
      expect(validationEvent.submitEvent).toBe(submitEvent)
    })

    it('should create a validationError event with the correct type and submitEvent', () => {
      const validationEvent = new ValidationEvent('validationError', submitEvent)
      expect(validationEvent instanceof ValidationEvent).toBe(true)
      expect(validationEvent instanceof Event).toBe(true)
      expect(validationEvent.type).toBe('validationError')
      expect(validationEvent.submitEvent).toBe(submitEvent)
    })

    it('should be cancelable', () => {
      const validationEvent = new ValidationEvent('validationSuccess', submitEvent)
      expect(validationEvent.cancelable).toBe(true)
    })

    it('should support preventDefault', () => {
      const validationEvent = new ValidationEvent('validationSuccess', submitEvent)
      expect(validationEvent.defaultPrevented).toBe(false)
      validationEvent.preventDefault()
      expect(validationEvent.defaultPrevented).toBe(true)
    })
  })
}) // end describe('Validator')
