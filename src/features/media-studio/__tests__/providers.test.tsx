import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Providers } from "../services/providers"

// Мокаем провайдеры
vi.mock("@/features/modals/services/modal-provider", () => ({
  ModalProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="modal-provider">{children}</div>,
  useModal: () => ({
    openModal: vi.fn(),
    closeModal: vi.fn(),
    isOpen: false,
  }),
}))

vi.mock("@/i18n/services/i18n-provider", () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="i18n-provider">{children}</div>,
}))

vi.mock("@/features/app-state", () => ({
  AppSettingsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-settings-provider">{children}</div>
  ),
}))

vi.mock("@/features/project-settings", () => ({
  ProjectSettingsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="project-settings-provider">{children}</div>
  ),
}))

// Добавляем моки для остальных провайдеров
vi.mock("@/features/user-settings", () => ({
  UserSettingsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="user-settings-provider">{children}</div>
  ),
  useUserSettings: () => ({
    openAiApiKey: "test-api-key",
    claudeApiKey: "test-claude-key",
    language: "en",
    theme: "dark",
    setLanguage: vi.fn(),
    setTheme: vi.fn(),
    setOpenAiApiKey: vi.fn(),
    setClaudeApiKey: vi.fn(),
  }),
}))

vi.mock("@/features/resources/services/resources-provider", () => ({
  ResourcesProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="resources-provider">{children}</div>
  ),
}))

vi.mock("@/features/browser", () => ({
  BrowserStateProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="browser-state-provider">{children}</div>
  ),
}))

vi.mock("@/features/video-player/services/player-provider", () => ({
  PlayerProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="player-provider">{children}</div>,
}))

vi.mock("@/features/ai-chat/services/chat-provider", () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="chat-provider">{children}</div>,
}))

vi.mock("@/features/timeline/services/timeline-provider", () => ({
  TimelineProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="timeline-provider">{children}</div>
  ),
}))

vi.mock("@/features/top-bar/components/theme/theme-context", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>,
}))

vi.mock("@/features/keyboard-shortcuts", () => ({
  ShortcutsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shortcuts-provider">{children}</div>
  ),
}))

describe("Providers", () => {
  // Очищаем моки перед каждым тестом
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render all providers in the correct order", () => {
    // Создаем тестовый компонент
    const TestComponent = () => <div data-testid="test-component">Test Component</div>

    // Рендерим компонент Providers с тестовым компонентом
    const { container } = render(
      <Providers>
        <TestComponent />
      </Providers>,
    )

    // Получаем HTML для проверки вложенности
    const html = container.innerHTML

    // Проверяем, что провайдеры вложены в правильном порядке
    // I18nProvider -> ModalProvider -> BrowserVisibilityProvider -> ProjectSettingsProvider -> TestComponent
    expect(html).toContain('data-testid="i18n-provider"')
    expect(html).toContain('data-testid="modal-provider"')
    expect(html).toContain('data-testid="project-settings-provider"')
    expect(html).toContain('data-testid="test-component"')

    // Проверяем порядок вложенности
    const i18nIndex = html.indexOf('data-testid="i18n-provider"')
    const modalIndex = html.indexOf('data-testid="modal-provider"')
    const projectSettingsIndex = html.indexOf('data-testid="project-settings-provider"')
    const componentIndex = html.indexOf('data-testid="test-component"')

    // I18nProvider должен быть самым внешним (первым в HTML)
    expect(i18nIndex).toBeLessThan(modalIndex)
    // ProjectSettingsProvider должен быть внутри BrowserVisibilityProvider, но снаружи TestComponent
    expect(projectSettingsIndex).toBeLessThan(componentIndex)
  })

  it("should render children correctly", () => {
    // Создаем тестовый компонент с уникальным содержимым
    const TestComponent = () => <div data-testid="test-component">Unique Content</div>

    // Рендерим компонент Providers с тестовым компонентом
    const { getByTestId } = render(
      <Providers>
        <TestComponent />
      </Providers>,
    )

    // Проверяем, что тестовый компонент отрендерился с правильным содержимым
    expect(getByTestId("test-component")).toHaveTextContent("Unique Content")
  })

  it("should compose providers using composeProviders function", () => {
    // Создаем тестовый компонент
    const TestComponent = () => <div data-testid="test-component">Test Component</div>

    // Рендерим компонент Providers с тестовым компонентом
    const renderResult = render(
      <Providers>
        <TestComponent />
      </Providers>,
    )

    // Проверяем, что все провайдеры присутствуют в DOM
    expect(renderResult.container.querySelector('[data-testid="i18n-provider"]')).toBeInTheDocument()
    expect(renderResult.container.querySelector('[data-testid="modal-provider"]')).toBeInTheDocument()
    expect(renderResult.container.querySelector('[data-testid="project-settings-provider"]')).toBeInTheDocument()
    expect(renderResult.container.querySelector('[data-testid="test-component"]')).toBeInTheDocument()
  })
})
