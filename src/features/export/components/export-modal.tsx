import { useCallback } from "react"

import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useModal } from "@/features/modals/services"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { timelineToProjectSchema } from "@/features/timeline/utils/timeline-to-project"
import { useVideoCompiler } from "@/features/video-compiler/hooks/use-video-compiler"

import { LocalExportTab } from "./local-export-tab"
import { AUDIO_BITRATE } from "../constants/export-constants"
import { useExportSettings } from "../hooks/use-export-settings"

export function ExportModal() {
  const { t } = useTranslation()
  const { project } = useTimeline()
  const { startRender, isRendering, renderProgress, cancelRender } = useVideoCompiler()
  const { closeModal } = useModal()

  const { getCurrentSettings, updateSettings, handleChooseFolder, getExportConfig } = useExportSettings()

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

      // Запускаем экспорт
      await startRender(projectSchema, settings.savePath)
    } catch (error) {
      console.error("Export failed:", error)
      toast.error(t("dialogs.export.errors.exportFailed"))
    }
  }, [project, getCurrentSettings, getExportConfig, startRender, t])

  // Отмена рендеринга
  const handleCancelRender = useCallback(async () => {
    if (renderProgress?.job_id) {
      await cancelRender(renderProgress.job_id)
    }
  }, [renderProgress, cancelRender])

  const currentSettings = getCurrentSettings()

  return (
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
  )
}
