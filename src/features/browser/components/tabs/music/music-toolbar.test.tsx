import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MusicToolbar } from "./music-toolbar"

// Мокаем хук useMusicMachine
vi.mock("./use-music-machine", () => ({
  useMusicMachine: () => ({
    searchQuery: "test",
    sortBy: "date",
    sortOrder: "desc",
    filterType: "all",
    viewMode: "thumbnails",
    groupBy: "none",
    availableExtensions: ["mp3", "wav"],
    showFavoritesOnly: false,
    search: vi.fn(),
    sort: vi.fn(),
    filter: vi.fn(),
    changeOrder: vi.fn(),
    changeViewMode: vi.fn(),
    changeGroupBy: vi.fn(),
    toggleFavorites: vi.fn(),
  }),
}))

// Мокаем хук useMedia
vi.mock("@/features/browser/media", () => ({
  useMedia: () => ({
    isItemFavorite: vi.fn(),
  }),
}))

// Мокаем хук useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Возвращаем ключи для тестирования
      const translations: Record<string, string> = {
        "browser.toolbar.group": "Group",
        "browser.toolbar.groupBy.none": "None",
        "browser.toolbar.groupBy.artist": "By Artist",
        "browser.toolbar.groupBy.genre": "By Genre",
        "browser.toolbar.groupBy.album": "By Album",
        "browser.search": "Search",
        "browser.import": "Import",
        "browser.sort": "Sort",
        "browser.filter": "Filter",
        "browser.all": "All",
        "browser.sort_by_name": "By Name",
        "browser.list_view": "List View",
        "browser.show_favorites": "Show Favorites",
      }
      return translations[key] || key
    },
  }),
}))

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

describe("MusicToolbar", () => {
  // Создаем моки для пропсов
  const mockProps = {
    onImport: vi.fn(),
    onImportFile: vi.fn(),
    onImportFolder: vi.fn(),
  }

  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()
  })

  it("should render correctly", () => {
    // Рендерим компонент
    render(<MusicToolbar {...mockProps} />)

    // Проверяем, что компонент отрендерился
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument()
    expect(screen.getByText("Import")).toBeInTheDocument()
  })

  it("should call onImport when import button is clicked", () => {
    // Рендерим компонент
    render(<MusicToolbar {...mockProps} />)

    // Находим кнопку импорта и кликаем по ней
    const importButton = screen.getByText("Import")
    fireEvent.click(importButton)

    // Проверяем, что onImport был вызван
    expect(mockProps.onImport).toHaveBeenCalled()
  })

  it("should call search when search input changes", () => {
    // Рендерим компонент
    render(<MusicToolbar {...mockProps} />)

    // Находим поле поиска и вводим текст
    const searchInput = screen.getByPlaceholderText("Search")
    fireEvent.change(searchInput, { target: { value: "new search" } })

    // Получаем мок хука useMusicMachine
    const { useMusicMachine } = require("./use-music-machine")
    const { search } = useMusicMachine()

    // Проверяем, что search был вызван с правильными параметрами
    expect(search).toHaveBeenCalled()
  })

  it("should call sort when sort option is clicked", () => {
    // Рендерим компонент
    render(<MusicToolbar {...mockProps} />)

    // Находим кнопку сортировки и кликаем по ней
    const sortButton = screen.getByText("Sort")
    fireEvent.click(sortButton)

    // Находим опцию сортировки по имени и кликаем по ней
    const sortByNameOption = screen.getByText("By Name")
    fireEvent.click(sortByNameOption)

    // Получаем мок хука useMusicMachine
    const { useMusicMachine } = require("./use-music-machine")
    const { sort } = useMusicMachine()

    // Проверяем, что sort был вызван с правильными параметрами
    expect(sort).toHaveBeenCalledWith("name")
  })

  it("should call filter when filter option is clicked", () => {
    // Рендерим компонент
    render(<MusicToolbar {...mockProps} />)

    // Находим кнопку фильтра и кликаем по ней
    const filterButton = screen.getByText("Filter")
    fireEvent.click(filterButton)

    // Находим опцию фильтра "Все" и кликаем по ней
    const filterAllOption = screen.getByText("All")
    fireEvent.click(filterAllOption)

    // Получаем мок хука useMusicMachine
    const { useMusicMachine } = require("./use-music-machine")
    const { filter } = useMusicMachine()

    // Проверяем, что filter был вызван с правильными параметрами
    expect(filter).toHaveBeenCalled()
  })

  it("should call changeViewMode when view mode button is clicked", () => {
    // Рендерим компонент
    render(<MusicToolbar {...mockProps} />)

    // Находим кнопку режима списка и кликаем по ней
    const listViewButton = screen.getByLabelText("browser.list_view")
    fireEvent.click(listViewButton)

    // Получаем мок хука useMusicMachine
    const { useMusicMachine } = require("./use-music-machine")
    const { changeViewMode } = useMusicMachine()

    // Проверяем, что changeViewMode был вызван с правильными параметрами
    expect(changeViewMode).toHaveBeenCalledWith("list")
  })

  it("should call changeOrder when order button is clicked", () => {
    // Рендерим компонент
    render(<MusicToolbar {...mockProps} />)

    // Находим кнопку порядка сортировки и кликаем по ней
    const orderButton = screen.getByLabelText("browser.change_order")
    fireEvent.click(orderButton)

    // Получаем мок хука useMusicMachine
    const { useMusicMachine } = require("./use-music-machine")
    const { changeOrder } = useMusicMachine()

    // Проверяем, что changeOrder был вызван
    expect(changeOrder).toHaveBeenCalled()
  })

  it("should call toggleFavorites when favorites button is clicked", () => {
    // Рендерим компонент
    render(<MusicToolbar {...mockProps} />)

    // Находим кнопку избранного и кликаем по ней
    const favoritesButton = screen.getByLabelText("browser.show_favorites")
    fireEvent.click(favoritesButton)

    // Получаем мок хука useMusicMachine
    const { useMusicMachine } = require("./use-music-machine")
    const { toggleFavorites } = useMusicMachine()

    // Проверяем, что toggleFavorites был вызван
    expect(toggleFavorites).toHaveBeenCalled()
  })

  it("should call changeGroupBy when group option is clicked", () => {
    // Рендерим компонент
    render(<MusicToolbar {...mockProps} />)

    // Находим кнопку группировки по иконке и кликаем по ней
    // Используем queryAllByRole, так как кнопка не имеет aria-label
    const buttons = screen.queryAllByRole("button")
    // Находим кнопку группировки (она должна быть третьей кнопкой в тулбаре)
    const groupButton = buttons[2]
    fireEvent.click(groupButton)

    // Находим опцию группировки по исполнителю и кликаем по ней
    const groupByArtistOption = screen.getByText("By Artist")
    fireEvent.click(groupByArtistOption)

    // Получаем мок хука useMusicMachine
    const { useMusicMachine } = require("./use-music-machine")
    const { changeGroupBy } = useMusicMachine()

    // Проверяем, что changeGroupBy был вызван с правильными параметрами
    expect(changeGroupBy).toHaveBeenCalledWith("artist")
  })
})
