import { ReactElement, ReactNode } from "react";

import { RenderOptions, render } from "@testing-library/react";

import { ThemeProvider } from "@/components/theme/theme-context";
import { AppSettingsProvider } from "@/features/app-state/app-settings-provider";
import { PreviewSizeProvider } from "@/features/browser/components/preview/preview-size-provider";
import { MediaListProvider } from "@/features/browser/components/tabs/media/media-list-provider";
import { TemplateListProvider } from "@/features/browser/components/tabs/templates/services/template-list-provider";
import { MediaProvider } from "@/features/browser/media";
import { ResourcesProvider } from "@/features/browser/resources";
import { ChatProvider } from "@/features/chat/services/chat-provider";
import { ProjectSettingsProvider } from "@/features/modals/features/project-settings/project-settings-provider";
import { UserSettingsProvider } from "@/features/modals/features/user-settings/user-settings-provider";
import { ModalProvider } from "@/features/modals/services/modal-provider";
import { PlayerProvider } from "@/features/video-player/components/player-provider";
import { I18nProvider } from "@/i18n/i18n-provider";

// Провайдер для всех тестов
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
                      <PreviewSizeProvider>
                        <TemplateListProvider>
                          <PlayerProvider>
                            <ChatProvider>{children}</ChatProvider>
                          </PlayerProvider>
                        </TemplateListProvider>
                      </PreviewSizeProvider>
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

// Кастомная функция рендеринга
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllProviders, ...options });

// Реэкспортируем только то, что нам нужно
export { screen, fireEvent, waitFor, within } from "@testing-library/react";

// Переопределение функции render
export { customRender as render };
