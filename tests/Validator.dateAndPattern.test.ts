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

    describe('today keyword', () => {
      it('should return true if the date is today', () => {
        formControl.dataset.dateRange = 'today'
        const today = new Date()
        formControl.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        expect((validator as any).validateDateRange(formControl)).toBe(true)
      })

      it('should return false with ERROR_DATE_TODAY if the date is not today', () => {
        formControl.dataset.dateRange = 'today'
        formControl.value = '2020-01-01'
        expect((validator as any).validateDateRange(formControl)).toBe(false)
        expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_DATE_TODAY)
      })
    })

    describe('specific date ranges', () => {
      it('should return true if date is within range', () => {
        formControl.dataset.dateRange = '2023-01-01:2023-12-31'
        formControl.value = '2023-06-15'
        expect((validator as any).validateDateRange(formControl)).toBe(true)
      })

      it('should return false if date is before range', () => {
        formControl.dataset.dateRange = '2023-01-01:2023-12-31'
        formControl.value = '2022-06-15'
        expect((validator as any).validateDateRange(formControl)).toBe(false)
        expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_DATE_RANGE)
      })

      it('should return false if date is after range', () => {
        formControl.dataset.dateRange = '2023-01-01:2023-12-31'
        formControl.value = '2024-06-15'
        expect((validator as any).validateDateRange(formControl)).toBe(false)
      })

      it('should include boundary dates', () => {
        formControl.dataset.dateRange = '2023-01-01:2023-12-31'
        formControl.value = '2023-01-01'
        expect((validator as any).validateDateRange(formControl)).toBe(true)
        formControl.value = '2023-12-31'
        expect((validator as any).validateDateRange(formControl)).toBe(true)
      })
    })

    describe('open-ended ranges', () => {
      it('should validate :DATE (on or before)', () => {
        formControl.dataset.dateRange = ':2025-12-31'
        formControl.value = '2020-01-01'
        expect((validator as any).validateDateRange(formControl)).toBe(true)
        formControl.value = '2026-01-01'
        validator.inputErrors[formControl.name] = []
        expect((validator as any).validateDateRange(formControl)).toBe(false)
      })

      it('should validate DATE: (on or after)', () => {
        formControl.dataset.dateRange = '2020-01-01:'
        formControl.value = '2025-01-01'
        expect((validator as any).validateDateRange(formControl)).toBe(true)
        formControl.value = '2019-01-01'
        validator.inputErrors[formControl.name] = []
        expect((validator as any).validateDateRange(formControl)).toBe(false)
      })
    })

    describe('relative offsets', () => {
      it('should validate -30d:+30d (within 30 days)', () => {
        formControl.dataset.dateRange = '-30d:+30d'
        const today = new Date()
        formControl.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        expect((validator as any).validateDateRange(formControl)).toBe(true)
      })

      it('should reject dates outside relative range', () => {
        formControl.dataset.dateRange = '-30d:+30d'
        formControl.value = '2020-01-01' // Well outside range
        expect((validator as any).validateDateRange(formControl)).toBe(false)
      })

      it('should validate :-18y (18 years ago or earlier)', () => {
        formControl.dataset.dateRange = ':-18y'
        formControl.value = '2000-01-01' // More than 18 years ago
        expect((validator as any).validateDateRange(formControl)).toBe(true)
      })

      it('should validate :+6m (up to 6 months from now)', () => {
        formControl.dataset.dateRange = ':+6m'
        const threeMonths = new Date()
        threeMonths.setMonth(threeMonths.getMonth() + 3)
        formControl.value = `${threeMonths.getFullYear()}-${String(threeMonths.getMonth() + 1).padStart(2, '0')}-${String(threeMonths.getDate()).padStart(2, '0')}`
        expect((validator as any).validateDateRange(formControl)).toBe(true)
      })
    })

    describe('single date exact match', () => {
      it('should return true for exact date match', () => {
        formControl.dataset.dateRange = '2023-06-15'
        formControl.value = '2023-06-15'
        expect((validator as any).validateDateRange(formControl)).toBe(true)
      })

      it('should return false for non-matching date', () => {
        formControl.dataset.dateRange = '2023-06-15'
        formControl.value = '2023-06-16'
        expect((validator as any).validateDateRange(formControl)).toBe(false)
      })
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
