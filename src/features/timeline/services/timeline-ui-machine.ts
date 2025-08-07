/**
 * Timeline UI State Machine
 *
 * Управляет только UI состоянием timeline, данные проекта берутся из backend
 */

import { assign, setup } from "xstate"

import type { ClipboardData } from "../utils/clip-operations"

// UI состояние timeline
export interface TimelineUIContext {
  // Состояние воспроизведения (синхронизируется с backend)
  isPlaying: boolean
  currentTime: number
  playbackRate: number

  // UI состояние
  timeScale: number
  scrollPosition: { x: number; y: number }
  editMode: "select" | "cut" | "trim" | "move"
  snapMode: "none" | "grid" | "clips" | "markers"

  // Выделение
  selectedClipIds: string[]
  selectedTrackIds: string[]
  selectedSectionIds: string[]

  // Операции перетаскивания
  isDragging: boolean
  draggedClipId: string | null
  draggedTrackId: string | null
  draggedResourceType: "transition" | "effect" | "filter" | null
  draggedResourceId: string | null

  // Буфер обмена
  clipboard: ClipboardData | null

  // UI флаги
  isRecording: boolean
  showWaveforms: boolean
  showThumbnails: boolean
  showMarkers: boolean

  // Ошибки UI
  uiError: string | null
}

export type TimelineUIEvent =
  // Синхронизация с backend
  | { type: "SYNC_PLAYBACK_STATE"; isPlaying: boolean; currentTime: number; playbackRate: number }

  // UI состояние
  | { type: "SET_TIME_SCALE"; scale: number }
  | { type: "SET_SCROLL_POSITION"; x: number; y: number }
  | { type: "SET_EDIT_MODE"; mode: "select" | "cut" | "trim" | "move" }
  | { type: "TOGGLE_SNAP"; snapMode: "none" | "grid" | "clips" | "markers" }

  // Выделение
  | { type: "SELECT_CLIPS"; clipIds: string[]; addToSelection?: boolean }
  | { type: "SELECT_TRACKS"; trackIds: string[]; addToSelection?: boolean }
  | { type: "SELECT_SECTIONS"; sectionIds: string[]; addToSelection?: boolean }
  | { type: "CLEAR_SELECTION" }

  // Операции перетаскивания
  | { type: "START_DRAG_CLIP"; clipId: string }
  | { type: "START_DRAG_TRACK"; trackId: string }
  | { type: "START_DRAG_TRANSITION"; transitionId: string }
  | { type: "START_DRAG_EFFECT"; effectId: string }
  | { type: "START_DRAG_FILTER"; filterId: string }
  | { type: "STOP_DRAG" }

  // Буфер обмена
  | { type: "COPY_SELECTION"; clipboardData: ClipboardData }
  | { type: "CUT_SELECTION"; clipboardData: ClipboardData }
  | { type: "CLEAR_CLIPBOARD" }

  // Флаги UI
  | { type: "SET_RECORDING"; isRecording: boolean }
  | { type: "TOGGLE_WAVEFORMS" }
  | { type: "TOGGLE_THUMBNAILS" }
  | { type: "TOGGLE_MARKERS" }

  // Resources
  | { type: "APPLY_TRANSITION"; leftClipId: string; rightClipId: string; transitionId: string }
  | { type: "REMOVE_TRANSITION"; leftClipId: string; rightClipId: string }
  | { type: "UPDATE_TRANSITION"; transitionId: string; parameters: Record<string, any> }

  // Ошибки
  | { type: "SET_UI_ERROR"; error: string }
  | { type: "CLEAR_UI_ERROR" }

export const timelineUIMachine = setup({
  types: {} as {
    context: TimelineUIContext
    events: TimelineUIEvent
  },

  actions: {
    // Синхронизация с backend
    syncPlaybackState: assign({
      isPlaying: ({ event }) => (event.type === "SYNC_PLAYBACK_STATE" ? event.isPlaying : false),
      currentTime: ({ event }) => (event.type === "SYNC_PLAYBACK_STATE" ? event.currentTime : 0),
      playbackRate: ({ event }) => (event.type === "SYNC_PLAYBACK_STATE" ? event.playbackRate : 1),
    }),

    // UI состояние
    setTimeScale: assign({
      timeScale: ({ event }) => (event.type === "SET_TIME_SCALE" ? event.scale : 1),
    }),

    setScrollPosition: assign({
      scrollPosition: ({ event }) =>
        event.type === "SET_SCROLL_POSITION" ? { x: event.x, y: event.y } : { x: 0, y: 0 },
    }),

    setEditMode: assign({
      editMode: ({ event }) => (event.type === "SET_EDIT_MODE" ? event.mode : "select"),
    }),

    toggleSnap: assign({
      snapMode: ({ event }) => (event.type === "TOGGLE_SNAP" ? event.snapMode : "none"),
    }),

    // Выделение
    selectClips: assign({
      selectedClipIds: ({ context, event }) => {
        if (event.type !== "SELECT_CLIPS") return context.selectedClipIds

        if (event.addToSelection) {
          return [...new Set([...context.selectedClipIds, ...event.clipIds])]
        }
        return event.clipIds
      },
    }),

    selectTracks: assign({
      selectedTrackIds: ({ context, event }) => {
        if (event.type !== "SELECT_TRACKS") return context.selectedTrackIds

        if (event.addToSelection) {
          return [...new Set([...context.selectedTrackIds, ...event.trackIds])]
        }
        return event.trackIds
      },
    }),

    selectSections: assign({
      selectedSectionIds: ({ context, event }) => {
        if (event.type !== "SELECT_SECTIONS") return context.selectedSectionIds

        if (event.addToSelection) {
          return [...new Set([...context.selectedSectionIds, ...event.sectionIds])]
        }
        return event.sectionIds
      },
    }),

    clearSelection: assign({
      selectedClipIds: () => [],
      selectedTrackIds: () => [],
      selectedSectionIds: () => [],
    }),

    // Операции перетаскивания
    startDragClip: assign({
      isDragging: () => true,
      draggedClipId: ({ event }) => (event.type === "START_DRAG_CLIP" ? event.clipId : null),
      draggedTrackId: () => null,
    }),

    startDragTrack: assign({
      isDragging: () => true,
      draggedTrackId: ({ event }) => (event.type === "START_DRAG_TRACK" ? event.trackId : null),
      draggedClipId: () => null,
      draggedResourceType: () => null,
      draggedResourceId: () => null,
    }),

    startDragResource: assign({
      isDragging: () => true,
      draggedResourceType: ({ event }) => {
        if (event.type === "START_DRAG_TRANSITION") return "transition"
        if (event.type === "START_DRAG_EFFECT") return "effect"
        if (event.type === "START_DRAG_FILTER") return "filter"
        return null
      },
      draggedResourceId: ({ event }) => {
        if (event.type === "START_DRAG_TRANSITION") return event.transitionId
        if (event.type === "START_DRAG_EFFECT") return event.effectId
        if (event.type === "START_DRAG_FILTER") return event.filterId
        return null
      },
      draggedClipId: () => null,
      draggedTrackId: () => null,
    }),

    stopDrag: assign({
      isDragging: () => false,
      draggedClipId: () => null,
      draggedTrackId: () => null,
      draggedResourceType: () => null,
      draggedResourceId: () => null,
    }),

    // Буфер обмена
    setClipboard: assign({
      clipboard: ({ event }) =>
        event.type === "COPY_SELECTION" || event.type === "CUT_SELECTION" ? event.clipboardData : null,
    }),

    clearClipboard: assign({
      clipboard: () => null,
    }),

    // Флаги UI
    setRecording: assign({
      isRecording: ({ event }) => (event.type === "SET_RECORDING" ? event.isRecording : false),
    }),

    toggleWaveforms: assign({
      showWaveforms: ({ context }) => !context.showWaveforms,
    }),

    toggleThumbnails: assign({
      showThumbnails: ({ context }) => !context.showThumbnails,
    }),

    toggleMarkers: assign({
      showMarkers: ({ context }) => !context.showMarkers,
    }),

    // Ошибки
    setUIError: assign({
      uiError: ({ event }) => (event.type === "SET_UI_ERROR" ? event.error : null),
    }),

    clearUIError: assign({
      uiError: () => null,
    }),
  },

  guards: {
    hasSelection: ({ context }) =>
      context.selectedClipIds.length > 0 ||
      context.selectedTrackIds.length > 0 ||
      context.selectedSectionIds.length > 0,

    isDragging: ({ context }) => context.isDragging,

    hasClipboard: ({ context }) => context.clipboard !== null,
  },
}).createMachine({
  id: "timelineUI",
  initial: "idle",

  context: {
    // Состояние воспроизведения
    isPlaying: false,
    currentTime: 0,
    playbackRate: 1,

    // UI состояние
    timeScale: 1,
    scrollPosition: { x: 0, y: 0 },
    editMode: "select",
    snapMode: "none",

    // Выделение
    selectedClipIds: [],
    selectedTrackIds: [],
    selectedSectionIds: [],

    // Операции перетаскивания
    isDragging: false,
    draggedClipId: null,
    draggedTrackId: null,
    draggedResourceType: null,
    draggedResourceId: null,

    // Буфер обмена
    clipboard: null,

    // UI флаги
    isRecording: false,
    showWaveforms: true,
    showThumbnails: true,
    showMarkers: true,

    // Ошибки UI
    uiError: null,
  },

  states: {
    idle: {
      on: {
        // Синхронизация с backend
        SYNC_PLAYBACK_STATE: {
          actions: "syncPlaybackState",
        },

        // UI состояние
        SET_TIME_SCALE: {
          actions: "setTimeScale",
        },
        SET_SCROLL_POSITION: {
          actions: "setScrollPosition",
        },
        SET_EDIT_MODE: {
          actions: "setEditMode",
        },
        TOGGLE_SNAP: {
          actions: "toggleSnap",
        },

        // Выделение
        SELECT_CLIPS: {
          actions: "selectClips",
        },
        SELECT_TRACKS: {
          actions: "selectTracks",
        },
        SELECT_SECTIONS: {
          actions: "selectSections",
        },
        CLEAR_SELECTION: {
          actions: "clearSelection",
        },

        // Операции перетаскивания
        START_DRAG_CLIP: {
          target: "dragging",
          actions: "startDragClip",
        },
        START_DRAG_TRACK: {
          target: "dragging",
          actions: "startDragTrack",
        },
        START_DRAG_TRANSITION: {
          target: "dragging",
          actions: "startDragResource",
        },
        START_DRAG_EFFECT: {
          target: "dragging",
          actions: "startDragResource",
        },
        START_DRAG_FILTER: {
          target: "dragging",
          actions: "startDragResource",
        },

        // Resources events
        APPLY_TRANSITION: {
          // Transition application is handled by TimelineEffectsProvider
          // This event is just for tracking
        },
        REMOVE_TRANSITION: {
          // Transition removal is handled by TimelineEffectsProvider
        },
        UPDATE_TRANSITION: {
          // Transition update is handled by TimelineEffectsProvider
        },

        // Буфер обмена
        COPY_SELECTION: {
          guard: "hasSelection",
          actions: "setClipboard",
        },
        CUT_SELECTION: {
          guard: "hasSelection",
          actions: "setClipboard",
        },
        CLEAR_CLIPBOARD: {
          actions: "clearClipboard",
        },

        // Флаги UI
        SET_RECORDING: {
          actions: "setRecording",
        },
        TOGGLE_WAVEFORMS: {
          actions: "toggleWaveforms",
        },
        TOGGLE_THUMBNAILS: {
          actions: "toggleThumbnails",
        },
        TOGGLE_MARKERS: {
          actions: "toggleMarkers",
        },

        // Ошибки
        SET_UI_ERROR: {
          actions: "setUIError",
        },
        CLEAR_UI_ERROR: {
          actions: "clearUIError",
        },
      },
    },

    dragging: {
      on: {
        STOP_DRAG: {
          target: "idle",
          actions: "stopDrag",
        },

        // Во время перетаскивания можно обновлять позицию скролла
        SET_SCROLL_POSITION: {
          actions: "setScrollPosition",
        },
      },
    },
  },
})

// Селекторы для удобного доступа к состоянию
export const timelineUISelectors = {
  getPlaybackState: (context: TimelineUIContext) => ({
    isPlaying: context.isPlaying,
    currentTime: context.currentTime,
    playbackRate: context.playbackRate,
  }),

  getUIState: (context: TimelineUIContext) => ({
    timeScale: context.timeScale,
    scrollPosition: context.scrollPosition,
    editMode: context.editMode,
    snapMode: context.snapMode,
  }),

  getSelection: (context: TimelineUIContext) => ({
    clipIds: context.selectedClipIds,
    trackIds: context.selectedTrackIds,
    sectionIds: context.selectedSectionIds,
  }),

  getDragState: (context: TimelineUIContext) => ({
    isDragging: context.isDragging,
    draggedClipId: context.draggedClipId,
    draggedTrackId: context.draggedTrackId,
    draggedResourceType: context.draggedResourceType,
    draggedResourceId: context.draggedResourceId,
  }),

  getClipboard: (context: TimelineUIContext) => context.clipboard,

  getUIFlags: (context: TimelineUIContext) => ({
    isRecording: context.isRecording,
    showWaveforms: context.showWaveforms,
    showThumbnails: context.showThumbnails,
    showMarkers: context.showMarkers,
  }),

  hasSelection: (context: TimelineUIContext) =>
    context.selectedClipIds.length > 0 || context.selectedTrackIds.length > 0 || context.selectedSectionIds.length > 0,

  hasClipboard: (context: TimelineUIContext) => context.clipboard !== null,
}
