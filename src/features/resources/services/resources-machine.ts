import { assign, setup } from "xstate"

import { VideoEffect } from "@/features/effects/types"
import { VideoFilter } from "@/features/filters/types/filters"
import { MediaFile } from "@/features/media/types/media"
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
  createEffectResource,
  createFilterResource,
  createMediaResource,
  createMusicResource,
  createStyleTemplateResource,
  createSubtitleResource,
  createTemplateResource,
  createTransitionResource,
} from "@/features/resources/types"
import { StyleTemplate } from "@/features/style-templates/types"
import { SubtitleStyle } from "@/features/subtitles/types"
import { MediaTemplate } from "@/features/templates/lib/templates"
import { Transition } from "@/features/transitions/types/transitions"

// Интерфейс контекста машины состояний
export interface ResourcesMachineContext {
  resources: TimelineResource[]
  mediaResources: MediaResource[] // Все добавленные ресурсы
  musicResources: MusicResource[] // Музыкальные файлы
  subtitleResources: SubtitleResource[] // Стили субтитров
  effectResources: EffectResource[] // Эффекты
  filterResources: FilterResource[] // Фильтры
  transitionResources: TransitionResource[] // Переходы
  templateResources: TemplateResource[] // Шаблоны
  styleTemplateResources: StyleTemplateResource[] // Стилистические шаблоны
}

// Типы событий, которые может обрабатывать машина
type ResourcesMachineEvent =
  | { type: "ADD_MEDIA"; file: MediaFile }
  | { type: "ADD_MUSIC"; file: MediaFile }
  | { type: "ADD_SUBTITLE"; style: SubtitleStyle }
  | { type: "ADD_EFFECT"; effect: VideoEffect }
  | { type: "ADD_FILTER"; filter: VideoFilter }
  | { type: "ADD_TRANSITION"; transition: Transition }
  | { type: "ADD_TEMPLATE"; template: MediaTemplate }
  | { type: "ADD_STYLE_TEMPLATE"; template: StyleTemplate }
  | { type: "REMOVE_RESOURCE"; resourceId: string }
  | { type: "UPDATE_RESOURCE"; resourceId: string; params: Record<string, any> }
  | { type: "LOAD_RESOURCES"; resources: TimelineResource[] }
  | { type: "CLEAR_RESOURCES" }

/**
 * Машина состояний для управления ресурсами
 *
 * Обрабатывает добавление, удаление и обновление различных типов ресурсов:
 * - Эффекты
 * - Фильтры
 * - Переходы
 * - Шаблоны
 * - Музыкальные файлы
 */
// Функция для загрузки ресурсов из localStorage
function loadResourcesFromStorage(): Partial<ResourcesMachineContext> {
  // Check if we're on the client side
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return {}
  }

  try {
    const stored = localStorage.getItem("timeline-studio-resources")
    if (stored) {
      const data = JSON.parse(stored)

      // Validate that data has the expected structure
      const validatedData = {
        resources: Array.isArray(data.resources) ? data.resources : [],
        mediaResources: Array.isArray(data.mediaResources) ? data.mediaResources : [],
        musicResources: Array.isArray(data.musicResources) ? data.musicResources : [],
        subtitleResources: Array.isArray(data.subtitleResources) ? data.subtitleResources : [],
        effectResources: Array.isArray(data.effectResources) ? data.effectResources : [],
        filterResources: Array.isArray(data.filterResources) ? data.filterResources : [],
        transitionResources: Array.isArray(data.transitionResources) ? data.transitionResources : [],
        templateResources: Array.isArray(data.templateResources) ? data.templateResources : [],
        styleTemplateResources: Array.isArray(data.styleTemplateResources) ? data.styleTemplateResources : [],
      }

      // Additional validation: ensure each resource has required properties
      validatedData.effectResources = validatedData.effectResources.filter(
        (resource: any) => resource && resource.effect && resource.resourceId,
      )
      validatedData.filterResources = validatedData.filterResources.filter(
        (resource: any) => resource && resource.filter && resource.resourceId,
      )
      validatedData.transitionResources = validatedData.transitionResources.filter(
        (resource: any) => resource && resource.transition && resource.resourceId,
      )

      return validatedData
    }
  } catch (error) {
    console.warn("Failed to load resources from localStorage, clearing corrupted data:", error)
    // Clear corrupted data
    try {
      localStorage.removeItem("timeline-studio-resources")
    } catch (e) {
      // Ignore error
    }
  }
  return {}
}

export const resourcesMachine = setup({
  types: {
    context: {} as ResourcesMachineContext,
    events: {} as ResourcesMachineEvent,
  },
  actions: {
    // Добавление эффекта
    addEffect: assign({
      resources: ({ context, event }) => {
        if (event.type !== "ADD_EFFECT") return context.resources

        // Проверяем, что effect существует
        if (!event.effect) {
          console.warn("[ResourcesMachine] ADD_EFFECT event missing effect property")
          return context.resources
        }

        // Проверяем, есть ли уже такой эффект
        const existingResource = context.effectResources.find((resource) => resource.resourceId === event.effect.id)

        if (existingResource) {
          return context.resources
        }

        const newResource = createEffectResource(event.effect)
        return [...context.resources, newResource]
      },
      effectResources: ({ context, event }) => {
        if (event.type !== "ADD_EFFECT") return context.effectResources

        // Проверяем, что effect существует
        if (!event.effect) {
          console.warn("[ResourcesMachine] ADD_EFFECT event missing effect property")
          return context.effectResources
        }

        // Проверяем, есть ли уже такой эффект
        const existingResource = context.effectResources.find((resource) => resource.resourceId === event.effect.id)

        if (existingResource) {
          return context.effectResources
        }

        const newResource = createEffectResource(event.effect)
        return [...context.effectResources, newResource]
      },
    }),

    // Добавление фильтра
    addFilter: assign({
      resources: ({ context, event }) => {
        if (event.type !== "ADD_FILTER") return context.resources

        // Проверяем, что filter существует
        if (!event.filter) {
          console.warn("[ResourcesMachine] ADD_FILTER event missing filter property")
          return context.resources
        }

        // Проверяем, есть ли уже такой фильтр
        const existingResource = context.filterResources.find((resource) => resource.resourceId === event.filter.id)

        if (existingResource) {
          return context.resources
        }

        const newResource = createFilterResource(event.filter)
        return [...context.resources, newResource]
      },
      filterResources: ({ context, event }) => {
        if (event.type !== "ADD_FILTER") return context.filterResources

        // Проверяем, что filter существует
        if (!event.filter) {
          console.warn("[ResourcesMachine] ADD_FILTER event missing filter property")
          return context.filterResources
        }

        // Проверяем, есть ли уже такой фильтр
        const existingResource = context.filterResources.find((resource) => resource.resourceId === event.filter.id)

        if (existingResource) {
          return context.filterResources
        }

        const newResource = createFilterResource(event.filter)
        return [...context.filterResources, newResource]
      },
    }),

    // Добавление перехода
    addTransition: assign({
      resources: ({ context, event }) => {
        if (event.type !== "ADD_TRANSITION") return context.resources

        // Проверяем, что transition существует
        if (!event.transition) {
          console.warn("[ResourcesMachine] ADD_TRANSITION event missing transition property")
          return context.resources
        }

        // Проверяем, есть ли уже такой переход
        const existingResource = context.transitionResources.find(
          (resource) => resource.resourceId === event.transition.id || resource.resourceId === event.transition.type,
        )

        if (existingResource) {
          return context.resources
        }

        const newResource = createTransitionResource(event.transition)
        return [...context.resources, newResource]
      },
      transitionResources: ({ context, event }) => {
        if (event.type !== "ADD_TRANSITION") return context.transitionResources

        // Проверяем, что transition существует
        if (!event.transition) {
          console.warn("[ResourcesMachine] ADD_TRANSITION event missing transition property")
          return context.transitionResources
        }

        // Проверяем, есть ли уже такой переход
        const existingResource = context.transitionResources.find(
          (resource) => resource.resourceId === event.transition.id || resource.resourceId === event.transition.type,
        )

        if (existingResource) {
          return context.transitionResources
        }

        const newResource = createTransitionResource(event.transition)
        return [...context.transitionResources, newResource]
      },
    }),

    // Добавление шаблона
    addTemplate: assign({
      resources: ({ context, event }) => {
        if (event.type !== "ADD_TEMPLATE") return context.resources

        // Проверяем, есть ли уже такой шаблон
        const existingResource = context.templateResources.find((resource) => resource.resourceId === event.template.id)

        if (existingResource) {
          return context.resources
        }

        const newResource = createTemplateResource(event.template)
        return [...context.resources, newResource]
      },
      templateResources: ({ context, event }) => {
        if (event.type !== "ADD_TEMPLATE") return context.templateResources

        // Проверяем, есть ли уже такой шаблон
        const existingResource = context.templateResources.find((resource) => resource.resourceId === event.template.id)

        if (existingResource) {
          return context.templateResources
        }

        const newResource = createTemplateResource(event.template)
        return [...context.templateResources, newResource]
      },
    }),

    // Добавление стилистического шаблона
    addStyleTemplate: assign({
      resources: ({ context, event }) => {
        if (event.type !== "ADD_STYLE_TEMPLATE") return context.resources

        // Проверяем, есть ли уже такой стилистический шаблон
        const existingResource = context.styleTemplateResources.find(
          (resource) => resource.resourceId === event.template.id,
        )

        if (existingResource) {
          return context.resources
        }

        const newResource = createStyleTemplateResource(event.template)
        return [...context.resources, newResource]
      },
      styleTemplateResources: ({ context, event }) => {
        if (event.type !== "ADD_STYLE_TEMPLATE") return context.styleTemplateResources

        // Проверяем, есть ли уже такой стилистический шаблон
        const existingResource = context.styleTemplateResources.find(
          (resource) => resource.resourceId === event.template.id,
        )

        if (existingResource) {
          return context.styleTemplateResources
        }

        const newResource = createStyleTemplateResource(event.template)
        return [...context.styleTemplateResources, newResource]
      },
    }),

    // Добавление музыкального файла
    addMusic: assign({
      resources: ({ context, event }) => {
        if (event.type !== "ADD_MUSIC") return context.resources

        // Проверяем, есть ли уже такой музыкальный файл
        const existingResource = context.musicResources.find((resource) => resource.resourceId === event.file.id)

        if (existingResource) {
          return context.resources
        }

        const newResource = createMusicResource(event.file)
        return [...context.resources, newResource]
      },
      musicResources: ({ context, event }) => {
        if (event.type !== "ADD_MUSIC") return context.musicResources

        // Проверяем, есть ли уже такой музыкальный файл
        const existingResource = context.musicResources.find((resource) => resource.resourceId === event.file.id)

        if (existingResource) {
          return context.musicResources
        }

        const newResource = createMusicResource(event.file)
        return [...context.musicResources, newResource]
      },
    }),

    // Добавление медиа файла
    addMedia: assign({
      resources: ({ context, event }) => {
        if (event.type !== "ADD_MEDIA") return context.resources

        // Проверяем, есть ли уже такой медиа файл
        const existingResource = context.mediaResources.find((resource) => resource.resourceId === event.file.id)

        if (existingResource) {
          return context.resources
        }

        const newResource = createMediaResource(event.file)
        return [...context.resources, newResource]
      },
      mediaResources: ({ context, event }) => {
        if (event.type !== "ADD_MEDIA") return context.mediaResources

        // Проверяем, есть ли уже такой медиа файл
        const existingResource = context.mediaResources.find((resource) => resource.resourceId === event.file.id)

        if (existingResource) {
          return context.mediaResources
        }

        const newResource = createMediaResource(event.file)
        return [...context.mediaResources, newResource]
      },
    }),

    // Добавление стиля субтитров
    addSubtitle: assign({
      resources: ({ context, event }) => {
        if (event.type !== "ADD_SUBTITLE") return context.resources

        // Проверяем, есть ли уже такой стиль субтитров
        const existingResource = context.subtitleResources.find((resource) => resource.resourceId === event.style.id)

        if (existingResource) {
          return context.resources
        }

        const newResource = createSubtitleResource(event.style)
        return [...context.resources, newResource]
      },
      subtitleResources: ({ context, event }) => {
        if (event.type !== "ADD_SUBTITLE") return context.subtitleResources

        // Проверяем, есть ли уже такой стиль субтитров
        const existingResource = context.subtitleResources.find((resource) => resource.resourceId === event.style.id)

        if (existingResource) {
          return context.subtitleResources
        }

        const newResource = createSubtitleResource(event.style)
        return [...context.subtitleResources, newResource]
      },
    }),

    // Удаление ресурса
    removeResource: assign({
      resources: ({ context, event }) => {
        if (event.type !== "REMOVE_RESOURCE") return context.resources
        return context.resources.filter(
          (resource) => resource.id !== event.resourceId && resource.resourceId !== event.resourceId,
        )
      },
      mediaResources: ({ context, event }) => {
        if (event.type !== "REMOVE_RESOURCE") return context.mediaResources
        return context.mediaResources.filter(
          (resource) => resource.id !== event.resourceId && resource.resourceId !== event.resourceId,
        )
      },
      effectResources: ({ context, event }) => {
        if (event.type !== "REMOVE_RESOURCE") return context.effectResources
        return context.effectResources.filter(
          (resource) => resource.id !== event.resourceId && resource.resourceId !== event.resourceId,
        )
      },
      filterResources: ({ context, event }) => {
        if (event.type !== "REMOVE_RESOURCE") return context.filterResources
        return context.filterResources.filter(
          (resource) => resource.id !== event.resourceId && resource.resourceId !== event.resourceId,
        )
      },
      transitionResources: ({ context, event }) => {
        if (event.type !== "REMOVE_RESOURCE") return context.transitionResources
        return context.transitionResources.filter(
          (resource) => resource.id !== event.resourceId && resource.resourceId !== event.resourceId,
        )
      },
      templateResources: ({ context, event }) => {
        if (event.type !== "REMOVE_RESOURCE") return context.templateResources
        return context.templateResources.filter(
          (resource) => resource.id !== event.resourceId && resource.resourceId !== event.resourceId,
        )
      },
      styleTemplateResources: ({ context, event }) => {
        if (event.type !== "REMOVE_RESOURCE") return context.styleTemplateResources
        return context.styleTemplateResources.filter(
          (resource) => resource.id !== event.resourceId && resource.resourceId !== event.resourceId,
        )
      },
      musicResources: ({ context, event }) => {
        if (event.type !== "REMOVE_RESOURCE") return context.musicResources
        return context.musicResources.filter(
          (resource) => resource.id !== event.resourceId && resource.resourceId !== event.resourceId,
        )
      },
      subtitleResources: ({ context, event }) => {
        if (event.type !== "REMOVE_RESOURCE") return context.subtitleResources
        return context.subtitleResources.filter(
          (resource) => resource.id !== event.resourceId && resource.resourceId !== event.resourceId,
        )
      },
    }),

    // Загрузка ресурсов
    loadResources: assign({
      resources: ({ event }) => {
        if (event.type !== "LOAD_RESOURCES") return []
        return event.resources
      },
      // Разделяем ресурсы по типам
      effectResources: ({ event }) => {
        if (event.type !== "LOAD_RESOURCES") return []
        return event.resources.filter((r) => r.type === "effect").map((r) => ({ ...r, effect: {} as VideoEffect }))
      },
      filterResources: ({ event }) => {
        if (event.type !== "LOAD_RESOURCES") return []
        return event.resources.filter((r) => r.type === "filter").map((r) => ({ ...r, filter: {} as VideoFilter }))
      },
      transitionResources: ({ event }) => {
        if (event.type !== "LOAD_RESOURCES") return []
        return event.resources
          .filter((r) => r.type === "transition")
          .map((r) => ({ ...r, transition: {} as Transition }))
      },
      templateResources: ({ event }) => {
        if (event.type !== "LOAD_RESOURCES") return []
        return event.resources
          .filter((r) => r.type === "template")
          .map((r) => ({ ...r, template: {} as MediaTemplate }))
      },
      styleTemplateResources: ({ event }) => {
        if (event.type !== "LOAD_RESOURCES") return []
        return event.resources
          .filter((r) => r.type === "styleTemplate")
          .map((r) => ({ ...r, template: {} as StyleTemplate }))
      },
      mediaResources: ({ event }) => {
        if (event.type !== "LOAD_RESOURCES") return []
        return event.resources.filter((r) => r.type === "media").map((r) => ({ ...r, file: {} as MediaFile }))
      },
      musicResources: ({ event }) => {
        if (event.type !== "LOAD_RESOURCES") return []
        return event.resources.filter((r) => r.type === "music").map((r) => ({ ...r, file: {} as MediaFile }))
      },
      subtitleResources: ({ event }) => {
        if (event.type !== "LOAD_RESOURCES") return []
        return event.resources.filter((r) => r.type === "subtitle").map((r) => ({ ...r, style: {} as SubtitleStyle }))
      },
    }),

    // Очистка всех ресурсов
    clearResources: assign({
      resources: () => [],
      mediaResources: () => [],
      effectResources: () => [],
      filterResources: () => [],
      transitionResources: () => [],
      templateResources: () => [],
      styleTemplateResources: () => [],
      musicResources: () => [],
      subtitleResources: () => [],
    }),

    // Обновление ресурса
    updateResource: assign({
      resources: ({ context, event }) => {
        if (event.type !== "UPDATE_RESOURCE") return context.resources

        return context.resources.map((resource) => {
          if (resource.id === event.resourceId || resource.resourceId === event.resourceId) {
            return {
              ...resource,
              params: {
                ...resource.params,
                ...event.params,
              },
            }
          }
          return resource
        })
      },
      effectResources: ({ context, event }) => {
        if (event.type !== "UPDATE_RESOURCE") return context.effectResources

        return context.effectResources.map((resource) => {
          if (resource.id === event.resourceId || resource.resourceId === event.resourceId) {
            return {
              ...resource,
              params: {
                ...resource.params,
                ...event.params,
              },
            }
          }
          return resource
        })
      },
      filterResources: ({ context, event }) => {
        if (event.type !== "UPDATE_RESOURCE") return context.filterResources

        return context.filterResources.map((resource) => {
          if (resource.id === event.resourceId || resource.resourceId === event.resourceId) {
            return {
              ...resource,
              params: {
                ...resource.params,
                ...event.params,
              },
            }
          }
          return resource
        })
      },
      transitionResources: ({ context, event }) => {
        if (event.type !== "UPDATE_RESOURCE") return context.transitionResources

        return context.transitionResources.map((resource) => {
          if (resource.id === event.resourceId || resource.resourceId === event.resourceId) {
            return {
              ...resource,
              params: {
                ...resource.params,
                ...event.params,
              },
            }
          }
          return resource
        })
      },
      templateResources: ({ context, event }) => {
        if (event.type !== "UPDATE_RESOURCE") return context.templateResources

        return context.templateResources.map((resource) => {
          if (resource.id === event.resourceId || resource.resourceId === event.resourceId) {
            return {
              ...resource,
              params: {
                ...resource.params,
                ...event.params,
              },
            }
          }
          return resource
        })
      },
      styleTemplateResources: ({ context, event }) => {
        if (event.type !== "UPDATE_RESOURCE") return context.styleTemplateResources

        return context.styleTemplateResources.map((resource) => {
          if (resource.id === event.resourceId || resource.resourceId === event.resourceId) {
            return {
              ...resource,
              params: {
                ...resource.params,
                ...event.params,
              },
            }
          }
          return resource
        })
      },
      musicResources: ({ context, event }) => {
        if (event.type !== "UPDATE_RESOURCE") return context.musicResources

        return context.musicResources.map((resource) => {
          if (resource.id === event.resourceId || resource.resourceId === event.resourceId) {
            return {
              ...resource,
              params: {
                ...resource.params,
                ...event.params,
              },
            }
          }
          return resource
        })
      },
      subtitleResources: ({ context, event }) => {
        if (event.type !== "UPDATE_RESOURCE") return context.subtitleResources

        return context.subtitleResources.map((resource) => {
          if (resource.id === event.resourceId || resource.resourceId === event.resourceId) {
            return {
              ...resource,
              params: {
                ...resource.params,
                ...event.params,
              },
            }
          }
          return resource
        })
      },
    }),
  },
}).createMachine({
  id: "resources",
  initial: "active",
  context: {
    resources: [],
    mediaResources: [],
    effectResources: [],
    filterResources: [],
    transitionResources: [],
    templateResources: [],
    styleTemplateResources: [],
    musicResources: [],
    subtitleResources: [],
    ...loadResourcesFromStorage(),
  },
  states: {
    active: {
      on: {
        ADD_EFFECT: {
          actions: "addEffect",
        },
        ADD_FILTER: {
          actions: "addFilter",
        },
        ADD_TRANSITION: {
          actions: "addTransition",
        },
        ADD_TEMPLATE: {
          actions: "addTemplate",
        },
        ADD_STYLE_TEMPLATE: {
          actions: "addStyleTemplate",
        },
        ADD_MEDIA: {
          actions: "addMedia",
        },
        ADD_MUSIC: {
          actions: "addMusic",
        },
        ADD_SUBTITLE: {
          actions: "addSubtitle",
        },
        REMOVE_RESOURCE: {
          actions: "removeResource",
        },
        UPDATE_RESOURCE: {
          actions: "updateResource",
        },
        LOAD_RESOURCES: {
          actions: "loadResources",
        },
        CLEAR_RESOURCES: {
          actions: "clearResources",
        },
      },
    },
  },
})
