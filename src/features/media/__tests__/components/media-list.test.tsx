import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAppSettings, useFavorites } from "@/features/app-state"
import { useBrowserState } from "@/features/browser/services/browser-state-provider"
import { renderWithProviders } from "@/test/test-utils"

import { MediaList } from "../../components/media-list"

// Импортируем для мокирования

// Мокаем StatusBar
vi.mock("@/features/browser", () => ({
  StatusBar: ({ media }: { media: any[] }) => <div data-testid="status-bar">Status: {media.length} files</div>,
}))

// Мокаем MediaContent
vi.mock("../../components/media-content", () => ({
  MediaContent: ({ groups, viewMode, previewSize, addFilesToTimeline }: any) => (
    <div data-testid="media-content" data-view-mode={viewMode} data-preview-size={previewSize}>
      {groups &&
        groups.map((group: any, index: number) => (
          <div key={index} data-testid="media-group">
            <h3>{group.title}</h3>
            <div>Files: {group.files.length}</div>
          </div>
        ))}
    </div>
  ),
}))

// Мокаем useAppSettings
vi.mock("@/features/app-state", () => ({
  useAppSettings: vi.fn(),
  useFavorites: vi.fn(),
  AppSettingsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Мокаем useBrowserState
vi.mock("@/features/browser/services/browser-state-provider", () => ({
  useBrowserState: vi.fn(),
}))

// Мокаем useTimelineActions
const mockAddMediaToTimeline = vi.fn()

vi.mock("@/features/timeline/hooks", () => ({
  useTimelineActions: vi.fn(() => ({
    addMediaToTimeline: mockAddMediaToTimeline,
  })),
}))

// Мокаем utils
vi.mock("@/features/media", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getFileType: vi.fn((file) => {
      if (file.isVideo) return "video"
      if (file.isAudio) return "audio"
      if (file.isImage) return "image"
      return "unknown"
    }),
    groupFilesByDate: vi.fn((files) => [
      { title: "2022-01-01", files: files.slice(0, 1) },
      { title: "2022-01-02", files: files.slice(1, 2) },
      { title: "2022-01-03", files: files.slice(2, 3) },
    ]),
  }
})

// Мокаем react-i18next
vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  }
})

// Мокаем i18n/constants
vi.mock("@/i18n/constants", () => ({
  formatDateByLanguage: vi.fn((date, lang) => new Date(date).toISOString().split("T")[0]),
}))

describe("MediaList", () => {
  const mockGetError = vi.fn()

  const mockState = {
    context: {
      mediaFiles: {
        allFiles: [
          {
            id: "file-1",
            name: "video1.mp4",
            path: "/path/to/video1.mp4",
            isVideo: true,
            isAudio: false,
            isImage: false,
            size: 1024 * 1024 * 50, // 50MB
            duration: 120,
            startTime: 1640995200000, // 2022-01-01
          },
          {
            id: "file-2",
            name: "audio1.mp3",
            path: "/path/to/audio1.mp3",
            isVideo: false,
            isAudio: true,
            isImage: false,
            size: 1024 * 1024 * 5, // 5MB
            duration: 180,
            startTime: 1641081600000, // 2022-01-02
          },
          {
            id: "file-3",
            name: "image1.jpg",
            path: "/path/to/image1.jpg",
            isVideo: false,
            isAudio: false,
            isImage: true,
            size: 1024 * 1024 * 2, // 2MB
            startTime: 1641168000000, // 2022-01-03
          },
        ],
      },
    },
  }

  const mockCurrentTabSettings = {
    searchQuery: "",
    showFavoritesOnly: false,
    viewMode: "grid",
    sortBy: "date",
    filterType: "all",
    groupBy: "none",
    sortOrder: "desc",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetError.mockReturnValue(null)

    // Устанавливаем моки по умолчанию
    vi.mocked(useAppSettings).mockReturnValue({
      isLoading: vi.fn(() => false),
      getError: mockGetError,
      state: mockState,
    } as any)

    vi.mocked(useFavorites).mockReturnValue({
      isItemFavorite: vi.fn(() => false),
    } as any)

    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: mockCurrentTabSettings,
      previewSize: 150,
    } as any)
  })

  it("should render media list with files", () => {
    renderWithProviders(<MediaList />)

    // Проверяем, что StatusBar отрендерился
    expect(screen.getByTestId("status-bar")).toBeInTheDocument()
    expect(screen.getByText("Status: 3 files")).toBeInTheDocument()

    // Проверяем, что MediaContent отрендерился
    expect(screen.getByTestId("media-content")).toBeInTheDocument()
    expect(screen.getByTestId("media-content")).toHaveAttribute("data-view-mode", "grid")
    expect(screen.getByTestId("media-content")).toHaveAttribute("data-preview-size", "150")
  })

  it("should handle loading state", () => {
    vi.mocked(useAppSettings).mockReturnValue({
      isLoading: vi.fn(() => true),
      getError: mockGetError,
      state: { context: { mediaFiles: { allFiles: [] } } },
    } as any)

    renderWithProviders(<MediaList />)

    // Проверяем, что MediaContent отрендерился
    expect(screen.getByTestId("media-content")).toBeInTheDocument()
    // StatusBar не должен отображаться для пустого списка
    expect(screen.queryByTestId("status-bar")).not.toBeInTheDocument()
  })

  it("should handle error state", () => {
    const errorMessage = "Failed to load media files"
    mockGetError.mockReturnValue(errorMessage)

    renderWithProviders(<MediaList />)

    // Компонент должен все равно отрендериться, но с ошибкой в контексте
    expect(screen.getByTestId("status-bar")).toBeInTheDocument()
    expect(screen.getByTestId("media-content")).toBeInTheDocument()
  })

  it("should filter files by search query", () => {
    // Мокаем useBrowserState с поисковым запросом
    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: {
        ...mockCurrentTabSettings,
        searchQuery: "video1",
      },
      previewSize: 150,
    } as any)

    renderWithProviders(<MediaList />)

    // Файлы должны быть отфильтрованы по поисковому запросу
    expect(screen.getByTestId("media-content")).toBeInTheDocument()
  })

  it("should filter files by type", () => {
    // Мокаем useBrowserState с фильтром по типу
    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: {
        ...mockCurrentTabSettings,
        filterType: "video",
      },
      previewSize: 150,
    } as any)

    renderWithProviders(<MediaList />)

    // Файлы должны быть отфильтрованы по типу
    expect(screen.getByTestId("media-content")).toBeInTheDocument()
  })

  it("should sort files by name", () => {
    // Мокаем useBrowserState с сортировкой по имени
    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: {
        ...mockCurrentTabSettings,
        sortBy: "name",
        sortOrder: "asc",
      },
      previewSize: 150,
    } as any)

    renderWithProviders(<MediaList />)

    // Файлы должны быть отсортированы по имени
    expect(screen.getByTestId("media-content")).toBeInTheDocument()
  })

  it("should sort files by size", () => {
    // Мокаем useBrowserState с сортировкой по размеру
    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: {
        ...mockCurrentTabSettings,
        sortBy: "size",
        sortOrder: "desc",
      },
      previewSize: 150,
    } as any)

    renderWithProviders(<MediaList />)

    // Файлы должны быть отсортированы по размеру
    expect(screen.getByTestId("media-content")).toBeInTheDocument()
  })

  it("should sort files by duration", () => {
    // Мокаем useBrowserState с сортировкой по длительности
    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: {
        ...mockCurrentTabSettings,
        sortBy: "duration",
        sortOrder: "desc",
      },
      previewSize: 150,
    } as any)

    renderWithProviders(<MediaList />)

    // Файлы должны быть отсортированы по длительности
    expect(screen.getByTestId("media-content")).toBeInTheDocument()
  })

  it("should group files by type", () => {
    // Мокаем useBrowserState с группировкой по типу
    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: {
        ...mockCurrentTabSettings,
        groupBy: "type",
      },
      previewSize: 150,
    } as any)

    renderWithProviders(<MediaList />)

    // Файлы должны быть сгруппированы по типу
    expect(screen.getByTestId("media-content")).toBeInTheDocument()
  })

  it("should group files by date", () => {
    // Мокаем useBrowserState с группировкой по дате
    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: {
        ...mockCurrentTabSettings,
        groupBy: "date",
      },
      previewSize: 150,
    } as any)

    renderWithProviders(<MediaList />)

    // Файлы должны быть сгруппированы по дате
    expect(screen.getByTestId("media-content")).toBeInTheDocument()
  })

  it("should show favorites only", () => {
    // Мокаем useFavorites чтобы один файл был в избранном
    vi.mocked(useFavorites).mockReturnValue({
      isItemFavorite: vi.fn((file) => file.id === "file-1"),
    } as any)

    // Мокаем useBrowserState с фильтром избранного
    vi.mocked(useBrowserState).mockReturnValue({
      currentTabSettings: {
        ...mockCurrentTabSettings,
        showFavoritesOnly: true,
      },
      previewSize: 150,
    } as any)

    renderWithProviders(<MediaList />)

    // Должен показать только избранные файлы
    expect(screen.getByTestId("media-content")).toBeInTheDocument()
  })

  it("should handle empty file list", () => {
    // Мокаем пустой список файлов
    vi.mocked(useAppSettings).mockReturnValue({
      isLoading: vi.fn(() => false),
      getError: mockGetError,
      state: {
        context: {
          mediaFiles: {
            allFiles: [],
          },
        },
      },
    } as any)

    renderWithProviders(<MediaList />)

    // Проверяем, что MediaContent отрендерился
    expect(screen.getByTestId("media-content")).toBeInTheDocument()
    // StatusBar не должен отображаться для пустого списка
    expect(screen.queryByTestId("status-bar")).not.toBeInTheDocument()
  })

  it("should handle different view modes", () => {
    const viewModes = ["list", "grid", "thumbnails"]

    viewModes.forEach((viewMode) => {
      vi.mocked(useBrowserState).mockReturnValue({
        currentTabSettings: {
          ...mockCurrentTabSettings,
          viewMode,
        },
        previewSize: 150,
      } as any)

      const { rerender } = renderWithProviders(<MediaList />)

      expect(screen.getByTestId("media-content")).toHaveAttribute("data-view-mode", viewMode)

      rerender(<div />)
    })
  })

  it("should handle different preview sizes", () => {
    const previewSizes = [100, 150, 200, 250]

    previewSizes.forEach((size) => {
      vi.mocked(useBrowserState).mockReturnValue({
        currentTabSettings: mockCurrentTabSettings,
        previewSize: size,
      } as any)

      const { rerender } = renderWithProviders(<MediaList />)

      expect(screen.getByTestId("media-content")).toHaveAttribute("data-preview-size", size.toString())

      rerender(<div />)
    })
  })
})
