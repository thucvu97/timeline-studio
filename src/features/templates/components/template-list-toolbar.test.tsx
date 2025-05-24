import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TemplateListToolbar } from "./template-list-toolbar";

// Мокаем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "common.search": "Search",
        "browser.media.favorites": "Favorites",
        "browser.toolbar.zoomOut": "Zoom Out",
        "browser.toolbar.zoomIn": "Zoom In",
      };
      return translations[key] || key;
    },
    i18n: {
      language: "en",
      changeLanguage: vi.fn(),
    },
  }),
}));

// Мокаем Lucide иконки
vi.mock("lucide-react", () => ({
  Star: (props: any) => (
    <div data-testid="star-icon" {...props}>
      Star
    </div>
  ),
  ZoomIn: (props: any) => (
    <div data-testid="zoom-in-icon" {...props}>
      Zoom In
    </div>
  ),
  ZoomOut: (props: any) => (
    <div data-testid="zoom-out-icon" {...props}>
      Zoom Out
    </div>
  ),
}));

describe("TemplateListToolbar", () => {
  // Создаем моки для пропсов
  const mockProps = {
    searchQuery: "test",
    setSearchQuery: vi.fn(),
    canDecreaseSize: true,
    canIncreaseSize: true,
    handleDecreaseSize: vi.fn(),
    handleIncreaseSize: vi.fn(),
    showFavoritesOnly: false,
    onToggleFavorites: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the toolbar correctly", () => {
    render(<TemplateListToolbar {...mockProps} />);

    // Проверяем, что поле поиска отрендерилось
    const searchInput = screen.getByPlaceholderText("Search");
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveValue("test");

    // Проверяем, что кнопки отрендерились
    expect(screen.getByTestId("star-icon")).toBeInTheDocument();
    expect(screen.getByTestId("zoom-in-icon")).toBeInTheDocument();
    expect(screen.getByTestId("zoom-out-icon")).toBeInTheDocument();
  });

  it("should call setSearchQuery when search input changes", () => {
    render(<TemplateListToolbar {...mockProps} />);

    // Находим поле поиска и вводим текст
    const searchInput = screen.getByPlaceholderText("Search");
    fireEvent.change(searchInput, { target: { value: "new search" } });

    // Проверяем, что setSearchQuery был вызван с новым значением
    expect(mockProps.setSearchQuery).toHaveBeenCalledTimes(1);
    expect(mockProps.setSearchQuery).toHaveBeenCalledWith("new search");
  });

  it("should call handleIncreaseSize when zoom in button is clicked", () => {
    render(<TemplateListToolbar {...mockProps} />);

    // Находим кнопку увеличения и кликаем по ней
    const zoomInButton = screen.getByTestId("zoom-in-icon").closest("button");
    if (zoomInButton) {
      fireEvent.click(zoomInButton);
      expect(mockProps.handleIncreaseSize).toHaveBeenCalledTimes(1);
    }
  });

  it("should call handleDecreaseSize when zoom out button is clicked", () => {
    render(<TemplateListToolbar {...mockProps} />);

    // Находим кнопку уменьшения и кликаем по ней
    const zoomOutButton = screen.getByTestId("zoom-out-icon").closest("button");
    if (zoomOutButton) {
      fireEvent.click(zoomOutButton);
      expect(mockProps.handleDecreaseSize).toHaveBeenCalledTimes(1);
    }
  });

  it("should call onToggleFavorites when favorites button is clicked", () => {
    render(<TemplateListToolbar {...mockProps} />);

    // Находим кнопку избранного и кликаем по ней
    const favoriteButton = screen.getByTestId("star-icon").closest("button");
    if (favoriteButton) {
      fireEvent.click(favoriteButton);
      expect(mockProps.onToggleFavorites).toHaveBeenCalledTimes(1);
    }
  });

  it("should disable zoom buttons when they cannot be used", () => {
    // Создаем пропсы с отключенными кнопками
    const disabledProps = {
      ...mockProps,
      canDecreaseSize: false,
      canIncreaseSize: false,
    };

    render(<TemplateListToolbar {...disabledProps} />);

    // Находим кнопки и проверяем, что они отключены
    const zoomInButton = screen.getByTestId("zoom-in-icon").closest("button");
    const zoomOutButton = screen.getByTestId("zoom-out-icon").closest("button");

    if (zoomInButton && zoomOutButton) {
      expect(zoomInButton).toBeDisabled();
      expect(zoomOutButton).toBeDisabled();
    }
  });

  it("should highlight favorites button when showFavoritesOnly is true", () => {
    // Создаем пропсы с включенным фильтром избранного
    const favoritesProps = {
      ...mockProps,
      showFavoritesOnly: true,
    };

    render(<TemplateListToolbar {...favoritesProps} />);

    // Находим иконку избранного и проверяем, что она имеет класс заполнения
    const starIcon = screen.getByTestId("star-icon");
    expect(starIcon).toHaveClass("fill-current");
  });
});
