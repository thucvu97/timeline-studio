import { ReactElement, ReactNode } from "react";

import { RenderOptions, render } from "@testing-library/react";

import { ThemeProvider } from "@/components/theme/theme-context";
import { ChatProvider } from "@/features/ai-chat/services/chat-provider";
import { AppSettingsProvider } from "@/features/app-state/app-settings-provider";
import { PreviewSizeProvider } from "@/features/browser/components/preview/preview-size-provider";
import { MediaProvider } from "@/features/browser/media";
import { MediaListProvider } from "@/features/media/services/media-list-provider";
import { ProjectSettingsProvider } from "@/features/modals/features/project-settings/project-settings-provider";
import { UserSettingsProvider } from "@/features/modals/features/user-settings/user-settings-provider";
import { ModalProvider } from "@/features/modals/services/modal-provider";
import { MusicProvider } from "@/features/music/music-provider";
import { ResourcesProvider } from "@/features/resources";
import { TemplateListProvider } from "@/features/templates/services/template-list-provider";
import { PlayerProvider } from "@/features/video-player/services/player-provider";
import { I18nProvider } from "@/i18n/i18n-provider";

// ✅ Базовые провайдеры (минимум для большинства компонентов)
export const BaseProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppSettingsProvider>
          {children}
        </AppSettingsProvider>
      </I18nProvider>
    </ThemeProvider>
  );
};

// ✅ Провайдеры для медиа компонентов
export const MediaProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders>
      <ResourcesProvider>
        <MediaProvider>
          <MediaListProvider>
            <PreviewSizeProvider>
              {children}
            </PreviewSizeProvider>
          </MediaListProvider>
        </MediaProvider>
      </ResourcesProvider>
    </BaseProviders>
  );
};

// ✅ Провайдеры для музыки
export const MusicProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders>
      <ResourcesProvider>
        <MediaProvider>
          <MusicProvider>
            {children}
          </MusicProvider>
        </MediaProvider>
      </ResourcesProvider>
    </BaseProviders>
  );
};

// ✅ Провайдеры для видеоплеера
export const PlayerProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders>
      <PlayerProvider>
        {children}
      </PlayerProvider>
    </BaseProviders>
  );
};

// ✅ Провайдеры для модалов
export const ModalProviders = ({ children }: { children: ReactNode }) => {
  return (
    <BaseProviders>
      <ModalProvider>
        <ProjectSettingsProvider>
          <UserSettingsProvider>
            {children}
          </UserSettingsProvider>
        </ProjectSettingsProvider>
      </ModalProvider>
    </BaseProviders>
  );
};

// ❌ Монстр-провайдер (только для интеграционных тестов)
export const AllProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ModalProvider>
          <AppSettingsProvider>
            <ProjectSettingsProvider>
              <UserSettingsProvider>
                <ResourcesProvider>
                  <MediaProvider>
                    <MediaListProvider>
                      <MusicProvider>
                        <PreviewSizeProvider>
                          <TemplateListProvider>
                            <PlayerProvider>
                              <ChatProvider>{children}</ChatProvider>
                            </PlayerProvider>
                          </TemplateListProvider>
                        </PreviewSizeProvider>
                      </MusicProvider>
                    </MediaListProvider>
                  </MediaProvider>
                </ResourcesProvider>
              </UserSettingsProvider>
            </ProjectSettingsProvider>
          </AppSettingsProvider>
        </ModalProvider>
      </I18nProvider>
    </ThemeProvider>
  );
};

// ✅ Специализированные функции рендеринга
export const renderWithBase = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: BaseProviders, ...options });

export const renderWithMedia = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: MediaProviders, ...options });

export const renderWithMusic = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: MusicProviders, ...options });

export const renderWithPlayer = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: PlayerProviders, ...options });

export const renderWithModal = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: ModalProviders, ...options });

// ❌ Полный рендер (только для интеграционных тестов)
export const renderWithAll = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllProviders, ...options });

// 🎯 Умная функция рендеринга (по умолчанию базовые провайдеры)
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: BaseProviders, ...options });

// Реэкспортируем только то, что нам нужно
export { screen, fireEvent, waitFor, within } from "@testing-library/react";

// Переопределение функции render (теперь с базовыми провайдерами)
export { customRender as render };
