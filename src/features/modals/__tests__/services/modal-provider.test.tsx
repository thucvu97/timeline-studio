import React from "react"

import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ModalProvider, useModal } from "../../services/modal-provider"

// Mock state object that can be modified in tests
const mockState = {
  value: "closed",
  context: { modalType: "none", modalData: null },
  matches: vi.fn((state) => state === "closed"),
}

const mockSend = vi.fn()

// Мокаем @xstate/react
vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [mockState, mockSend]),
}))

// Мокаем modalMachine
vi.mock("../../services/modal-machine", () => ({
  modalMachine: {
    provide: vi.fn(),
  },
}))

// Мокаем console.log для проверки вызова
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, "log").mockImplementation(() => {})
  
  // Reset mock state
  mockState.value = "closed"
  mockState.context = { modalType: "none", modalData: null }
  mockState.matches = vi.fn((state) => state === "closed")
})

// Компонент-обертка для тестирования хука useModal больше не используется

// Тестовый компонент, который использует хук useModal
const TestComponent = () => {
  const { modalType, modalData, isOpen, openModal, closeModal, submitModal } = useModal()

  return (
    <div>
      <div data-testid="modal-type">{modalType}</div>
      <div data-testid="modal-data">{modalData ? JSON.stringify(modalData) : "null"}</div>
      <div data-testid="is-open">{isOpen ? "true" : "false"}</div>
      <button
        data-testid="open-modal-button"
        onClick={() => openModal("project-settings")}
      >
        Open Modal
      </button>
      <button
        data-testid="open-modal-with-data-button"
        onClick={() => openModal("user-settings", { dialogClass: "custom-class" })}
      >
        Open Modal With Data
      </button>
      <button data-testid="close-modal-button" onClick={closeModal}>
        Close Modal
      </button>
      <button
        data-testid="submit-modal-button"
        onClick={() => submitModal({ testData: "test" })}
      >
        Submit Modal
      </button>
    </div>
  )
}

// Test component for error case
const TestComponentWithoutProvider = () => {
  try {
    useModal()
    return <div>Should not render</div>
  } catch (error) {
    return <div data-testid="error-message">{(error as Error).message}</div>
  }
}

describe("ModalProvider", () => {
  const user = userEvent.setup()

  it("should provide initial context values", () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>,
    )

    expect(screen.getByTestId("modal-type")).toHaveTextContent("none")
    expect(screen.getByTestId("modal-data")).toHaveTextContent("null")
    expect(screen.getByTestId("is-open")).toHaveTextContent("false")
  })

  it("should provide context with modal data when available", () => {
    // Update mock state to include modal data
    mockState.context = {
      modalType: "user-settings",
      modalData: { dialogClass: "test-class", someKey: "someValue" },
    }

    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>,
    )

    expect(screen.getByTestId("modal-type")).toHaveTextContent("user-settings")
    expect(screen.getByTestId("modal-data")).toHaveTextContent(
      JSON.stringify({ dialogClass: "test-class", someKey: "someValue" })
    )
  })

  it("should provide correct isOpen state when modal is opened", () => {
    // Update mock state to simulate opened modal
    mockState.value = "opened"
    mockState.matches = vi.fn((state) => state === "opened")

    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>,
    )

    expect(screen.getByTestId("is-open")).toHaveTextContent("true")
  })

  it("should call openModal with correct parameters", async () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>,
    )

    await user.click(screen.getByTestId("open-modal-button"))

    expect(console.log).toHaveBeenCalledWith("Открываем модальное окно:", "project-settings")
    expect(mockSend).toHaveBeenCalledWith({
      type: "OPEN_MODAL",
      modalType: "project-settings",
      modalData: undefined,
    })
  })

  it("should call openModal with modal data", async () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>,
    )

    await user.click(screen.getByTestId("open-modal-with-data-button"))

    expect(console.log).toHaveBeenCalledWith("Открываем модальное окно:", "user-settings")
    expect(mockSend).toHaveBeenCalledWith({
      type: "OPEN_MODAL",
      modalType: "user-settings",
      modalData: { dialogClass: "custom-class" },
    })
  })

  it("should call closeModal", async () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>,
    )

    await user.click(screen.getByTestId("close-modal-button"))

    expect(console.log).toHaveBeenCalledWith("Закрываем модальное окно")
    expect(mockSend).toHaveBeenCalledWith({ type: "CLOSE_MODAL" })
  })

  it("should call submitModal with data", async () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>,
    )

    await user.click(screen.getByTestId("submit-modal-button"))

    expect(console.log).toHaveBeenCalledWith("Отправляем данные модального окна:", {
      testData: "test",
    })
    expect(mockSend).toHaveBeenCalledWith({
      type: "SUBMIT_MODAL",
      data: { testData: "test" },
    })
  })

  it("should throw error when useModal is used outside provider", () => {
    render(<TestComponentWithoutProvider />)

    expect(screen.getByTestId("error-message")).toHaveTextContent(
      "useModal must be used within a ModalProvider"
    )
  })
})
