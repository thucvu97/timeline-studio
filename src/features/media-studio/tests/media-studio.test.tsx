import { describe, expect, it } from "vitest"

import { renderWithBase, screen } from "@/test/test-utils"

// Простой тест компонент
const TestComponent = () => (
  <div data-testid="test-component">
    <div data-testid="test-child">Test Child</div>
  </div>
)

describe("MediaStudio", () => {
  it("test utils work correctly", () => {
    renderWithBase(<TestComponent />)

    // Проверяем, что тест утилиты работают
    expect(screen.getByTestId("test-component")).toBeInTheDocument()
    expect(screen.getByTestId("test-child")).toBeInTheDocument()
  })

  it("theme provider renders", () => {
    const { container } = renderWithBase(<div>Test</div>)

    // Выводим HTML для отладки
    console.log("Rendered HTML:", container.innerHTML)

    // Проверяем, что ThemeProvider рендерится
    expect(screen.getByTestId("next-theme-provider")).toBeInTheDocument()
  })
})
