import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/types/media"

import { FavoriteButton } from "./favorite-button"

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "browser.media.addToFavorites": "Add to favorites",
        "browser.media.removeFromFavorites": "Remove from favorites",
        "browser.media.inFavorites": "In favorites",
      }
      return translations[key] || key
    },
  }),
}))

// Мокаем Lucide иконки
vi.mock("lucide-react", () => ({
  Star: ({ className, strokeWidth }: any) => (
    <div
      data-testid="star-icon"
      className={className}
      data-stroke-width={strokeWidth}
    >
      Star Icon
    </div>
  ),
}))

describe("FavoriteButton", () => {
  // Создаем тестовый файл
  const testFile: MediaFile = {
    id: "test-id",
    name: "test-file.mp4",
    path: "/path/to/test-file.mp4",
    type: "video",
    size: 1024,
    duration: 60,
    width: 1920,
    height: 1080,
    thumbnail: "/path/to/thumbnail.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Мокаем функции обратного вызова
  const onAddToFavorites = vi.fn()
  const onRemoveFromFavorites = vi.fn()

  // Очищаем моки перед каждым тестом
  beforeEach(() => {
    vi.clearAllMocks()
    // Мокаем setTimeout и clearTimeout
    vi.useFakeTimers()
  })

  // Восстанавливаем оригинальные функции после тестов
  afterEach(() => {
    vi.useRealTimers()
  })

  it("should render star icon when not in favorites", () => {
    // Рендерим компонент
    render(
      <FavoriteButton
        file={testFile}
        isFavorite={false}
        onAddToFavorites={onAddToFavorites}
      />,
    )

    // Проверяем, что отображается иконка Star
    expect(screen.getByTestId("star-icon")).toBeInTheDocument()

    // Проверяем, что иконка не имеет класс fill-white (не заполнена)
    expect(screen.getByTestId("star-icon").className).not.toContain(
      "fill-white",
    )

    // Проверяем, что кнопка имеет правильный title
    expect(screen.getByTitle("Add to favorites")).toBeInTheDocument()

    // Проверяем, что кнопка имеет класс invisible (скрыта по умолчанию)
    const button = screen.getByTitle("Add to favorites")
    expect(button.className).toContain("invisible")
    expect(button.className).toContain("group-hover:visible")
  })

  it("should render filled star icon when in favorites", () => {
    // Рендерим компонент
    render(
      <FavoriteButton
        file={testFile}
        isFavorite={true}
        onRemoveFromFavorites={onRemoveFromFavorites}
      />,
    )

    // Проверяем, что отображается иконка Star
    expect(screen.getByTestId("star-icon")).toBeInTheDocument()

    // Проверяем, что иконка имеет класс fill-white (заполнена)
    expect(screen.getByTestId("star-icon").className).toContain("fill-white")

    // Проверяем, что кнопка имеет правильный title
    expect(screen.getByTitle("In favorites")).toBeInTheDocument()

    // Проверяем, что кнопка имеет класс visible
    const button = screen.getByTitle("In favorites")
    expect(button.className).toContain("visible")
  })

  it("should call onAddToFavorites when clicked and not in favorites", () => {
    // Рендерим компонент
    render(
      <FavoriteButton
        file={testFile}
        isFavorite={false}
        onAddToFavorites={onAddToFavorites}
      />,
    )

    // Кликаем на кнопку
    fireEvent.click(screen.getByTitle("Add to favorites"))

    // Проверяем, что onAddToFavorites был вызван с правильными аргументами
    expect(onAddToFavorites).toHaveBeenCalledTimes(1)
    expect(onAddToFavorites).toHaveBeenCalledWith(
      expect.anything(),
      testFile,
      "media",
    )
  })

  it("should change title on hover when in favorites", () => {
    // Рендерим компонент
    render(
      <FavoriteButton
        file={testFile}
        isFavorite={true}
        onRemoveFromFavorites={onRemoveFromFavorites}
      />,
    )

    // Проверяем начальный title
    expect(screen.getByTitle("In favorites")).toBeInTheDocument()

    // Получаем кнопку
    const button = screen.getByTitle("In favorites")

    // Продвигаем таймеры вперед, чтобы сбросить флаг isRecentlyAdded
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // Симулируем наведение на кнопку
    fireEvent.mouseEnter(button)

    // Проверяем, что title изменился
    expect(screen.getByTitle("Remove from favorites")).toBeInTheDocument()
  })

  it("should call onRemoveFromFavorites when clicked and in favorites", () => {
    // Рендерим компонент
    render(
      <FavoriteButton
        file={testFile}
        isFavorite={true}
        onRemoveFromFavorites={onRemoveFromFavorites}
      />,
    )

    // Получаем кнопку
    const button = screen.getByTitle("In favorites")

    // Продвигаем таймеры вперед, чтобы сбросить флаг isRecentlyAdded
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // Симулируем наведение на кнопку
    fireEvent.mouseEnter(button)

    // Кликаем на кнопку
    fireEvent.click(screen.getByTitle("Remove from favorites"))

    // Проверяем, что onRemoveFromFavorites был вызван с правильными аргументами
    expect(onRemoveFromFavorites).toHaveBeenCalledTimes(1)
    expect(onRemoveFromFavorites).toHaveBeenCalledWith(
      expect.anything(),
      testFile,
      "media",
    )
  })

  it("should apply different styles based on size prop", () => {
    // Рендерим компонент с большим размером
    const { rerender } = render(
      <FavoriteButton
        file={testFile}
        isFavorite={false}
        size={120}
        onAddToFavorites={onAddToFavorites}
      />,
    )

    // Проверяем, что иконка имеет правильный класс для большого размера
    expect(screen.getByTestId("star-icon").className).toContain("h-3.5 w-3.5")

    // Проверяем, что кнопка имеет правильное позиционирование для большого размера
    expect(screen.getByTitle("Add to favorites").className).toContain(
      "right-[36px] bottom-1",
    )

    // Перерендериваем компонент с маленьким размером
    rerender(
      <FavoriteButton
        file={testFile}
        isFavorite={false}
        size={60}
        onAddToFavorites={onAddToFavorites}
      />,
    )

    // Проверяем, что иконка имеет правильный класс для маленького размера
    expect(screen.getByTestId("star-icon").className).toContain("h-2.5 w-2.5")

    // Проверяем, что кнопка имеет правильное позиционирование для маленького размера
    expect(screen.getByTitle("Add to favorites").className).toContain(
      "right-[28px] bottom-0.5",
    )
  })

  it("should not render if neither onAddToFavorites nor onRemoveFromFavorites is provided", () => {
    // Рендерим компонент без обработчиков
    const { container } = render(
      <FavoriteButton file={testFile} isFavorite={false} />,
    )

    // Проверяем, что компонент не отрендерен
    expect(container.firstChild).toBeNull()
  })

  it("should show animation when added to favorites", () => {
    // Рендерим компонент в контейнере
    const { container, rerender } = render(
      <FavoriteButton
        file={testFile}
        isFavorite={true}
        onRemoveFromFavorites={onRemoveFromFavorites}
      />,
    )

    // Находим кнопку в контейнере
    const button = container.querySelector('div[title="In favorites"]')
    expect(button).not.toBeNull()

    // Проверяем, что кнопка имеет класс scale-110 (анимация)
    expect(button?.className).toContain("scale-110")

    // Продвигаем таймеры вперед, чтобы сбросить анимацию
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // Перерендериваем компонент, чтобы увидеть изменения
    rerender(
      <FavoriteButton
        file={testFile}
        isFavorite={true}
        onRemoveFromFavorites={onRemoveFromFavorites}
      />,
    )

    // Находим кнопку снова после перерендеринга
    const updatedButton = container.querySelector('div[title="In favorites"]')
    expect(updatedButton).not.toBeNull()

    // Проверяем, что кнопка больше не имеет класс scale-110
    expect(updatedButton?.className).not.toContain("scale-110")
  })
})
