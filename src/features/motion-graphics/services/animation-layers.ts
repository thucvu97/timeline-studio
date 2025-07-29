/**
 * Animation Layers Service
 * Manages animation layer hierarchy and blending
 */

import { nanoid } from "nanoid"

import { expressionEvaluator } from "./expression-engine"
import { getValueAtTime } from "./interpolation"

import type { AnimatedProperty, AnimationLayer, AnimationState, AnimationTrack, KeyframeValue } from "../types/keyframe"

/**
 * Create a new animation layer
 */
export function createAnimationLayer(name: string, properties: AnimatedProperty[] = []): AnimationLayer {
  return {
    id: nanoid(),
    name,
    properties,
    enabled: true,
    solo: false,
    locked: false,
    opacity: 1,
    blendMode: "normal",
  }
}

/**
 * Create a new animation track
 */
export function createAnimationTrack(targetId: string, targetType: AnimationTrack["targetType"]): AnimationTrack {
  return {
    id: nanoid(),
    targetId,
    targetType,
    layers: [],
    enabled: true,
  }
}

/**
 * Add layer to track
 */
export function addLayerToTrack(track: AnimationTrack, layer: AnimationLayer, index?: number): AnimationTrack {
  const layers = [...track.layers]

  if (index !== undefined && index >= 0 && index <= layers.length) {
    layers.splice(index, 0, layer)
  } else {
    layers.push(layer)
  }

  return {
    ...track,
    layers,
  }
}

/**
 * Remove layer from track
 */
export function removeLayerFromTrack(track: AnimationTrack, layerId: string): AnimationTrack {
  return {
    ...track,
    layers: track.layers.filter((layer) => layer.id !== layerId),
  }
}

/**
 * Update layer in track
 */
export function updateLayerInTrack(
  track: AnimationTrack,
  layerId: string,
  updates: Partial<AnimationLayer>,
): AnimationTrack {
  return {
    ...track,
    layers: track.layers.map((layer) => (layer.id === layerId ? { ...layer, ...updates } : layer)),
  }
}

/**
 * Reorder layers in track
 */
export function reorderLayersInTrack(track: AnimationTrack, fromIndex: number, toIndex: number): AnimationTrack {
  const layers = [...track.layers]
  const [removed] = layers.splice(fromIndex, 1)
  layers.splice(toIndex, 0, removed)

  return {
    ...track,
    layers,
  }
}

/**
 * Get solo layers
 */
function getSoloLayers(layers: AnimationLayer[]): AnimationLayer[] {
  const soloLayers = layers.filter((layer) => layer.solo && layer.enabled)
  return soloLayers.length > 0 ? soloLayers : layers.filter((layer) => layer.enabled)
}

/**
 * Evaluate layer at time
 */
export function evaluateLayerAtTime(layer: AnimationLayer, time: number, context: any): Record<string, KeyframeValue> {
  const values: Record<string, KeyframeValue> = {}

  // Apply layer timing
  const layerTime = applyLayerTiming(layer, time)

  layer.properties.forEach((property) => {
    if (!property.enabled) return

    // Get base value from keyframes
    let value = getValueAtTime(property.keyframes, layerTime, getDefaultValue(property.type))

    // Apply expressions
    if (property.expression && property.expressionEnabled) {
      const expressionContext = {
        ...context,
        time: layerTime,
        property,
        layer,
        value,
      }

      value = expressionEvaluator.evaluate(property.expression, expressionContext)
    }

    values[property.path] = value
  })

  return values
}

/**
 * Apply layer timing adjustments
 */
function applyLayerTiming(layer: AnimationLayer, time: number): number {
  let adjustedTime = time

  // Apply offset
  if (layer.offset) {
    adjustedTime -= layer.offset
  }

  // Apply time scale
  if (layer.timeScale && layer.timeScale !== 1) {
    adjustedTime *= layer.timeScale
  }

  // Apply time bounds
  if (layer.startTime !== undefined && adjustedTime < layer.startTime) {
    adjustedTime = layer.startTime
  }

  if (layer.endTime !== undefined && adjustedTime > layer.endTime) {
    adjustedTime = layer.endTime
  }

  return adjustedTime
}

/**
 * Blend layer values
 */
export function blendLayerValues(
  baseValues: Record<string, KeyframeValue>,
  layerValues: Record<string, KeyframeValue>,
  layer: AnimationLayer,
): Record<string, KeyframeValue> {
  const blended: Record<string, KeyframeValue> = { ...baseValues }

  Object.entries(layerValues).forEach(([path, value]) => {
    const baseValue = baseValues[path]

    if (baseValue === undefined) {
      blended[path] = applyOpacity(value, layer.opacity)
    } else {
      blended[path] = blendValues(baseValue, value, layer.blendMode, layer.opacity)
    }
  })

  return blended
}

/**
 * Blend two values based on blend mode
 */
function blendValues(
  base: KeyframeValue,
  overlay: KeyframeValue,
  blendMode: AnimationLayer["blendMode"],
  opacity: number,
): KeyframeValue {
  // Apply opacity
  overlay = applyOpacity(overlay, opacity)

  // Number blending
  if (typeof base === "number" && typeof overlay === "number") {
    switch (blendMode) {
      case "add":
        return base + overlay
      case "multiply":
        return base * overlay
      case "screen":
        return 1 - (1 - base) * (1 - overlay)
      case "overlay":
        return base < 0.5 ? 2 * base * overlay : 1 - 2 * (1 - base) * (1 - overlay)
      default:
        return overlay
    }
  }

  // Array blending (vectors)
  if (Array.isArray(base) && Array.isArray(overlay)) {
    return base.map((v, i) => {
      const ov = overlay[i] || 0
      switch (blendMode) {
        case "add":
          return v + ov
        case "multiply":
          return v * ov
        case "screen":
          return 1 - (1 - v) * (1 - ov)
        case "overlay":
          return v < 0.5 ? 2 * v * ov : 1 - 2 * (1 - v) * (1 - ov)
        default:
          return ov
      }
    }) as KeyframeValue
  }

  // Default: return overlay for other types
  return overlay
}

/**
 * Apply opacity to value
 */
function applyOpacity(value: KeyframeValue, opacity: number): KeyframeValue {
  if (opacity === 1) return value

  if (typeof value === "number") {
    return value * opacity
  }

  if (Array.isArray(value)) {
    return value.map((v) => v * opacity) as KeyframeValue
  }

  return value
}

/**
 * Get default value for property type
 */
function getDefaultValue(type: AnimatedProperty["type"]): KeyframeValue {
  switch (type) {
    case "number":
      return 0
    case "vec2":
      return [0, 0]
    case "vec3":
      return [0, 0, 0]
    case "vec4":
      return [0, 0, 0, 0]
    case "color":
      return "#000000"
    case "boolean":
      return false
    case "text":
      return ""
    default:
      return 0
  }
}

/**
 * Evaluate animation track at time
 */
export function evaluateTrackAtTime(track: AnimationTrack, time: number, context: any): Record<string, KeyframeValue> {
  if (!track.enabled) return {}

  const activeLayers = getSoloLayers(track.layers)
  let values: Record<string, KeyframeValue> = {}

  // Evaluate each layer and blend
  activeLayers.forEach((layer) => {
    if (!layer.enabled || layer.locked) return

    const layerValues = evaluateLayerAtTime(layer, time, context)
    values = blendLayerValues(values, layerValues, layer)
  })

  return values
}

/**
 * Create parent-child relationships
 */
export function setLayerParent(
  layers: AnimationLayer[],
  childId: string,
  parentId: string | undefined,
): AnimationLayer[] {
  return layers.map((layer) => {
    if (layer.id === childId) {
      return { ...layer, parentId }
    }

    if (layer.id === parentId && parentId) {
      const childIds = layer.childIds || []
      if (!childIds.includes(childId)) {
        return {
          ...layer,
          childIds: [...childIds, childId],
        }
      }
    }

    // Remove from old parent
    if (layer.childIds?.includes(childId)) {
      return {
        ...layer,
        childIds: layer.childIds.filter((id) => id !== childId),
      }
    }

    return layer
  })
}

/**
 * Get layer hierarchy
 */
export function getLayerHierarchy(layers: AnimationLayer[]): AnimationLayer[] {
  const layerMap = new Map(layers.map((l) => [l.id, l]))
  const rootLayers: AnimationLayer[] = []

  layers.forEach((layer) => {
    if (!layer.parentId) {
      rootLayers.push(layer)
    }
  })

  return rootLayers
}

/**
 * Duplicate layer with all properties
 */
export function duplicateLayer(layer: AnimationLayer): AnimationLayer {
  return {
    ...layer,
    id: nanoid(),
    name: `${layer.name} Copy`,
    properties: layer.properties.map((prop) => ({
      ...prop,
      id: nanoid(),
      keyframes: prop.keyframes.map((kf) => ({
        ...kf,
        id: nanoid(),
      })),
    })),
    parentId: undefined,
    childIds: [],
  }
}

/**
 * Merge layers
 */
export function mergeLayers(layers: AnimationLayer[]): AnimationLayer {
  const mergedProperties: AnimatedProperty[] = []
  const propertyMap = new Map<string, AnimatedProperty>()

  // Merge properties by path
  layers.forEach((layer) => {
    layer.properties.forEach((prop) => {
      const existing = propertyMap.get(prop.path)
      if (existing) {
        // Merge keyframes
        existing.keyframes = [...existing.keyframes, ...prop.keyframes].sort((a, b) => a.time - b.time)
      } else {
        propertyMap.set(prop.path, { ...prop, id: nanoid() })
      }
    })
  })

  return createAnimationLayer("Merged Layer", Array.from(propertyMap.values()))
}

/**
 * Create animation state
 */
export function createAnimationState(): AnimationState {
  return {
    tracks: [],
    currentTime: 0,
    playing: false,
    loop: false,
    selectedKeyframes: [],
    selectedProperties: [],
    selectedLayers: [],
    timelineZoom: 1,
    timelineScroll: 0,
    showCurves: true,
    snapToFrames: true,
    previewQuality: "full",
    realtimePlayback: true,
  }
}

/**
 * Export layer as JSON
 */
export function exportLayer(layer: AnimationLayer): string {
  return JSON.stringify(layer, null, 2)
}

/**
 * Import layer from JSON
 */
export function importLayer(json: string): AnimationLayer | null {
  try {
    const data = JSON.parse(json)

    // Validate structure
    if (!data.name || !Array.isArray(data.properties)) {
      return null
    }

    // Create new IDs
    return {
      ...data,
      id: nanoid(),
      properties: data.properties.map((prop: any) => ({
        ...prop,
        id: nanoid(),
        keyframes: prop.keyframes.map((kf: any) => ({
          ...kf,
          id: nanoid(),
        })),
      })),
    }
  } catch {
    return null
  }
}
