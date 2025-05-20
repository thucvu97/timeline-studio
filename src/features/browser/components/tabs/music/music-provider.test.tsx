import { act, render, renderHook, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MusicContext, MusicProvider, useMusic } from "./music-provider"

// Мокаем useMachine из @xstate/react
vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [
    {
      context: {
        musicFiles: [],
        filteredFiles: [],
        searchQuery: "",
        sortBy: "name",
        sortOrder: "asc",
        filterType: "all",
        viewMode: "list",
        groupBy: "none",
        availableExtensions: [],
        showFavoritesOnly: false,
      },
      matches: (state: string) => state === "success",
      status: "active",
    },
    vi.fn(), // mock для send
  ]),
}))

// Мокаем musicMachine
vi.mock("./music-machine", () => ({
  musicMachine: {
    createMachine: vi.fn(),
  },
}))

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

// Компонент-обертка для тестирования хука useMusic
const MusicWrapper = ({ children }: { children: React.ReactNode }) => (
  <MusicProvider>{children}</MusicProvider>
)

describe("MusicProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render children", () => {
    render(
      <MusicProvider>
        <div data-testid="test-child">Test Child</div>
      </MusicProvider>,
    )

    expect(screen.getByTestId("test-child")).toBeInTheDocument()
  })

  it("should provide MusicContext", () => {
    const { result } = renderHook(() => useMusic(), {
      wrapper: MusicWrapper,
    })

    // Проверяем, что контекст содержит ожидаемые свойства
    expect(result.current).toBeDefined()
    expect(result.current.musicFiles).toEqual([])
    expect(result.current.filteredFiles).toEqual([])
    expect(result.current.searchQuery).toBe("")
    expect(result.current.sortBy).toBe("name")
    expect(result.current.sortOrder).toBe("asc")
    expect(result.current.filterType).toBe("all")
    expect(result.current.viewMode).toBe("list")
    expect(result.current.groupBy).toBe("none")
    expect(result.current.availableExtensions).toEqual([])
    expect(result.current.showFavoritesOnly).toBe(false)
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it("should provide methods for interacting with music state", () => {
    const { result } = renderHook(() => useMusic(), {
      wrapper: MusicWrapper,
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
  })

  it("should throw error when useMusic is used outside of MusicProvider", () => {
    // Проверяем, что хук выбрасывает ошибку, если используется вне провайдера
    const consoleError = console.error
    console.error = vi.fn() // Подавляем ошибки в консоли во время теста

    expect(() => renderHook(() => useMusic())).toThrow(
      "useMusic must be used within a MusicProvider",
    )

    console.error = consoleError // Восстанавливаем console.error
  })
})
