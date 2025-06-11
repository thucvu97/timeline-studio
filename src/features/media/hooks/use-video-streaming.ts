import { useEffect, useState } from "react"

import { videoStreamingService } from "../services/video-streaming-service"

interface UseVideoStreamingResult {
  videoUrl: string | null
  isLoading: boolean
  error: Error | null
  retry: () => void
}

/**
 * Hook for video streaming through local HTTP server
 */
export function useVideoStreaming(filePath: string | undefined): UseVideoStreamingResult {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!filePath) {
      setVideoUrl(null)
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    const loadVideoUrl = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const url = await videoStreamingService.getVideoUrl(filePath)

        if (!cancelled) {
          setVideoUrl(url)
          console.log(`[VideoStreaming] Got URL for ${filePath}: ${url}`)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Failed to get video URL"))
          console.error(`[VideoStreaming] Error loading video ${filePath}:`, err)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadVideoUrl()

    return () => {
      cancelled = true
    }
  }, [filePath, retryCount])

  const retry = () => {
    setRetryCount((prev) => prev + 1)
  }

  return {
    videoUrl,
    isLoading,
    error,
    retry,
  }
}

/**
 * Hook to check if video server is running
 */
export function useVideoServerStatus() {
  const [isRunning, setIsRunning] = useState<boolean | null>(null)

  useEffect(() => {
    const checkStatus = async () => {
      const running = await videoStreamingService.isServerRunning()
      setIsRunning(running)
    }

    // Check immediately
    void checkStatus()

    // Check periodically
    const interval = setInterval(() => void checkStatus(), 5000)

    return () => clearInterval(interval)
  }, [])

  return isRunning
}
