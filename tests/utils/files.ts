export function makeFile(size: number, name: string, type?: string): File {
  const content = new Uint8Array(size)
  return new File([content], name, type ? { type } : undefined)
}

export function setInputFiles(input: HTMLInputElement, files: File[]): void {
  const fileList: { [key: number]: File; length: number; item: (i: number) => File | null } = {
    length: files.length,
    item: (index: number) => files[index] || null,
  }

  files.forEach((file, index) => {
    fileList[index] = file
  })

  Object.defineProperty(input, 'files', {
    value: fileList as FileList,
    configurable: true,
  })
}
