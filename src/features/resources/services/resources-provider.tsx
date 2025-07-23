/**
 * Resources Provider V2
 *
 * Новая версия с интеграцией backend state management
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"

import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { VideoEffect } from "@/features/effects/types"
import { VideoFilter } from "@/features/filters/types/filters"
import { MediaFile } from "@/features/media/types/media"
import { StyleTemplate } from "@/features/style-templates/types"
import { SubtitleStyleTemplate } from "@/features/subtitles/types"
import { MediaTemplate } from "@/features/templates/lib/templates"
import { Transition } from "@/features/transitions/types/transitions"
import { ProjectState } from "@/types/generated/tauri-bindings"

import {
  EffectResource,
  FilterResource,
  MediaResource,
  MusicResource,
  StyleTemplateResource,
  SubtitleResource,
  TemplateResource,
  TimelineResource,
  TransitionResource,
  createMediaResource,
  createMusicResource,
} from "../types"

interface ResourcesContextType {
  // Ресурсы (синхронизированы с backend через project state)
  resources: TimelineResource[]
  mediaResources: MediaResource[]
  musicResources: MusicResource[]
  subtitleResources: SubtitleResource[]
  effectResources: EffectResource[]
  filterResources: FilterResource[]
  transitionResources: TransitionResource[]
  templateResources: TemplateResource[]
  styleTemplateResources: StyleTemplateResource[]

  // Состояние загрузки
  isLoading: boolean
  error: string | null

  // Действия для добавления ресурсов (backend команды)
  addMedia: (file: MediaFile) => Promise<void>
  addMusic: (file: MediaFile) => Promise<void>
  addSubtitle: (style: SubtitleStyleTemplate) => Promise<void>
  addEffect: (effect: VideoEffect) => Promise<void>
  addFilter: (filter: VideoFilter) => Promise<void>
  addTransition: (transition: Transition) => Promise<void>
  addTemplate: (template: MediaTemplate) => Promise<void>
  addStyleTemplate: (template: StyleTemplate) => Promise<void>

  // Действия для удаления/обновления
  removeResource: (resourceId: string) => Promise<void>
  updateResource: (resourceId: string, params: Record<string, any>) => Promise<void>
  clearResources: () => Promise<void>

  // Утилиты
  getResourceById: (resourceId: string) => TimelineResource | undefined
  getResourcesByType: (type: string) => TimelineResource[]
  isMusicAdded: (file: MediaFile) => boolean
}

const ResourcesContextV2 = createContext<ResourcesContextType | undefined>(undefined)

interface ResourcesProviderV2Props {
  children: React.ReactNode
}

export function ResourcesProviderV2({ children }: ResourcesProviderV2Props) {
  const [backendSync] = useState(() => getBackendSync())
  const [backendState, setBackendState] = useState<ProjectState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Подписка на backend состояние
  useEffect(() => {
    const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
      setBackendState(state)
      setError(null)
    })

    return unsubscribe
  }, [backendSync])

  // Функция для выполнения backend команд
  const executeCommand = useCallback(
    async (command: any) => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await backendSync.executeCommand(command)
        if (!result.success) {
          throw new Error(result.error || "Command failed")
        }

        return result.data
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(errorMessage)
        console.error("Resources command failed:", err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [backendSync],
  )

  // Действия для добавления ресурсов
  const addMedia = useCallback(
    async (file: MediaFile) => {
      await executeCommand({
        type: "AddMedia",
        params: { path: file.path, mediaType: "Video" }, // или определить тип из file
      })
    },
    [executeCommand],
  )

  const addMusic = useCallback(
    async (file: MediaFile) => {
      await executeCommand({
        type: "AddMedia",
        params: { path: file.path, mediaType: "Audio" },
      })
    },
    [executeCommand],
  )

  const addSubtitle = useCallback(async (_style: SubtitleStyleTemplate) => {
    // Для субтитров пока используем локальное хранение
    // Так как backend команды для них ещё нет
    console.warn("Subtitle resources not yet integrated with backend")
  }, [])

  const addEffect = useCallback(async (_effect: VideoEffect) => {
    // Эффекты пока остаются локальными
    console.warn("Effect resources not yet integrated with backend")
  }, [])

  const addFilter = useCallback(async (_filter: VideoFilter) => {
    // Фильтры пока остаются локальными
    console.warn("Filter resources not yet integrated with backend")
  }, [])

  const addTransition = useCallback(async (_transition: Transition) => {
    // Переходы пока остаются локальными
    console.warn("Transition resources not yet integrated with backend")
  }, [])

  const addTemplate = useCallback(async (_template: MediaTemplate) => {
    // Шаблоны пока остаются локальными
    console.warn("Template resources not yet integrated with backend")
  }, [])

  const addStyleTemplate = useCallback(async (_template: StyleTemplate) => {
    // Стилистические шаблоны пока остаются локальными
    console.warn("Style template resources not yet integrated with backend")
  }, [])

  const removeResource = useCallback(
    async (resourceId: string) => {
      await executeCommand({
        type: "RemoveMedia",
        params: { mediaId: resourceId },
      })
    },
    [executeCommand],
  )

  const updateResource = useCallback(
    async (resourceId: string, params: Record<string, any>) => {
      await executeCommand({
        type: "UpdateMedia",
        params: { mediaId: resourceId, updates: params },
      })
    },
    [executeCommand],
  )

  const clearResources = useCallback(async () => {
    // Нужна команда для очистки всех ресурсов
    console.warn("Clear resources command not yet implemented in backend")
  }, [])

  // Утилиты
  const getResourceById = useCallback(
    (resourceId: string) => {
      const allResources = [
        ...mediaResources,
        ...musicResources,
        ...subtitleResources,
        ...effectResources,
        ...filterResources,
        ...transitionResources,
        ...templateResources,
        ...styleTemplateResources,
      ]
      return allResources.find((resource) => resource.resourceId === resourceId)
    },
    [backendState],
  )

  const getResourcesByType = useCallback(
    (type: string) => {
      switch (type) {
        case "media":
          return mediaResources
        case "music":
          return musicResources
        case "subtitle":
          return subtitleResources
        case "effect":
          return effectResources
        case "filter":
          return filterResources
        case "transition":
          return transitionResources
        case "template":
          return templateResources
        case "styleTemplate":
          return styleTemplateResources
        default:
          return []
      }
    },
    [backendState],
  )

  // Извлекаем ресурсы из backend состояния
  // Пока backend не содержит все типы ресурсов, создаем пустые массивы
  const mediaPool = backendState?.project?.mediaPool

  // Конвертируем медиа из backend в MediaResource формат
  const mediaResources: MediaResource[] = mediaPool
    ? Array.from(mediaPool.items.values())
      .filter((item) => item.type === "video" || item.type === "image")
      .map((item) =>
        createMediaResource({
          id: item.id,
          name: item.name,
          path: item.source.path,
          size: item.metadata.fileSize,
          type: item.type,
          isVideo: item.type === "video",
          isAudio: false,
          isImage: item.type === "image",
          isLoadingMetadata: false,
          probeData: { streams: [], format: {} },
          duration: item.metadata.duration,
        }),
      )
    : []

  const musicResources: MusicResource[] = mediaPool
    ? Array.from(mediaPool.items.values())
      .filter((item) => item.type === "audio")
      .map((item) =>
        createMusicResource({
          id: item.id,
          name: item.name,
          path: item.source.path,
          size: item.metadata.fileSize,
          type: item.type,
          isVideo: false,
          isAudio: true,
          isImage: false,
          isLoadingMetadata: false,
          probeData: { streams: [], format: {} },
          duration: item.metadata.duration,
        }),
      )
    : []

  // Остальные ресурсы пока пустые (будут добавлены позже)
  const subtitleResources: SubtitleResource[] = []
  const effectResources: EffectResource[] = []
  const filterResources: FilterResource[] = []
  const transitionResources: TransitionResource[] = []
  const templateResources: TemplateResource[] = []
  const styleTemplateResources: StyleTemplateResource[] = []

  const resources: TimelineResource[] = [
    ...mediaResources,
    ...musicResources,
    ...subtitleResources,
    ...effectResources,
    ...filterResources,
    ...transitionResources,
    ...templateResources,
    ...styleTemplateResources,
  ]

  // Контекстное значение
  const contextValue: ResourcesContextType = {
    // Ресурсы
    resources,
    mediaResources,
    musicResources,
    subtitleResources,
    effectResources,
    filterResources,
    transitionResources,
    templateResources,
    styleTemplateResources,

    // Состояние
    isLoading,
    error,

    // Действия
    addMedia,
    addMusic,
    addSubtitle,
    addEffect,
    addFilter,
    addTransition,
    addTemplate,
    addStyleTemplate,
    removeResource,
    updateResource,
    clearResources,

    // Утилиты
    getResourceById,
    getResourcesByType,
    isMusicAdded: (file: MediaFile) => {
      return musicResources.some(resource => resource.data.path === file.path)
    },
  }

  return <ResourcesContextV2.Provider value={contextValue}>{children}</ResourcesContextV2.Provider>
}

export function useResourcesV2(): ResourcesContextType {
  const context = useContext(ResourcesContextV2)

  if (!context) {
    throw new Error("useResourcesV2 must be used within ResourcesProviderV2")
  }

  return context
}

// Экспорт типов
export type { ResourcesContextType }

// Экспорт для обратной совместимости
export { ResourcesProviderV2 as ResourcesProvider }
export { useResourcesV2 as useResources }
