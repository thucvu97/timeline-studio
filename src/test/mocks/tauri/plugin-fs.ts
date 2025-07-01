/**
 * Mock for @tauri-apps/plugin-fs
 */

import { vi } from "vitest"

export const readTextFile = vi.fn()
export const writeTextFile = vi.fn()
export const readFile = vi.fn()
export const writeFile = vi.fn()
export const exists = vi.fn()
export const mkdir = vi.fn()
export const readDir = vi.fn()
export const remove = vi.fn()
export const rename = vi.fn()
export const copyFile = vi.fn()

// Export default for compatibility
const fsMock = {
  readTextFile,
  writeTextFile,
  readFile,
  writeFile,
  exists,
  mkdir,
  readDir,
  remove,
  rename,
  copyFile,
}

export default fsMock
