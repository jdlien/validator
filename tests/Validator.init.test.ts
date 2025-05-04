import Validator from '../src/Validator'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Validator', () => {
  let form: HTMLFormElement
  let formControl: HTMLInputElement
  let validator: Validator

  beforeEach(() => {
    form = document.createElement('form')
    form.id = 'test-form'
    document.body.appendChild(form)

    formControl = document.createElement('input')
    formControl.type = 'text'
    formControl.name = 'test-input'
    formControl.id = 'test-input'
    form.appendChild(formControl)

    validator = new Validator(form)
  })

  afterEach(() => {
    document.body.removeChild(form)
  })

  describe('init', () => {
    it('should set the inputs property to an array of form controls', () => {
      let input2 = document.createElement('input')
      input2.type = 'email'
      form.appendChild(input2)

      validator.init()
      expect(validator.inputs).toEqual([formControl, input2])
    })

    it('should not include elements that do not need validation in the inputs array', () => {
      // Add a fieldset element
      let fieldset = document.createElement('fieldset')

      let email = document.createElement('input')
      email.type = 'email'
      email.id = 'inputEmail'

      let input2 = document.createElement('input')
      input2.id = 'input2'

      let submit = document.createElement('input')
      submit.type = 'submit'
      submit.id = 'submitId'

      let output = document.createElement('output')
      output.id = 'outputId'

      let label = document.createElement('label')

      // Add all the elements into the input
      fieldset.appendChild(email)
      fieldset.appendChild(input2)
      fieldset.appendChild(submit)
      fieldset.appendChild(output)
      fieldset.appendChild(label)

      form.appendChild(fieldset)

      validator.init()
      expect(validator.inputs).toEqual([formControl, email, input2, submit])
    })

    it('should set the novalidate attribute on the form', () => {
      validator.init()
      expect(form.getAttribute('novalidate')).toEqual('novalidate')
    })

    it('should add and remove event listeners with the correct arguments', () => {
      const form = document.createElement('form')
      const validator = new Validator(form)

      const addEventListenerSpy = vi.spyOn(form, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(form, 'removeEventListener')

      validator.addEventListeners()
      validator.removeEventListeners()

      expect(addEventListenerSpy).toHaveBeenCalledTimes(5)
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'submit',
        (validator as any).submitHandlerRef
      )

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'input',
        (validator as any).inputInputHandlerRef
      )

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'change',
        (validator as any).inputChangeHandlerRef
      )

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        (validator as any).inputKeydownHandlerRef
      )

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(5)
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'submit',
        (validator as any).submitHandlerRef
      )

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'input',
        (validator as any).inputInputHandlerRef
      )

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'change',
        (validator as any).inputChangeHandlerRef
      )

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        (validator as any).inputKeydownHandlerRef
      )

      expect(removeEventListenerSpy).toHaveBeenCalledWith('remove', validator.destroy)
    })
  }) // init
}) // describe('Validator')
