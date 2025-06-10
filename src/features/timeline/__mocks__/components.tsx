import React from "react"

import { vi } from "vitest"

// Mock Timeline component
export const MockTimeline = vi.fn(({ onReady, onTimeUpdate, onSelectionChange, ...props }: any) => {
  // Simulate component lifecycle
  React.useEffect(() => {
    if (onReady) {
      onReady({ timeline: "mock-timeline-instance" })
    }
  }, [onReady])

  return (
    <div data-testid="mock-timeline" {...props}>
      <div data-testid="timeline-header">Timeline Header</div>
      <div data-testid="timeline-tracks">Timeline Tracks</div>
      <div data-testid="timeline-playhead">Playhead</div>
    </div>
  )
})

// Mock Track component
export const MockTrack = vi.fn(({ track, onClipClick, onTrackClick, ...props }: any) => (
  <div
    data-testid={`mock-track-${track.id}`}
    data-track-type={track.type}
    onClick={() => onTrackClick?.(track)}
    {...props}
  >
    <div data-testid="track-header">{track.name}</div>
    <div data-testid="track-clips">
      {track.clips?.map((clip: any) => (
        <div
          key={clip.id}
          data-testid={`clip-${clip.id}`}
          onClick={(e) => {
            e.stopPropagation()
            onClipClick?.(clip)
          }}
        >
          Clip {clip.id}
        </div>
      ))}
    </div>
  </div>
))

// Mock Clip component
export const MockClip = vi.fn(({ clip, selected, onSelect, onDrag, onResize, ...props }: any) => (
  <div data-testid={`mock-clip-${clip.id}`} data-selected={selected} onClick={() => onSelect?.(clip)} {...props}>
    <div data-testid="clip-thumbnail">Thumbnail</div>
    <div data-testid="clip-duration">{clip.endTime - clip.startTime}s</div>
    {clip.effects?.length > 0 && <div data-testid="clip-effects">{clip.effects.length} effects</div>}
  </div>
))

// Mock TimelineScale component
export const MockTimelineScale = vi.fn(({ duration, scale, onScaleChange, ...props }: any) => (
  <div data-testid="mock-timeline-scale" {...props}>
    <div data-testid="scale-ruler">
      Scale: {scale}x | Duration: {duration}s
    </div>
    <button data-testid="zoom-in" onClick={() => onScaleChange?.(scale * 2)}>
      Zoom In
    </button>
    <button data-testid="zoom-out" onClick={() => onScaleChange?.(scale / 2)}>
      Zoom Out
    </button>
  </div>
))

// Mock TimelineContent component
export const MockTimelineContent = vi.fn(({ children, onScroll, ...props }: any) => (
  <div data-testid="mock-timeline-content" onScroll={(e) => onScroll?.(e)} {...props}>
    {children}
  </div>
))

// Mock TimelineTopPanel component
export const MockTimelineTopPanel = vi.fn(({ onAddTrack, onUndo, onRedo, canUndo, canRedo, ...props }: any) => (
  <div data-testid="mock-timeline-top-panel" {...props}>
    <button data-testid="add-video-track" onClick={() => onAddTrack?.("video")}>
      Add Video Track
    </button>
    <button data-testid="add-audio-track" onClick={() => onAddTrack?.("audio")}>
      Add Audio Track
    </button>
    <button data-testid="undo" disabled={!canUndo} onClick={onUndo}>
      Undo
    </button>
    <button data-testid="redo" disabled={!canRedo} onClick={onRedo}>
      Redo
    </button>
  </div>
))

// Export all component mocks
export const timelineComponentMocks = {
  Timeline: MockTimeline,
  Track: MockTrack,
  Clip: MockClip,
  TimelineScale: MockTimelineScale,
  TimelineContent: MockTimelineContent,
  TimelineTopPanel: MockTimelineTopPanel,
}

// Set up vi.mock calls
vi.mock("../components/timeline", () => ({
  Timeline: MockTimeline,
}))

vi.mock("../components/track/track", () => ({
  Track: MockTrack,
}))

vi.mock("../components/clip/clip", () => ({
  Clip: MockClip,
}))

vi.mock("../components/timeline-scale/timeline-scale", () => ({
  TimelineScale: MockTimelineScale,
}))

vi.mock("../components/timeline-content", () => ({
  TimelineContent: MockTimelineContent,
}))

vi.mock("../components/timeline-top-panel", () => ({
  TimelineTopPanel: MockTimelineTopPanel,
}))
