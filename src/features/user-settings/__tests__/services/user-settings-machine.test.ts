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
    expect(LAYOUTS).toEqual(["default", "options", "vertical", "chat"])
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

  describe("Layout switching functionality", () => {
    it("should update layout when UPDATE_LAYOUT event is sent", () => {
      // Создаем актора машины состояний
      const actor = createActor(userSettingsMachine)

      // Запускаем актора
      actor.start()

      // Проверяем начальное значение layout
      expect(actor.getSnapshot().context.layoutMode).toBe(DEFAULT_LAYOUT)

      // Переключаем на options layout
      actor.send({ type: "UPDATE_LAYOUT", layoutMode: "options" })
      expect(actor.getSnapshot().context.layoutMode).toBe("options")

      // Переключаем на vertical layout
      actor.send({ type: "UPDATE_LAYOUT", layoutMode: "vertical" })
      expect(actor.getSnapshot().context.layoutMode).toBe("vertical")

      // Переключаем на chat layout
      actor.send({ type: "UPDATE_LAYOUT", layoutMode: "chat" })
      expect(actor.getSnapshot().context.layoutMode).toBe("chat")

      // Возвращаемся к default layout
      actor.send({ type: "UPDATE_LAYOUT", layoutMode: "default" })
      expect(actor.getSnapshot().context.layoutMode).toBe("default")

      // Останавливаем актора
      actor.stop()
    })

    it("should handle all valid layout modes", () => {
      // Создаем актора машины состояний
      const actor = createActor(userSettingsMachine)

      // Запускаем актора
      actor.start()

      // Проверяем, что все валидные layout режимы работают корректно
      const validLayouts = ["default", "options", "vertical", "chat"] as const

      for (const layout of validLayouts) {
        actor.send({ type: "UPDATE_LAYOUT", layoutMode: layout })
        expect(actor.getSnapshot().context.layoutMode).toBe(layout)
        expect(LAYOUTS).toContain(layout)
      }

      // Останавливаем актора
      actor.stop()
    })

    it("should persist layout change between state updates", () => {
      // Создаем актора машины состояний
      const actor = createActor(userSettingsMachine)

      // Запускаем актора
      actor.start()

      // Переключаем на chat layout
      actor.send({ type: "UPDATE_LAYOUT", layoutMode: "chat" })
      expect(actor.getSnapshot().context.layoutMode).toBe("chat")

      // Выполняем другие операции (например, переключение видимости браузера)
      actor.send({ type: "TOGGLE_BROWSER_VISIBILITY" })

      // Проверяем, что layout остался без изменений
      expect(actor.getSnapshot().context.layoutMode).toBe("chat")

      // Изменяем громкость
      actor.send({ type: "UPDATE_PLAYER_VOLUME", volume: 75 })

      // Проверяем, что layout все еще chat
      expect(actor.getSnapshot().context.layoutMode).toBe("chat")

      // Останавливаем актора
      actor.stop()
    })

    it("should have chat layout in available layouts list", () => {
      // Проверяем, что chat layout присутствует в списке доступных layouts
      expect(LAYOUTS).toContain("chat")
      expect(LAYOUTS).not.toContain("dual")

      // Проверяем, что у нас правильное количество layouts
      expect(LAYOUTS).toHaveLength(4)

      // Проверяем весь список
      expect(LAYOUTS).toEqual(["default", "options", "vertical", "chat"])
    })
  })

  describe("Timeline visibility functionality", () => {
    it("should toggle timeline visibility when TOGGLE_TIMELINE_VISIBILITY event is sent", () => {
      // Создаем актора машины состояний
      const actor = createActor(userSettingsMachine)

      // Запускаем актора
      actor.start()

      // Проверяем начальное значение видимости временной шкалы
      expect(actor.getSnapshot().context.isTimelineVisible).toBe(true)

      // Отправляем событие TOGGLE_TIMELINE_VISIBILITY
      actor.send({ type: "TOGGLE_TIMELINE_VISIBILITY" })

      // Проверяем, что видимость временной шкалы изменилась
      expect(actor.getSnapshot().context.isTimelineVisible).toBe(false)

      // Отправляем событие TOGGLE_TIMELINE_VISIBILITY еще раз
      actor.send({ type: "TOGGLE_TIMELINE_VISIBILITY" })

      // Проверяем, что видимость временной шкалы вернулась к исходному значению
      expect(actor.getSnapshot().context.isTimelineVisible).toBe(true)

      // Останавливаем актора
      actor.stop()
    })

    it("should persist timeline visibility state across other updates", () => {
      // Создаем актора машины состояний
      const actor = createActor(userSettingsMachine)

      // Запускаем актора
      actor.start()

      // Переключаем видимость временной шкалы
      actor.send({ type: "TOGGLE_TIMELINE_VISIBILITY" })
      expect(actor.getSnapshot().context.isTimelineVisible).toBe(false)

      // Выполняем другие операции
      actor.send({ type: "UPDATE_PLAYER_VOLUME", volume: 50 })
      actor.send({ type: "UPDATE_LAYOUT", layoutMode: "vertical" })

      // Проверяем, что видимость временной шкалы осталась без изменений
      expect(actor.getSnapshot().context.isTimelineVisible).toBe(false)

      // Останавливаем актора
      actor.stop()
    })
  })

  describe("Options visibility functionality", () => {
    it("should toggle options visibility when TOGGLE_OPTIONS_VISIBILITY event is sent", () => {
      // Создаем актора машины состояний
      const actor = createActor(userSettingsMachine)

      // Запускаем актора
      actor.start()

      // Проверяем начальное значение видимости опций
      expect(actor.getSnapshot().context.isOptionsVisible).toBe(true)

      // Отправляем событие TOGGLE_OPTIONS_VISIBILITY
      actor.send({ type: "TOGGLE_OPTIONS_VISIBILITY" })

      // Проверяем, что видимость опций изменилась
      expect(actor.getSnapshot().context.isOptionsVisible).toBe(false)

      // Отправляем событие TOGGLE_OPTIONS_VISIBILITY еще раз
      actor.send({ type: "TOGGLE_OPTIONS_VISIBILITY" })

      // Проверяем, что видимость опций вернулась к исходному значению
      expect(actor.getSnapshot().context.isOptionsVisible).toBe(true)

      // Останавливаем актора
      actor.stop()
    })

    it("should persist options visibility state across other updates", () => {
      // Создаем актора машины состояний
      const actor = createActor(userSettingsMachine)

      // Запускаем актора
      actor.start()

      // Переключаем видимость опций
      actor.send({ type: "TOGGLE_OPTIONS_VISIBILITY" })
      expect(actor.getSnapshot().context.isOptionsVisible).toBe(false)

      // Выполняем другие операции
      actor.send({ type: "UPDATE_ACTIVE_TAB", tab: "effects" })
      actor.send({ type: "UPDATE_SCREENSHOTS_PATH", path: "new/path" })

      // Проверяем, что видимость опций осталась без изменений
      expect(actor.getSnapshot().context.isOptionsVisible).toBe(false)

      // Останавливаем актора
      actor.stop()
    })
  })

  describe("Multiple visibility toggles", () => {
    it("should handle multiple visibility toggles independently", () => {
      // Создаем актора машины состояний
      const actor = createActor(userSettingsMachine)

      // Запускаем актора
      actor.start()

      // Проверяем начальные значения
      expect(actor.getSnapshot().context.isBrowserVisible).toBe(true)
      expect(actor.getSnapshot().context.isTimelineVisible).toBe(true)
      expect(actor.getSnapshot().context.isOptionsVisible).toBe(true)

      // Переключаем только браузер
      actor.send({ type: "TOGGLE_BROWSER_VISIBILITY" })
      expect(actor.getSnapshot().context.isBrowserVisible).toBe(false)
      expect(actor.getSnapshot().context.isTimelineVisible).toBe(true)
      expect(actor.getSnapshot().context.isOptionsVisible).toBe(true)

      // Переключаем только временную шкалу
      actor.send({ type: "TOGGLE_TIMELINE_VISIBILITY" })
      expect(actor.getSnapshot().context.isBrowserVisible).toBe(false)
      expect(actor.getSnapshot().context.isTimelineVisible).toBe(false)
      expect(actor.getSnapshot().context.isOptionsVisible).toBe(true)

      // Переключаем только опции
      actor.send({ type: "TOGGLE_OPTIONS_VISIBILITY" })
      expect(actor.getSnapshot().context.isBrowserVisible).toBe(false)
      expect(actor.getSnapshot().context.isTimelineVisible).toBe(false)
      expect(actor.getSnapshot().context.isOptionsVisible).toBe(false)

      // Возвращаем все обратно
      actor.send({ type: "TOGGLE_BROWSER_VISIBILITY" })
      actor.send({ type: "TOGGLE_TIMELINE_VISIBILITY" })
      actor.send({ type: "TOGGLE_OPTIONS_VISIBILITY" })
      expect(actor.getSnapshot().context.isBrowserVisible).toBe(true)
      expect(actor.getSnapshot().context.isTimelineVisible).toBe(true)
      expect(actor.getSnapshot().context.isOptionsVisible).toBe(true)

      // Останавливаем актора
      actor.stop()
    })
  })

  describe("Event handler coverage", () => {
    it("should have TOGGLE_TIMELINE_VISIBILITY event handler", () => {
      const idleState = userSettingsMachine.config.states?.idle
      expect(idleState?.on?.TOGGLE_TIMELINE_VISIBILITY).toBeDefined()
    })

    it("should have TOGGLE_OPTIONS_VISIBILITY event handler", () => {
      const idleState = userSettingsMachine.config.states?.idle
      expect(idleState?.on?.TOGGLE_OPTIONS_VISIBILITY).toBeDefined()
    })

    it("should handle UPDATE_ALL with visibility settings", () => {
      const actor = createActor(userSettingsMachine)
      actor.start()

      // Обновляем все настройки, включая видимость
      actor.send({
        type: "UPDATE_ALL",
        settings: {
          isBrowserVisible: false,
          isTimelineVisible: false,
          isOptionsVisible: false,
          playerVolume: 25,
          layoutMode: "chat",
        },
      })

      // Проверяем, что все настройки обновились
      const context = actor.getSnapshot().context
      expect(context.isBrowserVisible).toBe(false)
      expect(context.isTimelineVisible).toBe(false)
      expect(context.isOptionsVisible).toBe(false)
      expect(context.playerVolume).toBe(25)
      expect(context.layoutMode).toBe("chat")

      actor.stop()
    })
  })

  describe("API keys handling", () => {
    it("should handle both API keys updates", () => {
      const actor = createActor(userSettingsMachine)
      actor.start()

      // Проверяем начальные значения
      expect(actor.getSnapshot().context.openAiApiKey).toBe("")
      expect(actor.getSnapshot().context.claudeApiKey).toBe("")

      // Обновляем OpenAI API ключ
      actor.send({ type: "UPDATE_OPENAI_API_KEY", apiKey: "openai-test-key" })
      expect(actor.getSnapshot().context.openAiApiKey).toBe("openai-test-key")
      expect(actor.getSnapshot().context.claudeApiKey).toBe("")

      // Обновляем Claude API ключ
      actor.send({ type: "UPDATE_CLAUDE_API_KEY", apiKey: "claude-test-key" })
      expect(actor.getSnapshot().context.openAiApiKey).toBe("openai-test-key")
      expect(actor.getSnapshot().context.claudeApiKey).toBe("claude-test-key")

      // Очищаем OpenAI API ключ
      actor.send({ type: "UPDATE_OPENAI_API_KEY", apiKey: "" })
      expect(actor.getSnapshot().context.openAiApiKey).toBe("")
      expect(actor.getSnapshot().context.claudeApiKey).toBe("claude-test-key")

      actor.stop()
    })
  })

  describe("Screenshots paths handling", () => {
    it("should handle both screenshots paths independently", () => {
      const actor = createActor(userSettingsMachine)
      actor.start()

      // Проверяем начальные значения
      expect(actor.getSnapshot().context.screenshotsPath).toBe("public/screenshots")
      expect(actor.getSnapshot().context.playerScreenshotsPath).toBe("public/media")

      // Обновляем путь скриншотов
      actor.send({ type: "UPDATE_SCREENSHOTS_PATH", path: "custom/screenshots" })
      expect(actor.getSnapshot().context.screenshotsPath).toBe("custom/screenshots")
      expect(actor.getSnapshot().context.playerScreenshotsPath).toBe("public/media")

      // Обновляем путь скриншотов плеера
      actor.send({ type: "UPDATE_PLAYER_SCREENSHOTS_PATH", path: "custom/player/screenshots" })
      expect(actor.getSnapshot().context.screenshotsPath).toBe("custom/screenshots")
      expect(actor.getSnapshot().context.playerScreenshotsPath).toBe("custom/player/screenshots")

      actor.stop()
    })
  })

  describe("Active tab functionality", () => {
    it("should update active tab to all valid browser tabs", () => {
      const actor = createActor(userSettingsMachine)
      actor.start()

      // Проверяем все допустимые табы
      const allTabs = [
        "media",
        "music",
        "subtitles",
        "transitions",
        "effects",
        "filters",
        "templates",
        "style-templates",
      ] as const

      for (const tab of allTabs) {
        actor.send({ type: "UPDATE_ACTIVE_TAB", tab })
        expect(actor.getSnapshot().context.activeTab).toBe(tab)
        expect(BROWSER_TABS).toContain(tab)
      }

      actor.stop()
    })
  })

  describe("Preview size functionality", () => {
    it("should update preview sizes for different content types", () => {
      const actor = createActor(userSettingsMachine)
      actor.start()

      // Обновляем размер превью для MEDIA
      actor.send({ type: "UPDATE_PREVIEW_SIZE", key: "MEDIA", size: 300 })
      expect(actor.getSnapshot().context.previewSizes.MEDIA).toBe(300)

      // Обновляем размер превью для TRANSITIONS
      actor.send({ type: "UPDATE_PREVIEW_SIZE", key: "TRANSITIONS", size: 250 })
      expect(actor.getSnapshot().context.previewSizes.TRANSITIONS).toBe(250)

      // Обновляем размер превью для TEMPLATES
      actor.send({ type: "UPDATE_PREVIEW_SIZE", key: "TEMPLATES", size: 400 })
      expect(actor.getSnapshot().context.previewSizes.TEMPLATES).toBe(400)

      actor.stop()
    })
  })
})
