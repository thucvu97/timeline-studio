import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

// Импортируем MediaStudio напрямую
import { MediaStudio } from "./media-studio"

// Мокаем компоненты, которые используются в MediaStudio
vi.mock("@/features/user-settings/user-settings-provider", () => ({
  useUserSettings: () => ({
    layoutMode: "default",
  }),
}))

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
