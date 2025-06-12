import { Folder, Info } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import { FORMAT_OPTIONS, FRAME_RATE_OPTIONS, QUALITY_PRESETS, RESOLUTION_PRESETS } from "../constants/export-constants"
import { ExportProgress, ExportSettings } from "../types/export-types"

interface LocalExportTabProps {
  settings: ExportSettings
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

  return (
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
              {Object.entries(QUALITY_PRESETS).map(([key, preset]) => (
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

        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>{t("dialogs.export.advancedCompression")}</Label>
              <Info className="text-muted-foreground h-4 w-4" />
            </div>
            <Switch
              checked={settings.advancedCompression}
              onCheckedChange={(checked) => onSettingsChange({ advancedCompression: checked })}
              disabled={isRendering}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>{t("dialogs.export.cloudBackup")}</Label>
              <Info className="text-muted-foreground h-4 w-4" />
            </div>
            <Switch
              checked={settings.cloudBackup}
              onCheckedChange={(checked) => onSettingsChange({ cloudBackup: checked })}
              disabled={isRendering}
            />
          </div>

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
  )
}
