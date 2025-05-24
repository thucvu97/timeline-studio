import { act, render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MusicProvider, useMusic } from "./music-provider";

// Создаем моковый объект для send
const mockSend = vi.fn();

// Создаем моковый объект для состояния
const mockState = {
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
    error: null,
  },
  matches: (state: string) => state === "success",
  status: "active",
  value: "success",
};

// Мокаем useMachine из @xstate/react
vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [mockState, mockSend]),
}));

// Мокаем musicMachine
vi.mock("./music-machine", () => ({
  musicMachine: {
    createMachine: vi.fn(),
  },
}));

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

// Компонент-обертка для тестирования хука useMusic
const MusicWrapper = ({ children }: { children: React.ReactNode }) => (
  <MusicProvider>{children}</MusicProvider>
);

describe("MusicProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Сбрасываем состояние мока перед каждым тестом
    Object.assign(mockState.context, {
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
      error: null,
    });

    mockState.matches = (state: string) => state === "success";
  });

  it("should render children", () => {
    render(
      <MusicProvider>
        <div data-testid="test-child">Test Child</div>
      </MusicProvider>,
    );

    expect(screen.getByTestId("test-child")).toBeInTheDocument();
  });

  it("should provide MusicContext", () => {
    const { result } = renderHook(() => useMusic(), {
      wrapper: MusicWrapper,
    });

    // Проверяем, что контекст содержит ожидаемые свойства
    expect(result.current).toBeDefined();
    expect(result.current.musicFiles).toEqual([]);
    expect(result.current.filteredFiles).toEqual([]);
    expect(result.current.searchQuery).toBe("");
    expect(result.current.sortBy).toBe("name");
    expect(result.current.sortOrder).toBe("asc");
    expect(result.current.filterType).toBe("all");
    expect(result.current.viewMode).toBe("list");
    expect(result.current.groupBy).toBe("none");
    expect(result.current.availableExtensions).toEqual([]);
    expect(result.current.showFavoritesOnly).toBe(false);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("should provide methods for interacting with music state", () => {
    const { result } = renderHook(() => useMusic(), {
      wrapper: MusicWrapper,
    });

    // Проверяем наличие всех методов
    expect(result.current.search).toBeDefined();
    expect(typeof result.current.search).toBe("function");

    expect(result.current.sort).toBeDefined();
    expect(typeof result.current.sort).toBe("function");

    expect(result.current.filter).toBeDefined();
    expect(typeof result.current.filter).toBe("function");

    expect(result.current.changeOrder).toBeDefined();
    expect(typeof result.current.changeOrder).toBe("function");

    expect(result.current.changeViewMode).toBeDefined();
    expect(typeof result.current.changeViewMode).toBe("function");

    expect(result.current.changeGroupBy).toBeDefined();
    expect(typeof result.current.changeGroupBy).toBe("function");

    expect(result.current.toggleFavorites).toBeDefined();
    expect(typeof result.current.toggleFavorites).toBe("function");

    expect(result.current.retry).toBeDefined();
    expect(typeof result.current.retry).toBe("function");
  });

  it("should call send with SEARCH event when search is called", () => {
    // Очищаем моковый объект перед тестом
    mockSend.mockClear();

    // Используем renderHook для тестирования хука useMusic
    const { result } = renderHook(() => useMusic(), {
      wrapper: MusicWrapper,
    });

    // Вызываем метод поиска
    act(() => {
      result.current.search("test query", { testContext: true });
    });

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "SEARCH",
      query: "test query",
      mediaContext: { testContext: true },
    });
  });

  it("should call send with SORT event when sort is called", () => {
    // Очищаем моковый объект перед тестом
    mockSend.mockClear();

    // Используем renderHook для тестирования хука useMusic
    const { result } = renderHook(() => useMusic(), {
      wrapper: MusicWrapper,
    });

    // Вызываем метод сортировки
    act(() => {
      result.current.sort("artist");
    });

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "SORT",
      sortBy: "artist",
    });
  });

  it("should call send with FILTER event when filter is called", () => {
    // Очищаем моковый объект перед тестом
    mockSend.mockClear();

    // Используем renderHook для тестирования хука useMusic
    const { result } = renderHook(() => useMusic(), {
      wrapper: MusicWrapper,
    });

    // Вызываем метод фильтрации
    act(() => {
      result.current.filter("mp3", { testContext: true });
    });

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "FILTER",
      filterType: "mp3",
      mediaContext: { testContext: true },
    });
  });

  it("should call send with CHANGE_ORDER event when changeOrder is called", () => {
    // Очищаем моковый объект перед тестом
    mockSend.mockClear();

    // Используем renderHook для тестирования хука useMusic
    const { result } = renderHook(() => useMusic(), {
      wrapper: MusicWrapper,
    });

    // Вызываем метод изменения порядка сортировки
    act(() => {
      result.current.changeOrder();
    });

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "CHANGE_ORDER",
    });
  });

  it("should call send with CHANGE_VIEW_MODE event when changeViewMode is called", () => {
    // Очищаем моковый объект перед тестом
    mockSend.mockClear();

    // Используем renderHook для тестирования хука useMusic
    const { result } = renderHook(() => useMusic(), {
      wrapper: MusicWrapper,
    });

    // Вызываем метод изменения режима отображения
    act(() => {
      result.current.changeViewMode("thumbnails");
    });

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "CHANGE_VIEW_MODE",
      mode: "thumbnails",
    });
  });

  it("should call send with CHANGE_GROUP_BY event when changeGroupBy is called", () => {
    // Очищаем моковый объект перед тестом
    mockSend.mockClear();

    // Используем renderHook для тестирования хука useMusic
    const { result } = renderHook(() => useMusic(), {
      wrapper: MusicWrapper,
    });

    // Вызываем метод изменения группировки
    act(() => {
      result.current.changeGroupBy("artist");
    });

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "CHANGE_GROUP_BY",
      groupBy: "artist",
    });
  });

  it("should call send with TOGGLE_FAVORITES event when toggleFavorites is called", () => {
    // Очищаем моковый объект перед тестом
    mockSend.mockClear();

    // Используем renderHook для тестирования хука useMusic
    const { result } = renderHook(() => useMusic(), {
      wrapper: MusicWrapper,
    });

    // Вызываем метод переключения избранного
    act(() => {
      result.current.toggleFavorites({ testContext: true });
    });

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "TOGGLE_FAVORITES",
      mediaContext: { testContext: true },
    });
  });

  it("should call send with RETRY event when retry is called", () => {
    // Очищаем моковый объект перед тестом
    mockSend.mockClear();

    // Используем renderHook для тестирования хука useMusic
    const { result } = renderHook(() => useMusic(), {
      wrapper: MusicWrapper,
    });

    // Вызываем метод повторной попытки
    act(() => {
      result.current.retry();
    });

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "RETRY",
    });
  });

  it("should update UI when state changes", () => {
    // Изменяем состояние в моке
    Object.assign(mockState.context, {
      searchQuery: "test query",
      sortBy: "artist",
      sortOrder: "desc",
      filterType: "mp3",
      viewMode: "thumbnails",
      groupBy: "artist",
      showFavoritesOnly: true,
    });

    // Рендерим компонент
    const TestComponent = () => {
      const context = useMusic();
      return (
        <div>
          <span data-testid="search-query">{context.searchQuery}</span>
          <span data-testid="sort-by">{context.sortBy}</span>
          <span data-testid="sort-order">{context.sortOrder}</span>
          <span data-testid="filter-type">{context.filterType}</span>
          <span data-testid="view-mode">{context.viewMode}</span>
          <span data-testid="group-by">{context.groupBy}</span>
          <span data-testid="show-favorites">
            {context.showFavoritesOnly.toString()}
          </span>
        </div>
      );
    };

    render(
      <MusicProvider>
        <TestComponent />
      </MusicProvider>,
    );

    // Проверяем, что UI отображает обновленные значения
    expect(screen.getByTestId("search-query").textContent).toBe("test query");
    expect(screen.getByTestId("sort-by").textContent).toBe("artist");
    expect(screen.getByTestId("sort-order").textContent).toBe("desc");
    expect(screen.getByTestId("filter-type").textContent).toBe("mp3");
    expect(screen.getByTestId("view-mode").textContent).toBe("thumbnails");
    expect(screen.getByTestId("group-by").textContent).toBe("artist");
    expect(screen.getByTestId("show-favorites").textContent).toBe("true");
  });

  it("should throw error when useMusic is used outside of MusicProvider", () => {
    // Проверяем, что хук выбрасывает ошибку, если используется вне провайдера
    const consoleError = console.error;
    console.error = vi.fn(); // Подавляем ошибки в консоли во время теста

    expect(() => renderHook(() => useMusic())).toThrow(
      "useMusic must be used within a MusicProvider",
    );

    console.error = consoleError; // Восстанавливаем console.error
  });
});
