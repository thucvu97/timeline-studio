import { vi } from "vitest"

// Create mock functions first
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
  mkdir: vi.fn(),
  remove: vi.fn(),
}

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
      return content
    })

    mockFs.writeFile.mockImplementation(async (path: string, content: Uint8Array) => {
      this.files.set(path, content)
    })

    mockFs.readTextFile.mockImplementation(async (path: string) => {
      const content = this.files.get(path)
      if (!content) throw new Error(`File not found: ${path}`)
      if (typeof content === "string") return content
      return new TextDecoder().decode(content)
    })

    mockFs.writeTextFile.mockImplementation(async (path: string, content: string) => {
      this.files.set(path, content)
    })

    mockFs.exists.mockImplementation(async (path: string) => {
      return this.files.has(path) || this.directories.has(path)
    })

    mockFs.createDir.mockImplementation(async (path: string) => {
      this.directories.add(path)
      // Add parent directories
      const parts = path.split("/")
      for (let i = 1; i < parts.length; i++) {
        this.directories.add(parts.slice(0, i).join("/"))
      }
    })

    mockFs.mkdir.mockImplementation(async (path: string) => {
      this.directories.add(path)
      // Add parent directories
      const parts = path.split("/")
      for (let i = 1; i < parts.length; i++) {
        this.directories.add(parts.slice(0, i).join("/"))
      }
    })

    mockFs.removeFile.mockImplementation(async (path: string) => {
      if (!this.files.has(path)) throw new Error(`File not found: ${path}`)
      this.files.delete(path)
    })

    mockFs.remove.mockImplementation(async (path: string) => {
      if (!this.files.has(path)) throw new Error(`File not found: ${path}`)
      this.files.delete(path)
    })

    mockFs.removeDir.mockImplementation(async (path: string) => {
      if (!this.directories.has(path)) throw new Error(`Directory not found: ${path}`)
      this.directories.delete(path)
      // Remove subdirectories
      for (const dir of Array.from(this.directories)) {
        if (dir.startsWith(`${path}/`)) {
          this.directories.delete(dir)
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
      for (const file of this.files.keys()) {
        if (file.startsWith(`${path}/`) && !file.substring(path.length + 1).includes("/")) {
          entries.push({
            name: file.substring(path.length + 1),
            isDirectory: false,
            isFile: true,
          })
        }
      }

      return entries
    })

    mockFs.metadata.mockImplementation(async (path: string) => {
      if (this.files.has(path)) {
        const content = this.files.get(path)!
        return {
          isFile: true,
          isDirectory: false,
          size: typeof content === "string" ? content.length : content.length,
        }
      }
      if (this.directories.has(path)) {
        return {
          isFile: false,
          isDirectory: true,
          size: 0,
        }
      }
      throw new Error(`Path not found: ${path}`)
    })
  }

  addFile(path: string, content: string | Uint8Array) {
    this.files.set(path, content)
    // Create parent directories
    const parts = path.split("/")
    for (let i = 1; i < parts.length; i++) {
      this.directories.add(parts.slice(0, i).join("/"))
    }
  }

  addAudioFile(path: string) {
    // Create a minimal valid MP3 file (ID3v2 header + dummy data)
    const mp3Header = new Uint8Array([
      0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // ID3v2.4 header
      0xff, 0xfb, 0x90, 0x00, // MP3 frame header
    ])
    this.addFile(path, mp3Header)
  }

  addImageFile(path: string) {
    // Create a minimal valid PNG file
    const pngHeader = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    ])
    this.addFile(path, pngHeader)
  }

  removeFile(path: string) {
    this.files.delete(path)
  }

  createDirectory(path: string) {
    this.directories.add(path)
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

// Export all functions from mockFs directly
export const readFile = mockFs.readFile
export const writeFile = mockFs.writeFile
export const readTextFile = mockFs.readTextFile
export const writeTextFile = mockFs.writeTextFile
export const exists = mockFs.exists
export const createDir = mockFs.createDir
export const removeFile = mockFs.removeFile
export const removeDir = mockFs.removeDir
export const copyFile = mockFs.copyFile
export const readDir = mockFs.readDir
export const metadata = mockFs.metadata
export const mkdir = mockFs.mkdir
export const remove = mockFs.remove

// Mock the module
vi.mock("@tauri-apps/plugin-fs", () => ({
  readFile: mockFs.readFile,
  writeFile: mockFs.writeFile,
  readTextFile: mockFs.readTextFile,
  writeTextFile: mockFs.writeTextFile,
  exists: mockFs.exists,
  createDir: mockFs.createDir,
  removeFile: mockFs.removeFile,
  removeDir: mockFs.removeDir,
  copyFile: mockFs.copyFile,
  readDir: mockFs.readDir,
  metadata: mockFs.metadata,
  mkdir: mockFs.mkdir,
  remove: mockFs.remove,
  mockFileSystem
}))