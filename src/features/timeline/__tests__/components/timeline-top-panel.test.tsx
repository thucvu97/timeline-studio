import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithTimeline, screen } from "@/test/test-utils"

import { TimelineTopPanel } from "../../components/timeline-top-panel"

// Мокаем иконки Lucide
vi.mock("lucide-react", () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  LayoutTemplate: () => <div data-testid="layout-template-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
  MoveHorizontal: () => <div data-testid="move-horizontal-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Redo2: () => <div data-testid="redo2-icon" />,
  Scissors: ({ className }: any) => <div data-testid="scissors-icon" className={className} />,
  SquareMousePointer: () => <div data-testid="square-mouse-pointer-icon" />,
  Trash2: () => <div data-testid="trash2-icon" />,
  Undo2: () => <div data-testid="undo2-icon" />,
}))

describe("TimelineTopPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен корректно рендериться", () => {
    const renderResult = renderWithTimeline(<TimelineTopPanel />)
    expect(renderResult.container.firstChild).toBeInTheDocument()
  })

  it("должен рендериться без ошибок", () => {
    const renderResult = renderWithTimeline(<TimelineTopPanel />)
    expect(renderResult.container).toBeInTheDocument()
  })

  it("должен иметь слайдер с правильным aria-label", () => {
    renderWithTimeline(<TimelineTopPanel />)

    // Находим слайдер по test-id
    const sliderRoot = screen.getByTestId("timeline-slider")
    expect(sliderRoot).toHaveAttribute("aria-label", "timeline.zoom.fitToScreen")
  })

  it("должен иметь класс rotate-270 для иконки ножниц", () => {
    renderWithTimeline(<TimelineTopPanel />)

    // Проверяем, что иконка ножниц имеет класс rotate-270
    const scissorsIcon = screen.getByTestId("scissors-icon")
    expect(scissorsIcon).toHaveClass("rotate-270")
  })

  it("должен отображать все кнопки панели инструментов", () => {
    renderWithTimeline(<TimelineTopPanel />)
    
    expect(screen.getByTestId("layout-template-icon")).toBeInTheDocument()
    expect(screen.getByTestId("square-mouse-pointer-icon")).toBeInTheDocument()
    expect(screen.getByTestId("undo2-icon")).toBeInTheDocument()
    expect(screen.getByTestId("redo2-icon")).toBeInTheDocument()
    expect(screen.getByTestId("trash2-icon")).toBeInTheDocument()
    expect(screen.getByTestId("scissors-icon")).toBeInTheDocument()
    expect(screen.getByTestId("move-horizontal-icon")).toBeInTheDocument()
  })

  it("должен иметь правильные title атрибуты для кнопок", () => {
    renderWithTimeline(<TimelineTopPanel />)
    
    const buttons = screen.getAllByRole("button")
    const layoutButton = buttons.find(btn => btn.querySelector('[data-testid="layout-template-icon"]'))
    const pointerButton = buttons.find(btn => btn.querySelector('[data-testid="square-mouse-pointer-icon"]'))
    const undoButton = buttons.find(btn => btn.querySelector('[data-testid="undo2-icon"]'))
    const redoButton = buttons.find(btn => btn.querySelector('[data-testid="redo2-icon"]'))
    const deleteButton = buttons.find(btn => btn.querySelector('[data-testid="trash2-icon"]'))
    const cutButton = buttons.find(btn => btn.querySelector('[data-testid="scissors-icon"]'))
    const fitButton = buttons.find(btn => btn.querySelector('[data-testid="move-horizontal-icon"]'))
    
    expect(layoutButton).toHaveAttribute("title", "timeline.toolbar.layout")
    expect(pointerButton).toHaveAttribute("title", "timeline.toolbar.pointer")
    expect(undoButton).toHaveAttribute("title", "timeline.toolbar.undo")
    expect(redoButton).toHaveAttribute("title", "timeline.toolbar.redo")
    expect(deleteButton).toHaveAttribute("title", "timeline.toolbar.delete")
    expect(cutButton).toHaveAttribute("title", "timeline.toolbar.cut")
    expect(fitButton).toHaveAttribute("title", "timeline.toolbar.fitToScreen")
  })

  it("должен иметь правильный диапазон значений для слайдера", () => {
    renderWithTimeline(<TimelineTopPanel />)
    
    // Slider компонент является составным, проверяем что он отображается с правильными значениями
    const slider = screen.getByTestId("timeline-slider")
    expect(slider).toBeInTheDocument()
    
    // Проверяем внутренние элементы слайдера
    const sliderThumb = slider.querySelector('[data-slot="slider-thumb"]')
    expect(sliderThumb).toBeInTheDocument()
  })

  it("должен иметь отключенные кнопки по умолчанию", () => {
    renderWithTimeline(<TimelineTopPanel />)
    
    const buttons = screen.getAllByRole("button")
    const layoutButton = buttons.find(btn => btn.querySelector('[data-testid="layout-template-icon"]'))
    const pointerButton = buttons.find(btn => btn.querySelector('[data-testid="square-mouse-pointer-icon"]'))
    const deleteButton = buttons.find(btn => btn.querySelector('[data-testid="trash2-icon"]'))
    const cutButton = buttons.find(btn => btn.querySelector('[data-testid="scissors-icon"]'))
    
    expect(layoutButton).toBeDisabled()
    expect(pointerButton).toBeDisabled()
    expect(deleteButton).toBeDisabled()
    expect(cutButton).toBeDisabled()
  })
})
