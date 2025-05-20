"use client"

import { ReactNode } from "react"

import { MusicProvider } from "@/features/browser/components/tabs/music/music-provider"
import { BrowserVisibilityProvider } from "@/features/browser/providers/browser-visibility-provider"
import { ResourcesProvider } from "@/features/browser/resources/resources-provider"
import { ModalProvider } from "@/features/modals/services/modal-provider"
import { ProjectSettingsProvider } from "@/features/project-settings/project-settings-provider"
import { UserSettingsProvider } from "@/features/user-settings/user-settings-provider"
import { I18nProvider } from "@/i18n/i18n-provider"

import { MediaProvider } from "../browser/media"

interface ProvidersProps {
  children: ReactNode
}

// Создаем композитный провайдер для уменьшения вложенности
const composeProviders = (
  ...providers: React.ComponentType<{ children: ReactNode }>[]
) => {
  return ({ children }: { children: ReactNode }) => {
    return providers.reduceRight(
      (child, Provider) => <Provider>{child}</Provider>,
      children,
    )
  }
}

// Создаем единый провайдер из всех контекстов
const AppProvider = composeProviders(
  I18nProvider,
  ModalProvider,
  BrowserVisibilityProvider,
  ProjectSettingsProvider,
  UserSettingsProvider,
  ResourcesProvider,
  MusicProvider,
  MediaProvider,
)

export function Providers({ children }: ProvidersProps) {
  return <AppProvider>{children}</AppProvider>
}
