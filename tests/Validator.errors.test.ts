import Validator from '../src/Validator'
import { ValidatorOptions } from '../src/Validator'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setupTestForm } from './utils/setup'

describe('Validator', () => {
  let form: HTMLFormElement
  let formControl: HTMLInputElement
  let errorEl: HTMLDivElement
  let options: ValidatorOptions
  let validator: Validator
  let valid: boolean

  beforeEach(() => {
    ;({ form, formControl, errorEl, options, validator } = setupTestForm())
  })

  afterEach(() => {
    document.body.removeChild(form)
  })

  describe('getErrorEl', () => {
    it('returns the error element for the input', () => {
      const errorEl1 = (validator as any).getErrorEl(formControl)
      expect(errorEl1).toBeTruthy()
      expect(errorEl1.id).toBe('test-input-error')
    })

    it('returns error element by id if the input does not have a name', () => {
      const formControl2 = document.createElement('input')
      formControl2.type = 'text'
      formControl2.id = 'form-control-2'
      form.appendChild(formControl2)

      const errorDiv2 = document.createElement('div')
      errorDiv2.id = 'form-control-2-error'
      form.appendChild(errorDiv2)

      const errorEl2 = (validator as any).getErrorEl(formControl2)
      expect(errorEl2).toBeTruthy()
      expect(errorEl2.id).toBe('form-control-2-error')
    })

    // Flux error messages
    it('returns error element using flux-style error elements', () => {
      // Create a flux-style field structure
      const fluxField = document.createElement('div')
      fluxField.setAttribute('data-flux-field', '')
      form.appendChild(fluxField)

      // Create the input element
      const inputContainer = document.createElement('div')
      inputContainer.setAttribute('data-flux-input', '')
      fluxField.appendChild(inputContainer)

      const fluxInput = document.createElement('input')
      fluxInput.type = 'text'
      fluxInput.setAttribute('data-flux-control', '')
      fluxInput.name = 'flux-input'
      fluxInput.id = 'flux-input-id'
      inputContainer.appendChild(fluxInput)

      // Create the error element
      const fluxError = document.createElement('div')
      fluxError.setAttribute('data-flux-error', '')
      fluxError.id = 'flux-error-id'
      fluxField.appendChild(fluxError)

      // Test that the validator finds the error element
      const errorEl = (validator as any).getErrorEl(fluxInput)
      expect(errorEl).toBeTruthy()
      expect(errorEl).toBe(fluxError)
      expect(errorEl.getAttribute('data-flux-error')).toBe('')
    })

    it('returns error element by aria-describedby if not found by name or id', () => {
      const formControl3 = document.createElement('input')
      formControl3.type = 'text'
      // Set aria-describedby
      formControl3.setAttribute('aria-describedby', 'form-control-3-error')
      formControl3.name = 'form-control-3-random'
      formControl3.id = 'form-control-3-random'
      form.appendChild(formControl3)

      const errorDiv3 = document.createElement('div')
      errorDiv3.id = 'form-control-3-error'
      form.appendChild(errorDiv3)

      const errorEl3 = (validator as any).getErrorEl(formControl3)
      expect(errorEl3).toBeTruthy()
      expect(errorEl3.id).toBe('form-control-3-error')
    })

    it('returns null if the input does not have an error element', () => {
      const formControl3 = document.createElement('input')
      formControl3.type = 'text'
      formControl3.name = 'form-control-3'
      formControl3.id = 'form-control-3'
      form.appendChild(formControl3)

      const errorEl2 = (validator as any).getErrorEl(formControl3)
      expect(errorEl2).toBeNull()
    })

    it('handles ids with special characters', () => {
      const formControl4 = document.createElement('input')
      formControl4.type = 'text'
      // Set aria-describedby
      formControl4.name = 'input[1].test'
      formControl4.id = 'input[1].test-1'
      form.appendChild(formControl4)

      const errorDiv4 = document.createElement('div')
      errorDiv4.id = 'input[1].test-1-error'
      form.appendChild(errorDiv4)

      const errorEl4 = (validator as any).getErrorEl(formControl4)
      expect(errorEl4).toBeTruthy()
      expect(errorEl4.id).toBe('input[1].test-1-error')
    })
  }) // getErrorEl

  describe('addErrorMain', () => {
    type MessageDictionary = { [key: string]: string }
    let messages: MessageDictionary
    let errorMainClasses: string

    beforeEach(() => {
      messages = { ERROR_MAIN: 'Error: main' }
      errorMainClasses = 'error-main'
      validator = new Validator(form, { messages, errorMainClasses })
    })

    it('creates an element with id "form-error-main"', () => {
      ;(validator as any).addErrorMain()
      const errorEl = form.querySelector('#form-error-main')
      expect(errorEl).toBeTruthy()
      const classes = errorMainClasses.split(' ')
      if (errorEl) expect(errorEl.classList.contains.apply(errorEl.classList, classes)).toBeTruthy()
    })

    it('sets the innerHTML of the element to message if message is provided', () => {
      const message = 'Hello, world!'
      ;(validator as any).addErrorMain(message)
      const errorEl = document.querySelector('#form-error-main')
      if (errorEl) expect(errorEl.innerHTML).toBe(message)
    })

    it('sets the innerHTML of the element to messages.ERROR_MAIN if message is not provided', () => {
      ;(validator as any).addErrorMain()
      const errorEl = document.querySelector('#form-error-main')
      if (errorEl) expect(errorEl.innerHTML).toBe(messages.ERROR_MAIN)
    })

    it('adds the element to the form', () => {
      ;(validator as any).addErrorMain()
      const errorEl = document.querySelector('#form-error-main')
      if (errorEl) expect(errorEl.parentNode).toBe(form)
    })
  }) // addErrorMain

  describe('addInputError', () => {
    it('adds an error to the inputErrors array for the given form control', () => {
      ;(validator as any).addInputError(formControl, 'invalid username')
      expect(validator.inputErrors[formControl.name]).toContain('invalid username')
    })

    it('uses the id of the form control if no name is provided', () => {
      formControl.name = ''
      ;(validator as any).addInputError(formControl, 'invalid username')
      expect(validator.inputErrors[formControl.id]).toContain('invalid username')
    })

    it('adds the error message if one is provided', () => {
      ;(validator as any).addInputError(formControl, 'test message')
      expect(validator.inputErrors[formControl.name]).toContain('test message')
    })

    it('adds the errorDefault message if no message is provided', () => {
      formControl.dataset.errorDefault = 'default error message'
      ;(validator as any).addInputError(formControl)
      expect(validator.inputErrors[formControl.name]).toContain('default error message')
    })

    it('adds the generic error message if no message or errorDefault is provided', () => {
      validator.messages.ERROR_GENERIC = 'generic error message'
      ;(validator as any).addInputError(formControl)
      expect(validator.inputErrors[formControl.name]).toContain('generic error message')
    })

    it('logs a debugging message if debug is enabled', () => {
      validator.debug = true
      const mockLog = vi.fn()
      console.log = mockLog
      ;(validator as any).addInputError(formControl, 'invalid username')
      expect(mockLog).toHaveBeenCalledWith('Invalid value for test-input: invalid username')
    })

    it('does not show the same error multiple times for a set of radio buttons', () => {
      const radio1 = document.createElement('input')
      radio1.type = 'radio'
      radio1.name = 'radio-group'
      radio1.value = '1'
      radio1.id = 'radio1'
      form.appendChild(radio1)

      const radio2 = document.createElement('input')
      radio2.type = 'radio'
      radio2.name = 'radio-group'
      radio2.value = '2'
      radio2.id = 'radio2'
      form.appendChild(radio2)
      ;(validator as any).addInputError(radio1, 'invalid radio')
      ;(validator as any).addInputError(radio2, 'invalid radio')

      expect(validator.inputErrors['radio-group'].length).toBe(1)
    })

    it('shows multiple different error messages simultaneously', () => {
      ;(validator as any).addInputError(formControl, 'error message 1')
      ;(validator as any).addInputError(formControl, 'error message 2')

      expect(validator.inputErrors[formControl.name].length).toBe(2)
    })
  }) // end addInputError

  describe('showInputErrors', () => {
    it('returns if the input has no name or id', () => {
      formControl.name = ''
      formControl.id = ''
      ;(validator as any).showInputErrors(formControl)
      expect(formControl.classList.contains('error')).toBeFalsy()
    })

    it('uses id as error key if name is not provided', () => {
      formControl.name = ''
      formControl.id = 'input-id'
      validator.init()
      // Add input error and show it
      ;(validator as any).addInputError(formControl)
      ;(validator as any).showInputErrors(formControl)
      expect(validator.inputErrors['input-id']).toBeTruthy()
      validator.errorInputClasses.split(' ').forEach((errorClass) => {
        expect(formControl.classList.contains(errorClass)).toBeTruthy()
      })
    })

    it('adds an empty array for the element if no inputError array already exists', () => {
      formControl.name = 'test-input'
      validator.inputErrors = {}
      console.log(validator.inputErrors)
      ;(validator as any).showInputErrors(formControl)
      expect(validator.inputErrors['test-input']).toBeFalsy()
    })

    it('shows an error message', () => {
      // First add an error
      ;(validator as any).addInputError(formControl)
      ;(validator as any).showInputErrors(formControl)

      expect(errorEl.innerHTML).toBe(validator.messages.ERROR_GENERIC)
      expect(errorEl.classList.contains('hidden')).toBeFalsy()

      validator.errorInputClasses.split(' ').forEach((errorClass) => {
        expect(formControl.classList.contains(errorClass)).toBeTruthy()
      })
    })
  }) // end showInputErrors

  describe('showFormErrors', () => {
    it('should show errors for all inputs and display main error message', async () => {
      const input1 = document.createElement('input')
      input1.name = 'input1'
      input1.id = 'input1'
      input1.required = true
      input1.value = ''
      form.appendChild(input1)

      const input1Error = document.createElement('div')
      input1Error.id = 'input1-error'
      form.appendChild(input1Error)

      const input2 = document.createElement('input')
      input2.name = 'input2'
      input2.id = 'input2'
      input2.pattern = '[0-9]+'
      input2.value = 'abc'
      form.appendChild(input2)

      const input2Error = document.createElement('div')
      input2Error.id = 'input2-error'
      form.appendChild(input2Error)

      validator.init()
      valid = await validator.validate()
      ;(validator as any).showFormErrors()

      const input1Errors = validator.inputErrors[input1.id]
      expect(input1Errors).toHaveLength(1)
      expect(input1Error?.innerHTML).toContain(validator.messages.ERROR_REQUIRED)

      const input2Errors = validator.inputErrors[input2.id]
      expect(input2Errors).toHaveLength(1)
      expect(input2Error?.innerHTML).toContain(validator.messages.ERROR_GENERIC)

      const mainError = form.querySelectorAll('#form-error-main')

      mainError.forEach((error) => {
        expect(error).toBeTruthy()
        expect(error?.innerHTML).toContain(validator.messages.ERROR_MAIN)
        // Check that this uses the default hidden classes (hidden, opacity-0)
        expect(error.classList.contains('hidden')).toBeFalsy()
        expect(error.classList.contains('opacity-0')).toBeFalsy()
      })

      // Now that we already have a mainErrorEl, check that it doesn't get added again
      ;(validator as any).showFormErrors()
      expect(form.querySelectorAll('#form-error-main')).toHaveLength(1)

      // Check that the messages and styling are still correct on the second addition
      mainError.forEach((error) => {
        expect(error).toBeTruthy()
        expect(error?.innerHTML).toContain(validator.messages.ERROR_MAIN)
        // Check that this uses the default hidden classes (hidden, opacity-0)
        expect(error.classList.contains('hidden')).toBeFalsy()
        expect(error.classList.contains('opacity-0')).toBeFalsy()
      })
    })

    it('should not display main error message if there are no input errors', async () => {
      const input1 = document.createElement('input')
      input1.name = 'input1'
      input1.id = 'input1'
      input1.required = true
      input1.value = 'abc'
      form.appendChild(input1)

      // Wait 60ms for debounce of init after adding new input
      await new Promise((resolve) => setTimeout(resolve, 50))

      valid = await validator.validate()
      ;(validator as any).showFormErrors()

      const input1Errors = validator.inputErrors[input1.id]
      expect(input1Errors).toHaveLength(0)

      const mainError = form.querySelector('#form-error-main')
      expect(mainError).toBeFalsy()
    })

    it('should show the the main error message if the mailErrorEl is empty', () => {
      // Ensure the mainErrorEl already exists. We need an error for it to show
      ;(validator as any).addInputError(formControl)
      ;(validator as any).showFormErrors()
      document.querySelectorAll('#form-error-main').forEach((error) => {
        error.innerHTML = ''
      })

      // Now call showFormErrors again
      ;(validator as any).showFormErrors()
      document.querySelectorAll('#form-error-main').forEach((error) => {
        expect(error.innerHTML).toContain(validator.messages.ERROR_MAIN)
      })
    })

    it('should not display main error message if showMainError is false', async () => {
      // Create a validator with showMainError set to false
      options.showMainError = false
      validator = new Validator(form, options)

      const input1 = document.createElement('input')
      input1.name = 'input1'
      input1.id = 'input1'
      input1.required = true
      input1.value = ''
      form.appendChild(input1)

      const input1Error = document.createElement('div')
      input1Error.id = 'input1-error'
      form.appendChild(input1Error)

      validator.init()
      valid = await validator.validate()
      ;(validator as any).showFormErrors()

      // Verify the input error is shown
      const input1Errors = validator.inputErrors[input1.id]
      expect(input1Errors).toHaveLength(1)
      expect(input1Error?.innerHTML).toContain(validator.messages.ERROR_REQUIRED)

      // Verify the main error is not shown
      const mainError = form.querySelector('#form-error-main')
      expect(mainError).toBeFalsy()
    })

    it('should display main error message if showMainError is true', async () => {
      // Create a validator with showMainError explicitly set to true
      options.showMainError = true
      validator = new Validator(form, options)

      const input1 = document.createElement('input')
      input1.name = 'input1'
      input1.id = 'input1'
      input1.required = true
      input1.value = ''
      form.appendChild(input1)

      const input1Error = document.createElement('div')
      input1Error.id = 'input1-error'
      form.appendChild(input1Error)

      validator.init()
      valid = await validator.validate()
      ;(validator as any).showFormErrors()

      // Verify the input error is shown
      const input1Errors = validator.inputErrors[input1.id]
      expect(input1Errors).toHaveLength(1)
      expect(input1Error?.innerHTML).toContain(validator.messages.ERROR_REQUIRED)

      // Verify the main error is shown
      const mainError = form.querySelector('#form-error-main')
      expect(mainError).toBeTruthy()
      expect(mainError?.innerHTML).toContain(validator.messages.ERROR_MAIN)
    })

    it('should use form-id-error-main element if form has an ID and the element exists', async () => {
      // Set up a form with an ID
      form.id = 'test-form-with-id'

      // Create a form-specific error element
      const formSpecificError = document.createElement('div')
      formSpecificError.id = 'test-form-with-id-error-main'
      formSpecificError.classList.add('hidden', 'opacity-0')
      form.appendChild(formSpecificError)

      // Add an invalid input to trigger error display
      const input = document.createElement('input')
      input.required = true
      input.value = ''
      form.appendChild(input)

      validator.init()
      valid = await validator.validate()
      ;(validator as any).showFormErrors()

      // Verify the form-specific error is shown
      expect(formSpecificError.classList.contains('hidden')).toBeFalsy()
      expect(formSpecificError.innerHTML).toContain(validator.messages.ERROR_MAIN)

      // Verify no generic form-error-main was created
      expect(form.querySelectorAll('#form-error-main')).toHaveLength(0)
    })

    it('should fall back to form-error-main if form has ID but form-id-error-main element does not exist', async () => {
      // Set up a form with an ID but no corresponding error element
      form.id = 'test-form-fallback'

      // Add an invalid input to trigger error display
      const input = document.createElement('input')
      input.required = true
      input.value = ''
      form.appendChild(input)

      validator.init()
      valid = await validator.validate()
      ;(validator as any).showFormErrors()

      // Verify a generic form-error-main was created
      const fallbackError = form.querySelector('#form-error-main')
      expect(fallbackError).toBeTruthy()
      expect(fallbackError?.innerHTML).toContain(validator.messages.ERROR_MAIN)
    })

    it('should use form-error-main if form has no ID', async () => {
      // Ensure form has no ID
      form.removeAttribute('id')

      // Add an invalid input to trigger error display
      const input = document.createElement('input')
      input.required = true
      input.value = ''
      form.appendChild(input)

      validator.init()
      valid = await validator.validate()
      ;(validator as any).showFormErrors()

      // Verify a generic form-error-main was created
      const genericError = form.querySelector('#form-error-main')
      expect(genericError).toBeTruthy()
      expect(genericError?.innerHTML).toContain(validator.messages.ERROR_MAIN)
    })

    it('should use existing form-specific error element if present', async () => {
      // Set up a form with an ID
      form.id = 'test-form-both'

      // Create a form-specific error element
      const formSpecificError = document.createElement('div')
      formSpecificError.id = 'test-form-both-error-main'
      formSpecificError.classList.add('hidden', 'opacity-0')
      form.appendChild(formSpecificError)

      // Add an invalid input to trigger error display
      const input = document.createElement('input')
      input.required = true
      input.value = ''
      form.appendChild(input)

      validator.init()
      valid = await validator.validate()
      ;(validator as any).showFormErrors()

      // Verify the form-specific error is shown
      expect(formSpecificError.classList.contains('hidden')).toBeFalsy()
      expect(formSpecificError.innerHTML).toContain(validator.messages.ERROR_MAIN)
    })
  }) // end showFormErrors

  describe('clearInputErrors', () => {
    it('clears an error message', () => {
      errorEl.textContent = 'An error message!'
      ;(validator as any).clearInputErrors(formControl)
      expect(validator.inputErrors[formControl.name]).toEqual([])
      expect(errorEl.innerHTML).toBe('')
      expect(errorEl.classList.contains('hidden')).toBeTruthy()

      validator.errorInputClasses.split(' ').forEach((errorClass) => {
        expect(formControl.classList.contains(errorClass)).toBeFalsy()
      })
    })

    it('clears the correct error message if an input has no name but has an id', () => {
      formControl.name = ''
      formControl.id = 'input-id'
      validator.init()
      // Add input error and show it
      ;(validator as any).addInputError(formControl)
      ;(validator as any).showInputErrors(formControl)
      expect(validator.inputErrors['input-id']).toBeTruthy()

      // Now clear the error
      ;(validator as any).clearInputErrors(formControl)
      expect(validator.inputErrors['input-id']).toEqual([])
      // Note: also checks that clearInputErrors will return if there's no errorEl
    })
  }) // end clearInputErrors

  describe('clearFormErrors', () => {
    it('clears all error messages', () => {
      form.id = 'clear-all-errors-form'
      const formControl1 = document.createElement('input')
      formControl1.type = 'text'
      formControl1.id = 'test-input-1'
      formControl1.name = 'test-input-1'
      form.appendChild(formControl1)

      const errorEl1 = document.createElement('div')
      errorEl1.id = 'test-input-1-error'
      errorEl1.textContent = 'An error message!'
      form.appendChild(errorEl1)

      const formControl2 = document.createElement('input')
      formControl2.type = 'text'
      formControl2.id = 'test-input-2'
      formControl2.name = 'test-input-2'
      form.appendChild(formControl2)

      const errorEl2 = document.createElement('div')
      errorEl2.id = 'test-input-2-error'
      errorEl2.textContent = 'Another error message!'
      form.appendChild(errorEl2)

      validator.init()
      ;(validator as any).addInputError(formControl1)
      ;(validator as any).addInputError(formControl2)

      expect(validator.inputErrors[formControl1.name]).toContain(validator.messages.ERROR_GENERIC)
      expect(validator.inputErrors[formControl2.name]).toContain(validator.messages.ERROR_GENERIC)
      ;(validator as any).clearFormErrors()

      // validator.inputErrors should be empty
      expect(Object.values(validator.inputErrors).every((i) => i.length == 0)).toBeTruthy()

      // aria-invalid should not be set
      expect(formControl1.getAttribute('aria-invalid')).toBeNull()
      expect(formControl2.getAttribute('aria-invalid')).toBeNull()

      expect(errorEl1.innerHTML).toBe('')
      expect(errorEl1.classList.contains('hidden')).toBeTruthy()

      expect(errorEl2.innerHTML).toBe('')
      expect(errorEl2.classList.contains('hidden')).toBeTruthy()

      validator.errorInputClasses.split(' ').forEach((errorClass) => {
        expect(formControl1.classList.contains(errorClass)).toBeFalsy()
        expect(formControl2.classList.contains(errorClass)).toBeFalsy()
      })
    })

    it('adds hidden classes to form-error-main', async () => {
      formControl.required = true
      formControl.value = ''
      valid = await validator.validate()
      ;(validator as any).showFormErrors()

      const mainError = form.querySelector('#form-error-main')
      expect(mainError).toBeTruthy()
      ;(validator as any).clearFormErrors()

      const mainErrorClassList = mainError?.classList
      expect(mainErrorClassList?.contains('hidden')).toBeTruthy()
      expect(mainErrorClassList?.contains('opacity-0')).toBeTruthy()
    })
  }) // end clearFormErrors
}) // describe('Validator')
