"use client";

import { ReactNode } from "react";

import { ChatProvider } from "@/features/ai-chat/services/chat-provider";
import { AppSettingsProvider } from "@/features/app-state";
import { MediaProvider } from "@/features/browser/media";
import { ModalProvider } from "@/features/modals/services/modal-provider";
import { ProjectSettingsProvider } from "@/features/project-settings";
import { ResourcesProvider } from "@/features/resources/services/resources-provider";
import { UserSettingsProvider } from "@/features/user-settings";
import { PlayerProvider } from "@/features/video-player/services/player-provider";
import { I18nProvider } from "@/i18n/i18n-provider";

interface ProvidersProps {
  children: ReactNode;
}

// Создаем композитный провайдер для уменьшения вложенности
const composeProviders = (
  ...providers: React.ComponentType<{ children: ReactNode }>[]
) => {
  return ({ children }: { children: ReactNode }) => {
    return providers.reduceRight(
      (child, Provider) => <Provider>{child}</Provider>,
      children,
    );
  };
};

// Создаем единый провайдер из всех контекстов
const AppProvider = composeProviders(
  I18nProvider,
  ModalProvider,
  AppSettingsProvider, // Добавляем новый провайдер для централизованного хранилища
  ProjectSettingsProvider,
  UserSettingsProvider,
  ResourcesProvider,
  MediaProvider,
  PlayerProvider,
  ChatProvider,
);

export function Providers({ children }: ProvidersProps) {
  return <AppProvider>{children}</AppProvider>;
}
