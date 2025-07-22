/**
 * React hook for real-time preview functionality
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { usePlayer } from "@/features/video-player"

import { PreviewCache } from "../services/preview-cache"
import { PreviewRenderer } from "../services/preview-renderer"
import { detectGPUTier } from "../utils/webgl-utils"

import type { Effect, GPUTier, PreviewQuality } from "../types"

interface UseRealtimePreviewOptions {
  cacheSize?: number // MB
  prefetchRange?: number // seconds
  updateInterval?: number // ms
}

export function useRealtimePreview(options: UseRealtimePreviewOptions = {}) {
  const {
    cacheSize = 100,
    prefetchRange = 2,
    updateInterval = 33, // ~30fps
  } = options

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<PreviewRenderer>(null)
  const cacheRef = useRef<PreviewCache>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [previewFrame, setPreviewFrame] = useState<ImageBitmap | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [gpuTier, setGpuTier] = useState<GPUTier>("medium")
  const [quality, setQuality] = useState<PreviewQuality>({
    resolution: 1.0,
    effects: "all",
    fps: 30,
    antialiasing: true,
  })

  const timeline = useTimeline()
  const player = usePlayer()
  
  const currentTime = player.currentTime
  const selectedClipId = timeline.selectedClipIds?.[0]
  const mediaFile = player.currentVideo
  const isPlaying = player.isPlaying
  
  const getEffectsAtTime = undefined // TODO: Implement when timeline effects API is available
  const getEffectsForClip = undefined // TODO: Implement when timeline effects API is available

  // Get enabled effects at current time
  const activeEffects = useMemo(() => {
    // Get effects from timeline at current time
    const timelineEffects = getEffectsAtTime ? getEffectsAtTime(currentTime) : []

    // Get effects from selected clip if any
    let clipEffects: any[] = []
    if (selectedClipId && getEffectsForClip) {
      clipEffects = getEffectsForClip(selectedClipId)
    }

    // Combine and convert to preview system format
    const allEffects = [...timelineEffects, ...clipEffects]

    return allEffects
      .filter((effect) => effect.enabled)
      .map((effect) => ({
        id: effect.id,
        type: effect.type,
        enabled: effect.enabled,
        parameters: effect.parameters || {},
        intensity: effect.intensity || 1.0,
      }))
  }, [currentTime, selectedClipId, getEffectsAtTime, getEffectsForClip])

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const gl = canvas.getContext("webgl")
    if (!gl) {
      console.error("WebGL not supported")
      return
    }

    // Detect GPU capabilities
    const detectedTier = detectGPUTier(gl)
    setGpuTier(detectedTier)

    // Adjust quality based on GPU
    const newQuality = getQualityForGPU(detectedTier)
    setQuality(newQuality)

    // Create renderer
    const renderer = new PreviewRenderer({
      canvas,
      quality: newQuality,
      cacheSize,
      gpuTier: detectedTier,
    })

    // Create cache
    const cache = new PreviewCache(cacheSize)

    rendererRef.current = renderer
    cacheRef.current = cache

    // Initialize renderer
    renderer
      .initialize()
      .then(() => {
        setIsInitialized(true)
      })
      .catch((err: unknown) => {
        console.error("Failed to initialize preview renderer:", err)
      })

    return () => {
      renderer.dispose()
      cache.dispose()
    }
  }, [cacheSize])

  // Extract frame from video
  const extractFrame = useCallback(
    async (time: number): Promise<ImageBitmap | null> => {
      if (!videoRef.current || !mediaFile) return null

      const video = videoRef.current

      // Seek to time if needed
      if (Math.abs(video.currentTime - time) > 0.1) {
        video.currentTime = time

        // Wait for seek to complete
        await new Promise<void>((resolve) => {
          const onSeeked = () => {
            video.removeEventListener("seeked", onSeeked)
            resolve()
          }
          video.addEventListener("seeked", onSeeked)
        })
      }

      // Create bitmap from video frame
      return createImageBitmap(video)
    },
    [mediaFile],
  )

  // Render frame with effects
  const renderFrame = useCallback(
    async (time: number, effects: Effect[]): Promise<ImageBitmap | null> => {
      if (!rendererRef.current || !cacheRef.current || !isInitialized) return null

      try {
        // Try cache first
        const cached = await cacheRef.current.getOrCompute(time, effects, async () => {
          // Extract video frame
          const frame = await extractFrame(time)
          if (!frame) throw new Error("Failed to extract frame")

          // Apply quality settings
          let processedFrame = frame
          if (quality.resolution < 1) {
            // Downscale for performance
            const scaledWidth = Math.floor(frame.width * quality.resolution)
            const scaledHeight = Math.floor(frame.height * quality.resolution)

            const canvas = document.createElement("canvas")
            canvas.width = scaledWidth
            canvas.height = scaledHeight

            const ctx = canvas.getContext("2d")
            if (ctx) {
              ctx.drawImage(frame, 0, 0, scaledWidth, scaledHeight)
              processedFrame = await createImageBitmap(canvas)
            }
          }

          // Filter effects based on quality
          let filteredEffects = effects
          if (quality.effects === "basic") {
            // Only color correction and transform
            filteredEffects = effects.filter((e) => e.type === "color_correction" || e.type === "transform")
          } else if (quality.effects === "none") {
            filteredEffects = []
          }

          // Render with effects
          return rendererRef.current.renderFrame(processedFrame, filteredEffects, time)
        })

        return cached
      } catch (error) {
        console.error("Failed to render preview frame:", error)
        return null
      }
    },
    [isInitialized, extractFrame, quality],
  )

  // Update preview (throttled)
  const updatePreview = useMemo(
    () =>
      throttle(async () => {
        if (!isInitialized || !mediaFile) return

        const frame = await renderFrame(currentTime, activeEffects)
        if (frame) {
          setPreviewFrame(frame)
        }
      }, updateInterval),
    [isInitialized, mediaFile, currentTime, activeEffects, renderFrame, updateInterval],
  )

  // Update on time/effects change
  useEffect(() => {
    updatePreview()
  }, [updatePreview])

  // Prefetch nearby frames
  useEffect(() => {
    if (!isInitialized || !mediaFile || !cacheRef.current) return

    const prefetch = async () => {
      await cacheRef.current.prefetch(currentTime, prefetchRange, quality.fps, activeEffects, async (time) => {
        const frame = await extractFrame(time)
        if (!frame) throw new Error("Failed to extract frame")
        return rendererRef.current.renderFrame(frame, activeEffects, time)
      })
    }

    // Debounce prefetch
    const timeout = setTimeout(prefetch, 500)
    return () => clearTimeout(timeout)
  }, [currentTime, activeEffects, isInitialized, mediaFile, prefetchRange, quality.fps, extractFrame])

  // Invalidate cache when effects change significantly
  useEffect(() => {
    if (!cacheRef.current) return
    cacheRef.current.invalidate(activeEffects)
  }, [activeEffects])

  // Canvas ref callback
  const setCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (canvas) {
      canvasRef.current = canvas
    }
  }, [])

  // Hidden video element for frame extraction
  const setVideoRef = useCallback(
    (video: HTMLVideoElement | null) => {
      if (video && mediaFile) {
        videoRef.current = video
        video.src = mediaFile.path
        video.muted = true
      }
    },
    [mediaFile],
  )

  return {
    canvasRef: setCanvasRef,
    videoRef: setVideoRef,
    previewFrame,
    isInitialized,
    gpuTier,
    quality,
    setQuality,
    cacheStats: cacheRef.current?.getStats(),
  }
}

/**
 * Get quality settings based on GPU tier
 */
function getQualityForGPU(tier: GPUTier): PreviewQuality {
  switch (tier) {
    case "high":
      return {
        resolution: 1.0,
        effects: "all",
        fps: 30,
        antialiasing: true,
      }
    case "medium":
      return {
        resolution: 0.75,
        effects: "all",
        fps: 24,
        antialiasing: true,
      }
    case "low":
      return {
        resolution: 0.5,
        effects: "basic",
        fps: 15,
        antialiasing: false,
      }
    default:
      // Fallback для неизвестных уровней GPU
      return {
        resolution: 0.5,
        effects: "basic",
        fps: 15,
        antialiasing: false,
      }
  }
}
