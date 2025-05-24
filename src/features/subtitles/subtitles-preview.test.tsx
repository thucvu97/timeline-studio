import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SubtitlesPreview } from "./subtitles-preview";

// Мокируем FavoriteButton и AddMediaButton
vi.mock("@/features/browser/components/layout/favorite-button", () => ({
  FavoriteButton: ({ file, size, type }: any) => (
    <div data-testid="favorite-button">
      Favorite Button for {file.name} ({type})
    </div>
  ),
}));

vi.mock("@/features/browser/components/layout/add-media-button", () => ({
  AddMediaButton: ({ file, onAddMedia, onRemoveMedia, isAdded, size }: any) => (
    <div>
      {isAdded ? (
        <button
          data-testid="remove-media-button"
          onClick={(e) => onRemoveMedia(e)}
        >
          Remove {file.name}
        </button>
      ) : (
        <button data-testid="add-media-button" onClick={(e) => onAddMedia(e)}>
          Add {file.name}
        </button>
      )}
    </div>
  ),
}));

// Мокируем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Возвращаем ключ как значение для простоты тестирования
      return key;
    },
  }),
}));

// Мокируем SUBTITLE_PREVIEW_TEXT
vi.mock("./subtitles", () => ({
  SUBTITLE_PREVIEW_TEXT: "Пример текста субтитров",
  subtitleStyleToCss: (style: any) => ({
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    textAlign: style.textAlign,
    color: style.color,
    backgroundColor: style.backgroundColor,
    textShadow: style.textShadow,
    padding: `${style.padding}px`,
    borderRadius: `${style.borderRadius}px`,
    outline: style.outline,
  }),
}));

// Мокируем useResources
const mockAddSubtitle = vi.fn();
const mockRemoveResource = vi.fn();
const mockIsSubtitleAdded = vi.fn().mockReturnValue(false);

vi.mock("@/features/resources", () => ({
  useResources: () => ({
    addSubtitle: mockAddSubtitle,
    removeResource: mockRemoveResource,
    isSubtitleAdded: mockIsSubtitleAdded,
    subtitleResources: [
      { id: "subtitle-resource-1", resourceId: "default", type: "subtitle" },
    ],
  }),
}));

describe("SubtitlesPreview", () => {
  const mockStyle = {
    id: "default",
    name: "Default Style",
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
  };

  const mockProps = {
    style: mockStyle,
    onClick: vi.fn(),
    size: 100,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Сбрасываем состояние isSubtitleAdded перед каждым тестом
    mockIsSubtitleAdded.mockReturnValue(false);
  });

  it("renders correctly with all elements", () => {
    render(<SubtitlesPreview {...mockProps} />);

    // Проверяем, что превью субтитров отрендерилось
    expect(screen.getByText("Пример текста субтитров")).toBeInTheDocument();

    // Проверяем, что название стиля отображается
    expect(screen.getByText("Default Style")).toBeInTheDocument();

    // Проверяем, что кнопка добавления в избранное отображается
    expect(screen.getByTestId("favorite-button")).toBeInTheDocument();

    // Проверяем, что кнопка добавления стиля отображается
    expect(screen.getByTestId("add-media-button")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    render(<SubtitlesPreview {...mockProps} />);

    // Находим контейнер и кликаем по нему
    const container = screen
      .getByText("Пример текста субтитров")
      .closest(".group");
    fireEvent.click(container!);

    expect(mockProps.onClick).toHaveBeenCalledTimes(1);
  });

  it("calls addSubtitle when add button is clicked", () => {
    render(<SubtitlesPreview {...mockProps} />);

    const addButton = screen.getByTestId("add-media-button");
    fireEvent.click(addButton);

    expect(mockAddSubtitle).toHaveBeenCalledTimes(1);
    // Проверяем, что addSubtitle был вызван с правильным стилем
    expect(mockAddSubtitle).toHaveBeenCalledWith(mockStyle);
  });

  it("shows remove button when subtitle style is already added", () => {
    // Меняем возвращаемое значение мока isSubtitleAdded
    mockIsSubtitleAdded.mockReturnValue(true);

    render(<SubtitlesPreview {...mockProps} />);

    // Проверяем, что кнопка удаления отображается
    expect(screen.getByTestId("remove-media-button")).toBeInTheDocument();
  });

  it("calls removeResource when remove button is clicked", () => {
    // Меняем возвращаемое значение мока isSubtitleAdded
    mockIsSubtitleAdded.mockReturnValue(true);

    render(<SubtitlesPreview {...mockProps} />);

    const removeButton = screen.getByTestId("remove-media-button");
    fireEvent.click(removeButton);

    // Проверяем, что removeResource был вызван
    expect(mockRemoveResource).toHaveBeenCalledTimes(1);
  });

  it("has correct size based on props", () => {
    const customSize = 200;
    render(<SubtitlesPreview {...mockProps} size={customSize} />);

    const container = screen
      .getByText("Пример текста субтитров")
      .closest(".group");
    expect(container).toHaveStyle(`width: ${customSize}px`);
    expect(container).toHaveStyle(`height: ${customSize}px`);
  });

  it("applies correct styles to subtitle preview", () => {
    const customStyle = {
      ...mockStyle,
      color: "#FF0000",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      fontFamily: "Times New Roman",
      fontSize: 32,
      fontWeight: "bold",
      textAlign: "left",
    };

    render(<SubtitlesPreview {...mockProps} style={customStyle} />);

    const subtitleElement = screen.getByText("Пример текста субтитров");

    // Проверяем, что стили применены правильно
    expect(subtitleElement).toHaveStyle("color: #FF0000");
    expect(subtitleElement).toHaveStyle("background-color: rgba(0, 0, 0, 0.8)");
    expect(subtitleElement).toHaveStyle("font-family: Times New Roman");
    expect(subtitleElement).toHaveStyle("font-weight: bold");
  });
});
