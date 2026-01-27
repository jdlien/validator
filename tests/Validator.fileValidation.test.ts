import Validator from '../src/Validator'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupTestForm } from './utils/setup'
import { makeFile, setInputFiles } from './utils/files'

describe('Validator file validation', () => {
  let form: HTMLFormElement
  let formControl: HTMLInputElement
  let validator: Validator

  beforeEach(() => {
    ;({ form, formControl, validator } = setupTestForm())
    formControl.type = 'file'
  })

  afterEach(() => {
    document.body.removeChild(form)
  })

  it('returns true when validateFileInput is called for non-file inputs', () => {
    formControl.type = 'text'
    expect((validator as any).validateFileInput(formControl)).toBe(true)
  })

  it('returns true when validateFileInput is called with no files', () => {
    setInputFiles(formControl, [])
    expect((validator as any).validateFileInput(formControl)).toBe(true)
  })

  it('handles missing files list by treating it as empty', () => {
    Object.defineProperty(formControl, 'files', { value: null, configurable: true })
    expect((validator as any).validateFileInput(formControl)).toBe(true)
  })

  it('skips pattern validation for file inputs', () => {
    formControl.pattern = '[a-z]+'
    expect((validator as any).validatePattern(formControl)).toBe(true)
  })

  it('returns true when file input has no files even with constraints', async () => {
    formControl.dataset.maxFiles = '1'
    formControl.dataset.minFileSize = '5'
    formControl.dataset.maxFileSize = '10'
    formControl.accept = 'image/*,.pdf'
    setInputFiles(formControl, [])

    const result = await validator.validateSingle(formControl)
    expect(result).toBe(true)
    expect(validator.inputErrors[formControl.name]).toEqual([])
  })

  it('fails when max files is exceeded', async () => {
    formControl.dataset.maxFiles = '1'
    setInputFiles(formControl, [
      makeFile(2, 'a.txt', 'text/plain'),
      makeFile(2, 'b.txt', 'text/plain'),
    ])
    const firstFile = formControl.files?.item(0)
    const missingFile = formControl.files?.item(10)
    expect(firstFile?.name).toBe('a.txt')
    expect(missingFile).toBeNull()

    const result = await validator.validateSingle(formControl)
    expect(result).toBe(false)
    expect(validator.inputErrors[formControl.name]).toContain(
      validator.messages.ERROR_FILE_MAX_FILES.replace('${val}', '1')
    )
  })

  it('fails when any file is too large', async () => {
    formControl.dataset.maxFileSize = '10'
    setInputFiles(formControl, [makeFile(12, 'big.bin', 'application/octet-stream')])

    const result = await validator.validateSingle(formControl)
    expect(result).toBe(false)
    expect(validator.inputErrors[formControl.name]).toContain(
      validator.messages.ERROR_FILE_MAX_SIZE.replace('${val}', '10 B')
    )
  })

  it('fails when any file is too small', async () => {
    formControl.dataset.minFileSize = '10'
    setInputFiles(formControl, [makeFile(2, 'small.bin', 'application/octet-stream')])

    const result = await validator.validateSingle(formControl)
    expect(result).toBe(false)
    expect(validator.inputErrors[formControl.name]).toContain(
      validator.messages.ERROR_FILE_MIN_SIZE.replace('${val}', '10 B')
    )
  })

  it('passes when all files meet min size', async () => {
    formControl.dataset.minFileSize = '5'
    setInputFiles(formControl, [makeFile(6, 'ok.bin', 'application/octet-stream')])

    const result = await validator.validateSingle(formControl)
    expect(result).toBe(true)
    expect(validator.inputErrors[formControl.name]).toEqual([])
  })

  it('passes when all files meet max size', async () => {
    formControl.dataset.maxFileSize = '10'
    setInputFiles(formControl, [makeFile(5, 'ok.bin', 'application/octet-stream')])

    const result = await validator.validateSingle(formControl)
    expect(result).toBe(true)
    expect(validator.inputErrors[formControl.name]).toEqual([])
  })

  it('accepts files that match wildcard mime types', async () => {
    formControl.accept = 'image/*'
    setInputFiles(formControl, [makeFile(2, 'photo.png', 'image/png')])

    const result = await validator.validateSingle(formControl)
    expect(result).toBe(true)
    expect(validator.inputErrors[formControl.name]).toEqual([])
  })

  it('accepts files when accept is */*', async () => {
    formControl.accept = '*/*'
    setInputFiles(formControl, [makeFile(2, 'notes.txt', 'text/plain')])

    const result = await validator.validateSingle(formControl)
    expect(result).toBe(true)
    expect(validator.inputErrors[formControl.name]).toEqual([])
  })

  it('accepts files that match exact mime or extension rules', async () => {
    formControl.accept = 'application/pdf, invalid, , .txt'
    setInputFiles(formControl, [
      makeFile(2, 'doc.pdf', 'application/pdf'),
      makeFile(2, 'doc.txt'),
    ])

    const result = await validator.validateSingle(formControl)
    expect(result).toBe(true)
    expect(validator.inputErrors[formControl.name]).toEqual([])
  })

  it('uses data-accept when provided', async () => {
    formControl.dataset.accept = '.txt'
    Object.defineProperty(formControl, 'accept', { value: undefined, configurable: true })
    setInputFiles(formControl, [makeFile(2, 'notes.txt')])

    const result = await validator.validateSingle(formControl)
    expect(result).toBe(true)
    expect(validator.inputErrors[formControl.name]).toEqual([])
  })

  it('skips accept validation when parsed list is empty', async () => {
    formControl.accept = 'invalidtoken'
    setInputFiles(formControl, [makeFile(2, 'notes.txt', 'text/plain')])

    const result = await validator.validateSingle(formControl)
    expect(result).toBe(true)
    expect(validator.inputErrors[formControl.name]).toEqual([])
  })

  it('falls back to no accept when accept is unset', async () => {
    Object.defineProperty(formControl, 'accept', { value: undefined, configurable: true })
    setInputFiles(formControl, [makeFile(2, 'notes.txt', 'text/plain')])

    const result = await validator.validateSingle(formControl)
    expect(result).toBe(true)
    expect(validator.inputErrors[formControl.name]).toEqual([])
  })

  it('fails when accept list does not match', async () => {
    formControl.accept = 'application/pdf,.png'
    setInputFiles(formControl, [makeFile(2, 'notes.txt', 'text/plain')])

    const result = await validator.validateSingle(formControl)
    expect(result).toBe(false)
    expect(validator.inputErrors[formControl.name]).toContain(validator.messages.ERROR_FILE_TYPE)
  })

  describe('human-readable size attributes', () => {
    it('displays human-readable sizes in error messages', async () => {
      // Test KB range
      formControl.dataset.maxFileSize = '5000'
      setInputFiles(formControl, [makeFile(6000, 'big.bin', 'application/octet-stream')])
      await validator.validateSingle(formControl)
      expect(validator.inputErrors[formControl.name]).toContain('Each file must be 5 KB or smaller.')

      // Test MB range
      validator.inputErrors[formControl.name] = []
      formControl.dataset.maxFileSize = '1000000'
      setInputFiles(formControl, [makeFile(2000000, 'huge.bin', 'application/octet-stream')])
      await validator.validateSingle(formControl)
      expect(validator.inputErrors[formControl.name]).toContain('Each file must be 1 MB or smaller.')
    })
    it('accepts human-readable max-file-size values', async () => {
      formControl.dataset.maxFileSize = '5MB'
      setInputFiles(formControl, [makeFile(4000000, 'ok.bin', 'application/octet-stream')])
      expect(await validator.validateSingle(formControl)).toBe(true)

      setInputFiles(formControl, [makeFile(6000000, 'big.bin', 'application/octet-stream')])
      expect(await validator.validateSingle(formControl)).toBe(false)
    })

    it('accepts human-readable min-file-size values', async () => {
      formControl.dataset.minFileSize = '1KB'
      setInputFiles(formControl, [makeFile(2000, 'ok.bin', 'application/octet-stream')])
      expect(await validator.validateSingle(formControl)).toBe(true)

      validator.inputErrors[formControl.name] = []
      setInputFiles(formControl, [makeFile(500, 'small.bin', 'application/octet-stream')])
      expect(await validator.validateSingle(formControl)).toBe(false)
    })

    it('accepts binary unit size values (KiB, MiB)', async () => {
      formControl.dataset.maxFileSize = '1MiB'
      setInputFiles(formControl, [makeFile(1000000, 'ok.bin', 'application/octet-stream')])
      expect(await validator.validateSingle(formControl)).toBe(true)

      setInputFiles(formControl, [makeFile(1100000, 'big.bin', 'application/octet-stream')])
      expect(await validator.validateSingle(formControl)).toBe(false)
    })
  })

  describe('fail-closed on invalid size attributes', () => {
    it('fails validation when max-file-size attribute is invalid', async () => {
      formControl.dataset.maxFileSize = '5MBX'
      setInputFiles(formControl, [makeFile(100, 'small.bin')])
      expect(await validator.validateSingle(formControl)).toBe(false)
    })

    it('fails validation when min-file-size attribute is invalid', async () => {
      formControl.dataset.minFileSize = 'invalid'
      setInputFiles(formControl, [makeFile(100, 'small.bin')])
      expect(await validator.validateSingle(formControl)).toBe(false)
    })

    it('fails validation for locale-formatted numbers', async () => {
      formControl.dataset.maxFileSize = '1,000'
      setInputFiles(formControl, [makeFile(100, 'small.bin')])
      expect(await validator.validateSingle(formControl)).toBe(false)
    })

    it('includes the invalid attribute value in the error message', async () => {
      formControl.dataset.maxFileSize = '5MBX'
      setInputFiles(formControl, [makeFile(100, 'small.bin')])
      await validator.validateSingle(formControl)
      expect(validator.inputErrors[formControl.name]).toContain(
        validator.messages.ERROR_FILE_MAX_SIZE.replace('${val}', '5MBX')
      )
    })

    it('logs debug warning for invalid max-file-size when debug is enabled', async () => {
      const debugValidator = new Validator(form, { debug: true })
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      formControl.dataset.maxFileSize = 'invalid'
      setInputFiles(formControl, [makeFile(100, 'small.bin')])
      await debugValidator.validateSingle(formControl)
      expect(warnSpy).toHaveBeenCalledWith('Validator: Invalid max-file-size "invalid"')
      warnSpy.mockRestore()
    })

    it('logs debug warning for invalid min-file-size when debug is enabled', async () => {
      const debugValidator = new Validator(form, { debug: true })
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      formControl.dataset.minFileSize = 'invalid'
      setInputFiles(formControl, [makeFile(100, 'small.bin')])
      await debugValidator.validateSingle(formControl)
      expect(warnSpy).toHaveBeenCalledWith('Validator: Invalid min-file-size "invalid"')
      warnSpy.mockRestore()
    })
  })
})
