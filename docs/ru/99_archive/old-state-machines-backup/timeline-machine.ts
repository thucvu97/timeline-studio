/**
 * Timeline State Machine
 *
 * Машина состояний для управления Timeline
 */

import { assign, fromPromise, setup } from "xstate"

import { TimelineStudioProjectService } from "@/features/app-state/services/timeline-studio-project-service"
import { VideoEffect } from "@/features/effects/types"
import { VideoFilter } from "@/features/filters/types/filters"
import { MediaFile } from "@/features/media/types/media"
import { TimelineStudioProject } from "@/features/project-settings/types/timeline-studio-project"
import { StyleTemplate } from "@/features/style-templates/types/style-template"
import { MediaTemplate } from "@/features/templates/lib/templates"
import { Transition } from "@/features/transitions/types/transitions"

import {
  AppliedStyleTemplate,
  TimelineClip,
  TimelineProject,
  TimelineSection,
  TimelineTrack,
  TimelineUIState,
  TrackType,
  createTimelineClip,
  createTimelineProject,
  createTimelineSection,
  createTimelineTrack,
} from "../types"
import {
  copyClips,
  cutClips,
  pasteClips,
  ClipboardData,
  PasteOptions,
} from "../utils/clip-operations"
import { ResourceManager } from "./resource-manager"
import { SpeedRampingServiceImpl } from "./speed-ramping-service"

import type { TimelineMarker } from "../types/markers"
import type { SpeedRampingConfig } from "../types/speed-ramping"

interface TimelineContext {
  // Основные данные
  project: TimelineProject | null
  uiState: TimelineUIState

  // Временное состояние
  isPlaying: boolean
  isRecording: boolean
  currentTime: number

  // Speed ramping конфигурации
  speedRampingConfigs: Record<string, SpeedRampingConfig>
  speedRampingService: SpeedRampingServiceImpl

  // Операции
  draggedClip: TimelineClip | null
  draggedTrack: TimelineTrack | null

  // Ошибки
  error: string | null
  lastAction: string | null
}

export type TimelineEvents =
  // Проект
  | { type: "CREATE_PROJECT"; name: string; settings?: any }
  | { type: "LOAD_PROJECT"; project: TimelineProject }
  | { type: "SAVE_PROJECT" }
  | { type: "CLOSE_PROJECT" }

  // Секции
  | {
      type: "ADD_SECTION"
      name: string
      startTime: number
      duration: number
      realStartTime?: Date
    }
  | { type: "REMOVE_SECTION"; sectionId: string }
  | {
      type: "UPDATE_SECTION"
      sectionId: string
      updates: Partial<TimelineSection>
    }

  // Треки
  | {
      type: "ADD_TRACK"
      trackType: TrackType
      sectionId?: string
      name?: string
    }
  | { type: "REMOVE_TRACK"; trackId: string }
  | { type: "UPDATE_TRACK"; trackId: string; updates: Partial<TimelineTrack> }
  | { type: "REORDER_TRACKS"; trackIds: string[] }

  // Клипы
  | {
      type: "ADD_CLIP"
      trackId: string
      mediaFile: MediaFile
      startTime: number
      duration?: number
    }
  | { type: "REMOVE_CLIP"; clipId: string }
  | { type: "UPDATE_CLIP"; clipId: string; updates: Partial<TimelineClip> }
  | {
      type: "MOVE_CLIP"
      clipId: string
      newTrackId: string
      newStartTime: number
    }
  | { type: "SPLIT_CLIP"; clipId: string; splitTime: number }
  | {
      type: "TRIM_CLIP"
      clipId: string
      newStartTime: number
      newDuration: number
    }

  // Advanced editing operations
  | {
      type: "RIPPLE_EDIT"
      clipId: string
      edge: "start" | "end"
      delta: number
      rippleAcrossTracks?: boolean
    }
  | {
      type: "ROLL_EDIT"
      clipId: string
      adjacentClipId: string
      delta: number
    }
  | {
      type: "SLIP_EDIT"
      clipId: string
      delta: number
    }
  | {
      type: "SLIDE_EDIT"
      clipId: string
      delta: number
    }
  | {
      type: "RATE_STRETCH"
      clipId: string
      rate: number
      maintainPitch?: boolean
    }

  // Выделение
  | { type: "SELECT_CLIPS"; clipIds: string[]; addToSelection?: boolean }
  | { type: "SELECT_TRACKS"; trackIds: string[]; addToSelection?: boolean }
  | { type: "SELECT_SECTIONS"; sectionIds: string[]; addToSelection?: boolean }
  | { type: "CLEAR_SELECTION" }

  // Воспроизведение
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "STOP" }
  | { type: "SEEK"; time: number }
  | { type: "SET_PLAYBACK_RATE"; rate: number }

  // UI
  | { type: "SET_TIME_SCALE"; scale: number }
  | { type: "SET_SCROLL_POSITION"; x: number; y: number }
  | { type: "SET_EDIT_MODE"; mode: "select" | "cut" | "trim" | "move" }
  | { type: "TOGGLE_SNAP"; snapMode: "none" | "grid" | "clips" | "markers" }

  // История
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR_HISTORY" }

  // Буфер обмена
  | { type: "COPY_SELECTION" }
  | { type: "CUT_SELECTION" }
  | { type: "PASTE"; targetTrackId?: string; targetTime?: number }

  // Применение ресурсов
  | { type: "APPLY_EFFECT_TO_CLIP"; clipId: string; effect: VideoEffect; customParams?: Record<string, any> }
  | { type: "APPLY_FILTER_TO_CLIP"; clipId: string; filter: VideoFilter; customParams?: Record<string, any> }
  | {
      type: "APPLY_TRANSITION_TO_CLIP"
      clipId: string
      transition: Transition
      duration: number
      transitionType: "in" | "out" | "cross"
      customParams?: Record<string, any>
    }
  | {
      type: "APPLY_STYLE_TEMPLATE_TO_CLIP"
      clipId: string
      styleTemplate: StyleTemplate
      customizations?: AppliedStyleTemplate["customizations"]
    }
  | { type: "APPLY_TEMPLATE_TO_CLIP"; clipId: string; template: MediaTemplate; cellIndex?: number }

  // Применение ресурсов к трекам
  | { type: "APPLY_EFFECT_TO_TRACK"; trackId: string; effect: VideoEffect; customParams?: Record<string, any> }
  | { type: "APPLY_FILTER_TO_TRACK"; trackId: string; filter: VideoFilter; customParams?: Record<string, any> }

  // Группировка клипов
  | { type: "CLIPS_GROUPED"; groupId: string; clipIds: string[] }
  | { type: "CLIPS_UNGROUPED"; groupId: string; clipIds: string[] }
  | { type: "CLIPS_ADDED_TO_GROUP"; groupId: string; clipIds: string[] }
  | { type: "CLIPS_REMOVED_FROM_GROUP"; groupId: string; clipIds: string[] }
  | { type: "GROUP_TOGGLED"; groupId: string }
  | { type: "GROUP_LOCKED"; groupId: string; locked: boolean }
  | { type: "NESTED_SEQUENCE_CREATED"; sequenceId: string; clipIds: string[] }
  | { type: "NESTED_SEQUENCE_BROKEN"; sequenceId: string; clipIds: string[] }

  // J-Cut / L-Cut операции
  | { type: "CREATE_JL_CUT"; clipId: string; cutType: "j-cut" | "l-cut"; offset: number }
  | { type: "RESET_JL_CUT"; clipId: string }
  | { type: "LINK_CLIPS"; videoClipId: string; audioClipId: string }
  | { type: "UNLINK_CLIPS"; clipId: string; linkedClipId: string }

  // Маркеры
  | { type: "ADD_MARKER"; marker: TimelineMarker }
  | { type: "UPDATE_MARKER"; markerId: string; updates: Partial<TimelineMarker> }
  | { type: "REMOVE_MARKER"; markerId: string }
  | { type: "CLEAR_MARKERS" }

  // Speed Ramping
  | { type: "ENABLE_SPEED_RAMPING"; clipId: string }
  | { type: "DISABLE_SPEED_RAMPING"; clipId: string }
  | { type: "SET_SPEED_RAMPING_CONFIG"; clipId: string; config: any }
  | { type: "ADD_SPEED_KEYFRAME"; clipId: string; time: number; value: number; interpolation?: string }
  | { type: "UPDATE_SPEED_KEYFRAME"; clipId: string; keyframeId: string; updates: any }
  | { type: "REMOVE_SPEED_KEYFRAME"; clipId: string; keyframeId: string }
  | { type: "APPLY_SPEED_PRESET"; clipId: string; presetId: string }

  // AI Content Intelligence
  | { type: "ANALYZE_CLIP"; clipId: string }
  | { type: "ANALYZE_TIMELINE" }
  | { type: "APPLY_AI_SUGGESTION"; suggestionId: string }
  | { type: "DISMISS_AI_SUGGESTION"; suggestionId: string }
  | { type: "CLEAR_AI_SUGGESTIONS" }
  | { type: "ADD_AI_MARKER"; clipId: string; marker: TimelineMarker }

  // Ошибки
  | { type: "CLEAR_ERROR" }

const initialUIState: TimelineUIState = {
  currentTime: 0,
  playheadPosition: 0,
  timeScale: 100, // пикселей на секунду
  scrollPosition: { x: 0, y: 0 },
  selectedClipIds: [],
  selectedTrackIds: [],
  selectedSectionIds: [],
  editMode: "select",
  snapMode: "grid",
  visibleTrackTypes: ["video", "audio", "music", "title", "subtitle", "voiceover", "sfx", "ambient"],
  collapsedSectionIds: [],
  clipboard: { clips: [], tracks: [] },
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,
}

const initialContext: TimelineContext = {
  project: null,
  uiState: initialUIState,
  isPlaying: false,
  isRecording: false,
  currentTime: 0,
  speedRampingConfigs: {},
  speedRampingService: new SpeedRampingServiceImpl(),
  draggedClip: null,
  draggedTrack: null,
  error: null,
  lastAction: null,
}

const guards = {
  hasProject: ({ context }: { context: TimelineContext }) => context.project !== null,
  hasSelection: ({ context }: { context: TimelineContext }) =>
    context.uiState.selectedClipIds.length > 0 || context.uiState.selectedTrackIds.length > 0,
  canUndo: ({ context }: { context: TimelineContext }) => context.uiState.historyIndex > 0,
  canRedo: ({ context }: { context: TimelineContext }) =>
    context.uiState.historyIndex < context.uiState.history.length - 1,
  hasClipboard: ({ context }: { context: TimelineContext }) =>
    context.uiState.clipboard.clips.length > 0 || context.uiState.clipboard.tracks.length > 0,
}

// Хелпер для обновления speed ramping конфигураций в проекте
const updateSpeedRampingInProject = (context: TimelineContext, newConfigs: Record<string, SpeedRampingConfig>) => {
  if (!context.project) return context.project

  return {
    ...context.project,
    speedRampingConfigs: newConfigs,
    updatedAt: new Date(),
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Получает выделенные клипы из проекта
 */
function getSelectedClips(project: TimelineProject, selectedClipIds: string[]): TimelineClip[] {
  const clips: TimelineClip[] = []
  
  // Поиск в секциях
  project.sections.forEach(section => {
    section.tracks.forEach(track => {
      track.clips.forEach(clip => {
        if (selectedClipIds.includes(clip.id)) {
          clips.push(clip)
        }
      })
    })
  })
  
  // Поиск в глобальных треках
  project.globalTracks.forEach(track => {
    track.clips.forEach(clip => {
      if (selectedClipIds.includes(clip.id)) {
        clips.push(clip)
      }
    })
  })
  
  return clips
}

const actions = {
  // Проект
  createProject: assign({
    project: ({ event }: { event: any }) => createTimelineProject(event.name, event.settings),
    error: null,
    lastAction: "CREATE_PROJECT",
  }),

  loadProject: assign({
    project: ({ event }: { event: any }) => event.project,
    error: null,
    lastAction: "LOAD_PROJECT",
  }),

  closeProject: assign({
    project: null,
    uiState: initialUIState,
    isPlaying: false,
    currentTime: 0,
    lastAction: "CLOSE_PROJECT",
  }),

  // Секции
  addSection: assign({
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      if (!context.project) return context.project

      const newSection = createTimelineSection(event.name, event.startTime, event.duration, event.realStartTime)

      return {
        ...context.project,
        sections: [...context.project.sections, newSection],
        updatedAt: new Date(),
      }
    },
    lastAction: "ADD_SECTION",
  }),

  // Треки
  addTrack: assign({
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      if (!context.project) return context.project

      const newTrack = createTimelineTrack(event.name || `${event.trackType} Track`, event.trackType, event.sectionId)

      if (event.sectionId) {
        // Добавляем в секцию
        const sections = context.project.sections.map((section) => {
          if (section.id === event.sectionId) {
            newTrack.order = section.tracks.length
            return {
              ...section,
              tracks: [...section.tracks, newTrack],
            }
          }
          return section
        })

        return {
          ...context.project,
          sections,
          updatedAt: new Date(),
        }
      }
      // Добавляем как глобальный трек
      newTrack.order = context.project.globalTracks.length
      return {
        ...context.project,
        globalTracks: [...context.project.globalTracks, newTrack],
        updatedAt: new Date(),
      }
    },
    lastAction: "ADD_TRACK",
  }),

  // Клипы
  addClip: assign({
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      if (!context.project) return context.project

      const newClip = createTimelineClip(
        event.mediaFile.id,
        event.trackId,
        event.startTime,
        event.duration || event.mediaFile.duration || 10,
        0, // mediaStartTime
        event.mediaFile.duration, // mediaDuration
      )
      newClip.name = event.mediaFile.name
      newClip.mediaFile = event.mediaFile

      // Находим трек и добавляем клип
      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => {
          if (track.id === event.trackId) {
            return {
              ...track,
              clips: [...track.clips, newClip],
            }
          }
          return track
        })

      const sections = context.project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(context.project.globalTracks)

      return {
        ...context.project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "ADD_CLIP",
  }),

  // Выделение
  selectClips: assign({
    uiState: ({ context, event }: { context: TimelineContext; event: any }) => ({
      ...context.uiState,
      selectedClipIds: event.addToSelection
        ? [...new Set([...context.uiState.selectedClipIds, ...event.clipIds])]
        : event.clipIds,
    }),
    lastAction: "SELECT_CLIPS",
  }),

  clearSelection: assign({
    uiState: ({ context }: { context: TimelineContext }) => ({
      ...context.uiState,
      selectedClipIds: [],
      selectedTrackIds: [],
      selectedSectionIds: [],
    }),
    lastAction: "CLEAR_SELECTION",
  }),

  // Воспроизведение
  play: assign({
    isPlaying: true,
    lastAction: "PLAY",
  }),

  pause: assign({
    isPlaying: false,
    lastAction: "PAUSE",
  }),

  seek: assign({
    currentTime: ({ event }: { event: any }) => event.time,
    uiState: ({ context, event }: { context: TimelineContext; event: any }) => ({
      ...context.uiState,
      currentTime: event.time,
      playheadPosition: event.time * context.uiState.timeScale,
    }),
    lastAction: "SEEK",
  }),

  // UI
  setTimeScale: assign({
    uiState: ({ context, event }: { context: TimelineContext; event: any }) => ({
      ...context.uiState,
      timeScale: event.scale,
      playheadPosition: context.currentTime * event.scale,
    }),
    lastAction: "SET_TIME_SCALE",
  }),

  // J-Cut / L-Cut операции
  createJLCut: assign({
    project: ({
      context,
      event,
    }: {
      context: TimelineContext
      event: Extract<TimelineEvents, { type: "CREATE_JL_CUT" }>
    }) => {
      if (!context.project) return context.project

      const updateClips = (clips: TimelineClip[]) =>
        clips.map((clip) => {
          if (clip.id === event.clipId) {
            return {
              ...clip,
              audioOffset: event.cutType === "j-cut" ? event.offset : -event.offset,
            }
          }
          return clip
        })

      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => ({
          ...track,
          clips: updateClips(track.clips),
        }))

      const sections = context.project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(context.project.globalTracks)

      return {
        ...context.project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "CREATE_JL_CUT",
  }),

  resetJLCut: assign({
    project: ({
      context,
      event,
    }: {
      context: TimelineContext
      event: Extract<TimelineEvents, { type: "RESET_JL_CUT" }>
    }) => {
      if (!context.project) return context.project

      const updateClips = (clips: TimelineClip[]) =>
        clips.map((clip) => {
          if (clip.id === event.clipId) {
            return {
              ...clip,
              audioOffset: 0,
            }
          }
          return clip
        })

      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => ({
          ...track,
          clips: updateClips(track.clips),
        }))

      const sections = context.project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(context.project.globalTracks)

      return {
        ...context.project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "RESET_JL_CUT",
  }),

  linkClips: assign({
    project: ({
      context,
      event,
    }: {
      context: TimelineContext
      event: Extract<TimelineEvents, { type: "LINK_CLIPS" }>
    }) => {
      if (!context.project) return context.project

      const updateClips = (clips: TimelineClip[]) =>
        clips.map((clip) => {
          if (clip.id === event.videoClipId) {
            return {
              ...clip,
              linkedClipId: event.audioClipId,
              isLinked: true,
            }
          }
          if (clip.id === event.audioClipId) {
            return {
              ...clip,
              linkedClipId: event.videoClipId,
              isLinked: true,
            }
          }
          return clip
        })

      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => ({
          ...track,
          clips: updateClips(track.clips),
        }))

      const sections = context.project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(context.project.globalTracks)

      return {
        ...context.project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "LINK_CLIPS",
  }),

  unlinkClips: assign({
    project: ({
      context,
      event,
    }: {
      context: TimelineContext
      event: Extract<TimelineEvents, { type: "UNLINK_CLIPS" }>
    }) => {
      if (!context.project) return context.project

      const updateClips = (clips: TimelineClip[]) =>
        clips.map((clip) => {
          if (clip.id === event.clipId || clip.id === event.linkedClipId) {
            return {
              ...clip,
              linkedClipId: undefined,
              isLinked: false,
              audioOffset: 0,
            }
          }
          return clip
        })

      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => ({
          ...track,
          clips: updateClips(track.clips),
        }))

      const sections = context.project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(context.project.globalTracks)

      return {
        ...context.project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "UNLINK_CLIPS",
  }),

  // Маркеры
  addMarker: assign({
    project: ({
      context,
      event,
    }: {
      context: TimelineContext
      event: Extract<TimelineEvents, { type: "ADD_MARKER" }>
    }) => {
      if (!context.project) return context.project

      const markers = context.project.markers || []

      return {
        ...context.project,
        markers: [...markers, event.marker],
        updatedAt: new Date(),
      }
    },
    lastAction: "ADD_MARKER",
  }),

  updateMarker: assign({
    project: ({
      context,
      event,
    }: {
      context: TimelineContext
      event: Extract<TimelineEvents, { type: "UPDATE_MARKER" }>
    }) => {
      if (!context.project) return context.project

      const markers = (context.project.markers || []).map((marker) =>
        marker.id === event.markerId ? { ...marker, ...event.updates } : marker,
      )

      return {
        ...context.project,
        markers,
        updatedAt: new Date(),
      }
    },
    lastAction: "UPDATE_MARKER",
  }),

  removeMarker: assign({
    project: ({
      context,
      event,
    }: {
      context: TimelineContext
      event: Extract<TimelineEvents, { type: "REMOVE_MARKER" }>
    }) => {
      if (!context.project) return context.project

      const markers = (context.project.markers || []).filter((marker) => marker.id !== event.markerId)

      return {
        ...context.project,
        markers,
        updatedAt: new Date(),
      }
    },
    lastAction: "REMOVE_MARKER",
  }),

  clearMarkers: assign({
    project: ({ context }: { context: TimelineContext }) => {
      if (!context.project) return context.project

      return {
        ...context.project,
        markers: [],
        updatedAt: new Date(),
      }
    },
    lastAction: "CLEAR_MARKERS",
  }),

  // Speed Ramping
  enableSpeedRamping: assign({
    speedRampingConfigs: ({ context, event }: { context: TimelineContext; event: any }) => {
      const newConfig = {
        enabled: true,
        keyframes: [],
        maintainPitch: true,
        minSpeed: 0.1,
        maxSpeed: 10.0,
        showGraph: true,
        graphHeight: 60,
        graphOpacity: 0.7,
      }

      const newConfigs = {
        ...context.speedRampingConfigs,
        [event.clipId]: newConfig,
      }

      // Обновляем сервис
      context.speedRampingService.updateFromTimelineConfigs(newConfigs)

      return newConfigs
    },
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      if (!context.project) return context.project

      const newConfig = {
        enabled: true,
        keyframes: [],
        maintainPitch: true,
        minSpeed: 0.1,
        maxSpeed: 10.0,
        showGraph: true,
        graphHeight: 60,
        graphOpacity: 0.7,
      }

      const newConfigs = {
        ...context.speedRampingConfigs,
        [event.clipId]: newConfig,
      }

      return {
        ...context.project,
        speedRampingConfigs: newConfigs,
        updatedAt: new Date(),
      }
    },
    lastAction: "ENABLE_SPEED_RAMPING",
  }),

  disableSpeedRamping: assign({
    speedRampingConfigs: ({ context, event }: { context: TimelineContext; event: any }) => {
      const configs = { ...context.speedRampingConfigs }
      if (configs[event.clipId]) {
        configs[event.clipId] = {
          ...configs[event.clipId],
          enabled: false,
        }
      }

      // Обновляем сервис
      context.speedRampingService.updateFromTimelineConfigs(configs)

      return configs
    },
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      return updateSpeedRampingInProject(context, {
        ...context.speedRampingConfigs,
        [event.clipId]: {
          ...context.speedRampingConfigs[event.clipId],
          enabled: false,
        },
      })
    },
    lastAction: "DISABLE_SPEED_RAMPING",
  }),

  setSpeedRampingConfig: assign({
    speedRampingConfigs: ({ context, event }: { context: TimelineContext; event: any }) => {
      const newConfigs = {
        ...context.speedRampingConfigs,
        [event.clipId]: event.config,
      }

      // Обновляем сервис
      context.speedRampingService.updateFromTimelineConfigs(newConfigs)

      return newConfigs
    },
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      return updateSpeedRampingInProject(context, {
        ...context.speedRampingConfigs,
        [event.clipId]: event.config,
      })
    },
    lastAction: "SET_SPEED_RAMPING_CONFIG",
  }),

  addSpeedKeyframe: assign({
    speedRampingConfigs: ({ context, event }: { context: TimelineContext; event: any }) => {
      const configs = { ...context.speedRampingConfigs }
      if (configs[event.clipId]) {
        const keyframe = {
          id: `keyframe-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          time: event.time,
          value: event.value,
          interpolation: event.interpolation || "linear",
        }
        configs[event.clipId] = {
          ...configs[event.clipId],
          keyframes: [...configs[event.clipId].keyframes, keyframe],
        }
      }

      // Обновляем сервис
      context.speedRampingService.updateFromTimelineConfigs(configs)

      return configs
    },
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      const configs = { ...context.speedRampingConfigs }
      if (configs[event.clipId]) {
        const keyframe = {
          id: `keyframe-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          time: event.time,
          value: event.value,
          interpolation: event.interpolation || "linear",
        }
        configs[event.clipId] = {
          ...configs[event.clipId],
          keyframes: [...configs[event.clipId].keyframes, keyframe],
        }
      }
      return updateSpeedRampingInProject(context, configs)
    },
    lastAction: "ADD_SPEED_KEYFRAME",
  }),

  updateSpeedKeyframe: assign({
    speedRampingConfigs: ({ context, event }: { context: TimelineContext; event: any }) => {
      const configs = { ...context.speedRampingConfigs }
      if (configs[event.clipId]) {
        configs[event.clipId] = {
          ...configs[event.clipId],
          keyframes: configs[event.clipId].keyframes.map((keyframe) =>
            keyframe.id === event.keyframeId ? { ...keyframe, ...event.updates } : keyframe,
          ),
        }
      }

      // Обновляем сервис
      context.speedRampingService.updateFromTimelineConfigs(configs)

      return configs
    },
    lastAction: "UPDATE_SPEED_KEYFRAME",
  }),

  removeSpeedKeyframe: assign({
    speedRampingConfigs: ({ context, event }: { context: TimelineContext; event: any }) => {
      const configs = { ...context.speedRampingConfigs }
      if (configs[event.clipId]) {
        configs[event.clipId] = {
          ...configs[event.clipId],
          keyframes: configs[event.clipId].keyframes.filter((keyframe) => keyframe.id !== event.keyframeId),
        }
      }

      // Обновляем сервис
      context.speedRampingService.updateFromTimelineConfigs(configs)

      return configs
    },
    lastAction: "REMOVE_SPEED_KEYFRAME",
  }),

  applySpeedPreset: assign({
    speedRampingConfigs: ({ context, event }: { context: TimelineContext; event: any }) => {
      const configs = { ...context.speedRampingConfigs }

      // Базовые пресеты для speed ramping
      const presets = {
        "ease-in": [
          { time: 0, value: 0.5, interpolation: "ease-in" },
          { time: 0.5, value: 1.0, interpolation: "linear" },
        ],
        "ease-out": [
          { time: 0, value: 1.0, interpolation: "linear" },
          { time: 0.5, value: 0.5, interpolation: "ease-out" },
        ],
        "speed-ramp": [
          { time: 0, value: 1.0, interpolation: "linear" },
          { time: 0.25, value: 2.0, interpolation: "ease" },
          { time: 0.75, value: 2.0, interpolation: "ease" },
          { time: 1.0, value: 1.0, interpolation: "linear" },
        ],
        "slow-motion": [{ time: 0, value: 0.25, interpolation: "linear" }],
        "fast-forward": [{ time: 0, value: 4.0, interpolation: "linear" }],
      }

      const preset = presets[event.presetId as keyof typeof presets]
      if (preset && configs[event.clipId]) {
        const keyframes = preset.map((keyframe, index) => ({
          id: `preset-keyframe-${index}-${Date.now()}`,
          ...keyframe,
          interpolation: keyframe.interpolation as any,
        }))

        configs[event.clipId] = {
          ...configs[event.clipId],
          enabled: true,
          keyframes,
        }
      }

      // Обновляем сервис
      context.speedRampingService.updateFromTimelineConfigs(configs)

      return configs
    },
    lastAction: "APPLY_SPEED_PRESET",
  }),

  // Ошибки
  setError: assign({
    error: ({ event }: { event: any }) => event.error || "Unknown error",
  }),

  clearError: assign({
    error: null,
  }),

  // AI Content Intelligence Actions
  analyzeClip: assign({
    lastAction: "ANALYZE_CLIP",
  }),

  analyzeTimeline: assign({
    lastAction: "ANALYZE_TIMELINE",
  }),

  applyAISuggestion: assign({
    lastAction: "APPLY_AI_SUGGESTION",
  }),

  dismissAISuggestion: assign({
    lastAction: "DISMISS_AI_SUGGESTION",
  }),

  clearAISuggestions: assign({
    lastAction: "CLEAR_AI_SUGGESTIONS",
  }),

  addAIMarker: assign({
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      if (!context.project) return context.project

      // Добавляем AI маркер к проекту, а не к клипу
      return {
        ...context.project,
        markers: [...(context.project.markers || []), event.marker],
        updatedAt: new Date(),
      }
    },
    lastAction: "ADD_AI_MARKER",
  }),

  // Применение ресурсов к клипам
  applyEffectToClip: assign({
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      if (!context.project) return context.project

      let project = context.project
      const { project: updatedProject, appliedEffect } = ResourceManager.createAppliedEffect(
        project,
        event.effect,
        event.customParams,
      )
      project = updatedProject

      // Находим клип и добавляем эффект
      const updateClips = (clips: TimelineClip[]) =>
        clips.map((clip) => {
          if (clip.id === event.clipId) {
            appliedEffect.order = clip.effects.length
            return {
              ...clip,
              effects: [...clip.effects, appliedEffect],
            }
          }
          return clip
        })

      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => ({
          ...track,
          clips: updateClips(track.clips),
        }))

      const sections = project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(project.globalTracks)

      return {
        ...project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "APPLY_EFFECT_TO_CLIP",
  }),

  applyFilterToClip: assign({
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      if (!context.project) return context.project

      let project = context.project
      const { project: updatedProject, appliedFilter } = ResourceManager.createAppliedFilter(
        project,
        event.filter,
        event.customParams,
      )
      project = updatedProject

      // Находим клип и добавляем фильтр
      const updateClips = (clips: TimelineClip[]) =>
        clips.map((clip) => {
          if (clip.id === event.clipId) {
            appliedFilter.order = clip.filters.length
            return {
              ...clip,
              filters: [...clip.filters, appliedFilter],
            }
          }
          return clip
        })

      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => ({
          ...track,
          clips: updateClips(track.clips),
        }))

      const sections = project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(project.globalTracks)

      return {
        ...project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "APPLY_FILTER_TO_CLIP",
  }),

  applyTransitionToClip: assign({
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      if (!context.project) return context.project

      let project = context.project
      const { project: updatedProject, appliedTransition } = ResourceManager.createAppliedTransition(
        project,
        event.transition,
        event.duration,
        event.transitionType,
        event.customParams,
      )
      project = updatedProject

      // Находим клип и добавляем переход
      const updateClips = (clips: TimelineClip[]) =>
        clips.map((clip) => {
          if (clip.id === event.clipId) {
            return {
              ...clip,
              transitions: [...clip.transitions, appliedTransition],
            }
          }
          return clip
        })

      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => ({
          ...track,
          clips: updateClips(track.clips),
        }))

      const sections = project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(project.globalTracks)

      return {
        ...project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "APPLY_TRANSITION_TO_CLIP",
  }),

  applyStyleTemplateToClip: assign({
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      if (!context.project) return context.project

      let project = context.project
      const { project: updatedProject, appliedStyleTemplate } = ResourceManager.createAppliedStyleTemplate(
        project,
        event.styleTemplate,
        event.customizations,
      )
      project = updatedProject

      // Находим клип и добавляем стильный шаблон
      const updateClips = (clips: TimelineClip[]) =>
        clips.map((clip) => {
          if (clip.id === event.clipId) {
            return {
              ...clip,
              styleTemplate: appliedStyleTemplate,
            }
          }
          return clip
        })

      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => ({
          ...track,
          clips: updateClips(track.clips),
        }))

      const sections = project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(project.globalTracks)

      return {
        ...project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "APPLY_STYLE_TEMPLATE_TO_CLIP",
  }),

  applyTemplateToClip: assign({
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      if (!context.project) return context.project

      const project = ResourceManager.addTemplateToResources(context.project, event.template)

      // Находим клип и добавляем шаблон
      const updateClips = (clips: TimelineClip[]) =>
        clips.map((clip) => {
          if (clip.id === event.clipId) {
            return {
              ...clip,
              templateId: event.template.id,
              templateCell: event.cellIndex,
            }
          }
          return clip
        })

      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => ({
          ...track,
          clips: updateClips(track.clips),
        }))

      const sections = project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(project.globalTracks)

      return {
        ...project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "APPLY_TEMPLATE_TO_CLIP",
  }),

  // Применение ресурсов к трекам
  applyEffectToTrack: assign({
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      if (!context.project) return context.project

      let project = context.project
      const { project: updatedProject, appliedEffect } = ResourceManager.createAppliedEffect(
        project,
        event.effect,
        event.customParams,
      )
      project = updatedProject

      // Находим трек и добавляем эффект
      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => {
          if (track.id === event.trackId) {
            appliedEffect.order = track.trackEffects.length
            return {
              ...track,
              trackEffects: [...track.trackEffects, appliedEffect],
            }
          }
          return track
        })

      const sections = project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(project.globalTracks)

      return {
        ...project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "APPLY_EFFECT_TO_TRACK",
  }),

  applyFilterToTrack: assign({
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      if (!context.project) return context.project

      let project = context.project
      const { project: updatedProject, appliedFilter } = ResourceManager.createAppliedFilter(
        project,
        event.filter,
        event.customParams,
      )
      project = updatedProject

      // Находим трек и добавляем фильтр
      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => {
          if (track.id === event.trackId) {
            appliedFilter.order = track.trackFilters.length
            return {
              ...track,
              trackFilters: [...track.trackFilters, appliedFilter],
            }
          }
          return track
        })

      const sections = project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(project.globalTracks)

      return {
        ...project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "APPLY_FILTER_TO_TRACK",
  }),

  // Advanced editing operations
  splitClip: assign({
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      if (!context.project) return context.project

      const updateClips = (clips: TimelineClip[]) => {
        const newClips: TimelineClip[] = []

        clips.forEach((clip) => {
          if (clip.id === event.clipId) {
            const splitPoint = event.splitTime - clip.startTime

            // Validate split point
            if (splitPoint <= 0 || splitPoint >= clip.duration) {
              newClips.push(clip)
              return
            }

            // First part of the clip
            const firstClip = {
              ...clip,
              duration: splitPoint,
              // Preserve effects and filters
              effects: clip.effects.map((e) => ({ ...e })),
              filters: clip.filters.map((f) => ({ ...f })),
              transitions: clip.transitions.filter((t) => t.type === "in"),
            }

            // Second part of the clip
            const secondClip = {
              ...clip,
              id: `${clip.id}_split_${Date.now()}`,
              startTime: clip.startTime + splitPoint,
              duration: clip.duration - splitPoint,
              offset: clip.offset + splitPoint,
              // Preserve effects and filters
              effects: clip.effects.map((e) => ({ ...e })),
              filters: clip.filters.map((f) => ({ ...f })),
              transitions: clip.transitions.filter((t) => t.type === "out"),
            }

            newClips.push(firstClip, secondClip)
          } else {
            newClips.push(clip)
          }
        })

        return newClips
      }

      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => ({
          ...track,
          clips: updateClips(track.clips),
        }))

      const sections = context.project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(context.project.globalTracks)

      return {
        ...context.project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "SPLIT_CLIP",
  }),

  trimClip: assign({
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      if (!context.project) return context.project

      const updateClips = (clips: TimelineClip[]) =>
        clips.map((clip) => {
          if (clip.id === event.clipId) {
            return {
              ...clip,
              startTime: event.newStartTime,
              duration: event.newDuration,
            }
          }
          return clip
        })

      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => ({
          ...track,
          clips: updateClips(track.clips),
        }))

      const sections = context.project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(context.project.globalTracks)

      return {
        ...context.project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "TRIM_CLIP",
  }),

  rippleEdit: assign({
    project: ({
      context,
      event,
    }: {
      context: TimelineContext
      event: Extract<TimelineEvents, { type: "RIPPLE_EDIT" }>
    }) => {
      if (!context.project) return context.project

      const updateClips = (clips: TimelineClip[]) => {
        let affectedClipIndex = -1
        let rippleStartTime = 0

        // Find the affected clip and determine ripple start time
        const updatedClips = clips.map((clip, index) => {
          if (clip.id === event.clipId) {
            affectedClipIndex = index

            if (event.edge === "start") {
              const newStartTime = clip.startTime + event.delta
              const newDuration = clip.duration - event.delta

              if (newDuration <= 0) return clip // Invalid edit

              rippleStartTime = clip.startTime

              return {
                ...clip,
                startTime: newStartTime,
                duration: newDuration,
                offset: clip.offset + event.delta,
              }
            }
            const newDuration = clip.duration + event.delta

            if (newDuration <= 0) return clip // Invalid edit

            rippleStartTime = clip.startTime + clip.duration

            return {
              ...clip,
              duration: newDuration,
            }
          }
          return clip
        })

        // Apply ripple effect to subsequent clips
        if (affectedClipIndex !== -1) {
          for (let i = affectedClipIndex + 1; i < updatedClips.length; i++) {
            if (updatedClips[i].startTime >= rippleStartTime) {
              updatedClips[i] = {
                ...updatedClips[i],
                startTime: updatedClips[i].startTime + event.delta,
              }
            }
          }
        }

        return updatedClips
      }

      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => {
          // Apply ripple only to the track containing the edited clip or all tracks if specified
          const shouldUpdate = track.clips.some((c) => c.id === event.clipId) || event.rippleAcrossTracks

          return {
            ...track,
            clips: shouldUpdate ? updateClips(track.clips) : track.clips,
          }
        })

      const sections = context.project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(context.project.globalTracks)

      return {
        ...context.project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "RIPPLE_EDIT",
  }),

  rollEdit: assign({
    project: ({
      context,
      event,
    }: {
      context: TimelineContext
      event: Extract<TimelineEvents, { type: "ROLL_EDIT" }>
    }) => {
      if (!context.project) return context.project

      const updateClips = (clips: TimelineClip[]) => {
        return clips.map((clip) => {
          if (clip.id === event.clipId) {
            // Adjust the out point of the current clip
            const newDuration = clip.duration + event.delta
            if (newDuration <= 0) return clip // Invalid edit

            return {
              ...clip,
              duration: newDuration,
            }
          }
          if (clip.id === event.adjacentClipId) {
            // Adjust the in point of the adjacent clip
            const newStartTime = clip.startTime + event.delta
            const newDuration = clip.duration - event.delta

            if (newDuration <= 0) return clip // Invalid edit

            return {
              ...clip,
              startTime: newStartTime,
              duration: newDuration,
              offset: clip.offset + event.delta,
            }
          }
          return clip
        })
      }

      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => {
          // Check if this track contains both clips
          const hasClips = track.clips.some((c) => c.id === event.clipId || c.id === event.adjacentClipId)

          return {
            ...track,
            clips: hasClips ? updateClips(track.clips) : track.clips,
          }
        })

      const sections = context.project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(context.project.globalTracks)

      return {
        ...context.project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "ROLL_EDIT",
  }),

  slipEdit: assign({
    project: ({
      context,
      event,
    }: {
      context: TimelineContext
      event: Extract<TimelineEvents, { type: "SLIP_EDIT" }>
    }) => {
      if (!context.project) return context.project

      const updateClips = (clips: TimelineClip[]) => {
        return clips.map((clip) => {
          if (clip.id === event.clipId) {
            // Adjust the media offset without changing timeline position
            const newOffset = clip.offset + event.delta

            // Ensure offset stays within bounds
            if (newOffset < 0) return clip
            if (clip.mediaDuration && newOffset + clip.duration > clip.mediaDuration) return clip

            return {
              ...clip,
              offset: newOffset,
            }
          }
          return clip
        })
      }

      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => ({
          ...track,
          clips: updateClips(track.clips),
        }))

      const sections = context.project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(context.project.globalTracks)

      return {
        ...context.project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "SLIP_EDIT",
  }),

  slideEdit: assign({
    project: ({
      context,
      event,
    }: {
      context: TimelineContext
      event: Extract<TimelineEvents, { type: "SLIDE_EDIT" }>
    }) => {
      if (!context.project) return context.project

      const updateClips = (clips: TimelineClip[]) => {
        // Sort clips by start time for proper collision detection
        const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime)

        return sortedClips.map((clip) => {
          if (clip.id === event.clipId) {
            const newStartTime = clip.startTime + event.delta

            // Check for collisions with other clips
            const hasCollision = sortedClips.some((otherClip) => {
              if (otherClip.id === clip.id) return false

              const otherEnd = otherClip.startTime + otherClip.duration
              const newEnd = newStartTime + clip.duration

              // Check if clips would overlap
              return (
                (newStartTime >= otherClip.startTime && newStartTime < otherEnd) ||
                (newEnd > otherClip.startTime && newEnd <= otherEnd) ||
                (newStartTime <= otherClip.startTime && newEnd >= otherEnd)
              )
            })

            if (hasCollision || newStartTime < 0) return clip

            return {
              ...clip,
              startTime: newStartTime,
            }
          }
          return clip
        })
      }

      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => ({
          ...track,
          clips: track.clips.some((c) => c.id === event.clipId) ? updateClips(track.clips) : track.clips,
        }))

      const sections = context.project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(context.project.globalTracks)

      return {
        ...context.project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "SLIDE_EDIT",
  }),

  rateStretch: assign({
    project: ({
      context,
      event,
    }: {
      context: TimelineContext
      event: Extract<TimelineEvents, { type: "RATE_STRETCH" }>
    }) => {
      if (!context.project) return context.project

      const updateClips = (clips: TimelineClip[]) => {
        return clips.map((clip) => {
          if (clip.id === event.clipId) {
            // Apply rate to duration
            const newDuration = clip.duration / event.rate

            if (newDuration <= 0) return clip

            // Check if we need to apply pitch compensation for audio
            const pitchCompensation = event.maintainPitch !== false // Default to true

            return {
              ...clip,
              duration: newDuration,
              playbackRate: event.rate,
              maintainPitch: pitchCompensation,
            }
          }
          return clip
        })
      }

      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => ({
          ...track,
          clips: updateClips(track.clips),
        }))

      const sections = context.project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }))

      const globalTracks = updateTracks(context.project.globalTracks)

      return {
        ...context.project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      }
    },
    lastAction: "RATE_STRETCH",
  }),

  // ============================================================================
  // CLIPBOARD OPERATIONS
  // ============================================================================

  copySelection: assign({
    uiState: ({ context }: { context: TimelineContext }) => {
      if (!context.project) return context.uiState

      // Получаем выделенные клипы
      const selectedClips = getSelectedClips(context.project, context.uiState.selectedClipIds)
      
      if (selectedClips.length === 0) {
        return context.uiState
      }

      try {
        // Копируем клипы в буфер обмена
        const clipboardData = copyClips(selectedClips, {
          includeEffects: true,
          includeFilters: true,
          includeTransitions: true,
          deepCopy: true,
        })

        return {
          ...context.uiState,
          clipboard: {
            clips: clipboardData.clips,
            tracks: clipboardData.tracks,
          },
        }
      } catch (error) {
        console.error("Ошибка при копировании клипов:", error)
        return context.uiState
      }
    },
    lastAction: "COPY_SELECTION",
  }),

  cutSelection: assign({
    project: ({ context }: { context: TimelineContext }) => {
      if (!context.project) return context.project

      // Получаем выделенные клипы
      const selectedClips = getSelectedClips(context.project, context.uiState.selectedClipIds)
      
      if (selectedClips.length === 0) {
        return context.project
      }

      try {
        // Вырезаем клипы (копируем + удаляем)
        const { updatedProject, clipboardData } = cutClips(context.project, selectedClips, {
          includeEffects: true,
          includeFilters: true,
          includeTransitions: true,
          deepCopy: true,
        })

        // Обновляем буфер обмена в uiState будет обработано отдельно
        return updatedProject
      } catch (error) {
        console.error("Ошибка при вырезании клипов:", error)
        return context.project
      }
    },
    uiState: ({ context }: { context: TimelineContext }) => {
      if (!context.project) return context.uiState

      // Получаем выделенные клипы
      const selectedClips = getSelectedClips(context.project, context.uiState.selectedClipIds)
      
      if (selectedClips.length === 0) {
        return context.uiState
      }

      try {
        // Копируем в буфер обмена
        const clipboardData = copyClips(selectedClips, {
          includeEffects: true,
          includeFilters: true,
          includeTransitions: true,
          deepCopy: true,
        })

        return {
          ...context.uiState,
          clipboard: {
            clips: clipboardData.clips,
            tracks: clipboardData.tracks,
          },
          selectedClipIds: [], // Очищаем выделение после вырезания
        }
      } catch (error) {
        console.error("Ошибка при обновлении буфера обмена:", error)
        return context.uiState
      }
    },
    lastAction: "CUT_SELECTION",
  }),

  paste: assign({
    project: ({
      context,
      event,
    }: {
      context: TimelineContext
      event: Extract<TimelineEvents, { type: "PASTE" }>
    }) => {
      if (!context.project) return context.project

      const { clipboard } = context.uiState
      if (clipboard.clips.length === 0) {
        return context.project
      }

      try {
        // Подготавливаем данные буфера обмена
        const clipboardData: ClipboardData = {
          clips: clipboard.clips,
          tracks: clipboard.tracks,
          metadata: {
            copiedAt: new Date(), // Временное значение
            originalTimeRange: {
              startTime: Math.min(...clipboard.clips.map(c => c.startTime)),
              endTime: Math.max(...clipboard.clips.map(c => c.startTime + c.duration)),
            },
            trackIds: [...new Set(clipboard.clips.map(c => c.trackId))],
          },
        }

        // Определяем параметры вставки
        const pasteOptions: PasteOptions = {
          targetTrackId: event.targetTrackId,
          targetTime: event.targetTime || context.uiState.currentTime,
          mode: "insert", // По умолчанию insert mode
          preserveRelativePositions: true,
        }

        // Вставляем клипы
        const { updatedProject } = pasteClips(context.project, clipboardData, pasteOptions)

        return updatedProject
      } catch (error) {
        console.error("Ошибка при вставке клипов:", error)
        return context.project
      }
    },
    lastAction: "PASTE",
  }),
}

/**
 * Конвертирует TimelineProject в TimelineStudioProject для сохранения
 */
async function convertTimelineProjectToStudioProject(timelineProject: TimelineProject): Promise<TimelineStudioProject> {
  const projectService = TimelineStudioProjectService.getInstance()
  
  // Создаем новый проект с базовой структурой
  const studioProject = projectService.createProjectSync(timelineProject.name, {
    resolution: timelineProject.settings.resolution,
    frameRate: timelineProject.fps,
    duration: timelineProject.duration,
  })
  
  // Обновляем ID и временные метки
  studioProject.metadata.id = timelineProject.id
  studioProject.metadata.created = timelineProject.createdAt
  studioProject.metadata.modified = timelineProject.updatedAt
  
  // Конвертируем медиафайлы в MediaPool
  if (timelineProject.resources.media && timelineProject.resources.media.length > 0) {
    timelineProject.resources.media.forEach((mediaFile) => {
      studioProject.mediaPool.items.set(mediaFile.id, {
        id: mediaFile.id,
        type: mediaFile.type as "video" | "audio" | "image",
        path: mediaFile.path,
        name: mediaFile.name,
        duration: mediaFile.duration || 0,
        metadata: {
          format: mediaFile.format || "",
          codec: mediaFile.codec || "",
          resolution: mediaFile.resolution || { width: 0, height: 0 },
          frameRate: mediaFile.frameRate || 0,
          bitrate: mediaFile.bitrate || 0,
          audioChannels: mediaFile.audioChannels || 0,
          sampleRate: mediaFile.sampleRate || 0,
        },
        thumbnail: mediaFile.thumbnail,
        importedAt: new Date(),
        tags: [],
        usageCount: 0,
        proxyPath: undefined,
      })
    })
  }
  
  // Создаем главную секвенцию из секций и треков
  const mainSequence = studioProject.sequences.get(studioProject.activeSequenceId)!
  
  // Очищаем дефолтные треки
  mainSequence.tracks = []
  
  // Добавляем глобальные треки
  timelineProject.globalTracks.forEach((track) => {
    mainSequence.tracks.push({
      id: track.id,
      name: track.name,
      type: track.type as any,
      enabled: track.enabled,
      locked: track.locked,
      height: track.height,
      color: track.color,
      volume: track.volume,
      pan: track.pan,
      effects: track.effects || [],
      filters: track.filters || [],
      clips: track.clips.map((clip) => ({
        id: clip.id,
        name: clip.name,
        type: clip.type,
        sourceId: clip.sourceId,
        sourceIn: clip.sourceIn,
        sourceOut: clip.sourceOut,
        timelineIn: clip.startTime,
        timelineOut: clip.startTime + clip.duration,
        duration: clip.duration,
        playbackRate: clip.playbackRate,
        volume: clip.volume,
        enabled: clip.enabled,
        locked: clip.locked,
        effects: clip.effects || [],
        filters: clip.filters || [],
        transitions: clip.transitions || [],
        keyframes: [],
        metadata: {},
      })),
    })
  })
  
  // Добавляем треки из секций
  timelineProject.sections.forEach((section) => {
    section.tracks.forEach((track) => {
      mainSequence.tracks.push({
        id: track.id,
        name: track.name,
        type: track.type as any,
        enabled: track.enabled,
        locked: track.locked,
        height: track.height,
        color: track.color,
        volume: track.volume,
        pan: track.pan,
        effects: track.effects || [],
        filters: track.filters || [],
        clips: track.clips.map((clip) => ({
          id: clip.id,
          name: clip.name,
          type: clip.type,
          sourceId: clip.sourceId,
          sourceIn: clip.sourceIn,
          sourceOut: clip.sourceOut,
          timelineIn: clip.startTime,
          timelineOut: clip.startTime + clip.duration,
          duration: clip.duration,
          playbackRate: clip.playbackRate,
          volume: clip.volume,
          enabled: clip.enabled,
          locked: clip.locked,
          effects: clip.effects || [],
          filters: clip.filters || [],
          transitions: clip.transitions || [],
          keyframes: [],
          metadata: {},
        })),
      })
    })
  })
  
  // Добавляем маркеры
  if (timelineProject.markers) {
    mainSequence.markers = timelineProject.markers.map((marker) => ({
      id: marker.id,
      name: marker.name,
      time: marker.time,
      color: marker.color || "#FF0000",
      type: marker.type || "note",
      comment: marker.description,
    }))
  }
  
  // Обновляем настройки проекта
  studioProject.settings.frameRate = timelineProject.fps
  studioProject.settings.duration = timelineProject.duration
  
  return studioProject
}

export const timelineMachine = setup({
  types: {} as {
    context: TimelineContext
    events: TimelineEvents
  },
  guards,
  actions: actions as any,
  actors: {
    saveProjectService: fromPromise(async ({ input }: { input: { context: TimelineContext } }) => {
      const { context } = input
      
      if (!context.project) {
        throw new Error("No project to save")
      }

      // Получаем сервис для сохранения проектов
      const projectService = TimelineStudioProjectService.getInstance()
      
      // Получаем путь к файлу из контекста приложения (должен быть передан через события)
      // Временно используем заглушку - нужно будет интегрировать с AppSettingsContext
      const projectPath = (window as any).__currentProjectPath || null
      
      if (!projectPath) {
        // Если путь не определен, нужно показать диалог сохранения
        const { save } = await import("@tauri-apps/plugin-dialog")
        const path = await save({
          filters: [
            { name: "Timeline Studio Project v2", extensions: ["tlsp"] },
            { name: "Timeline Studio Project (Legacy)", extensions: ["tls"] }
          ],
          defaultPath: `${context.project.name}.tlsp`
        })
        
        if (!path) {
          throw new Error("Save cancelled")
        }
        
        // Сохраняем путь для последующего использования
        (window as any).__currentProjectPath = path
      }
      
      // Конвертируем TimelineProject в TimelineStudioProject
      const timelineStudioProject = await convertTimelineProjectToStudioProject(context.project)
      
      // Сохраняем проект
      await projectService.saveProject(timelineStudioProject, projectPath || (window as any).__currentProjectPath)
      
      return { success: true }
    }),
  },
}).createMachine({
  id: "timeline",
  initial: "idle",
  context: initialContext,
  states: {
    idle: {
      on: {
        CREATE_PROJECT: {
          target: "ready",
          actions: ["createProject"],
        },
        LOAD_PROJECT: {
          target: "ready",
          actions: ["loadProject"],
        },
      },
    },

    ready: {
      on: {
        // Проект
        SAVE_PROJECT: {
          target: "saving",
          guard: "hasProject",
        },
        CLOSE_PROJECT: {
          target: "idle",
          actions: ["closeProject"],
        },

        // Секции
        ADD_SECTION: {
          actions: ["addSection"],
          guard: "hasProject",
        },

        // Треки
        ADD_TRACK: {
          actions: ["addTrack"],
          guard: "hasProject",
        },

        // Клипы
        ADD_CLIP: {
          actions: ["addClip"],
          guard: "hasProject",
        },
        SPLIT_CLIP: {
          actions: ["splitClip"],
          guard: "hasProject",
        },
        TRIM_CLIP: {
          actions: ["trimClip"],
          guard: "hasProject",
        },
        RIPPLE_EDIT: {
          actions: ["rippleEdit"],
          guard: "hasProject",
        },
        ROLL_EDIT: {
          actions: ["rollEdit"],
          guard: "hasProject",
        },
        SLIP_EDIT: {
          actions: ["slipEdit"],
          guard: "hasProject",
        },
        SLIDE_EDIT: {
          actions: ["slideEdit"],
          guard: "hasProject",
        },
        RATE_STRETCH: {
          actions: ["rateStretch"],
          guard: "hasProject",
        },

        // Выделение
        SELECT_CLIPS: {
          actions: ["selectClips"],
        },
        CLEAR_SELECTION: {
          actions: ["clearSelection"],
        },

        // Воспроизведение
        PLAY: {
          target: "playing",
          actions: ["play"],
        },
        SEEK: {
          actions: ["seek"],
        },

        // UI
        SET_TIME_SCALE: {
          actions: ["setTimeScale"],
        },

        // Применение ресурсов
        APPLY_EFFECT_TO_CLIP: {
          actions: ["applyEffectToClip"],
          guard: "hasProject",
        },
        APPLY_FILTER_TO_CLIP: {
          actions: ["applyFilterToClip"],
          guard: "hasProject",
        },
        APPLY_TRANSITION_TO_CLIP: {
          actions: ["applyTransitionToClip"],
          guard: "hasProject",
        },
        APPLY_STYLE_TEMPLATE_TO_CLIP: {
          actions: ["applyStyleTemplateToClip"],
          guard: "hasProject",
        },
        APPLY_TEMPLATE_TO_CLIP: {
          actions: ["applyTemplateToClip"],
          guard: "hasProject",
        },
        APPLY_EFFECT_TO_TRACK: {
          actions: ["applyEffectToTrack"],
          guard: "hasProject",
        },
        APPLY_FILTER_TO_TRACK: {
          actions: ["applyFilterToTrack"],
          guard: "hasProject",
        },

        // Группировка клипов
        CLIPS_GROUPED: {
          // События группировки просто передаются дальше для обработки в UI
          guard: "hasProject",
        },
        CLIPS_UNGROUPED: {
          guard: "hasProject",
        },
        CLIPS_ADDED_TO_GROUP: {
          guard: "hasProject",
        },
        CLIPS_REMOVED_FROM_GROUP: {
          guard: "hasProject",
        },
        GROUP_TOGGLED: {
          guard: "hasProject",
        },
        GROUP_LOCKED: {
          guard: "hasProject",
        },
        NESTED_SEQUENCE_CREATED: {
          guard: "hasProject",
        },
        NESTED_SEQUENCE_BROKEN: {
          guard: "hasProject",
        },

        // J-Cut / L-Cut операции
        CREATE_JL_CUT: {
          guard: "hasProject",
          actions: ["createJLCut"],
        },
        RESET_JL_CUT: {
          guard: "hasProject",
          actions: ["resetJLCut"],
        },
        LINK_CLIPS: {
          guard: "hasProject",
          actions: ["linkClips"],
        },
        UNLINK_CLIPS: {
          guard: "hasProject",
          actions: ["unlinkClips"],
        },

        // Маркеры
        ADD_MARKER: {
          guard: "hasProject",
          actions: ["addMarker"],
        },
        UPDATE_MARKER: {
          guard: "hasProject",
          actions: ["updateMarker"],
        },
        REMOVE_MARKER: {
          guard: "hasProject",
          actions: ["removeMarker"],
        },
        CLEAR_MARKERS: {
          guard: "hasProject",
          actions: ["clearMarkers"],
        },

        // Speed Ramping
        ENABLE_SPEED_RAMPING: {
          guard: "hasProject",
          actions: ["enableSpeedRamping"],
        },
        DISABLE_SPEED_RAMPING: {
          guard: "hasProject",
          actions: ["disableSpeedRamping"],
        },
        SET_SPEED_RAMPING_CONFIG: {
          guard: "hasProject",
          actions: ["setSpeedRampingConfig"],
        },
        ADD_SPEED_KEYFRAME: {
          guard: "hasProject",
          actions: ["addSpeedKeyframe"],
        },
        UPDATE_SPEED_KEYFRAME: {
          guard: "hasProject",
          actions: ["updateSpeedKeyframe"],
        },
        REMOVE_SPEED_KEYFRAME: {
          guard: "hasProject",
          actions: ["removeSpeedKeyframe"],
        },
        APPLY_SPEED_PRESET: {
          guard: "hasProject",
          actions: ["applySpeedPreset"],
        },

        // AI Content Intelligence
        ANALYZE_CLIP: {
          guard: "hasProject",
          actions: ["analyzeClip"],
        },
        ANALYZE_TIMELINE: {
          guard: "hasProject",
          actions: ["analyzeTimeline"],
        },
        APPLY_AI_SUGGESTION: {
          guard: "hasProject",
          actions: ["applyAISuggestion"],
        },
        DISMISS_AI_SUGGESTION: {
          guard: "hasProject",
          actions: ["dismissAISuggestion"],
        },
        CLEAR_AI_SUGGESTIONS: {
          guard: "hasProject",
          actions: ["clearAISuggestions"],
        },
        ADD_AI_MARKER: {
          guard: "hasProject",
          actions: ["addAIMarker"],
        },

        // Буфер обмена
        COPY_SELECTION: {
          actions: ["copySelection"],
          guard: "hasProject",
        },
        CUT_SELECTION: {
          actions: ["cutSelection"],
          guard: "hasProject",
        },
        PASTE: {
          actions: ["paste"],
          guard: "hasProject",
        },

        // Ошибки
        CLEAR_ERROR: {
          actions: ["clearError"],
        },
      },
    },

    playing: {
      on: {
        PAUSE: {
          target: "ready",
          actions: ["pause"],
        },
        STOP: {
          target: "ready",
          actions: ["pause", "seek"],
          // Автоматически перематываем в начало при остановке
        },
        SEEK: {
          actions: ["seek"],
        },
      },
    },

    saving: {
      invoke: {
        id: "saveProject",
        src: "saveProjectService",
        input: ({ context }) => ({ context }),
        onDone: {
          target: "ready",
        },
        onError: {
          target: "ready",
          actions: ["setError"],
        },
      },
    },
  },
} as any)
