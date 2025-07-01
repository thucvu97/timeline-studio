import { useCallback, useState } from "react"

import { readFile } from "@tauri-apps/api/fs"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { SOCIAL_NETWORKS } from "../constants/export-constants"
import { SocialNetworksService } from "../services/social-networks-service"
import { SocialValidationService } from "../services/social-validation-service"
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

        // Читаем файл через Tauri API
        const fileData = await readFile(videoPath)
        const videoBlob = new Blob([fileData], { type: "video/mp4" })

        const result = await SocialNetworksService.uploadVideo(network.id, videoBlob, {
          title: settings.title || "Untitled Video",
          description: settings.description || "",
          tags: settings.tags || [],
          privacy: settings.privacy || "public",
          onProgress: (progress) => {
            setUploadProgress(progress)
          },
        })

        setIsUploading(false)
        setUploadProgress(100)

        toast.success(t("dialogs.export.uploadSuccess", { network: network.name }))
        return result
      } catch (error) {
        setIsUploading(false)
        console.error(`Upload to ${network.name} failed:`, error)
        toast.error(t("dialogs.export.errors.uploadFailed", { network: network.name }))
        throw error
      }
    },
    [t],
  )

  const validateSocialExport = useCallback(
    (settings: SocialExportSettings, videoFile?: { size: number; duration: number; format: string }) => {
      const network = SOCIAL_NETWORKS.find((n) => n.id === settings.socialNetwork)
      if (!network) {
        return { valid: false, error: "Unknown social network" }
      }

      const validation = SocialValidationService.validateExportSettings(network.id, settings, videoFile)

      if (!validation.isValid) {
        return {
          valid: false,
          error: validation.errors[0] || "Validation failed",
          errors: validation.errors,
          warnings: validation.warnings,
          suggestions: validation.suggestions,
        }
      }

      return {
        valid: true,
        warnings: validation.warnings,
        suggestions: validation.suggestions,
      }
    },
    [],
  )

  const getOptimalSettings = useCallback((networkId: string) => {
    return SocialValidationService.getOptimalSettings(networkId)
  }, [])

  const getNetworkLimits = useCallback((networkId: string) => {
    return SocialValidationService.getNetworkLimits(networkId)
  }, [])

  return {
    loginToSocialNetwork,
    logoutFromSocialNetwork,
    isLoggedIn,
    getUserInfo,
    uploadToSocialNetwork,
    validateSocialExport,
    getOptimalSettings,
    getNetworkLimits,
    uploadProgress,
    isUploading,
  }
}
