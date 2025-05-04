import Validator from '../src/Validator'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Validator', () => {
  let form: HTMLFormElement
  let formControl: HTMLInputElement
  let errorEl: HTMLDivElement
  let validator: Validator
  let valid: boolean

  beforeEach(() => {
    form = document.createElement('form')
    form.id = 'test-form'
    document.body.appendChild(form)

    formControl = document.createElement('input')
    formControl.type = 'text'
    formControl.name = 'test-input'
    formControl.id = 'test-input'
    form.appendChild(formControl)

    errorEl = document.createElement('div')
    errorEl.id = 'test-input-error'
    errorEl.classList.add('hidden')
    form.appendChild(errorEl)

    validator = new Validator(form)
  })

  afterEach(() => {
    document.body.removeChild(form)
  })

  // This version only tests the base functionality of the validateInputType method
  // It doesn't test the parsing of dates, times, or colors, those will be tested in their own tests
  describe('validateInputType base', () => {
    it('calls the correct parse and valid methods for number', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'number'
      formControl.value = '10'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.number, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.number, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.dateFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('calls the correct parse and valid methods for integer', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'integer'
      formControl.value = '10'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.integer, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.integer, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.dateFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('calls the correct parse and valid methods for tel', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'tel'
      formControl.value = '780-700-0000'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.tel, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.tel, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.dateFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('calls the correct parse and valid methods for email', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'email'
      formControl.value = 'email@example.com'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.email, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.email, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.dateFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('calls the correct parse and valid methods for zip', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'zip'
      formControl.value = '90210'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.zip, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.zip, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.dateFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)
    })

    it('calls the correct parse and valid methods for postal', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'postal'
      formControl.value = 'T5A 0A1'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.postal, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.postal, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.dateFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('calls the correct parse and valid methods for url', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'url'
      formControl.value = 'https://example.com'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.url, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.url, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.dateFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('calls the correct parse and valid methods for date with default format', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'date'
      formControl.value = '2020-Jan-01'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.date, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.date, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.dateFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('calls the correct parse and valid methods for date with different date format', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'date'
      formControl.value = '2020-01-01'
      formControl.dataset.dateFormat = 'YYYY-MM-DD'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.date, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.date, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.dateFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('calls the correct parse and valid methods for datetime', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'datetime'
      const value = '2024-01-01 20:01'
      formControl.value = value
      formControl.dataset.dateFormat = 'YYYY-MMM-DD h:mm A'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.datetime, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.datetime, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(value, formControl.dataset.dateFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('calls the correct parse and valid methods for time', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'time'
      formControl.value = '20:01'
      formControl.dataset.timeFormat = 'HH:mm'

      const parseSpy = vi.spyOn((validator as any).inputHandlers.time, 'parse')
      const isValidSpy = vi.spyOn((validator as any).inputHandlers.time, 'isValid')

      valid = (validator as any).validateInputType(formControl)

      expect(parseSpy).toHaveBeenCalledWith(formControl.value, formControl.dataset.timeFormat)
      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)

      expect(valid).toBeTruthy()
    })

    it('returns true if there is no matching inputHandler', () => {
      formControl.type = 'text'
      formControl.value = 'test'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
    })

    it('returns false if the inputHandler returns false', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'number'
      formControl.value = 'test'

      const isValidSpy = vi.spyOn((validator as any).inputHandlers.number, 'isValid')

      isValidSpy.mockImplementation(() => false)

      valid = (validator as any).validateInputType(formControl)

      expect(isValidSpy).toHaveBeenCalledWith(formControl.value)
      expect(valid).toBeFalsy()
    })

    it('does not update the value if the input is a native date input', () => {
      formControl.type = 'date'
      formControl.value = '2020-01-01'
      formControl.dataset.dateFormat = 'YYYY-MMM-DD'

      // Note that the value doesn't match the date format, so normally parse would update the value

      valid = (validator as any).validateInputType(formControl)

      expect(formControl.value).toBe('2020-01-01')

      expect(valid).toBeTruthy()
    })

    it('does update the value if the input is a data-date input', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'date'
      formControl.value = '2020-01-01'
      formControl.dataset.dateFormat = 'YYYY-MMM-DD'

      // Note that the value doesn't match the date format, so normally parse would update the value

      valid = (validator as any).validateInputType(formControl)

      expect(formControl.value).toBe('2020-Jan-01')

      expect(valid).toBeTruthy()
    })
  }) // end validateInputType base

  // This version tests the functionality of each input handler type with some examples.
  describe('validateInputType', () => {
    let formControlColor: HTMLInputElement

    // I'll not support unicode addresses for now.
    const emailAddresses = ['email@example.com', 'email+tag@example.com']

    const invalidEmailAddresses = ['john.doe@', 'john.doe@.com']

    const times = [
      ['12:00', '12:00 PM'],
      ['12:00:00', '12:00 PM'],
      ['1p', '1:00 PM'],
      ['1 pm', '1:00 PM'],
      ['132', '1:32 AM'],
      ['132pm', '1:32 PM'],
    ]

    const invalidTimes = ['asdf']

    const colors = [
      { name: 'red', value: '#ff0000', rgb: 'rgb(255, 0, 0)', hsl: 'hsl(0, 100%, 50%)' },
      { name: 'green', value: '#008000', rgb: 'rgb(0, 128, 0)', hsl: 'hsl(120, 100%, 25%)' },
      { name: 'blue', value: '#0000ff', rgb: 'rgb(0, 0, 255)', hsl: 'hsl(240, 100%, 50%)' },
      { name: 'yellow', value: '#ffff00', rgb: 'rgb(255, 255, 0)', hsl: 'hsl(60, 100%, 50%)' },
      { name: 'cyan', value: '#00ffff', rgb: 'rgb(0, 255, 255)', hsl: 'hsl(180, 100%, 50%)' },
      { name: 'magenta', value: '#ff00ff', rgb: 'rgb(255, 0, 255)', hsl: 'hsl(300, 100%, 50%)' },
      { name: 'black', value: '#000000', rgb: 'rgba(0, 0, 0)', hsl: 'hsl(0 0% 0%)' },
      { name: 'white', value: '#ffffff', rgb: 'rgb(255, 255, 255)', hsl: 'hsl(0 0% 100%)' },
    ]

    const invalidColors = ['asdf', '#ff000', '#ff00000', '#ff0000f', 'rgb()', 'rgb(0, 0, )']

    beforeEach(() => {
      formControlColor = document.createElement('input')
      formControlColor.type = 'color'
      formControlColor.id = 'test-input-color'
      formControlColor.name = 'test-input-color'
      form.appendChild(formControlColor)
      validator.init()
    })

    it('returns true if the input type was not matched to anything', () => {
      formControl.type = 'nothing'
      formControl.dataset.type = 'nothing'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeTruthy()
      expect(validator.inputErrors[formControl.name]).toEqual([])
    })

    it('should not replace the value for native date type', () => {
      formControl.type = 'date'
      formControl.value = '2019-01-01'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('2019-01-01')
      expect(validator.inputErrors[formControl.name]).toEqual([])
    })

    it('should replace the value for data-type=date', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'date'
      formControl.value = '2032-01-01'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('2032-Jan-01')
      expect(validator.inputErrors[formControl.name]).toEqual([])

      // test with a different date format
      formControl.dataset.dateFormat = 'MMMM D, YY'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('January 1, 32')
      expect(validator.inputErrors[formControl.name]).toEqual([])
    })

    it('should parse and validate number type correctly', () => {
      formControl.setAttribute('data-type', 'number')
      formControl.value = '12.5'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('12.5')
      expect(validator.inputErrors[formControl.name]).toEqual([])

      formControl.value = '-1asdf5'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('-15')
      expect(validator.inputErrors[formControl.name]).toEqual([])
    })

    it('should parse and validate integer type correctly', () => {
      formControl.type = 'text'
      formControl.setAttribute('data-type', 'integer')
      formControl.value = '1230098'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('1230098')
      expect(validator.inputErrors[formControl.name]).toEqual([])

      formControl.value = '123.098'
      valid = (validator as any).validateInputType(formControl)
      // Remove non-numeric characters
      expect(formControl.value).toBe('123098')
      expect(valid).toBeTruthy()

      // If the value contains no number it will not be parsed
      formControl.value = 'asdf'
      valid = (validator as any).validateInputType(formControl)
      // Remove non-numeric characters
      expect(formControl.value).toBe('asdf')
      expect(valid).toBeFalsy()
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_INTEGER)
    })

    it('should parse and validate tel type correctly', () => {
      formControl.type = 'tel'
      formControl.value = '923-456-7890'

      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('923-456-7890')
      expect(validator.inputErrors[formControl.name]).toEqual([])

      // Leading 1 should be removed
      formControl.value = '12345678900'

      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('234-567-8900')
      expect(validator.inputErrors[formControl.name]).toEqual([])

      // If a number isn't a phone number, it won't be parsed (other than removing a leading 1)
      formControl.value = '123456789'

      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeFalsy()
      expect(formControl.value).toBe('23456789')
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_TEL)
    })

    it('should parse and validate email type correctly', () => {
      formControl.type = 'email'
      formControl.dataset.type = 'email'
      formControl.value = 'email@example.com'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('email@example.com')

      formControl.value = 'email@example'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeFalsy()
      expect(formControl.value).toBe('email@example')
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_EMAIL)
    })

    // Test a bunch of valid but odd-looking email addresses
    emailAddresses.forEach((email) => {
      it(`should parse and validate the email "${email}" correctly`, () => {
        formControl.type = 'email'
        formControl.dataset.type = 'email'
        formControl.value = email

        valid = (validator as any).validateInputType(formControl)

        expect(valid).toBeTruthy()
        expect(formControl.value).toBe(email)
      })
    })

    invalidEmailAddresses.forEach((email) => {
      it(`should fail the string "${email}" as an invalid email address`, () => {
        formControl.type = 'email'
        formControl.dataset.type = 'email'
        formControl.value = email

        valid = (validator as any).validateInputType(formControl)

        expect(valid).toBeFalsy()
        expect(formControl.value).toBe(email)
        expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_EMAIL)
      })
    })

    it('should parse and validate postal type correctly', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'postal'
      formControl.value = 'T5Y3J5'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('T5Y 3J5')

      formControl.value = '1234'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeFalsy()
      expect(formControl.value).toBe('123 4')
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_POSTAL)
    })

    it('should parse and validate url type correctly, adding https:// if no protocol specified', () => {
      formControl.type = 'url'
      formControl.dataset.type = 'url'
      formControl.value = 'www.example.com/'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('https://www.example.com/')

      formControl.value = 'http://123example.com'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('http://123example.com')
    })

    it('should parse and validate dates', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'date'
      formControl.value = '2019-01-01'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('2019-Jan-01')

      formControl.value = '2019-01-32'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeFalsy()
      expect(formControl.value).toBe('2019-01-32')
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_DATE)
    })

    it('should parse and validate dates with a custom format', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'date'
      formControl.dataset.dateFormat = 'YYYY/MM/DD'
      formControl.value = '2019-Jan/13'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('2019/01/13')

      formControl.value = '2019/Jan/32'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeFalsy()
      expect(formControl.value).toBe('2019/Jan/32')
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_DATE)
    })

    it('should parse and validate datetimes', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'datetime'
      formControl.value = '2019-01-01'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('2019-Jan-01 12:00 AM')

      formControl.value = '2019-01-01 17:00'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('2019-Jan-01 5:00 PM')

      formControl.value = '2019-01-01 5:0P'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('2019-Jan-01 5:00 PM')

      formControl.value = '2019-01-32'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeFalsy()
      expect(formControl.value).toBe('2019-01-32')
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_DATETIME)
    })

    it('should parse and validate times', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'time'
      formControl.value = '13:00'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('1:00 PM')

      formControl.value = 'now'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeTruthy()
      // Get the current time in the format I want to test against
      let now = new Date()
      let hours = now.getHours()
      let minutes = now.getMinutes()
      let ampm = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12
      hours = hours ? hours : 12 // the hour '0' should be '12'
      let strTime = hours + ':' + (minutes < 10 ? '0' + minutes : minutes) + ' ' + ampm

      expect(formControl.value).toBe(strTime)

      formControl.value = '25:00'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeFalsy()
      expect(formControl.value).toBe('25:00')
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_TIME)
    })

    // Test a bunch of valid times
    times.forEach((time) => {
      it(`should parse and validate the time "${time[0]}" correctly`, () => {
        formControl.type = 'text'
        formControl.dataset.type = 'time'
        formControl.value = time[0]

        valid = (validator as any).validateInputType(formControl)

        expect(valid).toBeTruthy()
        // I need a new array of the times in the format I want to test against
        expect(formControl.value).toBe(time[1])
      })
    })

    invalidTimes.forEach((time) => {
      it(`should fail the string "${time}" as an invalid time`, () => {
        formControl.type = 'text'
        formControl.dataset.type = 'time'
        formControl.value = time

        valid = (validator as any).validateInputType(formControl)

        expect(valid).toBeFalsy()
        expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_TIME)
      })
    })

    it('should parse and validate colors', () => {
      formControl.type = 'text'
      formControl.dataset.type = 'color'
      formControl.value = '#123456'

      valid = (validator as any).validateInputType(formControl)

      expect(valid).toBeTruthy()
      expect(formControl.value).toBe('#123456')

      formControl.value = '#1234567'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeFalsy()
      expect(formControl.value).toBe('#1234567')
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_COLOR)

      formControl.value = 'transparent'
      valid = (validator as any).validateInputType(formControl)
      expect(valid).toBeTruthy()
    })

    // Test a bunch of valid but odd-looking colors
    colors.forEach((color) => {
      it(`should parse and validate the color "${color.name}" correctly`, () => {
        formControl.type = 'text'
        formControl.dataset.type = 'color'

        // We ignore black because we use a transparent color that isn't technically 'black'
        formControl.value = color.name
        valid = (validator as any).validateInputType(formControl)
        expect(valid).toBeTruthy()
        expect(formControl.value).toBe(color.name)

        // Trigger an input event and check the value of the associated color input
        formControl.dispatchEvent(new Event('input', { bubbles: true }))
        expect(formControlColor.value).toBe(color.value)

        formControl.value = color.rgb
        valid = (validator as any).validateInputType(formControl)
        expect(valid).toBeTruthy()
        expect(formControl.value).toBe(color.rgb)

        formControl.dispatchEvent(new Event('input', { bubbles: true }))
        expect(formControlColor.value).toBe(color.value)

        formControl.value = color.hsl
        valid = (validator as any).validateInputType(formControl)
        expect(valid).toBeTruthy()
        expect(formControl.value).toBe(color.hsl)

        formControl.dispatchEvent(new Event('input', { bubbles: true }))
        expect(formControlColor.value).toBe(color.value)

        formControl.value = color.value
        valid = (validator as any).validateInputType(formControl)
        expect(valid).toBeTruthy()
        expect(formControl.value).toBe(color.value)

        formControl.dispatchEvent(new Event('input', { bubbles: true }))
        expect(formControlColor.value).toBe(color.value)
      })
    })

    invalidColors.forEach((color) => {
      it(`should fail the string "${color}" as an invalid color`, () => {
        formControl.type = 'text'
        formControl.dataset.type = 'color'
        formControl.value = color

        valid = (validator as any).validateInputType(formControl)

        expect(valid).toBeFalsy()
        expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_COLOR)
      })
    })
  }) // end validateInputType
}) // end describe('Validator')
