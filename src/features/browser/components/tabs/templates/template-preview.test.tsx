import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MediaTemplate } from "@/features/browser/components/tabs/templates/templates"

import { TemplatePreview } from "./template-preview"

// Мокаем useResources
const mockAddTemplate = vi.fn()
const mockRemoveResource = vi.fn()
const mockIsTemplateAdded = vi.fn()

vi.mock("@/features/browser/resources", () => ({
  useResources: () => ({
    addTemplate: mockAddTemplate,
    removeResource: mockRemoveResource,
    isTemplateAdded: mockIsTemplateAdded,
    templateResources: [{ id: "template-resource-1", resourceId: "template-1" }],
  }),
}))

// Мокаем FavoriteButton и AddMediaButton
vi.mock("../../layout", () => ({
  FavoriteButton: ({ file, size, type }: any) => (
    <div data-testid="favorite-button" data-file-id={file.id} data-size={size} data-type={type}>
      Favorite Button
    </div>
  ),
  AddMediaButton: ({ file, onAddMedia, onRemoveMedia, isAdded, size }: any) => (
    <div
      data-testid="add-media-button"
      data-file-id={file.id}
      data-is-added={isAdded ? "true" : "false"}
      data-size={size}
      onClick={(e) => (isAdded ? onRemoveMedia(e, file) : onAddMedia(e, file))}
    >
      {isAdded ? "Remove Media" : "Add Media"}
    </div>
  ),
}))

// Мокаем console.log
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "warn").mockImplementation(() => {})

describe("TemplatePreview", () => {
  // Создаем мок-шаблон для тестов
  const mockTemplate: MediaTemplate = {
    id: "template-1",
    split: "vertical",
    screens: 2,
    resizable: true,
    splitPosition: 50,
    render: () => <div data-testid="template-content">Template Content</div>,
  }

  const mockOnClick = vi.fn()
  const mockSize = 200
  const mockDimensions: [number, number] = [1920, 1080]

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsTemplateAdded.mockReturnValue(false)
  })

  it("should render the template preview correctly", () => {
    render(
      <TemplatePreview template={mockTemplate} onClick={mockOnClick} size={mockSize} dimensions={mockDimensions} />,
    )

    // Проверяем, что контент шаблона отрендерился
    expect(screen.getByTestId("template-content")).toBeInTheDocument()

    // Проверяем, что кнопка избранного отрендерилась
    expect(screen.getByTestId("favorite-button")).toBeInTheDocument()

    // Проверяем, что кнопка добавления отрендерилась
    expect(screen.getByTestId("add-media-button")).toBeInTheDocument()
  })

  it("should call onClick when clicked", () => {
    render(
      <TemplatePreview template={mockTemplate} onClick={mockOnClick} size={mockSize} dimensions={mockDimensions} />,
    )

    // Кликаем по компоненту
    const previewElement = screen.getByTestId("template-content").parentElement
    if (previewElement) {
      fireEvent.click(previewElement)
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    }
  })

  it("should add template when add button is clicked", () => {
    render(
      <TemplatePreview template={mockTemplate} onClick={mockOnClick} size={mockSize} dimensions={mockDimensions} />,
    )

    // Кликаем по кнопке добавления
    const addButton = screen.getByTestId("add-media-button")
    fireEvent.click(addButton)

    // Проверяем, что функция добавления шаблона была вызвана
    expect(mockAddTemplate).toHaveBeenCalledTimes(1)
    expect(mockAddTemplate).toHaveBeenCalledWith(mockTemplate)
  })

  it("should remove template when remove button is clicked", () => {
    // Устанавливаем, что шаблон уже добавлен
    mockIsTemplateAdded.mockReturnValue(true)

    render(
      <TemplatePreview template={mockTemplate} onClick={mockOnClick} size={mockSize} dimensions={mockDimensions} />,
    )

    // Кликаем по кнопке удаления
    const removeButton = screen.getByTestId("add-media-button")
    fireEvent.click(removeButton)

    // Проверяем, что функция удаления ресурса была вызвана
    expect(mockRemoveResource).toHaveBeenCalledTimes(1)
  })

  it("should calculate dimensions correctly for landscape template", () => {
    render(<TemplatePreview template={mockTemplate} onClick={mockOnClick} size={mockSize} dimensions={[1920, 1080]} />)

    // Проверяем, что размеры рассчитаны правильно
    const previewElement = screen.getByTestId("template-content").parentElement
    if (previewElement) {
      expect(previewElement).toHaveStyle({ width: `${mockSize}px` })
      expect(previewElement).toHaveStyle({
        height: `${mockSize * (1080 / 1920)}px`,
      })
    }
  })

  it("should calculate dimensions correctly for portrait template", () => {
    render(<TemplatePreview template={mockTemplate} onClick={mockOnClick} size={mockSize} dimensions={[1080, 1920]} />)

    // Проверяем, что размеры рассчитаны правильно для вертикального шаблона
    const previewElement = screen.getByTestId("template-content").parentElement
    if (previewElement) {
      expect(previewElement).toHaveStyle({
        width: `${mockSize * (1080 / 1920)}px`,
      })
      expect(previewElement).toHaveStyle({ height: `${mockSize}px` })
    }
  })
})
