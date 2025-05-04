import Validator from '../src/Validator'
import MainValidator from '..'
import { describe, it, expect } from 'vitest'

describe('index.ts', () => {
  it('should export Validator class as default export', () => {
    expect(MainValidator).toBeDefined()
    expect(MainValidator).toBe(Validator)
  })

  it('should be a constructor function', () => {
    expect(typeof MainValidator).toBe('function')
    expect(new MainValidator(document.createElement('form'))).toBeInstanceOf(Validator)
  })
}) // end describe('index.ts')
