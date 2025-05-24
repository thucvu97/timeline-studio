import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransitionsList } from "./transition-list";

// Мокируем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Возвращаем ключ как значение для простоты тестирования
      return key;
    },
  }),
}));

// Мокируем useMedia
vi.mock("@/features/browser/media", () => ({
  useMedia: () => ({
    isItemFavorite: vi.fn().mockImplementation((file, type) => {
      // Для тестирования считаем, что файл с id "fade" в избранном
      return file.id === "fade";
    }),
    toggleFavorite: vi.fn(),
  }),
}));

// Мокируем usePreviewSize
const mockHandleIncreaseSize = vi.fn();
const mockHandleDecreaseSize = vi.fn();

vi.mock("@/features/browser/components/preview/preview-size-provider", () => ({
  usePreviewSize: () => ({
    previewSize: 100,
    increaseSize: mockHandleIncreaseSize,
    decreaseSize: mockHandleDecreaseSize,
    canIncreaseSize: true,
    canDecreaseSize: true,
  }),
}));

// Мокируем TransitionPreview
vi.mock("./transition-preview", () => ({
  TransitionPreview: ({
    sourceVideo,
    targetVideo,
    transitionType,
    onClick,
    size,
  }: any) => (
    <div
      data-testid={`transition-preview-${transitionType}`}
      onClick={onClick}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      Transition Preview: {transitionType}
    </div>
  ),
}));

// Мокируем компоненты UI
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, className, disabled, ...props }: any) => (
    <button
      onClick={onClick}
      className={className}
      disabled={disabled}
      data-testid={props["data-testid"] ?? "button"}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ value, onChange, placeholder, className, ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      data-testid="search-input"
      {...props}
    />
  ),
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipProvider: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: any) => <>{children}</>,
}));

// Мокируем lucide-react
vi.mock("lucide-react", () => ({
  Star: ({ size, className }: any) => (
    <div data-testid="star-icon" className={className}>
      Star Icon
    </div>
  ),
  ZoomIn: ({ size }: any) => <div data-testid="zoom-in-icon">Zoom In</div>,
  ZoomOut: ({ size }: any) => <div data-testid="zoom-out-icon">Zoom Out</div>,
}));

// Мокируем transitions
vi.mock("./transitions", () => ({
  transitions: [
    {
      id: "fade",
      type: "fade",
      labels: {
        ru: "Затухание",
        en: "Fade",
      },
    },
    {
      id: "zoom",
      type: "zoom",
      labels: {
        ru: "Зум",
        en: "Zoom",
      },
    },
    {
      id: "slide",
      type: "slide",
      labels: {
        ru: "Слайд",
        en: "Slide",
      },
    },
  ],
}));

describe("TransitionsList", () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with all elements", () => {
    render(<TransitionsList onSelect={mockOnSelect} />);

    // Проверяем, что поле поиска отображается
    expect(screen.getByTestId("search-input")).toBeInTheDocument();

    // Проверяем, что кнопки управления отображаются
    expect(screen.getByTestId("star-icon")).toBeInTheDocument();
    expect(screen.getByTestId("zoom-in-icon")).toBeInTheDocument();
    expect(screen.getByTestId("zoom-out-icon")).toBeInTheDocument();

    // Проверяем, что все переходы отображаются
    expect(screen.getByTestId("transition-preview-fade")).toBeInTheDocument();
    expect(screen.getByTestId("transition-preview-zoom")).toBeInTheDocument();
    expect(screen.getByTestId("transition-preview-slide")).toBeInTheDocument();
  });

  it("filters transitions by search query", () => {
    render(<TransitionsList onSelect={mockOnSelect} />);

    // Вводим поисковый запрос
    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "zoom" } });

    // Проверяем, что отображается только переход "zoom"
    expect(screen.getByTestId("transition-preview-zoom")).toBeInTheDocument();
    expect(
      screen.queryByTestId("transition-preview-fade"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("transition-preview-slide"),
    ).not.toBeInTheDocument();
  });

  it("toggles favorites filter", () => {
    render(<TransitionsList onSelect={mockOnSelect} />);

    // Проверяем, что изначально отображаются все переходы
    expect(screen.getByTestId("transition-preview-fade")).toBeInTheDocument();
    expect(screen.getByTestId("transition-preview-zoom")).toBeInTheDocument();
    expect(screen.getByTestId("transition-preview-slide")).toBeInTheDocument();

    // Нажимаем на кнопку избранного
    const favoriteButton = screen.getByTestId("star-icon").closest("button");
    fireEvent.click(favoriteButton!);

    // Проверяем, что отображается только переход "fade" (он в избранном)
    expect(screen.getByTestId("transition-preview-fade")).toBeInTheDocument();
    expect(
      screen.queryByTestId("transition-preview-zoom"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("transition-preview-slide"),
    ).not.toBeInTheDocument();
  });

  it("calls increaseSize when zoom in button is clicked", () => {
    render(<TransitionsList onSelect={mockOnSelect} />);

    // Находим кнопку увеличения размера и кликаем по ней
    const zoomInButton = screen.getByTestId("zoom-in-icon").closest("button");
    fireEvent.click(zoomInButton!);

    // Проверяем, что increaseSize был вызван
    expect(mockHandleIncreaseSize).toHaveBeenCalledTimes(1);
  });

  it("calls decreaseSize when zoom out button is clicked", () => {
    render(<TransitionsList onSelect={mockOnSelect} />);

    // Находим кнопку уменьшения размера и кликаем по ней
    const zoomOutButton = screen.getByTestId("zoom-out-icon").closest("button");
    fireEvent.click(zoomOutButton!);

    // Проверяем, что decreaseSize был вызван
    expect(mockHandleDecreaseSize).toHaveBeenCalledTimes(1);
  });

  it("calls onSelect when transition is clicked", () => {
    render(<TransitionsList onSelect={mockOnSelect} />);

    // Находим переход и кликаем по нему
    const transitionPreview = screen.getByTestId("transition-preview-fade");
    fireEvent.click(transitionPreview);

    // Проверяем, что onSelect был вызван с правильными параметрами
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith("fade");
  });

  it("shows 'not found' message when no transitions match search", () => {
    render(<TransitionsList onSelect={mockOnSelect} />);

    // Вводим поисковый запрос, который не соответствует ни одному переходу
    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    // Проверяем, что отображается сообщение "not found"
    expect(
      screen.getByText("browser.tabs.transitions common.notFound"),
    ).toBeInTheDocument();
  });
});
