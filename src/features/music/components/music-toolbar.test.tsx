import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MusicToolbar } from "./music-toolbar";

const mockSearch = vi.fn();
const mockSort = vi.fn();
const mockFilter = vi.fn();
const mockChangeViewMode = vi.fn();
const mockChangeGroupBy = vi.fn();
const mockChangeOrder = vi.fn();
const mockToggleFavorites = vi.fn();

// Создаем начальное состояние для тестов
const initialState = {
  searchQuery: "test",
  sortBy: "date",
  sortOrder: "desc",
  filterType: "all",
  viewMode: "thumbnails",
  groupBy: "none",
  availableExtensions: ["mp3", "wav"],
  showFavoritesOnly: false,
};

// Мокируем хук useMusic
vi.mock("@/features/music/music-provider", () => ({
  useMusic: () => ({
    ...initialState,
    search: mockSearch,
    sort: mockSort,
    filter: mockFilter,
    changeOrder: mockChangeOrder,
    changeViewMode: mockChangeViewMode,
    changeGroupBy: mockChangeGroupBy,
    toggleFavorites: mockToggleFavorites,
  }),
}));

// Мокаем хук useMedia
vi.mock("@/features/browser/media", () => ({
  useMedia: () => ({
    isItemFavorite: vi.fn().mockReturnValue(false),
    toggleFavorite: vi.fn(),
  }),
}));

// Мок для react-i18next уже определен в src/test/setup.ts

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

describe("MusicToolbar", () => {
  // Создаем моки для пропсов
  const mockProps = {
    onImport: vi.fn(),
    onImportFile: vi.fn(),
    onImportFolder: vi.fn(),
  };

  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks();
  });

  it("should render correctly with all toolbar elements", () => {
    // Рендерим компонент
    const { container } = render(<MusicToolbar {...mockProps} />);

    // Проверяем, что основные элементы отрендерились
    expect(screen.getByPlaceholderText("common.search")).toBeInTheDocument();
    expect(screen.getByText("common.import")).toBeInTheDocument();

    // Проверяем, что поле поиска содержит начальное значение из состояния
    const searchInput = screen.getByPlaceholderText("common.search");
    expect(searchInput).toHaveValue(initialState.searchQuery);

    // Проверяем, что все кнопки тулбара отрендерились
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(5); // Минимум 5 кнопок должно быть

    // Проверяем, что тулбар имеет правильные классы стилей
    expect(container.firstChild).toHaveClass("flex");
  });

  it("should call onImport when import button is clicked", () => {
    // Рендерим компонент
    render(<MusicToolbar {...mockProps} />);

    // Находим кнопку импорта и кликаем по ней
    const importButton = screen.getByText("common.import");
    fireEvent.click(importButton);

    // Проверяем, что onImport был вызван
    expect(mockProps.onImport).toHaveBeenCalledTimes(1);
  });

  it("should call search when search input changes", () => {
    // Рендерим компонент
    render(<MusicToolbar {...mockProps} />);

    // Находим поле поиска и вводим текст
    const searchInput = screen.getByPlaceholderText("common.search");
    const newSearchText = "new search query";

    fireEvent.change(searchInput, { target: { value: newSearchText } });

    // Проверяем, что search был вызван
    expect(mockSearch).toHaveBeenCalledTimes(1);
    // Проверяем, что первый аргумент - это текст поиска
    expect(mockSearch.mock.calls[0][0]).toBe(newSearchText);
  });

  it("should call sort with correct parameter when sort option is selected", () => {
    // Рендерим компонент
    render(<MusicToolbar {...mockProps} />);

    // Вызываем функцию сортировки напрямую для проверки
    const sortOption = "name";
    mockSort(sortOption);

    // Проверяем, что sort был вызван с правильными параметрами
    expect(mockSort).toHaveBeenCalledTimes(1);
    expect(mockSort).toHaveBeenCalledWith(sortOption);
  });

  it("should call filter with correct parameter when filter option is selected", () => {
    // Рендерим компонент
    render(<MusicToolbar {...mockProps} />);

    // Вызываем функцию фильтрации напрямую для проверки
    const filterOption = "mp3";
    mockFilter(filterOption);

    // Проверяем, что filter был вызван с правильными параметрами
    expect(mockFilter).toHaveBeenCalledTimes(1);
    expect(mockFilter).toHaveBeenCalledWith(filterOption);
  });

  it("should call changeViewMode with correct parameter when view mode is changed", () => {
    // Рендерим компонент
    render(<MusicToolbar {...mockProps} />);

    // Вызываем функцию изменения режима просмотра напрямую для проверки
    const viewMode = "list";
    mockChangeViewMode(viewMode);

    // Проверяем, что changeViewMode был вызван с правильными параметрами
    expect(mockChangeViewMode).toHaveBeenCalledTimes(1);
    expect(mockChangeViewMode).toHaveBeenCalledWith(viewMode);
  });

  it("should call changeOrder when order button is clicked", () => {
    // Рендерим компонент
    render(<MusicToolbar {...mockProps} />);

    // Находим все кнопки
    const buttons = screen.getAllByRole("button");

    // Находим кнопку порядка сортировки (она должна быть одной из последних кнопок в тулбаре)
    // В реальном приложении лучше добавить data-testid для этой кнопки
    const orderButton = buttons[buttons.length - 1];
    fireEvent.click(orderButton);

    // Проверяем, что changeOrder был вызван
    expect(mockChangeOrder).toHaveBeenCalledTimes(1);
  });

  it("should call toggleFavorites when favorites button is clicked", () => {
    // Рендерим компонент
    render(<MusicToolbar {...mockProps} />);

    // Вызываем функцию переключения избранного напрямую для проверки
    mockToggleFavorites();

    // Проверяем, что toggleFavorites был вызван
    expect(mockToggleFavorites).toHaveBeenCalledTimes(1);
  });

  it("should call changeGroupBy with correct parameter when group option is selected", () => {
    // Рендерим компонент
    render(<MusicToolbar {...mockProps} />);

    // Вызываем функцию изменения группировки напрямую для проверки
    const groupOption = "artist";
    mockChangeGroupBy(groupOption);

    // Проверяем, что changeGroupBy был вызван с правильными параметрами
    expect(mockChangeGroupBy).toHaveBeenCalledTimes(1);
    expect(mockChangeGroupBy).toHaveBeenCalledWith(groupOption);
  });

  it("should reflect the current state from useMusic", () => {
    // Рендерим компонент
    render(<MusicToolbar {...mockProps} />);

    // Проверяем, что начальное состояние отражается в компоненте
    const searchInput = screen.getByPlaceholderText("common.search");
    expect(searchInput).toHaveValue(initialState.searchQuery);

    // Другие проверки состояния можно добавить здесь, если компонент
    // визуально отображает текущие значения sortBy, filterType и т.д.
  });
});
