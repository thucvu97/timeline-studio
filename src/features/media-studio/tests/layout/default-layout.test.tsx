import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useUserSettings } from "@/features/user-settings"

import { DefaultLayout } from "../../components/layout"


// Мокаем зависимости
vi.mock("@/features/user-settings")
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children, direction, className, autoSaveId }: any) => (
    <div data-testid={`resizable-panel-group-${autoSaveId}`} data-direction={direction} className={className}>
      {children}
    </div>
  ),
  ResizablePanel: ({ children, defaultSize, minSize, maxSize }: any) => (
    <div data-testid="resizable-panel" data-default-size={defaultSize} data-min-size={minSize} data-max-size={maxSize}>
      {children}
    </div>
  ),
  ResizableHandle: () => <div data-testid="resizable-handle" />,
}))

vi.mock("@/features/browser/components/browser", () => ({
  Browser: () => <div data-testid="browser">Browser Component</div>,
}))

vi.mock("@/features/timeline/components/timeline", () => ({
  Timeline: () => <div data-testid="timeline">Timeline Component</div>,
}))

vi.mock("@/features/video-player/components/video-player", () => ({
  VideoPlayer: () => <div data-testid="video-player">Video Player Component</div>,
}))

describe("DefaultLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render with browser visible", () => {
    // Мокаем useUserSettings, чтобы вернуть isBrowserVisible = true
    vi.mocked(useUserSettings).mockReturnValue({
      isBrowserVisible: true,
      toggleBrowserVisibility: vi.fn(),
    } as any)

    // Рендерим компонент
    render(<DefaultLayout />)

    // Проверяем, что основная группа панелей отрендерена
    expect(screen.getByTestId("resizable-panel-group-default-layout")).toBeInTheDocument()
    expect(screen.getByTestId("resizable-panel-group-default-layout")).toHaveAttribute("data-direction", "vertical")

    // Проверяем, что вложенная группа панелей отрендерена
    expect(screen.getByTestId("resizable-panel-group-top-layout")).toBeInTheDocument()
    expect(screen.getByTestId("resizable-panel-group-top-layout")).toHaveAttribute("data-direction", "horizontal")

    // Проверяем, что компоненты отрендерены
    expect(screen.getByTestId("browser")).toBeInTheDocument()
    expect(screen.getByTestId("video-player")).toBeInTheDocument()
    expect(screen.getByTestId("timeline")).toBeInTheDocument()

    // Проверяем, что разделители отрендерены
    expect(screen.getAllByTestId("resizable-handle").length).toBe(2)
  })

  it("should render without browser panel when browser is not visible", () => {
    // Мокаем useUserSettings, чтобы вернуть isBrowserVisible = false
    vi.mocked(useUserSettings).mockReturnValue({
      isBrowserVisible: false,
      toggleBrowserVisibility: vi.fn(),
    } as any)

    // Рендерим компонент
    render(<DefaultLayout />)

    // Проверяем, что основная группа панелей отрендерена
    expect(screen.getByTestId("resizable-panel-group-default-layout")).toBeInTheDocument()

    // Проверяем, что вложенная группа панелей не отрендерена
    expect(screen.queryByTestId("resizable-panel-group-top-layout")).not.toBeInTheDocument()

    // Проверяем, что компонент браузера не отрендерен
    expect(screen.queryByTestId("browser")).not.toBeInTheDocument()

    // Проверяем, что видеоплеер отрендерен напрямую
    expect(screen.getByTestId("video-player")).toBeInTheDocument()

    // Проверяем, что таймлайн отрендерен
    expect(screen.getByTestId("timeline")).toBeInTheDocument()

    // Проверяем, что разделителей меньше (только один между видеоплеером и таймлайном)
    expect(screen.getAllByTestId("resizable-handle").length).toBe(1)
  })

  it("should have correct panel sizes", () => {
    // Мокаем useUserSettings, чтобы вернуть isBrowserVisible = true
    vi.mocked(useUserSettings).mockReturnValue({
      isBrowserVisible: true,
      toggleBrowserVisibility: vi.fn(),
    } as any)

    // Рендерим компонент
    render(<DefaultLayout />)

    // Получаем все панели
    const panels = screen.getAllByTestId("resizable-panel")

    // Проверяем, что у первой панели (верхней) правильные размеры
    expect(panels[0]).toHaveAttribute("data-default-size", "50")
    expect(panels[0]).toHaveAttribute("data-min-size", "20")
    expect(panels[0]).toHaveAttribute("data-max-size", "80")

    // Проверяем, что у панели браузера правильные размеры
    const browserPanel = panels[1]
    expect(browserPanel).toHaveAttribute("data-default-size", "40")
    expect(browserPanel).toHaveAttribute("data-min-size", "10")
    expect(browserPanel).toHaveAttribute("data-max-size", "80")

    // Проверяем, что у панели видеоплеера правильные размеры
    const videoPanel = panels[2]
    expect(videoPanel).toHaveAttribute("data-default-size", "60")
    expect(videoPanel).toHaveAttribute("data-min-size", "20")
    expect(videoPanel).toHaveAttribute("data-max-size", "100")
  })
})
