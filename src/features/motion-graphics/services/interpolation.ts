/**
 * Keyframe interpolation service
 * Handles all types of interpolation between keyframes
 */

import type { InterpolationType, Keyframe, KeyframeValue } from "../types/keyframe"

/**
 * Easing functions
 */
const easingFunctions = {
  linear: (t: number) => t,

  ease: (t: number) => {
    // Cubic bezier equivalent to CSS ease
    return cubicBezier(0.25, 0.1, 0.25, 1.0)(t)
  },

  "ease-in": (t: number) => {
    return cubicBezier(0.42, 0, 1.0, 1.0)(t)
  },

  "ease-out": (t: number) => {
    return cubicBezier(0, 0, 0.58, 1.0)(t)
  },

  "ease-in-out": (t: number) => {
    return cubicBezier(0.42, 0, 0.58, 1.0)(t)
  },

  bounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t
    }
    if (t < 2 / 2.75) {
      t -= 1.5 / 2.75
      return 7.5625 * t * t + 0.75
    }
    if (t < 2.5 / 2.75) {
      t -= 2.25 / 2.75
      return 7.5625 * t * t + 0.9375
    }
    t -= 2.625 / 2.75
    return 7.5625 * t * t + 0.984375
  },

  elastic: (t: number) => {
    if (t === 0 || t === 1) return t
    const p = 0.3
    const s = p / 4
    return 2 ** (-10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1
  },

  back: (t: number) => {
    const s = 1.70158
    return t * t * ((s + 1) * t - s)
  },

  expo: (t: number) => {
    return t === 0 ? 0 : 2 ** (10 * (t - 1))
  },
}

/**
 * Cubic bezier function factory
 */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  return (t: number): number => {
    // Newton-Raphson iteration for finding x given t
    let x = t
    for (let i = 0; i < 5; i++) {
      const cx = 3 * x1
      const bx = 3 * (x2 - x1) - cx
      const ax = 1 - cx - bx

      const currentX = ((ax * x + bx) * x + cx) * x
      const currentSlope = (3 * ax * x + 2 * bx) * x + cx

      if (Math.abs(currentX - t) < 0.001) break
      x -= (currentX - t) / currentSlope
    }

    // Calculate y for the found x
    const cy = 3 * y1
    const by = 3 * (y2 - y1) - cy
    const ay = 1 - cy - by

    return ((ay * x + by) * x + cy) * x
  }
}

/**
 * Interpolate between two keyframes
 */
export function interpolateKeyframes<T extends KeyframeValue>(
  keyframe1: Keyframe<T>,
  keyframe2: Keyframe<T>,
  time: number,
): T {
  // Calculate normalized time (0-1)
  const duration = keyframe2.time - keyframe1.time
  if (duration === 0) return keyframe1.value

  let t = (time - keyframe1.time) / duration
  t = Math.max(0, Math.min(1, t)) // Clamp to 0-1

  // Apply temporal easing if using bezier interpolation
  if (keyframe1.interpolation === "bezier" && keyframe1.temporalEaseOut !== undefined) {
    const easeOut = keyframe1.temporalEaseOut
    const easeIn = keyframe2.temporalEaseIn ?? 0.33
    t = cubicBezier(easeOut, easeOut, 1 - easeIn, 1 - easeIn)(t)
  }

  // Handle hold interpolation
  if (keyframe1.interpolation === "hold") {
    return keyframe1.value
  }

  // Get easing function
  const easingFn =
    keyframe1.interpolation === "bezier"
      ? easingFunctions.linear
      : keyframe1.interpolation in easingFunctions
        ? easingFunctions[keyframe1.interpolation]
        : easingFunctions.linear
  const easedT =
    keyframe1.interpolation === "bezier" && keyframe1.easeOut && keyframe2.easeIn
      ? cubicBezier(keyframe1.easeOut[0], keyframe1.easeOut[1], keyframe2.easeIn[0], keyframe2.easeIn[1])(t)
      : easingFn(t)

  // Interpolate based on value type
  return interpolateValues(keyframe1.value, keyframe2.value, easedT)
}

/**
 * Interpolate between two values
 */
function interpolateValues<T extends KeyframeValue>(value1: T, value2: T, t: number): T {
  // Number interpolation
  if (typeof value1 === "number" && typeof value2 === "number") {
    return (value1 + (value2 - value1) * t) as T
  }

  // Array interpolation (vectors)
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) {
      throw new Error("Cannot interpolate arrays of different lengths")
    }

    return value1.map((v, i) => v + (value2[i] - v) * t) as T
  }

  // Boolean interpolation (step)
  if (typeof value1 === "boolean" && typeof value2 === "boolean") {
    return (t < 0.5 ? value1 : value2) as T
  }

  // String interpolation (for colors)
  if (typeof value1 === "string" && typeof value2 === "string") {
    // Check if it's a color
    if (value1.startsWith("#") && value2.startsWith("#")) {
      return interpolateColors(value1, value2, t) as T
    }
    // Otherwise, step interpolation
    return (t < 0.5 ? value1 : value2) as T
  }

  // Default: return first value
  return value1
}

/**
 * Interpolate between two colors
 */
function interpolateColors(color1: string, color2: string, t: number): string {
  // Convert hex to RGB
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) return color1

  // Interpolate RGB values
  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t)
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t)
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t)

  // Convert back to hex
  return rgbToHex(r, g, b)
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
      r: Number.parseInt(result[1], 16),
      g: Number.parseInt(result[2], 16),
      b: Number.parseInt(result[3], 16),
    }
    : null
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/**
 * Get value at time from keyframes
 */
export function getValueAtTime<T extends KeyframeValue>(keyframes: Keyframe<T>[], time: number, defaultValue: T): T {
  if (keyframes.length === 0) return defaultValue

  // Sort keyframes by time
  const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time)

  // Before first keyframe
  if (time <= sortedKeyframes[0].time) {
    return sortedKeyframes[0].value
  }

  // After last keyframe
  if (time >= sortedKeyframes[sortedKeyframes.length - 1].time) {
    return sortedKeyframes[sortedKeyframes.length - 1].value
  }

  // Find surrounding keyframes
  for (let i = 0; i < sortedKeyframes.length - 1; i++) {
    const kf1 = sortedKeyframes[i]
    const kf2 = sortedKeyframes[i + 1]

    if (time >= kf1.time && time <= kf2.time) {
      return interpolateKeyframes(kf1, kf2, time)
    }
  }

  return defaultValue
}

/**
 * Calculate velocity at time
 */
export function getVelocityAtTime<T extends KeyframeValue>(
  keyframes: Keyframe<T>[],
  time: number,
  deltaTime: number = 1 / 60, // 60 fps
): T | null {
  if (keyframes.length < 2) return null

  const value1 = getValueAtTime(keyframes, time - deltaTime / 2, keyframes[0].value)
  const value2 = getValueAtTime(keyframes, time + deltaTime / 2, keyframes[0].value)

  // Calculate velocity based on value type
  if (typeof value1 === "number" && typeof value2 === "number") {
    return ((value2 - value1) / deltaTime) as T
  }

  if (Array.isArray(value1) && Array.isArray(value2)) {
    return value1.map((v, i) => (value2[i] - v) / deltaTime) as T
  }

  return null
}

/**
 * Snap time to nearest frame
 */
export function snapToFrame(time: number, fps: number): number {
  const frameDuration = 1 / fps
  return Math.round(time / frameDuration) * frameDuration
}

/**
 * Generate smooth keyframes for a transition
 */
export function generateSmoothTransition<T extends KeyframeValue>(
  startValue: T,
  endValue: T,
  startTime: number,
  duration: number,
  interpolation: InterpolationType = "ease-in-out",
): Keyframe<T>[] {
  return [
    {
      id: `kf-${Date.now()}-1`,
      time: startTime,
      value: startValue,
      interpolation,
      easeOut: interpolation === "bezier" ? [0.33, 0] : undefined,
    },
    {
      id: `kf-${Date.now()}-2`,
      time: startTime + duration,
      value: endValue,
      interpolation: "linear",
      easeIn: interpolation === "bezier" ? [0.67, 1] : undefined,
    },
  ]
}
