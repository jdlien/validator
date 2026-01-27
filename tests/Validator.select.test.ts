import Validator from '../src/Validator'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Validator select element', () => {
  let form: HTMLFormElement
  let select: HTMLSelectElement
  let errorEl: HTMLDivElement
  let validator: Validator

  beforeEach(() => {
    form = document.createElement('form')
    form.id = 'test-form'
    document.body.appendChild(form)

    select = document.createElement('select')
    select.name = 'test-select'
    select.id = 'test-select'
    select.required = true
    form.appendChild(select)

    // Add empty option and valid options
    const emptyOption = document.createElement('option')
    emptyOption.value = ''
    emptyOption.textContent = 'Select an option'
    select.appendChild(emptyOption)

    const option1 = document.createElement('option')
    option1.value = 'red'
    option1.textContent = 'Red'
    select.appendChild(option1)

    const option2 = document.createElement('option')
    option2.value = 'green'
    option2.textContent = 'Green'
    select.appendChild(option2)

    // Create error element
    errorEl = document.createElement('div')
    errorEl.id = 'test-select-error'
    errorEl.className = 'error hidden'
    form.appendChild(errorEl)

    validator = new Validator(form, { hiddenClasses: 'hidden' })
  })

  afterEach(() => {
    if (document.body.contains(form)) {
      document.body.removeChild(form)
    }
  })

  it('validates required select with no value as invalid', async () => {
    select.value = ''
    const isValid = await validator.validate()

    expect(isValid).toBe(false)
    expect(validator.inputErrors['test-select']).toContain(validator.messages.ERROR_REQUIRED)
  })

  it('validates required select with valid value as valid', async () => {
    select.value = 'red'
    const isValid = await validator.validate()

    expect(isValid).toBe(true)
    // inputErrors array exists but should be empty (no errors)
    expect(validator.inputErrors['test-select']?.length ?? 0).toBe(0)
  })

  it('clears error when valid option is selected via change event', async () => {
    // First, trigger validation to create error
    select.value = ''
    await validator.validate()
    ;(validator as any).showFormErrors()

    // Verify error exists
    expect(validator.inputErrors['test-select']).toContain(validator.messages.ERROR_REQUIRED)
    expect(errorEl.classList.contains('hidden')).toBe(false)

    // Now select a valid option and trigger change event
    select.value = 'red'
    select.dispatchEvent(new Event('change', { bubbles: true }))

    // Error should be cleared from inputErrors (empty array)
    expect(validator.inputErrors['test-select']?.length ?? 0).toBe(0)
    // Error element should be hidden
    expect(errorEl.classList.contains('hidden')).toBe(true)
  })

  it('handles select element in inputChangeHandler', async () => {
    // This test specifically verifies the inputChangeHandler processes select elements
    select.value = ''
    await validator.validate()
    ;(validator as any).showFormErrors()

    expect(errorEl.classList.contains('hidden')).toBe(false)

    // Simulate selecting a valid option
    select.value = 'red'

    // The change handler should process select elements
    const changeEvent = new Event('change', { bubbles: true })
    Object.defineProperty(changeEvent, 'target', { value: select })
    await (validator as any).inputChangeHandler(changeEvent)

    // After change handler runs, error should be cleared
    expect(errorEl.classList.contains('hidden')).toBe(true)
  })
})
