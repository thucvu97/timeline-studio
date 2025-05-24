import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EffectList } from "./effect-list";

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
      // Для тестирования считаем, что файл с id "brightness" в избранном
      return file.id === "brightness";
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

// Мокируем EffectPreview
vi.mock("./effect-preview", () => ({
  EffectPreview: ({ effectType, onClick, size }: any) => (
    <div
      data-testid={`effect-preview-${effectType}`}
      onClick={onClick}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      Effect Preview: {effectType}
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

// Мокируем effects
vi.mock(".", () => ({
  effects: [
    {
      id: "brightness",
      name: "Яркость",
      type: "brightness",
      duration: 0,
      ffmpegCommand: () => "eq=brightness=1.2",
      params: { intensity: 1.2 },
      previewPath: "/effects/brightness-preview.mp4",
      labels: { ru: "Яркость", en: "Brightness" },
    },
    {
      id: "contrast",
      name: "Контраст",
      type: "contrast",
      duration: 0,
      ffmpegCommand: () => "eq=contrast=1.5",
      params: { intensity: 1.5 },
      previewPath: "/effects/contrast-preview.mp4",
      labels: { ru: "Контраст", en: "Contrast" },
    },
    {
      id: "sepia",
      name: "Сепия",
      type: "sepia",
      duration: 0,
      ffmpegCommand: () => "colorize=color=brown:blend=0.3",
      params: { intensity: 0.3 },
      previewPath: "/effects/sepia-preview.mp4",
      labels: { ru: "Сепия", en: "Sepia" },
    },
  ],
}));

describe("EffectList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with all elements", () => {
    render(<EffectList />);

    // Проверяем, что поле поиска отображается
    expect(screen.getByTestId("search-input")).toBeInTheDocument();

    // Проверяем, что кнопки управления отображаются
    expect(screen.getByTestId("star-icon")).toBeInTheDocument();
    expect(screen.getByTestId("zoom-in-icon")).toBeInTheDocument();
    expect(screen.getByTestId("zoom-out-icon")).toBeInTheDocument();

    // Проверяем, что все эффекты отображаются
    expect(screen.getByTestId("effect-preview-brightness")).toBeInTheDocument();
    expect(screen.getByTestId("effect-preview-contrast")).toBeInTheDocument();
    expect(screen.getByTestId("effect-preview-sepia")).toBeInTheDocument();
  });

  it("filters effects by search query", () => {
    render(<EffectList />);

    // Вводим поисковый запрос
    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "contrast" } });

    // Проверяем, что отображается только эффект "contrast"
    expect(screen.getByTestId("effect-preview-contrast")).toBeInTheDocument();
    expect(
      screen.queryByTestId("effect-preview-brightness"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("effect-preview-sepia"),
    ).not.toBeInTheDocument();
  });

  it("toggles favorites filter", () => {
    render(<EffectList />);

    // Проверяем, что изначально отображаются все эффекты
    expect(screen.getByTestId("effect-preview-brightness")).toBeInTheDocument();
    expect(screen.getByTestId("effect-preview-contrast")).toBeInTheDocument();
    expect(screen.getByTestId("effect-preview-sepia")).toBeInTheDocument();

    // Нажимаем на кнопку избранного
    const favoriteButton = screen.getByTestId("star-icon").closest("button");
    fireEvent.click(favoriteButton!);

    // Проверяем, что отображается только эффект "brightness" (он в избранном)
    expect(screen.getByTestId("effect-preview-brightness")).toBeInTheDocument();
    expect(
      screen.queryByTestId("effect-preview-contrast"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("effect-preview-sepia"),
    ).not.toBeInTheDocument();
  });

  it("calls increaseSize when zoom in button is clicked", () => {
    render(<EffectList />);

    // Находим кнопку увеличения размера и кликаем по ней
    const zoomInButton = screen.getByTestId("zoom-in-icon").closest("button");
    fireEvent.click(zoomInButton!);

    // Проверяем, что increaseSize был вызван
    expect(mockHandleIncreaseSize).toHaveBeenCalledTimes(1);
  });

  it("calls decreaseSize when zoom out button is clicked", () => {
    render(<EffectList />);

    // Находим кнопку уменьшения размера и кликаем по ней
    const zoomOutButton = screen.getByTestId("zoom-out-icon").closest("button");
    fireEvent.click(zoomOutButton!);

    // Проверяем, что decreaseSize был вызван
    expect(mockHandleDecreaseSize).toHaveBeenCalledTimes(1);
  });

  it("logs effect name when effect is clicked", () => {
    // Мокируем console.log
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    render(<EffectList />);

    // Находим эффект и кликаем по нему
    const effectPreview = screen.getByTestId("effect-preview-brightness");
    fireEvent.click(effectPreview);

    // Проверяем, что console.log был вызван с правильными параметрами
    expect(consoleSpy).toHaveBeenCalledWith("Applying effect:", "Яркость");

    // Восстанавливаем console.log
    consoleSpy.mockRestore();
  });

  it("shows 'not found' message when no effects match search", () => {
    render(<EffectList />);

    // Вводим поисковый запрос, который не соответствует ни одному эффекту
    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    // Проверяем, что отображается сообщение "not found"
    expect(
      screen.getByText("browser.tabs.effects common.notFound"),
    ).toBeInTheDocument();
  });
});
