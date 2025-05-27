import { FavoritesType } from "@/features/browser/media/media-machine"
import { MediaFile } from "@/features/media/types/media"
import { BrowserTab, LayoutMode } from "@/features/user-settings/services/user-settings-machine"
import { PreviewSize } from "@/lib/constants/preview-sizes"
import { ProjectSettings } from "@/types/project"
import { TimelineResource } from "@/types/resources"

/**
 * Интерфейс для централизованного хранилища состояния приложения
 * Объединяет все контексты из разных машин состояний
 */
export interface AppState {
  // Пользовательские настройки
  userSettings: {
    previewSizes: Record<"MEDIA" | "TRANSITIONS" | "SUBTITLES" | "EFFECTS" | "FILTERS" | "TEMPLATES", PreviewSize>
    activeTab: BrowserTab
    layoutMode: LayoutMode
    screenshotsPath: string
    playerScreenshotsPath: string
    openAiApiKey: string
    claudeApiKey: string
    isBrowserVisible: boolean
    isLoaded: boolean
  }

  // Настройки проекта
  projectSettings: {
    settings: ProjectSettings
    name: string
    isDirty: boolean
  }

  // Медиа файлы
  media: {
    allMediaFiles: MediaFile[]
    error: string | null
    isLoading: boolean
    favorites: FavoritesType
  }

  // Ресурсы
  resources: {
    resources: TimelineResource[]
    effectResources: any[]
    filterResources: any[]
    transitionResources: any[]
    templateResources: any[]
    musicResources: any[]
    subtitleResources: any[]
  }

  // Состояние превью
  preview: {
    previewSize: number
    canIncreaseSize: boolean
    canDecreaseSize: boolean
  }

  // Состояние шаблонов
  templates: {
    previewSize: number
    canIncreaseSize: boolean
    canDecreaseSize: boolean
    searchQuery: string
    showFavoritesOnly: boolean
  }

  // Состояние модальных окон
  modal: {
    modalType: string
    modalData: any
    isOpen: boolean
  }

  // Метаданные хранилища
  meta: {
    lastUpdated: number
    version: string
  }
}

/**
 * Типы событий для обновления состояния
 */
export type AppStateEvent =
  | {
      type: "UPDATE_USER_SETTINGS"
      settings: Partial<AppState["userSettings"]>
    }
  | {
      type: "UPDATE_PROJECT_SETTINGS"
      settings: Partial<AppState["projectSettings"]>
    }
  | { type: "UPDATE_MEDIA"; media: Partial<AppState["media"]> }
  | { type: "UPDATE_RESOURCES"; resources: Partial<AppState["resources"]> }
  | { type: "UPDATE_PREVIEW"; preview: Partial<AppState["preview"]> }
  | { type: "UPDATE_TEMPLATES"; templates: Partial<AppState["templates"]> }
  | { type: "UPDATE_MODAL"; modal: Partial<AppState["modal"]> }
  | { type: "RESET_STATE" }
  | { type: "LOAD_STATE"; state: AppState }
