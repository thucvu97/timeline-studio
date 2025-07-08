/**
 * Edit modes for timeline editing operations
 */

export const EDIT_MODES = {
  SELECT: "select",
  TRIM: "trim",
  RIPPLE: "ripple",
  ROLL: "roll",
  SLIP: "slip",
  SLIDE: "slide",
  SPLIT: "split",
  RATE: "rate",
} as const

export type EditMode = (typeof EDIT_MODES)[keyof typeof EDIT_MODES]

export interface EditModeConfig {
  mode: EditMode
  name: string
  icon: string
  hotkey: string
  description: string
  cursor: string
}

export const EDIT_MODE_CONFIGS: Record<EditMode, EditModeConfig> = {
  [EDIT_MODES.SELECT]: {
    mode: EDIT_MODES.SELECT,
    name: "Select",
    icon: "MousePointer",
    hotkey: "V",
    description: "Select and move clips",
    cursor: "default",
  },
  [EDIT_MODES.TRIM]: {
    mode: EDIT_MODES.TRIM,
    name: "Trim",
    icon: "Scissors",
    hotkey: "T",
    description: "Trim clip edges",
    cursor: "col-resize",
  },
  [EDIT_MODES.RIPPLE]: {
    mode: EDIT_MODES.RIPPLE,
    name: "Ripple",
    icon: "ArrowLeftRight",
    hotkey: "Q",
    description: "Ripple edit - trim and move subsequent clips",
    cursor: "ew-resize",
  },
  [EDIT_MODES.ROLL]: {
    mode: EDIT_MODES.ROLL,
    name: "Roll",
    icon: "Minimize2",
    hotkey: "W",
    description: "Roll edit - adjust edit point between clips",
    cursor: "col-resize",
  },
  [EDIT_MODES.SLIP]: {
    mode: EDIT_MODES.SLIP,
    name: "Slip",
    icon: "Move",
    hotkey: "Y",
    description: "Slip edit - change clip content without moving",
    cursor: "grab",
  },
  [EDIT_MODES.SLIDE]: {
    mode: EDIT_MODES.SLIDE,
    name: "Slide",
    icon: "MoveHorizontal",
    hotkey: "U",
    description: "Slide edit - move clip and adjust neighbors",
    cursor: "move",
  },
  [EDIT_MODES.SPLIT]: {
    mode: EDIT_MODES.SPLIT,
    name: "Split",
    icon: "Split",
    hotkey: "S",
    description: "Split clips at cursor position",
    cursor: "crosshair",
  },
  [EDIT_MODES.RATE]: {
    mode: EDIT_MODES.RATE,
    name: "Rate",
    icon: "Gauge",
    hotkey: "R",
    description: "Change clip playback speed",
    cursor: "ns-resize",
  },
}

export interface EditOperation {
  type: "trim" | "ripple" | "roll" | "slip" | "slide" | "split" | "rate"
  clipId: string
  trackId: string
  edge?: "start" | "end"
  delta?: number
  position?: number
  rate?: number
}

export interface EditConstraints {
  minClipDuration: number
  snapThreshold: number
  rippleAcrossTracks: boolean
  maintainSync: boolean
  allowOverlap: boolean
}

export const DEFAULT_EDIT_CONSTRAINTS: EditConstraints = {
  minClipDuration: 1, // 1 frame minimum
  snapThreshold: 10, // 10 pixels
  rippleAcrossTracks: true,
  maintainSync: true,
  allowOverlap: false,
}

export interface SnapPoint {
  position: number
  type: "grid" | "clip-start" | "clip-end" | "marker" | "playhead"
  strength: number // 0-1, how strongly it should snap
}

export interface EditPreview {
  clips: Array<{
    id: string
    originalPosition: number
    originalDuration: number
    previewPosition: number
    previewDuration: number
    affected: boolean
  }>
  valid: boolean
  conflicts: string[]
}
