/**
 * Keyframe animation types
 */

/**
 * Interpolation types for keyframes
 */
export type InterpolationType =
  | "linear" // Linear interpolation
  | "bezier" // Cubic bezier curves
  | "hold" // Step/constant value
  | "ease" // Ease in/out
  | "ease-in" // Ease in
  | "ease-out" // Ease out
  | "ease-in-out" // Ease in and out
  | "bounce" // Bounce effect
  | "elastic" // Elastic effect
  | "back" // Back effect
  | "expo" // Exponential

/**
 * Keyframe value types
 */
export type KeyframeValue =
  | number
  | [number, number] // vec2
  | [number, number, number] // vec3
  | [number, number, number, number] // vec4
  | string // color, text
  | boolean

/**
 * Individual keyframe
 */
export interface Keyframe<T = KeyframeValue> {
  id: string
  time: number // Time in seconds
  value: T
  interpolation: InterpolationType

  // Bezier control points (for bezier interpolation)
  easeIn?: [number, number] // Control point for incoming curve
  easeOut?: [number, number] // Control point for outgoing curve

  // Temporal ease (affects timing)
  temporalEaseIn?: number // 0-1, affects timing curve
  temporalEaseOut?: number // 0-1, affects timing curve

  // Additional properties
  locked?: boolean
  selected?: boolean
  label?: string
}

/**
 * Animated property
 */
export interface AnimatedProperty {
  id: string
  name: string
  path: string // Property path (e.g., "transform.position.x")
  type: "number" | "vec2" | "vec3" | "vec4" | "color" | "boolean" | "text"
  keyframes: Keyframe[]
  enabled: boolean

  // Property constraints
  min?: number | number[]
  max?: number | number[]
  step?: number

  // Expression
  expression?: string
  expressionEnabled?: boolean

  // Animation settings
  preExpression?: boolean // Apply before expressions
  postExpression?: boolean // Apply after expressions
}

/**
 * Animation layer
 */
export interface AnimationLayer {
  id: string
  name: string
  properties: AnimatedProperty[]
  enabled: boolean
  solo: boolean
  locked: boolean
  opacity: number // 0-1, for blending
  blendMode: "normal" | "add" | "multiply" | "screen" | "overlay"

  // Timing
  startTime?: number
  endTime?: number
  offset?: number
  timeScale?: number

  // Parent/child relationships
  parentId?: string
  childIds?: string[]
}

/**
 * Animation track (contains multiple layers)
 */
export interface AnimationTrack {
  id: string
  targetId: string // ID of the object being animated
  targetType: "clip" | "effect" | "text" | "shape" | "camera"
  layers: AnimationLayer[]
  enabled: boolean

  // Track settings
  muted?: boolean
  locked?: boolean
  color?: string
}

/**
 * Bezier curve handle
 */
export interface BezierHandle {
  x: number // Time offset
  y: number // Value offset
  linked: boolean // Whether in/out handles are linked
}

/**
 * Animation curve
 */
export interface AnimationCurve {
  propertyId: string
  keyframes: Keyframe[]

  // Curve settings
  preInfinity: "constant" | "linear" | "cycle" | "cycle-offset" | "oscillate"
  postInfinity: "constant" | "linear" | "cycle" | "cycle-offset" | "oscillate"

  // Display settings
  visible: boolean
  color: string
  selected: boolean
}

/**
 * Easing function definition
 */
export interface EasingFunction {
  name: string
  type: InterpolationType
  controlPoints?: [number, number, number, number] // For cubic-bezier
  params?: Record<string, number> // For parametric easing
  preview?: (t: number) => number // Function to preview easing
}

/**
 * Motion preset
 */
export interface MotionPreset {
  id: string
  name: string
  description: string
  category: string
  thumbnail?: string
  tags: string[]

  // Animation data
  duration: number
  properties: AnimatedProperty[]

  // Preset settings
  scalable: boolean // Can scale duration
  customizable: boolean // Can modify properties

  // Preview
  preview?: {
    before: KeyframeValue
    after: KeyframeValue
  }
}

/**
 * Expression context
 */
export interface ExpressionContext {
  // Time
  time: number
  frame: number
  fps: number

  // Layer
  layer: AnimationLayer
  property: AnimatedProperty

  // Values
  value: KeyframeValue
  velocity?: KeyframeValue

  // References
  comp: {
    width: number
    height: number
    duration: number
    frameDuration: number
  }

  // Helper functions available in expressions
  thisComp: (name: string) => any
  thisLayer: (name: string) => any
  thisProperty: () => any
}

/**
 * Animation state
 */
export interface AnimationState {
  tracks: AnimationTrack[]
  currentTime: number
  playing: boolean
  loop: boolean

  // Selection
  selectedKeyframes: string[]
  selectedProperties: string[]
  selectedLayers: string[]

  // View settings
  timelineZoom: number
  timelineScroll: number
  showCurves: boolean
  snapToFrames: boolean

  // Playback
  previewQuality: "full" | "half" | "quarter"
  realtimePlayback: boolean
}

/**
 * Interpolation options
 */
export interface InterpolationOptions {
  type: InterpolationType
  tension?: number // For cardinal splines
  bias?: number // For TCB splines
  continuity?: number // For TCB splines
  overshoot?: number // For back easing
  amplitude?: number // For elastic easing
  period?: number // For elastic easing
}

/**
 * Property descriptor
 */
export interface PropertyDescriptor {
  path: string
  name: string
  type: "number" | "vec2" | "vec3" | "vec4" | "color" | "boolean" | "text"
  defaultValue: KeyframeValue
  animatable: boolean
  min?: number | number[]
  max?: number | number[]
  step?: number
  units?: string
  group?: string
}
