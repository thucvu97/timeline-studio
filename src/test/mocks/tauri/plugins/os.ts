/**
 * Mock for @tauri-apps/plugin-os
 */

import { vi } from "vitest"

export const platform = vi.fn().mockResolvedValue("darwin")
export const version = vi.fn().mockResolvedValue("14.0.0")
export const family = vi.fn().mockResolvedValue("unix")
export const type = vi.fn().mockResolvedValue("macos")
export const arch = vi.fn().mockResolvedValue("x86_64")
export const locale = vi.fn().mockResolvedValue("en-US")

// Export default for compatibility
const osMock = {
  platform,
  version,
  family,
  type,
  arch,
  locale,
}

export default osMock