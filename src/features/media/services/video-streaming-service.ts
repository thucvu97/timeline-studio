import { invoke } from "@tauri-apps/api/core"

const VIDEO_SERVER_PORT = 4567
const VIDEO_SERVER_URL = `http://localhost:${VIDEO_SERVER_PORT}`

interface VideoRegistration {
  id: string
  url: string
}

/**
 * Service for video streaming through local HTTP server
 */
export class VideoStreamingService {
  private static instance: VideoStreamingService
  private videoCache = new Map<string, string>()
  private registrationPromises = new Map<string, Promise<VideoRegistration>>()

  private constructor() {}

  static getInstance(): VideoStreamingService {
    if (!VideoStreamingService.instance) {
      VideoStreamingService.instance = new VideoStreamingService()
    }
    return VideoStreamingService.instance
  }

  /**
   * Get streaming URL for video file
   */
  async getVideoUrl(filePath: string): Promise<string> {
    // Check cache first
    if (this.videoCache.has(filePath)) {
      return this.videoCache.get(filePath)!
    }

    // Check if registration is already in progress
    if (this.registrationPromises.has(filePath)) {
      const registration = await this.registrationPromises.get(filePath)!
      return registration.url
    }

    // Register new video
    const registrationPromise = this.registerVideo(filePath)
    this.registrationPromises.set(filePath, registrationPromise)

    try {
      const registration = await registrationPromise
      this.videoCache.set(filePath, registration.url)
      return registration.url
    } finally {
      this.registrationPromises.delete(filePath)
    }
  }

  /**
   * Register video with backend server
   */
  private async registerVideo(filePath: string): Promise<VideoRegistration> {
    try {
      // First try to register through Tauri command
      const registration = await invoke<VideoRegistration>("register_video", {
        path: filePath,
      })
      return registration
    } catch (error) {
      // Fallback to direct HTTP request
      const response = await fetch(`${VIDEO_SERVER_URL}/register?path=${encodeURIComponent(filePath)}`)
      if (!response.ok) {
        throw new Error(`Failed to register video: ${response.statusText}`)
      }
      return response.json()
    }
  }

  /**
   * Preload video metadata
   */
  async preloadVideo(filePath: string): Promise<void> {
    const url = await this.getVideoUrl(filePath)

    // Create invisible video element to trigger metadata loading
    const video = document.createElement("video")
    video.src = url
    video.preload = "metadata"

    return new Promise((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error("Failed to load video metadata"))

      // Cleanup after 5 seconds
      setTimeout(() => {
        video.remove()
        resolve()
      }, 5000)
    })
  }

  /**
   * Clear cache for specific video
   */
  clearCache(filePath?: string): void {
    if (filePath) {
      this.videoCache.delete(filePath)
    } else {
      this.videoCache.clear()
    }
  }

  /**
   * Check if video server is running
   */
  async isServerRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${VIDEO_SERVER_URL}/health`, {
        method: "HEAD",
        signal: AbortSignal.timeout(1000),
      })
      return response.ok
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const videoStreamingService = VideoStreamingService.getInstance()
