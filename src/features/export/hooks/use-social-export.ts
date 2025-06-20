import { useCallback, useEffect, useState } from "react"

import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { SOCIAL_NETWORKS } from "../constants/export-constants"
import { SocialNetworksService } from "../services/social-networks-service"
import { SocialExportSettings } from "../types/export-types"

export function useSocialExport() {
  const { t } = useTranslation()
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState<boolean>(false)

  const loginToSocialNetwork = useCallback(
    async (network: string) => {
      try {
        const success = await SocialNetworksService.login(network)
        return success
      } catch (error) {
        console.error(`Failed to login to ${network}:`, error)
        toast.error(t("dialogs.export.errors.loginFailed", { network }))
        return false
      }
    },
    [t],
  )

  const logoutFromSocialNetwork = useCallback(async (network: string) => {
    await SocialNetworksService.logout(network)
  }, [])

  const isLoggedIn = useCallback(async (network: string) => {
    return await SocialNetworksService.isLoggedIn(network)
  }, [])

  const getUserInfo = useCallback((network: string) => {
    return SocialNetworksService.getStoredUserInfo(network)
  }, [])

  const uploadToSocialNetwork = useCallback(
    async (videoPath: string, settings: SocialExportSettings) => {
      const network = SOCIAL_NETWORKS.find((n) => n.id === settings.socialNetwork)

      if (!network) {
        throw new Error("Unknown social network")
      }

      try {
        setIsUploading(true)
        setUploadProgress(0)

        // В Tauri нужно читать файл через API
        // TODO: Implement file reading from path in Tauri
        // For now, we'll throw an error as this needs backend implementation
        throw new Error("Social media upload requires file reading implementation in Tauri")

        // Когда будет реализовано чтение файла:
        // const fileData = await readBinaryFile(videoPath)
        // const videoBlob = new Blob([fileData], { type: 'video/mp4' })
        // const result = await SocialNetworksService.uploadVideo(network.id, videoBlob, {
        //   title: settings.title || "Untitled Video",
        //   description: settings.description || "",
        //   tags: settings.tags || [],
        //   privacy: settings.privacy || "public",
        //   onProgress: (progress) => {
        //     setUploadProgress(progress)
        //   },
        // })
        //
        // setIsUploading(false)
        // setUploadProgress(100)
        //
        // toast.success(t("dialogs.export.uploadSuccess", { network: network.name }))
        // return result
      } catch (error) {
        setIsUploading(false)
        console.error(`Upload to ${network.name} failed:`, error)
        toast.error(t("dialogs.export.errors.uploadFailed", { network: network.name }))
        throw error
      }
    },
    [t],
  )

  const validateSocialExport = useCallback((settings: SocialExportSettings) => {
    const network = SOCIAL_NETWORKS.find((n) => n.id === settings.socialNetwork)
    if (!network) {
      return { valid: false, error: "Unknown social network" }
    }

    // TODO: Add file size and duration validation when limits are defined in SOCIAL_NETWORKS
    // For now, we'll use hardcoded limits
    const limits: Record<string, { maxFileSize?: number; maxDuration?: number }> = {
      youtube: { maxFileSize: 128 * 1024 * 1024 * 1024, maxDuration: 12 * 60 * 60 }, // 128GB, 12 hours
      tiktok: { maxFileSize: 287 * 1024 * 1024, maxDuration: 10 * 60 }, // 287MB, 10 minutes
      telegram: { maxFileSize: 2 * 1024 * 1024 * 1024, maxDuration: undefined }, // 2GB, no duration limit
      vimeo: { maxFileSize: undefined, maxDuration: undefined }, // Varies by plan
    }

    const networkLimits = limits[network.id]

    // Validate file size
    if (settings.fileSizeBytes && networkLimits?.maxFileSize && settings.fileSizeBytes > networkLimits.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${network.name} limit of ${networkLimits.maxFileSize / (1024 * 1024)}MB`,
      }
    }

    // Validate duration
    if (
      settings.durationSeconds &&
      networkLimits?.maxDuration &&
      settings.durationSeconds > networkLimits.maxDuration
    ) {
      return {
        valid: false,
        error: `Video duration exceeds ${network.name} limit of ${networkLimits.maxDuration} seconds`,
      }
    }

    // Validate title
    if (!settings.title || settings.title.trim().length === 0) {
      return { valid: false, error: "Title is required" }
    }

    return { valid: true }
  }, [])

  return {
    loginToSocialNetwork,
    logoutFromSocialNetwork,
    isLoggedIn,
    getUserInfo,
    uploadToSocialNetwork,
    validateSocialExport,
    uploadProgress,
    isUploading,
  }
}
