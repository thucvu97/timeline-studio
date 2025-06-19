import React from "react"

import { act, renderHook } from "@testing-library/react"
import { MockedFunction, beforeEach, describe, expect, it, vi } from "vitest"

import { useAppSettings } from "@/features/app-state"
import { BrowserTab } from "@/features/user-settings"

import { ViewMode } from "../../components"
import { BrowserStateProvider, useBrowserState, useTabSettings } from "../../services/browser-state-provider"

// Мокаем useAppSettings
vi.mock("@/features/app-state", () => ({
  useAppSettings: vi.fn(),
}))

const mockGetUserSettings = vi.fn()
const mockUpdateUserSettings = vi.fn()

describe("BrowserStateProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAppSettings as MockedFunction<typeof useAppSettings>).mockReturnValue({
      getUserSettings: mockGetUserSettings,
      updateUserSettings: mockUpdateUserSettings,
    } as any)

    mockGetUserSettings.mockReturnValue({})
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserStateProvider>{children}</BrowserStateProvider>
  )

  describe("useBrowserState", () => {
    it("должен выбрасывать ошибку вне провайдера", () => {
      const { result } = renderHook(() => {
        try {
          return useBrowserState()
        } catch (error) {
          return error
        }
      })

      expect(result.current).toBeInstanceOf(Error)
      expect((result.current as Error).message).toBe("useBrowserState must be used within a BrowserStateProvider")
    })

    it("должен возвращать начальное состояние", () => {
      const { result } = renderHook(() => useBrowserState(), { wrapper })

      expect(result.current.activeTab).toBe("media")
      expect(result.current.state.activeTab).toBe("media")
      expect(result.current.currentTabSettings).toEqual({
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

    it("должен загружать сохраненные настройки", () => {
      const savedSettings = {
        activeTab: "music" as BrowserTab,
        tabSettings: {
          media: {
            searchQuery: "video",
            showFavoritesOnly: true,
            sortBy: "date",
            sortOrder: "desc" as const,
            groupBy: "type",
            filterType: "video",
            viewMode: "list" as ViewMode,
            previewSizeIndex: 3,
          },
          music: {
            searchQuery: "",
            showFavoritesOnly: false,
            sortBy: "name",
            sortOrder: "asc" as const,
            groupBy: "none",
            filterType: "all",
            viewMode: "list" as ViewMode,
            previewSizeIndex: 3,
          },
          effects: {} as any,
          filters: {} as any,
          transitions: {} as any,
          subtitles: {} as any,
          templates: {} as any,
          "style-templates": {} as any,
        },
      }

      mockGetUserSettings.mockReturnValue({
        browserSettings: savedSettings,
      })

      const { result } = renderHook(() => useBrowserState(), { wrapper })

      expect(result.current.activeTab).toBe("music")
      expect(result.current.state.tabSettings.media.searchQuery).toBe("video")
      expect(result.current.state.tabSettings.media.showFavoritesOnly).toBe(true)
    })
  })

  describe("actions", () => {
    describe("switchTab", () => {
      it("должен переключать активную вкладку", () => {
        const { result } = renderHook(() => useBrowserState(), { wrapper })

        act(() => {
          result.current.switchTab("effects")
        })

        expect(result.current.activeTab).toBe("effects")
        expect(result.current.state.activeTab).toBe("effects")
      })
    })

    describe("setSearchQuery", () => {
      it("должен устанавливать поисковый запрос для активной вкладки", () => {
        const { result } = renderHook(() => useBrowserState(), { wrapper })

        act(() => {
          result.current.setSearchQuery("test query")
        })

        expect(result.current.currentTabSettings.searchQuery).toBe("test query")
      })

      it("должен устанавливать поисковый запрос для указанной вкладки", () => {
        const { result } = renderHook(() => useBrowserState(), { wrapper })

        act(() => {
          result.current.setSearchQuery("music search", "music")
        })

        expect(result.current.state.tabSettings.music.searchQuery).toBe("music search")
        expect(result.current.state.tabSettings.media.searchQuery).toBe("")
      })
    })

    describe("toggleFavorites", () => {
      it("должен переключать показ избранного для активной вкладки", () => {
        const { result } = renderHook(() => useBrowserState(), { wrapper })

        expect(result.current.currentTabSettings.showFavoritesOnly).toBe(false)

        act(() => {
          result.current.toggleFavorites()
        })

        expect(result.current.currentTabSettings.showFavoritesOnly).toBe(true)

        act(() => {
          result.current.toggleFavorites()
        })

        expect(result.current.currentTabSettings.showFavoritesOnly).toBe(false)
      })

      it("должен переключать показ избранного для указанной вкладки", () => {
        const { result } = renderHook(() => useBrowserState(), { wrapper })

        act(() => {
          result.current.toggleFavorites("effects")
        })

        expect(result.current.state.tabSettings.effects.showFavoritesOnly).toBe(true)
        expect(result.current.state.tabSettings.media.showFavoritesOnly).toBe(false)
      })
    })

    describe("setSort", () => {
      it("должен устанавливать сортировку для активной вкладки", () => {
        const { result } = renderHook(() => useBrowserState(), { wrapper })

        act(() => {
          result.current.setSort("date", "desc")
        })

        expect(result.current.currentTabSettings.sortBy).toBe("date")
        expect(result.current.currentTabSettings.sortOrder).toBe("desc")
      })

      it("должен устанавливать сортировку для указанной вкладки", () => {
        const { result } = renderHook(() => useBrowserState(), { wrapper })

        act(() => {
          result.current.setSort("size", "asc", "music")
        })

        expect(result.current.state.tabSettings.music.sortBy).toBe("size")
        expect(result.current.state.tabSettings.music.sortOrder).toBe("asc")
        expect(result.current.state.tabSettings.media.sortBy).toBe("name")
      })
    })

    describe("setGroupBy", () => {
      it("должен устанавливать группировку для активной вкладки", () => {
        const { result } = renderHook(() => useBrowserState(), { wrapper })

        act(() => {
          result.current.setGroupBy("date")
        })

        expect(result.current.currentTabSettings.groupBy).toBe("date")
      })

      it("должен устанавливать группировку для указанной вкладки", () => {
        const { result } = renderHook(() => useBrowserState(), { wrapper })

        act(() => {
          result.current.setGroupBy("type", "templates")
        })

        expect(result.current.state.tabSettings.templates.groupBy).toBe("type")
      })
    })

    describe("setFilter", () => {
      it("должен устанавливать фильтр для активной вкладки", () => {
        const { result } = renderHook(() => useBrowserState(), { wrapper })

        act(() => {
          result.current.setFilter("video")
        })

        expect(result.current.currentTabSettings.filterType).toBe("video")
      })

      it("должен устанавливать фильтр для указанной вкладки", () => {
        const { result } = renderHook(() => useBrowserState(), { wrapper })

        act(() => {
          result.current.setFilter("favorite", "effects")
        })

        expect(result.current.state.tabSettings.effects.filterType).toBe("favorite")
      })
    })

    describe("setViewMode", () => {
      it("должен устанавливать режим отображения для активной вкладки", () => {
        const { result } = renderHook(() => useBrowserState(), { wrapper })

        act(() => {
          result.current.setViewMode("list")
        })

        expect(result.current.currentTabSettings.viewMode).toBe("list")
      })

      it("должен устанавливать режим отображения для указанной вкладки", () => {
        const { result } = renderHook(() => useBrowserState(), { wrapper })

        act(() => {
          result.current.setViewMode("grid", "music")
        })

        expect(result.current.state.tabSettings.music.viewMode).toBe("grid")
      })
    })

    describe("setPreviewSize", () => {
      it("должен устанавливать размер превью для активной вкладки", () => {
        const { result } = renderHook(() => useBrowserState(), { wrapper })

        act(() => {
          result.current.setPreviewSize(4)
        })

        expect(result.current.currentTabSettings.previewSizeIndex).toBe(4)
      })

      it("должен устанавливать размер превью для указанной вкладки", () => {
        const { result } = renderHook(() => useBrowserState(), { wrapper })

        act(() => {
          result.current.setPreviewSize(1, "filters")
        })

        expect(result.current.state.tabSettings.filters.previewSizeIndex).toBe(1)
      })
    })

    describe("resetTabSettings", () => {
      it("должен сбрасывать настройки вкладки к начальным значениям", () => {
        const { result } = renderHook(() => useBrowserState(), { wrapper })

        // Изменяем настройки
        act(() => {
          result.current.setSearchQuery("test")
          result.current.toggleFavorites()
          result.current.setSort("date", "desc")
        })

        // Проверяем, что настройки изменились
        expect(result.current.currentTabSettings.searchQuery).toBe("test")
        expect(result.current.currentTabSettings.showFavoritesOnly).toBe(true)
        expect(result.current.currentTabSettings.sortBy).toBe("date")

        // Сбрасываем настройки
        act(() => {
          result.current.resetTabSettings("media")
        })

        // Проверяем, что настройки вернулись к начальным
        expect(result.current.currentTabSettings).toEqual({
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
    })
  })

  describe("previewSize", () => {
    it("должен вычислять размер превью на основе индекса", () => {
      const { result } = renderHook(() => useBrowserState(), { wrapper })

      // Размер по умолчанию (индекс 3)
      expect(result.current.previewSize).toBe(250)

      // Изменяем размер
      act(() => {
        result.current.setPreviewSize(0)
      })

      expect(result.current.previewSize).toBe(125)

      act(() => {
        result.current.setPreviewSize(4)
      })

      expect(result.current.previewSize).toBe(300)
    })
  })

  describe("useTabSettings", () => {
    it("должен возвращать настройки активной вкладки", () => {
      const { result } = renderHook(
        () => ({
          browserState: useBrowserState(),
          tabSettings: useTabSettings(),
        }),
        { wrapper },
      )

      expect(result.current.tabSettings).toEqual(result.current.browserState.currentTabSettings)
    })

    it("должен возвращать настройки указанной вкладки", () => {
      const { result } = renderHook(() => useTabSettings("music"), { wrapper })

      expect(result.current).toEqual({
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "all",
        viewMode: "list", // music по умолчанию имеет viewMode: "list"
        previewSizeIndex: 3,
      })
    })

    it("должен реагировать на изменения настроек", () => {
      const { result, rerender } = renderHook(
        () => ({
          browserState: useBrowserState(),
          tabSettings: useTabSettings("effects"),
        }),
        { wrapper },
      )

      act(() => {
        result.current.browserState.setSearchQuery("blur", "effects")
      })

      rerender()

      expect(result.current.tabSettings.searchQuery).toBe("blur")
    })
  })

  describe("complex scenarios", () => {
    it("должен корректно обрабатывать последовательность действий", () => {
      const { result } = renderHook(() => useBrowserState(), { wrapper })

      // Переключаемся на music
      act(() => {
        result.current.switchTab("music")
      })

      // Устанавливаем поиск
      act(() => {
        result.current.setSearchQuery("jazz")
      })

      // Включаем избранное
      act(() => {
        result.current.toggleFavorites()
      })

      // Меняем сортировку
      act(() => {
        result.current.setSort("duration", "desc")
      })

      expect(result.current.activeTab).toBe("music")
      expect(result.current.currentTabSettings).toMatchObject({
        searchQuery: "jazz",
        showFavoritesOnly: true,
        sortBy: "duration",
        sortOrder: "desc",
      })
    })

    it("должен независимо управлять настройками разных вкладок", () => {
      const { result } = renderHook(() => useBrowserState(), { wrapper })

      // Настраиваем media
      act(() => {
        result.current.setSearchQuery("video", "media")
        result.current.setViewMode("list", "media")
      })

      // Настраиваем effects
      act(() => {
        result.current.setSearchQuery("blur", "effects")
        result.current.setFilter("favorite", "effects")
      })

      // Настраиваем templates
      act(() => {
        result.current.setGroupBy("category", "templates")
        result.current.setPreviewSize(5, "templates")
      })

      // Проверяем, что все настройки применились независимо
      expect(result.current.state.tabSettings.media.searchQuery).toBe("video")
      expect(result.current.state.tabSettings.media.viewMode).toBe("list")

      expect(result.current.state.tabSettings.effects.searchQuery).toBe("blur")
      expect(result.current.state.tabSettings.effects.filterType).toBe("favorite")

      expect(result.current.state.tabSettings.templates.groupBy).toBe("category")
      expect(result.current.state.tabSettings.templates.previewSizeIndex).toBe(5)
    })
  })
})
