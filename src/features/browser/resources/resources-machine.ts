import { assign, createMachine, setup } from "xstate"

import { SubtitleStyle } from "@/features/browser/components/tabs/subtitles/subtitles"
import { MediaTemplate } from "@/features/browser/components/tabs/templates/templates"
import { VideoEffect } from "@/types/effects"
import { VideoFilter } from "@/types/filters"
import { MediaFile } from "@/types/media"
import {
  EffectResource,
  FilterResource,
  MusicResource,
  SubtitleResource,
  TemplateResource,
  TimelineResource,
  TransitionResource,
  createEffectResource,
  createFilterResource,
  createMusicResource,
  createSubtitleResource,
  createTemplateResource,
  createTransitionResource,
} from "@/types/resources"
import { TransitionEffect } from "@/types/transitions"

// Интерфейс контекста машины состояний
export interface ResourcesMachineContext {
  resources: TimelineResource[] // Все добавленные ресурсы
  effectResources: EffectResource[] // Эффекты
  filterResources: FilterResource[] // Фильтры
  transitionResources: TransitionResource[] // Переходы
  templateResources: TemplateResource[] // Шаблоны
  musicResources: MusicResource[] // Музыкальные файлы
  subtitleResources: SubtitleResource[] // Стили субтитров
}

// Типы событий, которые может обрабатывать машина
type ResourcesMachineEvent =
  | { type: "ADD_EFFECT"; effect: VideoEffect }
  | { type: "ADD_FILTER"; filter: VideoFilter }
  | { type: "ADD_TRANSITION"; transition: TransitionEffect }
  | { type: "ADD_TEMPLATE"; template: MediaTemplate }
  | { type: "ADD_MUSIC"; file: MediaFile }
  | { type: "ADD_SUBTITLE"; style: SubtitleStyle }
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
        return context.resources.filter((resource) => resource.id !== event.resourceId)
      },
      effectResources: ({ context, event }) => {
        if (event.type !== "REMOVE_RESOURCE") return context.effectResources
        return context.effectResources.filter((resource) => resource.id !== event.resourceId)
      },
      filterResources: ({ context, event }) => {
        if (event.type !== "REMOVE_RESOURCE") return context.filterResources
        return context.filterResources.filter((resource) => resource.id !== event.resourceId)
      },
      transitionResources: ({ context, event }) => {
        if (event.type !== "REMOVE_RESOURCE") return context.transitionResources
        return context.transitionResources.filter((resource) => resource.id !== event.resourceId)
      },
      templateResources: ({ context, event }) => {
        if (event.type !== "REMOVE_RESOURCE") return context.templateResources
        return context.templateResources.filter((resource) => resource.id !== event.resourceId)
      },
      musicResources: ({ context, event }) => {
        if (event.type !== "REMOVE_RESOURCE") return context.musicResources
        return context.musicResources.filter((resource) => resource.id !== event.resourceId)
      },
      subtitleResources: ({ context, event }) => {
        if (event.type !== "REMOVE_RESOURCE") return context.subtitleResources
        return context.subtitleResources.filter((resource) => resource.id !== event.resourceId)
      },
    }),

    // Обновление ресурса
    updateResource: assign({
      resources: ({ context, event }) => {
        if (event.type !== "UPDATE_RESOURCE") return context.resources

        return context.resources.map((resource) => {
          if (resource.id === event.resourceId) {
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
          if (resource.id === event.resourceId) {
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
          if (resource.id === event.resourceId) {
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
          if (resource.id === event.resourceId) {
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
          if (resource.id === event.resourceId) {
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
          if (resource.id === event.resourceId) {
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
          if (resource.id === event.resourceId) {
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
    effectResources: [],
    filterResources: [],
    transitionResources: [],
    templateResources: [],
    musicResources: [],
    subtitleResources: [],
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
      },
    },
  },
})
