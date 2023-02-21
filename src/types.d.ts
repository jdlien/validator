/** @format */

export type FormControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

export interface ValidatorOptions {
  messages?: object
  debug?: boolean
  autoInit?: boolean
  preventSubmit?: boolean
  hiddenClasses?: string
  errorMainClasses?: string
  errorInputClasses?: string
  validationSuccessCallback?: (event: Event) => void
  validationErrorCallback?: (event: Event) => void
}

export interface InputHandlers {
  [key: string]: {
    parse: (value: string, dateFormat?: string) => string
    isValid: (value: string) => boolean
    error: string
  }
}
