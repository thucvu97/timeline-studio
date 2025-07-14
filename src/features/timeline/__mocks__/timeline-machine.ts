/**
 * Mock Timeline State Machine
 */

import { assign, createMachine } from "xstate"

import { createTimelineProject } from "../types"

const mockProject = createTimelineProject("Test Project", {})

export const timelineMachine = createMachine({
  id: "timeline-mock",
  initial: "ready",
  context: {
    project: mockProject,
    uiState: {
      currentTime: 0,
      playheadPosition: 0,
      timeScale: 100,
      scrollPosition: { x: 0, y: 0 },
      selectedClipIds: [],
      selectedTrackIds: [],
      selectedSectionIds: [],
      editMode: "select" as const,
      snapMode: "grid" as const,
      visibleTrackTypes: ["video", "audio", "music", "title", "subtitle", "voiceover", "sfx", "ambient"],
      collapsedSectionIds: [],
      clipboard: { clips: [], tracks: [] },
      history: [],
      historyIndex: -1,
      maxHistorySize: 50,
    },
    isPlaying: false,
    isRecording: false,
    currentTime: 0,
    speedRampingConfigs: {},
    draggedClip: null,
    draggedTrack: null,
    error: null,
    lastAction: null,
  },
  on: {
    // Mock event handlers
    CREATE_PROJECT: {
      actions: assign({
        project: ({ event }) => createTimelineProject(event.name, event.settings),
        lastAction: "CREATE_PROJECT",
      }),
    },
    LOAD_PROJECT: {
      actions: assign({
        project: ({ event }) => event.project,
        lastAction: "LOAD_PROJECT",
      }),
    },
    ADD_MARKER: {
      actions: assign({
        lastAction: "ADD_MARKER",
      }),
    },
    SHOW_MODAL: {
      actions: assign({
        lastAction: "SHOW_MODAL",
      }),
    },
    // Add other events as needed for tests
  },
})
