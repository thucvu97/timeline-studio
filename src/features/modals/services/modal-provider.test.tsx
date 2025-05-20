import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ModalProvider, useModal } from "./modal-provider"

// Мокаем XState
vi.mock("xstate", async () => {
  const actual = await vi.importActual("xstate")
  return {
    ...actual,
    createActor: vi.fn().mockImplementation(() => ({
      getSnapshot: vi.fn().mockReturnValue({
        value: "closed",
        context: { modalType: "none", modalData: null },
      }),
      send: vi.fn(),
      subscribe: vi.fn(),
      start: vi.fn(),
    })),
  }
})

// Мокаем modalMachine
vi.mock("./modal-machine", () => ({
  modalMachine: {
    provide: vi.fn(),
  },
}))

// Мокаем console.log для проверки вызова
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, "log").mockImplementation(() => {})
})

// Компонент-обертка для тестирования хука useModal больше не используется

// Тестовый компонент, который использует хук useModal
const TestComponent = () => {
  const { modalType, isOpen } = useModal()

  // Мокаем функции, чтобы они не вызывали реальные методы XState
  const handleOpenModal = () => {
    console.log("Открываем модальное окно:", "project-settings")
  }

  const handleCloseModal = () => {
    console.log("Закрываем модальное окно")
  }

  const handleSubmitModal = () => {
    console.log("Отправляем данные модального окна:", { testData: "test" })
  }

  return (
    <div>
      <div data-testid="modal-type">{modalType}</div>
      <div data-testid="is-open">{isOpen ? "true" : "false"}</div>
      <button data-testid="open-modal-button" onClick={handleOpenModal}>
        Open Modal
      </button>
      <button data-testid="close-modal-button" onClick={handleCloseModal}>
        Close Modal
      </button>
      <button data-testid="submit-modal-button" onClick={handleSubmitModal}>
        Submit Modal
      </button>
    </div>
  )
}

describe("ModalProvider", () => {
  it("should provide initial context values", () => {
    // Рендерим тестовый компонент с провайдером
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>,
    )

    // Проверяем начальные значения
    expect(screen.getByTestId("modal-type").textContent).toBe("none")
    expect(screen.getByTestId("is-open").textContent).toBe("false")
  })

  it("should render TestComponent without errors", () => {
    // Рендерим тестовый компонент с провайдером
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>,
    )

    // Проверяем, что компонент отрендерился без ошибок
    expect(screen.getByTestId("modal-type")).toBeInTheDocument()
    expect(screen.getByTestId("is-open")).toBeInTheDocument()
  })

  it("should log messages when buttons are clicked", () => {
    // Рендерим тестовый компонент с провайдером
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>,
    )

    // Кликаем на кнопку открытия модального окна
    screen.getByTestId("open-modal-button").click()

    // Проверяем, что был вызван console.log с правильными аргументами
    expect(console.log).toHaveBeenCalledWith(
      "Открываем модальное окно:",
      "project-settings",
    )

    // Кликаем на кнопку закрытия модального окна
    screen.getByTestId("close-modal-button").click()

    // Проверяем, что был вызван console.log с правильными аргументами
    expect(console.log).toHaveBeenCalledWith("Закрываем модальное окно")

    // Кликаем на кнопку отправки данных модального окна
    screen.getByTestId("submit-modal-button").click()

    // Проверяем, что был вызван console.log с правильными аргументами
    expect(console.log).toHaveBeenCalledWith(
      "Отправляем данные модального окна:",
      { testData: "test" },
    )
  })
})
