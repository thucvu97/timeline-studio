import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MediaProvider } from "@/features/browser/media/media-provider"

import { MediaToolbar } from "./media-toolbar"

// Импортируем MediaProvider

// Создаем компонент-обертку для тестов
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MediaProvider>{children}</MediaProvider>
)

// Мокаем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "common.import": "Import",
        "common.search": "Search",
        "browser.media.uploadMedia": "Upload Media",
        "browser.media.addFolder": "Add Folder",
        "browser.media.favorites": "Favorites",
        "browser.toolbar.grid": "Grid View",
        "browser.toolbar.thumbnails": "Thumbnails View",
        "browser.toolbar.list": "List View",
        "browser.toolbar.zoomOut": "Zoom Out",
        "browser.toolbar.zoomIn": "Zoom In",
        "browser.toolbar.sort": "Sort",
        "browser.toolbar.sortBy.name": "Name",
        "browser.toolbar.sortBy.date": "Date",
        "browser.toolbar.sortBy.size": "Size",
        "browser.toolbar.sortBy.duration": "Duration",
        "browser.toolbar.filter": "Filter",
        "browser.toolbar.filterBy.all": "All",
        "browser.toolbar.filterBy.video": "Video",
        "browser.toolbar.filterBy.audio": "Audio",
        "browser.toolbar.filterBy.image": "Image",
        "browser.toolbar.group": "Group",
        "browser.toolbar.groupBy.none": "None",
        "browser.toolbar.groupBy.type": "Type",
        "browser.toolbar.groupBy.date": "Date",
        "browser.toolbar.groupBy.duration": "Duration",
        "browser.toolbar.sortOrder.asc": "Ascending",
        "browser.toolbar.sortOrder.desc": "Descending",
      }
      return translations[key] || key
    },
  }),
}))

// Мокаем useMediaList
const mockSort = vi.fn()
const mockFilter = vi.fn()
const mockSearch = vi.fn()
const mockChangeViewMode = vi.fn()
const mockChangeGroupBy = vi.fn()
const mockChangeOrder = vi.fn()
const mockToggleFavorites = vi.fn()
const mockIncreasePreviewSize = vi.fn()
const mockDecreasePreviewSize = vi.fn()
const mockSetSearchQuery = vi.fn()

vi.mock("../services/media-list-provider", () => ({
  useMediaList: () => ({
    viewMode: "list",
    sortBy: "date",
    sortOrder: "desc",
    filterType: "all",
    groupBy: "none",
    changeViewMode: mockChangeViewMode,
    sort: mockSort,
    filter: mockFilter,
    changeGroupBy: mockChangeGroupBy,
    changeOrder: mockChangeOrder,
    search: mockSearch,
    toggleFavorites: mockToggleFavorites,
    canIncreaseSize: true,
    canDecreaseSize: true,
    increasePreviewSize: mockIncreasePreviewSize,
    decreasePreviewSize: mockDecreasePreviewSize,
    searchQuery: "",
    showFavoritesOnly: false,
    setSearchQuery: mockSetSearchQuery,
  }),
}))

// Мокаем useMedia
vi.mock("@/features/browser/media", () => ({
  useMedia: () => ({
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
    addMediaFiles: vi.fn(),
  }),
}))

// Мокаем useMediaImport
const mockImportFile = vi.fn().mockResolvedValue({ success: true, message: "Файл успешно импортирован", files: [] })
const mockImportFolder = vi.fn().mockResolvedValue({ success: true, message: "Папка успешно импортирована", files: [] })

vi.mock("@/features/browser/media/use-media-import", () => ({
  useMediaImport: () => ({
    importFile: mockImportFile,
    importFolder: mockImportFolder,
    isImporting: false,
    progress: 0,
  }),
}))

// Мокаем useModal
vi.mock("@/features/modals", () => ({
  useModal: () => ({
    openModal: vi.fn(),
  }),
}))

// Мокаем console.log
vi.spyOn(console, "log").mockImplementation(() => {})

// Мокаем функции Tauri API
vi.mock("@tauri-apps/api/dialog", () => ({
  open: vi.fn().mockResolvedValue("/path/to/file.mp4"),
}))

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(["/path/to/file1.mp4", "/path/to/file2.mp4"]),
}))

vi.mock("@/lib/media", () => ({
  selectMediaFile: vi.fn().mockResolvedValue("/path/to/file.mp4"),
  selectMediaDirectory: vi.fn().mockResolvedValue("/path/to/directory"),
  getMediaMetadata: vi.fn().mockResolvedValue({
    is_video: true,
    is_audio: false,
    is_image: false,
    size: 1024,
    duration: 60,
    start_time: 0,
    creation_time: "2023-01-01",
    probe_data: {
      streams: [],
      format: {},
    },
  }),
}))

describe("MediaToolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render correctly", () => {
    render(
      <TestWrapper>
        <MediaToolbar />
      </TestWrapper>
    )

    // Проверяем наличие основных элементов
    expect(screen.getByText("Import")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument()
  })

  it("should handle search input", () => {
    render(
      <TestWrapper>
        <MediaToolbar />
      </TestWrapper>
    )

    const searchInput = screen.getByPlaceholderText("Search")
    fireEvent.change(searchInput, { target: { value: "test" } })

    expect(mockSetSearchQuery).toHaveBeenCalledWith("test")
    expect(mockSearch).toHaveBeenCalled()
  })

  it("should handle view mode changes", () => {
    render(
      <TestWrapper>
        <MediaToolbar />
      </TestWrapper>
    )

    // Находим кнопки режимов отображения по иконкам
    const gridButton = screen.getByTestId("grid-view-button")
    const thumbnailsButton = screen.getByTestId("thumbnails-view-button")
    const listButton = screen.getByTestId("list-view-button")

    // Кликаем на кнопку Grid
    fireEvent.click(gridButton)
    expect(mockChangeViewMode).toHaveBeenCalledWith("grid")

    // Кликаем на кнопку Thumbnails
    fireEvent.click(thumbnailsButton)
    expect(mockChangeViewMode).toHaveBeenCalledWith("thumbnails")

    // Кликаем на кнопку List
    fireEvent.click(listButton)
    expect(mockChangeViewMode).toHaveBeenCalledWith("list")
  })

  it("should handle preview size changes", () => {
    render(
      <TestWrapper>
        <MediaToolbar />
      </TestWrapper>
    )

    // Находим кнопки изменения размера превью
    const zoomOutButton = screen.getByTestId("zoom-out-button")
    const zoomInButton = screen.getByTestId("zoom-in-button")

    // Кликаем на кнопку Zoom Out
    fireEvent.click(zoomOutButton)
    expect(mockDecreasePreviewSize).toHaveBeenCalled()

    // Кликаем на кнопку Zoom In
    fireEvent.click(zoomInButton)
    expect(mockIncreasePreviewSize).toHaveBeenCalled()
  })

  it("should handle favorites toggle", () => {
    render(
      <TestWrapper>
        <MediaToolbar />
      </TestWrapper>
    )

    // Находим кнопку избранного
    const favoritesButton = screen.getByTestId("favorites-button")

    // Кликаем на кнопку избранного
    fireEvent.click(favoritesButton)
    expect(mockToggleFavorites).toHaveBeenCalled()
  })

  it("should handle sort order change", () => {
    render(
      <TestWrapper>
        <MediaToolbar />
      </TestWrapper>
    )

    // Находим кнопку изменения порядка сортировки
    const sortOrderButton = screen.getByTestId("sort-order-button")

    // Кликаем на кнопку изменения порядка сортировки
    fireEvent.click(sortOrderButton)
    expect(mockChangeOrder).toHaveBeenCalled()
  })

  it("should handle import button click", async () => {
    render(
      <TestWrapper>
        <MediaToolbar />
      </TestWrapper>
    )

    // Находим кнопку импорта
    const importButton = screen.getByText("Import")

    // Кликаем на кнопку импорта
    fireEvent.click(importButton)

    // Проверяем, что была вызвана функция importFile из хука useMediaImport
    expect(mockImportFile).toHaveBeenCalled()
  })

  it("should handle folder import button click", async () => {
    render(
      <TestWrapper>
        <MediaToolbar />
      </TestWrapper>
    )

    // Находим кнопку импорта папки
    const folderButton = screen.getByTestId("folder-import-button")

    // Кликаем на кнопку импорта папки
    fireEvent.click(folderButton)

    // Проверяем, что была вызвана функция importFolder из хука useMediaImport
    expect(mockImportFolder).toHaveBeenCalled()
  })
})
