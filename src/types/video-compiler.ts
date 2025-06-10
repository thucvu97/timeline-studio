/**
 * TypeScript типы для интеграции с Video Compiler (Rust backend)
 */

// ============ Основные типы проекта ============

export interface ProjectSchema {
  version: string
  metadata: ProjectMetadata
  timeline: Timeline
  tracks: Track[]
  effects: Effect[]
  transitions: Transition[]
  settings: ProjectSettings
}

export interface ProjectMetadata {
  name: string
  description?: string
  created_at: string // ISO 8601
  modified_at: string // ISO 8601
  author?: string
}

export interface Timeline {
  duration: number // Общая продолжительность в секундах
  fps: number // Кадры в секунду (например, 30)
  resolution: [number, number] // [ширина, высота]
  sample_rate: number // Частота дискретизации аудио (например, 48000)
  aspect_ratio: AspectRatio
}

export enum AspectRatio {
  Ratio16x9 = "Ratio16x9",
  Ratio4x3 = "Ratio4x3",
  Ratio1x1 = "Ratio1x1",
  Ratio9x16 = "Ratio9x16",
  Custom = "Custom",
}

// ============ Треки и клипы ============

export interface Track {
  id: string
  track_type: TrackType
  name: string
  enabled: boolean
  locked: boolean
  volume: number // 0.0 - 1.0
  clips: Clip[]
  effects: string[] // ID эффектов
}

export enum TrackType {
  Video = "Video",
  Audio = "Audio",
  Subtitle = "Subtitle",
}

export interface Clip {
  id: string
  source_path: string // Путь к медиа файлу
  start_time: number // Время начала на timeline
  end_time: number // Время окончания на timeline
  source_start: number // Начало в исходном файле
  source_end: number // Конец в исходном файле
  speed: number // Скорость воспроизведения (1.0 = нормальная)
  volume: number // Громкость клипа (0.0 - 1.0)
  effects: string[] // ID эффектов клипа
}

// ============ Эффекты ============

export interface Effect {
  id: string
  effect_type: EffectType
  name: string
  enabled: boolean
  parameters: Record<string, EffectParameter>
  ffmpeg_command?: string // Опциональная кастомная команда
}

export type EffectType =
  | "Blur"
  | "Brightness"
  | "Contrast"
  | "Speed"
  | "Reverse"
  | "Grayscale"
  | "Sepia"
  | "Saturation"
  | "HueRotate"
  | "Vintage"
  | "Duotone"
  | "Noir"
  | "Cyberpunk"
  | "Dreamy"
  | "Infrared"
  | "Matrix"
  | "Arctic"
  | "Sunset"
  | "Lomo"
  | "Twilight"
  | "Neon"
  | "Invert"
  | "Vignette"
  | "FilmGrain"
  | "ChromaticAberration"
  | "LensFlare"
  | "Glow"
  | "Sharpen"
  | "NoiseReduction"
  | "Stabilization"

export type EffectParameter =
  | { type: "Float"; value: number }
  | { type: "Int"; value: number }
  | { type: "String"; value: string }
  | { type: "Bool"; value: boolean }
  | { type: "Color"; value: number } // RGBA как u32
  | { type: "FloatArray"; value: number[] }
  | { type: "FilePath"; value: string }

// ============ Переходы ============

export interface Transition {
  id: string
  transition_type: string // Гибкий строковый тип
  name: string
  labels?: Record<string, string> // Локализованные названия
  description?: Record<string, string> // Локализованные описания
  category?: TransitionCategory
  complexity?: TransitionComplexity
  tags: TransitionTag[]
  duration: TransitionDuration
  start_time: number // Время начала перехода на timeline
  from_clip_id: string // ID клипа "от"
  to_clip_id: string // ID клипа "к"
  parameters: Record<string, EffectParameter>
  ffmpeg_command?: string // FFmpeg команда (в виде шаблона)
  preview_path?: string // Путь к превью
}

export interface TransitionDuration {
  min: number // Минимальная длительность в секундах
  max: number // Максимальная длительность в секундах
  default: number // Длительность по умолчанию
  current: number // Текущая длительность
}

export enum TransitionCategory {
  Basic = "Basic",
  Advanced = "Advanced",
  Creative = "Creative",
  ThreeD = "ThreeD",
  Artistic = "Artistic",
  Cinematic = "Cinematic",
}

export enum TransitionComplexity {
  Basic = "Basic",
  Intermediate = "Intermediate",
  Advanced = "Advanced",
}

export type TransitionTag =
  | "Zoom"
  | "Scale"
  | "Smooth"
  | "Fade"
  | "Opacity"
  | "Classic"
  | "Slide"
  | "Movement"
  | "Direction"
  | "Size"
  | "Transform"
  | "Rotate"
  | "Spin"
  | "Flip"
  | "Mirror"
  | "Push"
  | "Displacement"
  | "Squeeze"
  | "Compress"
  | "Elastic"
  | "Diagonal"
  | "Angle"
  | "Spiral"
  | "Rotation"
  | "ThreeD"
  | "Complex"
  | "Fallback"

// ============ Настройки проекта ============

export interface ProjectSettings {
  export: ExportSettings
  preview: PreviewSettings
  custom: Record<string, any>
}

export interface ExportSettings {
  format: OutputFormat
  quality: number // 1-100
  video_bitrate: number // kbps
  audio_bitrate: number // kbps
  hardware_acceleration: boolean
  ffmpeg_args: string[] // Дополнительные параметры FFmpeg
}

export enum OutputFormat {
  Mp4 = "Mp4",
  Avi = "Avi",
  Mov = "Mov",
  Mkv = "Mkv",
  WebM = "WebM",
  Gif = "Gif",
}

export interface PreviewSettings {
  resolution: [number, number]
  fps: number
  quality: number
}

// ============ Прогресс рендеринга ============

export interface RenderProgress {
  job_id: string
  stage: string
  percentage: number // 0.0 - 100.0
  current_frame: number
  total_frames: number
  elapsed_time: number // миллисекунды
  estimated_remaining?: number // миллисекунды
  status: RenderStatus
  message?: string
}

export enum RenderStatus {
  Queued = "Queued",
  Processing = "Processing",
  Completed = "Completed",
  Failed = "Failed",
  Cancelled = "Cancelled",
}

export interface RenderJob {
  id: string
  project_name: string
  output_path: string
  status: RenderStatus
  created_at: string // ISO 8601
  progress: RenderProgress
}

// ============ GPU ускорение ============

export enum GpuEncoder {
  None = "None",
  Nvenc = "Nvenc",
  QuickSync = "QuickSync", 
  Vaapi = "Vaapi",
  VideoToolbox = "VideoToolbox",
  AMF = "AMF",
}

export interface GpuInfo {
  name: string
  driver_version?: string
  memory_total?: number
  memory_used?: number
  utilization?: number
  encoder_type: GpuEncoder
  supported_codecs: string[]
}

export interface GpuCapabilities {
  available_encoders: GpuEncoder[]
  recommended_encoder?: GpuEncoder
  current_gpu?: GpuInfo
  hardware_acceleration_supported: boolean
}

export interface CompilerSettings {
  hardware_acceleration: boolean
  max_concurrent_jobs: number
  temp_directory: string
  cache_size_mb: number
}

export interface SystemInfo {
  os: string
  arch: string
  ffmpeg_path: string
  temp_directory: string
  gpu_capabilities?: GpuCapabilities
  available_memory?: number
  cpu_cores: number
}

export interface FfmpegCapabilities {
  version: string
  available_codecs: string[]
  hardware_encoders: string[]
  path: string
}

// ============ Tauri команды ============

export interface TauriCommands {
  // Компиляция видео
  compile_video(project: ProjectSchema, output_path: string): Promise<string> // Возвращает job_id

  // Управление рендерингом
  get_render_progress(job_id: string): Promise<RenderProgress | null>
  cancel_render(job_id: string): Promise<boolean>
  get_active_jobs(): Promise<RenderJob[]>

  // Генерация превью
  generate_preview(project: ProjectSchema, timestamp: number, quality?: number): Promise<Uint8Array> // JPEG данные
  
  // GPU команды
  get_gpu_capabilities(): Promise<GpuCapabilities>
  get_current_gpu_info(): Promise<GpuInfo | null>
  check_hardware_acceleration(): Promise<boolean>
  
  // Кэширование
  get_cache_stats(): Promise<CacheStats>
  clear_cache(): Promise<void>
  clear_preview_cache(): Promise<void>
  
  // Настройки
  get_compiler_settings(): Promise<CompilerSettings>
  update_compiler_settings(settings: CompilerSettings): Promise<void>
  set_ffmpeg_path(path: string): Promise<boolean>
  
  // Диагностика
  get_system_info(): Promise<SystemInfo>
  check_ffmpeg_capabilities(): Promise<FfmpegCapabilities>
}

// ============ Кэширование ============

export interface CacheStats {
  total_size_bytes: number
  total_files: number
  preview_cache_size: number
  preview_cache_files: number
  temp_files_size: number
  temp_files_count: number
  last_cleanup: string
  cache_hit_rate: number
}

// ============ Вспомогательные функции преобразования ============

/**
 * Преобразование kebab-case в PascalCase для Rust enum
 */
export function toRustEnumCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("")
}

/**
 * Преобразование параметра в формат Backend
 */
export function toBackendParameter(value: any): EffectParameter {
  if (typeof value === "number") {
    return Number.isInteger(value) ? { type: "Int", value } : { type: "Float", value }
  }
  if (typeof value === "string") {
    return { type: "String", value }
  }
  if (typeof value === "boolean") {
    return { type: "Bool", value }
  }
  if (Array.isArray(value)) {
    return { type: "FloatArray", value }
  }
  // По умолчанию
  return { type: "String", value: String(value) }
}

/**
 * Создание пустого проекта
 */
export function createEmptyProject(name = "Untitled Project"): ProjectSchema {
  const now = new Date().toISOString()

  return {
    version: "1.0.0",
    metadata: {
      name,
      created_at: now,
      modified_at: now,
    },
    timeline: {
      duration: 0,
      fps: 30,
      resolution: [1920, 1080],
      sample_rate: 48000,
      aspect_ratio: AspectRatio.Ratio16x9,
    },
    tracks: [],
    effects: [],
    transitions: [],
    settings: {
      export: {
        format: OutputFormat.Mp4,
        quality: 85,
        video_bitrate: 8000,
        audio_bitrate: 192,
        hardware_acceleration: true,
        ffmpeg_args: [],
      },
      preview: {
        resolution: [1280, 720],
        fps: 30,
        quality: 75,
      },
      custom: {},
    },
  }
}

/**
 * Пример вызова Tauri команды
 */
export async function renderProject(project: ProjectSchema, outputPath: string): Promise<string> {
  const { invoke } = await import("@tauri-apps/api/core")

  try {
    const jobId = await invoke<string>("compile_video", {
      projectSchema: project,
      outputPath,
    })

    return jobId
  } catch (error) {
    console.error("Failed to start video compilation:", error)
    throw error
  }
}

/**
 * Отслеживание прогресса рендеринга
 */
export async function trackRenderProgress(
  jobId: string,
  onProgress: (progress: RenderProgress) => void,
): Promise<void> {
  const { invoke } = await import("@tauri-apps/api/core")

  const checkProgress = async () => {
    try {
      const progress = await invoke<RenderProgress | null>("get_render_progress", { jobId })

      if (progress) {
        onProgress(progress)

        // Если рендеринг еще идет, проверяем снова через 500ms
        if (progress.status === RenderStatus.Processing) {
          setTimeout(checkProgress, 500)
        }
      }
    } catch (error) {
      console.error("Failed to get render progress:", error)
    }
  }

  // Начинаем отслеживание
  void checkProgress()
}
