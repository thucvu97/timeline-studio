/**
 * Mock for @tauri-apps/api/app
 */

import { vi } from "vitest"

export const getName = vi.fn().mockResolvedValue("Timeline Studio")
export const getVersion = vi.fn().mockResolvedValue("0.31.0")
export const getTauriVersion = vi.fn().mockResolvedValue("2.0.0")

// Export default for compatibility
const appMock = {
  getName,
  getVersion,
  getTauriVersion,
}

export default appMock
