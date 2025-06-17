import { useCallback, useState } from "react"

import { save } from "@tauri-apps/plugin-dialog"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { OutputFormat } from "@/types/video-compiler"

import { DEVICE_PRESETS, QUALITY_PRESETS, RESOLUTION_PRESETS } from "../constants/export-constants"
import { DeviceExportSettings, ExportMode, ExportSettings, SocialExportSettings } from "../types/export-types"

const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  fileName: "",
  savePath: "",
  format: "Mp4",
  quality: "good",
  resolution: "1080",
  frameRate: "25",
  enableGPU: true,
  advancedCompression: false,
  cloudBackup: false,
}

export function useExportSettings() {
  const { t } = useTranslation()
  const [exportMode, setExportMode] = useState<ExportMode>("local")
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    ...DEFAULT_EXPORT_SETTINGS,
    fileName: t("project.untitledExport", { number: 1 }),
  })

  const [deviceSettings, setDeviceSettings] = useState<DeviceExportSettings>({
    ...DEFAULT_EXPORT_SETTINGS,
    fileName: t("project.untitledExport", { number: 1 }),
    device: "iphone",
    codec: "h264",
  })

  const [socialSettings, setSocialSettings] = useState<SocialExportSettings>({
    ...DEFAULT_EXPORT_SETTINGS,
    fileName: t("project.untitledExport", { number: 1 }),
    socialNetwork: "youtube",
    isLoggedIn: false,
  })

  const handleChooseFolder = useCallback(async () => {
    try {
      const currentSettings =
        exportMode === "local" ? exportSettings : exportMode === "device" ? deviceSettings : socialSettings

      const selectedPath = await save({
        filters: [
          {
            name: "Video",
            extensions: ["mp4", "mov", "webm"],
          },
        ],
        defaultPath: `${currentSettings.fileName}.${currentSettings.format}`,
      })

      if (selectedPath) {
        if (exportMode === "local") {
          setExportSettings((prev) => ({ ...prev, savePath: selectedPath }))
        } else if (exportMode === "device") {
          setDeviceSettings((prev) => ({ ...prev, savePath: selectedPath }))
        } else {
          setSocialSettings((prev) => ({ ...prev, savePath: selectedPath }))
        }
      }
    } catch (error) {
      console.error("Failed to select folder:", error)
      toast.error(t("dialogs.export.errors.folderSelection"))
    }
  }, [exportMode, exportSettings, deviceSettings, socialSettings, t])

  const getExportConfig = useCallback(() => {
    const settings = exportMode === "local" ? exportSettings : exportMode === "device" ? deviceSettings : socialSettings

    const qualityPreset = QUALITY_PRESETS[settings.quality]
    const resolutionPreset =
      settings.resolution === "timeline"
        ? { width: 1920, height: 1080, label: "Timeline Resolution" }
        : RESOLUTION_PRESETS[settings.resolution]

    const formatMap: Record<string, OutputFormat> = {
      mp4: OutputFormat.Mp4,
      mov: OutputFormat.Mov,
      webm: OutputFormat.WebM,
    }

    return {
      format: formatMap[settings.format] || OutputFormat.Mp4,
      quality: qualityPreset.quality,
      videoBitrate: qualityPreset.videoBitrate,
      resolution: [resolutionPreset.width, resolutionPreset.height] as [number, number],
      frameRate: Number.parseInt(settings.frameRate),
      enableGPU: settings.enableGPU,
      advancedCompression: settings.advancedCompression,
      cloudBackup: settings.cloudBackup,
      ...(exportMode === "device" && {
        device: (settings as DeviceExportSettings).device,
        codec: (settings as DeviceExportSettings).codec,
        devicePreset: DEVICE_PRESETS[(settings as DeviceExportSettings).device],
      }),
      ...(exportMode === "social" && {
        socialNetwork: (settings as SocialExportSettings).socialNetwork,
        isLoggedIn: (settings as SocialExportSettings).isLoggedIn,
        privacy: (settings as SocialExportSettings).privacy,
        title: (settings as SocialExportSettings).title,
        description: (settings as SocialExportSettings).description,
        tags: (settings as SocialExportSettings).tags,
        thumbnail: (settings as SocialExportSettings).thumbnail,
      }),
    }
  }, [exportMode, exportSettings, deviceSettings, socialSettings])

  const getCurrentSettings = useCallback(() => {
    switch (exportMode) {
      case "local":
        return exportSettings
      case "device":
        return deviceSettings
      case "social":
        return socialSettings
    }
  }, [exportMode, exportSettings, deviceSettings, socialSettings])

  const updateSettings = useCallback(
    (updates: Partial<ExportSettings> | Partial<DeviceExportSettings> | Partial<SocialExportSettings>) => {
      switch (exportMode) {
        case "local":
          setExportSettings((prev) => ({ ...prev, ...updates }))
          break
        case "device":
          setDeviceSettings((prev) => ({ ...prev, ...(updates as Partial<DeviceExportSettings>) }))
          break
        case "social":
          setSocialSettings((prev) => ({ ...prev, ...(updates as Partial<SocialExportSettings>) }))
          break
      }
    },
    [exportMode],
  )

  return {
    exportMode,
    setExportMode,
    exportSettings,
    setExportSettings,
    deviceSettings,
    setDeviceSettings,
    socialSettings,
    setSocialSettings,
    handleChooseFolder,
    getExportConfig,
    getCurrentSettings,
    updateSettings,
  }
}
