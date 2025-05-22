import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { FilterList } from "./filter-list"

// Мокируем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Возвращаем ключ как значение для простоты тестирования
      return key
    },
  }),
}))

// Мокируем useMedia
vi.mock("@/features/browser/media", () => ({
  useMedia: () => ({
    isItemFavorite: vi.fn().mockImplementation((file, type) => {
      // Для тестирования считаем, что файл с id "s-log" в избранном
      return file.id === "s-log"
    }),
    toggleFavorite: vi.fn(),
  }),
}))

// Мокируем usePreviewSize
const mockHandleIncreaseSize = vi.fn()
const mockHandleDecreaseSize = vi.fn()

vi.mock("@/features/browser/components/preview/preview-size-provider", () => ({
  usePreviewSize: () => ({
    previewSize: 100,
    increaseSize: mockHandleIncreaseSize,
    decreaseSize: mockHandleDecreaseSize,
    canIncreaseSize: true,
    canDecreaseSize: true,
  }),
}))

// Мокируем FilterPreview
vi.mock("./filter-preview", () => ({
  FilterPreview: ({ filter, onClick, size }: any) => (
    <div
      data-testid={`filter-preview-${filter.id}`}
      onClick={onClick}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      Filter Preview: {filter.name}
    </div>
  ),
}))

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
}))

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
}))

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
  TooltipProvider: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: any) => <>{children}</>,
}))

// Мокируем lucide-react
vi.mock("lucide-react", () => ({
  Star: ({ size, className }: any) => (
    <div data-testid="star-icon" className={className}>
      Star Icon
    </div>
  ),
  ZoomIn: ({ size }: any) => <div data-testid="zoom-in-icon">Zoom In</div>,
  ZoomOut: ({ size }: any) => <div data-testid="zoom-out-icon">Zoom Out</div>,
}))

// Мокируем filters
vi.mock("./filters", () => ({
  filters: [
    {
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
    },
    {
      id: "d-log",
      name: "D-Log",
      labels: {
        ru: "D-Log",
        en: "D-Log",
      },
      params: {
        brightness: 0.05,
        contrast: 0.85,
        saturation: 0.95,
        gamma: 1.1,
      },
    },
    {
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
    },
  ],
}))

describe("FilterList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders correctly with all elements", () => {
    render(<FilterList />)

    // Проверяем, что поле поиска отображается
    expect(screen.getByTestId("search-input")).toBeInTheDocument()

    // Проверяем, что кнопки управления отображаются
    expect(screen.getByTestId("star-icon")).toBeInTheDocument()
    expect(screen.getByTestId("zoom-in-icon")).toBeInTheDocument()
    expect(screen.getByTestId("zoom-out-icon")).toBeInTheDocument()

    // Проверяем, что все фильтры отображаются
    expect(screen.getByTestId("filter-preview-s-log")).toBeInTheDocument()
    expect(screen.getByTestId("filter-preview-d-log")).toBeInTheDocument()
    expect(screen.getByTestId("filter-preview-portrait")).toBeInTheDocument()
  })

  it("filters filters by search query", () => {
    render(<FilterList />)

    // Вводим поисковый запрос
    const searchInput = screen.getByTestId("search-input")
    fireEvent.change(searchInput, { target: { value: "portrait" } })

    // Проверяем, что отображается только фильтр "portrait"
    expect(screen.getByTestId("filter-preview-portrait")).toBeInTheDocument()
    expect(screen.queryByTestId("filter-preview-s-log")).not.toBeInTheDocument()
    expect(screen.queryByTestId("filter-preview-d-log")).not.toBeInTheDocument()
  })

  it("toggles favorites filter", () => {
    render(<FilterList />)

    // Проверяем, что изначально отображаются все фильтры
    expect(screen.getByTestId("filter-preview-s-log")).toBeInTheDocument()
    expect(screen.getByTestId("filter-preview-d-log")).toBeInTheDocument()
    expect(screen.getByTestId("filter-preview-portrait")).toBeInTheDocument()

    // Нажимаем на кнопку избранного
    const favoriteButton = screen.getByTestId("star-icon").closest("button")
    fireEvent.click(favoriteButton!)

    // Проверяем, что отображается только фильтр "s-log" (он в избранном)
    expect(screen.getByTestId("filter-preview-s-log")).toBeInTheDocument()
    expect(screen.queryByTestId("filter-preview-d-log")).not.toBeInTheDocument()
    expect(screen.queryByTestId("filter-preview-portrait")).not.toBeInTheDocument()
  })

  it("calls increaseSize when zoom in button is clicked", () => {
    render(<FilterList />)

    // Находим кнопку увеличения размера и кликаем по ней
    const zoomInButton = screen.getByTestId("zoom-in-icon").closest("button")
    fireEvent.click(zoomInButton!)

    // Проверяем, что increaseSize был вызван
    expect(mockHandleIncreaseSize).toHaveBeenCalledTimes(1)
  })

  it("calls decreaseSize when zoom out button is clicked", () => {
    render(<FilterList />)

    // Находим кнопку уменьшения размера и кликаем по ней
    const zoomOutButton = screen.getByTestId("zoom-out-icon").closest("button")
    fireEvent.click(zoomOutButton!)

    // Проверяем, что decreaseSize был вызван
    expect(mockHandleDecreaseSize).toHaveBeenCalledTimes(1)
  })

  it("logs filter name when filter is clicked", () => {
    // Мокируем console.log
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

    render(<FilterList />)

    // Находим фильтр и кликаем по нему
    const filterPreview = screen.getByTestId("filter-preview-s-log")
    fireEvent.click(filterPreview)

    // Проверяем, что console.log был вызван с правильными параметрами
    expect(consoleSpy).toHaveBeenCalledWith("Applying filter:", "S-Log", {
      brightness: 0.1,
      contrast: 0.8,
      saturation: 0.9,
      gamma: 1.2,
    })

    // Восстанавливаем console.log
    consoleSpy.mockRestore()
  })

  it("shows 'not found' message when no filters match search", () => {
    render(<FilterList />)

    // Вводим поисковый запрос, который не соответствует ни одному фильтру
    const searchInput = screen.getByTestId("search-input")
    fireEvent.change(searchInput, { target: { value: "nonexistent" } })

    // Проверяем, что отображается сообщение "not found"
    expect(screen.getByText("browser.tabs.filters common.notFound")).toBeInTheDocument()
  })
})
