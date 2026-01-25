/**
 * Tests for potential issues identified in ISSUES.md
 * These tests confirm bugs exist before fixing them.
 */
import Validator from '../src/Validator'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setupTestForm } from './utils/setup'

describe('Issue Tests', () => {
  let form: HTMLFormElement
  let formControl: HTMLInputElement
  let validator: Validator

  beforeEach(() => {
    ;({ form, formControl, validator } = setupTestForm())
  })

  afterEach(() => {
    document.body.removeChild(form)
  })

  describe('Issue #1: Color sync null reference when no paired input exists', () => {
    it('should not throw when color picker has no paired text input', () => {
      // Create standalone color picker with no paired text input
      const colorPicker = document.createElement('input')
      colorPicker.type = 'color'
      colorPicker.id = 'standalone-color'
      colorPicker.value = '#ff0000'
      form.appendChild(colorPicker)

      validator.init()

      // This should not throw
      const event = new Event('input', { bubbles: true })
      Object.defineProperty(event, 'target', { value: colorPicker })

      expect(() => {
        ;(validator as any).syncColorInput(event)
      }).not.toThrow()
    })
  })

  describe('Issue #2: Custom messages overrides do not affect type validators', () => {
    it('should use custom error messages for type validators', async () => {
      const customMessage = 'Custom email error!'
      const customValidator = new Validator(form, {
        messages: {
          ERROR_EMAIL: customMessage,
        },
      })

      formControl.dataset.type = 'email'
      formControl.value = 'not-an-email'

      const valid = await (customValidator as any).validateInputType(formControl)
      expect(valid).toBe(false)
      expect(customValidator.inputErrors[formControl.name]).toContain(customMessage)
    })
  })

  describe('Issue #3: Error classes can remain after clearing when no error element exists', () => {
    it('should remove error classes even when no error element exists', () => {
      // Create input with no error element
      const inputNoError = document.createElement('input')
      inputNoError.name = 'no-error-input'
      inputNoError.id = 'no-error-input'
      form.appendChild(inputNoError)

      validator.init()

      // Manually add error classes (simulating previous error state)
      validator.errorInputClasses.split(' ').forEach((cls) => {
        inputNoError.classList.add(cls)
      })

      // Clear errors - this should remove the classes even without errorEl
      ;(validator as any).clearInputErrors(inputNoError)

      // Check that error classes are removed
      validator.errorInputClasses.split(' ').forEach((cls) => {
        expect(inputNoError.classList.contains(cls)).toBe(false)
      })
    })
  })

  describe('Issue #4: Stale inputErrors for removed inputs', () => {
    it('should not report errors for removed inputs', async () => {
      // Add an input and trigger an error
      const tempInput = document.createElement('input')
      tempInput.name = 'temp-input'
      tempInput.id = 'temp-input'
      tempInput.required = true
      tempInput.value = ''
      form.appendChild(tempInput)

      validator.init()
      await validator.validate()

      // Verify error exists
      expect(validator.inputErrors['temp-input']).toBeDefined()
      expect(validator.inputErrors['temp-input'].length).toBeGreaterThan(0)

      // Remove the input
      form.removeChild(tempInput)

      // Re-init
      validator.init()

      // The stale error should be cleared or ignored
      // Check that hasErrors correctly reports based on current inputs only
      const hasErrors = Object.values(validator.inputErrors).some(
        (errors) => Array.isArray(errors) && errors.length > 0
      )
      expect(hasErrors).toBe(false)
    })
  })

  describe('Issue #5a: Pattern validation can throw for invalid patterns', () => {
    it('should not throw for invalid regex patterns', () => {
      formControl.dataset.pattern = '[invalid(regex'
      formControl.value = 'test'

      expect(() => {
        ;(validator as any).validatePattern(formControl)
      }).not.toThrow()
    })

    it('should return true (pass validation) for invalid patterns', () => {
      formControl.dataset.pattern = '[invalid(regex'
      formControl.value = 'test'

      // Invalid pattern should be treated as pass-through
      const result = (validator as any).validatePattern(formControl)
      expect(result).toBe(true)
    })
  })

  describe('Issue #5b: Pattern validation matches partial values', () => {
    it('should require full value match, not partial match', () => {
      // Pattern expects only letters, but value has numbers at end
      formControl.dataset.pattern = '[a-z]+'
      formControl.value = 'abc123'

      // This should fail because the entire value doesn't match
      const result = (validator as any).validatePattern(formControl)
      expect(result).toBe(false)
    })

    it('should pass when entire value matches pattern', () => {
      formControl.dataset.pattern = '[a-z]+'
      formControl.value = 'abc'

      const result = (validator as any).validatePattern(formControl)
      expect(result).toBe(true)
    })
  })
})
