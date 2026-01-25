import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Validator from '../src/Validator'
import { setupTestForm } from './utils/setup'

describe('Validator.validateSingle', () => {
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

  describe('basic functionality', () => {
    it('should return true for valid input', async () => {
      formControl.value = 'valid value'
      const result = await validator.validateSingle(formControl)
      expect(result).toBe(true)
    })

    it('should return true for input not in form', async () => {
      const externalInput = document.createElement('input')
      externalInput.required = true
      const result = await validator.validateSingle(externalInput)
      expect(result).toBe(true)
    })

    it('should return true for disabled input', async () => {
      formControl.required = true
      formControl.disabled = true
      const result = await validator.validateSingle(formControl)
      expect(result).toBe(true)
    })
  })

  describe('required validation', () => {
    it('should return false and show error for empty required input', async () => {
      formControl.required = true
      formControl.value = ''

      const result = await validator.validateSingle(formControl)

      expect(result).toBe(false)
      expect(errorEl.textContent).toBe('This field is required.')
      expect(formControl.getAttribute('aria-invalid')).toBe('true')
    })

    it('should return true for filled required input', async () => {
      formControl.required = true
      formControl.value = 'filled'

      const result = await validator.validateSingle(formControl)

      expect(result).toBe(true)
      expect(errorEl.textContent).toBe('')
    })
  })

  describe('length validation', () => {
    it('should return false for input below minlength', async () => {
      formControl.setAttribute('data-min-length', '5')
      formControl.value = 'ab'

      const result = await validator.validateSingle(formControl)

      expect(result).toBe(false)
      expect(errorEl.textContent).toBe('This must be at least 5 characters.')
    })

    it('should return false for input above maxlength', async () => {
      formControl.setAttribute('data-max-length', '3')
      formControl.value = 'toolong'

      const result = await validator.validateSingle(formControl)

      expect(result).toBe(false)
      expect(errorEl.textContent).toBe('This must be 3 characters or fewer.')
    })

    it('should return true for input within length bounds', async () => {
      formControl.setAttribute('data-min-length', '2')
      formControl.setAttribute('data-max-length', '10')
      formControl.value = 'valid'

      const result = await validator.validateSingle(formControl)

      expect(result).toBe(true)
    })
  })

  describe('numeric value validation', () => {
    it('should return false for number below min', async () => {
      formControl.setAttribute('data-type', 'number')
      formControl.setAttribute('data-min', '10')
      formControl.value = '5'

      const result = await validator.validateSingle(formControl)

      expect(result).toBe(false)
      expect(errorEl.textContent).toBe('The value must be at least 10.')
    })

    it('should return false for number above max', async () => {
      formControl.setAttribute('data-type', 'number')
      formControl.setAttribute('data-max', '100')
      formControl.value = '150'

      const result = await validator.validateSingle(formControl)

      expect(result).toBe(false)
      expect(errorEl.textContent).toBe('The value must be at most 100.')
    })
  })

  describe('type validation', () => {
    it('should return false for invalid email', async () => {
      formControl.type = 'email'
      formControl.value = 'not-an-email'

      const result = await validator.validateSingle(formControl)

      expect(result).toBe(false)
      expect(errorEl.textContent).toBe('This is not a valid email address.')
    })

    it('should return true for valid email', async () => {
      formControl.type = 'email'
      formControl.value = 'test@example.com'

      const result = await validator.validateSingle(formControl)

      expect(result).toBe(true)
    })

    it('should return false for invalid phone number', async () => {
      formControl.setAttribute('data-type', 'tel')
      formControl.value = '123'

      const result = await validator.validateSingle(formControl)

      expect(result).toBe(false)
      expect(errorEl.textContent).toBe('This is not a valid telephone number.')
    })
  })

  describe('pattern validation', () => {
    it('should return false for value not matching pattern', async () => {
      formControl.setAttribute('data-pattern', '^[A-Z]+$')
      formControl.value = 'lowercase'

      const result = await validator.validateSingle(formControl)

      expect(result).toBe(false)
    })

    it('should return true for value matching pattern', async () => {
      formControl.setAttribute('data-pattern', '^[A-Z]+$')
      formControl.value = 'UPPERCASE'

      const result = await validator.validateSingle(formControl)

      expect(result).toBe(true)
    })
  })

  describe('custom validation', () => {
    it('should run custom validation function', async () => {
      const customValidation = vi.fn().mockReturnValue(true)
      ;(window as any).myCustomValidation = customValidation

      formControl.setAttribute('data-validation', 'myCustomValidation')
      formControl.value = 'test'

      const result = await validator.validateSingle(formControl)

      expect(customValidation).toHaveBeenCalledWith('test')
      expect(result).toBe(true)

      delete (window as any).myCustomValidation
    })

    it('should show error from custom validation', async () => {
      const customValidation = vi.fn().mockReturnValue('Custom error message')
      ;(window as any).myCustomValidation = customValidation

      formControl.setAttribute('data-validation', 'myCustomValidation')
      formControl.value = 'test'

      const result = await validator.validateSingle(formControl)

      expect(result).toBe(false)
      expect(errorEl.textContent).toBe('Custom error message')

      delete (window as any).myCustomValidation
    })

    it('should run custom validation for empty inputs', async () => {
      const customValidation = vi.fn().mockReturnValue(false)
      ;(window as any).myCustomValidation = customValidation

      formControl.setAttribute('data-validation', 'myCustomValidation')
      formControl.value = ''

      const result = await validator.validateSingle(formControl)

      expect(customValidation).toHaveBeenCalledWith('')
      expect(result).toBe(false)

      delete (window as any).myCustomValidation
    })

    it('should handle async custom validation', async () => {
      const customValidation = vi.fn().mockResolvedValue({ valid: false, message: 'Async error' })
      ;(window as any).myAsyncValidation = customValidation

      formControl.setAttribute('data-validation', 'myAsyncValidation')
      formControl.value = 'test'

      const result = await validator.validateSingle(formControl)

      expect(result).toBe(false)
      expect(errorEl.textContent).toBe('Async error')

      delete (window as any).myAsyncValidation
    })
  })

  describe('error display', () => {
    it('should clear previous errors before validating', async () => {
      formControl.required = true
      formControl.value = ''

      // First validation - should fail
      await validator.validateSingle(formControl)
      expect(errorEl.textContent).toBe('This field is required.')

      // Now make it valid
      formControl.value = 'valid'
      await validator.validateSingle(formControl)

      expect(errorEl.textContent).toBe('')
      expect(formControl.getAttribute('aria-invalid')).toBeNull()
    })

    it('should accumulate multiple errors', async () => {
      formControl.required = true
      formControl.setAttribute('data-min-length', '10')
      formControl.value = ''

      const result = await validator.validateSingle(formControl)

      expect(result).toBe(false)
      // Should show required error (minlength doesn't apply to empty values)
      expect(errorEl.textContent).toContain('This field is required.')
    })
  })

  describe('select element validation', () => {
    it('should validate select elements', async () => {
      // Remove the input and add a select
      form.removeChild(formControl)

      const select = document.createElement('select')
      select.name = 'test-input'
      select.id = 'test-input'
      select.required = true
      form.insertBefore(select, errorEl)

      const emptyOption = document.createElement('option')
      emptyOption.value = ''
      emptyOption.text = 'Select...'
      select.appendChild(emptyOption)

      const validOption = document.createElement('option')
      validOption.value = 'valid'
      validOption.text = 'Valid Option'
      select.appendChild(validOption)

      // Reinitialize validator to pick up the new select
      validator.init()

      const result = await validator.validateSingle(select)

      expect(result).toBe(false)
      expect(errorEl.textContent).toBe('This field is required.')
    })
  })

  describe('textarea validation', () => {
    it('should validate textarea elements', async () => {
      // Remove the input and add a textarea
      form.removeChild(formControl)

      const textarea = document.createElement('textarea')
      textarea.name = 'test-input'
      textarea.id = 'test-input'
      textarea.required = true
      form.insertBefore(textarea, errorEl)

      // Reinitialize validator to pick up the new textarea
      validator.init()

      const result = await validator.validateSingle(textarea)

      expect(result).toBe(false)
      expect(errorEl.textContent).toBe('This field is required.')
    })

    it('should validate textarea minlength', async () => {
      form.removeChild(formControl)

      const textarea = document.createElement('textarea')
      textarea.name = 'test-input'
      textarea.id = 'test-input'
      textarea.setAttribute('data-min-length', '20')
      textarea.value = 'short'
      form.insertBefore(textarea, errorEl)

      validator.init()

      const result = await validator.validateSingle(textarea)

      expect(result).toBe(false)
      expect(errorEl.textContent).toBe('This must be at least 20 characters.')
    })
  })
})
