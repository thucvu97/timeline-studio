// Мокаем console.log и console.error
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  BROWSER_TABS,
  DEFAULT_LAYOUT,
  DEFAULT_SIZE,
  DEFAULT_TAB,
  LAYOUTS,
  PREVIEW_SIZES,
  userSettingsMachine,
} from "./user-settings-machine"

vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

// Примечание: Мок для IndexedDB удален, так как теперь используется Tauri Store

describe("UserSettingsMachine", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()
  })

  it("should have correct constants", () => {
    // Проверяем константы
    expect(DEFAULT_SIZE).toBe(100)
    expect(DEFAULT_TAB).toBe("media")
    expect(DEFAULT_LAYOUT).toBe("default")

    // Проверяем массивы
    expect(PREVIEW_SIZES).toContain(DEFAULT_SIZE)
    expect(BROWSER_TABS).toContain(DEFAULT_TAB)
    expect(LAYOUTS).toContain(DEFAULT_LAYOUT)
  })

  it("should have correct preview sizes", () => {
    expect(PREVIEW_SIZES).toEqual([60, 80, 100, 125, 150, 200, 250, 300, 400, 500])
  })

  it("should have correct browser tabs", () => {
    expect(BROWSER_TABS).toEqual(["media", "music", "transitions", "effects", "filters", "templates", "subtitles"])
  })

  it("should have correct layouts", () => {
    expect(LAYOUTS).toEqual(["default", "options", "vertical", "dual"])
  })

  it("should have a valid machine definition", () => {
    // Проверяем, что машина состояний определена
    expect(userSettingsMachine).toBeDefined()

    // Проверяем основные свойства машины состояний
    expect(userSettingsMachine.id).toBe("user-settings-v3")
    expect(userSettingsMachine.config.initial).toBe("idle")

    // Проверяем, что машина имеет нужные состояния
    expect(userSettingsMachine.config.states).toHaveProperty("idle")
  })

  it("should have a valid machine definition with correct states and transitions", () => {
    // Проверяем, что машина состояний имеет правильные состояния и переходы
    const config = userSettingsMachine.config

    // Проверяем начальное состояние
    expect(config.initial).toBe("idle")

    // Проверяем состояние idle
    expect(config.states).toHaveProperty("idle")
  })

  describe("Machine events", () => {
    // Тестируем обработку события UPDATE_LAYOUT
    it("should handle UPDATE_LAYOUT event", () => {
      // Проверяем, что в состоянии idle есть переход для события UPDATE_LAYOUT
      const idleState = userSettingsMachine.config.states?.idle
      expect(idleState?.on).toHaveProperty("UPDATE_LAYOUT")
    })

    // Тестируем обработку события UPDATE_PLAYER_SCREENSHOTS_PATH
    it("should handle UPDATE_PLAYER_SCREENSHOTS_PATH event", () => {
      // Проверяем, что в состоянии idle есть переход для события UPDATE_PLAYER_SCREENSHOTS_PATH
      const idleState = userSettingsMachine.config.states?.idle
      expect(idleState?.on).toHaveProperty("UPDATE_PLAYER_SCREENSHOTS_PATH")
    })

    // Тестируем обработку события UPDATE_SCREENSHOTS_PATH
    it("should handle UPDATE_SCREENSHOTS_PATH event", () => {
      // Проверяем, что в состоянии idle есть переход для события UPDATE_SCREENSHOTS_PATH
      const idleState = userSettingsMachine.config.states?.idle
      expect(idleState?.on).toHaveProperty("UPDATE_SCREENSHOTS_PATH")
    })

    // Тестируем обработку события UPDATE_OPENAI_API_KEY
    it("should handle UPDATE_OPENAI_API_KEY event", () => {
      // Проверяем, что в состоянии idle есть переход для события UPDATE_OPENAI_API_KEY
      const idleState = userSettingsMachine.config.states?.idle
      expect(idleState?.on).toHaveProperty("UPDATE_OPENAI_API_KEY")
    })

    // Тестируем обработку события UPDATE_CLAUDE_API_KEY
    it("should handle UPDATE_CLAUDE_API_KEY event", () => {
      // Проверяем, что в состоянии idle есть переход для события UPDATE_CLAUDE_API_KEY
      const idleState = userSettingsMachine.config.states?.idle
      expect(idleState?.on).toHaveProperty("UPDATE_CLAUDE_API_KEY")
    })

    // Тестируем обработку события UPDATE_ACTIVE_TAB
    it("should handle UPDATE_ACTIVE_TAB event", () => {
      // Проверяем, что в состоянии idle есть переход для события UPDATE_ACTIVE_TAB
      const idleState = userSettingsMachine.config.states?.idle
      expect(idleState?.on).toHaveProperty("UPDATE_ACTIVE_TAB")
    })

    // Тестируем обработку события UPDATE_PREVIEW_SIZE
    it("should handle UPDATE_PREVIEW_SIZE event", () => {
      // Проверяем, что в состоянии idle есть переход для события UPDATE_PREVIEW_SIZE
      const idleState = userSettingsMachine.config.states?.idle
      expect(idleState?.on).toHaveProperty("UPDATE_PREVIEW_SIZE")
    })

    // Тестируем обработку события UPDATE_ALL
    it("should handle UPDATE_ALL event", () => {
      // Проверяем, что в состоянии idle есть переход для события UPDATE_ALL
      const idleState = userSettingsMachine.config.states?.idle
      expect(idleState?.on).toHaveProperty("UPDATE_ALL")
    })
  })

  describe("Machine events", () => {
    it("should have events in idle state", () => {
      // Проверяем, что в состоянии idle есть обработчики событий
      const idleState = userSettingsMachine.config.states?.idle

      // Проверяем, что события определены
      expect(idleState?.on?.UPDATE_LAYOUT).toBeDefined()
      expect(idleState?.on?.UPDATE_PLAYER_SCREENSHOTS_PATH).toBeDefined()
      expect(idleState?.on?.UPDATE_SCREENSHOTS_PATH).toBeDefined()
      expect(idleState?.on?.UPDATE_OPENAI_API_KEY).toBeDefined()
      expect(idleState?.on?.UPDATE_CLAUDE_API_KEY).toBeDefined()
      expect(idleState?.on?.UPDATE_ACTIVE_TAB).toBeDefined()
      expect(idleState?.on?.UPDATE_PREVIEW_SIZE).toBeDefined()
      expect(idleState?.on?.UPDATE_ALL).toBeDefined()
    })
  })

  describe("Machine state transitions", () => {
    it("should have correct initial state", () => {
      // Проверяем, что начальное состояние машины - idle
      expect(userSettingsMachine.config.initial).toBe("idle")
    })
  })

  describe("Initial settings", () => {
    beforeEach(() => {
      // Сбрасываем моки перед каждым тестом
      vi.clearAllMocks()
    })

    it("should have default settings in initial context", () => {
      // Проверяем, что начальный контекст содержит настройки по умолчанию
      const initialContext = userSettingsMachine.config.context

      // Используем as для приведения типа и импортируем тип из файла
      interface UserContext {
        previewSizes: { MEDIA: number; TRANSITIONS: number; TEMPLATES: number }
        activeTab: string
        isLoaded: boolean
      }

      const typedContext = initialContext as unknown as UserContext

      expect(typedContext.previewSizes.MEDIA).toBe(DEFAULT_SIZE)
      expect(typedContext.activeTab).toBe(DEFAULT_TAB)
      expect(typedContext.isLoaded).toBe(true)
    })
  })
})
