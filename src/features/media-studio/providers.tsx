"use client"

import { ReactNode } from "react"

import { AppSettingsProvider } from "@/features/app-state/app-settings-provider"
import { PreviewSizeProvider } from "@/features/browser/components/preview/preview-size-provider"
import { MusicProvider } from "@/features/browser/components/tabs/music/music-provider"
import { TemplateListProvider } from "@/features/browser/components/tabs/templates/services/template-list-provider"
import { MediaProvider } from "@/features/browser/media"
import { ResourcesProvider } from "@/features/browser/resources/resources-provider"
import { ChatProvider } from "@/features/chat/services/chat-provider"
import { ProjectSettingsProvider } from "@/features/modals/features/project-settings/project-settings-provider"
import { UserSettingsProvider } from "@/features/modals/features/user-settings/user-settings-provider"
import { ModalProvider } from "@/features/modals/services/modal-provider"
import { PlayerProvider } from "@/features/video-player/components/player-provider"
import { I18nProvider } from "@/i18n/i18n-provider"

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
const AppProvider = composeProviders(
  I18nProvider,
  ModalProvider,
  AppSettingsProvider, // Добавляем новый провайдер для централизованного хранилища
  ProjectSettingsProvider,
  UserSettingsProvider,
  ResourcesProvider,
  MusicProvider,
  MediaProvider,
  PreviewSizeProvider,
  TemplateListProvider,
  PlayerProvider,
  ChatProvider,
)

export function Providers({ children }: ProvidersProps) {
  return <AppProvider>{children}</AppProvider>
}
