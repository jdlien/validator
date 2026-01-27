import Validator from '../src/Validator'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Validator scrollToError', () => {
  let form: HTMLFormElement
  let input1: HTMLInputElement
  let input2: HTMLInputElement
  let validator: Validator

  beforeEach(() => {
    form = document.createElement('form')
    form.id = 'test-form'
    document.body.appendChild(form)

    input1 = document.createElement('input')
    input1.type = 'text'
    input1.name = 'input1'
    input1.id = 'input1'
    // Mock scrollIntoView since jsdom doesn't implement it
    input1.scrollIntoView = vi.fn()
    form.appendChild(input1)

    input2 = document.createElement('input')
    input2.type = 'text'
    input2.name = 'input2'
    input2.id = 'input2'
    input2.required = true
    // Mock scrollIntoView since jsdom doesn't implement it
    input2.scrollIntoView = vi.fn()
    form.appendChild(input2)
  })

  afterEach(() => {
    if (document.body.contains(form)) {
      document.body.removeChild(form)
    }
  })

  it('does not scroll by default', async () => {
    validator = new Validator(form, { scrollToError: false })
    const scrollSpy = vi.spyOn(input2, 'scrollIntoView')
    const focusSpy = vi.spyOn(input2, 'focus')

    await validator.validate()
    ;(validator as any).showFormErrors()

    expect(scrollSpy).not.toHaveBeenCalled()
    expect(focusSpy).not.toHaveBeenCalled()
  })

  it('scrolls to first error when scrollToError is true', async () => {
    validator = new Validator(form, { scrollToError: true })
    const scrollSpy = vi.spyOn(input2, 'scrollIntoView')
    const focusSpy = vi.spyOn(input2, 'focus')

    await validator.validate()
    ;(validator as any).showFormErrors()

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    expect(focusSpy).toHaveBeenCalled()
  })

  it('focuses the first input with errors', async () => {
    // Make both inputs required
    input1.required = true
    input2.required = true

    validator = new Validator(form, { scrollToError: true })
    const scrollSpy1 = vi.spyOn(input1, 'scrollIntoView')
    const scrollSpy2 = vi.spyOn(input2, 'scrollIntoView')
    const focusSpy1 = vi.spyOn(input1, 'focus')
    const focusSpy2 = vi.spyOn(input2, 'focus')

    await validator.validate()
    ;(validator as any).showFormErrors()

    // Should scroll to first error (input1)
    expect(scrollSpy1).toHaveBeenCalled()
    expect(focusSpy1).toHaveBeenCalled()
    expect(scrollSpy2).not.toHaveBeenCalled()
    expect(focusSpy2).not.toHaveBeenCalled()
  })

  it('does not scroll when there are no errors', async () => {
    input2.required = false // No required inputs
    validator = new Validator(form, { scrollToError: true })
    const scrollSpy1 = vi.spyOn(input1, 'scrollIntoView')
    const scrollSpy2 = vi.spyOn(input2, 'scrollIntoView')

    await validator.validate()
    ;(validator as any).showFormErrors()

    expect(scrollSpy1).not.toHaveBeenCalled()
    expect(scrollSpy2).not.toHaveBeenCalled()
  })

  it('scrollToError defaults to false', () => {
    validator = new Validator(form)
    expect(validator.scrollToError).toBe(false)
  })

  it('scrollToError can be set to true via options', () => {
    validator = new Validator(form, { scrollToError: true })
    expect(validator.scrollToError).toBe(true)
  })

  it('calls focus with preventScroll to avoid overriding smooth scroll', async () => {
    validator = new Validator(form, { scrollToError: true })
    const focusSpy = vi.spyOn(input2, 'focus')

    await validator.validate()
    ;(validator as any).showFormErrors()

    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('scrollToErrorDelay defaults to 0', () => {
    validator = new Validator(form)
    expect(validator.scrollToErrorDelay).toBe(0)
  })

  it('scrollToErrorDelay can be set via options', () => {
    validator = new Validator(form, { scrollToErrorDelay: 200 })
    expect(validator.scrollToErrorDelay).toBe(200)
  })

  it('delays scroll when scrollToErrorDelay is set', async () => {
    vi.useFakeTimers()
    validator = new Validator(form, { scrollToError: true, scrollToErrorDelay: 200 })
    const scrollSpy = vi.spyOn(input2, 'scrollIntoView')

    await validator.validate()
    ;(validator as any).showFormErrors()

    // Should not have scrolled yet
    expect(scrollSpy).not.toHaveBeenCalled()

    // Advance timers by the delay amount
    vi.advanceTimersByTime(200)

    // Now it should have scrolled
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })

    vi.useRealTimers()
  })

  it('scrolls immediately when scrollToErrorDelay is 0', async () => {
    validator = new Validator(form, { scrollToError: true, scrollToErrorDelay: 0 })
    const scrollSpy = vi.spyOn(input2, 'scrollIntoView')

    await validator.validate()
    ;(validator as any).showFormErrors()

    // Should scroll immediately (no setTimeout)
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
  })
})
