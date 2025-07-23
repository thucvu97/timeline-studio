import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AppProvider, useApp } from "../../services/app-provider"

// Мокаем XState machine
const mockSend = vi.fn()
const mockState = {
  context: {
    isConnected: false,
    error: null,
    projectState: {
      currentProject: {
        path: null,
        name: "Test Project",
        isDirty: false,
      },
    },
  },
  matches: vi.fn((state) => state === "disconnected"), // Изначально disconnected
}

vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [mockState, mockSend]),
}))

// Мокаем app-machine
vi.mock("../../services/app-machine", () => ({
  appMachine: {
    id: "app",
    initial: "disconnected",
  },
}))

// Компонент для тестирования хука useApp
const TestComponent = () => {
  const context = useApp()
  const { isConnected, isConnecting, connectionError, projectState, executeCommand } = context

  return (
    <div>
      <div data-testid="connected">{isConnected ? "Connected" : "Disconnected"}</div>
      <div data-testid="connecting">{isConnecting ? "Connecting" : "Not Connecting"}</div>
      <div data-testid="error">{connectionError ?? "No Error"}</div>
      <div data-testid="project-name">{projectState?.currentProject?.name ?? "No Project"}</div>
      <button data-testid="execute-command" onClick={() => executeCommand({ type: "TEST" })}>
        Execute Command
      </button>
    </div>
  )
}

describe("AppProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render children and provide context", () => {
    render(
      <AppProvider>
        <div data-testid="child">Child Component</div>
      </AppProvider>,
    )

    expect(screen.getByTestId("child")).toBeInTheDocument()
  })

  it("should provide app context to children", () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>,
    )

    expect(screen.getByTestId("connected")).toHaveTextContent("Disconnected")
    expect(screen.getByTestId("connecting")).toHaveTextContent("Not Connecting")
    expect(screen.getByTestId("error")).toHaveTextContent("No Error")
    expect(screen.getByTestId("project-name")).toHaveTextContent("Test Project")
  })

  it("should handle executeCommand function", () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>,
    )

    const button = screen.getByTestId("execute-command")
    button.click()

    expect(mockSend).toHaveBeenCalledWith({
      type: "EXECUTE_COMMAND",
      command: { type: "TEST" },
    })
  })

  it("should connect automatically on mount", () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>,
    )

    // Проверяем, что отправлено событие подключения
    expect(mockSend).toHaveBeenCalledWith({ type: "CONNECT" })
  })

  it("should provide disconnect functionality", () => {
    // Создаем тестовый компонент, который проверяет функции
    const DisconnectTestComponent = () => {
      const { disconnect } = useApp()
      return (
        <button data-testid="disconnect" onClick={disconnect}>
          Disconnect
        </button>
      )
    }

    render(
      <AppProvider>
        <DisconnectTestComponent />
      </AppProvider>,
    )

    const button = screen.getByTestId("disconnect")
    button.click()

    expect(mockSend).toHaveBeenCalledWith({ type: "DISCONNECT" })
  })

  it("should provide retry connection functionality", () => {
    // Создаем тестовый компонент, который проверяет функции
    const RetryTestComponent = () => {
      const { retryConnection } = useApp()
      return (
        <button data-testid="retry" onClick={retryConnection}>
          Retry
        </button>
      )
    }

    render(
      <AppProvider>
        <RetryTestComponent />
      </AppProvider>,
    )

    const button = screen.getByTestId("retry")
    button.click()

    expect(mockSend).toHaveBeenCalledWith({ type: "RETRY_CONNECTION" })
  })
})
