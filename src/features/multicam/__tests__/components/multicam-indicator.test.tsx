import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import "@testing-library/jest-dom"

import "@/test/mocks/libraries/lucide-react"
import { MulticamIndicator } from "../../components/multicam-indicator"

describe("MulticamIndicator", () => {
  describe("основной рендеринг", () => {
    it("должен возвращать null когда только одна камера", () => {
      const { container } = render(<MulticamIndicator currentAngle={0} totalAngles={1} />)

      expect(container.firstChild).toBeNull()
    })

    it("должен возвращать null когда нет камер", () => {
      const { container } = render(<MulticamIndicator currentAngle={0} totalAngles={0} />)

      expect(container.firstChild).toBeNull()
    })

    it("должен отображать индикатор с номером текущей камеры", () => {
      render(<MulticamIndicator currentAngle={0} totalAngles={3} />)

      // Проверяем иконку камеры по data-testid
      expect(screen.getByTestId("camera-icon")).toBeInTheDocument()

      // Проверяем отображение номера камеры (currentAngle + 1)
      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("/")).toBeInTheDocument()
      expect(screen.getByText("3")).toBeInTheDocument()
    })

    it("должен корректно отображать разные индексы камер", () => {
      const { rerender } = render(<MulticamIndicator currentAngle={1} totalAngles={4} />)

      // Проверяем текущий номер камеры
      const currentCameraNumber = screen.getByText("2", { selector: ".font-bold" })
      expect(currentCameraNumber).toBeInTheDocument()

      // Проверяем общее количество камер
      const totalCameras = screen.getByText("4", { selector: "span:not(.font-bold)" })
      expect(totalCameras).toBeInTheDocument()

      rerender(<MulticamIndicator currentAngle={3} totalAngles={4} />)

      // После перерендера проверяем новый номер камеры
      const newCameraNumber = screen.getByText("4", { selector: ".font-bold" })
      expect(newCameraNumber).toBeInTheDocument()
    })
  })

  describe("отображение имени камеры", () => {
    it("должен отображать имя камеры когда оно передано", () => {
      render(<MulticamIndicator currentAngle={0} totalAngles={2} angleName="Front Camera" />)

      expect(screen.getByText("Front Camera")).toBeInTheDocument()
      const frontCameraText = screen.getByText("Front Camera")
      expect(frontCameraText).toHaveClass("text-sm")
      expect(frontCameraText).toHaveClass("text-muted-foreground")
    })

    it("не должен отображать имя камеры когда оно не передано", () => {
      render(<MulticamIndicator currentAngle={0} totalAngles={2} />)

      expect(screen.queryByText("Front Camera")).not.toBeInTheDocument()
    })
  })

  describe("кастомные классы", () => {
    it("должен применять кастомные классы к контейнеру", () => {
      render(<MulticamIndicator currentAngle={0} totalAngles={2} className="custom-class-1 custom-class-2" />)

      const container = screen.getByText("1").closest(".flex")
      expect(container).toHaveClass("custom-class-1")
      expect(container).toHaveClass("custom-class-2")
      // Также должны сохраняться базовые классы
      expect(container).toHaveClass("flex")
      expect(container).toHaveClass("items-center")
      expect(container).toHaveClass("gap-2")
    })
  })

  describe("граничные случаи", () => {
    it("должен корректно обрабатывать отрицательные значения", () => {
      const { container } = render(<MulticamIndicator currentAngle={-1} totalAngles={-5} />)

      // При отрицательных значениях totalAngles компонент возвращает null
      expect(container.firstChild).toBeNull()
    })

    it("должен корректно отображать большие номера камер", () => {
      render(<MulticamIndicator currentAngle={99} totalAngles={100} />)

      // Проверяем текущий номер камеры (100)
      const currentCameraNumber = screen.getByText("100", { selector: ".font-bold" })
      expect(currentCameraNumber).toBeInTheDocument()

      // Проверяем общее количество камер (100)
      const totalCameras = screen.getByText("100", { selector: "span:not(.font-bold)" })
      expect(totalCameras).toBeInTheDocument()
    })

    it("должен корректно отображать длинные имена камер", () => {
      const longName = "Very Long Camera Name That Should Still Be Displayed Correctly"
      render(<MulticamIndicator currentAngle={0} totalAngles={2} angleName={longName} />)

      expect(screen.getByText(longName)).toBeInTheDocument()
    })
  })

  describe("структура компонента", () => {
    it("должен иметь правильную структуру DOM", () => {
      render(<MulticamIndicator currentAngle={1} totalAngles={3} angleName="Test Camera" />)

      // Контейнер
      const container = screen.getByText("2").closest(".flex")
      expect(container).toBeInTheDocument()

      // Иконка камеры
      const icon = container?.querySelector("svg")
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass("w-4")
      expect(icon).toHaveClass("h-4")
      expect(icon).toHaveClass("text-muted-foreground")

      // Badge с номерами
      const badge = screen.getByText("2").closest(".gap-1")
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass("gap-1")

      // Проверяем что номер текущей камеры имеет класс font-bold
      const currentNumber = screen.getByText("2")
      expect(currentNumber).toHaveClass("font-bold")

      // Разделитель
      const separator = screen.getByText("/")
      expect(separator).toHaveClass("text-muted-foreground")
    })
  })
})
