/**
 * Timeline State Machine
 *
 * Машина состояний для управления Timeline
 */

import { assign, createMachine } from "xstate";

import { MediaFile } from "@/types/media";
import {
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
} from "@/types/timeline";

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface TimelineContext {
  // Основные данные
  project: TimelineProject | null;
  uiState: TimelineUIState;

  // Временное состояние
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;

  // Операции
  draggedClip: TimelineClip | null;
  draggedTrack: TimelineTrack | null;

  // Ошибки
  error: string | null;
  lastAction: string | null;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export type TimelineEvents =
  // Проект
  | { type: "CREATE_PROJECT"; name: string; settings?: any }
  | { type: "LOAD_PROJECT"; project: TimelineProject }
  | { type: "SAVE_PROJECT" }
  | { type: "CLOSE_PROJECT" }

  // Секции
  | {
      type: "ADD_SECTION";
      name: string;
      startTime: number;
      duration: number;
      realStartTime?: Date;
    }
  | { type: "REMOVE_SECTION"; sectionId: string }
  | {
      type: "UPDATE_SECTION";
      sectionId: string;
      updates: Partial<TimelineSection>;
    }

  // Треки
  | {
      type: "ADD_TRACK";
      trackType: TrackType;
      sectionId?: string;
      name?: string;
    }
  | { type: "REMOVE_TRACK"; trackId: string }
  | { type: "UPDATE_TRACK"; trackId: string; updates: Partial<TimelineTrack> }
  | { type: "REORDER_TRACKS"; trackIds: string[] }

  // Клипы
  | {
      type: "ADD_CLIP";
      trackId: string;
      mediaFile: MediaFile;
      startTime: number;
      duration?: number;
    }
  | { type: "REMOVE_CLIP"; clipId: string }
  | { type: "UPDATE_CLIP"; clipId: string; updates: Partial<TimelineClip> }
  | {
      type: "MOVE_CLIP";
      clipId: string;
      newTrackId: string;
      newStartTime: number;
    }
  | { type: "SPLIT_CLIP"; clipId: string; splitTime: number }
  | {
      type: "TRIM_CLIP";
      clipId: string;
      newStartTime: number;
      newDuration: number;
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

  // Ошибки
  | { type: "CLEAR_ERROR" };

// ============================================================================
// INITIAL STATE
// ============================================================================

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
  visibleTrackTypes: [
    "video",
    "audio",
    "music",
    "title",
    "subtitle",
    "voiceover",
    "sfx",
    "ambient",
  ],
  collapsedSectionIds: [],
  clipboard: { clips: [], tracks: [] },
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,
};

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
};

// ============================================================================
// GUARDS
// ============================================================================

const guards = {
  hasProject: ({ context }: { context: TimelineContext }) =>
    context.project !== null,
  hasSelection: ({ context }: { context: TimelineContext }) =>
    context.uiState.selectedClipIds.length > 0 ||
    context.uiState.selectedTrackIds.length > 0,
  canUndo: ({ context }: { context: TimelineContext }) =>
    context.uiState.historyIndex > 0,
  canRedo: ({ context }: { context: TimelineContext }) =>
    context.uiState.historyIndex < context.uiState.history.length - 1,
  hasClipboard: ({ context }: { context: TimelineContext }) =>
    context.uiState.clipboard.clips.length > 0 ||
    context.uiState.clipboard.tracks.length > 0,
};

// ============================================================================
// ACTIONS
// ============================================================================

const actions = {
  // Проект
  createProject: assign({
    project: ({ event }: { event: any }) =>
      createTimelineProject(event.name, event.settings),
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
      if (!context.project) return context.project;

      const newSection = createTimelineSection(
        event.name,
        event.startTime,
        event.duration,
        event.realStartTime,
      );

      return {
        ...context.project,
        sections: [...context.project.sections, newSection],
        updatedAt: new Date(),
      };
    },
    lastAction: "ADD_SECTION",
  }),

  // Треки
  addTrack: assign({
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      if (!context.project) return context.project;

      const newTrack = createTimelineTrack(
        event.name || `${event.trackType} Track`,
        event.trackType,
        event.sectionId,
      );

      if (event.sectionId) {
        // Добавляем в секцию
        const sections = context.project.sections.map((section) => {
          if (section.id === event.sectionId) {
            newTrack.order = section.tracks.length;
            return {
              ...section,
              tracks: [...section.tracks, newTrack],
            };
          }
          return section;
        });

        return {
          ...context.project,
          sections,
          updatedAt: new Date(),
        };
      } else {
        // Добавляем как глобальный трек
        newTrack.order = context.project.globalTracks.length;
        return {
          ...context.project,
          globalTracks: [...context.project.globalTracks, newTrack],
          updatedAt: new Date(),
        };
      }
    },
    lastAction: "ADD_TRACK",
  }),

  // Клипы
  addClip: assign({
    project: ({ context, event }: { context: TimelineContext; event: any }) => {
      if (!context.project) return context.project;

      const newClip = createTimelineClip(
        event.mediaFile.id,
        event.trackId,
        event.startTime,
        event.duration || event.mediaFile.duration || 10,
      );
      newClip.name = event.mediaFile.name;
      newClip.mediaFile = event.mediaFile;

      // Находим трек и добавляем клип
      const updateTracks = (tracks: TimelineTrack[]) =>
        tracks.map((track) => {
          if (track.id === event.trackId) {
            return {
              ...track,
              clips: [...track.clips, newClip],
            };
          }
          return track;
        });

      const sections = context.project.sections.map((section) => ({
        ...section,
        tracks: updateTracks(section.tracks),
      }));

      const globalTracks = updateTracks(context.project.globalTracks);

      return {
        ...context.project,
        sections,
        globalTracks,
        updatedAt: new Date(),
      };
    },
    lastAction: "ADD_CLIP",
  }),

  // Выделение
  selectClips: assign({
    uiState: ({
      context,
      event,
    }: {
      context: TimelineContext;
      event: any;
    }) => ({
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
    uiState: ({
      context,
      event,
    }: {
      context: TimelineContext;
      event: any;
    }) => ({
      ...context.uiState,
      currentTime: event.time,
      playheadPosition: event.time * context.uiState.timeScale,
    }),
    lastAction: "SEEK",
  }),

  // UI
  setTimeScale: assign({
    uiState: ({
      context,
      event,
    }: {
      context: TimelineContext;
      event: any;
    }) => ({
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
};

// ============================================================================
// MACHINE DEFINITION
// ============================================================================

export const timelineMachine = createMachine(
  {
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
  },
  {
    guards,
    actions,
  },
);
