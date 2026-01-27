// Mock CSS.supports for jsdom (which doesn't implement it properly)
// Copied from validator-utils tests

const cssColorValidator = (prop: string, value: string): boolean => {
  if (prop !== 'color') return false

  // Hex colors
  if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) return true

  // RGB/RGBA with comma syntax: rgb(r, g, b) or rgba(r, g, b, a)
  if (/^rgba?\(\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*(,\s*[\d.]+%?)?\s*\)$/i.test(value))
    return true

  // RGB/RGBA with space syntax: rgb(r g b) or rgb(r g b / a)
  if (/^rgba?\(\s*\d{1,3}%?\s+\d{1,3}%?\s+\d{1,3}%?\s*(\s*\/\s*[\d.]+%?)?\s*\)$/i.test(value))
    return true

  // HSL/HSLA with comma syntax
  if (/^hsla?\(\s*\d+(?:deg|grad|rad|turn)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*(,\s*[\d.]+%?)?\s*\)$/i.test(value))
    return true

  // HSL/HSLA with space syntax
  if (/^hsla?\(\s*\d+(?:deg|grad|rad|turn)?\s+\d{1,3}%\s+\d{1,3}%\s*(\s*\/\s*[\d.]+%?)?\s*\)$/i.test(value))
    return true

  // Named colors (includes all tested colors)
  const namedColors = new Set([
    'transparent', 'currentcolor', 'black', 'white', 'red', 'green', 'blue', 'yellow',
    'orange', 'purple', 'brown', 'pink', 'gray', 'grey', 'cyan', 'magenta', 'aqua', 'fuchsia',
    'lavenderblush', 'honeydew', 'seashell', 'azure', 'lavender', 'aliceblue', 'ghostwhite',
    'mintcream', 'oldlace', 'linen', 'cornsilk', 'papayawhip', 'beige', 'bisque',
    'blanchedalmond', 'wheat', 'navajowhite', 'peachpuff', 'moccasin', 'gainsboro',
    'lightgrey', 'lightgray', 'silver', 'darkgray', 'dimgray',
  ])
  if (namedColors.has(value.toLowerCase())) return true

  return false
}

// Setup CSS.supports mock globally
if (typeof globalThis.CSS === 'undefined') {
  ;(globalThis as any).CSS = {}
}
;(globalThis.CSS as any).supports = cssColorValidator
