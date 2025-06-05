import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"

export function SpeedSettings() {
  const { t } = useTranslation()

  const PLAYBACK_SPEED_OPTIONS = [
    { value: "0.25", label: t("options.speed.speeds.0_25", "0.25x (Very slow)") },
    { value: "0.5", label: t("options.speed.speeds.0_5", "0.5x (Slow)") },
    { value: "0.75", label: t("options.speed.speeds.0_75", "0.75x (Slightly slow)") },
    { value: "1", label: t("options.speed.speeds.1", "1x (Normal)") },
    { value: "1.25", label: t("options.speed.speeds.1_25", "1.25x (Slightly fast)") },
    { value: "1.5", label: t("options.speed.speeds.1_5", "1.5x (Fast)") },
    { value: "2", label: t("options.speed.speeds.2", "2x (Very fast)") },
    { value: "custom", label: t("options.speed.speeds.custom", "Custom") },
  ]

  const INTERPOLATION_OPTIONS = [
    { value: "none", label: t("options.speed.interpolation.none", "No interpolation") },
    { value: "linear", label: t("options.speed.interpolation.linear", "Linear") },
    { value: "cubic", label: t("options.speed.interpolation.cubic", "Cubic") },
    { value: "lanczos", label: t("options.speed.interpolation.lanczos", "Lanczos") },
  ]

  const MOTION_BLUR_OPTIONS = [
    { value: "none", label: t("options.speed.motionBlur.none", "Off") },
    { value: "low", label: t("options.speed.motionBlur.low", "Low") },
    { value: "medium", label: t("options.speed.motionBlur.medium", "Medium") },
    { value: "high", label: t("options.speed.motionBlur.high", "High") },
  ]

  return (
    <div className="space-y-6" data-testid="speed-settings">
      <div>
        {/* Скорость воспроизведения по умолчанию */}
        <div className="space-y-2">
          <Label>{t("options.speed.defaultPlayback", "Скорость воспроизведения по умолчанию")}</Label>
          <Select defaultValue="1">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLAYBACK_SPEED_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Пользовательская скорость */}
        <div className="space-y-2">
          <Label>{t("options.speed.customSpeed", "Пользовательская скорость")}</Label>
          <div className="flex items-center space-x-2">
            <Input type="number" defaultValue="1.0" min="0.1" max="10" step="0.1" className="w-24" />
            <span className="text-sm text-muted-foreground">x</span>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Настройки замедления/ускорения */}
        <div className="space-y-4">
          <h3 className="text-md font-medium">{t("options.speed.speedChange", "Настройки изменения скорости")}</h3>

          {/* Интерполяция кадров */}
          <div className="space-y-2">
            <Label>{t("options.speed.interpolation", "Интерполяция кадров")}</Label>
            <Select defaultValue="cubic">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERPOLATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Motion Blur */}
          <div className="space-y-2">
            <Label>{t("options.speed.motionBlur", "Размытие движения")}</Label>
            <Select defaultValue="medium">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOTION_BLUR_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Smooth playback */}
        <div className="space-y-4">
          <h3 className="text-md font-medium">{t("options.speed.smoothPlayback", "Плавное воспроизведение")}</h3>

          <div className="flex items-center space-x-2">
            <Checkbox id="enable-smooth" defaultChecked />
            <Label htmlFor="enable-smooth">{t("options.speed.enableSmooth", "Включить плавное воспроизведение")}</Label>
          </div>

          <div className="space-y-2">
            <Label>{t("options.speed.smoothness", "Уровень сглаживания")}</Label>
            <div className="space-y-2">
              <Slider defaultValue={[50]} max={100} step={1} className="w-full" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t("options.speed.performance", "Производительность")}</span>
                <span>{t("options.speed.quality", "Качество")}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Дополнительные настройки */}
        <div className="space-y-4">
          <h3 className="text-md font-medium">{t("options.speed.advanced", "Дополнительные настройки")}</h3>

          <div className="flex items-center space-x-2">
            <Checkbox id="preserve-pitch" defaultChecked />
            <Label htmlFor="preserve-pitch">
              {t("options.speed.preservePitch", "Сохранять тональность при изменении скорости")}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="auto-keyframes" />
            <Label htmlFor="auto-keyframes">{t("options.speed.autoKeyframes", "Автоматические ключевые кадры")}</Label>
          </div>

          <div className="space-y-2">
            <Label>{t("options.speed.maxSpeed", "Максимальная скорость")}</Label>
            <Input type="number" defaultValue="10" min="1" max="100" step="1" />
          </div>
        </div>

        <Separator className="my-6" />

        {/* Кнопки действий */}
        <div className="flex gap-2">
          <Button variant="outline">{t("common.reset", "Сбросить")}</Button>
          <Button>{t("common.apply", "Применить")}</Button>
        </div>
      </div>
    </div>
  )
}
