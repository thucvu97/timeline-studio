import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  getPlatformInfo,
  getTauriVersion,
  hasServiceWorkers,
  hasWebCrypto,
  isBrowser,
  isDesktop,
  isDevelopment,
  isProduction,
  isServer,
} from "../environment"

describe("Environment Detection Utilities", () => {
  // Сохраняем оригинальные значения
  const originalWindow = global.window
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    // Сбрасываем моки перед каждым тестом
    vi.resetModules()
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Восстанавливаем оригинальные значения
    global.window = originalWindow
    process.env.NODE_ENV = originalNodeEnv
  })

  describe("isDesktop", () => {
    it("should return true when __TAURI__ is defined", () => {
      // @ts-expect-error - mocking global window for testing
      global.window = { __TAURI__: {} }
      expect(isDesktop()).toBe(true)
    })

    it("should return false when __TAURI__ is undefined", () => {
      // @ts-expect-error - mocking global window for testing
      global.window = {}
      expect(isDesktop()).toBe(false)
    })

    it("should return false when window is undefined", () => {
      // @ts-expect-error - mocking global window for testing
      delete global.window
      expect(isDesktop()).toBe(false)
    })
  })

  describe("isBrowser", () => {
    it("should return true when window is defined but __TAURI__ is not", () => {
      // @ts-expect-error - mocking global window for testing
      global.window = {}
      expect(isBrowser()).toBe(true)
    })

    it("should return false when __TAURI__ is defined", () => {
      // @ts-expect-error - mocking global window for testing
      global.window = { __TAURI__: {} }
      expect(isBrowser()).toBe(false)
    })

    it("should return false when window is undefined", () => {
      // @ts-expect-error - mocking global window for testing
      delete global.window
      expect(isBrowser()).toBe(false)
    })
  })

  describe("isServer", () => {
    it("should return true when window is undefined", () => {
      // @ts-expect-error - mocking global window for testing
      delete global.window
      expect(isServer()).toBe(true)
    })

    it("should return false when window is defined", () => {
      // @ts-expect-error - mocking global window for testing
      global.window = {}
      expect(isServer()).toBe(false)
    })
  })

  describe("isDevelopment", () => {
    it("should return true when NODE_ENV is development", () => {
      process.env.NODE_ENV = "development"
      expect(isDevelopment()).toBe(true)
    })

    it("should return false when NODE_ENV is not development", () => {
      process.env.NODE_ENV = "production"
      expect(isDevelopment()).toBe(false)
    })
  })

  describe("isProduction", () => {
    it("should return true when NODE_ENV is production", () => {
      process.env.NODE_ENV = "production"
      expect(isProduction()).toBe(true)
    })

    it("should return false when NODE_ENV is not production", () => {
      process.env.NODE_ENV = "development"
      expect(isProduction()).toBe(false)
    })
  })

  describe("getTauriVersion", () => {
    it("should return null when not in desktop environment", async () => {
      // @ts-expect-error - mocking global window for testing
      global.window = {}
      const version = await getTauriVersion()
      expect(version).toBeNull()
    })

    it("should return version when in desktop environment", async () => {
      // @ts-expect-error - mocking global window for testing
      global.window = { __TAURI__: {} }

      // Мокируем динамический импорт
      vi.doMock("@tauri-apps/api/app", () => ({
        getVersion: vi.fn().mockResolvedValue("1.0.0"),
      }))

      const version = await getTauriVersion()
      expect(version).toBe("1.0.0")
    })

    it("should return null when Tauri API throws error", async () => {
      // @ts-expect-error - mocking global window for testing
      global.window = { __TAURI__: {} }

      // Мокируем динамический импорт с ошибкой
      vi.doMock("@tauri-apps/api/app", () => {
        throw new Error("Failed to load Tauri API")
      })

      const version = await getTauriVersion()
      expect(version).toBeNull()
    })
  })

  describe("hasWebCrypto", () => {
    it("should return true when crypto.subtle is available", () => {
      global.window = {
        crypto: {
          subtle: {},
        },
      }
      expect(hasWebCrypto()).toBe(true)
    })

    it("should return false when crypto.subtle is not available", () => {
      global.window = {
        crypto: {},
      }
      expect(hasWebCrypto()).toBe(false)
    })

    it("should return false when crypto is not available", () => {
      // @ts-expect-error - mocking global window for testing
      global.window = {}
      expect(hasWebCrypto()).toBe(false)
    })

    it("should return false when window is undefined", () => {
      // @ts-expect-error - mocking global window for testing
      delete global.window
      expect(hasWebCrypto()).toBe(false)
    })
  })

  describe("hasServiceWorkers", () => {
    it("should return true when serviceWorker is in navigator", () => {
      // @ts-expect-error - mocking global window for testing
      global.window = {}
      global.navigator = {
        serviceWorker: {},
      }
      expect(hasServiceWorkers()).toBe(true)
    })

    it("should return false when serviceWorker is not in navigator", () => {
      // @ts-expect-error - mocking global window for testing
      global.window = {}
      // @ts-expect-error - mocking global window for testing
      global.navigator = {}
      expect(hasServiceWorkers()).toBe(false)
    })

    it("should return false when window is undefined", () => {
      // @ts-expect-error - mocking global window for testing
      delete global.window
      expect(hasServiceWorkers()).toBe(false)
    })
  })

  describe("getPlatformInfo", () => {
    it("should return browser type when not in desktop", async () => {
      // @ts-expect-error - mocking global window for testing
      global.window = {}
      const info = await getPlatformInfo()
      expect(info).toEqual({ type: "browser" })
    })

    it("should return desktop type with version when in Tauri", async () => {
      // @ts-expect-error - mocking global window for testing
      global.window = { __TAURI__: {} }

      // Мокируем динамический импорт
      vi.doMock("@tauri-apps/api/app", () => ({
        getVersion: vi.fn().mockResolvedValue("2.0.0"),
      }))

      const info = await getPlatformInfo()
      expect(info).toEqual({
        type: "desktop",
        platform: "unknown",
        version: "2.0.0",
      })
    })

    it("should return desktop type without version when Tauri API fails", async () => {
      // @ts-expect-error - mocking global window for testing
      global.window = { __TAURI__: {} }

      // Мокируем динамический импорт с ошибкой
      vi.doMock("@tauri-apps/api/app", () => {
        throw new Error("Failed to load Tauri API")
      })

      const info = await getPlatformInfo()
      expect(info).toEqual({
        type: "desktop",
        platform: "unknown",
        version: undefined,
      })
    })
  })
})
