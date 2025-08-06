/**
 * Types for GLSL Shader System
 */

/**
 * Shader types
 */
export type ShaderType = "fragment" | "vertex"

/**
 * Uniform data types
 */
export type UniformType =
  | "float"
  | "int"
  | "bool"
  | "vec2"
  | "vec3"
  | "vec4"
  | "mat2"
  | "mat3"
  | "mat4"
  | "sampler2D"
  | "samplerCube"

/**
 * Shader uniform definition
 */
export interface ShaderUniform {
  name: string
  type: UniformType
  value: any
  defaultValue?: any
  min?: number
  max?: number
  step?: number
  description?: string
  group?: string
  animatable?: boolean
}

/**
 * Shader attribute definition
 */
export interface ShaderAttribute {
  name: string
  type: "float" | "vec2" | "vec3" | "vec4"
  location: number
}

/**
 * Shader varying definition
 */
export interface ShaderVarying {
  name: string
  type: "float" | "vec2" | "vec3" | "vec4"
  precision?: "lowp" | "mediump" | "highp"
}

/**
 * Shader compilation result
 */
export interface ShaderCompilationResult {
  success: boolean
  errors: ShaderError[]
  warnings: ShaderWarning[]
  uniforms?: ShaderUniform[]
  attributes?: ShaderAttribute[]
  varyings?: ShaderVarying[]
}

/**
 * Shader error
 */
export interface ShaderError {
  line: number
  column?: number
  message: string
  type: "syntax" | "semantic" | "linking"
}

/**
 * Shader warning
 */
export interface ShaderWarning {
  line: number
  column?: number
  message: string
  type: "performance" | "compatibility" | "unused"
}

/**
 * Shader preset
 */
export interface ShaderPreset {
  id: string
  name: string
  description: string
  category: string
  vertexShader: string
  fragmentShader: string
  uniforms: ShaderUniform[]
  thumbnail?: string
  tags?: string[]
}

/**
 * Shader project
 */
export interface ShaderProject {
  id: string
  name: string
  description?: string
  vertexShader: string
  fragmentShader: string
  uniforms: ShaderUniform[]
  createdAt: Date
  updatedAt: Date
  version: string
  metadata?: {
    author?: string
    license?: string
    tags?: string[]
  }
  // Runtime properties
  isDirty?: boolean
  compilationResult?: ShaderCompilationResult
}

/**
 * Shader editor state
 */
export interface ShaderEditorState {
  activeProject?: ShaderProject
  activeShaderType: ShaderType
  compilationResult?: ShaderCompilationResult
  isCompiling: boolean
  isDirty: boolean
  previewState: {
    isPlaying: boolean
    time: number
    resolution: { width: number; height: number }
    mousePosition: { x: number; y: number }
  }
}

/**
 * GLSL built-in functions categories
 */
export interface GLSLFunction {
  name: string
  signature: string
  description: string
  category: string
  example?: string
}

/**
 * GLSL language features
 */
export interface GLSLLanguageFeatures {
  version: "100" | "300 es" | "330" | "400" | "410" | "420" | "430" | "440" | "450"
  extensions: string[]
  precision: {
    float: "lowp" | "mediump" | "highp"
    int: "lowp" | "mediump" | "highp"
  }
}

/**
 * Shader performance metrics
 */
export interface ShaderPerformanceMetrics {
  compileTime: number
  drawCalls: number
  fragmentsProcessed: number
  averageFrameTime: number
  gpuTime?: number
  textureMemory?: number
}

/**
 * Shader export options
 */
export interface ShaderExportOptions {
  format: "effect" | "standalone" | "node"
  includePresets: boolean
  minify: boolean
  embedTextures: boolean
  targetVersion?: string
}

/**
 * Code completion item
 */
export interface CodeCompletionItem {
  label: string
  kind: "function" | "variable" | "keyword" | "snippet" | "type"
  detail?: string
  documentation?: string
  insertText: string
  sortText?: string
}

/**
 * Code diagnostic
 */
export interface CodeDiagnostic {
  range: {
    start: { line: number; character: number }
    end: { line: number; character: number }
  }
  severity: "error" | "warning" | "info" | "hint"
  message: string
  code?: string
  source?: string
  relatedInformation?: Array<{
    location: { uri: string; range: any }
    message: string
  }>
}
