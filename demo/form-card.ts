/**
 * FormCard Custom Element
 * A card component for grouping form sections with optional title and lead text.
 *
 * Usage:
 *   <form-card title="Section Title" lead="Description text">
 *     <form-field ...></form-field>
 *   </form-card>
 *
 * If neither title nor lead is provided, the header is omitted.
 */

class FormCard extends HTMLElement {
  private rendered = false

  connectedCallback(): void {
    if (this.rendered) return
    this.rendered = true
    // Defer to allow HTML parser to finish adding children
    requestAnimationFrame(() => this.render())
  }

  private render(): void {
    // Guard against double render
    if (this.querySelector(':scope > section')) return

    const title = this.getAttribute('title')
    const lead = this.getAttribute('lead')
    const sectionId = this.getAttribute('id')

    // Remove id from custom element to put on section
    if (title) this.removeAttribute('title')
    if (sectionId) this.removeAttribute('id')

    // Create section element
    const section = document.createElement('section')
    if (sectionId) section.id = sectionId
    section.className = `space-y-4 scroll-mt-4 rounded-xl border border-indigo-100/80
      bg-linear-120 from-indigo-50/70 to-indigo-100/80 shadow-sm dark:border-indigo-400/10
      dark:from-indigo-950/60 dark:to-indigo-950/10`

    // Only add header if title or lead exists
    if (title || lead) {
      const header = document.createElement('div')
      header.className =
        'rounded-t-xl mb-8 p-3 sm:p-5 sm:pt-4 border-b border-indigo-600/10 bg-linear-180 from-white/20 to-white/50 dark:from-transparent dark:to-black/15'

      if (title) {
        const h2 = document.createElement('h2')
        h2.className =
          'text-lg font-semibold tracking-wide text-indigo-800/90 dark:text-indigo-200/90 mb-2'
        h2.textContent = title
        header.appendChild(h2)
      }

      if (lead) {
        const p = document.createElement('p')
        p.className = 'leading-relaxed text-indigo-900/70 dark:text-indigo-200/70'
        p.innerHTML = lead

        header.appendChild(p)
      }

      section.appendChild(header)
    }

    // Create content wrapper and move children
    const content = document.createElement('div')
    content.className = 'space-y-3 px-3 pb-3 sm:px-5 sm:pb-5'

    // Move all child nodes to content wrapper
    while (this.firstChild) {
      content.appendChild(this.firstChild)
    }

    section.appendChild(content)
    this.appendChild(section)
  }
}

customElements.define('form-card', FormCard)
