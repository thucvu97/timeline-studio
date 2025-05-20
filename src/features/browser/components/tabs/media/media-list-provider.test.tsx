import { act, render, renderHook, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  MediaListProvider,
  useMediaList,
} from "./media-list-provider"

// Мокаем useMachine из @xstate/react
vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [
    {
      context: {
        mediaFiles: [],
        filteredFiles: [],
        searchQuery: "",
        sortBy: "date",
        sortOrder: "desc",
        filterType: "all",
        viewMode: "list",
        groupBy: "none",
        availableExtensions: [],
        showFavoritesOnly: false,
        previewSize: 120,
        canIncreaseSize: true,
        canDecreaseSize: true,
        isLoading: false,
        error: null,
      },
      matches: (state: string) => state === "success",
      status: "active",
      value: "success",
    },
    vi.fn(), // mock для send
  ]),
}))

// Мокаем mediaListMachine
vi.mock("./media-list-machine", () => ({
  mediaListMachine: {
    createMachine: vi.fn(),
  },
  DEFAULT_PREVIEW_SIZE: 120,
  MIN_PREVIEW_SIZE: 80,
  MAX_PREVIEW_SIZE: 200,
}))

// Мокаем useMedia
vi.mock("@/features/browser/media", () => ({
  useMedia: vi.fn(() => ({
    allMediaFiles: [],
    includedFiles: [],
    favorites: {
      media: [],
      audio: [],
      transition: [],
      effect: [],
      template: [],
      filter: [],
    },
  })),
}))

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

// Компонент-обертка для тестирования хука useMediaList
const MediaListWrapper = ({ children }: { children: React.ReactNode }) => (
  <MediaListProvider>{children}</MediaListProvider>
)

describe("MediaListProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render children", () => {
    render(
      <MediaListProvider>
        <div data-testid="test-child">Test Child</div>
      </MediaListProvider>,
    )

    expect(screen.getByTestId("test-child")).toBeInTheDocument()
  })

  it("should provide MediaListContext", () => {
    const { result } = renderHook(() => useMediaList(), {
      wrapper: MediaListWrapper,
    })

    // Проверяем, что контекст содержит ожидаемые свойства
    expect(result.current).toBeDefined()
    expect(result.current.mediaFiles).toEqual([])
    expect(result.current.filteredFiles).toEqual([])
    expect(result.current.searchQuery).toBe("")
    expect(result.current.sortBy).toBe("date")
    expect(result.current.sortOrder).toBe("desc")
    expect(result.current.filterType).toBe("all")
    expect(result.current.viewMode).toBe("list")
    expect(result.current.groupBy).toBe("none")
    expect(result.current.availableExtensions).toEqual([])
    expect(result.current.showFavoritesOnly).toBe(false)
    expect(result.current.previewSize).toBe(120)
    expect(result.current.canIncreaseSize).toBe(true)
    expect(result.current.canDecreaseSize).toBe(true)
  })

  it("should provide methods for interacting with media list state", () => {
    const { result } = renderHook(() => useMediaList(), {
      wrapper: MediaListWrapper,
    })

    // Проверяем наличие всех методов
    expect(result.current.search).toBeDefined()
    expect(typeof result.current.search).toBe("function")

    expect(result.current.sort).toBeDefined()
    expect(typeof result.current.sort).toBe("function")

    expect(result.current.filter).toBeDefined()
    expect(typeof result.current.filter).toBe("function")

    expect(result.current.changeOrder).toBeDefined()
    expect(typeof result.current.changeOrder).toBe("function")

    expect(result.current.changeViewMode).toBeDefined()
    expect(typeof result.current.changeViewMode).toBe("function")

    expect(result.current.changeGroupBy).toBeDefined()
    expect(typeof result.current.changeGroupBy).toBe("function")

    expect(result.current.toggleFavorites).toBeDefined()
    expect(typeof result.current.toggleFavorites).toBe("function")

    expect(result.current.retry).toBeDefined()
    expect(typeof result.current.retry).toBe("function")

    expect(result.current.increasePreviewSize).toBeDefined()
    expect(typeof result.current.increasePreviewSize).toBe("function")

    expect(result.current.decreasePreviewSize).toBeDefined()
    expect(typeof result.current.decreasePreviewSize).toBe("function")

    expect(result.current.setPreviewSize).toBeDefined()
    expect(typeof result.current.setPreviewSize).toBe("function")

    expect(result.current.setSearchQuery).toBeDefined()
    expect(typeof result.current.setSearchQuery).toBe("function")

    expect(result.current.setShowFavoritesOnly).toBeDefined()
    expect(typeof result.current.setShowFavoritesOnly).toBe("function")
  })

  it("should throw error when useMediaList is used outside of MediaListProvider", () => {
    // Проверяем, что хук выбрасывает ошибку, если используется вне провайдера
    const consoleError = console.error
    console.error = vi.fn() // Подавляем ошибки в консоли во время теста

    expect(() => renderHook(() => useMediaList())).toThrow(
      "useMediaList must be used within a MediaListProvider",
    )

    console.error = consoleError // Восстанавливаем console.error
  })
})
