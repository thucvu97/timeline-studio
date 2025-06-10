import { useCallback, useEffect, useState } from "react"

import { invoke } from "@tauri-apps/api/core"
import { toast } from "sonner"

import { GpuEncoder } from "@/types/video-compiler"
import type { 
  CompilerSettings,
  FfmpegCapabilities,
  GpuCapabilities, 
  GpuInfo, 
  SystemInfo
} from "@/types/video-compiler"

interface UseGpuCapabilitiesReturn {
  // Состояние
  gpuCapabilities: GpuCapabilities | null
  currentGpu: GpuInfo | null
  systemInfo: SystemInfo | null
  ffmpegCapabilities: FfmpegCapabilities | null
  compilerSettings: CompilerSettings | null
  isLoading: boolean
  error: string | null
  
  // Методы
  refreshCapabilities: () => Promise<void>
  updateSettings: (settings: CompilerSettings) => Promise<void>
  checkHardwareAcceleration: () => Promise<boolean>
}

export function useGpuCapabilities(): UseGpuCapabilitiesReturn {
  const [gpuCapabilities, setGpuCapabilities] = useState<GpuCapabilities | null>(null)
  const [currentGpu, setCurrentGpu] = useState<GpuInfo | null>(null)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [ffmpegCapabilities, setFfmpegCapabilities] = useState<FfmpegCapabilities | null>(null)
  const [compilerSettings, setCompilerSettings] = useState<CompilerSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Получить все возможности системы
  const refreshCapabilities = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Загружаем все данные параллельно
      const [gpu, system, ffmpeg, settings] = await Promise.all([
        invoke<GpuCapabilities>("get_gpu_capabilities"),
        invoke<SystemInfo>("get_system_info"),
        invoke<FfmpegCapabilities>("check_ffmpeg_capabilities"),
        invoke<CompilerSettings>("get_compiler_settings"),
      ])

      setGpuCapabilities(gpu)
      setCurrentGpu(gpu.current_gpu || null)
      setSystemInfo(system)
      setFfmpegCapabilities(ffmpeg)
      setCompilerSettings(settings)

      // Показываем информацию о GPU
      if (gpu.hardware_acceleration_supported && gpu.recommended_encoder) {
        toast.success("GPU ускорение доступно", {
          description: `Рекомендуемый кодировщик: ${gpu.recommended_encoder}`,
        })
      } else {
        toast.info("GPU ускорение недоступно", {
          description: "Будет использоваться CPU кодирование",
        })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Неизвестная ошибка"
      setError(errorMsg)
      toast.error("Ошибка получения GPU информации", { description: errorMsg })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Обновить настройки компилятора
  const updateSettings = useCallback(async (newSettings: CompilerSettings) => {
    try {
      await invoke("update_compiler_settings", { newSettings })
      setCompilerSettings(newSettings)
      
      toast.success("Настройки обновлены", {
        description: newSettings.hardware_acceleration 
          ? "GPU ускорение включено" 
          : "GPU ускорение отключено",
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Неизвестная ошибка"
      toast.error("Ошибка обновления настроек", { description: errorMsg })
      throw err
    }
  }, [])

  // Проверить доступность аппаратного ускорения
  const checkHardwareAcceleration = useCallback(async (): Promise<boolean> => {
    try {
      return await invoke<boolean>("check_hardware_acceleration")
    } catch (err) {
      console.error("Failed to check hardware acceleration:", err)
      return false
    }
  }, [])

  // Загружаем данные при монтировании
  useEffect(() => {
    void refreshCapabilities()
  }, [refreshCapabilities])

  return {
    gpuCapabilities,
    currentGpu,
    systemInfo,
    ffmpegCapabilities,
    compilerSettings,
    isLoading,
    error,
    refreshCapabilities,
    updateSettings,
    checkHardwareAcceleration,
  }
}

// Вспомогательные функции

/**
 * Получить человекочитаемое название GPU кодировщика
 */
export function getGpuEncoderDisplayName(encoder: string): string {
  const names: Record<string, string> = {
    Nvenc: "NVIDIA NVENC",
    QuickSync: "Intel QuickSync",
    Vaapi: "VA-API (Linux)",
    VideoToolbox: "Apple VideoToolbox",
    AMF: "AMD AMF",
    None: "CPU (без ускорения)",
  }
  return names[encoder] || encoder
}

/**
 * Получить цвет индикатора для GPU
 */
export function getGpuStatusColor(supported: boolean): string {
  return supported 
    ? "text-green-600 dark:text-green-400" 
    : "text-yellow-600 dark:text-yellow-400"
}

/**
 * Форматировать объем памяти GPU
 */
export function formatGpuMemory(bytes?: number): string {
  if (!bytes) return "Неизвестно"
  
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) {
    return `${gb.toFixed(1)} ГБ`
  }
  
  const mb = bytes / (1024 * 1024)
  return `${Math.round(mb)} МБ`
}

/**
 * Форматировать использование GPU
 */
export function formatGpuUtilization(utilization?: number): string {
  if (utilization === undefined) return "Неизвестно"
  return `${Math.round(utilization)}%`
}

/**
 * Получить рекомендации по настройкам
 */
export function getGpuRecommendations(capabilities: GpuCapabilities | null): string[] {
  const recommendations: string[] = []
  
  if (!capabilities) {
    return ["Загрузка информации о GPU..."]
  }
  
  if (!capabilities.hardware_acceleration_supported) {
    recommendations.push("GPU ускорение недоступно, рекомендуется использовать CPU кодирование")
    recommendations.push("Для лучшей производительности установите драйверы GPU")
    return recommendations
  }
  
  if (capabilities.recommended_encoder === GpuEncoder.Nvenc) {
    recommendations.push("Используйте NVENC для максимальной производительности")
    recommendations.push("Рекомендуемое качество: 85-90%")
  } else if (capabilities.recommended_encoder === GpuEncoder.QuickSync) {
    recommendations.push("Intel QuickSync обеспечивает хороший баланс качества и скорости")
    recommendations.push("Рекомендуемое качество: 80-85%")
  } else if (capabilities.recommended_encoder === GpuEncoder.VideoToolbox) {
    recommendations.push("VideoToolbox оптимизирован для macOS")
    recommendations.push("Используйте H.265/HEVC для лучшего сжатия")
  }
  
  if (capabilities.current_gpu?.memory_total) {
    const memoryGB = capabilities.current_gpu.memory_total / (1024 * 1024 * 1024)
    if (memoryGB < 2) {
      recommendations.push("Мало видеопамяти, избегайте рендеринга в 4K")
    } else if (memoryGB >= 8) {
      recommendations.push("Достаточно памяти для рендеринга в 4K")
    }
  }
  
  return recommendations
}