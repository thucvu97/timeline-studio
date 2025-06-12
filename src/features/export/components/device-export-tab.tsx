import { useEffect } from "react"

import { Folder, Info } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import { CODEC_OPTIONS, DEVICE_PRESETS, RESOLUTION_PRESETS } from "../constants/export-constants"
import { DeviceExportSettings } from "../types/export-types"

interface DeviceExportTabProps {
  settings: DeviceExportSettings
  onSettingsChange: (updates: Partial<DeviceExportSettings>) => void
  onChooseFolder: () => void
  isRendering: boolean
}

export function DeviceExportTab({ settings, onSettingsChange, onChooseFolder, isRendering }: DeviceExportTabProps) {
  const { t } = useTranslation()

  // Обновляем настройки при смене устройства
  useEffect(() => {
    const devicePreset = DEVICE_PRESETS[settings.device]
    if (devicePreset) {
      onSettingsChange({
        resolution: devicePreset.defaultResolution as any,
        frameRate: devicePreset.defaultFps.toString(),
        codec: devicePreset.defaultCodec as any,
      })
    }
  }, [settings.device])

  const currentDevicePreset = DEVICE_PRESETS[settings.device]

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
          <Label>{t("dialogs.export.titles")}</Label>
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
            <Select
              value={settings.device}
              onValueChange={(value) => onSettingsChange({ device: value as any })}
              disabled={isRendering}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DEVICE_PRESETS).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>
                    {t(`dialogs.export.device_types.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                {Object.entries(RESOLUTION_PRESETS)
                  .filter(([key]) => {
                    // Фильтруем разрешения в зависимости от устройства
                    if (settings.device === "iphone" || settings.device === "android") {
                      return key !== "4k" // Мобильные устройства не поддерживают 4K
                    }
                    return true
                  })
                  .map(([key, preset]) => (
                    <SelectItem key={key} value={key}>
                      {preset.width}x{preset.height}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("dialogs.export.codec")}</Label>
          <Select
            value={settings.codec}
            onValueChange={(value) => onSettingsChange({ codec: value as any })}
            disabled={isRendering}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CODEC_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {currentDevicePreset.defaultFps} {t("dialogs.export.fps")}
            </span>
            <span className="mx-2 text-sm">•</span>
            <span className="text-sm">
              {currentDevicePreset.defaultBitrate} {t("dialogs.export.kbps")}
            </span>
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
            <Switch
              checked={settings.advancedCompression}
              onCheckedChange={(checked) => onSettingsChange({ advancedCompression: checked })}
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
      </div>
    </div>
  )
}
