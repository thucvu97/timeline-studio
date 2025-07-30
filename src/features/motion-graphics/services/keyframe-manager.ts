/**
 * Keyframe Manager Service
 * Handles CRUD operations for keyframes
 */

import { nanoid } from "nanoid"

import type { AnimatedProperty, AnimationCurve, InterpolationType, Keyframe, KeyframeValue } from "../types/keyframe"

/**
 * Create a new keyframe
 */
export function createKeyframe<T extends KeyframeValue>(
  time: number,
  value: T,
  interpolation: InterpolationType = "linear",
): Keyframe<T> {
  return {
    id: nanoid(),
    time,
    value,
    interpolation,
    locked: false,
    selected: false,
  }
}

/**
 * Add keyframe to property
 */
export function addKeyframeToProperty<T extends KeyframeValue>(
  property: AnimatedProperty,
  keyframe: Keyframe<T>,
): AnimatedProperty {
  // Check if keyframe already exists at this time
  const existingIndex = property.keyframes.findIndex((kf) => Math.abs(kf.time - keyframe.time) < 0.001)

  if (existingIndex >= 0) {
    // Replace existing keyframe
    const updatedKeyframes = [...property.keyframes]
    updatedKeyframes[existingIndex] = keyframe as Keyframe

    return {
      ...property,
      keyframes: updatedKeyframes,
    }
  }

  // Add new keyframe and sort by time
  const updatedKeyframes = [...property.keyframes, keyframe as Keyframe].sort((a, b) => a.time - b.time)

  return {
    ...property,
    keyframes: updatedKeyframes,
  }
}

/**
 * Remove keyframe from property
 */
export function removeKeyframeFromProperty(property: AnimatedProperty, keyframeId: string): AnimatedProperty {
  return {
    ...property,
    keyframes: property.keyframes.filter((kf) => kf.id !== keyframeId),
  }
}

/**
 * Update keyframe in property
 */
export function updateKeyframeInProperty<T extends KeyframeValue>(
  property: AnimatedProperty,
  keyframeId: string,
  updates: Partial<Keyframe<T>>,
): AnimatedProperty {
  const updatedKeyframes = property.keyframes.map((kf) => {
    if (kf.id === keyframeId) {
      return { ...kf, ...updates }
    }
    return kf
  })

  // Re-sort if time was updated
  if (updates.time !== undefined) {
    updatedKeyframes.sort((a, b) => a.time - b.time)
  }

  return {
    ...property,
    keyframes: updatedKeyframes,
  }
}

/**
 * Select keyframes
 */
export function selectKeyframes(
  property: AnimatedProperty,
  keyframeIds: string[],
  exclusive = false,
): AnimatedProperty {
  const updatedKeyframes = property.keyframes.map((kf) => ({
    ...kf,
    selected: exclusive ? keyframeIds.includes(kf.id) : kf.selected || keyframeIds.includes(kf.id),
  }))

  return {
    ...property,
    keyframes: updatedKeyframes,
  }
}

/**
 * Deselect all keyframes
 */
export function deselectAllKeyframes(property: AnimatedProperty): AnimatedProperty {
  const updatedKeyframes = property.keyframes.map((kf) => ({
    ...kf,
    selected: false,
  }))

  return {
    ...property,
    keyframes: updatedKeyframes,
  }
}

/**
 * Move keyframes by time offset
 */
export function moveKeyframes(property: AnimatedProperty, keyframeIds: string[], timeOffset: number): AnimatedProperty {
  const updatedKeyframes = property.keyframes
    .map((kf) => {
      if (keyframeIds.includes(kf.id)) {
        return {
          ...kf,
          time: Math.max(0, kf.time + timeOffset),
        }
      }
      return kf
    })
    .sort((a, b) => a.time - b.time)

  return {
    ...property,
    keyframes: updatedKeyframes,
  }
}

/**
 * Scale keyframes time
 */
export function scaleKeyframesTime(
  property: AnimatedProperty,
  keyframeIds: string[],
  scaleFactor: number,
  anchorTime = 0,
): AnimatedProperty {
  const updatedKeyframes = property.keyframes
    .map((kf) => {
      if (keyframeIds.includes(kf.id)) {
        const offset = kf.time - anchorTime
        return {
          ...kf,
          time: anchorTime + offset * scaleFactor,
        }
      }
      return kf
    })
    .sort((a, b) => a.time - b.time)

  return {
    ...property,
    keyframes: updatedKeyframes,
  }
}

/**
 * Copy keyframes
 */
export function copyKeyframes(keyframes: Keyframe[], timeOffset = 0): Keyframe[] {
  return keyframes.map((kf) => ({
    ...kf,
    id: nanoid(),
    time: kf.time + timeOffset,
    selected: false,
  }))
}

/**
 * Delete selected keyframes
 */
export function deleteSelectedKeyframes(property: AnimatedProperty): AnimatedProperty {
  return {
    ...property,
    keyframes: property.keyframes.filter((kf) => !kf.selected),
  }
}

/**
 * Reverse keyframes
 */
export function reverseKeyframes(property: AnimatedProperty, startTime?: number, endTime?: number): AnimatedProperty {
  const keyframes = [...property.keyframes]
  const minTime = startTime ?? Math.min(...keyframes.map((kf) => kf.time))
  const maxTime = endTime ?? Math.max(...keyframes.map((kf) => kf.time))

  const reversedKeyframes = keyframes
    .map((kf) => ({
      ...kf,
      time: maxTime - (kf.time - minTime),
    }))
    .sort((a, b) => a.time - b.time)

  return {
    ...property,
    keyframes: reversedKeyframes,
  }
}

/**
 * Create animation curve from property
 */
export function createAnimationCurve(property: AnimatedProperty): AnimationCurve {
  return {
    propertyId: property.id,
    keyframes: property.keyframes,
    preInfinity: "constant",
    postInfinity: "constant",
    visible: true,
    color: "#3b82f6",
    selected: false,
  }
}

/**
 * Auto-generate keyframes for a transition
 */
export function autoKeyframe<T extends KeyframeValue>(
  startValue: T,
  endValue: T,
  startTime: number,
  duration: number,
  interpolation: InterpolationType = "ease-in-out",
  steps = 2,
): Keyframe<T>[] {
  if (steps <= 2) {
    // Simple two-keyframe animation
    return [
      createKeyframe(startTime, startValue, interpolation),
      createKeyframe(startTime + duration, endValue, "linear"),
    ]
  }

  // Multi-step animation
  const keyframes: Keyframe<T>[] = []

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    const time = startTime + duration * t

    // Linear interpolation for intermediate values
    let value: T

    if (typeof startValue === "number" && typeof endValue === "number") {
      value = (startValue + (endValue - startValue) * t) as T
    } else if (Array.isArray(startValue) && Array.isArray(endValue)) {
      value = startValue.map((v, idx) => v + (endValue[idx] - v) * t) as T
    } else {
      value = t < 0.5 ? startValue : endValue
    }

    keyframes.push(createKeyframe(time, value, i === 0 ? interpolation : "linear"))
  }

  return keyframes
}

/**
 * Offset keyframes to start at specific time
 */
export function offsetKeyframesToTime(keyframes: Keyframe[], targetStartTime: number): Keyframe[] {
  if (keyframes.length === 0) return keyframes

  const currentStartTime = Math.min(...keyframes.map((kf) => kf.time))
  const offset = targetStartTime - currentStartTime

  return keyframes.map((kf) => ({
    ...kf,
    time: kf.time + offset,
  }))
}

/**
 * Scale keyframes to fit duration
 */
export function scaleKeyframesToDuration(keyframes: Keyframe[], targetDuration: number, startTime = 0): Keyframe[] {
  if (keyframes.length < 2) return keyframes

  const minTime = Math.min(...keyframes.map((kf) => kf.time))
  const maxTime = Math.max(...keyframes.map((kf) => kf.time))
  const currentDuration = maxTime - minTime

  if (currentDuration === 0) return keyframes

  const scale = targetDuration / currentDuration

  return keyframes.map((kf) => ({
    ...kf,
    time: startTime + (kf.time - minTime) * scale,
  }))
}

/**
 * Find keyframe at time (with tolerance)
 */
export function findKeyframeAtTime(keyframes: Keyframe[], time: number, tolerance = 0.001): Keyframe | null {
  return keyframes.find((kf) => Math.abs(kf.time - time) < tolerance) || null
}

/**
 * Get keyframes in time range
 */
export function getKeyframesInRange(keyframes: Keyframe[], startTime: number, endTime: number): Keyframe[] {
  return keyframes.filter((kf) => kf.time >= startTime && kf.time <= endTime)
}

/**
 * Snap keyframe time to grid
 */
export function snapKeyframeToGrid(time: number, gridSize: number, fps = 30): number {
  const frameTime = 1 / fps
  const snapInterval = gridSize * frameTime
  return Math.round(time / snapInterval) * snapInterval
}

/**
 * Create easing keyframes
 */
export function createEasingKeyframes<T extends KeyframeValue>(
  startValue: T,
  endValue: T,
  startTime: number,
  duration: number,
  easingType: InterpolationType,
  overshoot = 1.0,
): Keyframe<T>[] {
  const keyframes: Keyframe<T>[] = []

  // Start keyframe
  keyframes.push(createKeyframe(startTime, startValue, easingType))

  // Add intermediate keyframes for complex easings
  if (easingType === "bounce" || easingType === "elastic") {
    const steps = easingType === "bounce" ? 4 : 8

    for (let i = 1; i < steps; i++) {
      const t = i / steps
      const time = startTime + duration * t

      // Calculate intermediate value based on easing
      let value: T
      if (typeof startValue === "number" && typeof endValue === "number") {
        const progress = calculateEasingProgress(t, easingType, overshoot)
        value = (startValue + (endValue - startValue) * progress) as T
      } else {
        value = t < 0.5 ? startValue : endValue
      }

      keyframes.push(createKeyframe(time, value, "linear"))
    }
  }

  // End keyframe
  keyframes.push(createKeyframe(startTime + duration, endValue, "linear"))

  return keyframes
}

/**
 * Calculate easing progress
 */
function calculateEasingProgress(t: number, easingType: InterpolationType, overshoot = 1.0): number {
  switch (easingType) {
    case "bounce":
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

    case "elastic": {
      if (t === 0 || t === 1) return t
      const p = 0.3 * overshoot
      const s = p / 4
      return 2 ** (-10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1
    }

    case "back": {
      const s = 1.70158 * overshoot
      return t * t * ((s + 1) * t - s)
    }

    default:
      return t
  }
}

/**
 * Merge overlapping keyframes
 */
export function mergeOverlappingKeyframes(keyframes: Keyframe[], tolerance = 0.001): Keyframe[] {
  if (keyframes.length < 2) return keyframes

  const sorted = [...keyframes].sort((a, b) => a.time - b.time)
  const merged: Keyframe[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const previous = merged[merged.length - 1]

    if (Math.abs(current.time - previous.time) > tolerance) {
      merged.push(current)
    }
  }

  return merged
}

/**
 * Validate property keyframes
 */
export function validatePropertyKeyframes(property: AnimatedProperty): string[] {
  const errors: string[] = []

  // Check for duplicate times
  const times = property.keyframes.map((kf) => kf.time)
  const uniqueTimes = new Set(times)
  if (times.length !== uniqueTimes.size) {
    errors.push("Property contains keyframes with duplicate times")
  }

  // Check keyframe order
  for (let i = 1; i < property.keyframes.length; i++) {
    if (property.keyframes[i].time < property.keyframes[i - 1].time) {
      errors.push("Keyframes are not properly sorted by time")
      break
    }
  }

  // Check value types consistency
  if (property.keyframes.length > 0) {
    const firstType = typeof property.keyframes[0].value
    const inconsistent = property.keyframes.some((kf) => typeof kf.value !== firstType)
    if (inconsistent) {
      errors.push("Keyframe values have inconsistent types")
    }
  }

  return errors
}
