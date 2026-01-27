import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Validator from '../src/Validator'
import { setupTestForm, TestSetup } from './utils/setup'

describe('Validator', () => {
  let form: HTMLFormElement
  let formControl: HTMLInputElement
  let errorEl: HTMLDivElement
  let validator: Validator

  describe('validateOnBlur option', () => {
    beforeEach(() => {
      ;({ form, formControl, errorEl, validator } = setupTestForm({ validateOnBlur: true }))
    })

    afterEach(() => {
      document.body.removeChild(form)
    })

    it('should add blur event listener when validateOnBlur is true', () => {
      const newForm = document.createElement('form')
      document.body.appendChild(newForm)
      const addEventListenerSpy = vi.spyOn(newForm, 'addEventListener')

      const newValidator = new Validator(newForm, { validateOnBlur: true })

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'blur',
        (newValidator as any).inputBlurHandlerRef,
        true
      )

      newValidator.destroy()
      document.body.removeChild(newForm)
    })

    it('should not add blur event listener when validateOnBlur is false', () => {
      const newForm = document.createElement('form')
      document.body.appendChild(newForm)
      const addEventListenerSpy = vi.spyOn(newForm, 'addEventListener')

      const newValidator = new Validator(newForm, { validateOnBlur: false })

      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        'blur',
        expect.any(Function),
        true
      )

      newValidator.destroy()
      document.body.removeChild(newForm)
    })

    it('should validate required field on blur even if value unchanged', async () => {
      formControl.required = true

      // Focus and blur without typing anything
      formControl.focus()
      formControl.dispatchEvent(new FocusEvent('blur', { bubbles: false }))
      await new Promise((r) => setTimeout(r, 0))

      expect(errorEl.textContent).toBe('This field is required.')
      expect(formControl.getAttribute('aria-invalid')).toBe('true')
    })

    it('should not show error on blur when validateOnBlur is false', async () => {
      // Create a new validator with validateOnBlur: false
      validator.destroy()
      validator = new Validator(form, { validateOnBlur: false })

      formControl.required = true

      // Focus and blur without typing anything
      formControl.focus()
      formControl.dispatchEvent(new FocusEvent('blur', { bubbles: false }))
      await new Promise((r) => setTimeout(r, 0))

      expect(errorEl.textContent).toBe('')
    })

    it('should validate length constraints on blur', async () => {
      formControl.setAttribute('data-min-length', '5')
      formControl.value = 'ab'

      formControl.dispatchEvent(new FocusEvent('blur', { bubbles: false }))
      await new Promise((r) => setTimeout(r, 0))

      expect(errorEl.textContent).toBe('This must be at least 5 characters.')
    })

    it('should validate numeric value constraints on blur', async () => {
      formControl.setAttribute('data-type', 'number')
      formControl.setAttribute('data-min', '10')
      formControl.value = '5'

      formControl.dispatchEvent(new FocusEvent('blur', { bubbles: false }))
      await new Promise((r) => setTimeout(r, 0))

      expect(errorEl.textContent).toBe('The value must be at least 10.')
    })

    it('should run custom validation on blur for empty fields', async () => {
      const customValidation = vi.fn().mockReturnValue(false)
      ;(window as any).customBlurValidation = customValidation

      formControl.setAttribute('data-validation', 'customBlurValidation')
      formControl.value = ''

      formControl.dispatchEvent(new FocusEvent('blur', { bubbles: false }))
      await new Promise((r) => setTimeout(r, 0))

      expect(customValidation).toHaveBeenCalledWith('')

      delete (window as any).customBlurValidation
    })

    it('should respect data-novalidate attribute on blur', async () => {
      formControl.required = true
      formControl.setAttribute('data-novalidate', 'true')

      formControl.focus()
      formControl.dispatchEvent(new FocusEvent('blur', { bubbles: false }))
      await new Promise((r) => setTimeout(r, 0))

      expect(errorEl.textContent).toBe('')
    })

    it('should clear previous errors before validating on blur', async () => {
      formControl.required = true

      // First blur - should show error
      formControl.dispatchEvent(new FocusEvent('blur', { bubbles: false }))
      await new Promise((r) => setTimeout(r, 0))
      expect(errorEl.textContent).toBe('This field is required.')

      // Fill in value and blur again - should clear error
      formControl.value = 'valid value'
      formControl.dispatchEvent(new FocusEvent('blur', { bubbles: false }))
      await new Promise((r) => setTimeout(r, 0))

      expect(errorEl.textContent).toBe('')
      expect(formControl.getAttribute('aria-invalid')).toBeNull()
    })

    it('should ignore blur events on non-form-control elements', async () => {
      // Create a div inside the form
      const div = document.createElement('div')
      form.appendChild(div)

      // Blur event on div should not throw
      div.dispatchEvent(new FocusEvent('blur', { bubbles: false }))
      await new Promise((r) => setTimeout(r, 0))

      // No error should be shown
      expect(errorEl.textContent).toBe('')
    })
  })
})
