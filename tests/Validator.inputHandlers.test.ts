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
    validator.destroy()
    document.body.removeChild(form)
  })

  describe('inputChangeHandler', () => {
    it('returns if event target is not an input element', () => {
      const event = new Event('change', { bubbles: true })
      Object.defineProperty(event, 'target', { value: form })
      vi.spyOn(validator as any, 'validateInput').mockImplementation(() => Promise.resolve())
      ;(validator as any).inputChangeHandler(event)
      expect((validator as any).validateInput).not.toHaveBeenCalled()
    })

    it('validates the input element when it changes', async () => {
      vi.spyOn(validator as any, 'validateInput').mockImplementation(() => Promise.resolve())
      const event = new Event('change', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })
      formControl.dispatchEvent(event)

      expect((validator as any).validateInput).toHaveBeenCalledWith(formControl)
    })

    it('does not validate the input element when it changes if data-novalidate is set', async () => {
      vi.spyOn(validator as any, 'validateInput').mockImplementation(() => Promise.resolve())
      formControl.dataset.novalidate = 'true'
      const event = new Event('change', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })
      formControl.dispatchEvent(event)

      expect((validator as any).validateInput).not.toHaveBeenCalledWith(formControl)

      formControl.dataset.novalidate = ''
      formControl.dispatchEvent(event)
      expect((validator as any).validateInput).not.toHaveBeenCalledWith(formControl)
    })

    it('does not validate the input element on input if data-novalidate is set', async () => {
      vi.spyOn(validator as any, 'validateInput').mockImplementation(() => Promise.resolve())
      formControl.dataset.novalidate = 'true'
      const event = new Event('input', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })
      formControl.dispatchEvent(event)

      expect((validator as any).validateInput).not.toHaveBeenCalledWith(formControl)

      formControl.dataset.novalidate = ''
      formControl.dispatchEvent(event)
      expect((validator as any).validateInput).not.toHaveBeenCalledWith(formControl)
    })

    it('clears the error messages for the input element', async () => {
      vi.spyOn(validator as any, 'clearInputErrors')
      const event = new Event('change', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })
      await formControl.dispatchEvent(event)
      expect((validator as any).clearInputErrors).toHaveBeenCalledWith(formControl)
    })

    it('shows the error messages for the input element', async () => {
      vi.spyOn(validator as any, 'showInputErrors')
      const event = new Event('change', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })
      await formControl.dispatchEvent(event)
      expect((validator as any).showInputErrors).toHaveBeenCalledWith(formControl)
    })

    it('validates min and max length on input elements', async () => {
      formControl.dataset.minLength = '2'
      formControl.dataset.maxLength = '4'
      formControl.value = '123'

      vi.spyOn(validator as any, 'validateLength')
      const event = new Event('change', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })
      await formControl.dispatchEvent(event)
      expect((validator as any).validateLength).toHaveBeenCalledWith(formControl)
    })
  }) // end inputChangeHandler

  describe('inputInputHandler', () => {
    it('should parse integer input values', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'integer'
      formControl.value = '123.45'

      const event = new Event('input', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })

      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('12345')

      formControl.value = '123,45'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('12345')

      formControl.value = '-12345'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('12345')
    })

    it('should parse non-native number input values', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'number'

      const event = new Event('input', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })

      formControl.value = '123.45'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('123.45')

      formControl.value = '123,45'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('12345')

      formControl.value = '-12345'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('-12345')

      formControl.value = '-12345a'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('-12345')
    })

    it('should not parse native number input values', () => {
      formControl.type = 'number'

      const event = new Event('input', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })

      formControl.value = '123.45'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('123.45')

      // This value won't be allowed and will be blanked out
      formControl.value = '123,45'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('')

      formControl.value = '-123.4'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('-123.4')
    })

    it('should call syncColorInput for color inputs', () => {
      const syncColorInputSpy = vi.spyOn(validator as any, 'syncColorInput')
      formControl.type = 'color'
      const event = new Event('input', { bubbles: true })
      Object.defineProperty(event, 'target', { value: formControl })

      formControl.dispatchEvent(event)
      expect(syncColorInputSpy).toHaveBeenCalledWith(expect.any(Event))

      formControl.type = 'text'
      formControl.dataset.type = 'color'
      formControl.dispatchEvent(event)
      expect(syncColorInputSpy).toHaveBeenCalledWith(expect.any(Event))
    })
  }) // end inputInputHandler

  describe('inputKeydownHandler', () => {
    let event: Event

    beforeEach(() => {
      formControl.type = 'text'
      formControl.dataset.type = 'integer'

      event = new Event('keydown', { bubbles: true })
    })

    it('should return if the event target is not an input element', () => {
      Object.defineProperty(event, 'target', { value: form })
      ;(validator as any).inputKeydownHandler(event)
      expect(formControl.value).toEqual('')
    })

    it('should increment integer input value when ArrowUp key is pressed', () => {
      Object.defineProperty(event, 'target', { value: formControl })
      Object.defineProperty(event, 'key', { value: 'ArrowUp' })

      formControl.value = '5'
      ;(validator as any).inputKeydownHandler(event)
      expect(formControl.value).toEqual('6')

      Object.defineProperty(event, 'target', { value: formControl })
      Object.defineProperty(event, 'key', { value: 'ArrowUp' })

      formControl.value = ''
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('1')
    })

    it('should decrement integer input value when ArrowDown key is pressed', () => {
      Object.defineProperty(event, 'target', { value: formControl })
      Object.defineProperty(event, 'key', { value: 'ArrowDown' })

      formControl.value = '5'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('4')

      // Test that it doesn't go below 0
      formControl.value = '0'
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('0')

      formControl.value = ''
      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('0')
    })

    it('should not increment or decrement non-integer inputs on ArrowUp', () => {
      Object.defineProperty(event, 'target', { value: formControl })
      Object.defineProperty(event, 'key', { value: 'ArrowUp' })
      formControl.dataset.type = 'text'
      formControl.value = '1'

      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('1')
    })

    it('should not increment or decrement non-integer inputs on ArrowDown', () => {
      Object.defineProperty(event, 'target', { value: formControl })
      Object.defineProperty(event, 'key', { value: 'ArrowDown' })
      formControl.dataset.type = 'text'
      formControl.value = '1'

      formControl.dispatchEvent(event)
      expect(formControl.value).toEqual('1')
    })
  }) // end inputKeydownHandler
})
