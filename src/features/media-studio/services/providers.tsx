"use client"

import { ReactNode } from "react"

import { ChatProvider } from "@/features/ai-chat/services/chat-provider"
import { AppSettingsProvider } from "@/features/app-state"
import { BrowserStateProvider } from "@/features/browser"
import { ShortcutsProvider } from "@/features/keyboard-shortcuts"
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
// ВАЖНО: Порядок провайдеров имеет значение!
// ShortcutsProvider зависит от UserSettingsProvider и должен идти после него
const AppProvider = composeProviders(
  I18nProvider,
  ThemeProvider,
  ModalProvider,
  AppSettingsProvider,
  BrowserStateProvider,
  ProjectSettingsProvider,
  UserSettingsProvider,
  ShortcutsProvider, // Зависит от UserSettingsProvider
  ResourcesProvider,
  TimelineProvider,
  PlayerProvider,
  ChatProvider,
)

export function Providers({ children }: ProvidersProps) {
  return <AppProvider>{children}</AppProvider>
}
