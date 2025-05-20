import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MediaToolbar } from "./media-toolbar"

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

vi.mock("./media-list-provider", () => ({
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

describe("MediaToolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render correctly", () => {
    render(<MediaToolbar />)

    // Проверяем наличие основных элементов
    expect(screen.getByText("Import")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument()
  })

  it("should handle search input", () => {
    render(<MediaToolbar />)

    const searchInput = screen.getByPlaceholderText("Search")
    fireEvent.change(searchInput, { target: { value: "test" } })

    expect(mockSetSearchQuery).toHaveBeenCalledWith("test")
    expect(mockSearch).toHaveBeenCalled()
  })

  it("should handle view mode changes", () => {
    render(<MediaToolbar />)

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
    render(<MediaToolbar />)

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
    render(<MediaToolbar />)

    // Находим кнопку избранного
    const favoritesButton = screen.getByTestId("favorites-button")

    // Кликаем на кнопку избранного
    fireEvent.click(favoritesButton)
    expect(mockToggleFavorites).toHaveBeenCalled()
  })

  it("should handle sort order change", () => {
    render(<MediaToolbar />)

    // Находим кнопку изменения порядка сортировки
    const sortOrderButton = screen.getByTestId("sort-order-button")

    // Кликаем на кнопку изменения порядка сортировки
    fireEvent.click(sortOrderButton)
    expect(mockChangeOrder).toHaveBeenCalled()
  })

  it("should handle import button click", () => {
    // Мокируем метод click для элемента input
    const mockClick = vi.fn()
    // Сохраняем оригинальный метод
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const originalCreateElement = document.createElement.bind(document)

    // Мокируем document.createElement только для создания input
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName === "input") {
        const input = originalCreateElement("input")
        // Добавляем мок для метода click
        input.click = mockClick
        return input
      }
      return originalCreateElement(tagName)
    })

    render(<MediaToolbar />)

    // Находим кнопку импорта
    const importButton = screen.getByText("Import")

    // Кликаем на кнопку импорта
    fireEvent.click(importButton)

    // Проверяем, что был создан input
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    expect(document.createElement).toHaveBeenCalledWith("input")
    expect(mockClick).toHaveBeenCalled()

    // Восстанавливаем оригинальный метод
    vi.restoreAllMocks()
  })

  it("should handle folder import button click", () => {
    // Мокируем методы для элемента input
    const mockClick = vi.fn()
    const mockSetAttribute = vi.fn()

    // Сохраняем оригинальный метод
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const originalCreateElement = document.createElement.bind(document)

    // Мокируем document.createElement только для создания input
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName === "input") {
        const input = originalCreateElement("input")
        // Добавляем моки для методов
        input.click = mockClick
        input.setAttribute = mockSetAttribute
        return input
      }
      return originalCreateElement(tagName)
    })

    render(<MediaToolbar />)

    // Находим кнопку импорта папки
    const folderButton = screen.getByTestId("folder-import-button")

    // Кликаем на кнопку импорта папки
    fireEvent.click(folderButton)

    // Проверяем, что был создан input с правильными параметрами
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    expect(document.createElement).toHaveBeenCalledWith("input")
    expect(mockSetAttribute).toHaveBeenCalledWith("webkitdirectory", "")
    expect(mockSetAttribute).toHaveBeenCalledWith("directory", "")
    expect(mockClick).toHaveBeenCalled()

    // Восстанавливаем оригинальный метод
    vi.restoreAllMocks()
  })
})
