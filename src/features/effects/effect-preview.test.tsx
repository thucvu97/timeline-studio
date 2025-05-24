import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EffectPreview } from "./effect-preview";

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

// Мокируем useResources
const mockAddEffect = vi.fn();
const mockRemoveResource = vi.fn();
const mockIsEffectAdded = vi.fn().mockReturnValue(false);

vi.mock("@/features/resources", () => ({
  useResources: () => ({
    addEffect: mockAddEffect,
    removeResource: mockRemoveResource,
    isEffectAdded: mockIsEffectAdded,
    effectResources: [
      { id: "effect-resource-1", resourceId: "brightness", type: "effect" },
    ],
  }),
}));

// Мокируем HTMLVideoElement
Object.defineProperty(window.HTMLVideoElement.prototype, "play", {
  configurable: true,
  value: vi.fn().mockImplementation(() => {
    // Эмулируем успешное воспроизведение
    return Promise.resolve();
  }),
});

Object.defineProperty(window.HTMLVideoElement.prototype, "pause", {
  configurable: true,
  value: vi.fn(),
});

// Мокируем effects из index
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
  ],
}));

describe("EffectPreview", () => {
  const mockProps = {
    effectType: "brightness" as const,
    onClick: vi.fn(),
    size: 100,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Сбрасываем состояние isEffectAdded перед каждым тестом
    mockIsEffectAdded.mockReturnValue(false);
  });

  it("renders correctly with all elements", () => {
    render(<EffectPreview {...mockProps} />);

    // Проверяем, что видео элемент отрендерился
    const videoElement = screen.getByTestId("effect-video");
    expect(videoElement).toBeInTheDocument();
    expect(videoElement).toHaveAttribute("src", "/t1.mp4");

    // Проверяем, что название эффекта отображается
    expect(screen.getByText("effects.presets.brightness")).toBeInTheDocument();

    // Проверяем, что кнопка добавления эффекта отображается
    expect(screen.getByTestId("add-media-button")).toBeInTheDocument();
  });

  it("applies filter style when hovering", async () => {
    render(<EffectPreview {...mockProps} />);

    const videoElement = screen.getByTestId("effect-video");
    const container = videoElement.parentElement;
    expect(container).toBeInTheDocument();

    // Симулируем наведение мыши
    fireEvent.mouseEnter(container!);

    // Проверяем, что видео элементу был применен фильтр яркости
    await waitFor(() => {
      expect(videoElement.style.filter).toBe("brightness(1.5)");
    });

    // Симулируем уход мыши
    fireEvent.mouseLeave(container!);

    // Проверяем, что фильтр был сброшен
    await waitFor(() => {
      expect(videoElement.style.filter).toBe("");
    });
  });

  it("calls onClick when clicked", () => {
    render(<EffectPreview {...mockProps} />);

    const videoElement = screen.getByTestId("effect-video");
    const container = videoElement.parentElement;
    fireEvent.click(container!);

    expect(mockProps.onClick).toHaveBeenCalledTimes(1);
  });

  it("calls addEffect when add button is clicked", () => {
    render(<EffectPreview {...mockProps} />);

    const addButton = screen.getByTestId("add-media-button");
    fireEvent.click(addButton);

    expect(mockAddEffect).toHaveBeenCalledTimes(1);
    // Проверяем, что addEffect был вызван с правильным эффектом
    expect(mockAddEffect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "brightness",
        type: "brightness",
      }),
    );
  });

  it("shows remove button when effect is already added", () => {
    // Меняем возвращаемое значение мока isEffectAdded
    mockIsEffectAdded.mockReturnValue(true);

    render(<EffectPreview {...mockProps} />);

    // Проверяем, что кнопка удаления отображается
    expect(screen.getByTestId("remove-media-button")).toBeInTheDocument();
  });

  it("calls removeResource when remove button is clicked", () => {
    // Меняем возвращаемое значение мока isEffectAdded
    mockIsEffectAdded.mockReturnValue(true);

    render(<EffectPreview {...mockProps} />);

    const removeButton = screen.getByTestId("remove-media-button");
    fireEvent.click(removeButton);

    // Проверяем, что removeResource был вызван
    expect(mockRemoveResource).toHaveBeenCalledTimes(1);
  });

  it("applies different filters for different effect types", async () => {
    // Рендерим с другим типом эффекта
    render(<EffectPreview {...mockProps} effectType="contrast" />);

    const videoElement = screen.getByTestId("effect-video");
    const container = videoElement.parentElement;

    // Симулируем наведение мыши
    fireEvent.mouseEnter(container!);

    // Проверяем, что видео элементу был применен фильтр контраста
    await waitFor(() => {
      expect(videoElement.style.filter).toBe("contrast(1.5)");
    });
  });

  it("has correct size based on props", () => {
    const customSize = 200;
    render(<EffectPreview {...mockProps} size={customSize} />);

    const videoElement = screen.getByTestId("effect-video");
    const container = videoElement.parentElement;
    expect(container).toHaveStyle(`width: ${customSize}px`);
    expect(container).toHaveStyle(`height: ${customSize}px`);
  });
});
