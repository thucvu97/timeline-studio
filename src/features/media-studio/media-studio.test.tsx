import { describe, expect, it } from "vitest"

import { render, screen } from "@/test/test-utils"

// Импортируем MediaStudio напрямую
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

  it("renders correctly with default layout", () => {
    render(<MediaStudio />)

    // Проверяем, что TopBar отображается
    expect(screen.getByTestId("top-bar")).toBeInTheDocument()

    // Проверяем, что default layout отображается
    expect(screen.getByTestId("default-layout")).toBeInTheDocument()

    // Проверяем, что ModalContainer отображается
    expect(screen.getByTestId("modal-container")).toBeInTheDocument()
  })
})
