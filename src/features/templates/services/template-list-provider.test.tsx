import { act, render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  TemplateListProvider,
  useTemplateList,
} from "./template-list-provider";

// Создаем моковый объект для send
const mockSend = vi.fn();

// Создаем моковый объект для состояния
const mockState = {
  context: {
    previewSize: 125,
    canIncreaseSize: true,
    canDecreaseSize: false,
    searchQuery: "",
    showFavoritesOnly: false,
  },
  matches: (state: string) => state === "idle",
  status: "active",
  value: "idle",
};

// Мокаем useMachine из @xstate/react
vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [mockState, mockSend]),
}));

// Мокаем templateListMachine
vi.mock("./template-list-machine", () => ({
  templateListMachine: {
    createMachine: vi.fn(),
  },
  getSavedTemplateSize: vi.fn().mockReturnValue(125),
  getSavedFavoritesState: vi.fn().mockReturnValue(false),
  saveTemplateSize: vi.fn(),
  saveFavoritesState: vi.fn(),
  DEFAULT_TEMPLATE_PREVIEW_SIZE: 125,
  MIN_TEMPLATE_PREVIEW_SIZE: 125,
  MAX_TEMPLATE_PREVIEW_SIZE: 400,
}));

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

// Компонент-обертка для тестирования хука useTemplateList
function TemplateListWrapper({ children }: { children: React.ReactNode }) {
  return <TemplateListProvider>{children}</TemplateListProvider>;
}

describe("TemplateListProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render children", () => {
    render(
      <TemplateListProvider>
        <div data-testid="test-child">Test Child</div>
      </TemplateListProvider>,
    );

    expect(screen.getByTestId("test-child")).toBeInTheDocument();
  });

  it("should provide context values", () => {
    const TestComponent = () => {
      const context = useTemplateList();
      return (
        <div>
          <span data-testid="preview-size">{context.previewSize}</span>
          <span data-testid="can-increase">
            {context.canIncreaseSize.toString()}
          </span>
          <span data-testid="can-decrease">
            {context.canDecreaseSize.toString()}
          </span>
          <span data-testid="search-query">{context.searchQuery}</span>
          <span data-testid="show-favorites">
            {context.showFavoritesOnly.toString()}
          </span>
        </div>
      );
    };

    render(
      <TemplateListProvider>
        <TestComponent />
      </TemplateListProvider>,
    );

    expect(screen.getByTestId("preview-size").textContent).toBe("125");
    expect(screen.getByTestId("can-increase").textContent).toBe("true");
    expect(screen.getByTestId("can-decrease").textContent).toBe("false");
    expect(screen.getByTestId("search-query").textContent).toBe("");
    expect(screen.getByTestId("show-favorites").textContent).toBe("false");
  });

  it("should provide all required methods", () => {
    // Используем renderHook для тестирования хука useTemplateList
    const { result } = renderHook(() => useTemplateList(), {
      wrapper: TemplateListWrapper,
    });

    // Проверяем, что все методы существуют
    expect(result.current.increaseSize).toBeDefined();
    expect(typeof result.current.increaseSize).toBe("function");

    expect(result.current.decreaseSize).toBeDefined();
    expect(typeof result.current.decreaseSize).toBe("function");

    expect(result.current.setPreviewSize).toBeDefined();
    expect(typeof result.current.setPreviewSize).toBe("function");

    expect(result.current.setSearchQuery).toBeDefined();
    expect(typeof result.current.setSearchQuery).toBe("function");

    expect(result.current.toggleFavorites).toBeDefined();
    expect(typeof result.current.toggleFavorites).toBe("function");

    expect(result.current.setShowFavoritesOnly).toBeDefined();
    expect(typeof result.current.setShowFavoritesOnly).toBe("function");
  });

  it("should throw error when useTemplateList is used outside of TemplateListProvider", () => {
    // Проверяем, что хук выбрасывает ошибку, если используется вне провайдера
    const consoleError = console.error;
    console.error = vi.fn(); // Подавляем ошибки в консоли во время теста

    expect(() => renderHook(() => useTemplateList())).toThrow(
      "useTemplateList must be used within a TemplateListProvider",
    );

    console.error = consoleError; // Восстанавливаем console.error
  });

  it("should call send with INCREASE_PREVIEW_SIZE event when increaseSize is called", () => {
    // Очищаем моковый объект перед тестом
    mockSend.mockClear();

    // Используем renderHook для тестирования хука useTemplateList
    const { result } = renderHook(() => useTemplateList(), {
      wrapper: TemplateListWrapper,
    });

    // Вызываем метод увеличения размера превью
    act(() => {
      result.current.increaseSize();
    });

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "INCREASE_PREVIEW_SIZE",
    });
  });

  it("should call send with DECREASE_PREVIEW_SIZE event when decreaseSize is called", () => {
    // Очищаем моковый объект перед тестом
    mockSend.mockClear();

    // Используем renderHook для тестирования хука useTemplateList
    const { result } = renderHook(() => useTemplateList(), {
      wrapper: TemplateListWrapper,
    });

    // Вызываем метод уменьшения размера превью
    act(() => {
      result.current.decreaseSize();
    });

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "DECREASE_PREVIEW_SIZE",
    });
  });

  it("should call send with SET_PREVIEW_SIZE event when setPreviewSize is called", () => {
    // Очищаем моковый объект перед тестом
    mockSend.mockClear();

    // Используем renderHook для тестирования хука useTemplateList
    const { result } = renderHook(() => useTemplateList(), {
      wrapper: TemplateListWrapper,
    });

    // Вызываем метод установки размера превью
    act(() => {
      result.current.setPreviewSize(200);
    });

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "SET_PREVIEW_SIZE",
      size: 200,
    });
  });

  it("should call send with SET_SEARCH_QUERY event when setSearchQuery is called", () => {
    // Очищаем моковый объект перед тестом
    mockSend.mockClear();

    // Используем renderHook для тестирования хука useTemplateList
    const { result } = renderHook(() => useTemplateList(), {
      wrapper: TemplateListWrapper,
    });

    // Вызываем метод установки поискового запроса
    act(() => {
      result.current.setSearchQuery("test query");
    });

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "SET_SEARCH_QUERY",
      query: "test query",
    });
  });

  it("should call send with TOGGLE_FAVORITES event when toggleFavorites is called", () => {
    // Очищаем моковый объект перед тестом
    mockSend.mockClear();

    // Используем renderHook для тестирования хука useTemplateList
    const { result } = renderHook(() => useTemplateList(), {
      wrapper: TemplateListWrapper,
    });

    // Вызываем метод переключения избранного
    act(() => {
      result.current.toggleFavorites();
    });

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "TOGGLE_FAVORITES",
    });
  });

  it("should call send with SET_SHOW_FAVORITES_ONLY event when setShowFavoritesOnly is called", () => {
    // Очищаем моковый объект перед тестом
    mockSend.mockClear();

    // Используем renderHook для тестирования хука useTemplateList
    const { result } = renderHook(() => useTemplateList(), {
      wrapper: TemplateListWrapper,
    });

    // Вызываем метод установки отображения только избранных
    act(() => {
      result.current.setShowFavoritesOnly(true);
    });

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "SET_SHOW_FAVORITES_ONLY",
      value: true,
    });
  });

  it("should update UI when state changes", () => {
    // Изменяем состояние в моке
    Object.assign(mockState.context, {
      previewSize: 200,
      canIncreaseSize: true,
      canDecreaseSize: true,
      searchQuery: "test query",
      showFavoritesOnly: true,
    });

    // Рендерим компонент
    const TestComponent = () => {
      const context = useTemplateList();
      return (
        <div>
          <span data-testid="preview-size">{context.previewSize}</span>
          <span data-testid="search-query">{context.searchQuery}</span>
          <span data-testid="show-favorites">
            {context.showFavoritesOnly.toString()}
          </span>
        </div>
      );
    };

    render(
      <TemplateListProvider>
        <TestComponent />
      </TemplateListProvider>,
    );

    // Проверяем, что UI отображает обновленные значения
    expect(screen.getByTestId("preview-size").textContent).toBe("200");
    expect(screen.getByTestId("search-query").textContent).toBe("test query");
    expect(screen.getByTestId("show-favorites").textContent).toBe("true");
  });
});
