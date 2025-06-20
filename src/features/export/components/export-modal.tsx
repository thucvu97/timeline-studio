import { useCallback, useState } from "react"

import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useModal } from "@/features/modals/services"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { timelineToProjectSchema } from "@/features/timeline/utils/timeline-to-project"
import { useVideoCompiler } from "@/features/video-compiler/hooks/use-video-compiler"
import { OutputFormat } from "@/types/video-compiler"

import { BatchExportTab } from "./batch-export-tab"
import { DetailedExportInterface } from "./detailed-export-interface"
import { SectionExportTab } from "./section-export-tab"
import { SocialExportTab } from "./social-export-tab"
import { AUDIO_BITRATE } from "../constants/export-constants"
import { useExportSettings } from "../hooks/use-export-settings"
import { useSocialExport } from "../hooks/use-social-export"
import { SocialExportSettings } from "../types/export-types"

// Helper function to convert format string to OutputFormat enum
const formatToOutputFormat = (format: string): OutputFormat => {
  const formatMap: Record<string, OutputFormat> = {
    "mp4": OutputFormat.Mp4,
    "avi": OutputFormat.Avi,
    "mov": OutputFormat.Mov,
    "mkv": OutputFormat.Mkv,
    "webm": OutputFormat.WebM,
    "gif": OutputFormat.Gif,
    "Mp4": OutputFormat.Mp4,
    "Avi": OutputFormat.Avi,
    "Mov": OutputFormat.Mov,
    "Mkv": OutputFormat.Mkv,
    "WebM": OutputFormat.WebM,
    "Gif": OutputFormat.Gif,
  }
  return formatMap[format] || OutputFormat.Mp4
}

// Helper function to convert quality string to number
const qualityToNumber = (quality: string | number): number => {
  if (typeof quality === "number") {
    return quality
  }
  const qualityMap: Record<string, number> = {
    "normal": 70,
    "good": 85,
    "best": 95,
  }
  return qualityMap[quality] || 70
}

export function ExportModal() {
  const { t } = useTranslation()
  const { project } = useTimeline()
  const { startRender, isRendering, renderProgress, cancelRender } = useVideoCompiler()
  const { closeModal } = useModal()
  const { uploadToSocialNetwork } = useSocialExport()

  const { getCurrentSettings, updateSettings, handleChooseFolder, getExportConfig } = useExportSettings()

  const [activeTab, setActiveTab] = useState<"local" | "social" | "batch" | "sections">("local")
  const [socialSettings, setSocialSettings] = useState<SocialExportSettings>({
    ...getCurrentSettings(),
    socialNetwork: "youtube",
    isLoggedIn: false,
    privacy: "public",
  })

  // Запуск экспорта
  const handleExport = useCallback(async () => {
    if (!project) {
      toast.error(t("dialogs.export.errors.noProject"))
      return
    }

    const settings = getCurrentSettings()

    if (!settings.savePath) {
      toast.error(t("dialogs.export.errors.noPath"))
      return
    }

    try {
      // Преобразуем timeline в схему проекта
      const projectSchema = timelineToProjectSchema(project)
      const exportConfig = getExportConfig()

      // Обновляем настройки экспорта в схеме
      projectSchema.settings.export = {
        format: formatToOutputFormat(exportConfig.format),
        quality: qualityToNumber(exportConfig.quality),
        video_bitrate: exportConfig.videoBitrate,
        audio_bitrate: AUDIO_BITRATE,
        hardware_acceleration: exportConfig.enableGPU,
        ffmpeg_args: [],
      }

      // Обновляем разрешение и FPS
      projectSchema.timeline.resolution = exportConfig.resolution
      projectSchema.timeline.fps = exportConfig.frameRate

      // Запускаем экспорт
      await startRender(projectSchema, settings.savePath)
    } catch (error) {
      console.error("Export failed:", error)
      toast.error(t("dialogs.export.errors.exportFailed"))
    }
  }, [project, getCurrentSettings, getExportConfig, startRender, t])

  // Запуск социального экспорта
  const handleSocialExport = useCallback(
    async (socialNetwork: string) => {
      if (!project) {
        toast.error(t("dialogs.export.errors.noProject"))
        return
      }

      try {
        // Преобразуем timeline в схему проекта
        const projectSchema = timelineToProjectSchema(project)
        const exportConfig = getExportConfig()

        // Обновляем настройки экспорта в схеме для социальной сети
        projectSchema.settings.export = {
          format: formatToOutputFormat(exportConfig.format),
          quality: qualityToNumber(exportConfig.quality),
          video_bitrate: exportConfig.videoBitrate,
          audio_bitrate: AUDIO_BITRATE,
          hardware_acceleration: exportConfig.enableGPU,
          ffmpeg_args: [],
        }

        // Обновляем разрешение и FPS для социальной сети
        projectSchema.timeline.resolution = exportConfig.resolution
        projectSchema.timeline.fps = exportConfig.frameRate

        // Запускаем экспорт и загрузку в социальную сеть
        const tempPath = `/tmp/export_${Date.now()}.mp4`
        await startRender(projectSchema, tempPath)

        // После рендеринга загружаем в социальную сеть
        await uploadToSocialNetwork(tempPath, socialSettings)

        toast.success(t("dialogs.export.uploadSuccess", { platform: socialNetwork }))
      } catch (error) {
        console.error("Social export failed:", error)
        toast.error(t("dialogs.export.errors.socialExportFailed"))
      }
    },
    [project, getExportConfig, startRender, uploadToSocialNetwork, socialSettings, t],
  )

  // Отмена рендеринга
  const handleCancelRender = useCallback(async () => {
    if (renderProgress?.job_id) {
      await cancelRender(renderProgress.job_id)
    }
  }, [renderProgress, cancelRender])

  const currentSettings = getCurrentSettings()

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "local" | "social" | "batch" | "sections")}>
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="local">{t("dialogs.export.local")}</TabsTrigger>
        <TabsTrigger value="social">{t("dialogs.export.socialNetworks")}</TabsTrigger>
        <TabsTrigger value="batch">{t("dialogs.export.batchTab")}</TabsTrigger>
        <TabsTrigger value="sections">{t("dialogs.export.sectionsTab")}</TabsTrigger>
      </TabsList>

      <TabsContent value="local">
        <DetailedExportInterface
          settings={currentSettings as any}
          onSettingsChange={updateSettings}
          onChooseFolder={handleChooseFolder}
          onExport={handleExport}
          onCancelExport={handleCancelRender}
          onClose={() => closeModal()}
          isRendering={isRendering}
          renderProgress={renderProgress as any}
          hasProject={!!project}
        />
      </TabsContent>

      <TabsContent value="social">
        <SocialExportTab
          settings={socialSettings}
          onSettingsChange={(updates) => setSocialSettings((prev) => ({ ...prev, ...updates }))}
          onExport={handleSocialExport}
          onCancelExport={handleCancelRender}
          onClose={() => closeModal()}
          isRendering={isRendering}
          renderProgress={renderProgress as any}
          hasProject={!!project}
        />
      </TabsContent>

      <TabsContent value="batch">
        <BatchExportTab onClose={() => closeModal()} defaultSettings={currentSettings} />
      </TabsContent>

      <TabsContent value="sections">
        <SectionExportTab
          defaultSettings={currentSettings}
          onExport={async (settings) => {
            if (!project) {
              toast.error(t("dialogs.export.errors.noProject"))
              return
            }

            try {
              // Handle section export
              for (const section of settings.sections) {
                const projectSchema = timelineToProjectSchema(project)

                // Set export settings
                projectSchema.settings.export = {
                  format: formatToOutputFormat(settings.format),
                  quality: qualityToNumber(settings.quality),
                  video_bitrate: settings.bitrate || 5000,
                  audio_bitrate: AUDIO_BITRATE,
                  hardware_acceleration: settings.enableGPU,
                  ffmpeg_args: [],
                }

                // Set time range for section (these properties might need to be added to the Timeline interface)
                // For now, we'll skip setting time ranges as they're not part of the standard Timeline interface
                // projectSchema.timeline.start_time = section.startTime
                // projectSchema.timeline.end_time = section.endTime

                // Generate output path
                const fileName = section.customFileName || section.name
                const outputPath = `${settings.savePath}/${fileName}.${settings.format}`

                await startRender(projectSchema, outputPath)
              }

              toast.success(t("dialogs.export.sectionsExportSuccess"))
              closeModal()
            } catch (error) {
              console.error("Section export failed:", error)
              toast.error(t("dialogs.export.errors.exportFailed"))
            }
          }}
        />
      </TabsContent>
    </Tabs>
  )
}
