import { vi } from "vitest"

import { mockTimelineService } from "./services"

import type { TimelineClip, TimelineProject, TimelineTrack } from "../types"

// Mock useTimeline hook
export const mockUseTimeline = vi.fn(() => ({
  project: mockTimelineService.getProject(),
  loading: false,
  error: null,

  // Project actions
  createNewProject: vi.fn((name?: string) => mockTimelineService.createProject(name)),
  saveProject: vi.fn((project: TimelineProject) => mockTimelineService.saveProject(project)),
  loadProject: vi.fn((path: string) => mockTimelineService.loadProject(path)),

  // Section actions
  addSection: vi.fn((name: string, startTime: number, duration: number) =>
    mockTimelineService.addSection(name, startTime, duration),
  ),

  // Track actions
  addTrack: vi.fn((type: "video" | "audio", sectionId?: string, index?: number) =>
    mockTimelineService.addTrack(type, sectionId, index),
  ),
  removeTrack: vi.fn((trackId: string) => mockTimelineService.removeTrack(trackId)),

  // Clip actions
  addClip: vi.fn((trackId: string, mediaFile: any, position?: number) =>
    mockTimelineService.addClip(trackId, mediaFile, position),
  ),
  removeClip: vi.fn((trackId: string, clipId: string) => mockTimelineService.removeClip(trackId, clipId)),
  moveClip: vi.fn((trackId: string, clipId: string, newStartTime: number) =>
    mockTimelineService.moveClip(trackId, clipId, newStartTime),
  ),
}))

// Mock useTimelineSelection hook
export const mockUseTimelineSelection = vi.fn(() => ({
  selectedClips: [] as string[],
  selectedTracks: [] as string[],

  selectClip: vi.fn((clipId: string, multi?: boolean) => {}),
  selectTrack: vi.fn((trackId: string, multi?: boolean) => {}),
  clearSelection: vi.fn(),

  isClipSelected: vi.fn((clipId: string) => false),
  isTrackSelected: vi.fn((trackId: string) => false),
}))

// Mock useTimelinePlayback hook
export const mockUseTimelinePlayback = vi.fn(() => ({
  currentTime: 0,
  duration: mockTimelineService.getProject().duration,
  isPlaying: false,

  play: vi.fn(),
  pause: vi.fn(),
  seek: vi.fn((time: number) => {}),

  frameRate: 30,
  nextFrame: vi.fn(),
  previousFrame: vi.fn(),
}))

// Mock useTimelineZoom hook
export const mockUseTimelineZoom = vi.fn(() => ({
  scale: 1,
  minScale: 0.1,
  maxScale: 10,

  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  zoomToFit: vi.fn(),
  setScale: vi.fn((scale: number) => {}),
}))

// Mock useTimelineUndo hook
export const mockUseTimelineUndo = vi.fn(() => ({
  canUndo: false,
  canRedo: false,

  undo: vi.fn(),
  redo: vi.fn(),

  history: [] as any[],
  historyIndex: -1,
}))

// Mock useClips hook
export const mockUseClips = vi.fn(() => ({
  clips: [] as TimelineClip[],

  getClipById: vi.fn((clipId: string) => undefined),
  getClipsInRange: vi.fn((startTime: number, endTime: number) => []),
  getClipsOnTrack: vi.fn((trackId: string) => []),

  splitClip: vi.fn((clipId: string, time: number) => {}),
  trimClip: vi.fn((clipId: string, start: number, end: number) => {}),

  applyEffect: vi.fn((clipId: string, effect: any) => {}),
  removeEffect: vi.fn((clipId: string, effectId: string) => {}),
}))

// Mock useTracks hook
export const mockUseTracks = vi.fn(() => ({
  tracks: mockTimelineService.getAllTracks(),

  getTrackById: vi.fn((trackId: string) => mockTimelineService.getTrack(trackId)),
  getTracksByType: vi.fn((type: "video" | "audio") =>
    mockTimelineService.getAllTracks().filter((t) => t.type === type),
  ),

  reorderTracks: vi.fn((fromIndex: number, toIndex: number) => {}),
  toggleTrackMute: vi.fn((trackId: string) => {}),
  toggleTrackLock: vi.fn((trackId: string) => {}),

  setTrackHeight: vi.fn((trackId: string, height: number) => {}),
}))

// Mock useDragDropTimeline hook
export const mockUseDragDropTimeline = vi.fn(() => ({
  dragState: {
    isDragging: false,
    draggedItem: null,
    dragOverTrack: null,
    dropPosition: null,
  },
  handleDragStart: vi.fn(),
  handleDragOver: vi.fn(),
  handleDragEnd: vi.fn(),
  isValidDropTarget: vi.fn(() => false),
}))

// Export all mocks for easy importing
export const timelineHookMocks = {
  useTimeline: mockUseTimeline,
  useTimelineSelection: mockUseTimelineSelection,
  useTimelinePlayback: mockUseTimelinePlayback,
  useTimelineZoom: mockUseTimelineZoom,
  useTimelineUndo: mockUseTimelineUndo,
  useClips: mockUseClips,
  useTracks: mockUseTracks,
  useDragDropTimeline: mockUseDragDropTimeline,
}

// Set up vi.mock calls
vi.mock("../hooks/use-timeline", () => ({
  useTimeline: mockUseTimeline,
}))

vi.mock("../hooks/use-timeline-selection", () => ({
  useTimelineSelection: mockUseTimelineSelection,
}))

vi.mock("../hooks/use-timeline-playback", () => ({
  useTimelinePlayback: mockUseTimelinePlayback,
}))

vi.mock("../hooks/use-timeline-zoom", () => ({
  useTimelineZoom: mockUseTimelineZoom,
}))

vi.mock("../hooks/use-timeline-undo", () => ({
  useTimelineUndo: mockUseTimelineUndo,
}))

vi.mock("../hooks/use-clips", () => ({
  useClips: mockUseClips,
}))

vi.mock("../hooks/use-tracks", () => ({
  useTracks: mockUseTracks,
}))

vi.mock("../hooks/use-drag-drop-timeline", () => ({
  useDragDropTimeline: mockUseDragDropTimeline,
}))
