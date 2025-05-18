import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LayoutMode, LayoutPreviews } from "./layout-previews"

// Мокаем компоненты превью макетов
vi.mock("./layouts-markup", () => ({
  DefaultLayout: ({ isActive, onClick }: any) => (
    <div
      data-testid="default-layout-preview"
      data-active={isActive}
      onClick={onClick}
    >
      Default Layout Preview
    </div>
  ),
  OptionsLayout: ({ isActive, onClick }: any) => (
    <div
      data-testid="options-layout-preview"
      data-active={isActive}
      onClick={onClick}
    >
      Options Layout Preview
    </div>
  ),
  VerticalLayout: ({ isActive, onClick }: any) => (
    <div
      data-testid="vertical-layout-preview"
      data-active={isActive}
      onClick={onClick}
    >
      Vertical Layout Preview
    </div>
  ),
  DualLayout: ({ isActive, onClick, hasExternalDisplay }: any) => (
    <div
      data-testid="dual-layout-preview"
      data-active={isActive}
      data-has-external-display={hasExternalDisplay}
      onClick={onClick}
    >
      Dual Layout Preview
    </div>
  ),
}))

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe("LayoutPreviews", () => {
  // Создаем мок для onLayoutChange
  const onLayoutChangeMock = vi.fn()

  // Очищаем моки перед каждым тестом
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render all layout previews", () => {
    // Рендерим компонент
    render(
      <LayoutPreviews
        onLayoutChange={onLayoutChangeMock}
        layoutMode="default"
        hasExternalDisplay={true}
      />,
    )

    // Проверяем, что все превью отображаются
    expect(screen.getByTestId("default-layout-preview")).toBeInTheDocument()
    expect(screen.getByTestId("options-layout-preview")).toBeInTheDocument()
    expect(screen.getByTestId("vertical-layout-preview")).toBeInTheDocument()
    expect(screen.getByTestId("dual-layout-preview")).toBeInTheDocument()
  })

  it("should mark the active layout preview", () => {
    // Рендерим компонент с активным макетом "options"
    render(
      <LayoutPreviews
        onLayoutChange={onLayoutChangeMock}
        layoutMode="options"
        hasExternalDisplay={true}
      />,
    )

    // Проверяем, что правильный макет отмечен как активный
    expect(screen.getByTestId("default-layout-preview")).toHaveAttribute(
      "data-active",
      "false",
    )
    expect(screen.getByTestId("options-layout-preview")).toHaveAttribute(
      "data-active",
      "true",
    )
    expect(screen.getByTestId("vertical-layout-preview")).toHaveAttribute(
      "data-active",
      "false",
    )
    expect(screen.getByTestId("dual-layout-preview")).toHaveAttribute(
      "data-active",
      "false",
    )
  })

  it("should call onLayoutChange when a layout preview is clicked", () => {
    // Рендерим компонент
    render(
      <LayoutPreviews
        onLayoutChange={onLayoutChangeMock}
        layoutMode="default"
        hasExternalDisplay={true}
      />,
    )

    // Кликаем на превью макета "options"
    fireEvent.click(screen.getByTestId("options-layout-preview"))

    // Проверяем, что onLayoutChange был вызван с правильным аргументом
    expect(onLayoutChangeMock).toHaveBeenCalledTimes(1)
    expect(onLayoutChangeMock).toHaveBeenCalledWith("options")

    // Кликаем на превью макета "vertical"
    fireEvent.click(screen.getByTestId("vertical-layout-preview"))

    // Проверяем, что onLayoutChange был вызван с правильным аргументом
    expect(onLayoutChangeMock).toHaveBeenCalledTimes(2)
    expect(onLayoutChangeMock).toHaveBeenCalledWith("vertical")
  })

  it("should call onLayoutChange when dual layout is clicked and hasExternalDisplay is true", () => {
    // Рендерим компонент с hasExternalDisplay=true
    render(
      <LayoutPreviews
        onLayoutChange={onLayoutChangeMock}
        layoutMode="default"
        hasExternalDisplay={true}
      />,
    )

    // Кликаем на превью макета "dual"
    fireEvent.click(screen.getByTestId("dual-layout-preview"))

    // Проверяем, что onLayoutChange был вызван с правильным аргументом
    expect(onLayoutChangeMock).toHaveBeenCalledTimes(1)
    expect(onLayoutChangeMock).toHaveBeenCalledWith("dual")
  })

  it("should not call onLayoutChange when dual layout is clicked and hasExternalDisplay is false", () => {
    // Рендерим компонент с hasExternalDisplay=false
    render(
      <LayoutPreviews
        onLayoutChange={onLayoutChangeMock}
        layoutMode="default"
        hasExternalDisplay={false}
      />,
    )

    // Проверяем, что dual layout имеет атрибут hasExternalDisplay=false
    expect(screen.getByTestId("dual-layout-preview")).toHaveAttribute(
      "data-has-external-display",
      "false",
    )

    // Кликаем на превью макета "dual"
    fireEvent.click(screen.getByTestId("dual-layout-preview"))

    // Проверяем, что onLayoutChange не был вызван
    expect(onLayoutChangeMock).not.toHaveBeenCalled()
  })

  it("should pass hasExternalDisplay prop to DualLayout", () => {
    // Рендерим компонент с hasExternalDisplay=true
    const { rerender } = render(
      <LayoutPreviews
        onLayoutChange={onLayoutChangeMock}
        layoutMode="default"
        hasExternalDisplay={true}
      />,
    )

    // Проверяем, что DualLayout получил hasExternalDisplay=true
    expect(screen.getByTestId("dual-layout-preview")).toHaveAttribute(
      "data-has-external-display",
      "true",
    )

    // Перерендериваем компонент с hasExternalDisplay=false
    rerender(
      <LayoutPreviews
        onLayoutChange={onLayoutChangeMock}
        layoutMode="default"
        hasExternalDisplay={false}
      />,
    )

    // Проверяем, что DualLayout получил hasExternalDisplay=false
    expect(screen.getByTestId("dual-layout-preview")).toHaveAttribute(
      "data-has-external-display",
      "false",
    )
  })

  it("should render in a flex layout with correct spacing", () => {
    // Рендерим компонент
    const { container } = render(
      <LayoutPreviews
        onLayoutChange={onLayoutChangeMock}
        layoutMode="default"
        hasExternalDisplay={true}
      />,
    )

    // Проверяем, что корневой элемент имеет правильные классы
    const rootElement = container.firstChild as HTMLElement
    expect(rootElement.className).toContain("flex")
    expect(rootElement.className).toContain("flex-col")
    expect(rootElement.className).toContain("gap-2")

    // Проверяем, что внутренние контейнеры имеют правильные классы
    const rowElements = container.querySelectorAll(".flex.justify-around.gap-2")
    expect(rowElements.length).toBe(2)
  })
})
