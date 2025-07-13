"use client"

import { ReactNode } from "react"

import { ChatProvider } from "@/features/ai-chat/services/chat-provider"
import { AIIntelligenceProvider } from "@/features/ai-content-intelligence"
import { AppSettingsProvider } from "@/features/app-state"
import { BrowserStateProvider } from "@/features/browser/services/browser-state-provider"
import { ShortcutsProvider } from "@/features/keyboard-shortcuts"
import { TauriMockProvider } from "@/features/media-studio/services/tauri-mock-provider"
import { ModalProvider } from "@/features/modals/services/modal-provider"
import { ProjectSettingsProvider } from "@/features/project-settings"
import { ResourcesProvider } from "@/features/resources/services/resources-provider"
import { TimelineProvider } from "@/features/timeline/services/timeline-provider"
import { ThemeProvider } from "@/features/top-bar/components/theme/theme-context"
import { UserSettingsProvider } from "@/features/user-settings"
import { PlayerProvider } from "@/features/video-player/services/player-provider"
import { I18nProvider } from "@/i18n/services/i18n-provider"

interface ProvidersProps {
  children: ReactNode
}

// Создаем композитный провайдер для уменьшения вложенности
const composeProviders = (...providers: React.ComponentType<{ children: ReactNode }>[]) => {
  return ({ children }: { children: ReactNode }) => {
    return providers.reduceRight((child, Provider) => <Provider>{child}</Provider>, children)
  }
}

// Создаем единый провайдер из всех контекстов
// ВАЖНО: Порядок провайдеров оптимизирован для производительности!
// Легкие провайдеры первыми, тяжелые - последними
const AppProvider = composeProviders(
  TauriMockProvider, // Должен быть первым для инициализации моков
  I18nProvider, // Легкий провайдер для локализации
  ThemeProvider, // Легкий провайдер для темы
  ModalProvider, // Легкий провайдер для модальных окон
  AppSettingsProvider, // Основной провайдер настроек (оптимизирован)
  UserSettingsProvider, // Пользовательские настройки
  ProjectSettingsProvider, // Настройки проекта
  ShortcutsProvider, // Зависит от UserSettingsProvider
  ResourcesProvider, // Ресурсы (оптимизированы с кэшированием)
  BrowserStateProvider, // Состояние браузера
  TimelineProvider, // Тяжелый провайдер для таймлайна
  PlayerProvider, // Провайдер видеоплеера
  ChatProvider, // AI чат
  AIIntelligenceProvider, // AI Intelligence (может быть тяжелым)
)

export function Providers({ children }: ProvidersProps) {
  return <AppProvider>{children}</AppProvider>
}
