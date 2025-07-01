import { vi } from "vitest"

export const mockFs = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  exists: vi.fn(),
  createDir: vi.fn(),
  removeFile: vi.fn(),
  removeDir: vi.fn(),
  copyFile: vi.fn(),
  readDir: vi.fn(),
  metadata: vi.fn(),
}

vi.mock("@tauri-apps/api/fs", () => mockFs)

// Helper for simulating file system state
export class MockFileSystem {
  private files = new Map<string, string | Uint8Array>()
  private directories = new Set<string>()

  constructor() {
    this.setupMocks()
  }

  private setupMocks() {
    mockFs.readFile.mockImplementation(async (path: string) => {
      const content = this.files.get(path)
      if (!content) throw new Error(`File not found: ${path}`)
      return content instanceof Uint8Array ? content : new TextEncoder().encode(content)
    })

    mockFs.readTextFile.mockImplementation(async (path: string) => {
      const content = this.files.get(path)
      if (!content) throw new Error(`File not found: ${path}`)
      return content.toString()
    })

    mockFs.writeFile.mockImplementation(async (path: string, content: Uint8Array) => {
      this.files.set(path, content)
    })

    mockFs.writeTextFile.mockImplementation(async (path: string, content: string) => {
      this.files.set(path, content)
    })

    mockFs.exists.mockImplementation(async (path: string) => {
      return this.files.has(path) || this.directories.has(path)
    })

    mockFs.createDir.mockImplementation(async (path: string) => {
      this.directories.add(path)
    })

    mockFs.removeFile.mockImplementation(async (path: string) => {
      this.files.delete(path)
    })

    mockFs.removeDir.mockImplementation(async (path: string) => {
      this.directories.delete(path)
      // Remove all files in directory
      for (const filePath of this.files.keys()) {
        if (filePath.startsWith(`${path}/`)) {
          this.files.delete(filePath)
        }
      }
    })

    mockFs.copyFile.mockImplementation(async (src: string, dest: string) => {
      const content = this.files.get(src)
      if (!content) throw new Error(`Source file not found: ${src}`)
      this.files.set(dest, content)
    })

    mockFs.readDir.mockImplementation(async (path: string) => {
      const entries = []

      // Add directories
      for (const dir of this.directories) {
        if (dir.startsWith(`${path}/`) && !dir.substring(path.length + 1).includes("/")) {
          entries.push({
            name: dir.substring(path.length + 1),
            isDirectory: true,
            isFile: false,
          })
        }
      }

      // Add files
      for (const filePath of this.files.keys()) {
        if (filePath.startsWith(`${path}/`) && !filePath.substring(path.length + 1).includes("/")) {
          entries.push({
            name: filePath.substring(path.length + 1),
            isDirectory: false,
            isFile: true,
          })
        }
      }

      return entries
    })

    mockFs.metadata.mockImplementation(async (path: string) => {
      if (!this.files.has(path) && !this.directories.has(path)) {
        throw new Error(`Path not found: ${path}`)
      }

      const isFile = this.files.has(path)
      const content = this.files.get(path)

      return {
        isFile,
        isDirectory: !isFile,
        size: isFile ? (content ? content.length : 0) : 0,
        modifiedAt: new Date(),
        accessedAt: new Date(),
        createdAt: new Date(),
        readonly: false,
      }
    })
  }

  addFile(path: string, content: string | Uint8Array) {
    this.files.set(path, content)
    return this
  }

  addDirectory(path: string) {
    this.directories.add(path)
    return this
  }

  addJsonFile(path: string, data: any) {
    this.files.set(path, JSON.stringify(data, null, 2))
    return this
  }

  addBinaryFile(path: string, size = 1024) {
    const content = new Uint8Array(size)
    content.fill(0x42) // Fill with 'B' character
    this.files.set(path, content)
    return this
  }

  addAudioFile(path: string) {
    // Create fake audio data for testing
    const fakeAudioData = new Uint8Array([
      0x49,
      0x44,
      0x33,
      0x03,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00, // ID3 header
      0xff,
      0xfb,
      0x90,
      0x00, // MP3 frame header
      ...Array(100)
        .fill(0)
        .map(() => Math.floor(Math.random() * 256)),
    ])
    this.files.set(path, fakeAudioData)
    return this
  }

  removeFile(path: string) {
    this.files.delete(path)
    return this
  }

  removeDirectory(path: string) {
    this.directories.delete(path)
    return this
  }

  reset() {
    this.files.clear()
    this.directories.clear()
    vi.clearAllMocks()
  }

  getFiles() {
    return Array.from(this.files.keys())
  }

  getDirectories() {
    return Array.from(this.directories)
  }

  hasFile(path: string) {
    return this.files.has(path)
  }

  hasDirectory(path: string) {
    return this.directories.has(path)
  }
}

// Default instance for tests
export const mockFileSystem = new MockFileSystem()
