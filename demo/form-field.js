/**
 * FormField Custom Element
 * A reusable form field component that reduces boilerplate for forms using @jdlien/validator
 *
 * Usage:
 *   <form-field name="email" label="Email" type="email" required></form-field>
 *   <form-field name="color" label="Color" type="select" options="red,green,blue"></form-field>
 *   <form-field name="choice" label="Choose" type="radio" options="a,b,c" required></form-field>
 */
class FormField extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'disabled']
  }

  connectedCallback() {
    this.render()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.isConnected) return
    const input = this.querySelector('input, select, textarea')
    if (!input) return

    if (name === 'value') {
      input.value = newValue || ''
      // For color type, update the swatch
      if (this.getAttribute('type') === 'color') {
        this.updateColorSwatch(newValue)
      }
    } else if (name === 'disabled') {
      input.disabled = newValue !== null
    }
  }

  render() {
    const type = this.getAttribute('type') || 'text'
    const name = this.getAttribute('name')
    const id = this.getAttribute('id') || name

    // Remove id from the custom element itself to avoid duplicate IDs
    this.removeAttribute('id')

    if (type === 'textarea') {
      this.renderTextarea(id, name)
    } else if (type === 'select') {
      this.renderSelect(id, name)
    } else if (['radio', 'checkbox'].includes(type) && this.hasAttribute('options')) {
      this.renderGroup(id, name, type)
    } else if (type === 'color') {
      this.renderColorInput(id, name)
    } else {
      this.renderInput(id, name, type)
    }
  }

  // Parse options from CSV string or JSON array
  parseOptions() {
    const optionsAttr = this.getAttribute('options')
    if (!optionsAttr) return []

    // Try JSON first
    if (optionsAttr.startsWith('[')) {
      try {
        return JSON.parse(optionsAttr)
      } catch (e) {
        console.warn('Failed to parse options as JSON:', e)
      }
    }

    // Fall back to CSV
    return optionsAttr.split(',').map((opt) => {
      const trimmed = opt.trim()
      return { value: trimmed, label: trimmed }
    })
  }

  // Get common wrapper HTML
  getWrapper(id, labelText, contentHTML) {
    const hint = this.getAttribute('hint')
    const hintHTML = hint
      ? `<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">${hint}</p>`
      : ''

    return `
      <div class="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4">
        <label for="${id}" id="${id}-label" class="block font-medium sm:mt-px sm:pt-1">${labelText}</label>
        <div class="my-0.5 sm:mt-0 sm:col-span-2">
          ${contentHTML}
          ${hintHTML}
          <div style="min-height: 20px">
            <div class="error hidden text-sm text-red-600 transition dark:text-red-500" id="${id}-error"></div>
          </div>
        </div>
      </div>
    `
  }

  // Copy validation and data attributes to the input element
  getValidationAttrs() {
    const attrs = []
    const attrMap = {
      required: 'required',
      disabled: 'disabled',
      placeholder: 'placeholder',
      value: 'value',
      minlength: 'minlength',
      maxlength: 'maxlength',
      pattern: 'pattern',
      min: 'data-min',
      max: 'data-max',
      'min-length': 'data-min-length',
      'max-length': 'data-max-length',
      'date-format': 'data-date-format',
      'date-range': 'data-date-range',
      'time-format': 'data-time-format',
      'error-msg': 'data-error-default',
      'data-type': 'data-type',
    }

    for (const [formFieldAttr, inputAttr] of Object.entries(attrMap)) {
      if (this.hasAttribute(formFieldAttr)) {
        const val = this.getAttribute(formFieldAttr)
        // Boolean attributes
        if (['required', 'disabled'].includes(formFieldAttr)) {
          attrs.push(inputAttr)
        } else {
          attrs.push(`${inputAttr}="${val}"`)
        }
      }
    }

    // Copy any data-* attributes directly
    for (const attr of this.attributes) {
      if (attr.name.startsWith('data-') && !Object.values(attrMap).includes(attr.name)) {
        attrs.push(`${attr.name}="${attr.value}"`)
      }
    }

    return attrs.join(' ')
  }

  // Get data-type attribute value based on field type
  getDataType(type) {
    const typeMap = {
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
    return typeMap[type] || null
  }

  // Get HTML input type
  getInputType(type) {
    const typeMap = {
      integer: 'text',
      number: 'text',
      date: 'text',
      datetime: 'text',
      time: 'text',
      zip: 'text',
      postal: 'text',
      color: 'text',
    }
    return typeMap[type] || type
  }

  // Get inputmode attribute
  getInputMode(type) {
    const modeMap = {
      email: 'email',
      tel: 'tel',
      url: 'url',
      number: 'decimal',
      integer: 'numeric',
    }
    return modeMap[type] || null
  }

  renderInput(id, name, type) {
    const label = this.getAttribute('label') || name
    const inputType = this.getInputType(type)
    const dataType = this.getDataType(type)
    const inputMode = this.getInputMode(type)
    const validationAttrs = this.getValidationAttrs()

    const dataTypeAttr = dataType && !this.hasAttribute('data-type') ? `data-type="${dataType}"` : ''
    const inputModeAttr = inputMode ? `inputmode="${inputMode}"` : ''
    const flatpickrClass =
      ['date', 'datetime', 'time'].includes(type) ? 'flatpickr-input' : ''

    const inputHTML = `
      <div class="flex relative sm:max-w-sm">
        <input
          class="block w-full px-1.5 transition ${flatpickrClass}"
          type="${inputType}"
          id="${id}"
          name="${name}"
          ${dataTypeAttr}
          ${inputModeAttr}
          ${validationAttrs}
          aria-describedby="${id}-error"
        />
      </div>
    `

    this.innerHTML = this.getWrapper(id, label, inputHTML)
  }

  renderColorInput(id, name) {
    const label = this.getAttribute('label') || name
    const value = this.getAttribute('value') || '#888888'
    const validationAttrs = this.getValidationAttrs()

    const inputHTML = `
      <div class="flex relative sm:max-w-sm">
        <input
          class="block w-full px-1.5 transition rounded-r-none"
          type="text"
          id="${id}"
          name="${name}"
          data-type="color"
          value="${value}"
          ${validationAttrs}
          aria-describedby="${id}-error"
        />
        <label
          id="${id}-color-label"
          for="${id}-color"
          class="border border-l-0 border-gray-350 dark:border-gray-500 cursor-pointer w-20 rounded-r"
          style="background-color: ${value}"
        >
          <input
            type="color"
            id="${id}-color"
            class="invisible w-full h-full"
            value="${value}"
          />
        </label>
      </div>
    `

    this.innerHTML = this.getWrapper(id, label, inputHTML)

    // Set up color picker sync
    this.setupColorSync(id)
  }

  setupColorSync(id) {
    const textInput = this.querySelector(`#${id}`)
    const colorInput = this.querySelector(`#${id}-color`)
    const colorLabel = this.querySelector(`#${id}-color-label`)

    if (!textInput || !colorInput || !colorLabel) return

    // Sync color picker to text input
    colorInput.addEventListener('input', () => {
      textInput.value = colorInput.value
      colorLabel.style.backgroundColor = colorInput.value
      textInput.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // Sync text input to color picker (on blur to allow typing)
    textInput.addEventListener('blur', () => {
      const val = textInput.value
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        colorInput.value = val
        colorLabel.style.backgroundColor = val
      }
    })
  }

  updateColorSwatch(value) {
    const colorLabel = this.querySelector('[id$="-color-label"]')
    const colorInput = this.querySelector('[type="color"]')
    if (colorLabel && /^#[0-9A-Fa-f]{6}$/.test(value)) {
      colorLabel.style.backgroundColor = value
      if (colorInput) colorInput.value = value
    }
  }

  renderSelect(id, name) {
    const label = this.getAttribute('label') || name
    const options = this.parseOptions()
    const validationAttrs = this.getValidationAttrs()

    const optionsHTML = options
      .map((opt) => {
        const val = typeof opt === 'object' ? opt.value : opt
        const lbl = typeof opt === 'object' ? opt.label : opt
        return `<option value="${val}">${lbl}</option>`
      })
      .join('')

    const selectHTML = `
      <select
        class="block w-full sm:max-w-sm"
        id="${id}"
        name="${name}"
        ${validationAttrs}
        aria-describedby="${id}-error"
      >
        <option value=""></option>
        ${optionsHTML}
      </select>
    `

    this.innerHTML = this.getWrapper(id, label, selectHTML)
  }

  renderGroup(id, name, type) {
    const label = this.getAttribute('label') || name
    const options = this.parseOptions()
    const isCheckbox = type === 'checkbox'
    const errorMsg = this.getAttribute('error-msg') || ''
    const isRequired = this.hasAttribute('required')
    const roundedClass = isCheckbox ? '' : 'rounded-full'

    const optionsHTML = options
      .map((opt, index) => {
        const val = typeof opt === 'object' ? opt.value : opt
        const lbl = typeof opt === 'object' ? opt.label : opt
        const optId = `${id}-${index + 1}-${val.toLowerCase().replace(/\s+/g, '-')}`

        return `
          <div class="pt-2">
            <div class="flex items-start h-5">
              <label class="checked-border ${roundedClass}" for="${optId}">
                <input
                  id="${optId}"
                  ${isRequired ? 'required' : ''}
                  name="${name}"
                  type="${type}"
                  value="${val}"
                  ${errorMsg ? `data-error-default="${errorMsg}"` : ''}
                  class="block transition"
                  aria-describedby="${id}-error"
                />
                <span class="checked-label">${lbl}</span>
              </label>
            </div>
          </div>
        `
      })
      .join('')

    const groupHTML = `
      <div class="flex relative sm:max-w-sm">
        <div class="mb-3 sm:col-span-2 space-y-3">
          ${optionsHTML}
        </div>
      </div>
    `

    this.innerHTML = this.getWrapper(id, label, groupHTML)
  }

  renderTextarea(id, name) {
    const label = this.getAttribute('label') || name
    const validationAttrs = this.getValidationAttrs()
    const placeholder = this.getAttribute('placeholder') || ''

    const textareaHTML = `
      <textarea
        id="${id}"
        name="${name}"
        class="w-full"
        ${validationAttrs}
        ${placeholder ? `placeholder="${placeholder}"` : ''}
        aria-describedby="${id}-error"
      ></textarea>
    `

    this.innerHTML = this.getWrapper(id, label, textareaHTML)
  }
}

customElements.define('form-field', FormField)
