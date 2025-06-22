import "@testing-library/jest-dom"

import React from "react"

import { cleanup } from "@testing-library/react"
import { afterEach, beforeAll, vi } from "vitest"

// Import modular mocks
import "@/test/mocks/tauri"
import "@/test/mocks/browser"
import "@/test/mocks/libraries"

// Mock common providers that are used in tests
vi.mock("@/features/user-settings", () => ({
  useUserSettings: () => ({
    openAiApiKey: "test-api-key",
    claudeApiKey: "test-claude-key",
    updateSettings: vi.fn(),
  }),
  UserSettingsProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock useApiKeys hook
vi.mock("@/features/user-settings/hooks/use-api-keys")

vi.mock("@/features/modals", () => ({
  useModal: () => ({
    openModal: vi.fn(),
    closeModal: vi.fn(),
    isOpen: false,
  }),
  ModalProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock("@/features/app-state/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/app-state/services")>()
  return {
    ...actual,
    appDirectoriesService: {
      getAppDirectories: vi.fn().mockResolvedValue({
        base_dir: "/Users/test/Movies/Timeline Studio",
      }),
    },
  }
})

// Only absolutely essential global setup
beforeAll(() => {
  // Mock console methods in tests to reduce noise
  global.console = {
    ...console,
    error: vi.fn(),
    warn: vi.fn(),
  }

  // Mock pointer capture methods for Radix UI components
  if (typeof Element !== "undefined") {
    Element.prototype.hasPointerCapture = vi.fn(() => false)
    Element.prototype.setPointerCapture = vi.fn()
    Element.prototype.releasePointerCapture = vi.fn()
  }

  // Mock ResizeObserver for components that use it
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

// Global test environment setup
declare module "vitest" {
  interface Assertion<T = any> {
    toBeInTheDocument(): T
    toHaveClass(className: string): T
    toHaveStyle(style: Record<string, any>): T
  }
}
