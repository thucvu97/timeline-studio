import { beforeEach, describe, expect, it } from "vitest"
import { createActor } from "xstate"

import { ViewMode } from "../../components/media-toolbar"
import { BrowserContext, BrowserEvent, browserMachine } from "../../services/browser-state-machine"

describe("browserMachine", () => {
  let actor: ReturnType<typeof createActor<typeof browserMachine>>

  beforeEach(() => {
    actor = createActor(browserMachine)
    actor.start()
  })

  afterEach(() => {
    actor.stop()
  })

  describe("initial state", () => {
    it("должен начинаться с состояния idle", () => {
      expect(actor.getSnapshot().value).toBe("idle")
    })

    it("должен иметь начальный контекст", () => {
      const context = actor.getSnapshot().context
      expect(context.activeTab).toBe("media")
      expect(context.tabSettings.media).toEqual({
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "all",
        viewMode: "thumbnails",
        previewSizeIndex: 3, // DEFAULT_PREVIEW_SIZE_INDEX
      })
    })

    it("должен иметь специфичные настройки для вкладки music", () => {
      const context = actor.getSnapshot().context
      expect(context.tabSettings.music).toEqual({
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "title",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "all",
        viewMode: "list",
        previewSizeIndex: 3,
      })
    })

    it("должен иметь специфичные настройки для вкладки templates", () => {
      const context = actor.getSnapshot().context
      expect(context.tabSettings.templates).toEqual({
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "screens",
        sortOrder: "asc",
        groupBy: "screens",
        filterType: "all",
        viewMode: "thumbnails",
        previewSizeIndex: 1, // Больший размер для шаблонов (getPreviewSizeIndex(150) = 1)
      })
    })

    it("должен иметь специфичные настройки для вкладки style-templates", () => {
      const context = actor.getSnapshot().context
      expect(context.tabSettings["style-templates"]).toEqual({
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "category",
        sortOrder: "asc",
        groupBy: "category",
        filterType: "all",
        viewMode: "thumbnails",
        previewSizeIndex: 0, // Средний размер для стилевых шаблонов (getPreviewSizeIndex(125) = 0)
      })
    })

    it("должен иметь специфичные настройки для вкладок эффектов", () => {
      const context = actor.getSnapshot().context
      const effectTabs = ["effects", "filters", "transitions"] as const

      effectTabs.forEach((tab) => {
        expect(context.tabSettings[tab]).toEqual({
          searchQuery: "",
          showFavoritesOnly: false,
          sortBy: "category",
          sortOrder: "asc",
          groupBy: "category",
          filterType: "all",
          viewMode: "thumbnails",
          previewSizeIndex: 3,
        })
      })
    })
  })

  describe("SWITCH_TAB", () => {
    it("должен переключать активную вкладку", () => {
      actor.send({ type: "SWITCH_TAB", tab: "music" })
      expect(actor.getSnapshot().context.activeTab).toBe("music")

      actor.send({ type: "SWITCH_TAB", tab: "effects" })
      expect(actor.getSnapshot().context.activeTab).toBe("effects")
    })
  })

  describe("SET_SEARCH_QUERY", () => {
    it("должен устанавливать поисковый запрос для активной вкладки", () => {
      actor.send({ type: "SET_SEARCH_QUERY", query: "test query" })
      expect(actor.getSnapshot().context.tabSettings.media.searchQuery).toBe("test query")
    })

    it("должен устанавливать поисковый запрос для указанной вкладки", () => {
      actor.send({ type: "SET_SEARCH_QUERY", query: "music search", tab: "music" })
      expect(actor.getSnapshot().context.tabSettings.music.searchQuery).toBe("music search")
      expect(actor.getSnapshot().context.tabSettings.media.searchQuery).toBe("")
    })
  })

  describe("TOGGLE_FAVORITES", () => {
    it("должен переключать показ избранного для активной вкладки", () => {
      expect(actor.getSnapshot().context.tabSettings.media.showFavoritesOnly).toBe(false)

      actor.send({ type: "TOGGLE_FAVORITES" })
      expect(actor.getSnapshot().context.tabSettings.media.showFavoritesOnly).toBe(true)

      actor.send({ type: "TOGGLE_FAVORITES" })
      expect(actor.getSnapshot().context.tabSettings.media.showFavoritesOnly).toBe(false)
    })

    it("должен переключать показ избранного для указанной вкладки", () => {
      actor.send({ type: "TOGGLE_FAVORITES", tab: "effects" })
      expect(actor.getSnapshot().context.tabSettings.effects.showFavoritesOnly).toBe(true)
      expect(actor.getSnapshot().context.tabSettings.media.showFavoritesOnly).toBe(false)
    })
  })

  describe("SET_SORT", () => {
    it("должен устанавливать сортировку для активной вкладки", () => {
      actor.send({ type: "SET_SORT", sortBy: "date", sortOrder: "desc" })

      const settings = actor.getSnapshot().context.tabSettings.media
      expect(settings.sortBy).toBe("date")
      expect(settings.sortOrder).toBe("desc")
    })

    it("должен устанавливать сортировку для указанной вкладки", () => {
      actor.send({ type: "SET_SORT", sortBy: "size", sortOrder: "asc", tab: "music" })

      const settings = actor.getSnapshot().context.tabSettings.music
      expect(settings.sortBy).toBe("size")
      expect(settings.sortOrder).toBe("asc")

      // Проверяем, что другие вкладки не затронуты
      expect(actor.getSnapshot().context.tabSettings.media.sortBy).toBe("name")
    })
  })

  describe("SET_GROUP_BY", () => {
    it("должен устанавливать группировку для активной вкладки", () => {
      actor.send({ type: "SET_GROUP_BY", groupBy: "date" })
      expect(actor.getSnapshot().context.tabSettings.media.groupBy).toBe("date")
    })

    it("должен устанавливать группировку для указанной вкладки", () => {
      actor.send({ type: "SET_GROUP_BY", groupBy: "type", tab: "templates" })
      expect(actor.getSnapshot().context.tabSettings.templates.groupBy).toBe("type")
    })
  })

  describe("SET_FILTER", () => {
    it("должен устанавливать фильтр для активной вкладки", () => {
      actor.send({ type: "SET_FILTER", filterType: "video" })
      expect(actor.getSnapshot().context.tabSettings.media.filterType).toBe("video")
    })

    it("должен устанавливать фильтр для указанной вкладки", () => {
      actor.send({ type: "SET_FILTER", filterType: "favorite", tab: "effects" })
      expect(actor.getSnapshot().context.tabSettings.effects.filterType).toBe("favorite")
    })
  })

  describe("SET_VIEW_MODE", () => {
    it("должен устанавливать режим отображения для активной вкладки", () => {
      actor.send({ type: "SET_VIEW_MODE", viewMode: "list" as ViewMode })
      expect(actor.getSnapshot().context.tabSettings.media.viewMode).toBe("list")
    })

    it("должен устанавливать режим отображения для указанной вкладки", () => {
      actor.send({ type: "SET_VIEW_MODE", viewMode: "grid" as ViewMode, tab: "music" })
      expect(actor.getSnapshot().context.tabSettings.music.viewMode).toBe("grid")
    })
  })

  describe("SET_PREVIEW_SIZE", () => {
    it("должен устанавливать размер превью для активной вкладки", () => {
      actor.send({ type: "SET_PREVIEW_SIZE", sizeIndex: 4 })
      expect(actor.getSnapshot().context.tabSettings.media.previewSizeIndex).toBe(4)
    })

    it("должен устанавливать размер превью для указанной вкладки", () => {
      actor.send({ type: "SET_PREVIEW_SIZE", sizeIndex: 1, tab: "filters" })
      expect(actor.getSnapshot().context.tabSettings.filters.previewSizeIndex).toBe(1)
    })
  })

  describe("RESET_TAB_SETTINGS", () => {
    it("должен сбрасывать настройки вкладки к начальным значениям", () => {
      // Изменяем настройки
      actor.send({ type: "SET_SEARCH_QUERY", query: "test" })
      actor.send({ type: "TOGGLE_FAVORITES" })
      actor.send({ type: "SET_SORT", sortBy: "date", sortOrder: "desc" })

      // Проверяем, что настройки изменились
      const changedSettings = actor.getSnapshot().context.tabSettings.media
      expect(changedSettings.searchQuery).toBe("test")
      expect(changedSettings.showFavoritesOnly).toBe(true)
      expect(changedSettings.sortBy).toBe("date")

      // Сбрасываем настройки
      actor.send({ type: "RESET_TAB_SETTINGS", tab: "media" })

      // Проверяем, что настройки вернулись к начальным
      const resetSettings = actor.getSnapshot().context.tabSettings.media
      expect(resetSettings).toEqual({
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "all",
        viewMode: "thumbnails",
        previewSizeIndex: 3,
      })
    })

    it("должен сбрасывать настройки конкретной вкладки без влияния на другие", () => {
      // Изменяем настройки для music
      actor.send({ type: "SET_SEARCH_QUERY", query: "rock", tab: "music" })
      actor.send({ type: "SET_SEARCH_QUERY", query: "video", tab: "media" })

      // Сбрасываем только music
      actor.send({ type: "RESET_TAB_SETTINGS", tab: "music" })

      // Проверяем, что music сброшен, а media нет
      expect(actor.getSnapshot().context.tabSettings.music.searchQuery).toBe("")
      expect(actor.getSnapshot().context.tabSettings.media.searchQuery).toBe("video")
    })
  })

  describe("LOAD_SETTINGS", () => {
    it("должен загружать частичные настройки", () => {
      const newSettings: Partial<BrowserContext> = {
        activeTab: "effects",
        tabSettings: {
          ...actor.getSnapshot().context.tabSettings,
          effects: {
            ...actor.getSnapshot().context.tabSettings.effects,
            searchQuery: "blur",
            showFavoritesOnly: true,
          },
        },
      }

      actor.send({ type: "LOAD_SETTINGS", settings: newSettings })

      const context = actor.getSnapshot().context
      expect(context.activeTab).toBe("effects")
      expect(context.tabSettings.effects.searchQuery).toBe("blur")
      expect(context.tabSettings.effects.showFavoritesOnly).toBe(true)
    })

    it("должен сохранять существующие настройки при частичной загрузке", () => {
      const partialSettings: Partial<BrowserContext> = {
        activeTab: "music",
      }

      actor.send({ type: "LOAD_SETTINGS", settings: partialSettings })

      const context = actor.getSnapshot().context
      expect(context.activeTab).toBe("music")
      // Проверяем, что настройки вкладок не изменились
      expect(context.tabSettings.media.sortBy).toBe("name")
    })
  })

  describe("SAVE_SETTINGS", () => {
    it("должен обрабатывать событие сохранения настроек", () => {
      // Событие не должно вызывать ошибок
      expect(() => {
        actor.send({ type: "SAVE_SETTINGS" })
      }).not.toThrow()

      // Состояние должно остаться прежним
      expect(actor.getSnapshot().value).toBe("idle")
    })
  })

  describe("complex scenarios", () => {
    it("должен корректно обрабатывать последовательность действий", () => {
      // Переключаемся на music
      actor.send({ type: "SWITCH_TAB", tab: "music" })

      // Устанавливаем поиск
      actor.send({ type: "SET_SEARCH_QUERY", query: "jazz" })

      // Включаем избранное
      actor.send({ type: "TOGGLE_FAVORITES" })

      // Меняем сортировку
      actor.send({ type: "SET_SORT", sortBy: "duration", sortOrder: "desc" })

      const context = actor.getSnapshot().context
      expect(context.activeTab).toBe("music")
      expect(context.tabSettings.music).toMatchObject({
        searchQuery: "jazz",
        showFavoritesOnly: true,
        sortBy: "duration",
        sortOrder: "desc",
      })
    })

    it("должен независимо управлять настройками разных вкладок", () => {
      // Настраиваем media
      actor.send({ type: "SET_SEARCH_QUERY", query: "video", tab: "media" })
      actor.send({ type: "SET_VIEW_MODE", viewMode: "list" as ViewMode, tab: "media" })

      // Настраиваем effects
      actor.send({ type: "SET_SEARCH_QUERY", query: "blur", tab: "effects" })
      actor.send({ type: "SET_FILTER", filterType: "favorite", tab: "effects" })

      // Настраиваем templates
      actor.send({ type: "SET_GROUP_BY", groupBy: "category", tab: "templates" })
      actor.send({ type: "SET_PREVIEW_SIZE", sizeIndex: 5, tab: "templates" })

      const context = actor.getSnapshot().context

      // Проверяем, что все настройки применились независимо
      expect(context.tabSettings.media.searchQuery).toBe("video")
      expect(context.tabSettings.media.viewMode).toBe("list")

      expect(context.tabSettings.effects.searchQuery).toBe("blur")
      expect(context.tabSettings.effects.filterType).toBe("favorite")

      expect(context.tabSettings.templates.groupBy).toBe("category")
      expect(context.tabSettings.templates.previewSizeIndex).toBe(5)
    })
  })
})
