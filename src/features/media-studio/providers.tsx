"use client"

import { ReactNode } from "react"

import { BrowserVisibilityProvider } from "@/features/browser/providers/browser-visibility-provider"
import { ModalProvider } from "@/features/modals/services/modal-provider"
import { I18nProvider } from "@/i18n/i18n-provider"

import { ProjectSettingsProvider } from "../project-settings/project-settings-provider"
import { UserSettingsProvider } from "../user-settings/user-settings-provider"

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
)

export function Providers({ children }: ProvidersProps) {
  return <AppProvider>{children}</AppProvider>
}
