/**
 * Version control types
 * Temporary types until Tauri bindings are regenerated
 */

export interface VersionInfo {
  id: string
  timestamp: string
  author: string
  message?: string
  branch_name: string
}

export interface VersionControlState {
  current_version_id: string
  branch_name: string
  has_uncommitted_changes: boolean
  last_snapshot_time: string
  auto_save_enabled: boolean
  auto_save_interval_seconds: number
}

// Extend existing ProjectState type temporarily
declare module "@/types/generated/tauri-bindings" {
  interface ProjectState {
    version_info?: VersionControlState
  }
}
