import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Providers } from "../../services/providers"

// Мокаем все провайдеры
vi.mock("@/features/media-studio/services/tauri-mock-provider", () => ({
  TauriMockProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tauri-mock-provider">{children}</div>
  ),
}))

vi.mock("@/i18n/services/i18n-provider", () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="i18n-provider">{children}</div>,
}))

vi.mock("@/features/top-bar/components/theme/theme-context", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>,
}))

vi.mock("@/features/modals/services/modal-provider", () => ({
  ModalProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="modal-provider">{children}</div>,
}))

vi.mock("@/features/app-state", () => ({
  AppSettingsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-settings-provider">{children}</div>
  ),
}))

vi.mock("@/features/browser", () => ({
  BrowserStateProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="browser-state-provider">{children}</div>
  ),
}))

vi.mock("@/features/project-settings", () => ({
  ProjectSettingsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="project-settings-provider">{children}</div>
  ),
}))

vi.mock("@/features/user-settings", () => ({
  UserSettingsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="user-settings-provider">{children}</div>
  ),
}))

vi.mock("@/features/keyboard-shortcuts", () => ({
  ShortcutsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shortcuts-provider">{children}</div>
  ),
}))

vi.mock("@/features/resources/services/resources-provider", () => ({
  ResourcesProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="resources-provider">{children}</div>
  ),
}))

vi.mock("@/features/timeline/services/timeline-provider", () => ({
  TimelineProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="timeline-provider">{children}</div>
  ),
}))

vi.mock("@/features/video-player/services/player-provider", () => ({
  PlayerProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="player-provider">{children}</div>,
}))

vi.mock("@/features/ai-chat/services/chat-provider", () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="chat-provider">{children}</div>,
}))

describe("Providers", () => {
  it("должен рендерить все провайдеры в правильном порядке", () => {
    render(
      <Providers>
        <div data-testid="test-child">Test Content</div>
      </Providers>,
    )

    // Проверяем наличие основных провайдеров
    expect(screen.getByTestId("tauri-mock-provider")).toBeInTheDocument()
    expect(screen.getByTestId("i18n-provider")).toBeInTheDocument()
    expect(screen.getByTestId("theme-provider")).toBeInTheDocument()
    expect(screen.getByTestId("app-settings-provider")).toBeInTheDocument()
    expect(screen.getByTestId("browser-state-provider")).toBeInTheDocument()
    expect(screen.getByTestId("user-settings-provider")).toBeInTheDocument()
    expect(screen.getByTestId("resources-provider")).toBeInTheDocument()

    // Проверяем что дочерний компонент отрендерился
    expect(screen.getByTestId("test-child")).toBeInTheDocument()
    expect(screen.getByText("Test Content")).toBeInTheDocument()
  })

  it("должен правильно вкладывать провайдеры друг в друга", () => {
    const { container } = render(
      <Providers>
        <div>Test</div>
      </Providers>,
    )

    // Проверяем вложенность некоторых провайдеров
    const tauriProvider = container.querySelector('[data-testid="tauri-mock-provider"]')
    const themeProvider = container.querySelector('[data-testid="theme-provider"]')
    const userSettingsProvider = container.querySelector('[data-testid="user-settings-provider"]')

    expect(tauriProvider).toBeInTheDocument()
    expect(themeProvider).toBeInTheDocument()
    expect(userSettingsProvider).toBeInTheDocument()
  })

  it("должен передавать children через все провайдеры", () => {
    const TestComponent = () => <div data-testid="nested-component">Nested Content</div>

    render(
      <Providers>
        <TestComponent />
      </Providers>,
    )

    expect(screen.getByTestId("nested-component")).toBeInTheDocument()
    expect(screen.getByText("Nested Content")).toBeInTheDocument()
  })
})
