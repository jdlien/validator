import Validator from '../src/Validator'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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

  describe('formatBytes', () => {
    it('formats bytes for values under 1 KB', () => {
      expect((validator as any).formatBytes(0)).toBe('0 B')
      expect((validator as any).formatBytes(1)).toBe('1 B')
      expect((validator as any).formatBytes(512)).toBe('512 B')
      expect((validator as any).formatBytes(1023)).toBe('1023 B')
    })

    it('formats kilobytes for values from 1 KB to under 1 MB', () => {
      expect((validator as any).formatBytes(1024)).toBe('1.0 KB')
      expect((validator as any).formatBytes(1536)).toBe('1.5 KB')
      expect((validator as any).formatBytes(10240)).toBe('10.0 KB')
      expect((validator as any).formatBytes(1048575)).toBe('1024.0 KB')
    })

    it('formats megabytes for values 1 MB and above', () => {
      expect((validator as any).formatBytes(1048576)).toBe('1.0 MB')
      expect((validator as any).formatBytes(1572864)).toBe('1.5 MB')
      expect((validator as any).formatBytes(10485760)).toBe('10.0 MB')
      expect((validator as any).formatBytes(104857600)).toBe('100.0 MB')
    })

    it('displays human-readable sizes in error messages', async () => {
      // Test KB range
      formControl.dataset.maxFileSize = '5120' // 5 KB
      setInputFiles(formControl, [makeFile(6000, 'big.bin', 'application/octet-stream')])
      await validator.validateSingle(formControl)
      expect(validator.inputErrors[formControl.name]).toContain('Each file must be 5.0 KB or smaller.')

      // Test MB range
      validator.inputErrors[formControl.name] = []
      formControl.dataset.maxFileSize = '1048576' // 1 MB
      setInputFiles(formControl, [makeFile(2000000, 'huge.bin', 'application/octet-stream')])
      await validator.validateSingle(formControl)
      expect(validator.inputErrors[formControl.name]).toContain('Each file must be 1.0 MB or smaller.')
    })
  })
})
