import { render, renderHook, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PreviewSizeProvider, usePreviewSize } from "./preview-size-provider"

// Мокаем useMachine из @xstate/react
vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [
    {
      context: {
        previewSize: 100,
        canIncreaseSize: true,
        canDecreaseSize: false,
      },
      status: "active",
    },
    vi.fn(), // mock для send
  ]),
}))

// Мокаем функции из preview-size-machine
vi.mock("./preview-size-machine", () => ({
  previewSizeMachine: {
    createMachine: vi.fn(),
  },
  getSavedSize: vi.fn().mockReturnValue(100),
  saveSize: vi.fn(),
}))

// Мокаем console.log для проверки вызова
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, "log").mockImplementation(() => {})
})

describe("PreviewSizeProvider", () => {
  it("renders children correctly", () => {
    render(
      <PreviewSizeProvider>
        <div data-testid="test-child">Test Child</div>
      </PreviewSizeProvider>
    )

    expect(screen.getByTestId("test-child")).toBeInTheDocument()
    expect(screen.getByText("Test Child")).toBeInTheDocument()
  })

  it("provides the correct context value", () => {
    const TestComponent = () => {
      const context = usePreviewSize()
      return (
        <div>
          <span data-testid="preview-size">{context.previewSize}</span>
          <span data-testid="can-increase">{context.canIncreaseSize.toString()}</span>
          <span data-testid="can-decrease">{context.canDecreaseSize.toString()}</span>
        </div>
      )
    }

    render(
      <PreviewSizeProvider>
        <TestComponent />
      </PreviewSizeProvider>
    )

    expect(screen.getByTestId("preview-size").textContent).toBe("100")
    expect(screen.getByTestId("can-increase").textContent).toBe("true")
    expect(screen.getByTestId("can-decrease").textContent).toBe("false")
  })

  it("throws an error when usePreviewSize is used outside of PreviewSizeProvider", () => {
    // Подавляем ошибки в консоли для этого теста
    const originalConsoleError = console.error
    console.error = vi.fn()

    // Ожидаем, что хук выбросит ошибку
    expect(() => {
      renderHook(() => usePreviewSize())
    }).toThrow("usePreviewSize must be used within a PreviewSizeProvider")

    // Восстанавливаем console.error
    console.error = originalConsoleError
  })
})
