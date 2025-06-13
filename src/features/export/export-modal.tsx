import { useCallback } from "react"

import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useModal } from "@/features/modals/services"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { timelineToProjectSchema } from "@/features/timeline/utils/timeline-to-project"
import { useVideoCompiler } from "@/features/video-compiler/hooks/use-video-compiler"

import { DeviceExportTab } from "./components/device-export-tab"
import { LocalExportTab } from "./components/local-export-tab"
import { SocialExportTab } from "./components/social-export-tab"
import { AUDIO_BITRATE } from "./constants/export-constants"
import { useExportSettings } from "./hooks/use-export-settings"
import { useSocialExport } from "./hooks/use-social-export"

export function ExportModal() {
  const { t } = useTranslation()
  const { project } = useTimeline()
  const { startRender, isRendering, renderProgress, cancelRender } = useVideoCompiler()
  const { closeModal } = useModal()

  const { exportMode, setExportMode, getCurrentSettings, updateSettings, handleChooseFolder, getExportConfig } =
    useExportSettings()

  const { loginToSocialNetwork, uploadToSocialNetwork, validateSocialExport } = useSocialExport()

  // Запуск экспорта
  const handleExport = useCallback(async () => {
    if (!project) {
      toast.error(t("dialogs.export.errors.noProject"))
      return
    }

    const settings = getCurrentSettings()

    if (!settings.savePath && exportMode !== "social") {
      toast.error(t("dialogs.export.errors.noPath"))
      return
    }

    // Для социальных сетей нужна дополнительная валидация
    if (exportMode === "social") {
      const socialSettings = settings as any
      if (!validateSocialExport(socialSettings)) {
        return
      }
    }

    try {
      // Преобразуем timeline в схему проекта
      const projectSchema = timelineToProjectSchema(project)
      const exportConfig = getExportConfig()

      // Обновляем настройки экспорта в схеме
      projectSchema.settings.export = {
        format: exportConfig.format,
        quality: exportConfig.quality,
        video_bitrate: exportConfig.videoBitrate,
        audio_bitrate: AUDIO_BITRATE,
        hardware_acceleration: exportConfig.enableGPU,
        ffmpeg_args: [],
      }

      // Обновляем разрешение и FPS
      projectSchema.timeline.resolution = exportConfig.resolution
      projectSchema.timeline.fps = exportConfig.frameRate

      // Для социальных сетей сначала экспортируем локально
      if (exportMode === "social") {
        const tempPath = `/tmp/export_${Date.now()}.${settings.format}`
        await startRender(projectSchema, tempPath)

        // После успешного рендера загружаем в соцсеть
        const socialSettings = settings as any
        await uploadToSocialNetwork(tempPath, socialSettings)
      } else {
        // Обычный экспорт
        await startRender(projectSchema, settings.savePath)
      }
    } catch (error) {
      console.error("Export failed:", error)
      toast.error(t("dialogs.export.errors.exportFailed"))
    }
  }, [
    project,
    getCurrentSettings,
    exportMode,
    validateSocialExport,
    getExportConfig,
    startRender,
    uploadToSocialNetwork,
    t,
  ])

  // Отмена рендеринга
  const handleCancelRender = useCallback(async () => {
    if (renderProgress?.job_id) {
      await cancelRender(renderProgress.job_id)
    }
  }, [renderProgress, cancelRender])

  const currentSettings = getCurrentSettings()

  return (
    <Tabs value={exportMode} onValueChange={(value) => setExportMode(value as any)} className="flex flex-1 flex-col">
      <div className="bg-gray-50">
        <TabsList className="mx-4 mt-2 mb-2 h-8 w-auto bg-transparent">
          <TabsTrigger
            value="local"
            className="rounded-sm px-3 py-1 text-sm data-[state=active]:bg-[#00CCC0] data-[state=active]:text-black dark:data-[state=active]:bg-[#00CCC0] dark:data-[state=active]:text-black"
          >
            {t("dialogs.export.local")}
          </TabsTrigger>
          <TabsTrigger
            value="device"
            className="rounded-sm px-3 py-1 text-sm data-[state=active]:bg-[#00CCC0] data-[state=active]:text-black dark:data-[state=active]:bg-[#00CCC0] dark:data-[state=active]:text-black"
          >
            {t("dialogs.export.device")}
          </TabsTrigger>
          <TabsTrigger
            value="social"
            className="rounded-sm px-3 py-1 text-sm data-[state=active]:bg-[#00CCC0] data-[state=active]:text-black dark:data-[state=active]:bg-[#00CCC0] dark:data-[state=active]:text-black"
          >
            {t("dialogs.export.socialNetworks")}
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1 overflow-auto">
        <TabsContent value="local" className="h-full px-6 pt-4">
          <LocalExportTab
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

        <TabsContent value="device" className="h-full overflow-y-auto px-6 pt-4">
          <DeviceExportTab
            settings={currentSettings as any}
            onSettingsChange={updateSettings}
            onChooseFolder={handleChooseFolder}
            isRendering={isRendering}
          />
        </TabsContent>

        <TabsContent value="social" className="h-full overflow-y-auto px-6 pt-4">
          <SocialExportTab
            settings={currentSettings as any}
            onSettingsChange={updateSettings}
            onExport={handleExport}
            isRendering={isRendering}
          />
        </TabsContent>
      </div>
    </Tabs>
  )
}
