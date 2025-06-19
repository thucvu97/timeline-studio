import { useState } from "react"

import { ChevronRight, Folder, Info } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import { ExportPresets } from "./export-presets"
import { FORMAT_OPTIONS, FRAME_RATE_OPTIONS, QUALITY_PRESETS, RESOLUTION_PRESETS } from "../constants/export-constants"
import { ExportProgress, ExportSettings } from "../types/export-types"

interface LocalExportTabProps {
  settings: ExportSettings & {
    exportVideo?: boolean
    bitrateMode?: "auto" | "limit"
    bitrate?: number
    encodingProfile?: string
    keyframeMode?: string
    keyframeInterval?: number
    optimizeForSpeed?: boolean
    optimizeForNetwork?: boolean
    multipassEncoding?: boolean
    frameReordering?: boolean
  }
  onSettingsChange: (updates: Partial<ExportSettings>) => void
  onChooseFolder: () => void
  onExport: () => void
  onCancelExport: () => void
  onClose: () => void
  isRendering: boolean
  renderProgress: ExportProgress | null
  hasProject: boolean
}

export function LocalExportTab({
  settings,
  onSettingsChange,
  onChooseFolder,
  onExport,
  onCancelExport,
  onClose,
  isRendering,
  renderProgress,
  hasProject,
}: LocalExportTabProps) {
  const { t } = useTranslation()
  const [selectedPresetId, setSelectedPresetId] = useState("custom")
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [renderMode, setRenderMode] = useState<"single" | "individual">("single")
  const [activeTab, setActiveTab] = useState<"video" | "audio" | "file">("video")

  // Обработчик выбора пресета
  const handlePresetSelect = (preset: any) => {
    setSelectedPresetId(preset.id)
    if (preset.id !== "custom") {
      // Применяем настройки пресета
      const updates: Partial<ExportSettings> = {}

      if (preset.settings.format) {
        updates.format = preset.settings.format
      }
      if (preset.settings.resolution && preset.settings.resolution !== "timeline") {
        updates.resolution = preset.settings.resolution
      }
      if (preset.settings.fps && preset.settings.fps !== "timeline") {
        updates.frameRate = preset.settings.fps
      }
      if (preset.settings.useHardwareAcceleration !== undefined) {
        updates.enableGPU = preset.settings.useHardwareAcceleration
      }

      onSettingsChange(updates)
    }
  }

  return (
    <div className="space-y-4">
      {/* Пресеты */}
      <ExportPresets selectedPresetId={selectedPresetId} onSelectPreset={handlePresetSelect} className="-mx-6 px-6" />

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
                value={settings.fileName}
                onChange={(e) => onSettingsChange({ fileName: e.target.value })}
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
                value={settings.savePath || ""}
                placeholder={t("dialogs.export.selectPath")}
                readOnly
                disabled={isRendering}
              />
              <Button variant="outline" size="icon" onClick={onChooseFolder} disabled={isRendering}>
                <Folder className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Режим рендеринга */}
          <div className="space-y-2">
            <Label>{t("dialogs.export.renderMode")}</Label>
            <RadioGroup value={renderMode} onValueChange={(v) => setRenderMode(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="font-normal cursor-pointer">
                  {t("dialogs.export.singleClip")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="font-normal cursor-pointer">
                  {t("dialogs.export.individualClips")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Вкладки Видео/Аудио/Файл */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="video">{t("dialogs.export.video")}</TabsTrigger>
              <TabsTrigger value="audio">{t("dialogs.export.audio")}</TabsTrigger>
              <TabsTrigger value="file">{t("dialogs.export.file")}</TabsTrigger>
            </TabsList>
            <TabsContent value="video" className="space-y-4">
              {/* Checkbox Экспорт видео */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="export-video"
                  checked={settings.exportVideo ?? true}
                  onCheckedChange={(checked) => onSettingsChange({ exportVideo: checked })}
                />
                <Label htmlFor="export-video">{t("dialogs.export.exportVideo")}</Label>
              </div>
            </TabsContent>
            <TabsContent value="audio" className="space-y-4">
              <div className="text-sm text-muted-foreground">{t("dialogs.export.audioSettings")}</div>
            </TabsContent>
            <TabsContent value="file" className="space-y-4">
              <div className="text-sm text-muted-foreground">{t("dialogs.export.fileSettings")}</div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label>{t("dialogs.export.format")}</Label>
            <Select
              value={settings.format}
              onValueChange={(value) => onSettingsChange({ format: value as any })}
              disabled={isRendering}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{t("dialogs.export.quality")}</Label>
              <div className="flex gap-4">
                {Object.entries(QUALITY_PRESETS).map(([key, _preset]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Switch
                      id={key}
                      checked={settings.quality === key}
                      onCheckedChange={(checked) => checked && onSettingsChange({ quality: key as any })}
                      disabled={isRendering}
                    />
                    <Label htmlFor={key}>{t(`dialogs.export.${key}`)}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("dialogs.export.resolution")}</Label>
              <Select
                value={settings.resolution}
                onValueChange={(value) => onSettingsChange({ resolution: value as any })}
                disabled={isRendering}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RESOLUTION_PRESETS).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("dialogs.export.frameRate")}</Label>
              <Select
                value={settings.frameRate}
                onValueChange={(value) => onSettingsChange({ frameRate: value })}
                disabled={isRendering}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FRAME_RATE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Расширенные настройки */}
          <Collapsible open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings} className="space-y-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2">
                <span>{t("dialogs.export.advancedSettings")}</span>
                <ChevronRight className={cn("h-4 w-4 transition-transform", showAdvancedSettings && "rotate-90")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Качество */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t("dialogs.export.quality")}</Label>
                  <span className="text-sm text-muted-foreground">
                    {settings.bitrateMode === "auto" ? t("dialogs.export.auto") : `${settings.bitrate || 8000} Kbps`}
                  </span>
                </div>
                <RadioGroup
                  value={settings.bitrateMode || "auto"}
                  onValueChange={(v) => onSettingsChange({ bitrateMode: v as any })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="auto" />
                    <Label htmlFor="auto" className="font-normal">
                      {t("dialogs.export.auto")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="limit" id="limit" />
                    <Label htmlFor="limit" className="font-normal">
                      {t("dialogs.export.limitTo")}
                    </Label>
                    <Input
                      type="number"
                      value={settings.bitrate || 8000}
                      onChange={(e) => onSettingsChange({ bitrate: Number.parseInt(e.target.value) })}
                      className="w-24"
                      disabled={settings.bitrateMode === "auto"}
                    />
                    <span className="text-sm">Kbps</span>
                  </div>
                </RadioGroup>
              </div>

              {/* Профиль кодирования */}
              <div className="space-y-2">
                <Label>{t("dialogs.export.encodingProfile")}</Label>
                <Select
                  value={settings.encodingProfile || "main"}
                  onValueChange={(v) => onSettingsChange({ encodingProfile: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main</SelectItem>
                    <SelectItem value="main10">Main10</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ключевые кадры */}
              <div className="space-y-2">
                <Label>{t("dialogs.export.keyframes")}</Label>
                <RadioGroup
                  value={settings.keyframeMode || "auto"}
                  onValueChange={(v) => onSettingsChange({ keyframeMode: v as "auto" | "every" })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="kf-auto" />
                    <Label htmlFor="kf-auto" className="font-normal">
                      {t("dialogs.export.auto")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="every" id="kf-every" />
                    <Label htmlFor="kf-every" className="font-normal">
                      {t("dialogs.export.every")}
                    </Label>
                    <Input
                      type="number"
                      value={settings.keyframeInterval || 30}
                      onChange={(e) => onSettingsChange({ keyframeInterval: Number.parseInt(e.target.value) })}
                      className="w-16"
                      disabled={settings.keyframeMode === "auto"}
                    />
                    <span className="text-sm">{t("dialogs.export.frames")}</span>
                  </div>
                </RadioGroup>
              </div>

              {/* Чекбоксы */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>{t("dialogs.export.enableGPUEncoding")}</Label>
                    <Info className="text-muted-foreground h-4 w-4" />
                  </div>
                  <Switch
                    checked={settings.enableGPU}
                    onCheckedChange={(checked) => onSettingsChange({ enableGPU: checked })}
                    disabled={isRendering}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>{t("dialogs.export.optimizeForSpeed")}</Label>
                  <Switch
                    checked={settings.optimizeForSpeed}
                    onCheckedChange={(checked) => onSettingsChange({ optimizeForSpeed: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>{t("dialogs.export.optimizeForNetwork")}</Label>
                  <Switch
                    checked={settings.optimizeForNetwork}
                    onCheckedChange={(checked) => onSettingsChange({ optimizeForNetwork: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>{t("dialogs.export.multipassEncoding")}</Label>
                  <Switch
                    checked={settings.multipassEncoding}
                    onCheckedChange={(checked) => onSettingsChange({ multipassEncoding: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>{t("dialogs.export.frameReordering")}</Label>
                  <Switch
                    checked={settings.frameReordering ?? true}
                    onCheckedChange={(checked) => onSettingsChange({ frameReordering: checked })}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

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
                  <Button variant="outline" onClick={onCancelExport} className="flex-1">
                    {t("dialogs.export.cancel")}
                  </Button>
                  <Button disabled className="flex-1">
                    {t("dialogs.export.rendering")}...
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    {t("dialogs.export.close")}
                  </Button>
                  <Button
                    onClick={onExport}
                    disabled={!settings.savePath || !hasProject}
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
    </div>
  )
}
