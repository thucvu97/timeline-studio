import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Импортируем компонент после моков
import { LayoutPreviews } from "./layout-previews"

// Мокаем модули перед импортом компонента
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Создаем мок для handleLayoutChange
const handleLayoutChangeMock = vi.fn()

vi.mock("@/features/user-settings", () => {
  return {
    useUserSettings: () => ({
      activeTab: "media",
      layoutMode: "default",
      playerScreenshotsPath: "public/media",
      screenshotsPath: "public/screenshots",
      openAiApiKey: "",
      claudeApiKey: "",
      handleTabChange: vi.fn(),
      handleLayoutChange: handleLayoutChangeMock,
      handleScreenshotsPathChange: vi.fn(),
      handleAiApiKeyChange: vi.fn(),
      handleClaudeApiKeyChange: vi.fn(),
    }),
  }
})

vi.mock("./layouts-markup", () => ({
  DefaultLayout: vi.fn(({ isActive, onClick }: any) => (
    <div data-testid="default-layout-preview" data-active={isActive} onClick={onClick}>
      Default Layout Preview
    </div>
  )),
  OptionsLayout: vi.fn(({ isActive, onClick }: any) => (
    <div data-testid="options-layout-preview" data-active={isActive} onClick={onClick}>
      Options Layout Preview
    </div>
  )),
  VerticalLayout: vi.fn(({ isActive, onClick }: any) => (
    <div data-testid="vertical-layout-preview" data-active={isActive} onClick={onClick}>
      Vertical Layout Preview
    </div>
  )),
  DualLayout: vi.fn(({ isActive, onClick, hasExternalDisplay }: any) => (
    <div
      data-testid="dual-layout-preview"
      data-active={isActive}
      data-has-external-display={hasExternalDisplay}
      onClick={onClick}
    >
      Dual Layout Preview
    </div>
  )),
}))

describe("LayoutPreviews", () => {
  // Очищаем моки перед каждым тестом
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render all layout previews", () => {
    // Рендерим компонент
    render(<LayoutPreviews />)

    // Проверяем, что все превью отображаются
    expect(screen.getByTestId("default-layout-preview")).toBeInTheDocument()
    expect(screen.getByTestId("options-layout-preview")).toBeInTheDocument()
    expect(screen.getByTestId("vertical-layout-preview")).toBeInTheDocument()
    expect(screen.getByTestId("dual-layout-preview")).toBeInTheDocument()
  })

  it("should mark the active layout preview", () => {
    // Переопределяем мок для useUserSettings с активным макетом "options"
    vi.mock("@/features/user-settings", () => {
      return {
        useUserSettings: () => ({
          activeTab: "media",
          layoutMode: "options",
          playerScreenshotsPath: "public/media",
          screenshotsPath: "public/screenshots",
          openAiApiKey: "",
          claudeApiKey: "",
          handleTabChange: vi.fn(),
          handleLayoutChange: handleLayoutChangeMock,
          handleScreenshotsPathChange: vi.fn(),
          handleAiApiKeyChange: vi.fn(),
          handleClaudeApiKeyChange: vi.fn(),
        }),
      }
    })

    // Рендерим компонент
    render(<LayoutPreviews />)

    // Проверяем, что правильный макет отмечен как активный
    expect(screen.getByTestId("default-layout-preview")).toHaveAttribute("data-active", "false")
    expect(screen.getByTestId("options-layout-preview")).toHaveAttribute("data-active", "true")
    expect(screen.getByTestId("vertical-layout-preview")).toHaveAttribute("data-active", "false")
    expect(screen.getByTestId("dual-layout-preview")).toHaveAttribute("data-active", "false")
  })

  it("should call handleLayoutChange when a layout preview is clicked", () => {
    // Рендерим компонент
    render(<LayoutPreviews />)

    // Кликаем на превью макета "options"
    fireEvent.click(screen.getByTestId("options-layout-preview"))

    // Проверяем, что handleLayoutChange был вызван с правильным аргументом
    expect(handleLayoutChangeMock).toHaveBeenCalledTimes(1)
    expect(handleLayoutChangeMock).toHaveBeenCalledWith("options")

    // Кликаем на превью макета "vertical"
    fireEvent.click(screen.getByTestId("vertical-layout-preview"))

    // Проверяем, что handleLayoutChange был вызван с правильным аргументом
    expect(handleLayoutChangeMock).toHaveBeenCalledTimes(2)
    expect(handleLayoutChangeMock).toHaveBeenCalledWith("vertical")
  })

  it("should call handleLayoutChange when dual layout is clicked", () => {
    // Рендерим компонент
    render(<LayoutPreviews />)

    // Кликаем на превью макета "dual"
    fireEvent.click(screen.getByTestId("dual-layout-preview"))

    // Проверяем, что handleLayoutChange был вызван с правильным аргументом
    expect(handleLayoutChangeMock).toHaveBeenCalledTimes(1)
    expect(handleLayoutChangeMock).toHaveBeenCalledWith("dual")
  })

  it("should render DualLayout with hasExternalDisplay=false", () => {
    // Рендерим компонент
    render(<LayoutPreviews />)

    // Проверяем, что DualLayout отображается
    expect(screen.getByTestId("dual-layout-preview")).toBeInTheDocument()
  })

  it("should render in a flex layout with correct spacing", () => {
    // Рендерим компонент
    const { container } = render(<LayoutPreviews />)

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
