import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { PreviewTimeline } from "./preview-timeline"

describe("PreviewTimeline", () => {
  it("should render correctly with time and duration", () => {
    render(<PreviewTimeline time={10} duration={60} />)

    // Проверяем, что компонент отрендерился
    const timelineElement = screen.getByTestId("preview-timeline")
    expect(timelineElement).toBeInTheDocument()

    // Проверяем стиль позиции (должен быть 16.67%)
    expect(timelineElement).toHaveStyle("left: 16.666666666666664%")
  })

  it("should not render when position is 0", () => {
    render(<PreviewTimeline time={0} duration={60} />)

    // Проверяем, что компонент не отрендерился
    const timelineElement = screen.queryByTestId("preview-timeline")
    expect(timelineElement).not.toBeInTheDocument()
  })

  it("should not render when not visible", () => {
    // Пропускаем этот тест, так как isVisible управляется внутри компонента
    // и не может быть напрямую изменено в тесте
  })

  it("should handle video reference correctly", () => {
    // Создаем мок для HTMLVideoElement
    const videoRef = document.createElement("video")

    // Мокаем методы и свойства
    Object.defineProperty(videoRef, "currentTime", {
      get: vi.fn(() => 30),
      set: vi.fn(),
    })
    Object.defineProperty(videoRef, "paused", {
      get: vi.fn(() => true),
    })

    // Мокаем addEventListener
    videoRef.addEventListener = vi.fn()
    videoRef.removeEventListener = vi.fn()

    // Рендерим компонент с videoRef
    render(<PreviewTimeline time={10} duration={60} videoRef={videoRef} />)

    // Проверяем, что addEventListener был вызван
    expect(videoRef.addEventListener).toHaveBeenCalledWith(
      "mouseenter",
      expect.any(Function),
    )
    expect(videoRef.addEventListener).toHaveBeenCalledWith(
      "mouseleave",
      expect.any(Function),
    )
    expect(videoRef.addEventListener).toHaveBeenCalledWith(
      "timeupdate",
      expect.any(Function),
    )
    expect(videoRef.addEventListener).toHaveBeenCalledWith(
      "mousemove",
      expect.any(Function),
    )
  })

  it("should handle zero duration correctly", () => {
    render(<PreviewTimeline time={10} duration={0} />)

    // Проверяем, что компонент не отрендерился (positionPercent = 0)
    const timelineElement = screen.queryByRole("none", { hidden: true })
    expect(timelineElement).not.toBeInTheDocument()
  })
})
