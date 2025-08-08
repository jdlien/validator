import Validator from '../src/Validator'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Validator', () => {
  describe('destroy', () => {
    let validatorInstance: Validator
    let formElement: HTMLFormElement

    beforeEach(() => {
      formElement = document.createElement('form')
      formElement.id = 'destroy-test-form'
      document.body.appendChild(formElement)
      // Init with autoInit: true for observer tests
      validatorInstance = new Validator(formElement, { autoInit: true })
    })

    afterEach(() => {
      // Clean up the form element from the DOM - auto-destroy will handle validator cleanup
      if (document.body.contains(formElement)) {
        document.body.removeChild(formElement)
      }
    })

    it('removes all event listeners', () => {
      const removeSpy = vi.spyOn(validatorInstance, 'removeEventListeners')
      validatorInstance.destroy()
      expect(removeSpy).toHaveBeenCalledTimes(1)
    })

    it('removes the "novalidate" attribute from the form if it was not originally present', () => {
      // Validator adds 'novalidate' during initialization
      expect(formElement.hasAttribute('novalidate')).toBe(true)
      validatorInstance.destroy()
      // Should be removed as originalNoValidate is false
      expect(formElement.hasAttribute('novalidate')).toBe(false)
    })

    it('does not remove the "novalidate" attribute from the form if it was originally present', () => {
      // Arrange: Start with novalidate present
      formElement.setAttribute('novalidate', '')
      // Create a new instance specific to this test context
      const testValidator = new Validator(formElement)

      // Act
      testValidator.destroy()

      // Assert: novalidate should remain
      expect(formElement.hasAttribute('novalidate')).toBe(true)
    })

    it('disconnects the MutationObserver', () => {
      const observer = (validatorInstance as any).formMutationObserver
      expect(observer).toBeInstanceOf(MutationObserver)
      const disconnectSpy = vi.spyOn(observer, 'disconnect')

      validatorInstance.destroy()

      expect(disconnectSpy).toHaveBeenCalledTimes(1)
      expect((validatorInstance as any).formMutationObserver).toBeNull()
    })

    it('disconnects the auto-destroy observer', () => {
      const observer = (validatorInstance as any).autoDestroyObserver
      expect(observer).toBeInstanceOf(MutationObserver)
      const disconnectSpy = vi.spyOn(observer, 'disconnect')

      validatorInstance.destroy()

      expect(disconnectSpy).toHaveBeenCalledTimes(1)
      expect((validatorInstance as any).autoDestroyObserver).toBeNull()
    })

    it('clears the debounced init timer (timeoutId)', () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
      // Arrange: Simulate an active debounce timer
      const dummyTimeoutId = setTimeout(() => {}, 100)
      ;(validatorInstance as any).timeoutId = dummyTimeoutId

      // Act
      validatorInstance.destroy()

      // Assert: clearTimeout should be called with the correct ID
      expect(clearTimeoutSpy).toHaveBeenCalledWith(dummyTimeoutId)
    })

    it('clears the color sync timer (dispatchTimeout)', async () => {
      // Use real timers as the logic involves nested setTimeout
      vi.useRealTimers()

      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
      const syncColorSpy = vi.spyOn(validatorInstance as any, 'syncColorInput')

      // Arrange: Set up color input and re-initialize validator
      const colorInput = document.createElement('input')
      colorInput.type = 'text'
      colorInput.dataset.type = 'color'
      colorInput.id = 'color-destroy-test'
      formElement.appendChild(colorInput)
      validatorInstance.init() // Needed to detect the new input

      // Act: Trigger input event to start the sync logic
      colorInput.dispatchEvent(new Event('input', { bubbles: true }))

      // Allow time for the inner setTimeout in syncColorInput to potentially run
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(syncColorSpy).toHaveBeenCalled() // Verify sync logic was triggered

      // Grab the timeout ID set by syncColorInput
      const dispatchTimeoutIdBefore = (validatorInstance as any).dispatchTimeout

      // Act: Destroy the validator
      validatorInstance.destroy()

      // Assert: clearTimeout was called with the correct ID during destroy
      expect(clearTimeoutSpy).toHaveBeenCalledWith(dispatchTimeoutIdBefore)
    })
  })
})
