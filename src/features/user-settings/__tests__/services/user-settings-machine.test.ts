// Мокаем console.log и console.error
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import { DEFAULT_SIZE, PREVIEW_SIZES } from "@/features/media/utils/preview-sizes"

import {
  BROWSER_TABS,
  DEFAULT_LAYOUT,
  DEFAULT_TAB,
  LAYOUTS,
  userSettingsMachine,
} from "../../services/user-settings-machine"

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
    expect(DEFAULT_SIZE).toBe(200)
    expect(DEFAULT_TAB).toBe("media")
    expect(DEFAULT_LAYOUT).toBe("default")

    // Проверяем массивы
    expect(PREVIEW_SIZES).toContain(DEFAULT_SIZE)
    expect(BROWSER_TABS).toContain(DEFAULT_TAB)
    expect(LAYOUTS).toContain(DEFAULT_LAYOUT)
  })

  it("should have correct preview sizes", () => {
    expect(PREVIEW_SIZES).toEqual([125, 150, 200, 250, 300, 400, 500])
  })

  it("should have correct browser tabs", () => {
    expect(BROWSER_TABS).toEqual([
      "media",
      "music",
      "subtitles",
      "transitions",
      "effects",
      "filters",
      "templates",
      "style-templates",
    ])
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
      expect(idleState?.on?.TOGGLE_BROWSER_VISIBILITY).toBeDefined()
      expect(idleState?.on?.UPDATE_PLAYER_VOLUME).toBeDefined()
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

    it.skip("should have default settings in initial context", () => {
      // Проверяем, что начальный контекст содержит настройки по умолчанию
      const initialContext = userSettingsMachine.config.context

      // Используем as для приведения типа и импортируем тип из файла
      interface UserContext {
        previewSizes: { MEDIA: number; TRANSITIONS: number; TEMPLATES: number }
        activeTab: string
        isLoaded: boolean
        isBrowserVisible: boolean
        playerVolume: number
      }

      const typedContext = initialContext as unknown as UserContext

      expect(typedContext.previewSizes.MEDIA).toBe(DEFAULT_SIZE)
      expect(typedContext.activeTab).toBe(DEFAULT_TAB)
      expect(typedContext.isLoaded).toBe(true)
      expect(typedContext.isBrowserVisible).toBe(true)
      expect(typedContext.playerVolume).toBe(100)
    })
  })

  describe("Browser visibility functionality", () => {
    it("should toggle browser visibility when TOGGLE_BROWSER_VISIBILITY event is sent", () => {
      // Создаем актора машины состояний
      const actor = createActor(userSettingsMachine)

      // Запускаем актора
      actor.start()

      // Проверяем начальное значение видимости браузера
      expect(actor.getSnapshot().context.isBrowserVisible).toBe(true)

      // Отправляем событие TOGGLE_BROWSER_VISIBILITY
      actor.send({ type: "TOGGLE_BROWSER_VISIBILITY" })

      // Проверяем, что видимость браузера изменилась
      expect(actor.getSnapshot().context.isBrowserVisible).toBe(false)

      // Отправляем событие TOGGLE_BROWSER_VISIBILITY еще раз
      actor.send({ type: "TOGGLE_BROWSER_VISIBILITY" })

      // Проверяем, что видимость браузера вернулась к исходному значению
      expect(actor.getSnapshot().context.isBrowserVisible).toBe(true)

      // Останавливаем актора
      actor.stop()
    })
  })

  describe("Player volume functionality", () => {
    it("should update player volume when UPDATE_PLAYER_VOLUME event is sent", () => {
      // Создаем актора машины состояний
      const actor = createActor(userSettingsMachine)

      // Запускаем актора
      actor.start()

      // Проверяем начальное значение громкости плеера
      expect(actor.getSnapshot().context.playerVolume).toBe(100)

      // Отправляем событие UPDATE_PLAYER_VOLUME с новым значением громкости
      actor.send({ type: "UPDATE_PLAYER_VOLUME", volume: 50 })

      // Проверяем, что громкость плеера изменилась
      expect(actor.getSnapshot().context.playerVolume).toBe(50)

      // Отправляем событие UPDATE_PLAYER_VOLUME с минимальным значением громкости
      actor.send({ type: "UPDATE_PLAYER_VOLUME", volume: 0 })

      // Проверяем, что громкость плеера изменилась на минимальное значение
      expect(actor.getSnapshot().context.playerVolume).toBe(0)

      // Отправляем событие UPDATE_PLAYER_VOLUME с максимальным значением громкости
      actor.send({ type: "UPDATE_PLAYER_VOLUME", volume: 100 })

      // Проверяем, что громкость плеера изменилась на максимальное значение
      expect(actor.getSnapshot().context.playerVolume).toBe(100)

      // Останавливаем актора
      actor.stop()
    })
  })
})
