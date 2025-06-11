import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GpuEncoder } from "@/types/video-compiler"

import {
  formatGpuMemory,
  formatGpuUtilization,
  getGpuEncoderDisplayName,
  getGpuRecommendations,
  getGpuStatusColor,
  useGpuCapabilities,
} from "../../hooks/use-gpu-capabilities"

// Мокаем Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (params) {
        return `${key} ${JSON.stringify(params)}`
      }
      return key
    },
  }),
}))

// Мокаем sonner
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

describe("useGpuCapabilities", () => {
  let mockInvoke: any

  const mockGpuCapabilities = {
    hardware_acceleration_supported: true,
    available_encoders: [GpuEncoder.Nvenc, GpuEncoder.QuickSync],
    recommended_encoder: GpuEncoder.Nvenc,
    current_gpu: {
      id: "0",
      name: "NVIDIA GeForce RTX 3080",
      vendor: "NVIDIA",
      driver_version: "535.123.01",
      memory_total: 10737418240, // 10GB
      memory_used: 2147483648, // 2GB
      memory_free: 8589934592, // 8GB
      utilization: 45,
      temperature: 65,
    },
    gpus: [],
  }

  const mockSystemInfo = {
    os: "Linux",
    arch: "x86_64",
    cpu_cores: 16,
    total_memory: 34359738368, // 32GB
    available_memory: 25769803776, // 24GB
    ffmpeg_version: "5.1.2",
  }

  const mockFfmpegCapabilities = {
    version: "5.1.2",
    encoders: ["libx264", "h264_nvenc", "h264_qsv"],
    decoders: ["h264", "hevc", "vp9"],
    formats: ["mp4", "mov", "webm"],
    has_gpu_support: true,
  }

  const mockCompilerSettings = {
    hardware_acceleration: true,
    preferred_encoder: GpuEncoder.Auto,
    quality: 85,
    max_concurrent_jobs: 2,
    cache_size_mb: 2048,
    temp_directory: "/tmp/timeline-studio",
    preview_quality: 85,
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const { invoke } = await import("@tauri-apps/api/core")
    mockInvoke = vi.mocked(invoke)
  })

  it("should load GPU capabilities on mount", async () => {
    mockInvoke
      .mockResolvedValueOnce(mockGpuCapabilities)
      .mockResolvedValueOnce(mockSystemInfo)
      .mockResolvedValueOnce(mockFfmpegCapabilities)
      .mockResolvedValueOnce(mockCompilerSettings)

    const { result } = renderHook(() => useGpuCapabilities())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.gpuCapabilities).toEqual(mockGpuCapabilities)
    expect(result.current.currentGpu).toEqual(mockGpuCapabilities.current_gpu)
    expect(result.current.systemInfo).toEqual(mockSystemInfo)
    expect(result.current.ffmpegCapabilities).toEqual(mockFfmpegCapabilities)
    expect(result.current.compilerSettings).toEqual(mockCompilerSettings)
    expect(result.current.error).toBeNull()
  })

  it("should handle error when loading capabilities", async () => {
    const errorMessage = "Failed to get GPU info"
    mockInvoke.mockRejectedValueOnce(new Error(errorMessage))

    const { result } = renderHook(() => useGpuCapabilities())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe(errorMessage)
    expect(result.current.gpuCapabilities).toBeNull()
  })

  it("should refresh capabilities", async () => {
    mockInvoke
      .mockResolvedValueOnce(mockGpuCapabilities)
      .mockResolvedValueOnce(mockSystemInfo)
      .mockResolvedValueOnce(mockFfmpegCapabilities)
      .mockResolvedValueOnce(mockCompilerSettings)

    const { result } = renderHook(() => useGpuCapabilities())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Обновляем возможности
    mockInvoke
      .mockResolvedValueOnce({ ...mockGpuCapabilities, hardware_acceleration_supported: false })
      .mockResolvedValueOnce(mockSystemInfo)
      .mockResolvedValueOnce(mockFfmpegCapabilities)
      .mockResolvedValueOnce(mockCompilerSettings)

    await act(async () => {
      await result.current.refreshCapabilities()
    })

    expect(result.current.gpuCapabilities?.hardware_acceleration_supported).toBe(false)
  })

  it("should update compiler settings", async () => {
    mockInvoke
      .mockResolvedValueOnce(mockGpuCapabilities)
      .mockResolvedValueOnce(mockSystemInfo)
      .mockResolvedValueOnce(mockFfmpegCapabilities)
      .mockResolvedValueOnce(mockCompilerSettings)

    const { result } = renderHook(() => useGpuCapabilities())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const newSettings = { ...mockCompilerSettings, hardware_acceleration: false }
    mockInvoke.mockResolvedValueOnce(undefined)

    await act(async () => {
      await result.current.updateSettings(newSettings)
    })

    expect(mockInvoke).toHaveBeenCalledWith("update_compiler_settings", { newSettings })
    expect(result.current.compilerSettings).toEqual(newSettings)
  })

  it("should check hardware acceleration", async () => {
    mockInvoke
      .mockResolvedValueOnce(mockGpuCapabilities)
      .mockResolvedValueOnce(mockSystemInfo)
      .mockResolvedValueOnce(mockFfmpegCapabilities)
      .mockResolvedValueOnce(mockCompilerSettings)

    const { result } = renderHook(() => useGpuCapabilities())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockInvoke.mockResolvedValueOnce(true)

    const hasAcceleration = await result.current.checkHardwareAcceleration()

    expect(mockInvoke).toHaveBeenCalledWith("check_hardware_acceleration")
    expect(hasAcceleration).toBe(true)
  })
})

describe("GPU utility functions", () => {
  const mockT = (key: string, params?: any) => {
    if (key === "common.unknown") return "Unknown"
    if (key === "common.gigabytes") return `${params.value} GB`
    if (key === "common.megabytes") return `${params.value} MB`
    if (key === "videoCompiler.gpu.cpuNoAcceleration") return "CPU (No Acceleration)"
    if (key === "videoCompiler.gpu.loadingInfo") return "Loading GPU info..."
    if (key === "videoCompiler.gpu.recommendations.noAcceleration") return "No GPU acceleration available"
    if (key === "videoCompiler.gpu.recommendations.installDrivers") return "Install latest GPU drivers"
    if (key === "videoCompiler.gpu.recommendations.nvenc") return "NVIDIA NVENC detected"
    if (key === "videoCompiler.gpu.recommendations.nvencQuality") return "Use quality 85-90 for best results"
    if (key === "videoCompiler.gpu.recommendations.quicksync") return "Intel QuickSync detected"
    if (key === "videoCompiler.gpu.recommendations.quicksyncQuality") return "Use quality 80-85 for best results"
    if (key === "videoCompiler.gpu.recommendations.videotoolbox") return "Apple VideoToolbox detected"
    if (key === "videoCompiler.gpu.recommendations.videotoolboxCodec") return "Use HEVC for best efficiency"
    if (key === "videoCompiler.gpu.recommendations.lowMemory") return "Low GPU memory detected"
    if (key === "videoCompiler.gpu.recommendations.highMemory") return "High GPU memory available"
    return key
  }

  describe("getGpuEncoderDisplayName", () => {
    it("should return display names for known encoders", () => {
      expect(getGpuEncoderDisplayName("Nvenc", mockT)).toBe("NVIDIA NVENC")
      expect(getGpuEncoderDisplayName("QuickSync", mockT)).toBe("Intel QuickSync")
      expect(getGpuEncoderDisplayName("VideoToolbox", mockT)).toBe("Apple VideoToolbox")
      expect(getGpuEncoderDisplayName("AMF", mockT)).toBe("AMD AMF")
      expect(getGpuEncoderDisplayName("None", mockT)).toBe("CPU (No Acceleration)")
    })

    it("should return original name for unknown encoders", () => {
      expect(getGpuEncoderDisplayName("CustomEncoder", mockT)).toBe("CustomEncoder")
    })
  })

  describe("getGpuStatusColor", () => {
    it("should return correct color classes", () => {
      expect(getGpuStatusColor(true)).toBe("text-green-600 dark:text-green-400")
      expect(getGpuStatusColor(false)).toBe("text-yellow-600 dark:text-yellow-400")
    })
  })

  describe("formatGpuMemory", () => {
    it("should format bytes to GB for large values", () => {
      const gb10 = 10 * 1024 * 1024 * 1024
      expect(formatGpuMemory(gb10, mockT)).toBe("10.0 GB")
    })

    it("should format bytes to MB for small values", () => {
      const mb512 = 512 * 1024 * 1024
      expect(formatGpuMemory(mb512, mockT)).toBe("512 MB")
    })

    it("should handle undefined values", () => {
      expect(formatGpuMemory(undefined, mockT)).toBe("Unknown")
    })
  })

  describe("formatGpuUtilization", () => {
    it("should format utilization as percentage", () => {
      expect(formatGpuUtilization(45.6, mockT)).toBe("46%")
      expect(formatGpuUtilization(99.9, mockT)).toBe("100%")
      expect(formatGpuUtilization(0, mockT)).toBe("0%")
    })

    it("should handle undefined values", () => {
      expect(formatGpuUtilization(undefined, mockT)).toBe("Unknown")
    })
  })

  describe("getGpuRecommendations", () => {
    it("should return loading message when capabilities are null", () => {
      const recommendations = getGpuRecommendations(null, mockT)
      expect(recommendations).toEqual(["Loading GPU info..."])
    })

    it("should recommend driver installation when no GPU acceleration", () => {
      const capabilities = {
        hardware_acceleration_supported: false,
        available_encoders: [],
        recommended_encoder: null,
        current_gpu: null,
        gpus: [],
      }
      const recommendations = getGpuRecommendations(capabilities, mockT)
      expect(recommendations).toContain("No GPU acceleration available")
      expect(recommendations).toContain("Install latest GPU drivers")
    })

    it("should provide NVENC recommendations", () => {
      const capabilities = {
        hardware_acceleration_supported: true,
        available_encoders: [GpuEncoder.Nvenc],
        recommended_encoder: GpuEncoder.Nvenc,
        current_gpu: {
          id: "0",
          name: "NVIDIA RTX 3080",
          vendor: "NVIDIA",
          memory_total: 10 * 1024 * 1024 * 1024,
        },
        gpus: [],
      }
      const recommendations = getGpuRecommendations(capabilities, mockT)
      expect(recommendations).toContain("NVIDIA NVENC detected")
      expect(recommendations).toContain("Use quality 85-90 for best results")
      expect(recommendations).toContain("High GPU memory available")
    })

    it("should provide QuickSync recommendations", () => {
      const capabilities = {
        hardware_acceleration_supported: true,
        available_encoders: [GpuEncoder.QuickSync],
        recommended_encoder: GpuEncoder.QuickSync,
        current_gpu: {
          id: "0",
          name: "Intel UHD Graphics",
          vendor: "Intel",
          memory_total: 1.5 * 1024 * 1024 * 1024,
        },
        gpus: [],
      }
      const recommendations = getGpuRecommendations(capabilities, mockT)
      expect(recommendations).toContain("Intel QuickSync detected")
      expect(recommendations).toContain("Use quality 80-85 for best results")
      expect(recommendations).toContain("Low GPU memory detected")
    })

    it("should provide VideoToolbox recommendations", () => {
      const capabilities = {
        hardware_acceleration_supported: true,
        available_encoders: [GpuEncoder.VideoToolbox],
        recommended_encoder: GpuEncoder.VideoToolbox,
        current_gpu: {
          id: "0",
          name: "Apple M1",
          vendor: "Apple",
          memory_total: 8 * 1024 * 1024 * 1024,
        },
        gpus: [],
      }
      const recommendations = getGpuRecommendations(capabilities, mockT)
      expect(recommendations).toContain("Apple VideoToolbox detected")
      expect(recommendations).toContain("Use HEVC for best efficiency")
      expect(recommendations).toContain("High GPU memory available")
    })
  })
})
