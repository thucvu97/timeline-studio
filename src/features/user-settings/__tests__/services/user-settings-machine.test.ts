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

  describe("Social media credentials handling", () => {
    it("should handle YouTube credentials updates", () => {
      const actor = createActor(userSettingsMachine)
      actor.start()

      // Проверяем начальные значения
      expect(actor.getSnapshot().context.youtubeClientId).toBe("")
      expect(actor.getSnapshot().context.youtubeClientSecret).toBe("")
      expect(actor.getSnapshot().context.apiKeysStatus.youtube).toBe("not_set")

      // Обновляем YouTube credentials
      actor.send({
        type: "UPDATE_YOUTUBE_CREDENTIALS",
        clientId: "youtube-client-id",
        clientSecret: "youtube-client-secret"
      })

      const context = actor.getSnapshot().context
      expect(context.youtubeClientId).toBe("youtube-client-id")
      expect(context.youtubeClientSecret).toBe("youtube-client-secret")
      expect(context.apiKeysStatus.youtube).toBe("valid")

      actor.stop()
    })

    it("should handle TikTok credentials updates", () => {
      const actor = createActor(userSettingsMachine)
      actor.start()

      // Проверяем начальные значения
      expect(actor.getSnapshot().context.tiktokClientId).toBe("")
      expect(actor.getSnapshot().context.tiktokClientSecret).toBe("")
      expect(actor.getSnapshot().context.apiKeysStatus.tiktok).toBe("not_set")

      // Обновляем TikTok credentials
      actor.send({
        type: "UPDATE_TIKTOK_CREDENTIALS",
        clientId: "tiktok-client-id",
        clientSecret: "tiktok-client-secret"
      })

      const context = actor.getSnapshot().context
      expect(context.tiktokClientId).toBe("tiktok-client-id")
      expect(context.tiktokClientSecret).toBe("tiktok-client-secret")
      expect(context.apiKeysStatus.tiktok).toBe("valid")

      actor.stop()
    })

    it("should handle Vimeo credentials updates", () => {
      const actor = createActor(userSettingsMachine)
      actor.start()

      // Проверяем начальные значения
      expect(actor.getSnapshot().context.vimeoClientId).toBe("")
      expect(actor.getSnapshot().context.vimeoClientSecret).toBe("")
      expect(actor.getSnapshot().context.vimeoAccessToken).toBe("")
      expect(actor.getSnapshot().context.apiKeysStatus.vimeo).toBe("not_set")

      // Обновляем Vimeo credentials
      actor.send({
        type: "UPDATE_VIMEO_CREDENTIALS",
        clientId: "vimeo-client-id",
        clientSecret: "vimeo-client-secret",
        accessToken: "vimeo-access-token"
      })

      const context = actor.getSnapshot().context
      expect(context.vimeoClientId).toBe("vimeo-client-id")
      expect(context.vimeoClientSecret).toBe("vimeo-client-secret")
      expect(context.vimeoAccessToken).toBe("vimeo-access-token")
      expect(context.apiKeysStatus.vimeo).toBe("valid")

      actor.stop()
    })

    it("should handle Telegram credentials updates", () => {
      const actor = createActor(userSettingsMachine)
      actor.start()

      // Проверяем начальные значения
      expect(actor.getSnapshot().context.telegramBotToken).toBe("")
      expect(actor.getSnapshot().context.telegramChatId).toBe("")
      expect(actor.getSnapshot().context.apiKeysStatus.telegram).toBe("not_set")

      // Обновляем Telegram credentials
      actor.send({
        type: "UPDATE_TELEGRAM_CREDENTIALS",
        botToken: "telegram-bot-token",
        chatId: "telegram-chat-id"
      })

      const context = actor.getSnapshot().context
      expect(context.telegramBotToken).toBe("telegram-bot-token")
      expect(context.telegramChatId).toBe("telegram-chat-id")
      expect(context.apiKeysStatus.telegram).toBe("valid")

      actor.stop()
    })

    it("should set status to not_set when credentials are empty", () => {
      const actor = createActor(userSettingsMachine)
      actor.start()

      // Обновляем YouTube credentials с пустыми значениями
      actor.send({
        type: "UPDATE_YOUTUBE_CREDENTIALS",
        clientId: "",
        clientSecret: ""
      })

      expect(actor.getSnapshot().context.apiKeysStatus.youtube).toBe("not_set")

      // Обновляем TikTok credentials с частично пустыми значениями
      actor.send({
        type: "UPDATE_TIKTOK_CREDENTIALS",
        clientId: "some-id",
        clientSecret: ""
      })

      expect(actor.getSnapshot().context.apiKeysStatus.tiktok).toBe("not_set")

      // Обновляем Telegram credentials с пустым bot token
      actor.send({
        type: "UPDATE_TELEGRAM_CREDENTIALS",
        botToken: "",
        chatId: "some-chat-id"
      })

      expect(actor.getSnapshot().context.apiKeysStatus.telegram).toBe("not_set")

      actor.stop()
    })
  })

  describe("Additional service tokens handling", () => {
    it("should handle Codecov token updates", () => {
      const actor = createActor(userSettingsMachine)
      actor.start()

      // Проверяем начальные значения
      expect(actor.getSnapshot().context.codecovToken).toBe("")
      expect(actor.getSnapshot().context.apiKeysStatus.codecov).toBe("not_set")

      // Обновляем Codecov token
      actor.send({
        type: "UPDATE_CODECOV_TOKEN",
        token: "codecov-token-123"
      })

      const context = actor.getSnapshot().context
      expect(context.codecovToken).toBe("codecov-token-123")
      expect(context.apiKeysStatus.codecov).toBe("valid")

      // Очищаем token
      actor.send({
        type: "UPDATE_CODECOV_TOKEN",
        token: ""
      })

      const contextAfterClear = actor.getSnapshot().context
      expect(contextAfterClear.codecovToken).toBe("")
      expect(contextAfterClear.apiKeysStatus.codecov).toBe("not_set")

      actor.stop()
    })

    it("should handle Tauri Analytics key updates", () => {
      const actor = createActor(userSettingsMachine)
      actor.start()

      // Проверяем начальные значения
      expect(actor.getSnapshot().context.tauriAnalyticsKey).toBe("")
      expect(actor.getSnapshot().context.apiKeysStatus.tauri_analytics).toBe("not_set")

      // Обновляем Tauri Analytics key
      actor.send({
        type: "UPDATE_TAURI_ANALYTICS_KEY",
        key: "tauri-analytics-key-456"
      })

      const context = actor.getSnapshot().context
      expect(context.tauriAnalyticsKey).toBe("tauri-analytics-key-456")
      expect(context.apiKeysStatus.tauri_analytics).toBe("valid")

      // Очищаем key
      actor.send({
        type: "UPDATE_TAURI_ANALYTICS_KEY",
        key: ""
      })

      const contextAfterClear = actor.getSnapshot().context
      expect(contextAfterClear.tauriAnalyticsKey).toBe("")
      expect(contextAfterClear.apiKeysStatus.tauri_analytics).toBe("not_set")

      actor.stop()
    })
  })

  describe("API key status management", () => {
    it("should handle UPDATE_API_KEY_STATUS event", () => {
      const actor = createActor(userSettingsMachine)
      actor.start()

      const validStatuses = ["not_set", "testing", "invalid", "valid"] as const

      // Тестируем все возможные статусы для разных сервисов
      for (const status of validStatuses) {
        actor.send({
          type: "UPDATE_API_KEY_STATUS",
          service: "openai",
          status
        })

        expect(actor.getSnapshot().context.apiKeysStatus.openai).toBe(status)
      }

      // Тестируем для других сервисов
      actor.send({
        type: "UPDATE_API_KEY_STATUS",
        service: "claude",
        status: "invalid"
      })

      expect(actor.getSnapshot().context.apiKeysStatus.claude).toBe("invalid")

      actor.send({
        type: "UPDATE_API_KEY_STATUS",
        service: "youtube",
        status: "testing"
      })

      expect(actor.getSnapshot().context.apiKeysStatus.youtube).toBe("testing")

      actor.stop()
    })

    it("should handle TEST_API_KEY event", () => {
      const actor = createActor(userSettingsMachine)
      actor.start()

      // Изначально статус openai should be not_set
      expect(actor.getSnapshot().context.apiKeysStatus.openai).toBe("not_set")

      // Отправляем событие тестирования API ключа
      actor.send({
        type: "TEST_API_KEY",
        service: "openai"
      })

      // Статус должен стать "testing"
      expect(actor.getSnapshot().context.apiKeysStatus.openai).toBe("testing")

      // Тестируем для других сервисов
      actor.send({
        type: "TEST_API_KEY",
        service: "claude"
      })

      expect(actor.getSnapshot().context.apiKeysStatus.claude).toBe("testing")

      actor.send({
        type: "TEST_API_KEY",
        service: "youtube"
      })

      expect(actor.getSnapshot().context.apiKeysStatus.youtube).toBe("testing")

      actor.stop()
    })

    it("should maintain status for untested services", () => {
      const actor = createActor(userSettingsMachine)
      actor.start()

      // Устанавливаем некоторые статусы
      actor.send({
        type: "UPDATE_API_KEY_STATUS",
        service: "openai",
        status: "valid"
      })

      actor.send({
        type: "UPDATE_API_KEY_STATUS",
        service: "claude",
        status: "invalid"
      })

      // Тестируем только один сервис
      actor.send({
        type: "TEST_API_KEY",
        service: "youtube"
      })

      // Проверяем, что статусы других сервисов не изменились
      const context = actor.getSnapshot().context
      expect(context.apiKeysStatus.openai).toBe("valid")
      expect(context.apiKeysStatus.claude).toBe("invalid")
      expect(context.apiKeysStatus.youtube).toBe("testing")

      actor.stop()
    })
  })

  describe("Complex state interactions", () => {
    it("should handle multiple credential updates without affecting other settings", () => {
      const actor = createActor(userSettingsMachine)
      actor.start()

      // Устанавливаем начальные настройки
      actor.send({ type: "UPDATE_LAYOUT", layoutMode: "chat" })
      actor.send({ type: "UPDATE_PLAYER_VOLUME", volume: 75 })
      actor.send({ type: "TOGGLE_BROWSER_VISIBILITY" })

      // Обновляем множественные credentials
      actor.send({
        type: "UPDATE_YOUTUBE_CREDENTIALS",
        clientId: "youtube-id",
        clientSecret: "youtube-secret"
      })

      actor.send({
        type: "UPDATE_OPENAI_API_KEY",
        apiKey: "openai-key"
      })

      actor.send({
        type: "UPDATE_CODECOV_TOKEN",
        token: "codecov-token"
      })

      // Проверяем, что все настройки сохранились
      const context = actor.getSnapshot().context
      expect(context.layoutMode).toBe("chat")
      expect(context.playerVolume).toBe(75)
      expect(context.isBrowserVisible).toBe(false)
      expect(context.youtubeClientId).toBe("youtube-id")
      expect(context.youtubeClientSecret).toBe("youtube-secret")
      expect(context.openAiApiKey).toBe("openai-key")
      expect(context.codecovToken).toBe("codecov-token")

      actor.stop()
    })

    it("should handle UPDATE_ALL with social media credentials", () => {
      const actor = createActor(userSettingsMachine)
      actor.start()

      // Обновляем все настройки, включая социальные сети
      actor.send({
        type: "UPDATE_ALL",
        settings: {
          youtubeClientId: "bulk-youtube-id",
          youtubeClientSecret: "bulk-youtube-secret",
          tiktokClientId: "bulk-tiktok-id",
          tiktokClientSecret: "bulk-tiktok-secret",
          vimeoClientId: "bulk-vimeo-id",
          vimeoClientSecret: "bulk-vimeo-secret",
          vimeoAccessToken: "bulk-vimeo-token",
          telegramBotToken: "bulk-telegram-bot",
          telegramChatId: "bulk-telegram-chat",
          codecovToken: "bulk-codecov-token",
          tauriAnalyticsKey: "bulk-tauri-key",
          apiKeysStatus: {
            openai: "valid",
            claude: "invalid",
            youtube: "testing",
            tiktok: "not_set",
            vimeo: "valid",
            telegram: "invalid",
            codecov: "valid",
            tauri_analytics: "testing"
          }
        }
      })

      // Проверяем, что все настройки обновились
      const context = actor.getSnapshot().context
      expect(context.youtubeClientId).toBe("bulk-youtube-id")
      expect(context.youtubeClientSecret).toBe("bulk-youtube-secret")
      expect(context.tiktokClientId).toBe("bulk-tiktok-id")
      expect(context.tiktokClientSecret).toBe("bulk-tiktok-secret")
      expect(context.vimeoClientId).toBe("bulk-vimeo-id")
      expect(context.vimeoClientSecret).toBe("bulk-vimeo-secret")
      expect(context.vimeoAccessToken).toBe("bulk-vimeo-token")
      expect(context.telegramBotToken).toBe("bulk-telegram-bot")
      expect(context.telegramChatId).toBe("bulk-telegram-chat")
      expect(context.codecovToken).toBe("bulk-codecov-token")
      expect(context.tauriAnalyticsKey).toBe("bulk-tauri-key")
      expect(context.apiKeysStatus.openai).toBe("valid")
      expect(context.apiKeysStatus.claude).toBe("invalid")
      expect(context.apiKeysStatus.youtube).toBe("testing")
      expect(context.apiKeysStatus.tiktok).toBe("not_set")
      expect(context.apiKeysStatus.vimeo).toBe("valid")
      expect(context.apiKeysStatus.telegram).toBe("invalid")
      expect(context.apiKeysStatus.codecov).toBe("valid")
      expect(context.apiKeysStatus.tauri_analytics).toBe("testing")

      actor.stop()
    })
  })

  describe("Event handler definitions", () => {
    it("should have all social media credential event handlers", () => {
      const idleState = userSettingsMachine.config.states?.idle
      
      expect(idleState?.on?.UPDATE_YOUTUBE_CREDENTIALS).toBeDefined()
      expect(idleState?.on?.UPDATE_TIKTOK_CREDENTIALS).toBeDefined()
      expect(idleState?.on?.UPDATE_VIMEO_CREDENTIALS).toBeDefined()
      expect(idleState?.on?.UPDATE_TELEGRAM_CREDENTIALS).toBeDefined()
      expect(idleState?.on?.UPDATE_CODECOV_TOKEN).toBeDefined()
      expect(idleState?.on?.UPDATE_TAURI_ANALYTICS_KEY).toBeDefined()
      expect(idleState?.on?.UPDATE_API_KEY_STATUS).toBeDefined()
      expect(idleState?.on?.TEST_API_KEY).toBeDefined()
    })

    it("should have correct action assignments for new events", () => {
      const idleState = userSettingsMachine.config.states?.idle
      
      expect(idleState?.on?.UPDATE_YOUTUBE_CREDENTIALS?.actions).toContain("updateYoutubeCredentials")
      expect(idleState?.on?.UPDATE_TIKTOK_CREDENTIALS?.actions).toContain("updateTiktokCredentials")
      expect(idleState?.on?.UPDATE_VIMEO_CREDENTIALS?.actions).toContain("updateVimeoCredentials")
      expect(idleState?.on?.UPDATE_TELEGRAM_CREDENTIALS?.actions).toContain("updateTelegramCredentials")
      expect(idleState?.on?.UPDATE_CODECOV_TOKEN?.actions).toContain("updateCodecovToken")
      expect(idleState?.on?.UPDATE_TAURI_ANALYTICS_KEY?.actions).toContain("updateTauriAnalyticsKey")
      expect(idleState?.on?.UPDATE_API_KEY_STATUS?.actions).toContain("updateApiKeyStatus")
      expect(idleState?.on?.TEST_API_KEY?.actions).toContain("testApiKey")
    })
  })

  describe("Edge cases and security", () => {
    it("should handle empty and undefined values gracefully", () => {
      const actor = createActor(userSettingsMachine)
      actor.start()

      // Тестируем пустые строки
      actor.send({
        type: "UPDATE_YOUTUBE_CREDENTIALS",
        clientId: "",
        clientSecret: ""
      })

      const context1 = actor.getSnapshot().context
      expect(context1.youtubeClientId).toBe("")
      expect(context1.youtubeClientSecret).toBe("")
      expect(context1.apiKeysStatus.youtube).toBe("not_set")

      // Тестируем пустые токены
      actor.send({
        type: "UPDATE_CODECOV_TOKEN",
        token: ""
      })

      const context2 = actor.getSnapshot().context
      expect(context2.codecovToken).toBe("")
      expect(context2.apiKeysStatus.codecov).toBe("not_set")

      actor.stop()
    })

    it("should not log sensitive information in console", () => {
      const consoleSpy = vi.spyOn(console, "log")
      
      const actor = createActor(userSettingsMachine)
      actor.start()

      // Обновляем API ключи
      actor.send({
        type: "UPDATE_OPENAI_API_KEY",
        apiKey: "secret-openai-key"
      })

      actor.send({
        type: "UPDATE_CLAUDE_API_KEY",
        apiKey: "secret-claude-key"
      })

      actor.send({
        type: "UPDATE_CODECOV_TOKEN",
        token: "secret-codecov-token"
      })

      // Проверяем, что в логах нет полных ключей
      const logCalls = consoleSpy.mock.calls.map(call => call.join(" "))
      
      for (const logCall of logCalls) {
        expect(logCall).not.toContain("secret-openai-key")
        expect(logCall).not.toContain("secret-claude-key")
        expect(logCall).not.toContain("secret-codecov-token")
      }

      // Но должны содержать замаскированные версии или индикаторы
      const hasOpenAiLog = logCalls.some(log => 
        log.includes("Updating OpenAI API key") && (log.includes("***") || log.includes("(empty)"))
      )
      expect(hasOpenAiLog).toBe(true)

      actor.stop()
    })
  })
})
