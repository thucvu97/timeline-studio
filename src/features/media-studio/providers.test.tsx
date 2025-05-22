import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Providers } from "./providers"

// Мокаем провайдеры
vi.mock("@/features/modals/services/modal-provider", () => ({
  ModalProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="modal-provider">{children}</div>,
}))

vi.mock("@/i18n/i18n-provider", () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="i18n-provider">{children}</div>,
}))

vi.mock("@/features/app-state/app-settings-provider", () => ({
  AppSettingsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-settings-provider">{children}</div>
  ),
}))

vi.mock("@/features/modals/features/project-settings/project-settings-provider", () => ({
  ProjectSettingsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="project-settings-provider">{children}</div>
  ),
}))

vi.mock("@/features/browser/components/tabs/music/music-provider", () => ({
  MusicProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="music-provider">{children}</div>,
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
    // I18nProvider -> ModalProvider -> BrowserVisibilityProvider -> ProjectSettingsProvider -> MusicProvider -> TestComponent
    expect(html).toContain('data-testid="i18n-provider"')
    expect(html).toContain('data-testid="modal-provider"')
    expect(html).toContain('data-testid="project-settings-provider"')
    expect(html).toContain('data-testid="music-provider"')
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
    const { container } = render(
      <Providers>
        <TestComponent />
      </Providers>,
    )

    // Проверяем, что все провайдеры присутствуют в DOM
    expect(container.querySelector('[data-testid="i18n-provider"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="modal-provider"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="project-settings-provider"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="music-provider"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="test-component"]')).toBeInTheDocument()
  })
})
