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

  describe('validateDateRange', () => {
    beforeEach(() => {
      formControl.type = 'text'
      formControl.name = 'test-date'
      formControl.id = 'test-date'
      formControl.dataset.type = 'date'
    })

    it('should return true if no date range specified', () => {
      formControl.value = '2022-01-01'
      expect((validator as any).validateDateRange(formControl)).toBe(true)
    })

    it('should add an error message and return false if the date is not in the past', () => {
      formControl.dataset.dateRange = 'past'
      formControl.value = '2093-01-01'
      expect((validator as any).validateDateRange(formControl)).toBe(false)
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_DATE_PAST)
    })

    it('should add an error message and return false if the date is not in the future', () => {
      formControl.dataset.dateRange = 'future'
      formControl.value = '2003-01-01'
      expect((validator as any).validateDateRange(formControl)).toBe(false)
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_DATE_FUTURE
      )
    })

    it('should return true if the date is in the past', () => {
      formControl.dataset.dateRange = 'past'
      formControl.value = '2003-01-01'
      expect((validator as any).validateDateRange(formControl)).toBe(true)
    })

    it('should return true if the date is in the future', () => {
      formControl.dataset.dateRange = 'future'
      formControl.value = '2093-01-01'
      expect((validator as any).validateDateRange(formControl)).toBe(true)
    })
  }) // end validateDateRange

  describe('validatePattern', () => {
    it('should return true if no pattern specified', () => {
      formControl.value = 'test'
      expect((validator as any).validatePattern(formControl)).toBe(true)
    })

    it('should return true if the pattern matches', () => {
      formControl.dataset.pattern = '^[a-z]+$'
      formControl.value = 'test'
      expect((validator as any).validatePattern(formControl)).toBe(true)
    })

    it('should add an error message and return false if the pattern does not match', () => {
      formControl.dataset.pattern = '^[a-z]+$'
      formControl.value = 'test123'
      expect((validator as any).validatePattern(formControl)).toBe(false)
      expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_GENERIC)
    })
  }) // end validatePattern
})
