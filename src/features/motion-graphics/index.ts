/**
 * Motion Graphics Module
 * Professional keyframe animation system for Timeline Studio
 */

import { createKeyframe } from "./services/keyframe-manager"
import { applyPreset, getPresetById } from "./services/preset-manager"
import { AnimatedProperty, InterpolationType } from "./types/keyframe"

// Components
export { CurveEditor } from "./components/curve-editor"
export { MotionGraphicsPanel } from "./components/motion-graphics-panel"
export {
  addLayerToTrack,
  blendLayerValues,
  createAnimationLayer,
  createAnimationState,
  createAnimationTrack,
  duplicateLayer,
  evaluateLayerAtTime,
  evaluateTrackAtTime,
  exportLayer,
  getLayerHierarchy,
  importLayer,
  mergeLayers,
  removeLayerFromTrack,
  reorderLayersInTrack,
  setLayerParent,
  updateLayerInTrack,
} from "./services/animation-layers"
export {
  ExpressionEvaluator,
  expressionEvaluator,
  expressionPresets,
} from "./services/expression-engine"
// Services
export {
  generateSmoothTransition,
  getValueAtTime,
  getVelocityAtTime,
  interpolateKeyframes,
  snapToFrame,
} from "./services/interpolation"
export {
  addKeyframeToProperty,
  autoKeyframe,
  copyKeyframes,
  createAnimationCurve,
  createEasingKeyframes,
  createKeyframe,
  deleteSelectedKeyframes,
  deselectAllKeyframes,
  findKeyframeAtTime,
  getKeyframesInRange,
  mergeOverlappingKeyframes,
  moveKeyframes,
  offsetKeyframesToTime,
  removeKeyframeFromProperty,
  reverseKeyframes,
  scaleKeyframesTime,
  scaleKeyframesToDuration,
  selectKeyframes,
  snapKeyframeToGrid,
  updateKeyframeInProperty,
  validatePropertyKeyframes,
} from "./services/keyframe-manager"
export {
  applyPreset,
  combinePresets,
  createPresetFromLayer,
  exportPresets,
  getAllPresets,
  getCollectionPresets,
  getPresetById,
  getPresetCategories,
  getPresetsByCategory,
  getPresetThumbnail,
  importPresets,
  presetCollections,
  searchPresets,
  validatePreset,
} from "./services/preset-manager"

export type {
  MotionGraphicsClip,
  MotionGraphicsProject,
} from "./services/timeline-integration"
export {
  addMotionGraphicsToClip,
  applyMotionPresetToClip,
  copyMotionGraphics,
  createMotionContext,
  evaluateClipMotionAtTime,
  exportMotionGraphics,
  getMotionGraphicsSummary,
  getMotionKeyframesForTimeline,
  importMotionGraphics,
  offsetMotionGraphicsTiming,
  removeMotionGraphicsFromClip,
  scaleMotionGraphicsDuration,
  updateMotionPropertyInClip,
} from "./services/timeline-integration"
// Types
export type {
  AnimatedProperty,
  AnimationCurve,
  AnimationLayer,
  AnimationState,
  AnimationTrack,
  BezierHandle,
  EasingFunction,
  ExpressionContext,
  InterpolationOptions,
  InterpolationType,
  Keyframe,
  KeyframeValue,
  MotionPreset,
  PropertyDescriptor,
} from "./types/keyframe"

// Constants
export const MOTION_GRAPHICS_VERSION = "1.0.0"

/**
 * Default motion graphics settings
 */
export const DEFAULT_MOTION_SETTINGS = {
  fps: 30,
  snapToFrames: true,
  showCurves: true,
  autoKeyframe: false,
  defaultInterpolation: "ease-in-out" as InterpolationType,
  timelineZoom: 1,
  curveEditorHeight: 400,
  previewQuality: "full" as const,
  realtimePlayback: true,
}

/**
 * Motion graphics capabilities
 */
export const MOTION_CAPABILITIES = {
  maxKeyframes: 10000,
  maxLayers: 100,
  maxTracks: 50,
  maxProperties: 500,
  supportedTypes: ["number", "vec2", "vec3", "vec4", "color", "boolean", "text"] as const,
  interpolationTypes: [
    "linear",
    "bezier",
    "hold",
    "ease",
    "ease-in",
    "ease-out",
    "ease-in-out",
    "bounce",
    "elastic",
    "back",
    "expo",
  ] as const,
  blendModes: ["normal", "add", "multiply", "screen", "overlay"] as const,
}

/**
 * Quick preset application
 */
export function quickApplyPreset(presetId: string, targetId: string, duration?: number) {
  const preset = getPresetById(presetId)
  if (!preset) return null

  return applyPreset(preset, {
    startTime: 0,
    duration: duration || preset.duration,
    targetId,
  })
}

/**
 * Create simple fade animation
 */
export function createFadeAnimation(startValue = 0, endValue = 1, duration = 1, startTime = 0): AnimatedProperty {
  return {
    id: `fade-${Date.now()}`,
    name: "Opacity",
    path: "opacity",
    type: "number",
    keyframes: [
      createKeyframe(startTime, startValue, "ease-out"),
      createKeyframe(startTime + duration, endValue, "linear"),
    ],
    enabled: true,
  }
}

/**
 * Create simple scale animation
 */
export function createScaleAnimation(
  startValue: [number, number] = [0, 0],
  endValue: [number, number] = [1, 1],
  duration = 1,
  startTime = 0,
  interpolation: InterpolationType = "bounce",
): AnimatedProperty {
  return {
    id: `scale-${Date.now()}`,
    name: "Scale",
    path: "transform.scale",
    type: "vec2",
    keyframes: [
      createKeyframe(startTime, startValue, interpolation),
      createKeyframe(startTime + duration, endValue, "linear"),
    ],
    enabled: true,
  }
}

/**
 * Create position slide animation
 */
export function createSlideAnimation(
  startValue: [number, number],
  endValue: [number, number] = [0, 0],
  duration = 0.8,
  startTime = 0,
): AnimatedProperty {
  return {
    id: `slide-${Date.now()}`,
    name: "Position",
    path: "transform.position",
    type: "vec2",
    keyframes: [
      createKeyframe(startTime, startValue, "ease-out"),
      createKeyframe(startTime + duration, endValue, "linear"),
    ],
    enabled: true,
  }
}
