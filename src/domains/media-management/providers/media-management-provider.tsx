/**
 * Media Management Domain Provider
 *
 * Централизованный провайдер для Media Management домена
 */

import { useActor } from "@xstate/react"
import { createContext, type ReactNode } from "react"
import { selectAudioFile, selectMediaFile } from "@/features/media/services/media-api"
import { fileOperationsMachine } from "../machines/file-operations-machine"
import { mediaImportMachine } from "../machines/media-import-machine"
import { getMediaMetadataService } from "../services/media-metadata-service"
import type { MediaImportOptions, MediaManagementService } from "../types"

interface MediaManagementContextValue extends MediaManagementService {
  fileOperationsState: any
  mediaImportState: any
  isReady: boolean
}

export const MediaManagementContext = createContext<MediaManagementContextValue | null>(null)

interface MediaManagementProviderProps {
  children: ReactNode
}

export function MediaManagementProvider({ children }: MediaManagementProviderProps) {
  const [fileOperationsState, sendFileOperations] = useActor(fileOperationsMachine)
  const [mediaImportState, sendMediaImport] = useActor(mediaImportMachine)

  const metadataService = getMediaMetadataService()

  const mediaManagementService: MediaManagementService = {
    importFiles: async (files: string[], options: MediaImportOptions) => {
      console.log(`[Media Management] Importing ${files.length} files`)

      // Add files to import machine
      sendMediaImport({ type: "ADD_FILES", files })
      sendMediaImport({ type: "UPDATE_OPTIONS", options })
      sendMediaImport({ type: "START_IMPORT" })

      // Wait for import to complete
      return new Promise<any[]>((resolve, reject) => {
        // Subscribe to mediaImportState changes instead
        const checkState = () => {
          if (mediaImportState.matches("completed")) {
            const results = mediaImportState.context.operations
              .filter((op: any) => op.status === "completed" && op.result)
              .map((op: any) => op.result)
            resolve(results)
          } else if (mediaImportState.matches("failed")) {
            reject(new Error(mediaImportState.context.errors.join(", ")))
          } else {
            // Check again after a short delay
            setTimeout(checkState, 100)
          }
        }
        checkState()
      })
    },

    selectMediaFiles: async () => {
      return selectMediaFile()
    },

    selectAudioFiles: async () => {
      return selectAudioFile()
    },

    getMediaInfo: async (path: string) => {
      // For now, return basic info based on file extension
      const name = path.split("/").pop() || path
      const ext = name.split(".").pop()?.toLowerCase() || ""

      const videoExts = ["mp4", "avi", "mkv", "mov", "webm"]
      const audioExts = ["mp3", "wav", "ogg", "flac", "aac", "m4a"]
      const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp"]

      let type: "Video" | "Audio" | "Image" | "Unknown" = "Unknown"
      if (videoExts.includes(ext)) type = "Video"
      else if (audioExts.includes(ext)) type = "Audio"
      else if (imageExts.includes(ext)) type = "Image"

      return {
        path,
        name,
        type,
      }
    },

    extractMetadata: async (path: string) => {
      return metadataService.extractMetadata(path)
    },
  }

  const value: MediaManagementContextValue = {
    ...mediaManagementService,
    fileOperationsState,
    mediaImportState,
    isReady: true,
  }

  return <MediaManagementContext.Provider value={value}>{children}</MediaManagementContext.Provider>
}
