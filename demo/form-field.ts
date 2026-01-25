/**
 * FormField Custom Element
 * A reusable form field component that reduces boilerplate for forms using @jdlien/validator
 *
 * Usage:
 *   <form-field name="email" label="Email" type="email" required></form-field>
 *   <form-field name="color" label="Color" type="select" options="red,green,blue"></form-field>
 *   <form-field name="choice" label="Choose" type="radio" options="a,b,c" required></form-field>
 */

import './file-drop'

// Types
type Attrs = Record<string, string | boolean | undefined>
type Child = HTMLElement | string | null | undefined

interface OptionItem {
  value: string
  label: string
}

type FieldType =
  | 'text'
  | 'number'
  | 'integer'
  | 'email'
  | 'url'
  | 'tel'
  | 'date'
  | 'datetime'
  | 'time'
  | 'file'
  | 'color'
  | 'zip'
  | 'postal'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'textarea'

// DOM helper - our mini jQuery
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
    } else if (key.startsWith('data-')) {
      element.setAttribute(key, value)
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

// Helper to create element with innerHTML (for hint text with HTML)
function elHtml<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  html: string
): HTMLElementTagNameMap[K] {
  const element = el(tag, attrs)
  element.innerHTML = html
  return element
}

// Attribute mappings
const ATTR_MAP: Record<string, string> = {
  required: 'required',
  disabled: 'disabled',
  multiple: 'multiple',
  placeholder: 'placeholder',
  value: 'value',
  minlength: 'minlength',
  maxlength: 'maxlength',
  pattern: 'pattern',
  accept: 'accept',
  min: 'data-min',
  max: 'data-max',
  'min-length': 'data-min-length',
  'max-length': 'data-max-length',
  'max-files': 'data-max-files',
  'min-file-size': 'data-min-file-size',
  'max-file-size': 'data-max-file-size',
  'date-format': 'data-date-format',
  'date-range': 'data-date-range',
  'time-format': 'data-time-format',
  'error-msg': 'data-error-default',
}

const DATA_TYPE_MAP: Record<string, string> = {
  integer: 'integer',
  number: 'number',
  date: 'date',
  datetime: 'datetime',
  time: 'time',
  email: 'email',
  tel: 'tel',
  zip: 'zip',
  postal: 'postal',
  color: 'color',
}

const INPUT_TYPE_MAP: Record<string, string> = {
  integer: 'text',
  number: 'text',
  date: 'text',
  datetime: 'text',
  time: 'text',
  zip: 'text',
  postal: 'text',
  color: 'text',
}

const INPUT_MODE_MAP: Record<string, string> = {
  email: 'email',
  tel: 'tel',
  url: 'url',
  number: 'decimal',
  integer: 'numeric',
}

class FormField extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['value', 'disabled']
  }

  connectedCallback(): void {
    this.render()
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (!this.isConnected) return
    const input = this.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input, select, textarea'
    )
    if (!input) return

    if (name === 'value') {
      input.value = newValue || ''
      if (this.getAttribute('type') === 'color') {
        this.updateColorSwatch(newValue || '')
      }
    } else if (name === 'disabled') {
      ;(input as HTMLInputElement).disabled = newValue !== null
    }
  }

  private render(): void {
    const type = (this.getAttribute('type') || 'text') as FieldType
    const name = this.getAttribute('name') || ''
    let id = this.getAttribute('id') || name

    // Generate unique ID if none provided or if ID already exists in document
    if (!id || document.getElementById(id)) {
      const base = name || 'field'
      id = `${base}-${Math.random().toString(36).slice(2, 8)}`
    }

    // Remove id from custom element to avoid duplicates
    this.removeAttribute('id')

    if (type === 'textarea') {
      this.renderTextarea(id, name)
    } else if (type === 'select') {
      this.renderSelect(id, name)
    } else if ((type === 'radio' || type === 'checkbox') && this.hasAttribute('options')) {
      this.renderGroup(id, name, type)
    } else if (type === 'color') {
      this.renderColorInput(id, name)
    } else if (type === 'file') {
      this.renderFileInput(id, name)
    } else {
      this.renderInput(id, name, type)
    }
  }

  private parseOptions(): OptionItem[] {
    const optionsAttr = this.getAttribute('options')
    if (!optionsAttr) return []

    if (optionsAttr.startsWith('[')) {
      try {
        return JSON.parse(optionsAttr) as OptionItem[]
      } catch {
        console.warn('Failed to parse options as JSON')
      }
    }

    return optionsAttr.split(',').map((opt) => {
      const trimmed = opt.trim()
      return { value: trimmed, label: trimmed }
    })
  }

  private getValidationAttrs(): Attrs {
    const attrs: Attrs = {}
    const booleanAttrs = new Set(['required', 'disabled', 'multiple'])

    for (const [formFieldAttr, inputAttr] of Object.entries(ATTR_MAP)) {
      if (this.hasAttribute(formFieldAttr)) {
        const val = this.getAttribute(formFieldAttr)
        if (booleanAttrs.has(formFieldAttr)) {
          attrs[inputAttr] = true
        } else {
          attrs[inputAttr] = val || undefined
        }
      }
    }

    // Copy data-* attributes directly
    for (const attr of Array.from(this.attributes)) {
      if (attr.name.startsWith('data-') && !Object.values(ATTR_MAP).includes(attr.name)) {
        attrs[attr.name] = attr.value
      }
    }

    return attrs
  }

  private buildWrapper(id: string, labelText: string, content: HTMLElement): HTMLElement {
    const hint = this.getAttribute('hint')

    return el('div', { className: 'sm:grid sm:grid-cols-3 sm:items-start sm:gap-4' }, [
      el(
        'label',
        {
          for: id,
          id: `${id}-label`,
          className:
            'block font-light text-indigo-900/80 dark:text-indigo-100/80 sm:mt-px sm:pt-1 leading-loose',
        },
        [labelText]
      ),
      el('div', { className: 'my-0.5 sm:mt-0 sm:col-span-2' }, [
        content,
        hint
          ? elHtml(
              'p',
              { className: 'mt-1 text-sm text-indigo-700/75 dark:text-indigo-300/75' },
              hint
            )
          : null,
        el('div', { style: 'min-height: 20px' }, [
          el('div', {
            className:
              'error opacity-0 mt-1 overflow-hidden text-sm text-pink-600 dark:text-pink-400',
            id: `${id}-error`,
          }),
        ]),
      ]),
    ])
  }

  private renderInput(id: string, name: string, type: FieldType): void {
    const label = this.getAttribute('label') || name
    const inputType = INPUT_TYPE_MAP[type] || type
    const dataType = DATA_TYPE_MAP[type]
    const inputMode = INPUT_MODE_MAP[type]
    const validationAttrs = this.getValidationAttrs()
    const flatpickrClass = ['date', 'datetime', 'time'].includes(type) ? ' flatpickr-input' : ''

    const input = el('input', {
      className: `block w-full transition${flatpickrClass}`,
      type: inputType,
      id,
      name,
      'aria-describedby': `${id}-error`,
      ...(dataType && !this.hasAttribute('data-type') ? { 'data-type': dataType } : {}),
      ...(inputMode ? { inputmode: inputMode } : {}),
      ...validationAttrs,
    })

    const wrapper = el('div', { className: 'flex relative sm:max-w-sm' }, [input])
    this.appendChild(this.buildWrapper(id, label, wrapper))
  }

  private renderColorInput(id: string, name: string): void {
    const label = this.getAttribute('label') || name
    const value = this.getAttribute('value') || '#888888'
    const validationAttrs = this.getValidationAttrs()

    const textInput = el('input', {
      className: 'block w-full px-1.5 transition rounded-r-none',
      type: 'text',
      id,
      name,
      'data-type': 'color',
      value,
      'aria-describedby': `${id}-error`,
      ...validationAttrs,
    })

    const colorInput = el('input', {
      type: 'color',
      id: `${id}-color`,
      className: 'invisible w-full h-full',
      value,
    })

    const colorLabel = el(
      'label',
      {
        id: `${id}-color-label`,
        for: `${id}-color`,
        className:
          'border border-l-0 border-zinc-300 dark:border-zinc-700/60 cursor-pointer w-20 rounded-r-lg',
        style: `background-color: ${value}`,
      },
      [colorInput]
    )

    const wrapper = el(
      'div',
      { className: 'color-input-wrapper flex relative sm:max-w-sm rounded-lg' },
      [textInput, colorLabel]
    )
    this.appendChild(this.buildWrapper(id, label, wrapper))

    // Set up color sync with direct references (no querying needed!)
    colorInput.addEventListener('input', () => {
      textInput.value = colorInput.value
      colorLabel.style.backgroundColor = colorInput.value
      textInput.dispatchEvent(new Event('input', { bubbles: true }))
    })

    textInput.addEventListener('blur', () => {
      if (/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) {
        colorInput.value = textInput.value
        colorLabel.style.backgroundColor = textInput.value
      }
    })
  }

  private updateColorSwatch(value: string): void {
    const colorLabel = this.querySelector<HTMLLabelElement>('[id$="-color-label"]')
    const colorInput = this.querySelector<HTMLInputElement>('[type="color"]')
    if (colorLabel && /^#[0-9A-Fa-f]{6}$/.test(value)) {
      colorLabel.style.backgroundColor = value
      if (colorInput) colorInput.value = value
    }
  }

  private renderFileInput(id: string, name: string): void {
    const label = this.getAttribute('label') || name

    // Create file-drop element and pass through attributes
    const fileDrop = document.createElement('file-drop')
    fileDrop.setAttribute('name', name)
    fileDrop.setAttribute('id', id)

    // Pass through relevant attributes
    const passthrough = ['accept', 'multiple', 'required', 'disabled']
    passthrough.forEach((attr) => {
      if (this.hasAttribute(attr)) {
        const val = this.getAttribute(attr)
        if (val === '' || val === null) fileDrop.setAttribute(attr, '')
        else fileDrop.setAttribute(attr, val)
      }
    })

    // Pass through data-* attributes for validation
    Array.from(this.attributes).forEach((attr) => {
      if (attr.name.startsWith('data-')) {
        fileDrop.setAttribute(attr.name, attr.value)
      }
    })

    this.appendChild(this.buildWrapper(id, label, fileDrop))
  }

  private renderSelect(id: string, name: string): void {
    const label = this.getAttribute('label') || name
    const options = this.parseOptions()
    const validationAttrs = this.getValidationAttrs()

    const select = el(
      'select',
      {
        className: 'block w-full sm:max-w-sm',
        id,
        name,
        'aria-describedby': `${id}-error`,
        ...validationAttrs,
      },
      [
        el('option', { value: '' }),
        ...options.map((opt) => el('option', { value: opt.value }, [opt.label])),
      ]
    )

    this.appendChild(this.buildWrapper(id, label, select))
  }

  private renderGroup(id: string, name: string, type: 'radio' | 'checkbox'): void {
    const label = this.getAttribute('label') || name
    const options = this.parseOptions()
    const errorMsg = this.getAttribute('error-msg') || ''
    const isRequired = this.hasAttribute('required')
    const roundedClass = type === 'checkbox' ? '' : ' rounded-full'

    const optionElements = options.map((opt, index) => {
      const optId = `${id}-${index + 1}-${opt.value.toLowerCase().replace(/\s+/g, '-')}`

      return el('div', { className: 'pt-2' }, [
        el('div', { className: 'flex items-start h-5' }, [
          el('label', { className: `checked-border${roundedClass}`, for: optId }, [
            el('input', {
              id: optId,
              name,
              type,
              value: opt.value,
              className: 'block transition',
              'aria-describedby': `${id}-error`,
              ...(isRequired ? { required: true } : {}),
              ...(errorMsg ? { 'data-error-default': errorMsg } : {}),
            }),
            el('span', { className: 'checked-label' }, [opt.label]),
          ]),
        ]),
      ])
    })

    const wrapper = el('div', { className: 'flex relative sm:max-w-sm' }, [
      el('div', { className: 'mb-3 sm:col-span-2 space-y-3' }, optionElements),
    ])

    this.appendChild(this.buildWrapper(id, label, wrapper))
  }

  private renderTextarea(id: string, name: string): void {
    const label = this.getAttribute('label') || name
    const placeholder = this.getAttribute('placeholder') || ''
    const validationAttrs = this.getValidationAttrs()

    const textarea = el('textarea', {
      id,
      name,
      className: 'w-full',
      'aria-describedby': `${id}-error`,
      ...(placeholder ? { placeholder } : {}),
      ...validationAttrs,
    })

    this.appendChild(this.buildWrapper(id, label, textarea))
  }
}

customElements.define('form-field', FormField)
