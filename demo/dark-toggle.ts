/**
 * DarkToggle Custom Element
 * Supports horizontal (default) or vertical orientation via attribute.
 */

type Attrs = Record<string, string | boolean | undefined>
type Child = HTMLElement | SVGElement | string | null | undefined

const SVG_NS = 'http://www.w3.org/2000/svg'

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: Child[] = []
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag)

  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue
    if (value === true) {
      element.setAttribute(key, '')
    } else if (key === 'className') {
      element.className = value
    } else {
      element.setAttribute(key, value)
    }
  }

  for (const child of children) {
    if (child === null || child === undefined) continue
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child))
    } else {
      element.appendChild(child)
    }
  }

  return element
}

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: Array<SVGElement> = []
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tag)

  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value)
  }

  for (const child of children) {
    element.appendChild(child)
  }

  return element
}

function sunIcon(): SVGSVGElement {
  return svgEl(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.5',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      class: 'size-4',
    },
    [
      svgEl('circle', { cx: '12', cy: '12', r: '4' }),
      svgEl('line', { x1: '12', y1: '2', x2: '12', y2: '4' }),
      svgEl('line', { x1: '12', y1: '20', x2: '12', y2: '22' }),
      svgEl('line', { x1: '4.93', y1: '4.93', x2: '6.34', y2: '6.34' }),
      svgEl('line', { x1: '17.66', y1: '17.66', x2: '19.07', y2: '19.07' }),
      svgEl('line', { x1: '2', y1: '12', x2: '4', y2: '12' }),
      svgEl('line', { x1: '20', y1: '12', x2: '22', y2: '12' }),
      svgEl('line', { x1: '4.93', y1: '19.07', x2: '6.34', y2: '17.66' }),
      svgEl('line', { x1: '17.66', y1: '6.34', x2: '19.07', y2: '4.93' }),
    ]
  )
}

function moonIcon(): SVGSVGElement {
  return svgEl(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.5',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      class: 'size-4',
    },
    [svgEl('path', { d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' })]
  )
}

class DarkToggle extends HTMLElement {
  private button: HTMLButtonElement | null = null
  private onKeydown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented) return
    if (event.metaKey || event.ctrlKey || event.altKey) return
    if (event.key.toLowerCase() !== 'd') return
    if (this.isInteractiveTarget(event.target)) return

    event.preventDefault()
    this.setDarkMode(!this.isDarkMode())
  }

  static get observedAttributes(): string[] {
    return ['orientation']
  }

  connectedCallback(): void {
    this.render()
    this.syncFromDocument()
    document.addEventListener('keydown', this.onKeydown)
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    newValue: string | null
  ): void {
    if (!this.isConnected) return
    if (name === 'orientation') {
      if (newValue !== 'vertical' && newValue !== 'horizontal' && newValue !== null) return
      this.render()
      this.syncFromDocument()
    }
  }

  disconnectedCallback(): void {
    document.removeEventListener('keydown', this.onKeydown)
  }

  private isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark')
  }

  private getOrientation(): 'horizontal' | 'vertical' {
    return this.getAttribute('orientation') === 'vertical' ? 'vertical' : 'horizontal'
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false
    if (target.isContentEditable) return true

    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true

    return Boolean(
      target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')
    )
  }

  private syncFromDocument(): void {
    this.updateButton(this.isDarkMode())
  }

  private updateButton(isDarkMode: boolean): void {
    if (!this.button) return
    this.button.setAttribute('aria-checked', isDarkMode ? 'true' : 'false')
    this.button.setAttribute('title', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode')
  }

  private setDarkMode(isDarkMode: boolean): void {
    document.documentElement.classList.toggle('dark', isDarkMode)
    try {
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
    } catch {}
    this.updateButton(isDarkMode)
  }

  private render(): void {
    const isVertical = this.getOrientation() === 'vertical'
    const directionClass = isVertical ? 'flex-col' : ''
    const indicatorShiftClass = isVertical
      ? 'dark:translate-y-[calc(100%+1px)]'
      : 'dark:translate-x-[calc(100%+1px)]'

    const button = el(
      'button',
      {
        type: 'button',
        className:
          `shadow-rim relative inline-flex ${directionClass} cursor-pointer gap-px rounded-full bg-neutral-200/60 dark:bg-neutral-800/50`,
        role: 'switch',
        'aria-checked': 'false',
        'aria-orientation': isVertical ? 'vertical' : 'horizontal',
        'aria-label': 'Toggle dark mode',
        title: 'Switch to dark mode',
      },
      [
        el('span', {
          className:
            `shadow-edge absolute left-0 top-0 size-8 rounded-full bg-white shadow-md transition-all! delay-0! duration-200! ${indicatorShiftClass} dark:bg-neutral-600/60`,
          'aria-hidden': 'true',
        }),
        el(
          'span',
          {
            className:
              'z-10 flex size-8 items-center justify-center rounded-full text-indigo-700/60 transition-all hover:text-black dark:text-indigo-200/60 dark:hover:text-indigo-200',
            'aria-hidden': 'true',
          },
          [sunIcon()]
        ),
        el(
          'span',
          {
            className:
              'z-10 flex size-8 items-center justify-center rounded-full text-indigo-400/60 transition-all hover:text-indigo-700/60 dark:text-indigo-200/60 dark:hover:text-white',
            'aria-hidden': 'true',
          },
          [moonIcon()]
        ),
      ]
    )

    button.addEventListener('click', () => {
      this.setDarkMode(!this.isDarkMode())
    })

    this.button = button
    this.replaceChildren(button)
  }
}

customElements.define('dark-toggle', DarkToggle)
