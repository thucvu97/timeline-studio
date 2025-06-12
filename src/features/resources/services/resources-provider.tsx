import React, { ReactNode, createContext, useContext } from "react"

import { useMachine } from "@xstate/react"

import { VideoEffect } from "@/features/effects/types"
import { VideoFilter } from "@/features/filters/types/filters"
import { MediaFile } from "@/features/media/types/media"
import {
  EffectResource,
  FilterResource,
  MediaResource,
  MusicResource,
  ResourceType,
  StyleTemplateResource,
  SubtitleResource,
  TemplateResource,
  TransitionResource,
} from "@/features/resources/types"
import { StyleTemplate } from "@/features/style-templates/types"
import { SubtitleStyle } from "@/features/subtitles/types"
import { MediaTemplate } from "@/features/templates/lib/templates"
import { Transition } from "@/features/transitions/types/transitions"

import { ResourcesMachineContext, resourcesMachine } from "./resources-machine"

interface ResourcesContextType extends ResourcesMachineContext {
  // Методы для работы с ресурсами
  addResource: (resource: ResourceType, object: any) => void

  addMedia: (file: MediaFile) => void
  addMusic: (file: MediaFile) => void
  addSubtitle: (style: SubtitleStyle) => void
  addEffect: (effect: VideoEffect) => void
  addFilter: (filter: VideoFilter) => void
  addTransition: (transition: Transition) => void
  addTemplate: (template: MediaTemplate) => void
  addStyleTemplate: (template: StyleTemplate) => void
  removeResource: (resourceId: string) => void
  updateResource: (resourceId: string, params: Record<string, any>) => void

  // Методы для проверки наличия ресурса в хранилище
  isAdded: (resourceId: string, resource: ResourceType) => boolean

  isMediaAdded: (file: MediaFile) => boolean
  isMusicAdded: (file: MediaFile) => boolean
  isSubtitleAdded: (style: SubtitleStyle) => boolean
  isEffectAdded: (effect: VideoEffect) => boolean
  isFilterAdded: (filter: VideoFilter) => boolean
  isTransitionAdded: (transition: Transition) => boolean
  isTemplateAdded: (template: MediaTemplate) => boolean
  isStyleTemplateAdded: (template: StyleTemplate) => boolean
}

interface ResourcesProviderProps {
  children: ReactNode
}

const ResourcesContext = createContext<ResourcesContextType | null>(null)

export function useResources(): ResourcesContextType {
  const context = useContext(ResourcesContext)
  if (!context) {
    throw new Error("useResources must be used within a ResourcesProvider")
  }
  return context
}

export function ResourcesProvider({ children }: ResourcesProviderProps) {
  const [state, send] = useMachine(resourcesMachine)

  // Извлекаем свойства контекста из состояния машины
  const {
    resources,
    mediaResources,
    musicResources,
    subtitleResources,
    effectResources,
    filterResources,
    transitionResources,
    templateResources,
    styleTemplateResources,
  } = state.context

  // Методы для работы с ресурсами
  const handleAddEffect = React.useCallback(
    (effect: VideoEffect) => {
      send({ type: "ADD_EFFECT", effect })
    },
    [send],
  )

  const handleAddFilter = React.useCallback(
    (filter: VideoFilter) => {
      send({ type: "ADD_FILTER", filter })
    },
    [send],
  )

  const handleAddTransition = React.useCallback(
    (transition: Transition) => {
      send({ type: "ADD_TRANSITION", transition })
    },
    [send],
  )

  const handleAddTemplate = React.useCallback(
    (template: MediaTemplate) => {
      send({ type: "ADD_TEMPLATE", template })
    },
    [send],
  )

  const handleAddStyleTemplate = React.useCallback(
    (template: StyleTemplate) => {
      send({ type: "ADD_STYLE_TEMPLATE", template })
    },
    [send],
  )

  const handleAddMusic = React.useCallback(
    (file: MediaFile) => {
      console.log("Adding music file to resources:", file.name)
      send({ type: "ADD_MUSIC", file })
    },
    [send],
  )

  const handleAddMedia = React.useCallback(
    (file: MediaFile) => {
      console.log("Adding media to resources:", file.name)
      send({ type: "ADD_MEDIA", file })
    },
    [send],
  )

  const handleAddSubtitle = React.useCallback(
    (style: SubtitleStyle) => {
      console.log("Adding subtitle style to resources:", style.name)
      send({ type: "ADD_SUBTITLE", style })
    },
    [send],
  )

  const handleAddResource = React.useCallback(
    (resource: ResourceType, object: any) => {
      switch (resource) {
        case "media":
          handleAddMedia(object as MediaFile)
          break
        case "music":
          handleAddMusic(object as MediaFile)
          break
        case "subtitle":
          handleAddSubtitle(object as SubtitleStyle)
          break
        case "effect":
          handleAddEffect(object as VideoEffect)
          break
        case "filter":
          handleAddFilter(object as VideoFilter)
          break
        case "transition":
          handleAddTransition(object as Transition)
          break
        case "template":
          handleAddTemplate(object as MediaTemplate)
          break
        case "style-template":
          handleAddStyleTemplate(object as StyleTemplate)
          break
        default:
          console.warn("Unknown resource type:", resource)
      }
    },
    [
      handleAddMedia,
      handleAddMusic,
      handleAddSubtitle,
      handleAddEffect,
      handleAddFilter,
      handleAddTransition,
      handleAddTemplate,
      handleAddStyleTemplate,
    ],
  )

  const handleRemoveResource = React.useCallback(
    (resourceId: string) => {
      send({ type: "REMOVE_RESOURCE", resourceId })
    },
    [send],
  )

  const handleUpdateResource = React.useCallback(
    (resourceId: string, params: Record<string, any>) => {
      send({ type: "UPDATE_RESOURCE", resourceId, params })
    },
    [send],
  )

  const isAdded = React.useCallback(
    (resourceId: string, resource: ResourceType) => {
      return resources.some((res) => res.type === resource && res.resourceId === resourceId)
    },
    [resources],
  )

  // Методы для проверки наличия ресурса в хранилище
  // Создаем кэш для результатов проверки эффектов
  const effectAddedCache = React.useRef<Record<string, boolean>>({})

  // Сбрасываем кэш при изменении effectResources
  React.useEffect(() => {
    effectAddedCache.current = {}
  }, [effectResources])

  const isEffectAdded = React.useCallback(
    (effect: VideoEffect) => {
      // Проверяем, есть ли результат в кэше
      if (effect.id in effectAddedCache.current) {
        return effectAddedCache.current[effect.id]
      }

      // Если результата нет в кэше, вычисляем его
      const isAdded = effectResources.some((resource: EffectResource) => resource.resourceId === effect.id)

      // Сохраняем результат в кэше
      effectAddedCache.current[effect.id] = isAdded

      return isAdded
    },
    [effectResources],
  )

  // Создаем кэш для результатов проверки фильтров
  const filterAddedCache = React.useRef<Record<string, boolean>>({})

  // Сбрасываем кэш при изменении filterResources
  React.useEffect(() => {
    filterAddedCache.current = {}
  }, [filterResources])

  const isFilterAdded = React.useCallback(
    (filter: VideoFilter) => {
      // Проверяем, есть ли результат в кэше
      if (filter.id in filterAddedCache.current) {
        return filterAddedCache.current[filter.id]
      }

      // Если результата нет в кэше, вычисляем его
      const isAdded = filterResources.some((resource: FilterResource) => resource.resourceId === filter.id)

      // Сохраняем результат в кэше
      filterAddedCache.current[filter.id] = isAdded

      return isAdded
    },
    [filterResources],
  )

  // Создаем кэш для результатов проверки переходов
  const transitionAddedCache = React.useRef<Record<string, boolean>>({})

  // Сбрасываем кэш при изменении transitionResources
  React.useEffect(() => {
    transitionAddedCache.current = {}
  }, [transitionResources])

  const isTransitionAdded = React.useCallback(
    (transition: Transition) => {
      // Проверяем, есть ли результат в кэше
      const cacheKey = transition.id || transition.type
      if (cacheKey in transitionAddedCache.current) {
        return transitionAddedCache.current[cacheKey]
      }

      // Если результата нет в кэше, вычисляем его
      const isAdded = transitionResources.some((resource: TransitionResource) => {
        return resource.resourceId === transition.id || resource.resourceId === transition.type
      })

      // Сохраняем результат в кэше
      transitionAddedCache.current[cacheKey] = isAdded

      return isAdded
    },
    [transitionResources],
  )

  // Создаем кэш для результатов проверки шаблонов
  const templateAddedCache = React.useRef<Record<string, boolean>>({})

  // Сбрасываем кэш при изменении templateResources
  React.useEffect(() => {
    templateAddedCache.current = {}
  }, [templateResources])

  const isTemplateAdded = React.useCallback(
    (template: MediaTemplate) => {
      // Проверяем, есть ли результат в кэше
      if (template.id in templateAddedCache.current) {
        return templateAddedCache.current[template.id]
      }

      // Если результата нет в кэше, вычисляем его
      const isAdded = templateResources.some((resource: TemplateResource) => resource.resourceId === template.id)

      // Сохраняем результат в кэше
      templateAddedCache.current[template.id] = isAdded

      return isAdded
    },
    [templateResources],
  )

  // Создаем кэш для результатов проверки стилистических шаблонов
  const styleTemplateAddedCache = React.useRef<Record<string, boolean>>({})

  // Сбрасываем кэш при изменении styleTemplateResources
  React.useEffect(() => {
    styleTemplateAddedCache.current = {}
  }, [styleTemplateResources])

  const isStyleTemplateAdded = React.useCallback(
    (template: StyleTemplate) => {
      // Проверяем, есть ли результат в кэше
      if (template.id in styleTemplateAddedCache.current) {
        return styleTemplateAddedCache.current[template.id]
      }

      // Если результата нет в кэше, вычисляем его
      const isAdded = styleTemplateResources.some(
        (resource: StyleTemplateResource) => resource.resourceId === template.id,
      )

      // Сохраняем результат в кэше
      styleTemplateAddedCache.current[template.id] = isAdded

      return isAdded
    },
    [styleTemplateResources],
  )

  // Создаем кэш для результатов проверки музыкальных файлов
  const musicFileAddedCache = React.useRef<Record<string, boolean>>({})

  // Сбрасываем кэш при изменении musicResources
  React.useEffect(() => {
    musicFileAddedCache.current = {}
  }, [musicResources])

  const isMusicAdded = React.useCallback(
    (file: MediaFile) => {
      // Проверяем, есть ли результат в кэше
      if (file.id in musicFileAddedCache.current) {
        return musicFileAddedCache.current[file.id]
      }

      // Если результата нет в кэше, вычисляем его
      const isAdded = musicResources.some((resource: MusicResource) => resource.resourceId === file.id)

      // Сохраняем результат в кэше
      musicFileAddedCache.current[file.id] = isAdded

      return isAdded
    },
    [musicResources],
  )

  // Создаем кэш для результатов проверки медиа файлов
  const mediaAddedCache = React.useRef<Record<string, boolean>>({})

  React.useEffect(() => {
    mediaAddedCache.current = {}
  }, [mediaResources])

  const isMediaAdded = React.useCallback(
    (file: MediaFile) => {
      // Проверяем, есть ли результат в кэше
      if (file.id in mediaAddedCache.current) {
        return mediaAddedCache.current[file.id]
      }

      // Если результата нет в кэше, вычисляем его
      const isAdded = mediaResources.some((resource: MediaResource) => resource.resourceId === file.id)

      // Сохраняем результат в кэше
      mediaAddedCache.current[file.id] = isAdded

      return isAdded
    },
    [mediaResources],
  )

  // Создаем кэш для результатов проверки стилей субтитров
  const subtitleAddedCache = React.useRef<Record<string, boolean>>({})

  // Сбрасываем кэш при изменении subtitleResources
  React.useEffect(() => {
    subtitleAddedCache.current = {}
  }, [subtitleResources])

  const isSubtitleAdded = React.useCallback(
    (style: SubtitleStyle) => {
      // Проверяем, есть ли результат в кэше (используем hasOwnProperty для проверки наличия ключа)
      // eslint-disable-next-line no-prototype-builtins
      if (subtitleAddedCache.current.hasOwnProperty(style.id)) {
        return subtitleAddedCache.current[style.id]
      }

      // Если результата нет в кэше, вычисляем его
      const isAdded = subtitleResources.some((resource: SubtitleResource) => resource.resourceId === style.id)

      // Сохраняем результат в кэше
      subtitleAddedCache.current[style.id] = isAdded

      return isAdded
    },
    [subtitleResources],
  )

  const value: ResourcesContextType = {
    // Данные из контекста машины состояний
    resources,
    mediaResources,
    effectResources,
    filterResources,
    transitionResources,
    templateResources,
    styleTemplateResources,
    musicResources,
    subtitleResources,

    // Методы для работы с ресурсами
    addMedia: handleAddMedia,
    addEffect: handleAddEffect,
    addFilter: handleAddFilter,
    addTransition: handleAddTransition,
    addTemplate: handleAddTemplate,
    addStyleTemplate: handleAddStyleTemplate,
    addMusic: handleAddMusic,
    addSubtitle: handleAddSubtitle,
    addResource: handleAddResource,
    removeResource: handleRemoveResource,
    updateResource: handleUpdateResource,

    // Методы для проверки наличия ресурса в хранилище
    isAdded,
    isEffectAdded,
    isFilterAdded,
    isTransitionAdded,
    isTemplateAdded,
    isStyleTemplateAdded,
    isMusicAdded,
    isMediaAdded,
    isSubtitleAdded,
  }

  return <ResourcesContext.Provider value={value}>{children}</ResourcesContext.Provider>
}
