// Mock Social Networks Service for testing

export interface SocialNetworkCapabilities {
  maxVideoSize: number
  maxDuration: number
  supportedFormats: string[]
  supportedResolutions: string[]
}

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

// Mock network capabilities
const mockCapabilities: Record<string, SocialNetworkCapabilities> = {
  youtube: {
    maxVideoSize: 128 * 1024 * 1024 * 1024, // 128GB
    maxDuration: 12 * 60 * 60, // 12 hours
    supportedFormats: ["mp4", "mov", "avi", "wmv", "flv", "mkv"],
    supportedResolutions: ["480p", "720p", "1080p", "1440p", "2160p", "4320p"],
  },
  tiktok: {
    maxVideoSize: 500 * 1024 * 1024, // 500MB
    maxDuration: 10 * 60, // 10 minutes
    supportedFormats: ["mp4", "mov"],
    supportedResolutions: ["480p", "720p", "1080p"],
  },
  vimeo: {
    maxVideoSize: 500 * 1024 * 1024 * 1024, // 500GB (for Pro users)
    maxDuration: 24 * 60 * 60, // 24 hours
    supportedFormats: ["mp4", "mov", "avi", "wmv", "flv", "mkv", "mxf"],
    supportedResolutions: ["480p", "720p", "1080p", "1440p", "2160p", "4320p"],
  },
}

export function getNetworkCapabilities(network: string): SocialNetworkCapabilities | null {
  return mockCapabilities[network] || null
}

export async function uploadToNetwork(
  network: string,
  _videoPath: string,
  _metadata?: Record<string, any>,
): Promise<UploadResult> {
  // Simulate upload delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Simulate successful upload
  return {
    success: true,
    url: `https://${network}.com/video/mock_video_id`,
  }
}

export function validateVideoForNetwork(
  network: string,
  fileSize: number,
  duration: number,
  format: string,
): { valid: boolean; errors: string[] } {
  const capabilities = getNetworkCapabilities(network)
  if (!capabilities) {
    return { valid: false, errors: [`Network ${network} not supported`] }
  }

  const errors: string[] = []

  if (fileSize > capabilities.maxVideoSize) {
    errors.push(`File size exceeds limit of ${capabilities.maxVideoSize / (1024 * 1024)}MB`)
  }

  if (duration > capabilities.maxDuration) {
    errors.push(`Duration exceeds limit of ${capabilities.maxDuration / 60} minutes`)
  }

  if (!capabilities.supportedFormats.includes(format.toLowerCase())) {
    errors.push(`Format ${format} not supported. Supported formats: ${capabilities.supportedFormats.join(", ")}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export async function getUploadProgress(_network: string): Promise<number> {
  // Mock progress - always return 50%
  return 50
}

export async function cancelUpload(_network: string): Promise<boolean> {
  // Mock cancel - always successful
  return true
}

// Export a namespace-like object for backward compatibility if needed
export const SocialNetworksService = {
  getNetworkCapabilities,
  uploadToNetwork,
  validateVideoForNetwork,
  getUploadProgress,
  cancelUpload,
}
