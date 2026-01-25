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

  describe('parseBytes', () => {
    it('parses plain numbers', () => {
      expect((validator as any).parseBytes('500000')).toBe(500000)
      expect((validator as any).parseBytes('0')).toBe(0)
      expect((validator as any).parseBytes('1.5')).toBe(1.5)
    })

    it('parses KB values', () => {
      expect((validator as any).parseBytes('1K')).toBe(1000)
      expect((validator as any).parseBytes('1KB')).toBe(1000)
      expect((validator as any).parseBytes('5kb')).toBe(5000)
      expect((validator as any).parseBytes('2.5KB')).toBe(2500)
    })

    it('parses MB values', () => {
      expect((validator as any).parseBytes('1M')).toBe(1000000)
      expect((validator as any).parseBytes('1MB')).toBe(1000000)
      expect((validator as any).parseBytes('5mb')).toBe(5000000)
      expect((validator as any).parseBytes('2.5MB')).toBe(2500000)
    })

    it('parses GB values', () => {
      expect((validator as any).parseBytes('1G')).toBe(1000000000)
      expect((validator as any).parseBytes('1GB')).toBe(1000000000)
      expect((validator as any).parseBytes('2gb')).toBe(2000000000)
    })

    it('parses TB values', () => {
      expect((validator as any).parseBytes('1T')).toBe(1000000000000)
      expect((validator as any).parseBytes('1TB')).toBe(1000000000000)
    })

    it('parses B suffix', () => {
      expect((validator as any).parseBytes('500B')).toBe(500)
      expect((validator as any).parseBytes('500b')).toBe(500)
    })

    it('handles whitespace', () => {
      expect((validator as any).parseBytes('  5MB  ')).toBe(5000000)
      expect((validator as any).parseBytes('5 MB')).toBe(5000000)
    })

    it('returns NaN for invalid values', () => {
      expect((validator as any).parseBytes('')).toBeNaN()
      expect((validator as any).parseBytes('abc')).toBeNaN()
      expect((validator as any).parseBytes('MB')).toBeNaN()
    })
  })

  describe('formatBytes', () => {
    it('formats bytes for values under 1 KB (decimal)', () => {
      expect((validator as any).formatBytes(0)).toBe('0 B')
      expect((validator as any).formatBytes(1)).toBe('1 B')
      expect((validator as any).formatBytes(512)).toBe('512 B')
      expect((validator as any).formatBytes(999)).toBe('999 B')
    })

    it('formats kilobytes for values 1 KB and above (decimal)', () => {
      expect((validator as any).formatBytes(1000)).toBe('1 KB')
      expect((validator as any).formatBytes(1500)).toBe('1.5 KB')
      expect((validator as any).formatBytes(10000)).toBe('10 KB')
      expect((validator as any).formatBytes(999999)).toBe('1000 KB')
    })

    it('formats megabytes for values 1 MB and above (decimal)', () => {
      expect((validator as any).formatBytes(1000000)).toBe('1 MB')
      expect((validator as any).formatBytes(1500000)).toBe('1.5 MB')
      expect((validator as any).formatBytes(10000000)).toBe('10 MB')
      expect((validator as any).formatBytes(100000000)).toBe('100 MB')
    })

    it('formats gigabytes for values 1 GB and above (decimal)', () => {
      expect((validator as any).formatBytes(1000000000)).toBe('1 GB')
      expect((validator as any).formatBytes(2500000000)).toBe('2.5 GB')
    })

    it('formats terabytes for values 1 TB and above (decimal)', () => {
      expect((validator as any).formatBytes(1000000000000)).toBe('1 TB')
    })

    it('uses binary mode when decimal=false', () => {
      expect((validator as any).formatBytes(1024, false)).toBe('1 KB')
      expect((validator as any).formatBytes(1536, false)).toBe('1.5 KB')
      expect((validator as any).formatBytes(1048576, false)).toBe('1 MB')
      expect((validator as any).formatBytes(1073741824, false)).toBe('1 GB')
    })

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
  })

  describe('human-readable size attributes', () => {
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
  })
})
