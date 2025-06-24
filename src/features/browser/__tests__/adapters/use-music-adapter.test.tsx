import { act, fireEvent, render, renderHook, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { BrowserProviders } from "@/test/test-utils"

import { useMusicAdapter } from "../../adapters/use-music-adapter"

// Мокаем зависимости
vi.mock("@/features/app-state", () => ({
  AppSettingsProvider: ({ children }: { children: React.ReactNode }) => children,
  useAppSettings: vi.fn(() => ({
    getMusicFiles: vi.fn(() => ({
      allFiles: [
        {
          id: "music-1",
          name: "song.mp3",
          path: "/music/song.mp3",
          extension: ".mp3",
          size: 3145728,
          createdAt: "2024-01-01T00:00:00Z",
          probeData: {
            streams: [],
            format: {
              duration: 180,
              tags: {
                artist: "Test Artist",
                title: "Test Song",
              },
            },
          },
        },
      ],
    })),
    updateMusicFiles: vi.fn(),
  })),
  useMusicFiles: vi.fn(() => ({
    musicFiles: {
      allFiles: [
        {
          id: "music-1",
          name: "song.mp3",
          path: "/music/song.mp3",
          extension: ".mp3",
          size: 3145728,
          createdAt: "2024-01-01T00:00:00Z",
          probeData: {
            streams: [],
            format: {
              duration: 180,
              tags: {
                artist: "Test Artist",
                title: "Test Song",
              },
            },
          },
        },
      ],
    },
    updateMusicFiles: vi.fn(),
  })),
  useFavorites: vi.fn(() => ({
    isItemFavorite: vi.fn(() => false),
  })),
}))

vi.mock("@/features/timeline", () => ({
  useTimelineActions: vi.fn(() => ({
    isMusicAdded: vi.fn(() => false),
  })),
  useTimeline: vi.fn(() => ({
    timeline: { tracks: [] },
  })),
}))

vi.mock("@/i18n", () => ({
  default: {
    t: vi.fn((key) => {
      const translations: Record<string, string> = {
        "dates.months.january": "Январь",
        "common.other": "Прочее",
        "media.unknownDate": "Без даты",
        "media.unknownArtist": "Неизвестный исполнитель",
      }
      return translations[key] || key
    }),
    on: vi.fn(),
    off: vi.fn(),
    changeLanguage: vi.fn(() => Promise.resolve()),
    use: vi.fn(),
    init: vi.fn(),
  },
}))

vi.mock("@/i18n/services/i18n-provider", () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock("@/features/top-bar/components/theme/theme-context", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock("@/features/resources", () => ({
  useResources: vi.fn(() => ({
    music: {
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      isItemAdded: vi.fn(() => false),
    },
    isMusicAdded: vi.fn(() => false),
  })),
  ResourcesProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock("@/features/music/hooks/use-music-import", () => ({
  useMusicImport: vi.fn(() => ({
    importFiles: vi.fn(),
    isLoading: false,
    error: null,
  })),
}))

vi.mock("@/features/project-settings", () => ({
  ProjectSettingsProvider: ({ children }: { children: React.ReactNode }) => children,
  useProjectSettings: vi.fn(() => ({
    settings: {
      fps: 30,
      resolution: { width: 1920, height: 1080 },
    },
  })),
}))

vi.mock("@/features/browser/services/browser-state-provider", () => ({
  BrowserStateProvider: ({ children }: { children: React.ReactNode }) => children,
  useBrowserState: vi.fn(() => ({
    state: {},
    send: vi.fn(),
  })),
}))

// Мокаем HTMLAudioElement
const mockAudio = {
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  onended: null as (() => void) | null,
}

global.Audio = vi.fn(() => mockAudio) as any

describe("useMusicAdapter", () => {
  it("should return music adapter with correct structure", () => {
    const { result } = renderHook(() => useMusicAdapter(), {
      wrapper: BrowserProviders,
    })

    expect(result.current).toHaveProperty("useData")
    expect(result.current).toHaveProperty("PreviewComponent")
    expect(result.current).toHaveProperty("getSortValue")
    expect(result.current).toHaveProperty("getSearchableText")
    expect(result.current).toHaveProperty("getGroupValue")
    expect(result.current).toHaveProperty("favoriteType", "music")
  })

  describe("useData", () => {
    it("should return music files data", () => {
      const { result } = renderHook(() => useMusicAdapter(), { wrapper: BrowserProviders })
      const { result: dataResult } = renderHook(() => result.current.useData())

      expect(dataResult.current.loading).toBe(false)
      expect(dataResult.current.error).toBeNull()
      expect(dataResult.current.items).toHaveLength(1)
      expect(dataResult.current.items[0].name).toBe("song.mp3")
    })
  })

  describe("getSortValue", () => {
    const testFile = {
      id: "test",
      name: "test.mp3",
      path: "/test.mp3",
      extension: ".mp3",
      size: 1024,
      createdAt: "2024-01-01T00:00:00Z",
      startTime: 0,
      probeData: {
        streams: [],
        format: {
          duration: 180,
          tags: { artist: "Artist", title: "Title" },
        },
      },
    }

    it("should sort by different fields", () => {
      const { result } = renderHook(() => useMusicAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getSortValue(testFile, "name")).toBe("test.mp3")
      expect(result.current.getSortValue(testFile, "size")).toBe(1024)
      expect(result.current.getSortValue(testFile, "title")).toBe("title")
      expect(result.current.getSortValue(testFile, "artist")).toBe("artist")
      expect(result.current.getSortValue(testFile, "duration")).toBe(180)
      expect(result.current.getSortValue(testFile, "unknown")).toBe(0)
    })
  })

  describe("getSearchableText", () => {
    const testFile = {
      id: "test",
      name: "song.mp3",
      path: "/music/song.mp3",
      extension: ".mp3",
      size: 1024,
      createdAt: "2024-01-01",
      startTime: 0,
      probeData: {
        streams: [],
        format: {
          duration: 0,
          tags: { artist: "Test Artist", title: "Test Song" },
        },
      },
    }

    it("should return searchable text array", () => {
      const { result } = renderHook(() => useMusicAdapter(), { wrapper: BrowserProviders })

      const searchableText = result.current.getSearchableText(testFile)
      expect(searchableText).toEqual(["song.mp3", "Test Song", "Test Artist"])
    })
  })

  describe("getGroupValue", () => {
    const testFile = {
      id: "test",
      name: "test.mp3",
      path: "/test.mp3",
      extension: ".mp3",
      size: 1024,
      createdAt: "2024-01-01T00:00:00Z",
      startTime: new Date("2024-01-01T00:00:00Z").getTime(),
      probeData: {
        streams: [],
        format: {
          duration: 180,
          tags: { artist: "Test Artist" },
        },
      },
    }

    it("should group by different fields", () => {
      const { result } = renderHook(() => useMusicAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getGroupValue(testFile, "artist")).toBe("Test Artist")
      expect(result.current.getGroupValue(testFile, "date")).toBe("2024")
      expect(result.current.getGroupValue(testFile, "duration")).toBe("3-5 минут")
      expect(result.current.getGroupValue(testFile, "unknown")).toBe("")
    })
  })

  describe("PreviewComponent", () => {
    const testFile = {
      id: "test",
      name: "test.mp3",
      path: "/test.mp3",
      extension: ".mp3",
      size: 1024,
      createdAt: "2024-01-01",
      startTime: 0,
      probeData: {
        streams: [],
        format: {
          duration: 180,
          tags: { artist: "Test Artist", title: "Test Song" },
        },
      },
    }

    it("should render music preview in grid mode", () => {
      const { result } = renderHook(() => useMusicAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent

      render(
        <PreviewComponent
          item={testFile}
          size={{ width: 200, height: 200 }}
          viewMode="grid"
          onClick={vi.fn()}
          onDragStart={vi.fn()}
          onAddToTimeline={vi.fn()}
          onToggleFavorite={vi.fn()}
          isSelected={false}
          isFavorite={false}
        />,
      )

      expect(screen.getByText("Test Song")).toBeInTheDocument()
      expect(screen.getByText("Test Artist")).toBeInTheDocument()
    })

    it("should handle audio play/pause", async () => {
      const { result } = renderHook(() => useMusicAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent

      render(
        <PreviewComponent
          item={testFile}
          size={{ width: 200, height: 200 }}
          viewMode="grid"
          onClick={vi.fn()}
          onDragStart={vi.fn()}
          onAddToTimeline={vi.fn()}
          onToggleFavorite={vi.fn()}
          isSelected={false}
          isFavorite={false}
        />,
      )

      const playButton = screen.getByRole("button")

      await act(async () => {
        fireEvent.click(playButton)
      })

      expect(mockAudio.play).toHaveBeenCalled()
    })

    it("should render in list mode", () => {
      const { result } = renderHook(() => useMusicAdapter(), { wrapper: BrowserProviders })
      const PreviewComponent = result.current.PreviewComponent

      render(
        <PreviewComponent
          item={testFile}
          size={{ width: 100, height: 100 }}
          viewMode="list"
          onClick={vi.fn()}
          onDragStart={vi.fn()}
          onAddToTimeline={vi.fn()}
          onToggleFavorite={vi.fn()}
          isSelected={false}
          isFavorite={false}
        />,
      )

      expect(screen.getByText("Test Song")).toBeInTheDocument()
      expect(screen.getByText("3:00")).toBeInTheDocument() // Duration formatting
    })
  })
})
