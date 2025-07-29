/**
 * Types for Node-based Compositing System
 */

/**
 * Node port data types
 */
export type NodePortDataType =
  | "video" // Video stream
  | "audio" // Audio stream
  | "image" // Single image/frame
  | "number" // Numeric value
  | "color" // Color value
  | "vector2" // 2D vector
  | "vector3" // 3D vector
  | "boolean" // Boolean value
  | "text" // Text/string value
  | "mask" // Alpha mask
  | "data" // Generic data

/**
 * Node port definition
 */
export interface NodePort {
  id: string
  name: string
  type: NodePortDataType
  direction: "input" | "output"
  required?: boolean
  defaultValue?: any
  multiple?: boolean // Can accept multiple connections
  validation?: (value: any) => boolean
}

/**
 * Node connection between ports
 */
export interface NodeConnection {
  id: string
  sourceNodeId: string
  sourcePortId: string
  targetNodeId: string
  targetPortId: string
  active: boolean
}

/**
 * Base node interface
 */
export interface CompositeNode {
  id: string
  type: string
  name: string
  category: NodeCategory
  position: { x: number; y: number }
  size?: { width: number; height: number }
  inputs: NodePort[]
  outputs: NodePort[]
  parameters: NodeParameter[]
  preview?: boolean
  cached?: boolean
  error?: string
  processing?: boolean
}

/**
 * Node categories
 */
export type NodeCategory =
  | "source" // Video, Image, Color sources
  | "filter" // Effects and filters
  | "transform" // Geometric transformations
  | "composite" // Blend and merge operations
  | "color" // Color corrections
  | "time" // Time-based effects
  | "mask" // Mask operations
  | "utility" // Math, logic, utilities
  | "output" // Final output nodes

/**
 * Node parameter types
 */
export interface NodeParameter {
  id: string
  name: string
  type: "number" | "color" | "select" | "boolean" | "text" | "range"
  value: any
  min?: number
  max?: number
  step?: number
  options?: Array<{ value: string; label: string }>
  visible?: boolean
  animatable?: boolean
}

/**
 * Node graph state
 */
export interface NodeGraph {
  id: string
  name: string
  nodes: Record<string, CompositeNode>
  connections: NodeConnection[]
  selectedNodeIds: string[]
  viewport: {
    x: number
    y: number
    zoom: number
  }
}

/**
 * Node execution context
 */
export interface NodeExecutionContext {
  graph: NodeGraph
  cache: Map<string, any>
  frameNumber: number
  time: number
  resolution: { width: number; height: number }
  frameRate: number
}

/**
 * Node processor interface
 */
export interface NodeProcessor {
  type: string
  category: NodeCategory
  process: (
    node: CompositeNode,
    inputs: Record<string, any>,
    context: NodeExecutionContext,
  ) => Promise<Record<string, any>>
  validate?: (node: CompositeNode) => string | null
  getDefaultInputs?: () => NodePort[]
  getDefaultOutputs?: () => NodePort[]
  getDefaultParameters?: () => NodeParameter[]
}

/**
 * Node library item
 */
export interface NodeLibraryItem {
  type: string
  name: string
  description: string
  category: NodeCategory
  icon?: string
  tags?: string[]
  processor: NodeProcessor
}

/**
 * Node graph validation result
 */
export interface NodeGraphValidation {
  valid: boolean
  errors: Array<{
    nodeId?: string
    connectionId?: string
    message: string
    severity: "error" | "warning"
  }>
  warnings: string[]
}

/**
 * Node render result
 */
export interface NodeRenderResult {
  data: any
  metadata?: {
    renderTime: number
    cacheHit: boolean
    memoryUsage?: number
  }
}

/**
 * Preset for node graph
 */
export interface NodeGraphPreset {
  id: string
  name: string
  description: string
  category: string
  thumbnail?: string
  graph: Partial<NodeGraph>
  tags?: string[]
}
