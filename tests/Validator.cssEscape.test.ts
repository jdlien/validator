/**
 * Tests for CSS.escape polyfill branch coverage
 * This test mocks CSS.escape before importing the module to test the native branch
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

describe('CSS.escape polyfill', () => {
  describe('when native CSS.escape is available', () => {
    let Validator: typeof import('../src/Validator').default
    let originalCSS: typeof globalThis.CSS

    beforeAll(async () => {
      // Save original CSS object
      originalCSS = globalThis.CSS

      // Mock CSS.escape before importing the module
      const mockEscape = vi.fn((s: string) => s.replace(/([^\w-])/g, '\\$1'))
      globalThis.CSS = {
        ...globalThis.CSS,
        escape: mockEscape,
      } as typeof CSS

      // Reset module cache and import fresh
      vi.resetModules()
      const module = await import('../src/Validator')
      Validator = module.default
    })

    afterAll(() => {
      // Restore original CSS object
      globalThis.CSS = originalCSS
      vi.resetModules()
    })

    it('should use native CSS.escape when available', () => {
      const form = document.createElement('form')
      form.id = 'test-form'
      document.body.appendChild(form)

      const input = document.createElement('input')
      input.id = 'test.input' // ID with special character
      input.name = 'test.input'
      form.appendChild(input)

      const errorEl = document.createElement('div')
      errorEl.id = 'test.input-error'
      form.appendChild(errorEl)

      const validator = new Validator(form)

      // Trigger getErrorEl which uses cssEscape
      ;(validator as any).clearInputErrors(input)

      // Verify CSS.escape was called (indirectly through the module using it)
      expect(globalThis.CSS.escape).toHaveBeenCalled()

      validator.destroy()
      document.body.removeChild(form)
    })
  })
})
