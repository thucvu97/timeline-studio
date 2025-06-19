import { describe, expect, it, vi } from "vitest"

import { renderWithBase, screen } from "@/test/test-utils"

import { SpeedSettings } from "../../components/speed-settings"

// Мокаем ResizeObserver для компонентов со Slider
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

describe("SpeedSettings", () => {
  it("should render speed settings component", () => {
    renderWithBase(<SpeedSettings />)

    // Проверяем, что компонент рендерится
    expect(screen.getByTestId("speed-settings")).toBeInTheDocument()
  })

  it("should render all speed setting controls", () => {
    renderWithBase(<SpeedSettings />)

    // Проверяем основные элементы управления
    expect(screen.getByText("options.speed.defaultPlayback")).toBeInTheDocument()
    expect(screen.getByText("options.speed.customSpeed")).toBeInTheDocument()
    expect(screen.getByText("options.speed.interpolation")).toBeInTheDocument()
    expect(screen.getByText("options.speed.motionBlur")).toBeInTheDocument()
    expect(screen.getByText("options.speed.smoothPlayback")).toBeInTheDocument()
  })
})
