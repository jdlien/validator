import * as utils from '../src/validator-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('utils', () => {
  describe('isColor', () => {
    const validHexColors = [
      '#000000',
      '#00000000',
      '#123456',
      '#12345678',
      '#abcdef',
      '#abcdef01',
      '#ABC',
      '#ABC0',
      '#AbCdEf',
      '#AbCdEf01',
    ]

    const invalidHexColors = [
      '#0000000', // 7 digits
      '#000000000', // 9 digits
      '#12345', // 5 digits
      '#1234567', // 7 digits
      'abcdef', // 6 digits, no hash
      '#ab', // 2 digits
    ]

    const validRgbColors = [
      'rgb(0, 0, 0)',
      'rgb(0, 0, 0, 0)',
      'rgb(255, 255, 255)',
      'rgb(255, 255, 255, 1)',
      'rgb(255, 255, 255, 0.5)',
      'rgb(255, 255, 255, 0.123456)',
      'rgb(255, 255, 255, 0.123456789)',
      'rgb(255, 255, 255, 100%)',
      'rgba(255, 255, 255, 50%)',
      'rgba(255, 255, 255, 12.3456%)',
      'rgba(255,255,255)',
      'rgba(255,255,255,1)',
      'rgb(100%, 40%, 0%)', // percentages
      'rgb(20 30 40)', // spaces
      'rgb(20 30 40 / 0.5)', // spaces and alpha
    ]

    const invalidRgbColors = [
      'rgb(0, 0, 0, 0, 0)', // 5 values
      'rgb(0, 0, 0,)', // no final value
      'rgba(0, 0 0)', // only two values
    ]

    const validHslColors = [
      'hsl(0, 0%, 0%)',
      'hsl(0, 0%, 0%, 0)',
      'hsl(0, 0%, 0%, 0.5)',
      'hsl(100deg, 0%, 0%, 0.123456)',
      'hsl(100deg, 0%, 0%, 12%)',
      'hsla(100deg, 0%, 0%, 12%)',
      'hsl(100deg 0% 0%)', // spaces
      'hsl(100deg 0% 0% / 12.3456%)', // spaces and alpha
      'hsl(100deg 0% 0%/12%)', // spaces and alpha
      'hsl(100, 0%, 0%)',
      'hsl(360deg, 100%, 100%)',
      'hsl(180deg, 50%, 50%)',
      'hsla(180deg, 50%, 50%, 1)',
      'hsla(180deg, 50%, 50%, 0.5)',
      'hsl(180deg, 0%, 100%)',
      'hsla(180deg, 0%, 100%, 0.75)',
      'hsl(0, 0%, 100%)',
      'hsla(0, 0%, 100%, 0.25)',
    ]

    const invalidHslColors = [
      'hsl(0, 0%, 0%, 0, 0)', // 5 values
      'hsl(0, 0%, 0%,)', // no final value
      'hsla(0, 0 0)', // only two values
      'hsl(0, 0%,)', // no final value
      'hsl(0, 0%)', // only two values
      'hsl(0, 0%, 0, 0%)', // 4 values
      'hsl(-100, 0%, 0%)', // negative hue value
      'hsl(0, -100%, 0%)', // negative saturation value
      'hsl(0, 0%, -100%)', // negative lightness value
      // For more thorough testing, add these tests
      // 'hsl(500, 0%, 0%)', // hue value greater than 359
      // 'hsl(0, 200%, 0%)', // saturation value greater than 100
      // 'hsl(0, 0%, 200%)', // lightness value greater than 100
    ]

    const validColorNames = [
      'transparent',
      'black',
      'white',
      'red',
      'green',
      'blue',
      'yellow',
      'orange',
      'purple',
      'brown',
      'pink',
      'gray',
      'grey',
      'lavenderblush',
      'honeydew',
      'seashell',
      'azure',
      'lavender',
      'aliceblue',
      'ghostwhite',
      'mintcream',
      'oldlace',
      'linen',
      'cornsilk',
      'papayawhip',
      'beige',
      'bisque',
      'blanchedalmond',
      'wheat',
      'navajowhite',
      'peachpuff',
      'moccasin',
      'gainsboro',
      'lightgrey',
      'lightgray',
      'silver',
      'darkgray',
      'gray',
      'dimgray',
    ]

    const invalidColorNames = ['transparant', 'blak', 'whit', 'redish', 'greenish', 'blueish']

    validHexColors.forEach((color) => {
      it(`should validate ${color} as a valid hex color`, () => {
        expect(utils.isColor(color)).toBeTruthy()
      })
    })

    invalidHexColors.forEach((color) => {
      it(`should validate ${color} as an invalid hex color`, () => {
        expect(utils.isColor(color)).toBeFalsy()
      })
    })

    validRgbColors.forEach((color) => {
      it(`should validate ${color} as a valid rgb color`, () => {
        expect(utils.isColor(color)).toBeTruthy()
      })
    })

    invalidRgbColors.forEach((color) => {
      it(`should validate ${color} as an invalid rgb color`, () => {
        expect(utils.isColor(color)).toBeFalsy()
      })
    })

    validHslColors.forEach((color) => {
      it(`should validate ${color} as a valid hsl color`, () => {
        expect(utils.isColor(color)).toBeTruthy()
      })
    })

    invalidHslColors.forEach((color) => {
      it(`should validate ${color} as an invalid hsl color`, () => {
        expect(utils.isColor(color)).toBeFalsy()
      })
    })

    validColorNames.forEach((color) => {
      it(`should validate ${color} as a valid color name`, () => {
        expect(utils.isColor(color)).toBeTruthy()
      })
    })

    invalidColorNames.forEach((color) => {
      it(`should validate ${color} as an invalid color name`, () => {
        expect(utils.isColor(color)).toBeFalsy()
      })
    })
  }) // End isColor
})
