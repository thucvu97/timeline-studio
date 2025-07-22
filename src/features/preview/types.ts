/**
 * Types for Real-time Preview System
 */

// Расширенный список типов эффектов для поддержки всех категорий
export type EffectType =
  | "color_correction"
  | "color_grading"
  | "blur"
  | "sharpen"
  | "vignette"
  | "grain"
  | "transform"
  | "chroma_key"
  | "chromatic_aberration"
  | "lens_distortion"
  | "lut"
  | "glow"
  | "shadow"
  | "glitch"
  | "film_emulation"
  | "cartoon"
  | "motion_blur"
  | "depth_of_field"

export interface Effect {
  id: string
  type: EffectType
  enabled: boolean
  parameters: Record<string, any>
  intensity: number // 0-1
  // Новые поля для интеграции с унифицированной системой
  category?: string
  scope?: "clip" | "track" | "global"
  blendMode?: string
}

export interface ColorCorrectionParams {
  brightness: number // -1 to 1
  contrast: number // 0 to 2
  saturation: number // 0 to 2
  hue: number // -180 to 180
  temperature: number // -1 to 1
  tint: number // -1 to 1
}

export interface BlurParams {
  radius: number // 0 to 50
  type: "gaussian" | "box" | "motion"
  direction?: number // для motion blur
}

export interface TransformParams {
  scaleX: number
  scaleY: number
  rotation: number // в градусах
  translateX: number
  translateY: number
  skewX: number
  skewY: number
}

export interface ChromaKeyParams {
  keyColor: [number, number, number] // RGB
  threshold: number // 0-1
  smoothness: number // 0-1
  spill: number // 0-1
}

export interface ColorGradingParams {
  lift: { r: number; g: number; b: number; luminance: number }
  gamma: { r: number; g: number; b: number; luminance: number }
  gain: { r: number; g: number; b: number; luminance: number }
  offset: { r: number; g: number; b: number }
}

export interface GlowParams {
  intensity: number // 0-1
  radius: number // 0-100
  threshold: number // 0-1
  color?: [number, number, number] // RGB tint
}

export interface FilmEmulationParams {
  type: "kodak" | "fuji" | "polaroid" | "blackwhite"
  grain: number // 0-1
  vignette: number // 0-1
  colorShift: number // 0-1
}

export interface GlitchParams {
  type: "digital" | "analog" | "chromatic"
  intensity: number // 0-1
  frequency: number // 0-1
  blockSize: number // 1-100
}

export interface PreviewQuality {
  resolution: number // 0.25, 0.5, 1.0
  effects: "all" | "basic" | "none"
  fps: number // 15, 24, 30
  antialiasing: boolean
}

export interface PreviewFrame {
  timestamp: number
  bitmap: ImageBitmap
  effects: Effect[]
  cached: boolean
}

export type GPUTier = "high" | "medium" | "low"

export interface PreviewConfig {
  canvas: HTMLCanvasElement
  quality: PreviewQuality
  cacheSize: number // в мегабайтах
  gpuTier: GPUTier
}

export interface ShaderProgram {
  vertex: WebGLShader
  fragment: WebGLShader
  program: WebGLProgram
  uniforms: Map<string, WebGLUniformLocation>
  attributes: Map<string, number>
}

export interface TextureInfo {
  texture: WebGLTexture
  width: number
  height: number
  format: number
}

export interface RenderPass {
  input: TextureInfo
  output: TextureInfo | null // null = render to canvas
  shader: ShaderProgram
  uniforms: Record<string, any>
}
