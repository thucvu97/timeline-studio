/**
 * Timeline State Machine
 *
 * Машина состояний для управления Timeline
 */

import { assign, setup } from "xstate"

import { VideoEffect } from "@/features/effects/types"
import { VideoFilter } from "@/features/filters/types/filters"
import { MediaFile } from "@/features/media/types/media"
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
import { ResourceManager } from "./resource-manager"

interface TimelineContext {
  // Основные данные
  project: TimelineProject | null
  uiState: TimelineUIState

  // Временное состояние
  isPlaying: boolean
  isRecording: boolean
  currentTime: number

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

  // Ошибки
  setError: assign({
    error: ({ event }: { event: any }) => event.error || "Unknown error",
  }),

  clearError: assign({
    error: null,
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
}

export const timelineMachine = setup({
  types: {
    context: {} as TimelineContext,
    events: {} as TimelineEvents,
  },
  guards,
  actions,
  actors: {
    saveProjectService: async () => {
      // TODO: Implement actual save logic
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return { success: true }
    },
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
})
