import { assign, createMachine } from "xstate"

import { MediaFile } from "@/features/media/types/media"

export interface PlayerContextType {
  video: MediaFile | null
  currentTime: number
  duration: number
  volume: number

  isPlaying: boolean
  isSeeking: boolean
  isChangingCamera: boolean
  isRecording: boolean
  isVideoLoading: boolean
  isVideoReady: boolean
  isResizableMode: boolean // Флаг, указывающий, что шаблоны должны быть resizable

  // Настройки пререндера
  prerenderEnabled: boolean
  prerenderQuality: number
  prerenderSegmentDuration: number
  prerenderApplyEffects: boolean
  prerenderAutoPrerender: boolean

  // Новые поля для функции "Применить"
  previewMedia: MediaFile | null // Медиа для предпросмотра
  videoSource: "browser" | "timeline" // Источник видео

  // Примененные эффекты и фильтры
  appliedEffects: Array<{ id: string; name: string; params: any }>
  appliedFilters: Array<{ id: string; name: string; params: any }>
  appliedTemplate: {
    id: string
    name: string
    files: MediaFile[]
  } | null
}

// Начальный контекст для машины состояний плеера
// Значение громкости будет заменено на значение из пользовательских настроек в провайдере
const initialContext: PlayerContextType = {
  video: null,
  currentTime: 0,
  isPlaying: false,
  isSeeking: false,
  isChangingCamera: false,
  isRecording: false,
  isVideoLoading: false,
  isVideoReady: false,
  isResizableMode: false,
  duration: 0,
  volume: 100, // Значение по умолчанию, будет заменено из пользовательских настроек

  // Настройки пререндера по умолчанию
  prerenderEnabled: false,
  prerenderQuality: 75,
  prerenderSegmentDuration: 5,
  prerenderApplyEffects: true,
  prerenderAutoPrerender: true,

  // Новые поля
  previewMedia: null,
  videoSource: "browser",

  // Примененные эффекты и фильтры
  appliedEffects: [],
  appliedFilters: [],
  appliedTemplate: null,
}

interface SetCurrentTimeEvent {
  type: "setCurrentTime"
  currentTime: number
}

interface SetIsPlayingEvent {
  type: "setIsPlaying"
  isPlaying: boolean
}

interface SetIsSeekingEvent {
  type: "setIsSeeking"
  isSeeking: boolean
}

interface SetIsChangingCameraEvent {
  type: "setIsChangingCamera"
  isChangingCamera: boolean
}

interface SetIsRecordingEvent {
  type: "setIsRecording"
  isRecording: boolean
}

interface SetDurationEvent {
  type: "setDuration"
  duration: number
}

interface SetVolumeEvent {
  type: "setVolume"
  volume: number
}

interface SetVideoEvent {
  type: "setVideo"
  video: MediaFile
}

interface SetVideoLoadingEvent {
  type: "setVideoLoading"
  isVideoLoading: boolean
}

interface SetVideoReadyEvent {
  type: "setVideoReady"
  isVideoReady: boolean
}

interface SetIsResizableModeEvent {
  type: "setIsResizableMode"
  isResizableMode: boolean
}

interface SetPrerenderSettingsEvent {
  type: "setPrerenderSettings"
  prerenderEnabled?: boolean
  prerenderQuality?: number
  prerenderSegmentDuration?: number
  prerenderApplyEffects?: boolean
  prerenderAutoPrerender?: boolean
}

interface SetPreviewMediaEvent {
  type: "setPreviewMedia"
  media: MediaFile | null
}

interface SetVideoSourceEvent {
  type: "setVideoSource"
  source: "browser" | "timeline"
}

interface ApplyEffectEvent {
  type: "applyEffect"
  effect: { id: string; name: string; params: any }
}

interface ApplyFilterEvent {
  type: "applyFilter"
  filter: { id: string; name: string; params: any }
}

interface ApplyTemplateEvent {
  type: "applyTemplate"
  template: { id: string; name: string }
  files: MediaFile[]
}

interface ClearEffectsEvent {
  type: "clearEffects"
}

interface ClearFiltersEvent {
  type: "clearFilters"
}

interface ClearTemplateEvent {
  type: "clearTemplate"
}

export type PlayerEvent =
  | SetCurrentTimeEvent
  | SetIsPlayingEvent
  | SetIsSeekingEvent
  | SetIsChangingCameraEvent
  | SetIsRecordingEvent
  | SetDurationEvent
  | SetVolumeEvent
  | SetVideoEvent
  | SetVideoLoadingEvent
  | SetVideoReadyEvent
  | SetIsResizableModeEvent
  | SetPrerenderSettingsEvent
  | SetPreviewMediaEvent
  | SetVideoSourceEvent
  | ApplyEffectEvent
  | ApplyFilterEvent
  | ApplyTemplateEvent
  | ClearEffectsEvent
  | ClearFiltersEvent
  | ClearTemplateEvent

// Переиспользуемые actions для применения эффектов/фильтров/шаблонов
const applyEffectAction = assign({
  appliedEffects: ({ context, event }: { context: PlayerContextType; event: ApplyEffectEvent }) => [
    ...context.appliedEffects,
    event.effect,
  ],
})

const applyFilterAction = assign({
  appliedFilters: ({ context, event }: { context: PlayerContextType; event: ApplyFilterEvent }) => [
    ...context.appliedFilters,
    event.filter,
  ],
})

const applyTemplateAction = assign({
  appliedTemplate: ({ event }: { event: ApplyTemplateEvent }) => ({
    id: event.template.id,
    name: event.template.name,
    files: event.files,
  }),
})

const clearEffectsAction = assign({ appliedEffects: [] })
const clearFiltersAction = assign({ appliedFilters: [] })
const clearTemplateAction = assign({ appliedTemplate: null })

export const playerMachine = createMachine({
  id: "player",
  initial: "idle",
  context: initialContext,
  states: {
    idle: {
      on: {
        setVideo: {
          target: "loading",
          actions: [
            assign({ video: ({ event }) => event.video }),
            assign({ isVideoLoading: true }),
            // Добавляем логирование
            ({ event }) => {
              console.log(`[PlayerMachine] Установлено видео: ${event.video?.id}, path=${event.video?.path}`)
            },
          ],
        },
        setCurrentTime: {
          actions: assign({ currentTime: ({ event }) => event.currentTime }),
        },
        setIsPlaying: {
          actions: assign({ isPlaying: ({ event }) => event.isPlaying }),
        },
        setIsSeeking: {
          actions: assign({ isSeeking: ({ event }) => event.isSeeking }),
        },
        setIsChangingCamera: {
          actions: assign({
            isChangingCamera: ({ event }) => event.isChangingCamera,
          }),
        },
        setIsRecording: {
          actions: assign({ isRecording: ({ event }) => event.isRecording }),
        },
        setDuration: {
          actions: assign({ duration: ({ event }) => event.duration }),
        },
        setVolume: {
          actions: assign({ volume: ({ event }) => event.volume }),
        },
        setIsResizableMode: {
          actions: assign({
            isResizableMode: ({ event }) => event.isResizableMode,
          }),
        },
        setPrerenderSettings: {
          actions: assign({
            prerenderEnabled: ({ event, context }) => event.prerenderEnabled ?? context.prerenderEnabled,
            prerenderQuality: ({ event, context }) => event.prerenderQuality ?? context.prerenderQuality,
            prerenderSegmentDuration: ({ event, context }) =>
              event.prerenderSegmentDuration ?? context.prerenderSegmentDuration,
            prerenderApplyEffects: ({ event, context }) => event.prerenderApplyEffects ?? context.prerenderApplyEffects,
            prerenderAutoPrerender: ({ event, context }) =>
              event.prerenderAutoPrerender ?? context.prerenderAutoPrerender,
          }),
        },
        setPreviewMedia: {
          actions: [
            assign({ previewMedia: ({ event }) => event.media }),
            ({ event }) => {
              console.log(`[PlayerMachine] Установлено preview media: ${event.media?.id}`)
            },
          ],
        },
        setVideoSource: {
          actions: [
            assign({ videoSource: ({ event }) => event.source }),
            ({ event }) => {
              console.log(`[PlayerMachine] Установлен источник видео: ${event.source}`)
            },
          ],
        },
        applyEffect: {
          actions: [
            applyEffectAction,
            ({ event }) => {
              console.log(`[PlayerMachine] Применен эффект: ${event.effect.name}`)
            },
          ],
        },
        applyFilter: {
          actions: [
            applyFilterAction,
            ({ event }) => {
              console.log(`[PlayerMachine] Применен фильтр: ${event.filter.name}`)
            },
          ],
        },
        applyTemplate: {
          actions: [
            applyTemplateAction,
            ({ event }) => {
              console.log(`[PlayerMachine] Применен шаблон: ${event.template.name} с ${event.files.length} файлами`)
            },
          ],
        },
        clearEffects: {
          actions: [
            clearEffectsAction,
            () => {
              console.log("[PlayerMachine] Очищены эффекты")
            },
          ],
        },
        clearFilters: {
          actions: [
            clearFiltersAction,
            () => {
              console.log("[PlayerMachine] Очищены фильтры")
            },
          ],
        },
        clearTemplate: {
          actions: [
            clearTemplateAction,
            () => {
              console.log("[PlayerMachine] Очищен шаблон")
            },
          ],
        },
      },
    },
    loading: {
      on: {
        setVideoReady: {
          target: "ready",
          actions: [
            assign({ isVideoReady: true, isVideoLoading: false }),
            // Добавляем логирование
            ({ context }) => {
              console.log(`[PlayerMachine] Видео ${context.video?.id} готово к воспроизведению`)
            },
          ],
        },
        setVideoLoading: {
          actions: assign({
            isVideoLoading: ({ event }) => event.isVideoLoading,
          }),
        },
        setIsPlaying: {
          actions: assign({ isPlaying: ({ event }) => event.isPlaying }),
        },
        setCurrentTime: {
          actions: assign({ currentTime: ({ event }) => event.currentTime }),
        },
        setIsSeeking: {
          actions: assign({ isSeeking: ({ event }) => event.isSeeking }),
        },
        setIsChangingCamera: {
          actions: assign({
            isChangingCamera: ({ event }) => event.isChangingCamera,
          }),
        },
        setIsRecording: {
          actions: assign({ isRecording: ({ event }) => event.isRecording }),
        },
        setDuration: {
          actions: assign({ duration: ({ event }) => event.duration }),
        },
        setVolume: {
          actions: assign({ volume: ({ event }) => event.volume }),
        },
        setIsResizableMode: {
          actions: assign({
            isResizableMode: ({ event }) => event.isResizableMode,
          }),
        },
        setPrerenderSettings: {
          actions: assign({
            prerenderEnabled: ({ event, context }) => event.prerenderEnabled ?? context.prerenderEnabled,
            prerenderQuality: ({ event, context }) => event.prerenderQuality ?? context.prerenderQuality,
            prerenderSegmentDuration: ({ event, context }) =>
              event.prerenderSegmentDuration ?? context.prerenderSegmentDuration,
            prerenderApplyEffects: ({ event, context }) => event.prerenderApplyEffects ?? context.prerenderApplyEffects,
            prerenderAutoPrerender: ({ event, context }) =>
              event.prerenderAutoPrerender ?? context.prerenderAutoPrerender,
          }),
        },
        setPreviewMedia: {
          actions: [
            assign({ previewMedia: ({ event }) => event.media }),
            ({ event }) => {
              console.log(`[PlayerMachine] Установлено preview media: ${event.media?.id}`)
            },
          ],
        },
        setVideoSource: {
          actions: [
            assign({ videoSource: ({ event }) => event.source }),
            ({ event }) => {
              console.log(`[PlayerMachine] Установлен источник видео: ${event.source}`)
            },
          ],
        },
        applyEffect: {
          actions: [applyEffectAction],
        },
        applyFilter: {
          actions: [applyFilterAction],
        },
        applyTemplate: {
          actions: [applyTemplateAction],
        },
        clearEffects: {
          actions: [clearEffectsAction],
        },
        clearFilters: {
          actions: [clearFiltersAction],
        },
        clearTemplate: {
          actions: [clearTemplateAction],
        },
      },
    },
    ready: {
      on: {
        setVideo: {
          target: "loading",
          actions: [
            assign({ video: ({ event }) => event.video }),
            assign({ isVideoLoading: true }),
            // Добавляем логирование
            ({ event }) => {
              console.log(
                `[PlayerMachine] Установлено видео в состоянии ready: ${event.video?.id}, path=${event.video?.path}`,
              )
            },
          ],
        },
        setIsPlaying: {
          actions: assign({ isPlaying: ({ event }) => event.isPlaying }),
        },
        setCurrentTime: {
          actions: assign({ currentTime: ({ event }) => event.currentTime }),
        },
        setIsSeeking: {
          actions: assign({ isSeeking: ({ event }) => event.isSeeking }),
        },
        setIsChangingCamera: {
          actions: assign({
            isChangingCamera: ({ event }) => event.isChangingCamera,
          }),
        },
        setIsRecording: {
          actions: assign({ isRecording: ({ event }) => event.isRecording }),
        },
        setDuration: {
          actions: assign({ duration: ({ event }) => event.duration }),
        },
        setVolume: {
          actions: assign({ volume: ({ event }) => event.volume }),
        },
        setIsResizableMode: {
          actions: assign({
            isResizableMode: ({ event }) => event.isResizableMode,
          }),
        },
        setPrerenderSettings: {
          actions: assign({
            prerenderEnabled: ({ event, context }) => event.prerenderEnabled ?? context.prerenderEnabled,
            prerenderQuality: ({ event, context }) => event.prerenderQuality ?? context.prerenderQuality,
            prerenderSegmentDuration: ({ event, context }) =>
              event.prerenderSegmentDuration ?? context.prerenderSegmentDuration,
            prerenderApplyEffects: ({ event, context }) => event.prerenderApplyEffects ?? context.prerenderApplyEffects,
            prerenderAutoPrerender: ({ event, context }) =>
              event.prerenderAutoPrerender ?? context.prerenderAutoPrerender,
          }),
        },
        setPreviewMedia: {
          actions: [
            assign({ previewMedia: ({ event }) => event.media }),
            ({ event }) => {
              console.log(`[PlayerMachine] Установлено preview media: ${event.media?.id}`)
            },
          ],
        },
        setVideoSource: {
          actions: [
            assign({ videoSource: ({ event }) => event.source }),
            ({ event }) => {
              console.log(`[PlayerMachine] Установлен источник видео: ${event.source}`)
            },
          ],
        },
        applyEffect: {
          actions: [applyEffectAction],
        },
        applyFilter: {
          actions: [applyFilterAction],
        },
        applyTemplate: {
          actions: [applyTemplateAction],
        },
        clearEffects: {
          actions: [clearEffectsAction],
        },
        clearFilters: {
          actions: [clearFiltersAction],
        },
        clearTemplate: {
          actions: [clearTemplateAction],
        },
      },
    },
  },
})
