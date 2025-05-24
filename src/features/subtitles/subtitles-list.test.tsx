import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SubtitlesList } from "./subtitles-list";

// Мокируем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      // Возвращаем ключ как значение для простоты тестирования
      if (options?.defaultValue) {
        return options.defaultValue;
      }
      return key;
    },
  }),
}));

// Мокируем useMedia
vi.mock("@/features/browser/media", () => ({
  useMedia: () => ({
    isItemFavorite: vi.fn().mockImplementation((file, type) => {
      // Для тестирования считаем, что файл с id "default" в избранном
      return file.id === "default";
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

// Мокируем SubtitlesPreview
vi.mock("./subtitles-preview", () => ({
  SubtitlesPreview: ({ style, onClick, size }: any) => (
    <div
      data-testid={`subtitle-preview-${style.id}`}
      onClick={onClick}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      Subtitle Preview: {style.name}
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

// Мокируем cn
vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

// Мокируем SUBTITLE_CATEGORIES
vi.mock("./subtitles", () => ({
  SUBTITLE_CATEGORIES: [
    {
      id: "basic",
      name: "Basic",
      styles: [
        {
          id: "default",
          name: "Default",
          fontFamily: "Arial",
          fontSize: 24,
          fontWeight: "normal",
          fontStyle: "normal",
          textAlign: "center",
          color: "#FFFFFF",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          textShadow: "2px 2px 2px rgba(0, 0, 0, 0.8)",
          padding: 8,
          borderRadius: 4,
          outline: "none",
        },
        {
          id: "bold",
          name: "Bold",
          fontFamily: "Arial",
          fontSize: 24,
          fontWeight: "bold",
          fontStyle: "normal",
          textAlign: "center",
          color: "#FFFFFF",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          textShadow: "2px 2px 2px rgba(0, 0, 0, 0.8)",
          padding: 8,
          borderRadius: 4,
          outline: "none",
        },
      ],
    },
    {
      id: "fancy",
      name: "Fancy",
      styles: [
        {
          id: "fancy1",
          name: "Fancy 1",
          fontFamily: "Times New Roman",
          fontSize: 28,
          fontWeight: "normal",
          fontStyle: "italic",
          textAlign: "center",
          color: "#FFFF00",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          textShadow: "2px 2px 4px rgba(0, 0, 0, 1)",
          padding: 10,
          borderRadius: 8,
          outline: "2px solid #FFFF00",
        },
      ],
    },
  ],
  SUBTITLE_PREVIEW_TEXT: "Sample Text",
  subtitleStyleToCss: (style: any) => ({
    color: style.color,
    backgroundColor: style.backgroundColor,
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    textAlign: style.textAlign,
    textShadow: style.textShadow,
    padding: `${style.padding}px`,
    borderRadius: `${style.borderRadius}px`,
    outline: style.outline,
  }),
}));

describe("SubtitlesList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Мокируем window.alert
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("renders correctly with all elements", () => {
    render(<SubtitlesList />);

    // Проверяем, что поле поиска отображается
    expect(screen.getByTestId("search-input")).toBeInTheDocument();

    // Проверяем, что кнопки управления отображаются
    expect(screen.getByTestId("star-icon")).toBeInTheDocument();
    expect(screen.getByTestId("zoom-in-icon")).toBeInTheDocument();
    expect(screen.getByTestId("zoom-out-icon")).toBeInTheDocument();

    // Проверяем, что все стили субтитров отображаются
    expect(screen.getByTestId("subtitle-preview-default")).toBeInTheDocument();
    expect(screen.getByTestId("subtitle-preview-bold")).toBeInTheDocument();
    expect(screen.getByTestId("subtitle-preview-fancy1")).toBeInTheDocument();
  });

  it("filters subtitle styles by search query", () => {
    render(<SubtitlesList />);

    // Вводим поисковый запрос
    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "fancy" } });

    // Проверяем, что отображается только стиль "Fancy 1"
    expect(screen.getByTestId("subtitle-preview-fancy1")).toBeInTheDocument();
    expect(
      screen.queryByTestId("subtitle-preview-default"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("subtitle-preview-bold"),
    ).not.toBeInTheDocument();
  });

  it("toggles favorites filter", () => {
    render(<SubtitlesList />);

    // Проверяем, что изначально отображаются все стили
    expect(screen.getByTestId("subtitle-preview-default")).toBeInTheDocument();
    expect(screen.getByTestId("subtitle-preview-bold")).toBeInTheDocument();
    expect(screen.getByTestId("subtitle-preview-fancy1")).toBeInTheDocument();

    // Нажимаем на кнопку избранного
    const favoriteButton = screen.getByTestId("star-icon").closest("button");
    fireEvent.click(favoriteButton!);

    // Проверяем, что отображается только стиль "Default" (он в избранном)
    expect(screen.getByTestId("subtitle-preview-default")).toBeInTheDocument();
    expect(
      screen.queryByTestId("subtitle-preview-bold"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("subtitle-preview-fancy1"),
    ).not.toBeInTheDocument();
  });

  it("calls increaseSize when zoom in button is clicked", () => {
    render(<SubtitlesList />);

    // Находим кнопку увеличения размера и кликаем по ней
    const zoomInButton = screen.getByTestId("zoom-in-icon").closest("button");
    fireEvent.click(zoomInButton!);

    // Проверяем, что increaseSize был вызван
    expect(mockHandleIncreaseSize).toHaveBeenCalledTimes(1);
  });

  it("calls decreaseSize when zoom out button is clicked", () => {
    render(<SubtitlesList />);

    // Находим кнопку уменьшения размера и кликаем по ней
    const zoomOutButton = screen.getByTestId("zoom-out-icon").closest("button");
    fireEvent.click(zoomOutButton!);

    // Проверяем, что decreaseSize был вызван
    expect(mockHandleDecreaseSize).toHaveBeenCalledTimes(1);
  });

  it("shows alert when subtitle style is clicked", () => {
    // Мокируем window.alert
    const alertSpy = vi.spyOn(window, "alert");

    render(<SubtitlesList />);

    // Находим стиль и кликаем по нему
    const subtitlePreview = screen.getByTestId("subtitle-preview-default");
    fireEvent.click(subtitlePreview);

    // Проверяем, что alert был вызван с правильными параметрами
    expect(alertSpy).toHaveBeenCalledWith(
      'Стиль субтитров "Default" добавлен на таймлайн',
    );
  });

  it("shows 'not found' message when no styles match search", () => {
    render(<SubtitlesList />);

    // Вводим поисковый запрос, который не соответствует ни одному стилю
    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    // Проверяем, что отображается сообщение "not found"
    expect(
      screen.getByText("browser.tabs.subtitles common.notFound"),
    ).toBeInTheDocument();
  });
});
