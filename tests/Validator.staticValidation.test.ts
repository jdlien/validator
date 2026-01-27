import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Validator from '../src/Validator'

describe('Validator static methods', () => {
  let input: HTMLInputElement
  let errorEl: HTMLDivElement
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)

    input = document.createElement('input')
    input.type = 'text'
    input.name = 'test-input'
    input.id = 'test-input'
    container.appendChild(input)

    errorEl = document.createElement('div')
    errorEl.id = 'test-input-error'
    errorEl.classList.add('hidden')
    container.appendChild(errorEl)
  })

  afterEach(() => {
    document.body.removeChild(container)
    Validator.clearValidators()
  })

  describe('Validator.validateSingle', () => {
    it('should return true for null input', async () => {
      expect(await Validator.validateSingle(null)).toBe(true)
    })

    it('should return true for disabled input', async () => {
      input.required = true
      input.disabled = true
      expect(await Validator.validateSingle(input)).toBe(true)
    })

    it('should validate required field', async () => {
      input.required = true
      input.value = ''
      expect(await Validator.validateSingle(input)).toBe(false)
      expect(errorEl.textContent).toBe('This field is required.')
    })

    it('should validate email type', async () => {
      input.type = 'email'
      input.value = 'invalid'
      expect(await Validator.validateSingle(input)).toBe(false)

      input.value = 'test@example.com'
      expect(await Validator.validateSingle(input)).toBe(true)
    })

    it('should use custom validators from options', async () => {
      input.setAttribute('data-validation', 'customCheck')
      input.value = 'test'

      const result = await Validator.validateSingle(input, {
        validators: { customCheck: () => 'Custom error' },
      })

      expect(result).toBe(false)
      expect(errorEl.textContent).toBe('Custom error')
    })
  })

  describe('Validator.clearInputErrors', () => {
    it('should clear errors from input', async () => {
      input.required = true
      input.value = ''
      await Validator.validateSingle(input)
      expect(input.getAttribute('aria-invalid')).toBe('true')

      Validator.clearInputErrors(input)
      expect(input.getAttribute('aria-invalid')).toBeNull()
      expect(errorEl.textContent).toBe('')
    })

    it('should handle null input', () => {
      expect(() => Validator.clearInputErrors(null)).not.toThrow()
    })
  })
})
