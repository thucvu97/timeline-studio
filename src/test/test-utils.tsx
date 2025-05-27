import { ReactElement, ReactNode } from "react"

import { RenderOptions, render } from "@testing-library/react"

import { ThemeProvider } from "@/components/theme/theme-context"
import { AppSettingsProvider } from "@/features/app-state"
import { MediaProvider } from "@/features/browser/media"
import { ModalProvider } from "@/features/modals/services/modal-provider"
import { ProjectSettingsProvider } from "@/features/project-settings"
import { ResourcesProvider } from "@/features/resources"
import { TimelineProvider } from "@/features/timeline/timeline-provider"
import { UserSettingsProvider } from "@/features/user-settings"
import { PlayerProvider } from "@/features/video-player/services/player-provider"
import { I18nProvider } from "@/i18n/i18n-provider"

// ✅ Базовые провайдеры (минимум для большинства компонентов)
export const BaseProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppSettingsProvider>{children}</AppSettingsProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}

// ✅ Провайдеры для медиа компонентов
export const MediaProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders>
      <ResourcesProvider>
        <MediaProvider>{children}</MediaProvider>
      </ResourcesProvider>
    </BaseProviders>
  )
}

// ✅ Провайдеры для видеоплеера
export const PlayerProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders>
      <PlayerProvider>{children}</PlayerProvider>
    </BaseProviders>
  )
}

// ✅ Провайдеры для Timeline
export const TimelineProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders>
      <TimelineProvider>{children}</TimelineProvider>
    </BaseProviders>
  )
}

// ✅ Провайдеры для модалов
export const ModalProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders>
      <ModalProvider>
        <ProjectSettingsProvider>
          <UserSettingsProvider>{children}</UserSettingsProvider>
        </ProjectSettingsProvider>
      </ModalProvider>
    </BaseProviders>
  )
}

const TemplateProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders>
      <ResourcesProvider>
        <MediaProvider>
          <PlayerProvider>{children}</PlayerProvider>
        </MediaProvider>
      </ResourcesProvider>
    </BaseProviders>
  )
}

// ✅ Специализированные функции рендеринга
export const renderWithBase = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: BaseProviders, ...options })

export const renderWithMedia = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: MediaProviders, ...options })

export const renderWithPlayer = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: PlayerProviders, ...options })

export const renderWithTimeline = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: TimelineProviders, ...options })

export const renderWithModal = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: ModalProviders, ...options })

export const renderWithTemplates = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: TemplateProviders, ...options })

// 🎯 Умная функция рендеринга (по умолчанию базовые провайдеры)
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: BaseProviders, ...options })

// Реэкспортируем только то, что нам нужно
export { screen, fireEvent, waitFor, within } from "@testing-library/react"

// Переопределение функции render (теперь с базовыми провайдерами)
export { customRender as render }

// Алиас для совместимости с существующими тестами
export { renderWithTemplates as renderWithProviders }
