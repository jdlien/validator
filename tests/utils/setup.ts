import Validator from '../../src/Validator'
import { ValidatorOptions } from '../../src/Validator'

export interface TestSetup {
  form: HTMLFormElement
  formControl: HTMLInputElement
  errorEl: HTMLDivElement
  options: ValidatorOptions
  validator: Validator
}

export function setupTestForm(customOptions: Partial<ValidatorOptions> = {}): TestSetup {
  const form = document.createElement('form')
  form.id = 'test-form'
  document.body.appendChild(form)

  const formControl = document.createElement('input')
  formControl.type = 'text'
  formControl.name = 'test-input'
  formControl.id = 'test-input'
  form.appendChild(formControl)

  const errorEl = document.createElement('div')
  errorEl.id = 'test-input-error'
  errorEl.classList.add('hidden')
  form.appendChild(errorEl)

  const options: ValidatorOptions = { ...customOptions }
  const validator = new Validator(form, options)

  return { form, formControl, errorEl, options, validator }
}
