/**
 * Типы для системы кэширования
 */

export interface CacheStats {
  total_entries: number
  preview_hits: number
  preview_misses: number
  metadata_hits: number
  metadata_misses: number
  memory_usage: CacheMemoryUsage
  cache_size_mb: number
}

export interface CacheMemoryUsage {
  preview_bytes: number
  metadata_bytes: number
  render_bytes: number
  total_bytes: number
}

export interface PreviewCacheEntry {
  file_path: string
  timestamp: number
  quality: number
  image_data: Uint8Array
  created_at: string
  last_accessed: string
  access_count: number
}

export interface MetadataCacheEntry {
  file_path: string
  metadata: any
  created_at: string
  last_accessed: string
}

export interface CacheSettings {
  max_memory_mb: number
  max_entries: number
  auto_cleanup: boolean
  cleanup_threshold_percent: number
}
