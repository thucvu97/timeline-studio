import { useCallback, useState } from "react"

import { save } from "@tauri-apps/plugin-dialog"
import { Folder, Info } from "lucide-react"
import Image from "next/image"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useModal } from "@/features/modals/services"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { timelineToProjectSchema } from "@/features/timeline/utils/timeline-to-project"
import { useVideoCompiler } from "@/features/video-compiler/hooks/use-video-compiler"
import { OutputFormat } from "@/types/video-compiler"

export function ExportModal() {
  const { t } = useTranslation()
  const [selectedSocialNetwork, setSelectedSocialNetwork] = useState<string>("youtube")

  // Export настройки
  const [exportSettings, setExportSettings] = useState({
    fileName: t("project.untitledExport", { number: 1 }),
    savePath: "",
    format: "mp4" as keyof typeof OutputFormat,
    quality: "good",
    resolution: "4k",
    frameRate: "25",
    enableGPU: true,
  })

  // Hooks для timeline и компилятора
  const { project } = useTimeline()
  const { startRender, isRendering, renderProgress, cancelRender } = useVideoCompiler()
  const { closeModal } = useModal()

  // Выбор папки для сохранения
  const handleChooseFolder = useCallback(async () => {
    try {
      const selectedPath = await save({
        filters: [
          {
            name: "Video",
            extensions: ["mp4", "mov", "webm"],
          },
        ],
        defaultPath: `${exportSettings.fileName}.${exportSettings.format}`,
      })

      if (selectedPath) {
        setExportSettings((prev) => ({ ...prev, savePath: selectedPath }))
      }
    } catch (error) {
      console.error("Failed to select folder:", error)
      toast.error(t("dialogs.export.errors.folderSelection"))
    }
  }, [exportSettings.fileName, exportSettings.format, t])

  // Запуск экспорта
  const handleExport = useCallback(async () => {
    if (!project) {
      toast.error(t("dialogs.export.errors.noProject"))
      return
    }

    if (!exportSettings.savePath) {
      toast.error(t("dialogs.export.errors.noPath"))
      return
    }

    try {
      // Преобразуем timeline в схему проекта
      const projectSchema = timelineToProjectSchema(project)

      // Обновляем настройки экспорта в схеме
      const formatMap: Record<string, OutputFormat> = {
        mp4: OutputFormat.Mp4,
        mov: OutputFormat.Mov,
        webm: OutputFormat.WebM,
      }

      projectSchema.settings.export = {
        format: formatMap[exportSettings.format] || OutputFormat.Mp4,
        quality: exportSettings.quality === "best" ? 95 : exportSettings.quality === "good" ? 85 : 75,
        video_bitrate: exportSettings.quality === "best" ? 12000 : exportSettings.quality === "good" ? 8000 : 4000,
        audio_bitrate: 192,
        hardware_acceleration: exportSettings.enableGPU,
        ffmpeg_args: [],
      }

      // Обновляем разрешение
      if (exportSettings.resolution === "4k") {
        projectSchema.timeline.resolution = [3840, 2160]
      } else if (exportSettings.resolution === "1080") {
        projectSchema.timeline.resolution = [1920, 1080]
      } else if (exportSettings.resolution === "720") {
        projectSchema.timeline.resolution = [1280, 720]
      }

      // Обновляем FPS
      projectSchema.timeline.fps = Number.parseInt(exportSettings.frameRate)

      // Запускаем рендеринг
      await startRender(projectSchema, exportSettings.savePath)
    } catch (error) {
      console.error("Export failed:", error)
      toast.error(t("dialogs.export.errors.exportFailed"))
    }
  }, [project, exportSettings, startRender, t])

  // Отмена рендеринга
  const handleCancelRender = useCallback(async () => {
    if (renderProgress?.job_id) {
      await cancelRender(renderProgress.job_id)
    }
  }, [renderProgress, cancelRender])

  return (
    <Tabs defaultValue="local" className="flex flex-1 flex-col">
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
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-muted flex aspect-video w-full items-center justify-center rounded-lg">
                <div className="text-muted-foreground">{t("dialogs.export.cover")}</div>
              </div>
              <Button variant="outline" className="w-full">
                {t("dialogs.export.edit")}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("dialogs.export.outputSettings")}</Label>
                <div className="grid grid-cols-[1fr,auto] items-center gap-2">
                  <Input
                    placeholder={t("dialogs.export.name")}
                    value={exportSettings.fileName}
                    onChange={(e) => setExportSettings((prev) => ({ ...prev, fileName: e.target.value }))}
                    disabled={isRendering}
                  />
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("dialogs.export.saveTo")}</Label>
                <div className="grid grid-cols-[1fr,auto] gap-2">
                  <Input
                    value={exportSettings.savePath || ""}
                    placeholder={t("dialogs.export.selectPath")}
                    readOnly
                    disabled={isRendering}
                  />
                  <Button variant="outline" size="icon" onClick={handleChooseFolder} disabled={isRendering}>
                    <Folder className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("dialogs.export.preset")}</Label>
                <Select defaultValue="match">
                  <SelectTrigger>
                    <SelectValue placeholder={t("dialogs.export.defaultPreset")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">{t("dialogs.export.defaultPreset")}</SelectItem>
                    <SelectItem value="custom">{t("dialogs.export.custom")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("dialogs.export.format")}</Label>
                <Select
                  value={exportSettings.format}
                  onValueChange={(value) => setExportSettings((prev) => ({ ...prev, format: value as any }))}
                  disabled={isRendering}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="MP4" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp4">MP4</SelectItem>
                    <SelectItem value="mov">MOV</SelectItem>
                    <SelectItem value="webm">WebM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{t("dialogs.export.quality")}</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="normal"
                        checked={exportSettings.quality === "normal"}
                        onCheckedChange={(checked) =>
                          checked && setExportSettings((prev) => ({ ...prev, quality: "normal" }))
                        }
                        disabled={isRendering}
                      />
                      <Label htmlFor="normal">{t("dialogs.export.normal")}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="good"
                        checked={exportSettings.quality === "good"}
                        onCheckedChange={(checked) =>
                          checked && setExportSettings((prev) => ({ ...prev, quality: "good" }))
                        }
                        disabled={isRendering}
                      />
                      <Label htmlFor="good">{t("dialogs.export.good")}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="best"
                        checked={exportSettings.quality === "best"}
                        onCheckedChange={(checked) =>
                          checked && setExportSettings((prev) => ({ ...prev, quality: "best" }))
                        }
                        disabled={isRendering}
                      />
                      <Label htmlFor="best">{t("dialogs.export.best")}</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("dialogs.export.resolution")}</Label>
                  <Select
                    value={exportSettings.resolution}
                    onValueChange={(value) => setExportSettings((prev) => ({ ...prev, resolution: value }))}
                    disabled={isRendering}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="4096x2160" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4k">3840x2160 (4K)</SelectItem>
                      <SelectItem value="1080">1920x1080 (Full HD)</SelectItem>
                      <SelectItem value="720">1280x720 (HD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("dialogs.export.frameRate")}</Label>
                  <Select
                    value={exportSettings.frameRate}
                    onValueChange={(value) => setExportSettings((prev) => ({ ...prev, frameRate: value }))}
                    disabled={isRendering}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="25 fps" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 fps</SelectItem>
                      <SelectItem value="25">25 fps</SelectItem>
                      <SelectItem value="30">30 fps</SelectItem>
                      <SelectItem value="60">60 fps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>{t("dialogs.export.advancedCompression")}</Label>
                    <Info className="text-muted-foreground h-4 w-4" />
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>{t("dialogs.export.cloudBackup")}</Label>
                    <Info className="text-muted-foreground h-4 w-4" />
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>{t("dialogs.export.enableGPUEncoding")}</Label>
                    <Info className="text-muted-foreground h-4 w-4" />
                  </div>
                  <Switch
                    checked={exportSettings.enableGPU}
                    onCheckedChange={(checked) => setExportSettings((prev) => ({ ...prev, enableGPU: checked }))}
                    disabled={isRendering}
                  />
                </div>
              </div>

              {/* Progress and Export Button */}
              <div className="space-y-4 pt-6 border-t">
                {isRendering && renderProgress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{t("dialogs.export.progress")}</span>
                      <span>{Math.round(renderProgress.percentage)}%</span>
                    </div>
                    <Progress value={renderProgress.percentage} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {renderProgress.message || t("dialogs.export.rendering")}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {isRendering ? (
                    <>
                      <Button variant="outline" onClick={handleCancelRender} className="flex-1">
                        {t("dialogs.export.cancel")}
                      </Button>
                      <Button disabled className="flex-1">
                        {t("dialogs.export.rendering")}...
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => closeModal()} className="flex-1">
                        {t("dialogs.export.close")}
                      </Button>
                      <Button
                        onClick={handleExport}
                        disabled={!exportSettings.savePath || !project}
                        className="flex-1 bg-[#00CCC0] hover:bg-[#00B8B0] text-black"
                      >
                        {t("dialogs.export.export")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="device" className="h-full overflow-y-auto px-6 pt-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-muted flex aspect-video w-full items-center justify-center rounded-lg">
                <div className="text-muted-foreground">{t("dialogs.export.cover")}</div>
              </div>
              <Button variant="outline" className="w-full">
                {t("dialogs.export.edit")}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("dialogs.export.titles")}</Label>
                <div className="grid grid-cols-[1fr,auto] items-center gap-2">
                  <Input placeholder={t("dialogs.export.name")} defaultValue="Room" />
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("dialogs.export.saveTo")}</Label>
                <div className="grid grid-cols-[1fr,auto] gap-2">
                  <Input defaultValue="/Users/aleksandrkireev/Movies/Wondershare Filmora Mac/Output" />
                  <Button variant="outline" size="icon">
                    <Folder className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("dialogs.export.preset")}</Label>
                <Select defaultValue="default">
                  <SelectTrigger>
                    <SelectValue placeholder={t("dialogs.export.defaultPreset")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">{t("dialogs.export.defaultPreset")}</SelectItem>
                    <SelectItem value="custom">{t("dialogs.export.custom")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("dialogs.export.device")}</Label>
                  <Select defaultValue="iphone">
                    <SelectTrigger>
                      <SelectValue placeholder="iPhone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iphone">{t("dialogs.export.device_types.iphone")}</SelectItem>
                      <SelectItem value="ipad">{t("dialogs.export.device_types.ipad")}</SelectItem>
                      <SelectItem value="android">{t("dialogs.export.device_types.android")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("dialogs.export.resolution")}</Label>
                  <Select defaultValue="1080">
                    <SelectTrigger>
                      <SelectValue placeholder="1920*1080" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1080">1920*1080</SelectItem>
                      <SelectItem value="720">1280*720</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("dialogs.export.codec")}</Label>
                <Select defaultValue="h264">
                  <SelectTrigger>
                    <SelectValue placeholder="H.264" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="h264">H.264</SelectItem>
                    <SelectItem value="h265">H.265</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">30 {t("dialogs.export.fps")}</span>
                  <span className="mx-2 text-sm">•</span>
                  <span className="text-sm">6000 {t("dialogs.export.kbps")}</span>
                  <span className="mx-2 text-sm">•</span>
                  <span className="text-sm">{t("dialogs.export.sdr")}</span>
                </div>
                <Button variant="link" className="text-[#00CCC0]">
                  {t("dialogs.export.additional")} →
                </Button>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>{t("dialogs.export.advancedCompression")}</Label>
                    <Info className="text-muted-foreground h-4 w-4" />
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>{t("dialogs.export.enableGPUEncoding")}</Label>
                    <Info className="text-muted-foreground h-4 w-4" />
                  </div>
                  <Switch
                    checked={exportSettings.enableGPU}
                    onCheckedChange={(checked) => setExportSettings((prev) => ({ ...prev, enableGPU: checked }))}
                    disabled={isRendering}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="social" className="h-full overflow-y-auto px-6 pt-4">
          <div className="grid grid-cols-[250px,1fr] gap-6">
            <div className="space-y-2">
              <div
                className={`flex cursor-pointer items-center gap-2 rounded p-2 ${selectedSocialNetwork === "youtube" ? "bg-accent" : "hover:bg-accent"}`}
                onClick={() => setSelectedSocialNetwork("youtube")}
              >
                <Image src="/youtube-new.svg" width={24} height={24} className="h-6 w-6" alt="YouTube" />
                <div>
                  <div>{t("dialogs.export.youtube")}</div>
                  <div className="text-muted-foreground text-xs">{t("dialogs.export.notLoggedIn")}</div>
                </div>
              </div>
              <div
                className={`flex cursor-pointer items-center gap-2 rounded p-2 ${selectedSocialNetwork === "tiktok" ? "bg-accent" : "hover:bg-accent"}`}
                onClick={() => setSelectedSocialNetwork("tiktok")}
              >
                <Image src="/tiktok-new.svg" width={24} height={24} className="h-6 w-6" alt="TikTok" />
                <div>
                  <div>{t("dialogs.export.tiktok")}</div>
                  <div className="text-muted-foreground text-xs">{t("dialogs.export.notLoggedIn")}</div>
                </div>
              </div>
              <div
                className={`flex cursor-pointer items-center gap-2 rounded p-2 ${selectedSocialNetwork === "telegram" ? "bg-accent" : "hover:bg-accent"}`}
                onClick={() => setSelectedSocialNetwork("telegram")}
              >
                <Image src="/telegram.svg" width={24} height={24} className="h-6 w-6" alt="Telegram" />
                <div>
                  <div>{t("dialogs.export.telegram")}</div>
                  <div className="text-muted-foreground text-xs">{t("dialogs.export.notLoggedIn")}</div>
                </div>
              </div>
              {/* {t("dialogs.export.otherNetworks")} */}
            </div>
            <div className="flex items-center justify-center">
              {selectedSocialNetwork === "youtube" && (
                <div className="space-y-4 text-center">
                  <Image src="/youtube-new.svg" width={96} height={96} className="mx-auto h-24 w-24" alt="YouTube" />
                  <div>{t("dialogs.export.loginPrompt.youtube")}</div>
                  <Button>{t("dialogs.export.login")}</Button>
                </div>
              )}
              {selectedSocialNetwork === "tiktok" && (
                <div className="space-y-4 text-center">
                  <Image src="/tiktok-new.svg" width={96} height={96} className="mx-auto h-24 w-24" alt="TikTok" />
                  <div>{t("dialogs.export.loginPrompt.tiktok")}</div>
                  <Button>{t("dialogs.export.login")}</Button>
                </div>
              )}
              {selectedSocialNetwork === "telegram" && (
                <div className="space-y-4 text-center">
                  <Image src="/telegram.svg" width={96} height={96} className="mx-auto h-24 w-24" alt="Telegram" />
                  <div>{t("dialogs.export.loginPrompt.telegram")}</div>
                  <Button>{t("dialogs.export.login")}</Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  )
}
