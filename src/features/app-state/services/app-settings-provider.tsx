import { ReactNode, createContext, useEffect } from "react";

import { appDataDir, basename, join } from "@tauri-apps/api/path";
import { open, save } from "@tauri-apps/plugin-dialog";
import { useMachine } from "@xstate/react";

import { MissingFilesDialog } from "@/components/dialogs/missing-files-dialog";
import { FavoritesType } from "@/features/browser/media/media-machine";
import { UserSettingsContextType } from "@/features/user-settings";
import { useMediaRestoration } from "@/hooks/use-media-restoration";
import { ProjectFileService } from "@/lib/project-file-service";

import { AppSettingsContextType, appSettingsMachine } from "./app-settings-machine";

/**
 * Интерфейс контекста провайдера настроек приложения
 */
export interface AppSettingsProviderContext {
  // Состояние машины
  state: {
    context: AppSettingsContextType;
    matches: (value: string) => boolean;
    can: (event: { type: string }) => boolean;
  };

  // Методы для работы с настройками
  updateUserSettings: (settings: Partial<UserSettingsContextType>) => void;
  addRecentProject: (path: string, name: string) => void;
  removeRecentProject: (path: string) => void;
  clearRecentProjects: () => void;
  updateFavorites: (favorites: Partial<FavoritesType>) => void;
  addToFavorites: (itemType: keyof FavoritesType, item: any) => void;
  removeFromFavorites: (itemType: keyof FavoritesType, itemId: string) => void;
  reloadSettings: () => void;

  // Методы для работы с проектами
  createNewProject: (name?: string) => void;
  openProject: () => Promise<{ path: string; name: string } | null>;
  saveProject: (name: string) => Promise<{ path: string; name: string } | null>;
  setProjectDirty: (isDirty: boolean) => void;
  updateMediaFiles: (files: any[]) => void;

  // Геттеры для удобного доступа к данным
  getUserSettings: () => UserSettingsContextType;
  getRecentProjects: () => AppSettingsContextType["recentProjects"];
  getFavorites: () => FavoritesType;
  getCurrentProject: () => AppSettingsContextType["currentProject"];
  getMediaFiles: () => AppSettingsContextType["mediaFiles"];
  isLoading: () => boolean;
  getError: () => string | null;
}

// Создаем контекст
export const AppSettingsContext = createContext<
  AppSettingsProviderContext | undefined
>(undefined);

/**
 * Провайдер настроек приложения
 */
export function AppSettingsProvider({ children }: { children: ReactNode }) {
  // Используем машину состояний
  const [state, send] = useMachine(appSettingsMachine);

  // Хук для восстановления медиафайлов
  const {
    restoreProjectMedia,
    handleMissingFilesResolution,
    cancelMissingFilesDialog,
    showMissingFilesDialog,
    getMissingFiles,
  } = useMediaRestoration();

  // Проверяем, есть ли открытый проект, и если нет, создаем новый
  useEffect(() => {
    if (
      !state.context.isLoading &&
      !state.context.currentProject.path &&
      !state.context.currentProject.isNew
    ) {
      // Если нет открытого проекта и не создан новый, создаем новый проект
      send({ type: "CREATE_NEW_PROJECT" });
    }
  }, [
    state.context.isLoading,
    state.context.currentProject.path,
    state.context.currentProject.isNew,
    send,
  ]);

  // Методы для работы с настройками
  const updateUserSettings = (settings: Partial<UserSettingsContextType>) => {
    send({ type: "UPDATE_USER_SETTINGS", settings });
  };

  const addRecentProject = (path: string, name: string) => {
    send({ type: "ADD_RECENT_PROJECT", path, name });
  };

  const removeRecentProject = (path: string) => {
    send({ type: "REMOVE_RECENT_PROJECT", path });
  };

  const clearRecentProjects = () => {
    send({ type: "CLEAR_RECENT_PROJECTS" });
  };

  const updateFavorites = (favorites: Partial<FavoritesType>) => {
    send({ type: "UPDATE_FAVORITES", favorites });
  };

  const addToFavorites = (itemType: keyof FavoritesType, item: any) => {
    send({ type: "ADD_TO_FAVORITES", itemType, item });
  };

  const removeFromFavorites = (
    itemType: keyof FavoritesType,
    itemId: string,
  ) => {
    send({ type: "REMOVE_FROM_FAVORITES", itemType, itemId });
  };

  const reloadSettings = () => {
    send({ type: "RELOAD_SETTINGS" });
  };

  // Методы для работы с проектами
  const createNewProject = (name?: string) => {
    send({ type: "CREATE_NEW_PROJECT", name });
  };

  const openProject = async () => {
    try {
      // Получаем директорию данных приложения
      const appDir = await appDataDir().catch(() => null);

      // Открываем диалог выбора файла
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Timeline Studio Project",
            extensions: ["tlsp"],
          },
        ],
        // Если директория приложения доступна, используем её как начальную директорию
        defaultPath: appDir ?? undefined,
      });

      // Если пользователь отменил выбор, возвращаемся
      if (selected === null) {
        return null;
      }

      // Получаем путь к файлу
      const path = selected;

      // Получаем имя файла из пути
      const name = await basename(path);

      try {
        // Загружаем содержимое проекта
        const projectData = await ProjectFileService.loadProject(path);

        // Отправляем событие в машину состояний с данными проекта
        // TODO: Обновить тип события в машине состояний для поддержки projectData
        send({
          type: "OPEN_PROJECT",
          path,
          name,
          // projectData // Временно закомментировано
        });

        // Восстанавливаем медиафайлы проекта
        if (projectData.mediaLibrary) {
          try {
            const restorationResult = await restoreProjectMedia(
              projectData.mediaLibrary.mediaFiles || [],
              projectData.mediaLibrary.musicFiles || [],
              path,
              { showDialog: true }, // Показываем диалог для отсутствующих файлов
            );

            console.log(
              "Медиафайлы восстановлены:",
              restorationResult.result.stats,
            );

            // TODO: Добавить восстановленные файлы в провайдеры медиа и музыки
            // updateMediaFiles(restorationResult.restoredMedia)
            // updateMusicFiles(restorationResult.restoredMusic)
          } catch (restorationError) {
            console.error(
              "Ошибка при восстановлении медиафайлов:",
              restorationError,
            );
            // Не прерываем открытие проекта из-за ошибок восстановления
          }
        }

        return { path, name, projectData };
      } catch (projectError) {
        console.error("Failed to load project data:", projectError);

        // Отправляем событие без данных проекта (для совместимости)
        send({ type: "OPEN_PROJECT", path, name });

        // Показываем предупреждение пользователю
        console.warn(
          `Проект открыт, но не удалось загрузить данные: ${String(projectError)}`,
        );

        return { path, name, error: String(projectError) };
      }
    } catch (error) {
      console.error("[openProject] Error opening project:", error);
      throw error;
    }
  };

  const saveProject = async (name: string) => {
    try {
      const currentProject = getCurrentProject();

      // Если у проекта уже есть путь, сохраняем по этому пути
      if (currentProject.path) {
        try {
          // Создаем базовые данные проекта для сохранения
          const projectData = ProjectFileService.createNewProject(name);

          // TODO: Здесь будем собирать данные из провайдеров медиа и музыки
          // const mediaFiles = await collectMediaFiles()
          // const musicFiles = await collectMusicFiles()
          // projectData = ProjectFileService.updateMediaLibrary(projectData, mediaFiles, musicFiles)

          // Сохраняем проект в файл
          await ProjectFileService.saveProject(
            currentProject.path,
            projectData,
          );

          // Отправляем событие в машину состояний
          send({ type: "SAVE_PROJECT", path: currentProject.path, name });
          return { path: currentProject.path, name };
        } catch (saveError) {
          console.error("Failed to save project:", saveError);
          throw new Error(`Не удалось сохранить проект: ${String(saveError)}`);
        }
      }

      // Получаем директорию данных приложения
      const appDir = await appDataDir().catch(() => null);

      // Формируем путь к файлу по умолчанию
      const defaultFilePath = appDir
        ? await join(appDir, `${name}.tlsp`)
        : `${name}.tlsp`;

      // Иначе открываем диалог сохранения файла
      const path = await save({
        filters: [
          {
            name: "Timeline Studio Project",
            extensions: ["tlsp"],
          },
        ],
        defaultPath: defaultFilePath,
      });

      // Если пользователь отменил выбор, возвращаемся
      if (path === null) {
        return null;
      }

      try {
        // Создаем данные нового проекта
        const projectData = ProjectFileService.createNewProject(name);

        // TODO: Здесь будем собирать данные из провайдеров медиа и музыки

        // Сохраняем проект в файл
        await ProjectFileService.saveProject(path, projectData);

        // Отправляем событие в машину состояний
        send({ type: "SAVE_PROJECT", path, name });

        return { path, name };
      } catch (saveError) {
        console.error("Failed to save new project:", saveError);
        throw new Error(
          `Не удалось сохранить новый проект: ${String(saveError)}`,
        );
      }
    } catch (error) {
      console.error("[saveProject] Error saving project:", error);
      throw error;
    }
  };

  const setProjectDirty = (isDirty: boolean) => {
    send({ type: "SET_PROJECT_DIRTY", isDirty });
  };

  const updateMediaFiles = (files: any[]) => {
    send({ type: "UPDATE_MEDIA_FILES", files });
  };

  // Геттеры для удобного доступа к данным
  const getUserSettings = () => state.context.userSettings;
  const getRecentProjects = () => state.context.recentProjects;
  const getFavorites = () => state.context.favorites;
  const getCurrentProject = () => state.context.currentProject;
  const getMediaFiles = () => state.context.mediaFiles;
  const isLoading = () => state.context.isLoading;
  const getError = () => state.context.error;

  // Значение контекста
  const value: AppSettingsProviderContext = {
    state: {
      context: state.context,
      matches: (value: string) => state.matches(value),
      can: (event: { type: string }) => state.can(event as any),
    },
    updateUserSettings,
    addRecentProject,
    removeRecentProject,
    clearRecentProjects,
    updateFavorites,
    addToFavorites,
    removeFromFavorites,
    reloadSettings,
    createNewProject,
    openProject,
    saveProject,
    setProjectDirty,
    updateMediaFiles,
    getUserSettings,
    getRecentProjects,
    getFavorites,
    getCurrentProject,
    getMediaFiles,
    isLoading,
    getError,
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}

      {/* Диалог для обработки отсутствующих медиафайлов */}
      <MissingFilesDialog
        open={showMissingFilesDialog}
        onOpenChange={cancelMissingFilesDialog}
        missingFiles={getMissingFiles()}
        onResolve={handleMissingFilesResolution}
      />
    </AppSettingsContext.Provider>
  );
}


