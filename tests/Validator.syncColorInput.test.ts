import Validator from '../src/Validator'
import { parseColor } from '@jdlien/validator-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setupTestForm } from './utils/setup'

describe('Validator', () => {
  let form: HTMLFormElement
  let validator: Validator

  beforeEach(() => {
    ;({ form, validator } = setupTestForm())
  })

  afterEach(() => {
    validator.destroy()
    document.body.removeChild(form)
  })

  describe('syncColorInput', () => {
    let colorInput: HTMLInputElement
    let colorPicker: HTMLInputElement
    let colorLabel: HTMLLabelElement

    beforeEach(() => {
      colorInput = document.createElement('input')
      colorInput.type = 'text'
      colorInput.id = 'test-color'
      colorInput.value = '#ff0000'
      colorInput.dataset.type = 'color'
      form.appendChild(colorInput)

      colorPicker = document.createElement('input')
      colorPicker.type = 'color'
      colorPicker.id = 'test-color-color'
      colorPicker.value = '#ff0000'
      form.appendChild(colorPicker)

      colorLabel = document.createElement('label')
      colorLabel.htmlFor = 'test-color-color'
      colorLabel.id = 'test-color-color-label'
      form.appendChild(colorLabel)

      validator.init()
    })

    it('should update the HTML color picker input and its label background when color input changes', () => {
      const event = new Event('input', { bubbles: true })
      Object.defineProperty(event, 'target', { value: colorInput })
      const colorLbl = form.querySelector(`#${colorInput.id}-color-label`)

      colorInput.value = '#00ff00'
      colorInput.dispatchEvent(event)

      expect(colorPicker.value).toEqual('#00ff00')

      const color = parseColor(window.getComputedStyle(colorLabel).backgroundColor)

      expect(color).toEqual('#00ff00')
    })

    it('should update the color input and label background when the HTML color picker is changed', () => {
      const event = new Event('input', { bubbles: true })
      Object.defineProperty(event, 'target', { value: colorPicker })

      colorPicker.value = '#0000ff'
      ;(validator as any).syncColorInput(event)

      expect(colorInput.value).toEqual('#0000ff')
      expect(parseColor(colorLabel.style.backgroundColor)).toEqual('#0000ff')
    })

    it('should not update the HTML color picker if the color input value is not a valid color', () => {
      const event = new Event('input', { bubbles: true })
      Object.defineProperty(event, 'target', { value: colorInput })

      colorInput.value = 'not-a-color'
      ;(validator as any).syncColorInput(event)

      expect(colorPicker.value).toEqual('#ff0000')
    })

    it('should debounce change events by clearing and setting a timeout', () => {
      // Mock timers to test debouncing
      vi.useFakeTimers()

      // Setup spies
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
      const setTimeoutSpy = vi.spyOn(window, 'setTimeout')
      const dispatchEventSpy = vi.spyOn(colorInput, 'dispatchEvent')

      // First input event
      const event1 = new Event('input', { bubbles: true })
      Object.defineProperty(event1, 'target', { value: colorInput })
      colorInput.value = '#ff00ff'
      ;(validator as any).syncColorInput(event1)

      // Verify first call
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1)
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(1)

      // Second input event shortly after
      const event2 = new Event('input', { bubbles: true })
      Object.defineProperty(event2, 'target', { value: colorInput })
      colorInput.value = '#00ffff'
      ;(validator as any).syncColorInput(event2)

      // Should clear the previous timeout and set a new one
      expect(setTimeoutSpy).toHaveBeenCalledTimes(2)
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2)
      expect(dispatchEventSpy).not.toHaveBeenCalled()

      // Fast-forward time to trigger the timeout
      vi.runAllTimers()

      // Now the change event should have been dispatched once
      expect(dispatchEventSpy).toHaveBeenCalledTimes(1)
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'change',
          bubbles: true,
        })
      )

      // Restore timers
      vi.useRealTimers()
    })
  }) // end syncColorInput
}) // end describe('Validator')
