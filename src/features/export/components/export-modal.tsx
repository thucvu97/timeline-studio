import { useCallback, useState } from "react"

import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useModal } from "@/features/modals/services"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { useVideoCompiler } from "@/features/video-compiler/hooks/use-video-compiler"

import { BatchExportTab } from "./batch-export-tab"
import { DetailedExportInterface } from "./detailed-export-interface"
import { SectionExportTab } from "./section-export-tab"
import { SocialExportTab } from "./social-export-tab"
import { useExportSettings } from "../hooks/use-export-settings"
import { useSocialExport } from "../hooks/use-social-export"
import { SocialExportSettings } from "../types/export-types"
import { ProjectSchemaBuilder } from "../utils/project-schema-builder"

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
      // Используем ProjectSchemaBuilder для создания схемы с настройками экспорта
      const exportConfig = getExportConfig()
      const projectSchema = ProjectSchemaBuilder.createForExport(project, exportConfig)

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
        // Используем ProjectSchemaBuilder для создания схемы с настройками экспорта
        const exportConfig = getExportConfig()
        const projectSchema = ProjectSchemaBuilder.createForExport(project, exportConfig)

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
                // Используем специализированный метод для экспорта секций
                const projectSchema = ProjectSchemaBuilder.createForSectionExport(
                  project,
                  {
                    format: settings.format,
                    quality: settings.quality,
                    videoBitrate: settings.bitrate || 5000,
                    enableGPU: settings.enableGPU,
                  },
                  section.startTime,
                  section.endTime,
                  section.name
                )

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
