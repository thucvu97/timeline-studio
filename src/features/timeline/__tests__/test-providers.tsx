/**
 * Test providers for Timeline
 */

import type React from "react"

import { vi } from "vitest"

import { TimelineContext, type TimelineContextType } from "../services/timeline-provider"
import { createMockTimelineProject } from "./__fixtures__/timeline-fixtures"

export const createMockTimelineContext = (overrides?: Partial<TimelineContextType>): TimelineContextType => {
  const mockProject = createMockTimelineProject()

  return {
    // Состояние
    project: mockProject,
    uiState: {
      currentTime: 0,
      playheadPosition: 0,
      timeScale: 100,
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
    },
    isPlaying: false,
    isRecording: false,
    currentTime: 0,
    error: null,
    lastAction: null,
    isReady: true,
    isSaving: false,
    // Действия
    createProject: vi.fn(),
    loadProject: vi.fn(),
    saveProject: vi.fn(),
    closeProject: vi.fn(),
    addSection: vi.fn(),
    removeSection: vi.fn(),
    updateSection: vi.fn(),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    updateTrack: vi.fn(),
    reorderTracks: vi.fn(),
    addClip: vi.fn(),
    removeClip: vi.fn(),
    updateClip: vi.fn(),
    moveClip: vi.fn(),
    splitClip: vi.fn(),
    trimClip: vi.fn(),
    selectClips: vi.fn(),
    selectTracks: vi.fn(),
    selectSections: vi.fn(),
    clearSelection: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    setPlaybackRate: vi.fn(),
    setTimeScale: vi.fn(),
    setScrollPosition: vi.fn(),
    setEditMode: vi.fn(),
    toggleSnap: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    clearHistory: vi.fn(),
    copySelection: vi.fn(),
    cutSelection: vi.fn(),
    paste: vi.fn(),
    clearError: vi.fn(),
    send: vi.fn(),
    ...overrides,
  }
}

export const MockTimelineProvider: React.FC<{
  children: React.ReactNode
  value?: Partial<TimelineContextType>
}> = ({ children, value }) => {
  const contextValue = createMockTimelineContext(value)

  return <TimelineContext.Provider value={contextValue}>{children}</TimelineContext.Provider>
}
