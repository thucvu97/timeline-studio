import { beforeEach, describe, expect, it, vi } from "vitest"

import { fireEvent, render, screen } from "@/test/test-utils"

import { TopBar } from "./top-bar"

// Мокаем модули
vi.mock("@/features/modals")

// Мок уже определен в src/test/setup.ts
// Мокаем console.log для проверки вызова
vi.spyOn(console, "log").mockImplementation(() => {})

describe("TopBar", () => {
  const mockOnLayoutChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders correctly", () => {
    render(<TopBar layoutMode="default" onLayoutChange={mockOnLayoutChange} />)

    // Проверяем, что основные элементы отображаются по их иконкам
    expect(screen.getAllByRole("button")[0]).toBeInTheDocument() // Layout button
    expect(screen.getAllByRole("button")[1]).toBeInTheDocument() // Theme toggle

    // Проверяем, что есть хотя бы две кнопки
    expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(2)
  })

  it("renders buttons correctly", () => {
    render(<TopBar layoutMode="default" onLayoutChange={mockOnLayoutChange} />)

    // Проверяем, что основные кнопки отображаются
    expect(screen.getByRole("button", { name: /default/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /options/i })).toBeInTheDocument()
  })

  it("calls onLayoutChange when clicking on layout buttons", () => {
    render(<TopBar layoutMode="default" onLayoutChange={mockOnLayoutChange} />)

    // Находим кнопку для изменения layout на options
    const optionsButton = screen.getByRole("button", { name: /options/i })

    // Кликаем на кнопку
    fireEvent.click(optionsButton)

    // Проверяем, что был вызван onLayoutChange с правильным аргументом
    expect(mockOnLayoutChange).toHaveBeenCalledWith("options")
  })

  it("renders at least two buttons", () => {
    render(<TopBar layoutMode="default" onLayoutChange={mockOnLayoutChange} />)

    // Находим все кнопки
    const buttons = screen.getAllByRole("button")

    // Проверяем, что есть хотя бы две кнопки
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })
})
