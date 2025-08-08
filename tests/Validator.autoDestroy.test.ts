import Validator from '../src/Validator'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setupTestForm } from './utils/setup'

describe('Validator Auto-Destroy', () => {
  let form: HTMLFormElement
  let formControl: HTMLInputElement
  let validator: Validator
  let destroySpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    ;({ form, formControl, validator } = setupTestForm())
    destroySpy = vi.spyOn(validator, 'destroy')
  })

  afterEach(() => {
    // Clean up any remaining elements
    if (document.body.contains(form)) {
      validator.destroy()
      document.body.removeChild(form)
    }
  })

  describe('Direct form removal', () => {
    it('should auto-destroy when form is removed via removeChild', async () => {
      // Verify validator is not destroyed initially
      expect(destroySpy).not.toHaveBeenCalled()

      // Remove the form from DOM
      document.body.removeChild(form)

      // Wait for MutationObserver to trigger
      await new Promise(resolve => setTimeout(resolve, 10))

      // Verify destroy was called automatically
      expect(destroySpy).toHaveBeenCalledTimes(1)
    })

    it('should auto-destroy when form is removed via remove()', async () => {
      expect(destroySpy).not.toHaveBeenCalled()

      // Remove the form using remove() method
      form.remove()

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(destroySpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Parent container removal', () => {
    it('should auto-destroy when parent container is removed', async () => {
      // Create a container and move form into it
      const container = document.createElement('div')
      container.id = 'form-container'
      document.body.appendChild(container)
      container.appendChild(form)

      expect(destroySpy).not.toHaveBeenCalled()

      // Remove the parent container
      document.body.removeChild(container)

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(destroySpy).toHaveBeenCalledTimes(1)
    })

    it('should auto-destroy when nested parent is removed', async () => {
      // Create nested containers
      const outerContainer = document.createElement('div')
      const innerContainer = document.createElement('div')
      outerContainer.id = 'outer-container'
      innerContainer.id = 'inner-container'
      
      document.body.appendChild(outerContainer)
      outerContainer.appendChild(innerContainer)
      innerContainer.appendChild(form)

      expect(destroySpy).not.toHaveBeenCalled()

      // Remove the outer container
      document.body.removeChild(outerContainer)

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(destroySpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('innerHTML replacement scenarios', () => {
    it('should auto-destroy when parent innerHTML is cleared', async () => {
      // Create a container and move form into it
      const container = document.createElement('div')
      container.id = 'form-container'
      document.body.appendChild(container)
      container.appendChild(form)

      expect(destroySpy).not.toHaveBeenCalled()

      // Clear the container's innerHTML
      container.innerHTML = ''

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(destroySpy).toHaveBeenCalledTimes(1)
    })

    it('should auto-destroy when parent innerHTML is replaced', async () => {
      const container = document.createElement('div')
      container.id = 'form-container'
      document.body.appendChild(container)
      container.appendChild(form)

      expect(destroySpy).not.toHaveBeenCalled()

      // Replace the container's innerHTML
      container.innerHTML = '<p>New content</p>'

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(destroySpy).toHaveBeenCalledTimes(1)

      // Clean up
      document.body.removeChild(container)
    })
  })

  describe('Manual destroy should not conflict', () => {
    it('should handle manual destroy before auto-destroy', async () => {
      // Manually destroy first
      validator.destroy()
      expect(destroySpy).toHaveBeenCalledTimes(1)

      // Remove form from DOM
      document.body.removeChild(form)

      await new Promise(resolve => setTimeout(resolve, 10))

      // Should not call destroy again since it was already destroyed
      expect(destroySpy).toHaveBeenCalledTimes(1)
    })

    it('should properly clean up auto-destroy observer when manually destroyed', async () => {
      // Verify the observer exists
      expect((validator as any).autoDestroyObserver).not.toBeNull()

      // Manually destroy
      validator.destroy()

      // Verify the observer was cleaned up
      expect((validator as any).autoDestroyObserver).toBeNull()

      document.body.removeChild(form)
    })
  })
})