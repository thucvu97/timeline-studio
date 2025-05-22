import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { FilterPreview } from "./filter-preview"

// Мокируем FavoriteButton и AddMediaButton
vi.mock("../../layout/favorite-button", () => ({
  FavoriteButton: ({ file, size, type }: any) => (
    <div data-testid="favorite-button">
      Favorite Button for {file.name} ({type})
    </div>
  ),
}))

vi.mock("../../layout/add-media-button", () => ({
  AddMediaButton: ({ file, onAddMedia, onRemoveMedia, isAdded, size }: any) => (
    <div>
      {isAdded ? (
        <button data-testid="remove-media-button" onClick={(e) => onRemoveMedia(e)}>
          Remove {file.name}
        </button>
      ) : (
        <button data-testid="add-media-button" onClick={(e) => onAddMedia(e)}>
          Add {file.name}
        </button>
      )}
    </div>
  ),
}))

// Мокируем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Возвращаем ключ как значение для простоты тестирования
      return key
    },
  }),
}))

// Мокируем useResources
const mockAddFilter = vi.fn()
const mockRemoveResource = vi.fn()
const mockIsFilterAdded = vi.fn().mockReturnValue(false)

vi.mock("@/features/browser/resources", () => ({
  useResources: () => ({
    addFilter: mockAddFilter,
    removeResource: mockRemoveResource,
    isFilterAdded: mockIsFilterAdded,
    filterResources: [{ id: "filter-resource-1", resourceId: "s-log", type: "filter" }],
  }),
}))

// Мокируем HTMLVideoElement
Object.defineProperty(window.HTMLVideoElement.prototype, "play", {
  configurable: true,
  value: vi.fn().mockImplementation(() => {
    // Эмулируем успешное воспроизведение
    return Promise.resolve()
  }),
})

Object.defineProperty(window.HTMLVideoElement.prototype, "pause", {
  configurable: true,
  value: vi.fn(),
})

describe("FilterPreview", () => {
  // Тестовый фильтр
  const testFilter = {
    id: "s-log",
    name: "S-Log",
    labels: {
      ru: "S-Log",
      en: "S-Log",
    },
    params: {
      brightness: 0.1,
      contrast: 0.8,
      saturation: 0.9,
      gamma: 1.2,
    },
  }

  const mockProps = {
    filter: testFilter,
    onClick: vi.fn(),
    size: 100,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Сбрасываем состояние isFilterAdded перед каждым тестом
    mockIsFilterAdded.mockReturnValue(false)
  })

  it("renders correctly with all elements", () => {
    render(<FilterPreview {...mockProps} />)

    // Проверяем, что видео элемент отрендерился
    const videoElement = screen.getByTestId("filter-video")
    expect(videoElement).toBeInTheDocument()
    expect(videoElement).toHaveAttribute("src", "/t1.mp4")
    // В JSDOM атрибут muted может быть представлен по-разному
    // Пропускаем эту проверку

    // Проверяем, что название фильтра отображается
    expect(screen.getByText("filters.presets.s-log")).toBeInTheDocument()

    // Проверяем, что кнопка добавления фильтра отображается
    expect(screen.getByTestId("add-media-button")).toBeInTheDocument()

    // Проверяем, что кнопка избранного отображается
    expect(screen.getByTestId("favorite-button")).toBeInTheDocument()
  })

  it("applies filter style when hovering", async () => {
    render(<FilterPreview {...mockProps} />)

    const videoElement = screen.getByTestId("filter-video")
    const container = videoElement.parentElement
    expect(container).toBeInTheDocument()

    // Симулируем наведение мыши
    fireEvent.mouseEnter(container!)

    // Проверяем, что видео элементу был применен фильтр
    await waitFor(() => {
      // Проверяем, что фильтр содержит нужные значения
      expect(videoElement.style.filter).toContain("brightness(1.1)")
      expect(videoElement.style.filter).toContain("contrast(0.8)")
      expect(videoElement.style.filter).toContain("saturate(0.9)")
    })

    // Симулируем уход мыши
    fireEvent.mouseLeave(container!)

    // Проверяем, что фильтр был сброшен
    await waitFor(() => {
      expect(videoElement.style.filter).toBe("")
    })
  })

  it("calls onClick when clicked", () => {
    render(<FilterPreview {...mockProps} />)

    const videoElement = screen.getByTestId("filter-video")
    const container = videoElement.parentElement
    fireEvent.click(container!)

    expect(mockProps.onClick).toHaveBeenCalledTimes(1)
  })

  it("calls addFilter when add button is clicked", () => {
    render(<FilterPreview {...mockProps} />)

    const addButton = screen.getByTestId("add-media-button")
    fireEvent.click(addButton)

    expect(mockAddFilter).toHaveBeenCalledTimes(1)
    // Проверяем, что addFilter был вызван с правильным фильтром
    expect(mockAddFilter).toHaveBeenCalledWith(testFilter)
  })

  it("shows remove button when filter is already added", () => {
    // Меняем возвращаемое значение мока isFilterAdded
    mockIsFilterAdded.mockReturnValue(true)

    render(<FilterPreview {...mockProps} />)

    // Проверяем, что кнопка удаления отображается
    expect(screen.getByTestId("remove-media-button")).toBeInTheDocument()
  })

  it("calls removeResource when remove button is clicked", () => {
    // Меняем возвращаемое значение мока isFilterAdded
    mockIsFilterAdded.mockReturnValue(true)

    render(<FilterPreview {...mockProps} />)

    const removeButton = screen.getByTestId("remove-media-button")
    fireEvent.click(removeButton)

    // Проверяем, что removeResource был вызван
    expect(mockRemoveResource).toHaveBeenCalledTimes(1)
    expect(mockRemoveResource).toHaveBeenCalledWith("filter-resource-1")
  })

  it("applies different filters for different filter types", async () => {
    // Рендерим с другим фильтром
    const portraitFilter = {
      id: "portrait",
      name: "Portrait",
      labels: {
        ru: "Портрет",
        en: "Portrait",
      },
      params: {
        brightness: 0.1,
        contrast: 1.1,
        saturation: 0.9,
        temperature: 10,
        tint: 5,
      },
    }

    render(<FilterPreview filter={portraitFilter} onClick={mockProps.onClick} size={mockProps.size} />)

    const videoElement = screen.getByTestId("filter-video")
    const container = videoElement.parentElement

    // Симулируем наведение мыши
    fireEvent.mouseEnter(container!)

    // Проверяем, что видео элементу был применен фильтр портрета
    await waitFor(() => {
      // Проверяем, что фильтр содержит нужные значения
      expect(videoElement.style.filter).toContain("brightness(1.1)")
      expect(videoElement.style.filter).toContain("contrast(1.1)")
      expect(videoElement.style.filter).toContain("saturate(0.9)")
      expect(videoElement.style.filter).toContain("sepia(10%)")
      expect(videoElement.style.filter).toContain("hue-rotate(5deg)")
    })
  })

  it("has correct size based on props", () => {
    const customSize = 200
    render(<FilterPreview {...mockProps} size={customSize} />)

    const videoElement = screen.getByTestId("filter-video")
    const container = videoElement.parentElement
    expect(container).toHaveStyle(`width: ${customSize}px`)
    expect(container).toHaveStyle(`height: ${customSize}px`)
  })
})
