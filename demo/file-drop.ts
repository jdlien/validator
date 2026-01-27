/**
 * FileDrop Custom Element
 * A drag-and-drop file input with file list management and remove functionality.
 *
 * Usage:
 *   <file-drop name="files" multiple accept="image/*,.pdf"></file-drop>
 *   <file-drop name="avatar" accept="image/*" data-max-files="1"></file-drop>
 */

class FileDrop extends HTMLElement {
  private input!: HTMLInputElement
  private dropZone!: HTMLLabelElement
  private fileListEl!: HTMLDivElement
  private selectedFiles: File[] = []
  private isInternalChange = false
  private rendered = false

  static get observedAttributes(): string[] {
    return ['disabled']
  }

  connectedCallback(): void {
    if (this.rendered) return
    this.rendered = true
    this.render()
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (!this.isConnected || !this.input) return
    if (name === 'disabled') {
      this.input.disabled = value !== null
      this.dropZone.classList.toggle('opacity-50', value !== null)
      this.dropZone.classList.toggle('pointer-events-none', value !== null)
    }
  }

  /** Access the underlying file input */
  get fileInput(): HTMLInputElement {
    return this.input
  }

  /** Get the current files */
  get files(): File[] {
    return [...this.selectedFiles]
  }

  /** Clear all files */
  clear(): void {
    this.selectedFiles = []
    this.syncFilesToInput()
    this.updateFileList()
  }

  private render(): void {
    const name = this.getAttribute('name') || ''
    const isMultiple = this.hasAttribute('multiple')

    // Generate unique ID
    let id = this.getAttribute('id') || name
    if (!id || document.getElementById(id)) {
      id = `file-${Math.random().toString(36).slice(2, 8)}`
    }
    this.removeAttribute('id')

    // Create hidden file input with passed-through attributes
    this.input = document.createElement('input')
    this.input.type = 'file'
    this.input.id = id
    this.input.name = name
    this.input.className = 'sr-only'
    this.input.setAttribute('aria-describedby', `${id}-error`)

    // Pass through validation attributes
    const passthrough = ['accept', 'multiple', 'required', 'disabled']
    passthrough.forEach((attr) => {
      if (this.hasAttribute(attr)) {
        const val = this.getAttribute(attr)
        if (val === '' || val === null) this.input.setAttribute(attr, '')
        else this.input.setAttribute(attr, val)
      }
    })

    // Pass through data-* attributes
    Array.from(this.attributes).forEach((attr) => {
      if (attr.name.startsWith('data-')) {
        this.input.setAttribute(attr.name, attr.value)
      }
    })

    // File list container
    this.fileListEl = document.createElement('div')
    this.fileListEl.id = `${id}-file-list`
    this.fileListEl.className = 'hidden mt-2 text-sm text-indigo-800 dark:text-indigo-200 space-y-1'

    // Drop zone
    this.dropZone = document.createElement('label')
    this.dropZone.htmlFor = id
    this.dropZone.className =
      'flex flex-col items-center justify-center w-full p-3 border-2 border-dashed ' +
      'border-indigo-400/60 dark:border-indigo-500/50 rounded-lg cursor-pointer ' +
      'bg-indigo-100/50 dark:bg-indigo-900/30 hover:bg-indigo-200/50 dark:hover:bg-indigo-800/30 ' +
      'hover:border-indigo-500/80 dark:hover:border-indigo-400/70 transition-colors'

    this.dropZone.innerHTML = `
      <div class="text-indigo-500 dark:text-indigo-400 mb-2">
        <svg class="size-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
      </div>
      <span class="text-indigo-700 dark:text-indigo-300">
        ${isMultiple ? 'Drop files here or click to browse' : 'Drop file here or click to browse'}
      </span>
      <span class="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1">
        ${isMultiple ? 'Select one or more files' : 'Select a file'}
      </span>
    `

    // Event handlers
    this.setupEventListeners()

    // Append elements
    this.appendChild(this.input)
    this.appendChild(this.dropZone)
    this.appendChild(this.fileListEl)
  }

  private setupEventListeners(): void {
    const isMultiple = this.hasAttribute('multiple')

    // Drag and drop
    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault()
      this.dropZone.classList.add('border-indigo-600', 'bg-indigo-200/70', 'dark:bg-indigo-700/40')
    })

    this.dropZone.addEventListener('dragleave', () => {
      this.dropZone.classList.remove(
        'border-indigo-600',
        'bg-indigo-200/70',
        'dark:bg-indigo-700/40'
      )
    })

    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault()
      this.dropZone.classList.remove(
        'border-indigo-600',
        'bg-indigo-200/70',
        'dark:bg-indigo-700/40'
      )
      if (e.dataTransfer?.files.length) {
        this.addFiles(e.dataTransfer.files, isMultiple)
        this.input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })

    // File picker selection
    this.input.addEventListener('change', () => {
      if (this.isInternalChange) return
      if (this.input.files?.length) {
        this.addFiles(this.input.files, isMultiple)
      }
    })
  }

  private addFiles(files: FileList, multiple: boolean): void {
    if (multiple) {
      this.selectedFiles.push(...Array.from(files))
    } else {
      this.selectedFiles = [files[0]]
    }
    this.syncFilesToInput()
    this.updateFileList()
  }

  private syncFilesToInput(): void {
    const dt = new DataTransfer()
    this.selectedFiles.forEach((f) => dt.items.add(f))
    this.input.files = dt.files
  }

  private removeFile(index: number): void {
    this.selectedFiles.splice(index, 1)
    this.syncFilesToInput()
    this.updateFileList()
    this.isInternalChange = true
    this.input.dispatchEvent(new Event('change', { bubbles: true }))
    this.isInternalChange = false
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  private updateFileList(): void {
    if (this.selectedFiles.length === 0) {
      this.fileListEl.classList.add('hidden')
      this.fileListEl.innerHTML = ''
      return
    }

    this.fileListEl.classList.remove('hidden')
    this.fileListEl.innerHTML = ''

    this.selectedFiles.forEach((file, index) => {
      const item = document.createElement('div')
      item.className =
        'flex items-center gap-2 px-2 py-1 bg-indigo-200/50 dark:bg-indigo-800/40 rounded'

      item.innerHTML = `
        <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <span class="truncate flex-1">${file.name}</span>
        <span class="text-indigo-500 dark:text-indigo-400 text-xs shrink-0">${this.formatSize(file.size)}</span>
      `

      // Remove button
      const removeBtn = document.createElement('button')
      removeBtn.type = 'button'
      removeBtn.className =
        'ml-1 text-indigo-400 hover:text-pink-500 dark:text-indigo-500 dark:hover:text-pink-400 transition-colors'
      removeBtn.setAttribute('aria-label', `Remove ${file.name}`)
      removeBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      `
      removeBtn.addEventListener('click', () => this.removeFile(index))

      item.appendChild(removeBtn)
      this.fileListEl.appendChild(item)
    })
  }
}

customElements.define('file-drop', FileDrop)

export default FileDrop
