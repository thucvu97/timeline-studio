/**
 * Mock for @tauri-apps/api/fs
 */

import { vi } from "vitest"

export const readTextFile = vi.fn()
export const writeTextFile = vi.fn()
export const readBinaryFile = vi.fn()
export const writeBinaryFile = vi.fn()
export const readDir = vi.fn()
export const createDir = vi.fn()
export const removeDir = vi.fn()
export const copyFile = vi.fn()
export const removeFile = vi.fn()
export const renameFile = vi.fn()
export const exists = vi.fn()

// Export default for compatibility
const fsMock = {
  readTextFile,
  writeTextFile,
  readBinaryFile,
  writeBinaryFile,
  readDir,
  createDir,
  removeDir,
  copyFile,
  removeFile,
  renameFile,
  exists,
}

export default fsMock