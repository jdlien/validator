/**
 * FormField Custom Element
 * A reusable form field component that reduces boilerplate for forms using @jdlien/validator
 *
 * Usage:
 *   <form-field name="email" label="Email" type="email" required></form-field>
 *   <form-field name="color" label="Color" type="select" options="red,green,blue"></form-field>
 *   <form-field name="choice" label="Choose" type="radio" options="a,b,c" required></form-field>
 */
// DOM helper - our mini jQuery
function el(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        if (value === undefined || value === false)
            continue;
        if (value === true) {
            element.setAttribute(key, '');
        }
        else if (key === 'className') {
            element.className = value;
        }
        else if (key.startsWith('data-')) {
            element.setAttribute(key, value);
        }
        else {
            element.setAttribute(key, value);
        }
    }
    for (const child of children) {
        if (child === null || child === undefined)
            continue;
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        }
        else {
            element.appendChild(child);
        }
    }
    return element;
}
// Helper to create element with innerHTML (for hint text with HTML)
function elHtml(tag, attrs = {}, html) {
    const element = el(tag, attrs);
    element.innerHTML = html;
    return element;
}
// Attribute mappings
const ATTR_MAP = {
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
};
const DATA_TYPE_MAP = {
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
};
const INPUT_TYPE_MAP = {
    integer: 'text',
    number: 'text',
    date: 'text',
    datetime: 'text',
    time: 'text',
    zip: 'text',
    postal: 'text',
    color: 'text',
};
const INPUT_MODE_MAP = {
    email: 'email',
    tel: 'tel',
    url: 'url',
    number: 'decimal',
    integer: 'numeric',
};
class FormField extends HTMLElement {
    static get observedAttributes() {
        return ['value', 'disabled'];
    }
    connectedCallback() {
        this.render();
    }
    attributeChangedCallback(name, _oldValue, newValue) {
        if (!this.isConnected)
            return;
        const input = this.querySelector('input, select, textarea');
        if (!input)
            return;
        if (name === 'value') {
            input.value = newValue || '';
            if (this.getAttribute('type') === 'color') {
                this.updateColorSwatch(newValue || '');
            }
        }
        else if (name === 'disabled') {
            ;
            input.disabled = newValue !== null;
        }
    }
    render() {
        const type = (this.getAttribute('type') || 'text');
        const name = this.getAttribute('name') || '';
        const id = this.getAttribute('id') || name;
        // Remove id from custom element to avoid duplicates
        this.removeAttribute('id');
        if (type === 'textarea') {
            this.renderTextarea(id, name);
        }
        else if (type === 'select') {
            this.renderSelect(id, name);
        }
        else if ((type === 'radio' || type === 'checkbox') && this.hasAttribute('options')) {
            this.renderGroup(id, name, type);
        }
        else if (type === 'color') {
            this.renderColorInput(id, name);
        }
        else {
            this.renderInput(id, name, type);
        }
    }
    parseOptions() {
        const optionsAttr = this.getAttribute('options');
        if (!optionsAttr)
            return [];
        if (optionsAttr.startsWith('[')) {
            try {
                return JSON.parse(optionsAttr);
            }
            catch {
                console.warn('Failed to parse options as JSON');
            }
        }
        return optionsAttr.split(',').map((opt) => {
            const trimmed = opt.trim();
            return { value: trimmed, label: trimmed };
        });
    }
    getValidationAttrs() {
        const attrs = {};
        for (const [formFieldAttr, inputAttr] of Object.entries(ATTR_MAP)) {
            if (this.hasAttribute(formFieldAttr)) {
                const val = this.getAttribute(formFieldAttr);
                if (formFieldAttr === 'required' || formFieldAttr === 'disabled') {
                    attrs[inputAttr] = true;
                }
                else {
                    attrs[inputAttr] = val || undefined;
                }
            }
        }
        // Copy data-* attributes directly
        for (const attr of Array.from(this.attributes)) {
            if (attr.name.startsWith('data-') && !Object.values(ATTR_MAP).includes(attr.name)) {
                attrs[attr.name] = attr.value;
            }
        }
        return attrs;
    }
    buildWrapper(id, labelText, content) {
        const hint = this.getAttribute('hint');
        return el('div', { className: 'sm:grid sm:grid-cols-3 sm:items-start sm:gap-4' }, [
            el('label', { for: id, id: `${id}-label`, className: 'block font-medium sm:mt-px sm:pt-1' }, [
                labelText,
            ]),
            el('div', { className: 'my-0.5 sm:mt-0 sm:col-span-2' }, [
                content,
                hint
                    ? elHtml('p', { className: 'mt-1 text-sm text-zinc-500 dark:text-zinc-400' }, hint)
                    : null,
                el('div', { style: 'min-height: 20px' }, [
                    el('div', {
                        className: 'error opacity-0 mt-1 overflow-hidden text-sm text-pink-600 dark:text-pink-400',
                        id: `${id}-error`,
                    }),
                ]),
            ]),
        ]);
    }
    renderInput(id, name, type) {
        const label = this.getAttribute('label') || name;
        const inputType = INPUT_TYPE_MAP[type] || type;
        const dataType = DATA_TYPE_MAP[type];
        const inputMode = INPUT_MODE_MAP[type];
        const validationAttrs = this.getValidationAttrs();
        const flatpickrClass = ['date', 'datetime', 'time'].includes(type) ? ' flatpickr-input' : '';
        const input = el('input', {
            className: `block w-full transition${flatpickrClass}`,
            type: inputType,
            id,
            name,
            'aria-describedby': `${id}-error`,
            ...(dataType && !this.hasAttribute('data-type') ? { 'data-type': dataType } : {}),
            ...(inputMode ? { inputmode: inputMode } : {}),
            ...validationAttrs,
        });
        const wrapper = el('div', { className: 'flex relative sm:max-w-sm' }, [input]);
        this.appendChild(this.buildWrapper(id, label, wrapper));
    }
    renderColorInput(id, name) {
        const label = this.getAttribute('label') || name;
        const value = this.getAttribute('value') || '#888888';
        const validationAttrs = this.getValidationAttrs();
        const textInput = el('input', {
            className: 'block w-full px-1.5 transition rounded-r-none',
            type: 'text',
            id,
            name,
            'data-type': 'color',
            value,
            'aria-describedby': `${id}-error`,
            ...validationAttrs,
        });
        const colorInput = el('input', {
            type: 'color',
            id: `${id}-color`,
            className: 'invisible w-full h-full',
            value,
        });
        const colorLabel = el('label', {
            id: `${id}-color-label`,
            for: `${id}-color`,
            className: 'border border-l-0 border-zinc-300 dark:border-zinc-700/60 cursor-pointer w-20 rounded-r-lg',
            style: `background-color: ${value}`,
        }, [colorInput]);
        const wrapper = el('div', { className: 'color-input-wrapper flex relative sm:max-w-sm rounded-lg' }, [textInput, colorLabel]);
        this.appendChild(this.buildWrapper(id, label, wrapper));
        // Set up color sync with direct references (no querying needed!)
        colorInput.addEventListener('input', () => {
            textInput.value = colorInput.value;
            colorLabel.style.backgroundColor = colorInput.value;
            textInput.dispatchEvent(new Event('input', { bubbles: true }));
        });
        textInput.addEventListener('blur', () => {
            if (/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) {
                colorInput.value = textInput.value;
                colorLabel.style.backgroundColor = textInput.value;
            }
        });
    }
    updateColorSwatch(value) {
        const colorLabel = this.querySelector('[id$="-color-label"]');
        const colorInput = this.querySelector('[type="color"]');
        if (colorLabel && /^#[0-9A-Fa-f]{6}$/.test(value)) {
            colorLabel.style.backgroundColor = value;
            if (colorInput)
                colorInput.value = value;
        }
    }
    renderSelect(id, name) {
        const label = this.getAttribute('label') || name;
        const options = this.parseOptions();
        const validationAttrs = this.getValidationAttrs();
        const select = el('select', {
            className: 'block w-full sm:max-w-sm',
            id,
            name,
            'aria-describedby': `${id}-error`,
            ...validationAttrs,
        }, [
            el('option', { value: '' }),
            ...options.map((opt) => el('option', { value: opt.value }, [opt.label])),
        ]);
        this.appendChild(this.buildWrapper(id, label, select));
    }
    renderGroup(id, name, type) {
        const label = this.getAttribute('label') || name;
        const options = this.parseOptions();
        const errorMsg = this.getAttribute('error-msg') || '';
        const isRequired = this.hasAttribute('required');
        const roundedClass = type === 'checkbox' ? '' : ' rounded-full';
        const optionElements = options.map((opt, index) => {
            const optId = `${id}-${index + 1}-${opt.value.toLowerCase().replace(/\s+/g, '-')}`;
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
            ]);
        });
        const wrapper = el('div', { className: 'flex relative sm:max-w-sm' }, [
            el('div', { className: 'mb-3 sm:col-span-2 space-y-3' }, optionElements),
        ]);
        this.appendChild(this.buildWrapper(id, label, wrapper));
    }
    renderTextarea(id, name) {
        const label = this.getAttribute('label') || name;
        const placeholder = this.getAttribute('placeholder') || '';
        const validationAttrs = this.getValidationAttrs();
        const textarea = el('textarea', {
            id,
            name,
            className: 'w-full',
            'aria-describedby': `${id}-error`,
            ...(placeholder ? { placeholder } : {}),
            ...validationAttrs,
        });
        this.appendChild(this.buildWrapper(id, label, textarea));
    }
}
customElements.define('form-field', FormField);
