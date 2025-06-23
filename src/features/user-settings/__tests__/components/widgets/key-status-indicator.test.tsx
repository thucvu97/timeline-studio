import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { KeyStatusIndicator } from "../../../components/widgets/key-status-indicator"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}))
vi.mock("lucide-react", () => ({
  CheckCircle: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      CheckCircle
    </span>
  ),
  Loader2: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      Loader2
    </span>
  ),
  XCircle: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      XCircle
    </span>
  ),
}))

describe("KeyStatusIndicator", () => {
  it("should render not_set status correctly", () => {
    render(<KeyStatusIndicator status="not_set" />)

    expect(screen.getByText("Не настроено")).toBeInTheDocument()

    const container = screen.getByText("Не настроено").parentElement
    expect(container).toHaveClass("text-gray-400")
    expect(container).toHaveClass("bg-gray-100")

    const icon = container?.querySelector("span[role='img']")
    expect(icon).not.toBeInTheDocument()
  })

  it("should render testing status with spinner", () => {
    render(<KeyStatusIndicator status="testing" />)

    expect(screen.getByText("Проверка...")).toBeInTheDocument()

    const container = screen.getByText("Проверка...").parentElement
    expect(container).toHaveClass("text-blue-600")
    expect(container).toHaveClass("bg-blue-100")

    const spinner = container?.querySelector(".animate-spin")
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass("h-3", "w-3")
  })

  it("should render invalid status with X icon", () => {
    render(<KeyStatusIndicator status="invalid" />)

    expect(screen.getByText("Ошибка")).toBeInTheDocument()

    const container = screen.getByText("Ошибка").parentElement
    expect(container).toHaveClass("text-red-600")
    expect(container).toHaveClass("bg-red-100")

    const icon = container?.querySelector("span[role='img']")
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveClass("h-3")
    expect(icon).toHaveClass("w-3")
  })

  it("should render valid status with check icon", () => {
    render(<KeyStatusIndicator status="valid" />)

    expect(screen.getByText("Работает")).toBeInTheDocument()

    const container = screen.getByText("Работает").parentElement
    expect(container).toHaveClass("text-green-600")
    expect(container).toHaveClass("bg-green-100")

    const icon = container?.querySelector("span[role='img']")
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveClass("h-3")
    expect(icon).toHaveClass("w-3")
  })

  it("should apply custom className", () => {
    render(<KeyStatusIndicator status="valid" className="custom-class" />)

    const container = screen.getByText("Работает").parentElement
    expect(container).toHaveClass("custom-class")
  })

  it("should have correct base styles", () => {
    render(<KeyStatusIndicator status="not_set" />)

    const container = screen.getByText("Не настроено").parentElement
    expect(container).toHaveClass("inline-flex")
    expect(container).toHaveClass("items-center")
    expect(container).toHaveClass("gap-1.5")
    expect(container).toHaveClass("px-2")
    expect(container).toHaveClass("py-1")
    expect(container).toHaveClass("rounded-full")
    expect(container).toHaveClass("text-xs")
    expect(container).toHaveClass("font-medium")
  })

  it("should handle unknown status gracefully", () => {
    // @ts-expect-error Testing invalid status
    render(<KeyStatusIndicator status="unknown" />)

    expect(screen.getByText("Unknown")).toBeInTheDocument()

    const container = screen.getByText("Unknown").parentElement
    expect(container).toHaveClass("text-gray-400")
    expect(container).toHaveClass("bg-gray-100")
  })

  it("should render status text inside span element", () => {
    render(<KeyStatusIndicator status="valid" />)

    const textElement = screen.getByText("Работает")
    expect(textElement.tagName).toBe("SPAN")
  })

  it("should maintain consistent container structure for all statuses", () => {
    const statuses: Array<"not_set" | "testing" | "invalid" | "valid"> = ["not_set", "testing", "invalid", "valid"]

    statuses.forEach((status) => {
      const { container } = render(<KeyStatusIndicator status={status} />)
      const indicatorDiv = container.firstElementChild

      expect(indicatorDiv).toBeInTheDocument()
      expect(indicatorDiv?.tagName).toBe("DIV")
      expect(indicatorDiv?.children.length).toBeGreaterThanOrEqual(1)
    })
  })

  it("should render with correct structure when icon is present", () => {
    render(<KeyStatusIndicator status="valid" />)

    const container = screen.getByText("Работает").parentElement
    const children = Array.from(container?.children || [])

    expect(children).toHaveLength(2)
    expect(children[0].tagName).toBe("SPAN")
    expect(children[0]).toHaveAttribute("role", "img")
    expect(children[1].tagName).toBe("SPAN")
  })

  it("should render with correct structure when icon is not present", () => {
    render(<KeyStatusIndicator status="not_set" />)

    const container = screen.getByText("Не настроено").parentElement
    const children = Array.from(container?.children || [])

    expect(children).toHaveLength(1)
    expect(children[0].tagName).toBe("SPAN")
  })

  it("should use translation keys correctly", () => {
    // The mock is already set up at the top of the file, so we just need to verify the text
    render(<KeyStatusIndicator status="not_set" />)
    render(<KeyStatusIndicator status="testing" />)
    render(<KeyStatusIndicator status="invalid" />)
    render(<KeyStatusIndicator status="valid" />)

    expect(screen.getByText("Не настроено")).toBeInTheDocument()
    expect(screen.getByText("Проверка...")).toBeInTheDocument()
    expect(screen.getByText("Ошибка")).toBeInTheDocument()
    expect(screen.getByText("Работает")).toBeInTheDocument()
  })

  it("should have proper accessibility structure", () => {
    const { container } = render(<KeyStatusIndicator status="valid" />)

    const indicator = container.firstElementChild
    expect(indicator).toBeInTheDocument()

    const icon = indicator?.querySelector("span[role='img']")
    expect(icon).toHaveAttribute("aria-hidden", "true")
  })
})
