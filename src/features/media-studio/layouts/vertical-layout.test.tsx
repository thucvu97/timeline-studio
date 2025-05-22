import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useUserSettings } from "@/features/modals/features/user-settings/user-settings-provider"

import { VerticalLayout } from "./vertical-layout"

// Мокаем зависимости
vi.mock("@/features/modals/features/user-settings/user-settings-provider")
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({
    children,
    direction,
    className,
    autoSaveId,
  }: any) => (
    <div
      data-testid={`resizable-panel-group-${autoSaveId}`}
      data-direction={direction}
      className={className}
    >
      {children}
    </div>
  ),
  ResizablePanel: ({ children, defaultSize, minSize, maxSize }: any) => (
    <div
      data-testid="resizable-panel"
      data-default-size={defaultSize}
      data-min-size={minSize}
      data-max-size={maxSize}
    >
      {children}
    </div>
  ),
  ResizableHandle: () => <div data-testid="resizable-handle" />,
}))

vi.mock("@/features/browser/components/browser", () => ({
  Browser: () => <div data-testid="browser">Browser Component</div>,
}))

vi.mock("@/features/options/components/options", () => ({
  Options: () => <div data-testid="options">Options Component</div>,
}))

vi.mock("@/features/timeline/components/timeline", () => ({
  Timeline: () => <div data-testid="timeline">Timeline Component</div>,
}))

vi.mock("@/features/video-player/components/video-player", () => ({
  VideoPlayer: () => (
    <div data-testid="video-player">Video Player Component</div>
  ),
}))

describe("VerticalLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render with browser visible", () => {
    // Мокаем useUserSettings, чтобы вернуть isBrowserVisible = true
    vi.mocked(useUserSettings).mockReturnValue({
      isBrowserVisible: true,
      toggleBrowserVisibility: vi.fn(),
    })

    // Рендерим компонент
    render(<VerticalLayout />)

    // Проверяем, что основная группа панелей отрендерена
    expect(
      screen.getByTestId("resizable-panel-group-vertical-main-layout"),
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("resizable-panel-group-vertical-main-layout"),
    ).toHaveAttribute("data-direction", "horizontal")

    // Проверяем, что вложенные группы панелей отрендерены
    expect(
      screen.getByTestId("resizable-panel-group-vertical-left-layout"),
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("resizable-panel-group-vertical-left-layout"),
    ).toHaveAttribute("data-direction", "vertical")

    expect(
      screen.getByTestId("resizable-panel-group-vertical-top-layout"),
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("resizable-panel-group-vertical-top-layout"),
    ).toHaveAttribute("data-direction", "horizontal")

    // Проверяем, что компоненты отрендерены
    expect(screen.getByTestId("browser")).toBeInTheDocument()
    expect(screen.getByTestId("options")).toBeInTheDocument()
    expect(screen.getByTestId("timeline")).toBeInTheDocument()
    expect(screen.getByTestId("video-player")).toBeInTheDocument()

    // Проверяем, что разделители отрендерены
    expect(screen.getAllByTestId("resizable-handle").length).toBe(3)
  })

  it("should render without browser when browser is not visible", () => {
    // Мокаем useUserSettings, чтобы вернуть isBrowserVisible = false
    vi.mocked(useUserSettings).mockReturnValue({
      isBrowserVisible: false,
      toggleBrowserVisibility: vi.fn(),
    })

    // Рендерим компонент
    render(<VerticalLayout />)

    // Проверяем, что основная группа панелей отрендерена
    expect(
      screen.getByTestId("resizable-panel-group-vertical-main-layout"),
    ).toBeInTheDocument()

    // Проверяем, что компонент браузера не отрендерен
    expect(screen.queryByTestId("browser")).not.toBeInTheDocument()

    // Проверяем, что остальные компоненты отрендерены
    expect(screen.getByTestId("options")).toBeInTheDocument()
    expect(screen.getByTestId("timeline")).toBeInTheDocument()
    expect(screen.getByTestId("video-player")).toBeInTheDocument()

    // Проверяем, что разделителей меньше (на один меньше, так как браузер не отображается)
    expect(screen.getAllByTestId("resizable-handle").length).toBe(2)
  })

  it("should have correct panel sizes", () => {
    // Мокаем useUserSettings, чтобы вернуть isBrowserVisible = true
    vi.mocked(useUserSettings).mockReturnValue({
      isBrowserVisible: true,
      toggleBrowserVisibility: vi.fn(),
    })

    // Рендерим компонент
    render(<VerticalLayout />)

    // Получаем все панели
    const panels = screen.getAllByTestId("resizable-panel")

    // Проверяем, что у первой панели (левой) правильные размеры
    expect(panels[0]).toHaveAttribute("data-default-size", "67")
    expect(panels[0]).toHaveAttribute("data-min-size", "50")
    expect(panels[0]).toHaveAttribute("data-max-size", "80")

    // Проверяем, что у панели видеоплеера правильные размеры
    const videoPanel = panels[panels.length - 1]
    expect(videoPanel).toHaveAttribute("data-default-size", "33")
  })
})
