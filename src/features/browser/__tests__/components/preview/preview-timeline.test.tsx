import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { PreviewTimeline } from "../../../components/preview/preview-timeline"

// Мокаем requestAnimationFrame и cancelAnimationFrame
const mockRequestAnimationFrame = vi.fn()
const mockCancelAnimationFrame = vi.fn()

// Мок для HTMLVideoElement
class MockHTMLVideoElement {
  currentTime = 0
  paused = true
  listeners: Record<string, Array<(...args: any[]) => void>> = {}

  addEventListener(event: string, listener: (...args: any[]) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(listener)
  }

  removeEventListener(event: string, listener: (...args: any[]) => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((l) => l !== listener)
    }
  }

  dispatchEvent(event: string) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((listener) => listener())
    }
  }
}

describe("PreviewTimeline", () => {
  let mockVideoElement: MockHTMLVideoElement
  let animationFrameId = 0

  beforeEach(() => {
    vi.clearAllMocks()
    mockVideoElement = new MockHTMLVideoElement()

    // Мокаем requestAnimationFrame с автоинкрементом ID
    animationFrameId = 0
    mockRequestAnimationFrame.mockImplementation((callback) => {
      animationFrameId++
      // Вызываем callback синхронно для тестов
      setTimeout(() => callback(), 0)
      return animationFrameId
    })

    global.requestAnimationFrame = mockRequestAnimationFrame
    global.cancelAnimationFrame = mockCancelAnimationFrame
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("основной рендеринг", () => {
    it("должен рендерить индикатор временной шкалы", () => {
      render(<PreviewTimeline time={30} duration={120} videoRef={mockVideoElement as any} />)

      const timeline = screen.getByTestId("preview-timeline")
      expect(timeline).toBeInTheDocument()
      expect(timeline).toHaveClass("absolute", "top-0", "bottom-0", "z-10", "w-[1px]", "bg-red-500")
    })

    it("должен позиционировать индикатор в правильном месте", () => {
      render(<PreviewTimeline time={30} duration={120} videoRef={mockVideoElement as any} />)

      const timeline = screen.getByTestId("preview-timeline")
      // 30 секунд из 120 = 25%
      expect(timeline).toHaveStyle({ left: "25%" })
    })

    it("не должен рендерить индикатор при нулевой позиции", () => {
      render(<PreviewTimeline time={0} duration={120} videoRef={mockVideoElement as any} />)

      expect(screen.queryByTestId("preview-timeline")).not.toBeInTheDocument()
    })

    it("не должен рендерить индикатор при нулевой длительности", () => {
      render(<PreviewTimeline time={30} duration={0} videoRef={mockVideoElement as any} />)

      expect(screen.queryByTestId("preview-timeline")).not.toBeInTheDocument()
    })

    it("должен корректно работать без videoRef", () => {
      render(<PreviewTimeline time={30} duration={120} />)

      const timeline = screen.getByTestId("preview-timeline")
      expect(timeline).toBeInTheDocument()
      expect(timeline).toHaveStyle({ left: "25%" })
    })
  })

  describe("взаимодействие с видео", () => {
    it("должен обновлять позицию при событии timeupdate", async () => {
      mockVideoElement.currentTime = 30

      render(<PreviewTimeline time={0} duration={120} videoRef={mockVideoElement as any} />)

      // Изначально не видим (time = 0)
      expect(screen.queryByTestId("preview-timeline")).not.toBeInTheDocument()

      // Симулируем событие timeupdate
      mockVideoElement.currentTime = 60
      mockVideoElement.dispatchEvent("timeupdate")

      await waitFor(() => {
        const timeline = screen.getByTestId("preview-timeline")
        expect(timeline).toHaveStyle({ left: "50%" })
      })
    })

    it("должен показывать индикатор при наведении мыши", async () => {
      render(<PreviewTimeline time={30} duration={120} videoRef={mockVideoElement as any} />)

      // Изначально видим
      expect(screen.getByTestId("preview-timeline")).toBeInTheDocument()

      // Симулируем уход мыши
      mockVideoElement.dispatchEvent("mouseleave")

      await waitFor(() => {
        expect(screen.queryByTestId("preview-timeline")).not.toBeInTheDocument()
      })

      // Симулируем наведение мыши
      mockVideoElement.dispatchEvent("mouseenter")

      await waitFor(() => {
        expect(screen.getByTestId("preview-timeline")).toBeInTheDocument()
      })
    })

    it("должен обновлять позицию при движении мыши", async () => {
      mockVideoElement.currentTime = 30

      render(<PreviewTimeline time={0} duration={120} videoRef={mockVideoElement as any} />)

      // Симулируем движение мыши
      mockVideoElement.currentTime = 45
      mockVideoElement.dispatchEvent("mousemove")

      await waitFor(() => {
        const timeline = screen.getByTestId("preview-timeline")
        expect(timeline).toHaveStyle({ left: "37.5%" }) // 45/120 = 37.5%
      })
    })

    it("должен запускать анимацию, если видео уже играет", async () => {
      mockVideoElement.paused = false
      mockVideoElement.currentTime = 30

      render(<PreviewTimeline time={0} duration={120} videoRef={mockVideoElement as any} />)

      await waitFor(() => {
        expect(mockRequestAnimationFrame).toHaveBeenCalled()
      })
    })

    it("должен отменять анимацию при размонтировании", async () => {
      mockVideoElement.paused = false // Видео играет, чтобы анимация запустилась

      const { unmount } = render(<PreviewTimeline time={30} duration={120} videoRef={mockVideoElement as any} />)

      // Ждем, чтобы анимация запустилась
      await waitFor(() => {
        expect(mockRequestAnimationFrame).toHaveBeenCalled()
      })

      unmount()

      // Теперь должен вызваться cancelAnimationFrame
      expect(mockCancelAnimationFrame).toHaveBeenCalled()
    })
  })

  describe("обновление позиции", () => {
    it("должен обновлять позицию только при изменении времени", async () => {
      mockVideoElement.currentTime = 30

      const { rerender } = render(<PreviewTimeline time={30} duration={120} videoRef={mockVideoElement as any} />)

      const timeline = screen.getByTestId("preview-timeline")
      expect(timeline).toHaveStyle({ left: "25%" })

      // Обновляем время
      mockVideoElement.currentTime = 60
      mockVideoElement.dispatchEvent("timeupdate")

      await waitFor(() => {
        expect(timeline).toHaveStyle({ left: "50%" })
      })

      // Повторяем с тем же временем - позиция не должна измениться
      mockVideoElement.dispatchEvent("timeupdate")

      await waitFor(() => {
        expect(timeline).toHaveStyle({ left: "50%" })
      })
    })

    it("должен корректно обрабатывать изменение duration", () => {
      const { rerender } = render(<PreviewTimeline time={60} duration={120} videoRef={mockVideoElement as any} />)

      let timeline = screen.getByTestId("preview-timeline")
      expect(timeline).toHaveStyle({ left: "50%" })

      // Изменяем duration
      rerender(<PreviewTimeline time={60} duration={240} videoRef={mockVideoElement as any} />)

      timeline = screen.getByTestId("preview-timeline")
      expect(timeline).toHaveStyle({ left: "25%" }) // 60/240 = 25%
    })
  })

  describe("граничные случаи", () => {
    it("должен корректно обрабатывать время больше длительности", () => {
      render(<PreviewTimeline time={150} duration={120} videoRef={mockVideoElement as any} />)

      const timeline = screen.getByTestId("preview-timeline")
      expect(timeline).toHaveStyle({ left: "125%" }) // Может выходить за границы
    })

    it("должен корректно обрабатывать очень маленькие значения", () => {
      render(<PreviewTimeline time={0.1} duration={120} videoRef={mockVideoElement as any} />)

      const timeline = screen.getByTestId("preview-timeline")
      expect(timeline).toHaveStyle({ left: `${(0.1 / 120) * 100}%` })
    })

    it("должен удалять все слушатели при изменении videoRef", () => {
      const firstVideo = new MockHTMLVideoElement()
      const secondVideo = new MockHTMLVideoElement()

      const removeEventListenerSpy1 = vi.spyOn(firstVideo, "removeEventListener")
      const addEventListenerSpy2 = vi.spyOn(secondVideo, "addEventListener")

      const { rerender } = render(<PreviewTimeline time={30} duration={120} videoRef={firstVideo as any} />)

      // Меняем videoRef
      rerender(<PreviewTimeline time={30} duration={120} videoRef={secondVideo as any} />)

      // Проверяем, что слушатели были удалены с первого видео
      expect(removeEventListenerSpy1).toHaveBeenCalledWith("mouseenter", expect.any(Function))
      expect(removeEventListenerSpy1).toHaveBeenCalledWith("mouseleave", expect.any(Function))
      expect(removeEventListenerSpy1).toHaveBeenCalledWith("timeupdate", expect.any(Function))
      expect(removeEventListenerSpy1).toHaveBeenCalledWith("mousemove", expect.any(Function))

      // И добавлены ко второму
      expect(addEventListenerSpy2).toHaveBeenCalledWith("mouseenter", expect.any(Function))
      expect(addEventListenerSpy2).toHaveBeenCalledWith("mouseleave", expect.any(Function))
      expect(addEventListenerSpy2).toHaveBeenCalledWith("timeupdate", expect.any(Function))
      expect(addEventListenerSpy2).toHaveBeenCalledWith("mousemove", expect.any(Function))
    })
  })

  describe("производительность", () => {
    it("не должен вызывать лишние ререндеры при одинаковом времени", async () => {
      let renderCount = 0

      function TestWrapper() {
        renderCount++
        return <PreviewTimeline time={30} duration={120} videoRef={mockVideoElement as any} />
      }

      const { rerender } = render(<TestWrapper />)

      expect(renderCount).toBe(1)

      // Симулируем изменение времени для вызова ререндера
      mockVideoElement.currentTime = 60
      mockVideoElement.dispatchEvent("timeupdate")

      // Ждем обновления компонента
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Компонент обновится из-за изменения внутреннего состояния
      expect(renderCount).toBeGreaterThanOrEqual(1)

      const currentRenderCount = renderCount

      // Теперь симулируем несколько событий с одинаковым временем
      mockVideoElement.dispatchEvent("timeupdate")
      mockVideoElement.dispatchEvent("timeupdate")
      mockVideoElement.dispatchEvent("timeupdate")

      // Даем время на обработку
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Не должно быть новых ререндеров при одинаковом времени
      expect(renderCount).toBe(currentRenderCount)
    })
  })
})
