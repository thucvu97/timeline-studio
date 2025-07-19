import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MarkerControls } from "../../../components/markers/marker-controls"
import { MarkerColors } from "../../../types/markers"

import type { ExtendedTimelineMarker, MarkerFilter } from "../../../types/markers"

// Мок для иконок lucide-react
vi.mock("lucide-react", () => ({
  Bookmark: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="Bookmark" data-testid={dataTestId || "bookmark-icon"}>
      Bookmark
    </svg>
  ),
  CheckSquare: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="CheckSquare" data-testid={dataTestId || "checksquare-icon"}>
      CheckSquare
    </svg>
  ),
  ChevronLeft: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="ChevronLeft" data-testid={dataTestId || "chevronleft-icon"}>
      ChevronLeft
    </svg>
  ),
  ChevronRight: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="ChevronRight" data-testid={dataTestId || "chevronright-icon"}>
      ChevronRight
    </svg>
  ),
  Download: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="Download" data-testid={dataTestId || "download-icon"}>
      Download
    </svg>
  ),
  Filter: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="Filter" data-testid={dataTestId || "filter-icon"}>
      Filter
    </svg>
  ),
  Folder: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="Folder" data-testid={dataTestId || "folder-icon"}>
      Folder
    </svg>
  ),
  PlayCircle: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="PlayCircle" data-testid={dataTestId || "playcircle-icon"}>
      PlayCircle
    </svg>
  ),
  Plus: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="Plus" data-testid={dataTestId || "plus-icon"}>
      Plus
    </svg>
  ),
  RefreshCw: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="RefreshCw" data-testid={dataTestId || "refreshcw-icon"}>
      RefreshCw
    </svg>
  ),
  Search: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="Search" data-testid={dataTestId || "search-icon"}>
      Search
    </svg>
  ),
  StickyNote: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="StickyNote" data-testid={dataTestId || "stickynote-icon"}>
      StickyNote
    </svg>
  ),
  X: ({ className, "data-testid": dataTestId }: any) => (
    <svg className={className} data-icon="X" data-testid={dataTestId || "x-icon"}>
      X
    </svg>
  ),
}))

// Моки для хуков
const mockUseTimeline = vi.fn()
const mockUseTimelineMarkers = vi.fn()

vi.mock("../../../hooks/use-timeline", () => ({
  useTimeline: () => mockUseTimeline(),
}))

vi.mock("../../../hooks/use-timeline-markers", () => ({
  useTimelineMarkers: () => mockUseTimelineMarkers(),
}))

// Мок для UI компонентов
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

vi.mock("@/components/ui/input", () => ({
  Input: ({ onChange, onKeyDown, ...props }: any) => <input onChange={onChange} onKeyDown={onKeyDown} {...props} />,
}))

vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children, open }: any) => (
    <div data-open={open} data-testid="popover">
      {children}
    </div>
  ),
  PopoverTrigger: ({ children, asChild }: any) => (
    <div data-testid="popover-trigger">{asChild ? children : <div>{children}</div>}</div>
  ),
  PopoverContent: ({ children }: any) => <div data-testid="popover-content">{children}</div>,
}))

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: any) => (
    <div data-testid="dropdown-trigger">{asChild ? children : <div>{children}</div>}</div>
  ),
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div onClick={onClick} data-testid="dropdown-item">
      {children}
    </div>
  ),
  DropdownMenuSeparator: () => <hr />,
}))

describe("MarkerControls", () => {
  const mockMarkers: ExtendedTimelineMarker[] = [
    {
      id: "1",
      time: 10,
      name: "Chapter 1",
      type: "chapter",
      color: MarkerColors.chapter,
      description: "First chapter",
    },
    {
      id: "2",
      time: 20,
      name: "Note 1",
      type: "note",
      color: MarkerColors.note,
      description: "Important note",
    },
    {
      id: "3",
      time: 30,
      name: "Todo 1",
      type: "note",
      color: MarkerColors.todo,
    },
  ]

  const defaultMocks = {
    currentTime: 15,
    markers: mockMarkers,
    filteredMarkers: mockMarkers,
    addMarker: vi.fn(),
    goToNextMarker: vi.fn(),
    goToPreviousMarker: vi.fn(),
    setFilter: vi.fn(),
    clearFilter: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTimeline.mockReturnValue({ currentTime: defaultMocks.currentTime })
    mockUseTimelineMarkers.mockReturnValue(defaultMocks)
  })

  it("рендерит основные элементы управления", () => {
    render(<MarkerControls />)

    // Используем getAllByText и проверяем первый элемент (кнопка)
    const addMarkerButtons = screen.getAllByText("Add Marker")
    expect(addMarkerButtons[0]).toBeInTheDocument()

    // Ищем кнопку Filter по data-icon
    const filterButton = screen.getByRole("button", { name: /Filter/i })
    expect(filterButton).toBeInTheDocument()

    expect(screen.getByText("3 / 3")).toBeInTheDocument() // счетчик маркеров
  })

  it("открывает попап добавления маркера при клике", async () => {
    render(<MarkerControls />)

    const addButton = screen.getAllByText("Add Marker")[0]
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText("Create a marker at current time")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Marker name")).toBeInTheDocument()
    })
  })

  it("добавляет новый маркер с корректными данными", async () => {
    const user = userEvent.setup()
    render(<MarkerControls />)

    // Открываем попап
    fireEvent.click(screen.getAllByText("Add Marker")[0])

    // Вводим имя маркера
    const input = screen.getByPlaceholderText("Marker name")
    await user.type(input, "New Chapter")

    // Нажимаем кнопку добавления
    const submitButton = screen.getAllByText("Add Marker")[2] // Третья кнопка в попапе
    fireEvent.click(submitButton)

    expect(defaultMocks.addMarker).toHaveBeenCalledWith(
      15, // currentTime
      "New Chapter",
      "note", // тип по умолчанию
    )
  })

  it("добавляет маркер при нажатии Enter", async () => {
    const user = userEvent.setup()
    render(<MarkerControls />)

    fireEvent.click(screen.getAllByText("Add Marker")[0])

    const input = screen.getByPlaceholderText("Marker name")
    await user.type(input, "Quick Marker")
    fireEvent.keyDown(input, { key: "Enter" })

    expect(defaultMocks.addMarker).toHaveBeenCalledWith(15, "Quick Marker", "note")
  })

  it("не добавляет маркер с пустым именем", async () => {
    render(<MarkerControls />)

    fireEvent.click(screen.getAllByText("Add Marker")[0])

    const submitButton = screen.getAllByText("Add Marker")[2]
    expect(submitButton).toBeDisabled()
  })

  it("позволяет выбрать тип маркера", async () => {
    const user = userEvent.setup()
    render(<MarkerControls />)

    fireEvent.click(screen.getAllByText("Add Marker")[0])

    // Открываем выбор типа
    const typeSelector = screen.getByTestId("dropdown-trigger")
    fireEvent.click(typeSelector)

    // Выбираем тип "Chapter" - находим первый элемент dropdown-item с текстом Chapter
    const dropdownItems = screen.getAllByTestId("dropdown-item")
    const chapterOption = dropdownItems.find((item) => item.textContent?.includes("Chapter"))
    fireEvent.click(chapterOption!)

    // Проверяем что тип изменился
    await user.type(screen.getByPlaceholderText("Marker name"), "Test Chapter")
    fireEvent.click(screen.getAllByText("Add Marker")[2])

    expect(defaultMocks.addMarker).toHaveBeenCalledWith(15, "Test Chapter", "chapter")
  })

  it("навигация между маркерами работает корректно", () => {
    render(<MarkerControls />)

    // Находим кнопки по их содержимому
    const buttons = screen.getAllByRole("button")
    const prevButton = buttons.find((btn) => btn.querySelector('[data-icon="ChevronLeft"]'))
    const nextButton = buttons.find((btn) => btn.querySelector('[data-icon="ChevronRight"]'))

    fireEvent.click(prevButton!)
    expect(defaultMocks.goToPreviousMarker).toHaveBeenCalled()

    fireEvent.click(nextButton!)
    expect(defaultMocks.goToNextMarker).toHaveBeenCalled()
  })

  it("отключает навигацию когда нет маркеров", () => {
    mockUseTimelineMarkers.mockReturnValue({
      ...defaultMocks,
      filteredMarkers: [],
    })

    render(<MarkerControls />)

    const buttons = screen.getAllByRole("button")
    const prevButton = buttons.find((btn) => btn.querySelector('[data-icon="ChevronLeft"]'))
    const nextButton = buttons.find((btn) => btn.querySelector('[data-icon="ChevronRight"]'))

    expect(prevButton).toBeDisabled()
    expect(nextButton).toBeDisabled()
  })

  it("открывает фильтр и показывает счетчик активных фильтров", async () => {
    render(<MarkerControls />)

    const filterButton = screen.getByRole("button", { name: /Filter/i })
    fireEvent.click(filterButton)

    await waitFor(() => {
      expect(screen.getByText("Filter Markers")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Search markers...")).toBeInTheDocument()
    })
  })

  it("фильтрует маркеры по поиску", async () => {
    const user = userEvent.setup()
    render(<MarkerControls />)

    fireEvent.click(screen.getByRole("button", { name: /Filter/i }))

    const searchInput = screen.getByPlaceholderText("Search markers...")
    await user.type(searchInput, "Chapter")

    expect(defaultMocks.setFilter).toHaveBeenCalledWith({
      search: "Chapter",
    })
  })

  it("фильтрует маркеры по типу", async () => {
    render(<MarkerControls />)

    fireEvent.click(screen.getByRole("button", { name: /Filter/i }))

    // Находим чекбокс для типа "Chapter"
    const chapterCheckbox = screen.getAllByRole("checkbox")[0]
    fireEvent.click(chapterCheckbox)

    expect(defaultMocks.setFilter).toHaveBeenCalledWith({
      types: ["chapter"],
    })
  })

  it("очищает поиск при клике на X", async () => {
    const user = userEvent.setup()
    render(<MarkerControls />)

    fireEvent.click(screen.getByRole("button", { name: /Filter/i }))

    const searchInput = screen.getByPlaceholderText("Search markers...")
    await user.type(searchInput, "test")

    // Находим кнопку очистки по иконке X
    const buttons = screen.getAllByRole("button")
    const clearButton = buttons.find((btn) => btn.querySelector('[data-icon="X"]'))
    fireEvent.click(clearButton!)

    expect(defaultMocks.setFilter).toHaveBeenLastCalledWith({})
  })

  it("показывает количество активных фильтров", async () => {
    mockUseTimelineMarkers.mockReturnValue({
      ...defaultMocks,
      setFilter: (filter: MarkerFilter) => {
        if (filter.types?.length || filter.search) {
          // Симулируем обновление компонента
        }
        defaultMocks.setFilter(filter)
      },
    })

    const { rerender } = render(<MarkerControls />)

    fireEvent.click(screen.getByRole("button", { name: /Filter/i }))

    // Добавляем фильтр по типу
    const chapterCheckbox = screen.getAllByRole("checkbox")[0]
    fireEvent.click(chapterCheckbox)

    // Перерендерим с обновленным состоянием
    rerender(<MarkerControls />)

    // Проверяем что badge показывает количество фильтров
    const badge = screen.getByText("1")
    expect(badge).toBeInTheDocument()
  })

  it("очищает все фильтры при клике на Clear all", async () => {
    render(<MarkerControls />)

    fireEvent.click(screen.getByRole("button", { name: /Filter/i }))

    // Устанавливаем фильтр
    const chapterCheckbox = screen.getAllByRole("checkbox")[0]
    fireEvent.click(chapterCheckbox)

    // Нажимаем Clear all
    const clearAllButton = screen.getByText("Clear all")
    fireEvent.click(clearAllButton)

    expect(defaultMocks.clearFilter).toHaveBeenCalled()
  })

  it("обновляет счетчик маркеров при фильтрации", () => {
    mockUseTimelineMarkers.mockReturnValue({
      ...defaultMocks,
      markers: mockMarkers,
      filteredMarkers: [mockMarkers[0]], // Только один отфильтрованный
    })

    render(<MarkerControls />)

    expect(screen.getByText("1 / 3")).toBeInTheDocument()
  })

  it("сохраняет состояние фильтров между открытиями попапа", async () => {
    const user = userEvent.setup()
    render(<MarkerControls />)

    // Открываем фильтр и вводим поиск
    fireEvent.click(screen.getByRole("button", { name: /Filter/i }))
    const searchInput = screen.getByPlaceholderText("Search markers...")
    await user.type(searchInput, "test")

    // Закрываем попап (симулируем изменение состояния)
    fireEvent.click(document.body)

    // Открываем снова
    fireEvent.click(screen.getByRole("button", { name: /Filter/i }))

    // Проверяем что значение сохранилось
    const input = screen.getByPlaceholderText("Search markers...")
    expect(input.value).toBe("test")
  })

  it("комбинирует фильтры по типу и поиску", async () => {
    const user = userEvent.setup()
    render(<MarkerControls />)

    fireEvent.click(screen.getByRole("button", { name: /Filter/i }))

    // Выбираем тип
    const chapterCheckbox = screen.getAllByRole("checkbox")[0]
    fireEvent.click(chapterCheckbox)

    // Вводим поиск
    const searchInput = screen.getByPlaceholderText("Search markers...")
    await user.type(searchInput, "test")

    expect(defaultMocks.setFilter).toHaveBeenLastCalledWith({
      types: ["chapter"],
      search: "test",
    })
  })

  it("отображает правильный цвет для каждого типа маркера", () => {
    render(<MarkerControls />)

    fireEvent.click(screen.getAllByText("Add Marker")[0])

    // Открываем dropdown с типами
    const typeSelector = screen.getByTestId("dropdown-trigger")
    fireEvent.click(typeSelector)

    // Проверяем что каждый тип имеет свой цвет
    const dropdownItems = screen.getAllByTestId("dropdown-item")
    expect(dropdownItems).toHaveLength(7) // Все типы маркеров

    dropdownItems.forEach((item) => {
      const colorIndicator = item.querySelector('[style*="background-color"]')
      expect(colorIndicator).toBeInTheDocument()
    })
  })
})
