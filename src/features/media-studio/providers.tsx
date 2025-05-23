"use client"

import { ReactNode } from "react"

import { MusicProvider } from "@/features/browser/components/tabs/music/music-provider"
import { ResourcesProvider } from "@/features/browser/resources/resources-provider"
import { ModalProvider } from "@/features/modals/services/modal-provider"
import { I18nProvider } from "@/i18n/i18n-provider"

import { AppSettingsProvider } from "../app-state/app-settings-provider"
import { PreviewSizeProvider } from "../browser/components/preview/preview-size-provider"
import { TemplateListProvider } from "../browser/components/tabs/templates/template-list-provider"
import { MediaProvider } from "../browser/media"
import { ChatProvider } from "../chat/services/chat-provider"
import { ProjectSettingsProvider } from "../modals/features/project-settings/project-settings-provider"
import { UserSettingsProvider } from "../modals/features/user-settings/user-settings-provider"
import { PlayerProvider } from "../video-player/components/player-provider"

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
