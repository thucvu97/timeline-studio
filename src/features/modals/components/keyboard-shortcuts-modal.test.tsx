import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import * as keyboardShortcuts from "./keyboard-shortcuts"
import { KeyboardShortcutsModal } from "./keyboard-shortcuts-modal"
import * as modalService from "../services"

// Мокируем компоненты UI
vi.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div data-testid="select">
      <span data-testid="select-value">{value}</span>
      <button
        data-testid="select-button"
        onClick={() => onValueChange && onValueChange("Wondershare Filmora")}
      >
        Select
      </button>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: any) => (
    <div data-testid={`select-item-${value}`}>{children}</div>
  ),
  SelectTrigger: ({ children }: any) => (
    <div data-testid="select-container">{children}</div>
  ),
  SelectValue: () => <div data-testid="select-display-value">Select Value</div>,
}))

// Мокируем модуль i18next
vi.mock("react-i18next", () => ({
  // Мокируем хук useTranslation
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback || key,
    i18n: {
      language: "ru",
      changeLanguage: vi.fn(),
    },
  }),
}))

// Мокируем модуль с предустановками
vi.mock("./keyboard-shortcuts", () => {
  // Создаем упрощенные предустановки для тестов
  const mockPresets = {
    Timeline: [
      {
        id: "timeline-general",
        name: "Общие",
        shortcuts: [
          { id: "undo", name: "Отменить", keys: "⌘Z" },
          { id: "redo", name: "Повторить", keys: "⌘⇧Z" },
        ],
      },
      {
        id: "timeline-playback",
        name: "Воспроизведение",
        shortcuts: [
          { id: "play-pause", name: "Воспроизвести/Пауза", keys: "Space" },
          { id: "stop", name: "Остановить", keys: "K" },
        ],
      },
    ],
    "Wondershare Filmora": [
      {
        id: "filmora-general",
        name: "Общие",
        shortcuts: [
          { id: "undo", name: "Отменить", keys: "Ctrl+Z" },
          { id: "redo", name: "Повторить", keys: "Ctrl+Y" },
        ],
      },
    ],
    "Adobe Premier Pro": [
      {
        id: "premiere-general",
        name: "Общие",
        shortcuts: [
          { id: "undo", name: "Отменить", keys: "Ctrl+Z" },
          { id: "redo", name: "Повторить", keys: "Ctrl+⇧+Z" },
        ],
      },
    ],
  }

  const createPresetsMock = vi.fn().mockReturnValue(mockPresets)

  return {
    createPresets: createPresetsMock,
    getPresetNames: vi.fn().mockReturnValue(Object.keys(mockPresets)),
  }
})

// Мокируем хук useModal
vi.mock("../services", () => ({
  useModal: vi.fn().mockReturnValue({
    isOpen: true,
    closeModal: vi.fn(),
  }),
}))

describe("KeyboardShortcutsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render correctly with default preset", () => {
    render(<KeyboardShortcutsModal />)

    // Проверяем, что заголовок модального окна отображается
    expect(
      screen.getByText("Переключиться на другую предустановку ярлыков:"),
    ).toBeInTheDocument()

    // Проверяем, что категории отображаются
    expect(screen.getAllByText("Общие").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Воспроизведение").length).toBeGreaterThan(0)

    // Проверяем, что горячие клавиши отображаются
    expect(screen.getAllByText("Отменить").length).toBeGreaterThan(0)
    expect(screen.getAllByText("⌘Z").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Повторить").length).toBeGreaterThan(0)
    expect(screen.getAllByText("⌘⇧Z").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Воспроизвести/Пауза").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Space").length).toBeGreaterThan(0)
  })

  it("should filter shortcuts when searching", async () => {
    render(<KeyboardShortcutsModal />)

    // Находим поле поиска
    const searchInput = screen.getByPlaceholderText("Поиск сочетаний клавиш")

    // Вводим поисковый запрос
    await userEvent.type(searchInput, "Отменить")

    // Проверяем, что отображаются только соответствующие горячие клавиши
    expect(screen.getAllByText("Отменить").length).toBeGreaterThan(0)
    expect(screen.getAllByText("⌘Z").length).toBeGreaterThan(0)

    // Проверяем, что другие горячие клавиши не отображаются
    expect(screen.queryByText("Воспроизвести/Пауза")).not.toBeInTheDocument()

    // Очищаем поиск
    await userEvent.clear(searchInput)

    // Проверяем, что все горячие клавиши снова отображаются
    expect(screen.getAllByText("Воспроизвести/Пауза").length).toBeGreaterThan(0)
  })

  it("should switch between presets", async () => {
    render(<KeyboardShortcutsModal />)

    // Находим и кликаем по кнопке селектора (который мы замокировали)
    const selectButton = screen.getByTestId("select-button")
    await userEvent.click(selectButton)

    // Проверяем, что отображаются горячие клавиши из выбранной предустановки
    // Наш мок Select автоматически меняет значение на "Wondershare Filmora"
    expect(screen.getAllByText("Ctrl+Z").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Ctrl+Y").length).toBeGreaterThan(0)
  })

  it("should close modal when clicking Cancel button", async () => {
    const closeModalMock = vi.fn()
    vi.mocked(modalService.useModal).mockReturnValue({
      isOpen: true,
      closeModal: closeModalMock,
    })

    render(<KeyboardShortcutsModal />)

    // Находим кнопку по тексту
    const cancelButton = screen.getByRole("button", { name: /Отменить/i })

    // Нажимаем на кнопку Отменить
    await userEvent.click(cancelButton)

    // Проверяем, что closeModal был вызван
    expect(closeModalMock).toHaveBeenCalledTimes(1)
  })

  it("should close modal when clicking OK button", async () => {
    const closeModalMock = vi.fn()
    vi.mocked(modalService.useModal).mockReturnValue({
      isOpen: true,
      closeModal: closeModalMock,
    })

    render(<KeyboardShortcutsModal />)

    // Находим кнопку по тексту
    const okButton = screen.getByRole("button", { name: /OK/i })

    // Нажимаем на кнопку OK
    await userEvent.click(okButton)

    // Проверяем, что closeModal был вызван
    expect(closeModalMock).toHaveBeenCalledTimes(1)
  })

  it("should reset shortcuts to default values", async () => {
    // Полностью очищаем моки перед тестом
    vi.clearAllMocks()

    // Создаем новый мок для createPresets
    const createPresetsMock = vi.fn().mockReturnValue({
      Timeline: [
        {
          id: "timeline-general",
          name: "Общие",
          shortcuts: [{ id: "undo", name: "Отменить", keys: "⌘Z" }],
        },
      ],
    })

    // Переопределяем мок для createPresets
    vi.mocked(keyboardShortcuts.createPresets).mockImplementation(
      createPresetsMock,
    )

    render(<KeyboardShortcutsModal />)

    // Находим кнопку сброса
    const resetButton = screen.getByRole("button", {
      name: /Восстановление значений по умолчанию/i,
    })

    // Нажимаем на кнопку сброса
    await userEvent.click(resetButton)

    // Проверяем, что createPresets был вызван хотя бы раз
    expect(createPresetsMock).toHaveBeenCalled()
  })
})
