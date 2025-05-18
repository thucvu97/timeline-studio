import { describe, expect, it } from "vitest"

import { fireEvent, render, screen } from "@/test/test-utils"

import { MediaStudio } from "./media-studio"

// Мокаем компоненты, которые используются в MediaStudio
// Моки должны быть определены в файле src/test/setup.ts

describe("MediaStudio", () => {
  it("renders correctly with default layout", () => {
    render(<MediaStudio />)

    // Проверяем, что TopBar отображается
    expect(screen.getByTestId("top-bar")).toBeInTheDocument()

    // Проверяем, что по умолчанию отображается DefaultLayout
    expect(screen.getByTestId("default-layout")).toBeInTheDocument()

    // Проверяем, что другие макеты не отображаются
    expect(screen.queryByTestId("options-layout")).not.toBeInTheDocument()
    expect(screen.queryByTestId("vertical-layout")).not.toBeInTheDocument()
    expect(screen.queryByTestId("dual-layout")).not.toBeInTheDocument()

    // Проверяем, что ModalContainer отображается
    expect(screen.getByTestId("modal-container")).toBeInTheDocument()
  })

  it("changes layout when TopBar triggers layout change", () => {
    render(<MediaStudio />)

    // Проверяем, что текущий layout - default
    expect(screen.getByTestId("current-layout").textContent).toBe("default")
    expect(screen.getByTestId("default-layout")).toBeInTheDocument()

    // Меняем layout на options
    fireEvent.click(screen.getByTestId("change-layout-options"))

    // Проверяем, что layout изменился на options
    expect(screen.getByTestId("current-layout").textContent).toBe("options")
    expect(screen.getByTestId("options-layout")).toBeInTheDocument()
    expect(screen.queryByTestId("default-layout")).not.toBeInTheDocument()

    // Меняем layout на vertical
    fireEvent.click(screen.getByTestId("change-layout-vertical"))

    // Проверяем, что layout изменился на vertical
    expect(screen.getByTestId("current-layout").textContent).toBe("vertical")
    expect(screen.getByTestId("vertical-layout")).toBeInTheDocument()
    expect(screen.queryByTestId("options-layout")).not.toBeInTheDocument()

    // Меняем layout на dual
    fireEvent.click(screen.getByTestId("change-layout-dual"))

    // Проверяем, что layout изменился на dual
    expect(screen.getByTestId("current-layout").textContent).toBe("dual")
    expect(screen.getByTestId("dual-layout")).toBeInTheDocument()
    expect(screen.queryByTestId("vertical-layout")).not.toBeInTheDocument()

    // Возвращаемся к default layout
    fireEvent.click(screen.getByTestId("change-layout-default"))

    // Проверяем, что layout изменился обратно на default
    expect(screen.getByTestId("current-layout").textContent).toBe("default")
    expect(screen.getByTestId("default-layout")).toBeInTheDocument()
    expect(screen.queryByTestId("dual-layout")).not.toBeInTheDocument()
  })
})
